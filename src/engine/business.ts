// Business Performance rating: a letter grade for how the company did, separate from the accounting-mastery score.
// It reads only the posted journal and the month closes, so it can never change a financial result.
// Rules (audit A26):
// - Every measure uses Months 1-4, the four months every strategy operates. The start-of-Month-5 moves
//   (R24 second truck, R25 distribution or prepaid advertising) are financing and investing choices, so they
//   neither help nor hurt the grade. Month 5 pro forma figures are never used.
// - Profit comes from operating income, so owner capital, loans and rescues (financing) can never count as
//   earnings, and equipment is depreciated rather than expensed.
// - Liquidity is measured at the Month 4 close, before the R24/R25 transactions, using cash the business
//   generated: a rescue's cash is removed first.
// - With "mastery affects sales" on, knowledge-check results already moved actual demand, so there is no
//   second deduction for mastery points.
import { incomeStatement } from './ledger';
import type { GameState } from './sim';
import type { Month } from './model';
import type { Cents } from './money';

export type Letter = 'A' | 'B' | 'C' | 'D' | 'F';

/** Weights and thresholds. Calibration evidence: scripts/calibrate-business-grade.ts and audit A26. */
export const RUBRIC = {
  profitability: { weight: 40, fullAt: 1_200_000, perProfitableMonth: 2.5 },
  liquidity: { weight: 20, fullCoverageMonths: 3.5 },
  trajectory: { weight: 20, worstChange: -200_000, bestChange: 300_000 },
  resilience: { weight: 20, noRescue: 12, cushionFullAt: 1_000_000 },
  /** Minimum composite score per letter. */
  cutoffs: { A: 85, B: 66, C: 50, D: 35 } as Record<Exclude<Letter, 'F'>, number>,
} as const;

export const GRADE_TITLE: Record<Letter, string> = {
  A: 'Food Truck Mogul',
  B: 'Savvy Entrepreneur',
  C: 'Surviving Startup',
  D: 'Struggling Operator',
  F: 'Financial Meltdown',
};

export interface Dimension { key: 'profitability' | 'liquidity' | 'trajectory' | 'resilience'; label: string; points: number; max: number; detail: string }

export interface BusinessMetrics {
  monthlyOperatingIncome: Cents[];
  cumulativeOperatingIncome: Cents;
  netSales: Cents;
  operatingMargin: number;
  profitableMonths: number;
  /** Cash at the Month 4 close, minus any rescue cash. */
  organicCashMonth4: Cents;
  avgMonthlyFixed: Cents;
  coverageMonths: number;
  /** Month 4 operating income minus Month 1 operating income. */
  trajectory: Cents;
  rescues: { month: Month; kind: string; amount: Cents }[];
  /** Lowest month-end cash before any rescue. */
  lowestCash: Cents;
  lostOrders: number;
}

