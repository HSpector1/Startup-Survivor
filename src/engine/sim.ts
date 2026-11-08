// Deterministic simulation: the journal is a pure function of the ordered decisions.
// Replaying the same choices always yields the same events, so nothing can post twice.
import { largestRemainder, pct, roundHalfUp, sum, type Cents, fmt } from './money';
import {
  BASE_RECURRING, BASE_UNIT_COST, BASE_WASTE, BRIDGE_RATE_MONTHLY, CLOSE_AFTER, EFFECTS, NEUTRAL, OPENING_CAPITAL,
  RESERVE_FLOOR, ROUND_IDS, SECOND_TRUCK, WEATHER, WRAP_LIST_PRICE, inSpan, roundPeriod,
  type Effect, type ExpenseAccount, type MenuItem, type Month, type OptionId, type Period, type RoundId,
} from './model';
import { balanceSheet, cr, dr, event, incomeStatement, type JournalEvent, type Line } from './ledger';

export type Choices = Partial<Record<RoundId, OptionId>>;
export type Rescue = 'equity' | 'loan';
export interface GameInput {
  choices: Choices;
  rescues?: Partial<Record<Month, Rescue>>;
  /** Optional 'mastery affects sales' factor per month (1 = normal demand). See audit A24. */
  execution?: Partial<Record<Month, number>>;
}
export interface Tagged { round: RoundId; effect: Effect }

export function collectEffects(choices: Choices, uptoIndex = 24): Tagged[] {
  const out: Tagged[] = [];
  ROUND_IDS.slice(0, uptoIndex + 1).forEach((r) => {
    const o = choices[r];
    if (o) for (const effect of EFFECTS[r][o]) out.push({ round: r, effect });
  });
  return out;
}

const pick = <K extends Effect['kind']>(tags: Tagged[], kind: K) =>
  tags.filter((t) => t.effect.kind === kind).map((t) => ({ round: t.round, e: t.effect as Extract<Effect, { kind: K }> }));

// ---------------------------------------------------------------- month calculation

export type CohortId = 'catering' | 'bowl' | 'wrap' | 'premium' | 'direct' | 'coupon' | 'app';
export const COHORT_LABEL: Record<CohortId, string> = {
  catering: 'Catering contract (bowls)', bowl: 'Walk-up bowls', wrap: 'Walk-up wraps', premium: 'Premium bowls',
  direct: 'Direct online pickup (bowls)', coupon: 'New-customer coupons (bowls)', app: 'Delivery app (bowls)',
};
const TIER: Record<CohortId, 1 | 2 | 3 | 4> = { catering: 1, bowl: 2, wrap: 2, premium: 2, direct: 3, coupon: 3, app: 4 };

export interface Cohort {
  id: CohortId; label: string; item: MenuItem; tier: 1 | 2 | 3 | 4;
  demand: number; fulfilled: number; lost: number;
  price: Cents; foodCost: Cents; extraCost: Cents; commission: Cents; locationFee: Cents;
  /** All variable cost per fulfilled unit (overtime is tracked separately). */
  unitVariable: Cents;
  revenue: Cents; variableCost: Cents;
}

export interface CostLine { account: ExpenseAccount; label: string; amount: Cents }

export interface MonthCalc {
  month: Month;
  capacity: number; baseCapacity: number;
  cohorts: Cohort[];
  totalDemand: number; fulfilled: number; lost: number;
  overtimeUnits: number; overtimeCost: Cents;
  unitCosts: Record<MenuItem, { total: Cents; parts: { label: string; cents: Cents }[] }>;
  waste: Cents;
  prices: { bowl: Cents; wrap: Cents; premium: Cents | null };
  wrapShare: number;
  recurring: CostLine[]; oneTime: CostLine[];
  depreciation: { label: string; amount: Cents }[];
  revenue: Cents; variableCost: Cents; contributionMargin: Cents;
  fixedTotal: Cents; oneTimeTotal: Cents; depreciationTotal: Cents;
  operatingIncome: Cents;
  demandNotes: string[];
}

