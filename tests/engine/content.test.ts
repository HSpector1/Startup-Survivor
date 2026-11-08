// Content inventory checks + independent recomputation of every worked answer.
import { describe, expect, it } from 'vitest';
import { BONUS, OVERLAY, ROUNDS, CHAPTERS } from '../../src/content/rounds';
import { EFFECTS, NEUTRAL, ROUND_IDS, roundPeriod, type Effect } from '../../src/engine/model';
import { grade, points } from '../../src/engine/scoring';
import { amortization, loanPayment, npv } from '../../src/engine/finance';
import { largestRemainder, roundHalfUp } from '../../src/engine/money';

const ceil = Math.ceil;
// Recomputed from first principles; mirrors docs/startup_survivor_validation.py and adds the bonus cases.
const RECOMPUTED: Record<string, number> = {
  R01: 25000 - 12000, R02: Math.min(900 + 0.5 * 1000, 1300), R03: 12 - 5, R04: ceil(5900 / 7), R05: ceil((5900 + 1500) / 7),
  R06: 0.75 * 7 + 0.25 * 5.5, R07: 12 - 5 - 0.25 * 12, R08: 200 * (11 - 5) - 1100 * 1, R09: 120 * (7 - 2), R10: 140 * (11 - 6) - 180,
  R11: 1000 * 0.6, R12: ceil((90 + 180 / 60) / 0.5), R13: (1200 / 60) / 25 + (900 / 450) * 0.4, R14: 180 * 9 - 70 * 7 - 250, R15: 1100 * 7 - 5900,
  R16: (968 - 1100) * 7, R17: (1.65 - 1.5) * 1980 + (1980 - 1800) * 1.5, R18: (22 - 20) * 198 + (198 - 180) * 20, R19: 250 - (900 * 7 - 5900),
  R20: 400 * (10 - 4.5) - 300, R21: 2400 - 1000, R22: 1800 / 36, R23: Math.round(npv(0.1, 2400, [1050, 1050, 1050], 300)),
  R24: Math.round(npv(0.12, 18000, [6500, 6500, 6500, 6500], 3000)), R25: 12000 - 4000,
  B1: (1800 / 100) * 25, B2: 50 * 7 - 400, B3: 0 + 1000 - 720, B4: 0, B5: Math.round(npv(0.12, 18000, [5525, 5525, 5525, 5525], 3000)),
};

describe('round inventory', () => {
  it('has 25 rounds in 5 chapters of 5 with options A/B/C, and 5 bonus cases', () => {
    expect(ROUNDS.map((r) => r.id)).toEqual(ROUND_IDS);
    expect(CHAPTERS.length).toBe(5);
    ROUNDS.forEach((r, i) => {
      expect(r.chapter).toBe(Math.floor(i / 5) + 1);
      expect(r.options.map((o) => o.id)).toEqual(['A', 'B', 'C']);
      expect(new Set(r.options.map((o) => o.label)).size).toBe(3);
      expect(r.objective.length).toBeGreaterThan(10);
      expect(r.mastery_check.feedback_for_wrong_answers!.length).toBeGreaterThan(10);
    });
    expect(BONUS.map((b) => b.id)).toEqual(['B1', 'B2', 'B3', 'B4', 'B5']);
  });

  it('every worked answer matches an independent recomputation within its tolerance', () => {
    for (const r of ROUNDS) expect(Math.abs(Math.abs(RECOMPUTED[r.id]) - Math.abs(r.mastery_check.answer))).toBeLessThanOrEqual((r.mastery_check.tolerance ?? 0) + 1e-9);
    for (const b of BONUS) expect(RECOMPUTED[b.id]).toBe(b.mastery_check.answer);
    // Signed variance answers keep the sign the spec states (negative = unfavorable).
    expect(Math.sign(RECOMPUTED.R16)).toBe(Math.sign(ROUNDS[15].mastery_check.answer));
    expect(Math.sign(RECOMPUTED.R19)).toBe(Math.sign(ROUNDS[18].mastery_check.answer));
  });

  it('finance helpers reproduce the validator fixtures', () => {
    expect(npv(0.1, 2400, [1050, 1050, 1050], 300)).toBeCloseTo(436.58903080390655, 9);
    expect(npv(0.12, 18000, [6500, 6500, 6500, 6500], 3000)).toBeCloseTo(3649.3249882861273, 9);
    expect(npv(0.12, 18000, [5525, 5525, 5525, 5525], 3000)).toBeCloseTo(687.9093753253837, 9);
    expect(loanPayment(10800, 0.09, 60)).toBeCloseTo(224.19023644462186, 9);
    const a = amortization(10800, 0.09, 60, 1);
    expect(a.rows[0].interest).toBeCloseTo(81, 9);
  });

  it('every round has typed effects, a neutral option and an overlay; no effect reaches back into a closed month', () => {
    for (const r of ROUND_IDS) {
      expect(OVERLAY[r].coach.length).toBeGreaterThan(20);
      expect(['A', 'B', 'C']).toContain(NEUTRAL[r]);
      const p = roundPeriod(r);
      const earliest = (e: Effect): number | null => {
        if ('span' in e) return e.span.from;
        if ('month' in e) return e.month;
        if (e.kind === 'wasteRate' || e.kind === 'discontinueWraps') return e.from;
        if (e.kind === 'asset') return e.inService;
        return null;
      };
      for (const o of ['A', 'B', 'C'] as const) for (const e of EFFECTS[r][o]) {
        const m = earliest(e);
        if (m !== null) expect(m).toBeGreaterThanOrEqual(Math.max(p, 1));
      }
    }
  });

  it('overlay mistakes never equal the correct answer', () => {
    for (const r of ROUNDS) for (const m of OVERLAY[r.id].mistakes ?? []) {
      const tol = r.mastery_check.tolerance ?? 0;
      expect(Math.abs(Math.abs(m.value) - Math.abs(r.mastery_check.answer)) > tol).toBe(true);
    }
  });
});

