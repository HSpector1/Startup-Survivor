// Tests for the 2026-11-14 improvements: business grade, answer history, learning review, decision review,
// glossary search, abbreviation expansion and the calculator's question key.
import { describe, expect, it } from 'vitest';
import { availability, runGame, type Choices, type GameInput, type Rescue } from '../../src/engine/sim';
import { incomeStatement } from '../../src/engine/ledger';
import { ROUND_IDS, type OptionId, type RoundId } from '../../src/engine/model';
import { RUBRIC, gradeBusiness, letterFor } from '../../src/engine/business';
import { EMPTY_RECORD, points, recordAttempt, type MasteryRecord } from '../../src/engine/scoring';
import { MATERIAL_GAIN, TOPICS, areasToImprove, businessStory, decisionReview, missedAnswers, studyReviewText } from '../../src/content/review';
import { GLOSSARY, glossaryFor, searchGlossary } from '../../src/content/reference';
import { expandFirstUse, formulaOf, roundById, roundText } from '../../src/content/rounds';
import { newSave, questionKey, restartChapter, validateSave } from '../../src/state';

const path = (s: string): Choices => Object.fromEntries([...s].map((o, i) => [ROUND_IDS[i], o as OptionId]));
const REF = 'ABBCCACCCCAACCCCCCAAAACBB';
const AGGRESSIVE = 'CCBAABABABBBAAABABCACBAAC';
const CONSTRAINED = 'CAABCACAACAACCBCACBCAABCB';

const perfect = (): Partial<Record<RoundId, MasteryRecord>> =>
  Object.fromEntries(ROUND_IDS.map((r) => [r, { attempts: 1, hint: false, revealed: false, correct: true, answers: [{ value: roundById(r).mastery_check.answer }] }]));