export interface CalcOptions { weather?: boolean; waste?: boolean; execution?: number }

function wasteRate(tags: Tagged[], m: Month, enabled: boolean): Cents {
  if (!enabled || m < BASE_WASTE.from) return 0;
  const set = pick(tags, 'wasteRate').filter((x) => x.e.from <= m);
  return set.length ? set[set.length - 1].e.cents : BASE_WASTE.cents;
}

export function monthlyDepreciation(cost: Cents, salvage: Cents, life: number, k: number): Cents {
  if (k < 1 || k > life) return 0;
  const base = roundHalfUp((cost - salvage) / life);
  return k < life ? base : cost - salvage - base * (life - 1); // final-month catch-up
}

export function computeMonth(m: Month, tags: Tagged[], opts: CalcOptions = {}): MonthCalc {
  const weatherOn = opts.weather ?? true;
  // Execution factor from knowledge checks: scales customer demand, never contracts (catering, R21).
  const X = opts.execution ?? 1;
  if (!(X > 0 && X <= 1)) throw new Error(`Execution factor must be in (0, 1], got ${X}`);
  const active = <T extends { span: { from: Month; to: Month } }>(xs: { e: T }[]) => xs.filter((x) => inSpan(x.e.span, m)).map((x) => x.e);

  const priceSet = pick(tags, 'bowlPrice');
  const truck = pick(tags, 'truckCapacity');
  if (!priceSet.length || !truck.length) throw new Error(`Month ${m} cannot be computed before R01 and R03 are decided`);
  const { price: bowlBase, baseDemand } = priceSet[priceSet.length - 1].e;

  // Dropping wraps (R20B, A1): wrap buyers leave rather than switch to bowls, so bowl demand is
  // what it would have been, plus only the explicit replacement prospects; the wrap fee stops.
  const discontinued = pick(tags, 'discontinueWraps').some((x) => x.e.from <= m);
  const shares = active(pick(tags, 'wrapShare'));
  const w = shares.length ? shares[shares.length - 1].share : 0;

  const notes: string[] = [];
  const regular = active(pick(tags, 'regularDemand'));
  const P = baseDemand + sum(regular.filter((e) => !e.bowlOnly).map((e) => e.units));
  const bowlOnly = sum(regular.filter((e) => e.bowlOnly).map((e) => e.units));
  notes.push(`Base demand at ${fmt(bowlBase, { noCents: true })} bowl price: ${baseDemand}`);
  regular.forEach((e) => notes.push(`${e.label}: ${e.units > 0 ? '+' : ''}${e.units}`));

  const elastic = active(pick(tags, 'elasticity'));
  const E = elastic.reduce((a, e) => a * e.factor, 1);
  const Eprem = elastic.filter((e) => e.includesPremium).reduce((a, e) => a * e.factor, 1);
  if (E !== 1) notes.push(`Price-increase demand response: ×${+E.toFixed(4)}`);
  const W = weatherOn && m === WEATHER.month ? WEATHER.factor : 1;
  if (W !== 1) notes.push(`Month 3 bad weather on walk-up demand: ×${W}`);
  const wf = active(pick(tags, 'wrapDemandFactor')).reduce((a, e) => a * e.factor, 1);
  if (wf !== 1) notes.push(`Redesigned wrap demand: ×${wf}`);
  const C = sum(active(pick(tags, 'cannibalize')).map((e) => e.bowls));
  if (C) notes.push(`Premium cannibalizes regular bowls: −${C}`);

  const promos = pick(tags, 'promoDemand').filter((x) => x.e.month === m).map((x) => x.e);
  promos.forEach((p) => notes.push(`${p.label} (${p.target === 'pool' ? 'regular orders' : p.target + 's'}, this month only): +${p.units}`));
  const promoPool = sum(promos.filter((p) => p.target === 'pool').map((p) => p.units));
  const promoBowl = sum(promos.filter((p) => p.target === 'bowl').map((p) => p.units));
  const promoWrap = w > 0 ? sum(promos.filter((p) => p.target === 'wrap').map((p) => p.units)) : 0;

  if (discontinued) notes.push('Wraps discontinued: wrap demand is lost; bowl demand is unchanged');
  const bowlsExact = Math.max(0, (P * (1 - w) + bowlOnly - C) * E * W) + promoPool * (1 - w) + promoBowl;
  const wrapsExact = discontinued ? 0 : P * w * wf * E * W + promoPool * w + promoWrap;
  if (X !== 1) notes.push(`Execution from your knowledge checks: ×${+X.toFixed(4)} on customer demand`);
  const regularTotal = roundHalfUp((bowlsExact + wrapsExact) * X);
  const [bowlDemand, wrapDemand] = largestRemainder(regularTotal, [bowlsExact, wrapsExact]);

  // Prices
  const priceUps = active(pick(tags, 'priceChange'));
  const bowlList = bowlBase + sum(priceUps.map((p) => p.delta));
  const wrapList = WRAP_LIST_PRICE + sum(priceUps.map((p) => p.delta));
  const prem = active(pick(tags, 'premium'));
  const premiumList = prem.length ? prem[0].price + sum(priceUps.filter((p) => p.includesPremium).map((p) => p.delta)) : null;
  const discount = sum(pick(tags, 'walkupDiscount').filter((x) => x.e.month === m).map((x) => x.e.amount));

  // Unit costs
  const waste = wasteRate(tags, m, opts.waste ?? true);
  const unitMods = active(pick(tags, 'unitCost'));
  const unitCosts = {} as MonthCalc['unitCosts'];
  for (const item of ['bowl', 'wrap', 'premium'] as MenuItem[]) {
    const parts = [{ label: `Base ${item} recipe, packaging & card fee`, cents: BASE_UNIT_COST[item] }];
    unitMods.filter((u) => !u.items || u.items.includes(item)).forEach((u) => parts.push({ label: u.label, cents: u.delta }));
    if (waste) parts.push({ label: 'Food-waste surcharge', cents: waste });
    unitCosts[item] = { total: sum(parts.map((p) => p.cents)), parts };
  }
  const locFee = sum(pick(tags, 'locationFee').map((x) => x.e.perOrder));

  // Demand cohorts
  const wanted: { id: CohortId; item: MenuItem; demand: number; price: Cents; extra: Cents; rate: number }[] = [];
  pick(tags, 'catering').filter((x) => x.e.month === m).forEach(({ e }) => wanted.push({ id: 'catering', item: 'bowl', demand: e.units, price: e.price, extra: e.extraCost, rate: 0 }));
  wanted.push({ id: 'bowl', item: 'bowl', demand: bowlDemand, price: bowlList - discount, extra: 0, rate: 0 });
  wanted.push({ id: 'wrap', item: 'wrap', demand: wrapDemand, price: wrapList - discount, extra: 0, rate: 0 });
  if (prem.length && premiumList !== null) wanted.push({ id: 'premium', item: 'premium', demand: roundHalfUp(prem[0].units * Eprem * W * X), price: premiumList, extra: 0, rate: 0 });
  for (const ch of active(pick(tags, 'channel'))) {
    const units = roundHalfUp((ch.channel === 'coupon' ? ch.units : ch.units * E) * X);
    wanted.push({ id: ch.channel, item: 'bowl', demand: units, price: bowlList + (ch.priceDelta ?? 0), extra: 0, rate: ch.commissionRate ?? 0 });
  }

  // Capacity
  const truckCap = truck[truck.length - 1].e.units;
  const capMods = active(pick(tags, 'capacity'));
  const baseCapacity = truckCap + sum(capMods.map((c) => c.units));
  const ot = pick(tags, 'overtime').filter((x) => x.e.month === m).map((x) => x.e);
  const capacity = baseCapacity + sum(ot.map((o) => o.units));

  // Allocate by published priority tier; proportional largest remainder inside a tier.
  let remaining = capacity;
  const fulfilledBy = new Map<CohortId, number>();
  for (const tier of [1, 2, 3, 4] as const) {
    const group = wanted.filter((c) => TIER[c.id] === tier);
    const demand = sum(group.map((c) => c.demand));
    const served = demand <= remaining ? group.map((c) => c.demand) : largestRemainder(remaining, group.map((c) => c.demand));
    group.forEach((c, i) => fulfilledBy.set(c.id, served[i]));
    remaining -= sum(served);
  }

  const cohorts: Cohort[] = wanted.map((c) => {
    const fulfilled = fulfilledBy.get(c.id)!;
    const foodCost = unitCosts[c.item].total;
    const commission = pct(c.price, c.rate);
    const unitVariable = foodCost + c.extra + commission + locFee;
    return {
      id: c.id, label: COHORT_LABEL[c.id], item: c.item, tier: TIER[c.id], demand: c.demand, fulfilled, lost: c.demand - fulfilled,
      price: c.price, foodCost, extraCost: c.extra, commission, locationFee: locFee, unitVariable,
      revenue: fulfilled * c.price, variableCost: fulfilled * unitVariable,
    };
  }).filter((c) => c.demand > 0 || c.id === 'bowl');

  const fulfilled = sum(cohorts.map((c) => c.fulfilled));
  const overtimeUnits = ot.length ? Math.max(0, fulfilled - baseCapacity) : 0;
  const overtimeCost = overtimeUnits * sum(ot.map((o) => o.costPerUnit));

  // Fixed, one-time and depreciation
  const recurring: CostLine[] = [
    ...BASE_RECURRING,
    ...active(pick(tags, 'fixed')).filter((f) => !(discontinued && f.wrapMenu)).map((f) => ({ account: f.account, label: f.label, amount: f.amount })),
  ];
  const oneTime: CostLine[] = pick(tags, 'oneTime').filter((x) => x.e.month === m).map(({ e }) => ({ account: e.account, label: e.label, amount: e.amount }));
  const depreciation = pick(tags, 'asset')
    .filter(({ e }) => e.inService >= 1 && e.inService <= m)
    .map(({ e }) => ({ label: e.label, amount: monthlyDepreciation(e.cost, e.salvage, e.lifeMonths, m - e.inService + 1) }));

  const revenue = sum(cohorts.map((c) => c.revenue));
  const variableCost = sum(cohorts.map((c) => c.variableCost)) + overtimeCost;
  const fixedTotal = sum(recurring.map((f) => f.amount));
  const oneTimeTotal = sum(oneTime.map((f) => f.amount));
  const depreciationTotal = sum(depreciation.map((d) => d.amount));
  return {
    month: m, capacity, baseCapacity, cohorts,
    totalDemand: sum(cohorts.map((c) => c.demand)), fulfilled, lost: sum(cohorts.map((c) => c.lost)),
    overtimeUnits, overtimeCost, unitCosts, waste,
    prices: { bowl: bowlList, wrap: wrapList, premium: premiumList }, wrapShare: discontinued ? 0 : w,
    recurring, oneTime, depreciation,
    revenue, variableCost, contributionMargin: revenue - variableCost,
    fixedTotal, oneTimeTotal, depreciationTotal,
    operatingIncome: revenue - variableCost - fixedTotal - oneTimeTotal - depreciationTotal,
    demandNotes: notes,
  };
}