export interface BusinessGrade {
  letter: Letter;
  title: string;
  score: number;
  dimensions: Dimension[];
  metrics: BusinessMetrics;
  /** Why a cap applied, if one did. */
  cap?: string;
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const round1 = (x: number) => Math.round(x * 10) / 10;

export function businessMetrics(game: GameState): BusinessMetrics {
  if (game.closes.length < 4) throw new Error('The business grade needs all four month closes.');
  const months = game.closes.map((c) => incomeStatement(game.journal.filter((e) => e.period === c.month)));
  const four = incomeStatement(game.journal.filter((e) => e.period >= 1 && e.period <= 4));
  const ois = months.map((m) => m.operatingIncome);
  const preRescue = game.closes.map((c) => c.cashAfter - (c.rescue?.amount ?? 0));
  const avgMonthlyFixed = Math.round(game.closes.reduce((s, c) => s + c.calc.fixedTotal, 0) / game.closes.length);
  const organicCashMonth4 = preRescue[3];
  return {
    monthlyOperatingIncome: ois,
    cumulativeOperatingIncome: four.operatingIncome,
    netSales: four.netSales,
    operatingMargin: four.netSales ? four.operatingIncome / four.netSales : 0,
    profitableMonths: ois.filter((x) => x > 0).length,
    organicCashMonth4,
    avgMonthlyFixed,
    coverageMonths: avgMonthlyFixed > 0 ? Math.max(0, organicCashMonth4) / avgMonthlyFixed : 0,
    trajectory: ois[3] - ois[0],
    rescues: game.closes.filter((c) => c.rescue).map((c) => ({ month: c.month, kind: c.rescue!.kind, amount: c.rescue!.amount })),
    lowestCash: Math.min(...preRescue),
    lostOrders: game.closes.reduce((s, c) => s + c.calc.lost, 0),
  };
}

export function letterFor(score: number): Letter {
  const c = RUBRIC.cutoffs;
  return score >= c.A ? 'A' : score >= c.B ? 'B' : score >= c.C ? 'C' : score >= c.D ? 'D' : 'F';
}

const usd = (c: Cents) => `${c < 0 ? '−' : ''}$${Math.round(Math.abs(c) / 100).toLocaleString('en-US')}`;

export function gradeBusiness(game: GameState): BusinessGrade {
  const m = businessMetrics(game);
  const R = RUBRIC;
  const profit = R.profitability.weight - 4 * R.profitability.perProfitableMonth;
  const dimensions: Dimension[] = [
    {
      key: 'profitability', label: 'Profitability', max: R.profitability.weight,
      points: round1(profit * clamp01(m.cumulativeOperatingIncome / R.profitability.fullAt) + R.profitability.perProfitableMonth * m.profitableMonths),
      detail: `${usd(m.cumulativeOperatingIncome)} operating income over Months 1–4 (${(m.operatingMargin * 100).toFixed(1)}% of net sales); ${m.profitableMonths} of 4 months profitable.`,
    },
    {
      key: 'liquidity', label: 'Liquidity', max: R.liquidity.weight,
      points: round1(R.liquidity.weight * clamp01(m.coverageMonths / R.liquidity.fullCoverageMonths)),
      detail: `${usd(m.organicCashMonth4)} cash at the Month 4 close${m.rescues.length ? ' (rescue cash removed)' : ''} covers ${m.coverageMonths.toFixed(1)} months of fixed costs (${usd(m.avgMonthlyFixed)} a month).`,
    },
    {
      key: 'trajectory', label: 'Trajectory', max: R.trajectory.weight,
      points: round1(R.trajectory.weight * clamp01((m.trajectory - R.trajectory.worstChange) / (R.trajectory.bestChange - R.trajectory.worstChange))),
      detail: `Month 4 operating income ${usd(m.monthlyOperatingIncome[3])} vs Month 1 ${usd(m.monthlyOperatingIncome[0])}: ${m.trajectory >= 0 ? 'up' : 'down'} ${usd(Math.abs(m.trajectory))}.`,
    },
    {
      key: 'resilience', label: 'Resilience', max: R.resilience.weight,
      points: round1((m.rescues.length ? 0 : R.resilience.noRescue)
        + (R.resilience.weight - R.resilience.noRescue) * clamp01(m.lowestCash / R.resilience.cushionFullAt)),
      detail: m.rescues.length
        ? `Needed ${m.rescues.length === 1 ? 'an emergency rescue' : `${m.rescues.length} emergency rescues`} (${m.rescues.map((r) => `${usd(r.amount)} ${r.kind === 'loan' ? 'bridge loan' : 'owner contribution'}, Month ${r.month}`).join('; ')}).`
        : `No emergency funding. Lowest month-end cash: ${usd(m.lowestCash)}.`,
    },
  ];
  const score = round1(dimensions.reduce((s, d) => s + d.points, 0));
  let letter = letterFor(score);
  let cap: string | undefined;
  // A company that needed emergency funding cannot rate above C, whatever its other numbers say.
  if (m.rescues.length && (letter === 'A' || letter === 'B')) { letter = 'C'; cap = 'Capped at C because the business needed emergency funding to stay open.'; }
  return { letter, title: GRADE_TITLE[letter], score, dimensions, metrics: m, cap };
}
