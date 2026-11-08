// Typed, executable effects for all 75 strategic options (R01–R25 × A/B/C).
// Each English "effect" in docs/startup_survivor_round_specs.json is translated here by hand.
// Resolutions of ambiguous rules are logged in docs/IMPLEMENTATION_AUDIT.md (A-numbers in comments).

import type { Cents } from './money';

export type Month = 1 | 2 | 3 | 4;
/** 0 = pre-launch, 1–4 = operating months, 5 = start of Month 5 (post-close). */
export type Period = 0 | 1 | 2 | 3 | 4 | 5;
export type OptionId = 'A' | 'B' | 'C';
export type RoundId =
  | 'R01' | 'R02' | 'R03' | 'R04' | 'R05' | 'R06' | 'R07' | 'R08' | 'R09' | 'R10'
  | 'R11' | 'R12' | 'R13' | 'R14' | 'R15' | 'R16' | 'R17' | 'R18' | 'R19' | 'R20'
  | 'R21' | 'R22' | 'R23' | 'R24' | 'R25';
export const ROUND_IDS: RoundId[] = Array.from({ length: 25 }, (_, i) => `R${String(i + 1).padStart(2, '0')}` as RoundId);

export type ExpenseAccount =
  | 'payroll' | 'rent' | 'utilities' | 'insurance' | 'marketing' | 'training'
  | 'otherOperating' | 'repairs' | 'equipmentRental';

export type UnitCostComponent = 'supplier' | 'sauce' | 'renegotiation' | 'refrigeration' | 'wrapRecipe';
export type MenuItem = 'bowl' | 'wrap' | 'premium';

/** Inclusive month range. */
export interface Span { from: Month; to: Month }
const span = (from: Month, to: Month = 4): Span => ({ from, to });
const only = (m: Month): Span => ({ from: m, to: m });

export type Effect =
  | { kind: 'asset'; id: string; label: string; cost: Cents; salvage: Cents; lifeMonths: number; inService: Period }
  | { kind: 'truckCapacity'; units: number }
  | { kind: 'deposit'; amount: Cents }
  | { kind: 'bowlPrice'; price: Cents; baseDemand: number }
  /** Persistent regular (bowl + wrap) walk-up potential, before price elasticity and weather. */
  | { kind: 'regularDemand'; units: number; span: Span; label: string; wrapMenu?: true; bowlOnly?: true }
  /** Temporary promotion demand added after elasticity and weather (A4). */
  | { kind: 'promoDemand'; units: number; month: Month; target: 'pool' | 'bowl' | 'wrap'; label: string }
  | { kind: 'wrapShare'; share: number; span: Span }
  | { kind: 'discontinueWraps'; from: Month }
  | { kind: 'wrapDemandFactor'; factor: number; span: Span }
  | { kind: 'cannibalize'; bowls: number; span: Span }
  | { kind: 'premium'; units: number; price: Cents; span: Span }
  /** Adds to bowl, wrap and (if active) premium list prices; channel orders follow the bowl price. */
  | { kind: 'priceChange'; delta: Cents; span: Span; includesPremium: boolean }
  /** Multiplies demand of every cohort whose price the same decision raised (A3). */
  | { kind: 'elasticity'; factor: number; span: Span; includesPremium: boolean }
  | { kind: 'walkupDiscount'; amount: Cents; month: Month }
  | { kind: 'channel'; channel: 'app' | 'direct' | 'coupon'; units: number; span: Span; commissionRate?: number; priceDelta?: Cents }
  | { kind: 'catering'; units: number; price: Cents; extraCost: Cents; month: Month }
  | { kind: 'capacity'; units: number; span: Span; label: string }
  | { kind: 'overtime'; units: number; costPerUnit: Cents; month: Month }
  /** Recurring monthly cash expense; negative amounts are explicit reductions (e.g. R16A, R19B, R23 savings). */
  | { kind: 'fixed'; account: ExpenseAccount; amount: Cents; span: Span; label: string; wrapMenu?: true }
  | { kind: 'oneTime'; account: ExpenseAccount; amount: Cents; month: Month; label: string }
  | { kind: 'unitCost'; component: UnitCostComponent; delta: Cents; span: Span; items?: MenuItem[]; label: string }
  /** Waste surcharge per fulfilled meal from `from` onward; the latest round wins (A7). */
  | { kind: 'wasteRate'; cents: Cents; from: Month }
  | { kind: 'locationFee'; perOrder: Cents }
  | { kind: 'corporateOrder'; mode: 'credit' | 'discount' | 'factor' }
  | { kind: 'secondTruck'; financed: boolean }
  | { kind: 'distribution'; amount: Cents }
  | { kind: 'prepaidAdvertising'; amount: Cents }
  /** Availability guard: posted cash before this choice must be at least `amount`. */
  | { kind: 'minCash'; amount: Cents; reason: string }
  | { kind: 'achievement'; id: string };