/** Balanced journal events for one operating month (settlement + depreciation). */
export function monthEvents(c: MonthCalc, round: RoundId): JournalEvent[] {
  const m = c.month;
  const lines: Line[] = [];
  if (c.revenue) lines.push(dr('cash', c.revenue, `Cash collected on Month ${m} meal sales`, { cf: 'operating' }), cr('sales', c.revenue, `Month ${m} meal sales (fulfilled orders only)`));
  const v = (account: Parameters<typeof dr>[0], amt: Cents, memo: string) => lines.push(dr(account, amt, memo, { cls: 'variable' }));
  v('foodCost', sum(c.cohorts.map((x) => x.fulfilled * x.foodCost)), 'Food, packaging & card fees on meals served');
  v('cateringDirect', sum(c.cohorts.map((x) => x.fulfilled * x.extraCost)), 'Catering packaging & transport');
  v('deliveryCommission', sum(c.cohorts.map((x) => x.fulfilled * x.commission)), 'Delivery app commission (25% of app price)');
  v('locationFees', sum(c.cohorts.map((x) => x.fulfilled * x.locationFee)), 'Economy site $0.50 per-order fee');
  v('overtime', c.overtimeCost, `Overtime on ${c.overtimeUnits} meals above base capacity`);
  for (const f of c.recurring) lines.push(f.amount >= 0 ? dr(f.account, f.amount, f.label, { cls: 'fixed' }) : cr(f.account, -f.amount, f.label, { cls: 'fixed' }));
  for (const f of c.oneTime) lines.push(dr(f.account, f.amount, f.label, { cls: 'oneTime' }));
  const paid = c.variableCost + c.fixedTotal + c.oneTimeTotal;
  lines.push(cr('cash', paid, `Cash paid for Month ${m} operating costs`, { cf: 'operating' }));
  const out = [event(`M${m}-operations`, round, m, `Month ${m} close: sales and operating costs`, lines)];
  if (c.depreciationTotal) {
    out.push(event(`M${m}-depreciation`, round, m, `Month ${m} close: straight-line depreciation`, c.depreciation.flatMap((d) => [
      dr('depreciation', d.amount, `Depreciation: ${d.label}`, { cls: 'noncash' }), cr('accumulatedDepreciation', d.amount, `Accumulated depreciation: ${d.label}`),
    ])));
  }
  return out;
}

