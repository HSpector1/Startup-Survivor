// "Your business" panels: the round's concept recomputed on the player's live numbers.
// Practice-case questions use fixed reference numbers; these rows never do.
import { fmt, fmtUnits, sum, type Cents } from '../engine/money';
import { BASE_RECURRING, EFFECTS, NEUTRAL, ROUND_IDS, type Effect, type RoundId } from '../engine/model';
import { balanceSheet } from '../engine/ledger';
import { cashOf, collectEffects, computeMonth, projectOption, varianceReport, type GameInput, type GameState, type MonthCalc } from '../engine/sim';

export interface InsightRow { label: string; value: string; note?: string }
export interface Insight { title: string; rows: InsightRow[]; note?: string; tag: 'actual' | 'forecast' | 'plan' }

const money = (c: Cents) => fmt(c);
const meals = (n: number) => `${fmtUnits(n)} meals`;

function picked<K extends Effect['kind']>(input: GameInput, kind: K) {
  return collectEffects(input.choices).filter((t) => t.effect.kind === kind).map((t) => t.effect as Extract<Effect, { kind: K }>);
}

/** Recurring fixed cost per month before any month-specific items, plus truck depreciation. */
function plannedFixed(input: GameInput): { fixed: Cents; dep: Cents } {
  const fixed = sum(BASE_RECURRING.map((b) => b.amount)) + sum(picked(input, 'fixed').filter((f) => f.span.from <= 1).map((f) => f.amount));
  const truck = picked(input, 'asset').find((a) => a.id === 'truck');
  return { fixed, dep: truck ? Math.round(truck.cost / truck.lifeMonths) : 0 };
}

const locFee = (input: GameInput) => sum(picked(input, 'locationFee').map((l) => l.perOrder));
const capacityOf = (input: GameInput) => picked(input, 'truckCapacity')[0]?.units ?? 0;
const bowlPrice = (input: GameInput) => picked(input, 'bowlPrice')[0]?.price ?? 1200;

/** Projected calc of the round's month with this round at its "no new action" option. */
function baseline(input: GameInput, r: RoundId): MonthCalc | undefined {
  try { return projectOption(input, r, NEUTRAL[r]).calc; } catch { return undefined; }
}

const lastClose = (g: GameState) => g.closes[g.closes.length - 1];

