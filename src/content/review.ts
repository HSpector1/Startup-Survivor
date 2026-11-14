// End-of-game learning review: missed answers, areas to improve, business decisions to reconsider, and the
// business-grade story. Everything here reads the save and the replayed ledger; nothing writes to either.
import { ChoiceError, runGame, type GameInput, type GameState } from '../engine/sim';
import { incomeStatement } from '../engine/ledger';
import { ROUND_IDS, type OptionId, type RoundId } from '../engine/model';
import { fmt, type Cents } from '../engine/money';
import { grade, points, type Attempt, type MasteryRecord } from '../engine/scoring';
import type { BusinessGrade, Dimension } from '../engine/business';
import { OVERLAY, answerTextOf, formulaOf, promptOf, roundById, workedOf } from './rounds';
import { glossaryFor } from './reference';

// ---------------------------------------------------------------- topics

export interface Topic {
  id: string; name: string; rounds: RoundId[];
  review: string; formula: string; example: string; practice: string;
  /** Glossary term to open for this topic. */
  glossary: string;
}

/** Every core round belongs to exactly one topic (tests/engine/review.test.ts checks this). */
export const TOPICS: Topic[] = [
  {
    id: 'cm', name: 'Cost behavior and contribution margin', rounds: ['R02', 'R03', 'R06', 'R07', 'R08', 'R11'],
    review: 'Sort every cost by how it behaves: variable costs move with each meal, fixed costs stay flat within the relevant range, and mixed costs have both parts. Contribution margin is what each sale leaves after its variable costs to cover fixed costs and profit.',
    formula: 'Unit CM = Price − Variable cost per unit; weighted CM = Σ (mix share × unit CM)',
    example: 'A $12 bowl with $5 of variable cost earns $7. With 75% bowls and 25% wraps at $5.50, weighted CM = 0.75 × $7 + 0.25 × $5.50 = $6.625.',
    practice: 'Redo Rounds 3, 6 and 7 by hand: list every variable cost per unit first, then subtract from price. Watch for commissions and discounts that hide inside price.',
    glossary: 'Contribution margin and CM ratio',
  },
  {
    id: 'cvp', name: 'Break-even and cost-volume-profit analysis', rounds: ['R04', 'R05'],
    review: 'Break-even is the volume where contribution margin exactly covers fixed costs. A profit target adds the target to fixed costs. Always round units up: a fraction of a meal cannot be sold.',
    formula: 'Break-even units = Fixed costs ÷ Unit CM; Target units = (Fixed costs + Target profit) ÷ Unit CM',
    example: '$5,900 ÷ $7 = 842.86, so 843 bowls. To earn $1,500: ($5,900 + $1,500) ÷ $7 = 1,057.14, so 1,058 bowls.',
    practice: 'Change one input at a time (price, variable cost, fixed cost) and recompute break-even, so you see which lever moves it most.',
    glossary: 'Cost-volume-profit (CVP) analysis',
  },
  {
    id: 'relevant', name: 'Relevant costs and managerial decisions', rounds: ['R09', 'R10', 'R12', 'R13', 'R14', 'R20'],
    review: 'Only future costs and revenues that differ between the options matter. Sunk costs and allocated common costs that continue either way do not. Count lost contribution (cannibalized or displaced sales) as a cost of the new option.',
    formula: 'Incremental profit = Incremental CM − Incremental fixed costs − Contribution given up',
    example: 'Dropping wraps loses $2,200 of CM but saves only $300 of avoidable fixed cost: income falls $1,900, whatever the allocated overhead says.',
    practice: 'For Rounds 10, 12 and 20, write two columns, "changes" and "does not change", before computing anything.',
    glossary: 'Relevant cost',
  },
  {
    id: 'variance', name: 'Budgeting and variance analysis', rounds: ['R15', 'R16', 'R17', 'R18', 'R19'],
    review: 'Flex the budget to actual volume first. Volume variances explain selling more or fewer units; price and quantity (or rate and efficiency) variances explain spending at the actual volume. Label each variance F if it raised income above the benchmark and U if it lowered it.',
    formula: 'Price variance = (AP − SP) × AQ; quantity variance = (AQ − SQ allowed) × SP; flexible-budget variance = Actual − Flexible',
    example: 'Materials: ($1.65 − $1.50) × 1,980 = $297 U and (1,980 − 1,800) × $1.50 = $270 U, total $567 U.',
    practice: 'Rework Rounds 17 and 18 and say out loud which quantity (actual or standard) each variance uses and why, then mark F or U by asking whether income rose or fell.',
    glossary: 'Flexible-budget and sales-volume variances (favorable and unfavorable)',
  },
  {
    id: 'statements', name: 'Financial statements and cash flow', rounds: ['R01', 'R21', 'R22', 'R25'],
    review: 'Revenue is recorded when earned, not when cash arrives. Equipment is an asset that depreciates; owner contributions, loans and distributions are financing, never revenue or expense. Assets always equal liabilities plus equity.',
    formula: 'Assets = Liabilities + Equity; Monthly depreciation = (Cost − Salvage) ÷ Life in months',
    example: 'A $2,400 order delivered on credit adds $2,400 of sales and $2,400 of receivables; cash moves only when the client pays.',
    practice: 'For each Round 21 option, write the journal entry and say what it does to cash, receivables and income.',
    glossary: 'Income statement, balance sheet and cash flow statement',
  },
  {
    id: 'npv', name: 'Capital budgeting and NPV', rounds: ['R23', 'R24'],
    review: 'NPV discounts each future cash flow to today at the hurdle rate and subtracts the investment. Include terminal (resale) value once, in its year. Financing changes cash and debt, not the project\'s NPV.',
    formula: 'NPV = −Investment + Σ CFₜ ÷ (1 + r)ᵗ + Terminal value ÷ (1 + r)ⁿ',
    example: '−$2,400 + $1,050 × (1/1.1 + 1/1.1² + 1/1.1³) + $300 ÷ 1.1³ = +$436.59.',
    practice: 'Use the calculator\'s ^ key to discount each year separately, then check your total against an annuity factor.',
    glossary: 'Net present value (NPV) and hurdle rate',
  },
];