// ---------------------------------------------------------------- full game replay

export interface ClosedMonth { month: Month; round: RoundId; calc: MonthCalc; cashAfter: Cents; rescue?: { kind: Rescue; amount: Cents } }

export interface GameState {
  journal: JournalEvent[];
  closes: ClosedMonth[];
  budgetM3?: MonthCalc;
  roundsDone: number;
  pendingRescue?: { month: Month; shortfall: Cents };
  achievements: string[];
  /** Months whose projected close left cash below zero (projection mode only). */
  negativeCash: Month[];
}

export const cashOf = (journal: JournalEvent[]) => balanceSheet(journal).cash;

export class ChoiceError extends Error {}

export function runGame(input: GameInput, opts: { projection?: boolean } = {}): GameState {
  const journal: JournalEvent[] = [
    event('R00-capital', 'R00', 0, 'Owner invests start-up cash', [
      dr('cash', OPENING_CAPITAL, "Owner's cash contribution", { cf: 'financing' }), cr('ownerCapital', OPENING_CAPITAL, "Owner's cash contribution"),
    ]),
  ];
  const st: GameState = { journal, closes: [], roundsDone: 0, achievements: [], negativeCash: [] };
  const post = (e: JournalEvent) => {
    if (journal.some((x) => x.id === e.id)) throw new Error(`Duplicate journal event ${e.id}`);
    journal.push(e);
  };

  let gap = false;
  for (let i = 0; i < ROUND_IDS.length; i++) {
    const r = ROUND_IDS[i];
    const opt = input.choices[r];
    if (!opt) { gap = true; continue; }
    if (gap) throw new ChoiceError(`${r} was chosen before an earlier round`);
    if (!EFFECTS[r][opt]) throw new ChoiceError(`${r} has no option ${opt}`);
    const p = roundPeriod(r);
    const effects = EFFECTS[r][opt];

    if (!opts.projection) for (const e of effects) if (e.kind === 'minCash') {
      const cash = cashOf(journal);
      if (cash < e.amount) throw new ChoiceError(`${r}${opt} is unavailable: ${e.reason}. Posted cash is ${fmt(cash)}.`);
    }

    for (const e of effects) {
      const id = `${r}-${e.kind}`;
      switch (e.kind) {
        case 'asset':
          post(event(id, r, p, `Buy ${e.label} (capitalized)`, [dr('equipment', e.cost, e.label), cr('cash', e.cost, `Paid for ${e.label}`, { cf: 'investing' })]));
          break;
        case 'deposit':
          post(event(id, r, p, 'Refundable site deposit', [dr('deposits', e.amount, 'Refundable site deposit'), cr('cash', e.amount, 'Paid refundable site deposit', { cf: 'investing' })]));
          break;
        case 'corporateOrder': {
          const lines: Line[] = [dr('corporateOrderCost', 100_000, 'All-in production cost of corporate order', { cls: 'variable' }), cr('cash', 100_000, 'Paid corporate order production cost', { cf: 'operating' })];
          if (e.mode === 'credit') lines.push(dr('accountsReceivable', 240_000, 'Invoice on normal credit terms'), cr('sales', 240_000, 'Corporate order earned (delivered)'));
          if (e.mode === 'discount') lines.push(dr('cash', 235_200, 'Collected invoice less 2% discount', { cf: 'operating' }), dr('salesDiscounts', 4_800, '2% early-payment discount'), cr('sales', 240_000, 'Corporate order earned (delivered)'));
          if (e.mode === 'factor') lines.push(
            dr('accountsReceivable', 240_000, 'Invoice on normal credit terms'), cr('sales', 240_000, 'Corporate order earned (delivered)'),
            dr('cash', 230_400, 'Cash from factor (96% of invoice)', { cf: 'operating' }), dr('factoringFee', 9_600, '4% factoring fee', { cls: 'oneTime' }), cr('accountsReceivable', 240_000, 'Receivable sold to factor without recourse'),
          );
          post(event(id, r, 4, 'Corporate catering order (outside truck capacity)', lines));
          break;
        }
        case 'secondTruck': {
          const lines: Line[] = [dr('equipment', SECOND_TRUCK.cost, 'Second food truck'), cr('cash', SECOND_TRUCK.cost, 'Paid for second truck', { cf: 'investing' })];
          if (e.financed) lines.push(dr('cash', SECOND_TRUCK.loan, 'Bank loan proceeds (60%)', { cf: 'financing' }), cr('bankLoan', SECOND_TRUCK.loan, 'Bank loan: 9% APR, 60 monthly payments'));
          post(event(id, r, 5, e.financed ? 'Second truck: 40% cash, 60% bank loan' : 'Second truck paid in cash', lines));
          break;
        }
        case 'distribution':
          post(event(id, r, 5, 'Owner distribution', [dr('ownerDistributions', e.amount, 'Owner distribution (reduces equity)'), cr('cash', e.amount, 'Paid owner distribution', { cf: 'financing' })]));
          break;
        case 'prepaidAdvertising':
          post(event(id, r, 5, 'Prepay next month advertising', [dr('prepaidAdvertising', e.amount, 'Prepaid Month 5 advertising (asset)'), cr('cash', e.amount, 'Paid advertising in advance', { cf: 'operating' })]));
          break;
        case 'achievement':
          st.achievements.push(e.id);
          break;
        default:
          break; // operating effects are applied at month close by computeMonth
      }
    }

    if (r === 'R15') st.budgetM3 = computeMonth(3, collectEffects(input.choices, i), { weather: false, waste: false });

    const m = CLOSE_AFTER[r];
    if (m) {
      // Bridge-loan interest accrues from the month after a rescue.
      const bridge = -journal.reduce((s, e) => s + sum(e.lines.filter((l) => l.account === 'bridgeLoan').map((l) => l.dr - l.cr)), 0);
      if (bridge > 0) {
        const interest = pct(bridge, BRIDGE_RATE_MONTHLY);
        post(event(`M${m}-interest`, r, m, 'Bridge loan interest (1.5% per month)', [dr('interest', interest, 'Bridge loan interest', { cls: 'nonOperating' }), cr('cash', interest, 'Paid bridge loan interest', { cf: 'operating' })]));
      }
      const calc = computeMonth(m, collectEffects(input.choices, i), { execution: input.execution?.[m] });
      monthEvents(calc, r).forEach(post);
      const close: ClosedMonth = { month: m, round: r, calc, cashAfter: cashOf(journal) };
      st.closes.push(close);
      if (close.cashAfter < 0) {
        const kind = input.rescues?.[m];
        if (kind) {
          const amount = -close.cashAfter + RESERVE_FLOOR;
          post(kind === 'equity'
            ? event(`M${m}-rescue`, r, m, 'Emergency owner contribution', [dr('cash', amount, 'Emergency owner contribution', { cf: 'financing' }), cr('ownerCapital', amount, 'Emergency owner contribution')])
            : event(`M${m}-rescue`, r, m, 'Emergency bridge loan', [dr('cash', amount, 'Emergency bridge loan proceeds', { cf: 'financing' }), cr('bridgeLoan', amount, 'Bridge loan at 1.5% per month')]));
          close.rescue = { kind, amount };
          close.cashAfter = cashOf(journal);
        } else if (opts.projection) {
          st.negativeCash.push(m);
        } else {
          st.pendingRescue = { month: m, shortfall: -close.cashAfter };
          st.roundsDone = i + 1;
          return st;
        }
      }
    }
    st.roundsDone = i + 1;
  }
  return st;
}