export function insightFor(r: RoundId, input: GameInput, game: GameState): Insight | null {
  const cap = capacityOf(input);
  const fee = locFee(input);
  switch (r) {
    case 'R01': return { title: 'Your starting position', tag: 'actual', rows: [
      { label: 'Cash invested by you', value: money(2_500_000), note: "Posted: Dr Cash / Cr Owner's capital" },
      { label: 'Assets = Liabilities + Equity', value: '$25,000 = $0 + $25,000' },
    ], note: 'Every truck lasts 60 months with no salvage value, so monthly depreciation = price ÷ 60.' };
    case 'R02': {
      const econ = 90_000 + 50 * cap;
      return { title: 'Your truck at full capacity', tag: 'plan', rows: [
        { label: 'Monthly capacity', value: meals(cap) },
        { label: `Economy cost at ${fmtUnits(cap)} orders`, value: money(econ), note: '$900 + $0.50 × orders' },
        { label: 'Standard cost', value: money(130_000) },
        { label: 'Cheaper at full capacity', value: econ < 130_000 ? 'Economy' : econ > 130_000 ? 'Standard' : 'Tie' },
      ], note: 'Crossover: (1,300 − 900) ÷ 0.50 = 800 orders a month. Fewer orders favor Economy; more favor Standard.' };
    }
    case 'R03': {
      const boost = sum(picked(input, 'regularDemand').filter((d) => d.span.from <= 1).map((d) => d.units));
      return { title: 'Each price in your business (bowls only, before menu choices)', tag: 'plan', rows: ([[1000, 1250], [1200, 1100], [1400, 850]] as const).map(([p, d]) => {
        const cm = p - 500 - fee;
        const sold = Math.min(d + boost, cap);
        return { label: `${money(p)} bowl`, value: `${money(cm)} CM × ${fmtUnits(sold)} = ${money(cm * sold)}`, note: `${fmtUnits(d + boost)} wanted, ${fmtUnits(cap)} capacity${fee ? ', includes $0.50 site fee' : ''}` };
      }), note: 'Contribution, not revenue, pays the fixed costs. Demand above capacity earns nothing.' };
    }
    case 'R04': case 'R05': {
      const { fixed, dep } = plannedFixed(input);
      const cm = bowlPrice(input) - 500 - fee;
      const be = Math.ceil((fixed + dep) / cm);
      const calc = baseline(input, r);
      const rows: InsightRow[] = [
        { label: 'Monthly fixed costs incl. depreciation', value: money(fixed + dep) },
        { label: 'Your bowl contribution margin', value: money(cm), note: `${money(bowlPrice(input))} − $5.00${fee ? ' − $0.50 site fee' : ''}` },
        { label: 'Your break-even', value: meals(be) },
      ];
      if (r === 'R05') rows.push({ label: 'Your target for $1,500 profit', value: meals(Math.ceil((fixed + dep + 150_000) / cm)) });
      if (calc) rows.push({ label: 'Month 1 demand vs capacity (no new action)', value: `${fmtUnits(calc.totalDemand)} wanted / ${fmtUnits(calc.capacity)} seats`, note: calc.lost > 0 ? `Capacity-limited: ${fmtUnits(calc.lost)} orders would go unserved` : 'Demand-limited: spare capacity' });
      return { title: 'Your numbers', tag: 'plan', rows, note: 'Before the menu mix is set, this uses bowls only.' };
    }
    case 'R06': {
      const b = bowlPrice(input) - 500 - fee, w = 1000 - 450 - fee;
      return { title: 'Weighted contribution margin at your bowl price', tag: 'plan', rows: ([[0.1, 'Lean 90/10'], [0.25, 'Balanced 75/25'], [0.45, 'Wrap-forward 55/45']] as const).map(([s, l]) => ({
        label: l, value: `${fmt(Math.round((1 - s) * b + s * w))} per meal`, note: `${Math.round((1 - s) * 100)}% × ${money(b)} + ${Math.round(s * 100)}% × ${money(w)}` })) };
    }
    case 'R07': case 'R08': case 'R09': case 'R10': {
      const calc = baseline(input, r);
      if (!calc) return null;
      const spare = calc.capacity - calc.fulfilled;
      const p = calc.prices.bowl;
      const rows: InsightRow[] = [
        { label: 'Month 1 orders wanted (current plan)', value: meals(calc.totalDemand) },
        { label: 'Capacity', value: meals(calc.capacity) },
        { label: spare > 0 ? 'Spare capacity' : 'Orders turned away', value: meals(spare > 0 ? spare : calc.lost) },
      ];
      if (r === 'R07') rows.push({ label: 'Your app-order contribution', value: money(p - calc.unitCosts.bowl.total - Math.round(p * 0.25) - fee), note: `${money(p)} − ${money(calc.unitCosts.bowl.total)} cost − 25% commission${fee ? ' − $0.50 fee' : ''}` });
      if (r === 'R08') { const full = sum(calc.cohorts.filter((c) => c.id === 'bowl' || c.id === 'wrap').map((c) => c.fulfilled)); rows.push({ label: 'Walk-up orders that would get $1 off anyway', value: meals(full), note: `${money(full * 100)} of margin given away before any new customer arrives` }); }
      if (r === 'R10') rows.push({ label: 'Regular bowl contribution you could displace', value: `${money(p - calc.unitCosts.bowl.total - fee)} each`, note: 'Catering is served first. Any catered meal beyond spare capacity pushes out a regular order.' });
      return { title: 'Your Month 1 capacity picture', tag: 'forecast', rows, note: 'Pro forma: assumes no new action in the rest of Month 1.' };
    }
    case 'R11': case 'R12': case 'R13': {
      const m1 = game.closes[0]?.calc;
      if (!m1) return null;
      const wraps = m1.cohorts.find((c) => c.id === 'wrap')?.fulfilled ?? 0;
      const rows: InsightRow[] = [{ label: 'Meals you served in Month 1', value: meals(m1.fulfilled) }];
      if (r === 'R11') rows.push({ label: 'Contribution lost per month at +$0.60', value: money(m1.fulfilled * 60) }, { label: 'At the $0.20 replacement supplier', value: `${money(m1.fulfilled * 20)} + $240 once` });
      if (r === 'R12') rows.push({ label: 'Make: savings at $0.50 per meal', value: money(m1.fulfilled * 50) }, { label: 'Make: extra fixed cost incl. depreciation', value: money(9_300) }, { label: 'Make: net monthly effect', value: fmt(m1.fulfilled * 50 - 9_300, { sign: true }) }, { label: 'Bulk vendor: savings at $0.25', value: `${money(m1.fulfilled * 25)} a month, $200 once` });
      if (r === 'R13') rows.push({ label: 'Wraps served in Month 1', value: meals(wraps) }, { label: 'ABC overhead assigned to them at $1.60', value: money(wraps * 160), note: 'An allocation of costs you already pay. Total company expense does not change.' });
      return { title: 'Your Month 1 actuals', tag: 'actual', rows };
    }
    case 'R14': {
      const calc = baseline(input, r);
      if (!calc) return null;
      const bowlCM = calc.prices.bowl - calc.unitCosts.bowl.total - fee;
      const premCost = calc.unitCosts.premium.total + fee;
      return { title: 'Your Month 2 unit economics', tag: 'forecast', rows: [
        { label: 'Regular bowl contribution', value: money(bowlCM), note: `after your supplier and sauce decisions` },
        { label: 'Premium bowl variable cost', value: money(premCost) },
        { label: '$16 premium contribution', value: money(1600 - premCost) },
        { label: '$14 premium contribution', value: money(1400 - premCost) },
        { label: 'Capacity left for new orders', value: meals(Math.max(0, calc.capacity - calc.fulfilled)), note: 'Premium competes with walk-up bowls for the same seats' },
      ] };
    }
    case 'R15': {
      const idx = ROUND_IDS.indexOf('R15');
      const choices = { ...input.choices, R15: NEUTRAL.R15 };
      const plan = computeMonth(3, collectEffects(choices, idx), { weather: false, waste: false });
      return { title: 'Month 3 plan if you approve no initiative', tag: 'plan', rows: [
        { label: 'Planned meals', value: meals(plan.fulfilled) },
        { label: 'Planned net sales', value: money(plan.revenue) },
        { label: 'Planned contribution margin', value: money(plan.contributionMargin) },
        { label: 'Planned fixed costs incl. depreciation', value: money(plan.fixedTotal + plan.oneTimeTotal + plan.depreciationTotal) },
        { label: 'Planned operating income', value: money(plan.operatingIncome) },
      ], note: 'A budget is a plan. It freezes after this round and never becomes revenue.' };
    }
    case 'R16': case 'R17': case 'R18': case 'R19': {
      const budget = game.budgetM3;
      const calc = baseline(input, r);
      if (!budget || !calc) return null;
      const v = varianceReport(budget, calc);
      const rows: InsightRow[] = [
        { label: 'Budgeted meals (frozen at R15)', value: meals(budget.fulfilled) },
        { label: 'Projected Month 3 meals', value: meals(calc.fulfilled) },
      ];
      if (r === 'R16' || r === 'R19') rows.push({ label: 'Net sales volume variance', value: varianceText(v.netSalesVolumeVariance) });
      if (r === 'R17') rows.push({ label: `Waste surcharge at ${money(calc.waste)} per meal`, value: `${money(calc.waste * calc.fulfilled)} U`, note: 'Shows up as a materials quantity variance' });
      if (r === 'R18') rows.push({ label: 'Standard crew payroll (reference shift)', value: money(360_000), note: 'Already in your monthly budget. Only the excess and any intervention fee are new costs' });
      if (r === 'R19') rows.push(
        { label: 'Static budget operating income', value: money(v.staticIncome) },
        { label: 'Flexible budget at actual volume', value: money(v.flexibleIncome) },
        { label: 'Projected actual operating income', value: money(v.actualIncome) },
        { label: 'Flexible-budget variance', value: varianceText(v.flexibleBudgetVariance) });
      return { title: r === 'R19' ? 'Your Month 3 flash report' : 'Your Month 3 so far', tag: 'forecast', rows, note: 'Pro forma until the Month 3 close at R20. It uses the budget you froze at R15.' };
    }
    case 'R20': {
      const calc = baseline(input, r);
      if (!calc) return null;
      const w = calc.cohorts.find((c) => c.id === 'wrap');
      const fee6 = sum(calc.recurring.filter((f) => f.label === 'Wrap menu support').map((f) => f.amount));
      if (!w) return null;
      const cm = w.revenue - w.variableCost;
      return { title: 'Your wrap line in Month 3 (projected)', tag: 'forecast', rows: [
        { label: 'Wraps served', value: meals(w.fulfilled) },
        { label: 'Wrap contribution margin', value: money(cm) },
        { label: 'Avoidable wrap menu-support fee', value: money(fee6) },
        { label: 'Wrap segment margin', value: money(cm - fee6), note: 'Common overhead continues if wraps go' },
      ] };
    }
    case 'R21': case 'R22': case 'R23': {
      const cash = cashOf(game.journal);
      const calc = baseline(input, r);
      const rows: InsightRow[] = [{ label: 'Posted cash right now', value: money(cash) }];
      if (r === 'R21') rows.push({ label: 'Month 3 closing cash', value: money(lastClose(game)?.cashAfter ?? 0) });
      if (r === 'R22' && calc) rows.push({ label: 'Projected Month 4 meals', value: meals(calc.fulfilled) }, { label: 'Upgrade savings at $0.18 per meal', value: money(calc.fulfilled * 18) }, { label: 'Upgrade depreciation', value: `${money(5_000)} a month` });
      if (r === 'R23') rows.push({ label: 'Machine: savings − depreciation', value: fmt(8_750 - 5_833, { sign: true }), note: '$87.50 − $58.33 a month on the income statement' }, { label: 'Rental: savings − rent', value: fmt(8_750 - 9_500, { sign: true }) });
      const gate = r === 'R22' ? 380_000 : r === 'R23' ? 440_000 : 0;
      if (gate) rows.push({ label: 'Cash needed to buy and keep $2,000', value: money(gate), note: cash >= gate ? 'You can afford it' : 'You cannot buy it now' });
      return { title: 'Your cash position', tag: 'actual', rows };
    }
    case 'R24': case 'R25': {
      const bs = balanceSheet(game.journal);
      const rows: InsightRow[] = [
        { label: 'Posted cash', value: money(bs.cash) },
        { label: 'Total assets', value: money(bs.totalAssets) },
        { label: 'Total liabilities', value: money(bs.totalLiabilities) },
        { label: 'Book equity', value: money(bs.totalEquity) },
      ];
      if (r === 'R24') rows.push({ label: 'Cash buy needs', value: money(2_000_000) }, { label: 'Financed buy needs', value: money(920_000), note: 'Loan payment ≈ $224.19 a month for 60 months' });
      return { title: 'Your balance sheet after the Month 4 close', tag: 'actual', rows };
    }
  }
  return null;
}