export const topicOf = (r: RoundId) => TOPICS.find((t) => t.rounds.includes(r))!;

// ---------------------------------------------------------------- missed answers

export type MissStatus = 'revealed' | 'hint' | 'retry';

export interface WrongAnswer { text: string; diagnosis?: string }

export interface MissedItem {
  round: RoundId; number: number; title: string; topic: string;
  status: MissStatus; statusText: string; points: number;
  prompt: string;
  /** Wrong answers in the order entered; null when this save never recorded answer values. */
  wrongAnswers: WrongAnswer[] | null;
  /** Attempts made before answer recording existed (older saves continued after the update). */
  unrecordedAttempts: number;
  correctAnswer: string; formula: string; worked: string; concept?: string;
  glossaryTerm?: string;
}

const specOf = (r: RoundId) => {
  const s = roundById(r);
  const ov = OVERLAY[r];
  return { answer: s.mastery_check.answer, tolerance: s.mastery_check.tolerance ?? 0, variance: ov.variance, mistakes: ov.mistakes };
};

export function formatAttempt(r: RoundId, a: Attempt): string {
  const unit = OVERLAY[r].unitLabel;
  const n = unit === '$' ? `${a.value < 0 ? '−' : ''}$${Math.abs(a.value).toLocaleString('en-US', { maximumFractionDigits: 3 })}` : `${a.value.toLocaleString('en-US')} ${unit}`;
  return OVERLAY[r].variance ? `${n} ${a.label ?? '(no F/U marked)'}` : n;
}

/** Does this record show a mistake, a hint or a reveal? */
export const needsReview = (rec: MasteryRecord | undefined) => !!rec && (rec.revealed || !rec.correct || rec.attempts > 1 || rec.hint);