// ---------- scenario constants (not player choices) ----------
export const OPENING_CAPITAL: Cents = 2_500_000;
export const BASE_RECURRING: { account: ExpenseAccount; amount: Cents; label: string }[] = [
  { account: 'payroll', amount: 360_000, label: 'Base crew payroll' },
  { account: 'utilities', amount: 35_000, label: 'Utilities' },
  { account: 'insurance', amount: 25_000, label: 'Insurance' },
  { account: 'marketing', amount: 20_000, label: 'Base marketing' },
];
export const BASE_UNIT_COST: Record<MenuItem, Cents> = { bowl: 500, wrap: 450, premium: 700 };
export const WRAP_LIST_PRICE: Cents = 1000;
/** Month 3 bad weather: walk-up demand (regular pool + premium) × 0.88 (A2). */
export const WEATHER = { month: 3 as Month, factor: 0.88 };
/** Baseline waste surcharge from Month 3 if no waste decision overrides it. */
export const BASE_WASTE = { from: 3 as Month, cents: 20 };
export const RESERVE_FLOOR: Cents = 200_000;
export const BRIDGE_RATE_MONTHLY = 0.015;
export const SECOND_TRUCK = { cost: 1_800_000, loan: 1_080_000, salvage: 300_000, lifeMonths: 48, apr: 0.09, termMonths: 60 };

const reserve = (need: Cents, what: string): Effect => ({
  kind: 'minCash', amount: need + RESERVE_FLOOR, reason: `${what} keeps at least $2,000 of posted cash in reserve`,
});