/** Which options are affordable right now, given posted cash before the round. */
export function availability(input: GameInput, r: RoundId): Record<OptionId, { ok: boolean; reason?: string }> {
  const idx = ROUND_IDS.indexOf(r);
  const prior: Choices = {};
  ROUND_IDS.slice(0, idx).forEach((x) => { if (input.choices[x]) prior[x] = input.choices[x]; });
  const cash = cashOf(runGame({ ...input, choices: prior }).journal);
  const out = {} as Record<OptionId, { ok: boolean; reason?: string }>;
  for (const o of ['A', 'B', 'C'] as OptionId[]) {
    const guard = EFFECTS[r][o].find((e) => e.kind === 'minCash') as Extract<Effect, { kind: 'minCash' }> | undefined;
    out[o] = guard && cash < guard.amount ? { ok: false, reason: `${guard.reason}. You have ${fmt(cash)} posted cash.` } : { ok: true };
  }
  return out;
}

/** The month whose close a round feeds into (0 = none: post-close rounds). */
export function targetMonth(r: RoundId): Month | 0 {
  const p = roundPeriod(r);
  return p === 0 ? 1 : p === 5 ? 0 : (p as Month);
}

export interface Projection {
  option: OptionId;
  month: Month | 0;
  calc?: MonthCalc;
  operatingIncome?: Cents;
  netIncome?: Cents;
  cashAtClose?: Cents;
  /** Balance sheet right after this choice's immediate postings. */
  cashNow: Cents;
  equityNow: Cents;
  liabilitiesNow: Cents;
}