describe('business performance grade', () => {
  it('rates the validator reference path C (57.2) from its real ledger', () => {
    const g = runGame({ choices: path(REF) });
    const b = gradeBusiness(g);
    expect(b.metrics.cumulativeOperatingIncome).toBe(331_510); // 1,635 + 975 − 799.90 + 1,505
    expect(b.metrics.monthlyOperatingIncome).toEqual([163_500, 97_500, -79_990, 150_500]);
    expect(b.metrics.organicCashMonth4).toBe(1_391_510); // validator: Month 4 cash $13,915.10
    expect(b.metrics.profitableMonths).toBe(3);
    expect(b.score).toBe(57.2);
    expect(b.letter).toBe('C');
    expect(b.title).toBe('Surviving Startup');
  });

  it('rates the aggressive expansion path A', () => {
    expect(gradeBusiness(runGame({ choices: path(AGGRESSIVE) })).letter).toBe('A');
  });

  it('caps a rescued business and never counts rescue cash as liquidity', () => {
    for (const kind of ['equity', 'loan'] as Rescue[]) {
      const b = gradeBusiness(runGame({ choices: path(CONSTRAINED), rescues: { 4: kind } }));
      expect(b.metrics.rescues).toHaveLength(1);
      expect(b.metrics.organicCashMonth4).toBeLessThan(0);
      expect(b.dimensions.find((d) => d.key === 'liquidity')!.points).toBe(0);
      expect(['C', 'D', 'F']).toContain(b.letter);
      expect(b.letter).toBe('F');
    }
  });

  it('ignores start-of-Month-5 financing and investing: every R24/R25 combination grades the same', () => {
    const base = path(REF);
    const scores = new Set<number>();
    let combos = 0;
    for (const r24 of ['A', 'B', 'C'] as OptionId[]) for (const r25 of ['A', 'B', 'C'] as OptionId[]) {
      const choices = { ...base, R24: r24, R25: r25 };
      if (!availability({ choices }, 'R24')[r24].ok || !availability({ choices }, 'R25')[r25].ok) continue;
      try { scores.add(gradeBusiness(runGame({ choices })).score); combos++; } catch { /* combination unaffordable after R24 */ }
    }
    expect(combos).toBeGreaterThanOrEqual(4);
    expect(scores.size).toBe(1);
  });

  it('does not deduct for mastery a second time: equal ledgers grade equally whatever the record says', () => {
    const g = runGame({ choices: path(REF) });
    // gradeBusiness takes only the game state; mastery reaches it solely through actual demand (audit A24).
    expect(gradeBusiness.length).toBe(1);
    const lower = runGame({ choices: path(REF), execution: { 1: 0.9, 2: 0.9, 3: 0.9, 4: 0.9 } });
    expect(gradeBusiness(lower).score).toBeLessThan(gradeBusiness(g).score);
  });

  it('never changes the ledger it reads', () => {
    const g = runGame({ choices: path(REF) });
    const before = JSON.stringify(g);
    gradeBusiness(g);
    businessStory(gradeBusiness(g), g, true);
    expect(JSON.stringify(g)).toBe(before);
  });

  it('uses the documented cutoffs', () => {
    expect(letterFor(RUBRIC.cutoffs.A)).toBe('A');
    expect(letterFor(RUBRIC.cutoffs.A - 0.1)).toBe('B');
    expect(letterFor(RUBRIC.cutoffs.B)).toBe('B');
    expect(letterFor(RUBRIC.cutoffs.C)).toBe('C');
    expect(letterFor(RUBRIC.cutoffs.D)).toBe('D');
    expect(letterFor(RUBRIC.cutoffs.D - 0.1)).toBe('F');
  });

  it('spreads randomized legal games across the letters (no automatic A, no universal failure)', () => {
    let seed = 12345;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const count: Record<string, number> = {};
    for (let n = 0; n < 120; n++) {
      const input: GameInput = { choices: {}, rescues: {} };
      for (const r of ROUND_IDS) {
        const ok = (['A', 'B', 'C'] as OptionId[]).filter((o) => availability(input, r)[o].ok);
        input.choices[r] = ok[Math.floor(rnd() * ok.length)];
        const g = runGame(input);
        if (g.pendingRescue) input.rescues![g.pendingRescue.month] = 'equity';
      }
      const l = gradeBusiness(runGame(input)).letter;
      count[l] = (count[l] ?? 0) + 1;
    }
    expect(Object.keys(count).length).toBeGreaterThanOrEqual(4);
    expect((count.A ?? 0) / 120).toBeLessThan(0.45);
    expect(((count.A ?? 0) + (count.B ?? 0)) / 120).toBeGreaterThan(0.3);
  });

  it('writes a narrative and lessons from the real numbers', () => {
    const g = runGame({ choices: path(REF) });
    const s = businessStory(gradeBusiness(g), g, true);
    expect(s.narrative).toContain('$130.00 below Month 1');
    expect(s.lessons.length).toBeGreaterThanOrEqual(1);
    expect(s.badges.find((b) => b.name === 'Self-Funded')!.earned).toBe(true);
    expect(s.badges.find((b) => b.name === 'Four for Four')!.earned).toBe(false);
  });
});

describe('answer history in mastery records', () => {
  it('keeps every graded answer without changing the points rules', () => {
    let r = recordAttempt(EMPTY_RECORD, { value: 12 }, false);
    r = recordAttempt(r, { value: 7 }, true);
    expect(r).toMatchObject({ attempts: 2, correct: true, answers: [{ value: 12 }, { value: 7 }] });
    expect(points(r)).toBe(2);
    expect(points(recordAttempt(EMPTY_RECORD, { value: 7 }, true))).toBe(4);
  });

  it('does not invent a list for an older record that already had attempts', () => {
    const old: MasteryRecord = { attempts: 1, hint: false, revealed: false, correct: false };
    expect(recordAttempt(old, { value: 7 }, true).answers).toBeUndefined();
  });

  it('accepts saves made before answer history existed', () => {
    const s = newSave('Old Cart');
    const legacy = { ...s, choices: { R01: 'A' }, mastery: { R01: { attempts: 2, hint: false, revealed: false, correct: true } } };
    expect(validateSave(JSON.parse(JSON.stringify(legacy))).mastery.R01!.answers).toBeUndefined();
  });

  it('restarting a chapter drops the attempts made since the checkpoint', () => {
    const s = newSave('Restart Cart');
    const snap = { choices: path(REF.slice(0, 5)), rescues: {}, mastery: { R05: { ...EMPTY_RECORD, attempts: 1, correct: true, answers: [{ value: 1058 }] } } };
    const later = { ...s, checkpoints: { ...s.checkpoints, 2: snap }, choices: path(REF.slice(0, 7)),
      mastery: { ...snap.mastery, R06: recordAttempt(recordAttempt(EMPTY_RECORD, { value: 6.25 }, false), { value: 6.625 }, true) } };
    const back = restartChapter(later);
    expect(back.mastery.R06).toBeUndefined();
    expect(back.view).toEqual({ kind: 'round', round: 'R06' });
    expect(missedAnswers(back.mastery)).toEqual([]);
  });
});