export function missedAnswers(mastery: Partial<Record<RoundId, MasteryRecord>>): MissedItem[] {
  const out: MissedItem[] = [];
  for (const r of ROUND_IDS) {
    const rec = mastery[r];
    if (!rec || !needsReview(rec)) continue;
    const s = roundById(r);
    const spec = specOf(r);
    const recorded = rec.answers;
    const wrong = recorded?.filter((a) => !grade(spec, a).correct).map((a) => ({ text: formatAttempt(r, a), diagnosis: grade(spec, a).message }));
    const status: MissStatus = rec.revealed || !rec.correct ? 'revealed' : rec.hint ? 'hint' : 'retry';
    const tries = `${rec.attempts} ${rec.attempts === 1 ? 'try' : 'tries'}`;
    out.push({
      round: r, number: s.number, title: s.title, topic: topicOf(r).name,
      status, points: points(rec),
      statusText: status === 'revealed' ? `Answer revealed after ${tries}` : status === 'hint' ? `Correct with the hint, ${tries}` : `Correct on try ${rec.attempts}`,
      prompt: promptOf(s),
      wrongAnswers: recorded ? wrong! : null,
      unrecordedAttempts: recorded ? Math.max(0, rec.attempts - recorded.length) : 0,
      correctAnswer: answerTextOf(s), formula: formulaOf(s), worked: workedOf(s),
      concept: s.mastery_check.feedback_for_wrong_answers,
      glossaryTerm: glossaryFor(r)?.term,
    });
  }
  return out;
}

// ---------------------------------------------------------------- areas to improve

export interface TopicResult { topic: Topic; earned: number; max: number; missed: MissedItem[] }

export function topicResults(mastery: Partial<Record<RoundId, MasteryRecord>>): TopicResult[] {
  const missed = missedAnswers(mastery);
  return TOPICS.map((t) => ({
    topic: t,
    earned: t.rounds.reduce((s, r) => s + points(mastery[r]), 0),
    max: t.rounds.length * 4,
    missed: missed.filter((m) => t.rounds.includes(m.round)),
  }));
}

/** Up to three topics with lost points, weakest share first, then most points lost. Empty when every check scored 4. */
export function areasToImprove(mastery: Partial<Record<RoundId, MasteryRecord>>): TopicResult[] {
  return topicResults(mastery).filter((t) => t.earned < t.max)
    .sort((a, b) => a.earned / a.max - b.earned / b.max || (b.max - b.earned) - (a.max - a.earned))
    .slice(0, 3);
}

export function whyIdentified(t: TopicResult): string {
  const parts = t.missed.map((m) => `Round ${m.number} ${m.status === 'revealed' ? 'revealed' : m.status === 'hint' ? 'needed the hint' : `took ${m.statusText.replace('Correct on try ', '')} tries`}`);
  return `You earned ${t.earned} of ${t.max} points here: ${parts.join('; ')}.`;
}

export const ADVANCED_STUDY = [
  'Mastery Lab B1 and B4: allocation that moves cost without creating it, and judging managers only on what they control.',
  'Mastery Lab B2: step costs, where more sales can earn less profit.',
  'Mastery Lab B5: stress-test an NPV and find how far cash flows can fall before it turns negative.',
];

// ---------------------------------------------------------------- business decisions to reconsider

export interface DecisionInsight {
  round: RoundId; number: number; title: string;
  chosen: OptionId; chosenLabel: string; alt: OptionId; altLabel: string;
  actualOI: Cents; altOI: Cents; actualCash: Cents; altCash: Cents;
  actualLost: number; altLost: number;
  actualCM: Cents; altCM: Cents; actualCosts: Cents; altCosts: Cents;
  summary: string; tradeoffs: string[]; lesson: string;
}

/** Smallest Months 1-4 operating-income difference worth showing. */
export const MATERIAL_GAIN: Cents = 50_000;

const fourMonths = (g: GameState) => incomeStatement(g.journal.filter((e) => e.period >= 1 && e.period <= 4));
const lostOf = (g: GameState) => g.closes.reduce((s, c) => s + c.calc.lost, 0);