/** PRO FORMA: the round's month under each option, with later rounds of that month at their "no new action" option. */
export function projectOption(input: GameInput, r: RoundId, option: OptionId): Projection {
  const idx = ROUND_IDS.indexOf(r);
  const choices: Choices = {};
  ROUND_IDS.slice(0, idx).forEach((x) => { choices[x] = input.choices[x]; });
  choices[r] = option;
  const now = runGame({ ...input, choices }, { projection: true });
  const bsNow = balanceSheet(now.journal);
  const m = targetMonth(r);
  const base = { option, month: m, cashNow: bsNow.cash, equityNow: bsNow.totalEquity, liabilitiesNow: bsNow.totalLiabilities };
  if (!m) return base;
  const closeRound = (Object.keys(CLOSE_AFTER) as RoundId[]).find((k) => CLOSE_AFTER[k] === m)!;
  for (let j = idx + 1; j <= ROUND_IDS.indexOf(closeRound); j++) choices[ROUND_IDS[j]] = NEUTRAL[ROUND_IDS[j]];
  const full = runGame({ ...input, choices }, { projection: true });
  const close = full.closes.find((c) => c.month === m)!;
  const is = incomeStatement(full.journal.filter((e) => e.period === m));
  return { ...base, calc: close.calc, operatingIncome: is.operatingIncome, netIncome: is.netIncome, cashAtClose: close.cashAfter };
}