describe('missed answers and areas to improve', () => {
  it('a perfect run has nothing to review and no manufactured weak areas', () => {
    expect(missedAnswers(perfect())).toEqual([]);
    expect(areasToImprove(perfect())).toEqual([]);
    expect(studyReviewText('Ace', perfect(), [])).toContain('correct on the first try');
  });

  it('lists wrong-then-right, hint and revealed answers with diagnoses and F/U notation', () => {
    const m = perfect();
    m.R03 = recordAttempt(recordAttempt(EMPTY_RECORD, { value: 12 }, false), { value: 7 }, true);
    m.R04 = { ...recordAttempt({ ...EMPTY_RECORD, hint: true }, { value: 843 }, true) };
    m.R16 = { ...recordAttempt(recordAttempt(EMPTY_RECORD, { value: 1584, label: 'U' }, false), { value: 924, label: 'F' }, false), revealed: true };
    const items = missedAnswers(m);
    expect(items.map((i) => i.round)).toEqual(['R03', 'R04', 'R16']);
    const [r03, r04, r16] = items;
    expect(r03.status).toBe('retry');
    expect(r03.wrongAnswers).toEqual([{ text: '$12', diagnosis: expect.stringContaining('$5 variable cost') }]);
    expect(r04.status).toBe('hint');
    expect(r04.wrongAnswers).toEqual([]);
    expect(r16.status).toBe('revealed');
    expect(r16.points).toBe(0);
    expect(r16.correctAnswer).toBe('$924.00 U');
    expect(r16.wrongAnswers!.map((w) => w.text)).toEqual(['$1,584 U', '$924 F']);
    expect(r16.wrongAnswers![1].diagnosis).toMatch(/direction/);
    expect(r16.glossaryTerm).toBeTruthy();
  });

  it('says when an older save never recorded the answer values', () => {
    const m = perfect();
    m.R10 = { attempts: 3, hint: false, revealed: false, correct: true };
    const [item] = missedAnswers(m);
    expect(item.wrongAnswers).toBeNull();
    expect(studyReviewText('Old', m, [])).toContain('were not recorded');
  });

  it('ranks several weaknesses by the share of points lost, at most three', () => {
    const m = perfect();
    for (const r of ['R16', 'R17', 'R18'] as RoundId[]) m[r] = { attempts: 2, hint: false, revealed: true, correct: false, answers: [{ value: 1 }, { value: 2 }] };
    m.R23 = { attempts: 2, hint: false, revealed: false, correct: true, answers: [{ value: 750 }, { value: 437 }] };
    m.R03 = { attempts: 2, hint: false, revealed: false, correct: true, answers: [{ value: 12 }, { value: 7 }] };
    m.R13 = { attempts: 1, hint: true, revealed: false, correct: true, answers: [{ value: 1.6 }] };
    const areas = areasToImprove(m);
    expect(areas.map((a) => a.topic.id)).toEqual(['variance', 'npv', 'cm']);
    expect(areas[0]).toMatchObject({ earned: 8, max: 20 });
  });

  it('puts every core round in exactly one subject', () => {
    const all = TOPICS.flatMap((t) => t.rounds).sort();
    expect(all).toEqual([...ROUND_IDS].sort());
    for (const t of TOPICS) expect(GLOSSARY.some((g) => g.term === t.glossary)).toBe(true);
  });
});