/**
 * SIMULATION: replay the player's game with one decision (R01-R23) swapped and every other decision, rescue choice
 * and mastery factor kept. Alternatives that would have made a later decision unaffordable or forced a rescue
 * are skipped, because the comparison would no longer be like for like. R24 and R25 are start-of-Month-5
 * financing and investing moves with no Months 1-4 effect, so they are not compared.
 */
export function decisionReview(input: GameInput, actual: GameState): DecisionInsight[] {
  const a = fourMonths(actual);
  const aCash = actual.closes[3].cashAfter - (actual.closes[3].rescue?.amount ?? 0);
  const aLost = lostOf(actual);
  const best = new Map<RoundId, DecisionInsight>();
  for (const r of ROUND_IDS.slice(0, 23)) {
    const chosen = input.choices[r];
    if (!chosen) continue;
    for (const alt of (['A', 'B', 'C'] as OptionId[]).filter((o) => o !== chosen)) {
      let g: GameState;
      try { g = runGame({ ...input, choices: { ...input.choices, [r]: alt } }); } catch (e) {
        if (e instanceof ChoiceError) continue;
        throw e;
      }
      if (g.pendingRescue || g.closes.length < 4 || g.closes.some((c, i) => !!c.rescue && !actual.closes[i]?.rescue)) continue;
      const b = fourMonths(g);
      const gain = b.operatingIncome - a.operatingIncome;
      if (gain < MATERIAL_GAIN || (best.get(r) && best.get(r)!.altOI >= b.operatingIncome)) continue;
      const s = roundById(r);
      const label = (o: OptionId) => s.options.find((x) => x.id === o)!.label;
      const altCash = g.closes[3].cashAfter - (g.closes[3].rescue?.amount ?? 0);
      const costs = (is: ReturnType<typeof incomeStatement>) => is.fixedRecurring + is.oneTime + is.depreciation;
      const tradeoffs: string[] = [];
      const dCM = b.contributionMargin - a.contributionMargin;
      const dCost = costs(b) - costs(a);
      tradeoffs.push(`Contribution margin ${dCM >= 0 ? 'up' : 'down'} ${fmt(Math.abs(dCM))}; fixed, one-time and depreciation costs ${dCost >= 0 ? 'up' : 'down'} ${fmt(Math.abs(dCost))}.`);
      const dCash = altCash - aCash;
      if (dCash <= -10_000) tradeoffs.push(`It would have left ${fmt(-dCash)} less cash at the Month 4 close (${fmt(altCash)} vs ${fmt(aCash)}): your choice kept a bigger cushion, which is a fair reason to accept less profit.`);
      else if (dCash >= 10_000) tradeoffs.push(`It would also have left ${fmt(dCash)} more cash at the Month 4 close.`);
      const lost = lostOf(g);
      if (lost < aLost) tradeoffs.push(`It would have served ${(aLost - lost).toLocaleString('en-US')} more orders that your truck turned away.`);
      if (lost > aLost) tradeoffs.push(`It would have turned away ${(lost - aLost).toLocaleString('en-US')} more orders for lack of capacity.`);
      best.set(r, {
        round: r, number: s.number, title: s.title, chosen, chosenLabel: label(chosen), alt, altLabel: label(alt),
        actualOI: a.operatingIncome, altOI: b.operatingIncome, actualCash: aCash, altCash, actualLost: aLost, altLost: lost,
        actualCM: a.contributionMargin, altCM: b.contributionMargin, actualCosts: costs(a), altCosts: costs(b),
        summary: `You chose ${chosen} (${label(chosen)}). In a simulation with ${alt} (${label(alt)}) and every other decision unchanged, Months 1–4 operating income would have been ${fmt(gain)} higher: ${fmt(b.operatingIncome)} instead of ${fmt(a.operatingIncome)}.`,
        tradeoffs, lesson: OVERLAY[r].coach,
      });
    }
  }
  return [...best.values()].sort((x, y) => (y.altOI - y.actualOI) - (x.altOI - x.actualOI)).slice(0, 3);
}

// ---------------------------------------------------------------- business grade story