describe('grading', () => {
  const spec = (id: string) => {
    const r = ROUNDS.find((x) => x.id === id)!;
    return { answer: r.mastery_check.answer, tolerance: r.mastery_check.tolerance ?? 0, variance: OVERLAY[r.id].variance, mistakes: OVERLAY[r.id].mistakes };
  };
  it('accepts exact answers and tolerance edges', () => {
    expect(grade(spec('R04'), { value: 843 }).correct).toBe(true);
    expect(grade(spec('R04'), { value: 842 })).toEqual({ correct: false, message: expect.stringMatching(/Round up/) });
    expect(grade(spec('R06'), { value: 6.63 }).correct).toBe(true);
    expect(grade(spec('R06'), { value: 6.62 }).correct).toBe(true);
    expect(grade(spec('R06'), { value: 6.64 }).correct).toBe(false);
    expect(grade(spec('R23'), { value: 436 }).correct).toBe(true);
    expect(grade(spec('R23'), { value: 439 }).correct).toBe(false);
  });
  it('variance questions need amount and F/U', () => {
    expect(grade(spec('R16'), { value: 924, label: 'U' }).correct).toBe(true);
    expect(grade(spec('R16'), { value: -924, label: 'U' }).correct).toBe(true);
    expect(grade(spec('R16'), { value: 924, label: 'F' }).correct).toBe(false);
    expect(grade(spec('R16'), { value: 924 }).message).toMatch(/direction/);
    expect(grade(spec('R16'), { value: 1584, label: 'U' }).message).toMatch(/revenue-based/);
    expect(grade(spec('R17'), { value: 567, label: 'U' }).correct).toBe(true);
    expect(grade(spec('R19'), { value: 150, label: 'U' }).correct).toBe(true);
  });
  it('scores 4 / 2 / 0', () => {
    expect(points({ attempts: 1, hint: false, revealed: false, correct: true })).toBe(4);
    expect(points({ attempts: 1, hint: true, revealed: false, correct: true })).toBe(2);
    expect(points({ attempts: 3, hint: false, revealed: false, correct: true })).toBe(2);
    expect(points({ attempts: 2, hint: false, revealed: true, correct: false })).toBe(0);
  });
});

describe('money helpers', () => {
  it('largest remainder is exact and deterministic', () => {
    expect(largestRemainder(968, [871.2, 96.8])).toEqual([871, 97]);
    expect(largestRemainder(1200, [920, 110, 180])).toEqual([912, 109, 179]);
    expect(largestRemainder(5, [1, 1])).toEqual([3, 2]);
    expect(largestRemainder(0, [0, 0])).toEqual([0, 0]);
  });
  it('rounds half up', () => {
    expect(roundHalfUp(0.5)).toBe(1);
    expect(roundHalfUp(31666.666)).toBe(31667);
    expect(roundHalfUp(-0.5)).toBe(-1);
  });
});

describe('wrong-answer diagnostics name the mistake that produces the value', () => {
  const has = (id: string, v: number) => expect(OVERLAY[id as keyof typeof OVERLAY].mistakes!.some((m) => Math.abs(m.value - v) < 1)).toBe(true);
  it('recomputes each diagnosed value from its stated mistake', () => {
    has('R08', 200 * 7);                                   // $7 margin on new orders, no give-back
    has('R09', 120 * 2);                                   // overtime cost alone
    has('R10', 140 * (11 - 5) - 180);                      // $5 instead of $6 per catered bowl
    has('R12', 180 / 0.5); has('R12', (90 + 180) / 0.5);   // mixer alone; mixer fully expensed
    has('R15', 1100 * 12 - 5900); has('R15', 1100 * 7 - 5700); // skipped variable costs; left out depreciation
    has('R23', -2400 + 3 * 1050 + 300);                    // undiscounted
    has('R23', Math.round(npv(0.1, 2400, [1350, 1350, 1350]))); // resale every year, discounted
    has('R24', Math.round(npv(0.12, 18000, [6500, 6500, 6500, 6500], 3000) + 18000 - 10800)); // loan as investment
    has('R24', Math.round(npv(0.12, 18000, [6500, 6500, 6500, 6500], 3000) + 18000 - 7200));  // down payment as investment
  });
});