describe('business decisions to reconsider (simulation)', () => {
  it('reports only material gains that a direct replay confirms, and leaves the real game alone', () => {
    const input: GameInput = { choices: path(REF) };
    const actual = runGame(input);
    const snapshot = JSON.stringify(actual);
    const insights = decisionReview(input, actual);
    expect(insights.length).toBeGreaterThan(0);
    expect(insights.length).toBeLessThanOrEqual(3);
    for (const d of insights) {
      expect(ROUND_IDS.indexOf(d.round)).toBeLessThan(23); // never R24/R25
      const replay = runGame({ choices: { ...input.choices, [d.round]: d.alt } });
      const oi = incomeStatement(replay.journal.filter((e) => e.period >= 1 && e.period <= 4)).operatingIncome;
      expect(oi).toBe(d.altOI);
      expect(d.altOI - d.actualOI).toBeGreaterThanOrEqual(MATERIAL_GAIN);
      expect(d.summary).toContain('simulation');
    }
    expect(JSON.stringify(actual)).toBe(snapshot);
  });

  it('keeps the player\'s mastery factor in every replay', () => {
    const input: GameInput = { choices: path(REF), execution: { 1: 0.9, 2: 1, 3: 0.75, 4: 1 } };
    for (const d of decisionReview(input, runGame(input))) {
      const replay = runGame({ ...input, choices: { ...input.choices, [d.round]: d.alt } });
      expect(incomeStatement(replay.journal.filter((e) => e.period >= 1 && e.period <= 4)).operatingIncome).toBe(d.altOI);
    }
  });
});

describe('glossary coverage and search', () => {
  const top = (q: string) => searchGlossary(q)[0]?.term;
  it('finds the terms players asked about by name or abbreviation', () => {
    expect(top('ABC')).toMatch(/Activity-based costing/);
    expect(top('activity-based costing')).toMatch(/Activity-based costing/);
    expect(top('NPV')).toMatch(/Net present value/);
    expect(top('net present value')).toMatch(/Net present value/);
    expect(top('CVP')).toMatch(/Cost-volume-profit/);
    expect(top('cost-volume-profit')).toMatch(/Cost-volume-profit/);
    expect(top('contribution margin')).toMatch(/Contribution margin/);
    expect(searchGlossary('fixed and variable costs').map((g) => g.term)).toEqual(expect.arrayContaining(['Fixed cost', 'Variable cost']));
    expect(top('relevant cost')).toBe('Relevant cost');
    expect(top('favorable')).toMatch(/favorable and unfavorable/);
    expect(top('unfavorable variance')).toMatch(/favorable and unfavorable/);
  });

  it('explains APV as the Round 17 materials price variance, not NPV', () => {
    const apv = searchGlossary('APV')[0];
    expect(apv.term).toBe('Materials price and quantity variances');
    expect(apv.definition).toMatch(/APV is short for the materials price variance/);
    expect(apv.definition).toMatch(/not NPV/);
    expect(formulaOf(roundById('R17'))).not.toMatch(/^APV/);
    expect(formulaOf(roundById('R17'))).toMatch(/Materials price variance/);
  });

  it('links rounds to their most specific term', () => {
    expect(glossaryFor('R17')?.term).toBe('Materials price and quantity variances');
    expect(glossaryFor('R13')?.term).toMatch(/Activity-based costing/);
  });
});

describe('abbreviations spelled out at first use', () => {
  it('expands once per round, in reading order', () => {
    expect(expandFirstUse(['An ABC lesson', 'ABC again'])).toEqual(['An activity-based costing (ABC) lesson', 'ABC again']);
    expect(expandFirstUse(['net present value (NPV)'])).toEqual(['net present value (NPV)']);
    const r13 = roundText(roundById('R13'));
    expect(`${r13.modules} ${r13.objective} ${r13.scenario} ${r13.prompt}`).toContain('activity-based costing (ABC)');
    expect(r13.prompt).toContain('ABC overhead');
  });
});

describe('calculator question key', () => {
  it('changes between questions and runs, never on a screen without a question', () => {
    expect(questionKey('career', 1, 'R04')).toBe(questionKey('career', 1, 'R04'));
    expect(questionKey('career', 1, 'R04')).not.toBe(questionKey('career', 1, 'R05'));
    expect(questionKey('career', 1, 'R04')).not.toBe(questionKey('career', 2, 'R04'));
    expect(questionKey('quick', 1, '0:R04')).not.toBe(questionKey('career', 1, '0:R04'));
    expect(questionKey('career', 1, undefined)).toBeUndefined();
  });
});