export function varianceText(c: Cents) {
  return c === 0 ? '$0.00' : `${fmt(Math.abs(c))} ${c > 0 ? 'F' : 'U'}`;
}

/** Plain-language list of what an option changes, generated from its typed effects. */
export function effectSummary(r: RoundId, o: 'A' | 'B' | 'C'): string[] {
  const out: string[] = [];
  const months = (s: { from: number; to: number }) => (s.from === s.to ? `Month ${s.from}` : s.to === 4 ? `from Month ${s.from}` : `Months ${s.from}–${s.to}`);
  for (const e of EFFECTS[r][o]) {
    switch (e.kind) {
      case 'asset': out.push(`Buy ${e.label}: ${money(e.cost)} asset, ${money(Math.round((e.cost - e.salvage) / e.lifeMonths))}/month depreciation`); break;
      case 'truckCapacity': out.push(`Capacity ${fmtUnits(e.units)} meals/month`); break;
      case 'deposit': out.push(`${money(e.amount)} refundable deposit (an asset)`); break;
      case 'bowlPrice': out.push(`Bowl price ${money(e.price)}; ${fmtUnits(e.baseDemand)} base orders/month`); break;
      case 'regularDemand': out.push(`${e.units > 0 ? '+' : ''}${e.units} regular orders/month ${months(e.span)}`); break;
      case 'promoDemand': out.push(`+${e.units} ${e.target === 'pool' ? 'regular' : e.target} orders in Month ${e.month} only`); break;
      case 'wrapShare': out.push(`${Math.round(e.share * 100)}% of regular orders are wraps`); break;
      case 'discontinueWraps': out.push(`No wraps from Month ${e.from}; wrap support fee stops`); break;
      case 'wrapDemandFactor': out.push(`Wrap demand −${Math.round((1 - e.factor) * 100)}% ${months(e.span)}`); break;
      case 'cannibalize': out.push(`−${e.bowls} regular bowls/month ${months(e.span)}`); break;
      case 'premium': out.push(`${e.units} premium orders/month at ${money(e.price)} ${months(e.span)}`); break;
      case 'priceChange': out.push(`Menu prices +${money(e.delta)} ${months(e.span)}`); break;
      case 'elasticity': out.push(`Price-sensitive demand ×${e.factor} ${months(e.span)}`); break;
      case 'walkupDiscount': out.push(`$${e.amount / 100} off every walk-up order in Month ${e.month}`); break;
      case 'channel': out.push(`${e.units} ${e.channel === 'app' ? 'app delivery' : e.channel === 'direct' ? 'direct pickup' : 'coupon'} orders/month ${months(e.span)}${e.commissionRate ? `, ${e.commissionRate * 100}% commission` : ''}`); break;
      case 'catering': out.push(`${e.units} catered bowls at ${money(e.price)} in Month ${e.month}, served first`); break;
      case 'capacity': out.push(`Capacity ${e.units > 0 ? '+' : ''}${e.units} meals ${months(e.span)}`); break;
      case 'overtime': out.push(`Up to +${e.units} capacity in Month ${e.month}; ${money(e.costPerUnit)} per meal above normal capacity`); break;
      case 'fixed': out.push(`${e.label}: ${e.amount > 0 ? '+' : '−'}${money(Math.abs(e.amount))}/month ${months(e.span)}`); break;
      case 'oneTime': out.push(`${e.label}: ${money(e.amount)} once in Month ${e.month}`); break;
      case 'unitCost': out.push(`${e.label}: ${e.delta > 0 ? '+' : '−'}${money(Math.abs(e.delta))} per ${e.items ? e.items.join('/') : 'meal'} ${months(e.span)}`); break;
      case 'wasteRate': out.push(`Waste surcharge ${money(e.cents)} per meal from Month ${e.from}`); break;
      case 'locationFee': out.push(`${money(e.perOrder)} fee on every order served`); break;
      case 'corporateOrder': out.push(e.mode === 'credit' ? 'Sales $2,400 to accounts receivable; pay $1,000 cost' : e.mode === 'discount' ? 'Collect $2,352 now; $48 sales discount; pay $1,000 cost' : 'Sell the invoice for $2,304; $96 factoring fee; pay $1,000 cost'); break;
      case 'secondTruck': out.push(e.financed ? '$18,000 truck: $7,200 cash + $10,800 bank loan' : '$18,000 truck paid in cash'); break;
      case 'distribution': out.push(`${money(e.amount)} owner distribution (equity, not expense)`); break;
      case 'prepaidAdvertising': out.push(`${money(e.amount)} prepaid advertising (asset until used)`); break;
      case 'minCash': break;
      case 'achievement': out.push('No ledger change; earn the Forecast Fixer badge'); break;
    }
  }
  return out.length ? out : ['No change to costs, demand or capacity'];
}