export interface Badge { name: string; earned: boolean; why: string }
export interface BusinessStory { narrative: string; lessons: string[]; badges: Badge[] }

const OPENING: Record<BusinessGrade['letter'], string> = {
  A: 'You built a truck that earns money, holds cash and is getting stronger.',
  B: 'You ran a profitable truck and kept it on solid footing.',
  C: 'Your truck made it through four months, but the numbers show real strain.',
  D: 'The truck stayed open, but it struggled to earn its keep.',
  F: 'The truck lost money or needed outside cash to stay open.',
};

const ratio = (d: Dimension) => d.points / d.max;

function costDriver(game: GameState): { label: string; rise: Cents } | undefined {
  const m1 = incomeStatement(game.journal.filter((e) => e.period === 1)).lines;
  const m4 = incomeStatement(game.journal.filter((e) => e.period === 4)).lines;
  const by = (ls: typeof m1) => {
    const out = new Map<string, Cents>();
    for (const l of ls) if (l.cls !== 'variable' && l.cls !== 'nonOperating') out.set(l.label, (out.get(l.label) ?? 0) + l.amount);
    return out;
  };
  const a = by(m1); const b = by(m4);
  let top: { label: string; rise: Cents } | undefined;
  for (const [label, amt] of b) { const rise = amt - (a.get(label) ?? 0); if (rise > 0 && (!top || rise > top.rise)) top = { label, rise }; }
  return top;
}

export function businessStory(b: BusinessGrade, game: GameState, boughtTruck: boolean): BusinessStory {
  const m = b.metrics;
  const four = fourMonths(game);
  const fixedShare = four.contributionMargin > 0 ? (four.fixedRecurring + four.oneTime + four.depreciation) / four.contributionMargin : null;
  const strong: Record<Dimension['key'], string> = {
    profitability: `You earned ${fmt(m.cumulativeOperatingIncome)} of operating income over four months, with ${m.profitableMonths} profitable ${m.profitableMonths === 1 ? 'month' : 'months'}.`,
    liquidity: `You finished Month 4 with ${fmt(m.organicCashMonth4)} in the bank, ${m.coverageMonths.toFixed(1)} months of fixed costs.`,
    trajectory: `Month 4 operating income beat Month 1 by ${fmt(m.trajectory)}.`,
    resilience: `You never needed emergency funding.`,
  };
  const driver = costDriver(game);
  const weak: Record<Dimension['key'], string> = {
    profitability: m.cumulativeOperatingIncome <= 0
      ? `Operating income over Months 1–4 was ${fmt(m.cumulativeOperatingIncome)}: costs outran contribution margin.`
      : `Fixed, one-time and depreciation costs used ${fixedShare === null ? 'all' : `${Math.round(fixedShare * 100)}%`} of your contribution margin, leaving a ${(m.operatingMargin * 100).toFixed(1)}% operating margin.${m.lostOrders ? ` You also turned away ${m.lostOrders.toLocaleString('en-US')} orders for lack of capacity.` : ''}`,
    liquidity: `Cash at the Month 4 close covered only ${m.coverageMonths.toFixed(1)} months of fixed costs; lenders like to see two or more.`,
    trajectory: m.trajectory < 0
      ? `Month 4 operating income was ${fmt(-m.trajectory)} below Month 1.${driver ? ` The biggest cost increase was ${driver.label.toLowerCase()} (+${fmt(driver.rise)} in Month 4 compared with Month 1).` : ''}`
      : `Month 4 operating income rose only ${fmt(m.trajectory)} over Month 1.`,
    resilience: m.rescues.length
      ? `You needed ${m.rescues.map((r) => `a ${fmt(r.amount)} ${r.kind === 'loan' ? 'bridge loan' : 'owner contribution'} at the Month ${r.month} close`).join(' and ')} to keep the doors open.`
      : `Cash fell as low as ${fmt(m.lowestCash)} at one month-end.`,
  };
  const sorted = [...b.dimensions].sort((x, y) => ratio(y) - ratio(x));
  const top = sorted[0];
  const low = sorted[sorted.length - 1];
  const parts = [OPENING[b.letter]];
  if (ratio(top) >= 0.6) parts.push(strong[top.key]);
  if (ratio(low) < 0.8) {
    const w = weak[low.key];
    parts.push(ratio(top) >= 0.6 ? `However, ${w.startsWith('Month') ? w : w[0].toLowerCase() + w.slice(1)}` : w);
  }
  if (b.cap) parts.push(b.cap);

  const LESSON: Record<Dimension['key'], string> = {
    profitability: m.lostOrders > 0
      ? 'When the truck is turning customers away, capacity is the constraint: compare the contribution from the extra meals a capacity move would serve with what it costs each month.'
      : 'Before adding a cost, compare the incremental contribution margin it creates with the incremental fixed cost it adds.',
    liquidity: 'Keep at least two months of fixed costs in cash before buying equipment or taking a distribution.',
    trajectory: 'Track each cost line month over month. A fixed cost that grows faster than contribution margin erodes income even when sales hold.',
    resilience: 'Project the month-end cash balance before committing to a cash-heavy option; a forecast shortfall is cheaper to fix than a rescue.',
  };
  const lessons = sorted.filter((d) => ratio(d) < 0.8).reverse().slice(0, 2).map((d) => LESSON[d.key]);
  if (!lessons.length) lessons.push('Keep the discipline: before each expansion, compare incremental contribution margin with incremental fixed cost and check that cash still covers two months of fixed costs.');

  const badges: Badge[] = [
    { name: 'Four for Four', earned: m.profitableMonths === 4, why: 'Operating income above zero in all four months.' },
    { name: 'Cash Cushion', earned: m.coverageMonths >= 2, why: 'Two or more months of fixed costs in cash at the Month 4 close.' },
    { name: 'Growth Curve', earned: m.trajectory > 0, why: 'Month 4 operating income above Month 1.' },
    { name: 'Self-Funded', earned: m.rescues.length === 0, why: 'No emergency owner contribution or bridge loan.' },
    { name: 'Full Service', earned: m.lostOrders === 0, why: 'Served every order customers placed in Months 1–4.' },
    { name: 'Fleet Builder', earned: boughtTruck, why: 'Bought the positive-NPV second truck (+$3,649.32) while keeping the $2,000 reserve.' },
  ];
  return { narrative: parts.join(' '), lessons, badges };
}