// ---------------------------------------------------------------- Month 3 budget vs actual

export interface VarianceRow { id: CohortId; label: string; budgetUnits: number; actualUnits: number; budgetUnitCM: Cents; volumeVariance: Cents }
export interface VarianceReport {
  staticIncome: Cents; flexibleIncome: Cents; actualIncome: Cents;
  netSalesVolumeVariance: Cents; flexibleBudgetVariance: Cents;
  salesPriceVariance: Cents; variableCostVariance: Cents; wasteVariance: Cents; otherVariableVariance: Cents; fixedCostVariance: Cents;
  revenueSalesVolumeVariance: Cents;
  budgetFixed: Cents; actualFixed: Cents;
  rows: VarianceRow[];
  fixedLines: { label: string; budget: Cents; actual: Cents }[];
}

/** Variances are signed as their effect on operating income: positive = favorable (F), negative = unfavorable (U). */
export function varianceReport(budget: MonthCalc, actual: MonthCalc): VarianceReport {
  const ids = [...new Set([...budget.cohorts, ...actual.cohorts].map((c) => c.id))];
  const bOf = (id: CohortId) => budget.cohorts.find((c) => c.id === id);
  const aOf = (id: CohortId) => actual.cohorts.find((c) => c.id === id);
  const budgetFixed = budget.fixedTotal + budget.oneTimeTotal + budget.depreciationTotal;
  const actualFixed = actual.fixedTotal + actual.oneTimeTotal + actual.depreciationTotal;
  let flexCM = 0, flexRevenue = 0, flexVariable = 0, revenueVolume = 0;
  const rows: VarianceRow[] = ids.map((id) => {
    const b = bOf(id), a = aOf(id);
    const std = b ?? a!; // a cohort not in the budget is flexed at its actual price and cost
    const units = a?.fulfilled ?? 0;
    const budgetUnits = b?.fulfilled ?? 0;
    const cm = std.price - std.unitVariable;
    flexCM += units * cm; flexRevenue += units * std.price; flexVariable += units * std.unitVariable;
    revenueVolume += (units - budgetUnits) * std.price;
    return { id, label: COHORT_LABEL[id], budgetUnits, actualUnits: units, budgetUnitCM: cm, volumeVariance: (units - budgetUnits) * cm };
  });
  const flexibleIncome = flexCM - budgetFixed;
  const staticIncome = budget.operatingIncome;
  const wasteVariance = -actual.waste * actual.fulfilled + budget.waste * actual.fulfilled;
  const variableCostVariance = flexVariable - actual.variableCost;
  const labels = [...new Set([...budget.recurring, ...budget.oneTime, ...actual.recurring, ...actual.oneTime].map((f) => f.label))];
  const tot = (xs: CostLine[], l: string) => sum(xs.filter((x) => x.label === l).map((x) => x.amount));
  return {
    staticIncome, flexibleIncome, actualIncome: actual.operatingIncome,
    netSalesVolumeVariance: flexibleIncome - staticIncome,
    flexibleBudgetVariance: actual.operatingIncome - flexibleIncome,
    salesPriceVariance: actual.revenue - flexRevenue,
    variableCostVariance, wasteVariance, otherVariableVariance: variableCostVariance - wasteVariance,
    fixedCostVariance: budgetFixed - actualFixed,
    revenueSalesVolumeVariance: revenueVolume,
    budgetFixed, actualFixed, rows,
    fixedLines: [
      ...labels.map((l) => ({ label: l, budget: tot([...budget.recurring, ...budget.oneTime], l), actual: tot([...actual.recurring, ...actual.oneTime], l) })),
      { label: 'Depreciation', budget: budget.depreciationTotal, actual: actual.depreciationTotal },
    ].filter((x) => x.budget || x.actual),
  };
}

export const periodLabel = (p: Period) => (p === 0 ? 'Pre-launch' : p === 5 ? 'Start of Month 5' : `Month ${p}`);