export const EFFECTS: Record<RoundId, Record<OptionId, Effect[]>> = {
  R01: {
    A: [{ kind: 'asset', id: 'truck', label: 'Used food truck', cost: 1_200_000, salvage: 0, lifeMonths: 60, inService: 1 }, { kind: 'truckCapacity', units: 1200 }],
    B: [{ kind: 'asset', id: 'truck', label: 'Refurbished food truck', cost: 1_500_000, salvage: 0, lifeMonths: 60, inService: 1 }, { kind: 'truckCapacity', units: 1550 }],
    C: [{ kind: 'asset', id: 'truck', label: 'Premium food truck', cost: 1_900_000, salvage: 0, lifeMonths: 60, inService: 1 }, { kind: 'truckCapacity', units: 2100 }],
  },
  R02: {
    A: [{ kind: 'deposit', amount: 80_000 }, { kind: 'fixed', account: 'rent', amount: 90_000, span: span(1), label: 'Economy site rent' }, { kind: 'locationFee', perOrder: 50 }],
    B: [{ kind: 'deposit', amount: 80_000 }, { kind: 'fixed', account: 'rent', amount: 130_000, span: span(1), label: 'Standard site rent' }],
    C: [{ kind: 'deposit', amount: 80_000 }, { kind: 'fixed', account: 'rent', amount: 190_000, span: span(1), label: 'High-traffic site rent' },
      { kind: 'regularDemand', units: 250, span: span(1), label: 'High-traffic location' }],
  },
  R03: {
    A: [{ kind: 'bowlPrice', price: 1000, baseDemand: 1250 }],
    B: [{ kind: 'bowlPrice', price: 1200, baseDemand: 1100 }],
    C: [{ kind: 'bowlPrice', price: 1400, baseDemand: 850 }],
  },
  R04: {
    A: [{ kind: 'oneTime', account: 'marketing', amount: 25_000, month: 1, label: 'Launch-day publicity' }, { kind: 'promoDemand', units: 130, month: 1, target: 'pool', label: 'Launch-day publicity' }],
    B: [{ kind: 'oneTime', account: 'training', amount: 18_000, month: 1, label: 'Service-speed workshop' }, { kind: 'capacity', units: 100, span: only(1), label: 'Service-speed workshop' }],
    C: [],
  },
  R05: {
    A: [{ kind: 'fixed', account: 'marketing', amount: 30_000, span: span(1), label: 'Growth advertising' }, { kind: 'regularDemand', units: 200, span: span(1), label: 'Growth advertising' }],
    B: [{ kind: 'fixed', account: 'marketing', amount: 15_000, span: span(1), label: 'Moderate advertising' }, { kind: 'regularDemand', units: 120, span: span(1), label: 'Moderate advertising' }],
    C: [],
  },
  R06: {
    A: [{ kind: 'wrapShare', share: 0.1, span: span(1) }],
    B: [{ kind: 'wrapShare', share: 0.25, span: span(1) }, { kind: 'regularDemand', units: 100, span: span(1), label: 'Balanced menu', wrapMenu: true },
      { kind: 'fixed', account: 'otherOperating', amount: 12_000, span: span(1), label: 'Wrap menu support', wrapMenu: true }],
    C: [{ kind: 'wrapShare', share: 0.45, span: span(1) }, { kind: 'regularDemand', units: 180, span: span(1), label: 'Wrap-forward menu', wrapMenu: true },
      { kind: 'fixed', account: 'otherOperating', amount: 20_000, span: span(1), label: 'Wrap menu support', wrapMenu: true }],
  },
  R07: {
    A: [{ kind: 'channel', channel: 'app', units: 180, span: span(1), commissionRate: 0.25 }],
    B: [{ kind: 'channel', channel: 'direct', units: 100, span: span(1) }, { kind: 'fixed', account: 'marketing', amount: 15_000, span: span(1), label: 'Direct-order campaign' }],
    C: [],
  },
  R08: {
    A: [{ kind: 'walkupDiscount', amount: 100, month: 1 }, { kind: 'promoDemand', units: 200, month: 1, target: 'pool', label: 'Blanket $1 discount' }],
    B: [{ kind: 'oneTime', account: 'marketing', amount: 10_000, month: 1, label: 'Targeted coupon campaign' }, { kind: 'channel', channel: 'coupon', units: 120, span: only(1), priceDelta: -100 }],
    C: [],
  },
  R09: {
    A: [{ kind: 'capacity', units: 300, span: span(1), label: 'Part-time employee' }, { kind: 'fixed', account: 'payroll', amount: 65_000, span: span(1), label: 'Part-time employee' }],
    B: [{ kind: 'overtime', units: 180, costPerUnit: 200, month: 1 }],
    C: [],
  },
  R10: {
    A: [{ kind: 'catering', units: 220, price: 900, extraCost: 100, month: 1 }, { kind: 'oneTime', account: 'otherOperating', amount: 18_000, month: 1, label: 'Catering event setup' }],
    B: [{ kind: 'catering', units: 140, price: 1100, extraCost: 100, month: 1 }, { kind: 'oneTime', account: 'otherOperating', amount: 18_000, month: 1, label: 'Catering event setup' }],
    C: [],
  },
  R11: {
    A: [{ kind: 'unitCost', component: 'supplier', delta: 60, span: span(2), label: 'Supplier price shock (absorbed)' }],
    B: [{ kind: 'unitCost', component: 'supplier', delta: 60, span: span(2), label: 'Supplier price shock' },
      { kind: 'priceChange', delta: 100, span: span(2), includesPremium: false }, { kind: 'elasticity', factor: 0.92, span: span(2), includesPremium: false }],
    C: [{ kind: 'unitCost', component: 'supplier', delta: 20, span: span(2), label: 'Replacement supplier surcharge' },
      { kind: 'oneTime', account: 'otherOperating', amount: 24_000, month: 2, label: 'Supplier onboarding fee' }],
  },
  R12: {
    A: [],
    B: [{ kind: 'unitCost', component: 'sauce', delta: -50, span: span(2), label: 'In-house sauce savings' },
      { kind: 'fixed', account: 'payroll', amount: 9_000, span: span(2), label: 'Sauce kitchen labor' },
      { kind: 'asset', id: 'mixer', label: 'Sauce mixer', cost: 18_000, salvage: 0, lifeMonths: 60, inService: 2 },
      reserve(18_000, 'Buying the $180 mixer')],
    C: [{ kind: 'unitCost', component: 'sauce', delta: -25, span: span(2), label: 'Bulk sauce vendor savings' },
      { kind: 'oneTime', account: 'otherOperating', amount: 20_000, month: 2, label: 'Sauce vendor onboarding fee' }],
  },
  R13: {
    A: [{ kind: 'oneTime', account: 'marketing', amount: 10_000, month: 2, label: 'Bowl promotion' }, { kind: 'promoDemand', units: 50, month: 2, target: 'bowl', label: 'Bowl promotion' }],
    B: [{ kind: 'oneTime', account: 'marketing', amount: 10_000, month: 2, label: 'Wrap promotion' }, { kind: 'promoDemand', units: 70, month: 2, target: 'wrap', label: 'Wrap promotion' }],
    C: [],
  },
  R14: {
    A: [{ kind: 'premium', units: 180, price: 1600, span: span(2) }, { kind: 'cannibalize', bowls: 70, span: span(2) },
      { kind: 'oneTime', account: 'marketing', amount: 25_000, month: 2, label: 'Premium bowl launch' }],
    B: [{ kind: 'premium', units: 260, price: 1400, span: span(2) }, { kind: 'cannibalize', bowls: 150, span: span(2) },
      { kind: 'oneTime', account: 'marketing', amount: 25_000, month: 2, label: 'Premium bowl launch' }],
    C: [],
  },
  R15: {
    A: [{ kind: 'fixed', account: 'marketing', amount: 20_000, span: span(3), label: 'Month 3+ advertising' }, { kind: 'regularDemand', units: 130, span: span(3), label: 'Month 3+ advertising' }],
    B: [{ kind: 'oneTime', account: 'training', amount: 40_000, month: 3, label: 'Food-waste training' }, { kind: 'wasteRate', cents: 10, from: 3 }],
    C: [],
  },
  R16: {
    A: [{ kind: 'fixed', account: 'payroll', amount: -40_000, span: only(3), label: 'Shortened crew shifts' }, { kind: 'capacity', units: -100, span: only(3), label: 'Shortened crew shifts' }],
    B: [{ kind: 'oneTime', account: 'marketing', amount: 20_000, month: 3, label: 'Emergency promotion' }, { kind: 'promoDemand', units: 140, month: 3, target: 'pool', label: 'Emergency promotion' }],
    C: [],
  },
  R17: {
    A: [{ kind: 'oneTime', account: 'training', amount: 18_000, month: 3, label: 'Food-prep training' }, { kind: 'wasteRate', cents: 5, from: 3 }],
    B: [{ kind: 'oneTime', account: 'otherOperating', amount: 20_000, month: 3, label: 'Ingredient renegotiation fee' },
      { kind: 'unitCost', component: 'renegotiation', delta: -15, span: span(3), label: 'Renegotiated ingredient price' }],
    C: [],
  },
  R18: {
    A: [{ kind: 'oneTime', account: 'payroll', amount: 45_600, month: 3, label: 'Labor overrun above standard' }, { kind: 'oneTime', account: 'training', amount: 22_000, month: 3, label: 'Shift coaching' }],
    B: [{ kind: 'oneTime', account: 'payroll', amount: 25_600, month: 3, label: 'Labor overrun above standard' }, { kind: 'oneTime', account: 'payroll', amount: 35_000, month: 3, label: 'Experienced floater' }],
    C: [{ kind: 'oneTime', account: 'payroll', amount: 75_600, month: 3, label: 'Labor overrun above standard' }],
  },
  R19: {
    A: [{ kind: 'achievement', id: 'forecast-fixer' }],
    B: [{ kind: 'fixed', account: 'marketing', amount: -15_000, span: span(4), label: 'Permanent marketing cut' }, { kind: 'regularDemand', units: -120, span: span(4), label: 'Permanent marketing cut' }],
    C: [{ kind: 'priceChange', delta: 100, span: span(4), includesPremium: true }, { kind: 'elasticity', factor: 0.92, span: span(4), includesPremium: true }],
  },
  R20: {
    A: [],
    B: [{ kind: 'discontinueWraps', from: 4 }, { kind: 'regularDemand', units: 100, span: span(4), label: 'Replacement bowl prospects', bowlOnly: true }],
    C: [{ kind: 'oneTime', account: 'otherOperating', amount: 18_000, month: 4, label: 'Wrap recipe redesign' },
      { kind: 'unitCost', component: 'wrapRecipe', delta: -60, span: span(4), items: ['wrap'], label: 'Redesigned wrap recipe' },
      { kind: 'wrapDemandFactor', factor: 0.93, span: span(4) }],
  },
  R21: {
    A: [{ kind: 'corporateOrder', mode: 'credit' }],
    B: [{ kind: 'corporateOrder', mode: 'discount' }],
    C: [{ kind: 'corporateOrder', mode: 'factor' }],
  },
  R22: {
    A: [{ kind: 'oneTime', account: 'repairs', amount: 65_000, month: 4, label: 'Refrigerator repair' }],
    B: [{ kind: 'asset', id: 'fridge', label: 'Upgraded refrigeration', cost: 180_000, salvage: 0, lifeMonths: 36, inService: 4 },
      { kind: 'unitCost', component: 'refrigeration', delta: -18, span: span(4), label: 'Cold-chain ingredient savings' }, reserve(180_000, 'Buying the $1,800 refrigeration system')],
    C: [{ kind: 'oneTime', account: 'equipmentRental', amount: 13_000, month: 4, label: 'Temporary refrigerator rental' }],
  },
  R23: {
    A: [{ kind: 'asset', id: 'machine', label: 'Prep machine', cost: 240_000, salvage: 30_000, lifeMonths: 36, inService: 4 },
      { kind: 'fixed', account: 'payroll', amount: -8_750, span: only(4), label: 'Prep-time labor savings' }, reserve(240_000, 'Buying the $2,400 machine')],
    B: [{ kind: 'oneTime', account: 'equipmentRental', amount: 9_500, month: 4, label: 'Prep machine rental' },
      { kind: 'fixed', account: 'payroll', amount: -8_750, span: only(4), label: 'Prep-time labor savings' }],
    C: [],
  },
  R24: {
    A: [{ kind: 'secondTruck', financed: false }, { kind: 'minCash', amount: 2_000_000, reason: 'Paying $18,000 cash keeps the $2,000 reserve only if posted cash is at least $20,000' }],
    B: [{ kind: 'secondTruck', financed: true }, { kind: 'minCash', amount: 920_000, reason: 'The $7,200 down payment keeps the $2,000 reserve only if posted cash is at least $9,200' }],
    C: [],
  },
  R25: {
    A: [{ kind: 'distribution', amount: 100_000 }, reserve(100_000, 'A $1,000 owner distribution')],
    B: [],
    C: [{ kind: 'prepaidAdvertising', amount: 100_000 }, reserve(100_000, 'Prepaying $1,000 of advertising')],
  },
};

/** The "no new action" option used to fill undecided future rounds in projections. */
export const NEUTRAL: Record<RoundId, OptionId> = {
  R01: 'A', R02: 'B', R03: 'B', R04: 'C', R05: 'C', R06: 'A', R07: 'C', R08: 'C', R09: 'C', R10: 'C',
  R11: 'A', R12: 'A', R13: 'C', R14: 'C', R15: 'C', R16: 'C', R17: 'C', R18: 'C', R19: 'A', R20: 'A',
  R21: 'A', R22: 'A', R23: 'C', R24: 'C', R25: 'B',
};

/** Month closes happen right after these rounds. */
export const CLOSE_AFTER: Partial<Record<RoundId, Month>> = { R10: 1, R15: 2, R20: 3, R23: 4 };

/** The period in which a round's decision happens. */
export function roundPeriod(r: RoundId): Period {
  const n = Number(r.slice(1));
  if (n <= 5) return 0;
  if (n <= 10) return 1;
  if (n <= 15) return 2;
  if (n <= 20) return 3;
  if (n <= 23) return 4;
  return 5;
}

export const inSpan = (s: Span, m: number) => m >= s.from && m <= s.to;