// ---------------------------------------------------------------- plain-text study review

export function studyReviewText(truckName: string, mastery: Partial<Record<RoundId, MasteryRecord>>, decisions: DecisionInsight[]): string {
  const missed = missedAnswers(mastery);
  const areas = areasToImprove(mastery);
  const lines = [`Startup Survivor study review: ${truckName}`];
  if (!missed.length) lines.push('Every knowledge check was correct on the first try without a hint.');
  if (areas.length) {
    lines.push('', 'Areas to improve:');
    for (const t of areas) lines.push(`- ${t.topic.name} (${t.earned}/${t.max} points). ${t.topic.formula}. Practice: ${t.topic.practice}`);
  }
  if (missed.length) {
    lines.push('', 'Missed or assisted questions:');
    for (const m of missed) {
      lines.push(`- Round ${m.number}, ${m.title} (${m.topic}): ${m.statusText}, ${m.points}/4 points. Correct answer: ${m.correctAnswer}.`);
      if (m.wrongAnswers === null) lines.push('  Your earlier answers were not recorded (this save predates answer history).');
      else if (m.wrongAnswers.length) lines.push(`  Your answers: ${m.wrongAnswers.map((w) => w.text).join(', ')}.`);
      lines.push(`  Worked solution: ${m.worked}`);
    }
  }
  if (decisions.length) {
    lines.push('', 'Business decisions to reconsider (simulation, other decisions unchanged):');
    for (const d of decisions) lines.push(`- Round ${d.number}, ${d.title}: ${d.summary} ${d.tradeoffs.join(' ')}`);
  }
  return lines.join('\n');
}
