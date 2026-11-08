// Financial reports, the month-close screen and the final investor report.
// Every number comes from the posted journal or the engine's month calculation; nothing is re-derived here
// except presentation splits (loan current portion) and cross-checks that render a red banner when they fail.
import { useId, useState, type ReactNode } from 'react';
import { fmt, fmtUnits, pct, roundHalfUp, sum, type Cents } from '../engine/money';
import { BRIDGE_RATE_MONTHLY, RESERVE_FLOOR, SECOND_TRUCK, type Month, type Period } from '../engine/model';
import { amortization, loanPayment } from '../engine/finance';
import {
  ACCOUNTS, EXPENSE_ACCOUNTS, balanceSheet, cashFlow, incomeStatement,
  type BalanceSheet, type ExpenseClass, type IncomeStatement, type JournalEvent,
} from '../engine/ledger';
import { monthlyDepreciation, periodLabel, varianceReport, type GameState, type MonthCalc, type Rescue } from '../engine/sim';
import type { Save } from '../state';
import { Delta, JournalView, Money, Sheet, TableScroll, Tabs, Variance, useFocusHeading } from './common';
import { TruckHero, type TruckVariant } from './art';
import './reports.css';

// ---------------------------------------------------------------- shared helpers

const inPeriod = (g: GameState, p: Period) => g.journal.filter((e) => e.period === p);
const upTo = (g: GameState, p: Period) => g.journal.filter((e) => e.period <= p);
const before = (g: GameState, p: Period) => g.journal.filter((e) => e.period < p);
const periodsOf = (g: GameState) => [...new Set(g.journal.map((e) => e.period))].sort((a, b) => a - b);

/** Principal due in the first 12 payments of the R24B truck loan, in cents. */
// ponytail: assumes the only bank loan is the R24B loan with no payments made yet (true until Month 5 is simulated).
const TRUCK_LOAN_CURRENT = roundHalfUp(
  sum(amortization(SECOND_TRUCK.loan / 100, SECOND_TRUCK.apr, SECOND_TRUCK.termMonths, 12).rows.map((r) => r.principal)) * 100,
);
const TRUCK_PAYMENT = roundHalfUp(loanPayment(SECOND_TRUCK.loan / 100, SECOND_TRUCK.apr, SECOND_TRUCK.termMonths) * 100);
const ACHIEVEMENT_LABEL: Record<string, string> = { 'forecast-fixer': 'Forecast Fixer' };

type Cell = Cents | ReactNode;
interface Row { label: ReactNode; vals?: Cell[]; kind?: 'head' | 'group' | 'sub' | 'total' | 'indent' }

/** A statement table: row headers on the left, right-aligned amounts in each column. */
function FinTable({ caption, cols, rows, first = 'Line item' }: { caption: ReactNode; cols: string[]; rows: Row[]; first?: string }) {
  return (
    <TableScroll>
      <table className="fin">
        <caption>{caption}</caption>
        <thead><tr><th scope="col">{first}</th>{cols.map((c) => <th scope="col" className="num" key={c}>{c}</th>)}</tr></thead>
        <tbody>
          {rows.map((r, i) => r.kind === 'head' ? (
            <tr key={i} className="head"><th scope="colgroup" colSpan={cols.length + 1}>{r.label}</th></tr>
          ) : (
            <tr key={i} className={r.kind}>
              <th scope="row" className={r.kind === 'indent' ? 'indent' : undefined}>{r.label}</th>
              {(r.vals ?? []).map((v, j) => <td key={j} className="num">{typeof v === 'number' ? fmt(v) : v}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </TableScroll>
  );
}

function Toggle<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map(([id, text]) => <button key={id} type="button" aria-pressed={value === id} onClick={() => onChange(id)}>{text}</button>)}
    </div>
  );
}

function Picker({ label, value, options, onChange }: { label: string; value: string; options: [string, string][]; onChange: (v: string) => void }) {
  const id = useId();
  return (
    <div className="picker">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
      </select>
    </div>
  );
}

const Actual = () => <span className="tag actual">Actual</span>;
const ProForma = () => <span className="tag forecast">Pro forma</span>;
const Fail = ({ children }: { children: ReactNode }) => <div className="banner" role="alert">{children}</div>;

// ---------------------------------------------------------------- income statement

type Format = 'financial' | 'contribution';

function isRows(cols: IncomeStatement[], format: Format): Row[] {
  const v = (f: (s: IncomeStatement) => Cents) => cols.map(f);
  if (format === 'financial') {
    const accts = EXPENSE_ACCOUNTS.filter((a) => a !== 'interest' && cols.some((s) => s.expenses.some((x) => x.account === a)));
    return [
      { label: 'Sales revenue', vals: v((s) => s.grossSales) },
      ...(cols.some((s) => s.salesDiscounts) ? [{ label: 'Less sales discounts (contra revenue)', vals: v((s) => -s.salesDiscounts), kind: 'indent' as const }] : []),
      { label: 'Net sales', vals: v((s) => s.netSales), kind: 'sub' },
      { label: 'Operating expenses', kind: 'head' },
      ...accts.map((a) => ({ label: ACCOUNTS[a].label, vals: v((s) => s.expenses.find((x) => x.account === a)?.amount ?? 0), kind: 'indent' as const })),
      { label: 'Total operating expenses', vals: v((s) => s.operatingExpenses), kind: 'sub' },
      { label: 'Operating income', vals: v((s) => s.operatingIncome), kind: 'sub' },
      { label: 'Interest expense (non-operating)', vals: v((s) => s.interest) },
      { label: 'Net income', vals: v((s) => s.netIncome), kind: 'total' },
    ];
  }
  const group = (cls: ExpenseClass, title: string, total: (s: IncomeStatement) => Cents): Row[] => {
    const labels = [...new Set(cols.flatMap((s) => s.lines.filter((l) => l.cls === cls).map((l) => l.label)))];
    return [
      { label: title, kind: 'head' },
      ...labels.map((l) => ({ label: l, vals: v((s) => s.lines.find((x) => x.cls === cls && x.label === l)?.amount ?? 0), kind: 'indent' as const })),
      { label: `Total ${title.toLowerCase()}`, vals: v(total), kind: 'sub' },
    ];
  };
  return [
    { label: 'Net sales (after sales discounts)', vals: v((s) => s.netSales), kind: 'sub' },
    ...group('variable', 'Variable costs', (s) => s.variable),
    { label: 'Contribution margin', vals: v((s) => s.contributionMargin), kind: 'sub' },
    ...group('fixed', 'Fixed recurring costs', (s) => s.fixedRecurring),
    ...group('oneTime', 'One-time costs', (s) => s.oneTime),
    ...group('noncash', 'Depreciation', (s) => s.depreciation),
    { label: 'Operating income', vals: v((s) => s.operatingIncome), kind: 'sub' },
    { label: 'Interest expense (non-operating)', vals: v((s) => s.interest) },
    { label: 'Net income', vals: v((s) => s.netIncome), kind: 'total' },
  ];
}

function IncomeTable({ cols, format }: { cols: { label: string; events: JournalEvent[] }[]; format: Format }) {
  const st = cols.map((c) => incomeStatement(c.events));
  const bad = st.filter((s) => s.contributionMargin - s.fixedRecurring - s.oneTime - s.depreciation !== s.operatingIncome);
  return (
    <>
      {bad.length > 0 && <Fail>The contribution view does not add up to operating income. The journal has an expense line with the wrong behavior class.</Fail>}
      <FinTable caption={<>{format === 'financial' ? 'Income statement' : 'Contribution-format income statement'} <Actual /></>}
        cols={cols.map((c) => c.label)} rows={isRows(st, format)} />
    </>
  );
}

export function IncomeStatementView({ game, period, defaultFormat = 'financial' }: { game: GameState; period?: Month; defaultFormat?: Format }) {
  const closed = game.closes.map((c) => c.month);
  const latest = String(closed[closed.length - 1] ?? '');
  const [choice, setChoice] = useState(latest);
  const [format, setFormat] = useState<Format>(defaultFormat);

  if (!closed.length) {
    return (
      <div className="stack">
        <p>No month has closed yet. The first income statement posts at the Month 1 close, after Round 10. Until then, these are the pre-launch balances.</p>
        <BalanceSheetTable bs={balanceSheet(upTo(game, 0))} title="Pre-launch balance sheet" />
      </div>
    );
  }
  const options: [string, string][] = [...closed.map((m): [string, string] => [String(m), `Month ${m}`]), ...(closed.length >= 2 ? [['all', `Months 1–${closed[closed.length - 1]} side by side`] as [string, string]] : [])];
  const sel = period ? String(period) : options.some((o) => o[0] === choice) ? choice : latest;
  const cols = sel === 'all'
    ? [...closed.map((m) => ({ label: `Month ${m}`, events: inPeriod(game, m) })), { label: 'Total', events: game.journal.filter((e) => e.period >= 1 && e.period <= 4) }]
    : [{ label: `Month ${sel}`, events: inPeriod(game, Number(sel) as Month) }];
  return (
    <div className="stack">
      <div className="report-controls">
        {!period && <Picker label="Period" value={sel} options={options} onChange={setChoice} />}
        <Toggle label="Statement format" value={format} onChange={setFormat}
          options={[['financial', 'Financial format'], ['contribution', 'Contribution format']]} />
      </div>
      <IncomeTable cols={cols} format={format} />
      <p className="small muted">
        {format === 'financial'
          ? 'Financial format groups costs by account. Sales discounts reduce revenue as a contra account.'
          : 'Contribution format groups the same journal lines by how they behave: variable costs move with meals served, fixed costs do not.'}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------- balance sheet

function bsRows(list: BalanceSheet[]): Row[] {
  const v = (f: (b: BalanceSheet) => Cents) => list.map(f);
  const current = (b: BalanceSheet) => Math.min(b.bankLoan, b.bankLoan > 0 ? TRUCK_LOAN_CURRENT : 0);
  return [
    { label: 'Assets', kind: 'head' },
    { label: 'Cash', vals: v((b) => b.cash), kind: 'indent' },
    { label: 'Accounts receivable', vals: v((b) => b.accountsReceivable), kind: 'indent' },
    { label: 'Prepaid advertising', vals: v((b) => b.prepaidAdvertising), kind: 'indent' },
    { label: 'Refundable deposits', vals: v((b) => b.deposits), kind: 'indent' },
    { label: 'Equipment at cost', vals: v((b) => b.equipment), kind: 'indent' },
    { label: 'Less accumulated depreciation', vals: v((b) => -b.accumulatedDepreciation), kind: 'indent' },
    { label: 'Net property and equipment', vals: v((b) => b.netPPE), kind: 'sub' },
    { label: 'Total assets', vals: v((b) => b.totalAssets), kind: 'total' },
    { label: 'Liabilities', kind: 'head' },
    { label: 'Bank loan, current portion (principal due in the next 12 months)', vals: v(current), kind: 'indent' },
    { label: 'Bank loan, long-term portion', vals: v((b) => b.bankLoan - current(b)), kind: 'indent' },
    { label: 'Emergency bridge loan', vals: v((b) => b.bridgeLoan), kind: 'indent' },
    { label: 'Total liabilities', vals: v((b) => b.totalLiabilities), kind: 'sub' },
    { label: 'Equity', kind: 'head' },
    { label: "Owner's capital", vals: v((b) => b.ownerCapital), kind: 'indent' },
    { label: 'Retained earnings (cumulative net income)', vals: v((b) => b.retainedEarnings), kind: 'indent' },
    { label: 'Less owner distributions', vals: v((b) => -b.distributions), kind: 'indent' },
    { label: 'Total equity', vals: v((b) => b.totalEquity), kind: 'sub' },
    { label: 'Total liabilities and equity', vals: v((b) => b.totalLiabilities + b.totalEquity), kind: 'total' },
  ];
}

function Identity({ bs }: { bs: BalanceSheet }) {
  const right = bs.totalLiabilities + bs.totalEquity;
  return (
    <>
      <p className="identity">
        <span>Assets {fmt(bs.totalAssets)}</span><span>=</span><span>Liabilities {fmt(bs.totalLiabilities)} + Equity {fmt(bs.totalEquity)}</span>
        <span className={bs.balanced ? 'pos' : 'neg'}>{bs.balanced ? '✓ Balances' : `✗ Out of balance by ${fmt(bs.totalAssets - right)}`}</span>
      </p>
      {!bs.balanced && <Fail>The balance sheet does not balance: assets are {fmt(bs.totalAssets)} but liabilities plus equity are {fmt(right)}. This is an engine error; please report it.</Fail>}
    </>
  );
}

function BalanceSheetTable({ bs, title }: { bs: BalanceSheet; title: string }) {
  return (
    <div className="stack">
      <FinTable caption={<>{title} <Actual /></>} cols={['Amount']} rows={bsRows([bs])} />
      <Identity bs={bs} />
      {bs.bankLoan > 0 && <p className="small muted">The current portion is the principal in the first 12 scheduled payments of the {fmt(SECOND_TRUCK.loan)} truck loan (9% APR, 60 months). It is a presentation split; the journal holds one bank loan account.</p>}
    </div>
  );
}

export function BalanceSheetView({ game, asOf }: { game: GameState; asOf?: Period }) {
  const [choice, setChoice] = useState('latest');
  if (asOf !== undefined) return <BalanceSheetTable bs={balanceSheet(upTo(game, asOf))} title={`Balance sheet at ${asOf === 0 ? 'pre-launch' : `the end of Month ${asOf}`}`} />;
  const options: [string, string][] = [['latest', 'Latest posted'], ['0', 'Pre-launch'], ...game.closes.map((c): [string, string] => [String(c.month), `End of Month ${c.month}`])];
  const sel = options.some((o) => o[0] === choice) ? choice : 'latest';
  const events = sel === 'latest' ? game.journal : upTo(game, Number(sel) as Period);
  const hasM5 = game.journal.some((e) => e.period === 5);
  return (
    <div className="stack">
      <div className="report-controls"><Picker label="As of" value={sel} options={options} onChange={setChoice} /></div>
      <BalanceSheetTable bs={balanceSheet(events)} title={`Balance sheet, ${options.find((o) => o[0] === sel)![1].toLowerCase()}`} />
      {hasM5 && <p className="small muted">The start-of-Month-5 transactions (Rounds 24 and 25) post after the Month 4 close, so only the latest view includes them.</p>}
    </div>
  );
}

// ---------------------------------------------------------------- cash flow

export function CashFlowView({ game, period }: { game: GameState; period?: Period }) {
  const periods = periodsOf(game);
  const [choice, setChoice] = useState(String(periods[periods.length - 1]));
  const closed = new Set<number>(game.closes.map((c) => c.month));
  const label = (p: Period) => `${periodLabel(p)}${p >= 1 && p <= 4 && !closed.has(p) ? ' (in progress)' : ''}`;
  const p = (period ?? (periods.includes(Number(choice) as Period) ? Number(choice) : periods[periods.length - 1])) as Period;

  const open = balanceSheet(before(game, p));
  const close = balanceSheet(upTo(game, p));
  const cf = cashFlow(open.cash, inPeriod(game, p));
  const items = (keep: (i: (typeof cf.items)[number]) => boolean): Row[] => cf.items.filter(keep).map((i) => ({ label: i.memo, vals: [i.amount], kind: 'indent' }));
  const rows: Row[] = [
    { label: 'Opening cash', vals: [cf.opening], kind: 'sub' },
    { label: 'Operating receipts', vals: [cf.operatingIn], kind: 'group' }, ...items((i) => i.cf === 'operating' && i.amount >= 0),
    { label: 'Operating payments', vals: [cf.operatingOut], kind: 'group' }, ...items((i) => i.cf === 'operating' && i.amount < 0),
    { label: 'Investing', vals: [cf.investing], kind: 'group' }, ...items((i) => i.cf === 'investing'),
    { label: 'Financing', vals: [cf.financing], kind: 'group' }, ...items((i) => i.cf === 'financing'),
    { label: 'Closing cash', vals: [cf.closing], kind: 'total' },
  ];

  // Why profit and cash differ: every balance change except cash, from the same journal.
  const d = (f: (b: BalanceSheet) => Cents) => f(close) - f(open);
  const ni = incomeStatement(inPeriod(game, p)).netIncome;
  const recon: [string, Cents][] = ([
    ['Add back depreciation (no cash leaves)', d((b) => b.accumulatedDepreciation)],
    ['Less increase in accounts receivable', -d((b) => b.accountsReceivable)],
    ['Less increase in prepaid advertising', -d((b) => b.prepaidAdvertising)],
    ['Less deposits paid', -d((b) => b.deposits)],
    ['Less equipment bought', -d((b) => b.equipment)],
    ['Bank loan borrowed', d((b) => b.bankLoan)],
    ['Bridge loan borrowed', d((b) => b.bridgeLoan)],
    ['Owner contributions', d((b) => b.ownerCapital)],
    ['Less owner distributions', -d((b) => b.distributions)],
  ] as [string, Cents][]).filter(([, a]) => a !== 0);
  const change = cf.closing - cf.opening;
  const reconOk = ni + sum(recon.map(([, a]) => a)) === change;

  return (
    <div className="stack">
      {period === undefined && (
        <div className="report-controls">
          <Picker label="Period" value={String(p)} options={periods.map((x) => [String(x), label(x)])} onChange={setChoice} />
        </div>
      )}
      {cf.closing !== close.cash && <Fail>The cash bridge closes at {fmt(cf.closing)} but the ledger shows {fmt(close.cash)} of cash. This is an engine error; please report it.</Fail>}
      <FinTable caption={<>Cash receipts and payments, {label(p).toLowerCase()} <Actual /></>} cols={['Amount']} rows={rows} />
      <FinTable caption="Profit versus cash" cols={['Amount']} rows={[
        { label: 'Net income for the period', vals: [ni], kind: 'sub' },
        ...recon.map(([l, a]): Row => ({ label: l, vals: [a], kind: 'indent' })),
        { label: 'Change in cash', vals: [change], kind: 'total' },
      ]} />
      {!reconOk && <Fail>Net income plus the balance changes does not equal the change in cash. This is an engine error; please report it.</Fail>}
    </div>
  );
}

// ---------------------------------------------------------------- demand and variance

export function DemandTable({ calc, caption }: { calc: MonthCalc; caption?: string }) {
  const used = calc.capacity ? Math.round((calc.fulfilled / calc.capacity) * 100) : 0;
  return (
    <div className="stack">
      <TableScroll>
        <table className="fin">
          <caption>{caption ?? `Month ${calc.month} orders by customer group`}</caption>
          <thead>
            <tr>
              <th scope="col">Customer group</th><th scope="col" className="num">Priority tier</th><th scope="col" className="num">Demand</th>
              <th scope="col" className="num">Served</th><th scope="col" className="num">Lost</th><th scope="col" className="num">Price</th>
              <th scope="col" className="num">Unit variable cost</th><th scope="col" className="num">Unit CM</th><th scope="col" className="num">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {calc.cohorts.map((c) => (
              <tr key={c.id}>
                <th scope="row">{c.label}</th><td className="num">{c.tier}</td><td className="num">{fmtUnits(c.demand)}</td>
                <td className="num">{fmtUnits(c.fulfilled)}</td><td className="num">{fmtUnits(c.lost)}</td><td className="num">{fmt(c.price)}</td>
                <td className="num">{fmt(c.unitVariable)}</td><td className="num">{fmt(c.price - c.unitVariable)}</td><td className="num">{fmt(c.revenue)}</td>
              </tr>
            ))}
            <tr className="total">
              <th scope="row">Total</th><td /><td className="num">{fmtUnits(calc.totalDemand)}</td><td className="num">{fmtUnits(calc.fulfilled)}</td>
              <td className="num">{fmtUnits(calc.lost)}</td><td /><td /><td /><td className="num">{fmt(calc.revenue)}</td>
            </tr>
          </tbody>
        </table>
      </TableScroll>
      <div>
        <div className="bar capbar" role="img" aria-label={`Capacity used: ${calc.fulfilled} of ${calc.capacity} meals, ${used} percent`}>
          <span style={{ width: `${Math.min(used, 100)}%` }} />
        </div>
        <p className="small">
          Served {fmtUnits(calc.fulfilled)} of {fmtUnits(calc.capacity)} meals of capacity ({used}%).{' '}
          {calc.lost ? `${fmtUnits(calc.lost)} orders were lost because the kitchen ran out of capacity; the lowest priority tiers lose orders first.` : 'No orders were lost.'}
          {calc.capacity > calc.baseCapacity && ` Capacity includes ${fmtUnits(calc.capacity - calc.baseCapacity)} overtime meals.`}
          {calc.overtimeUnits > 0 && ` ${fmtUnits(calc.overtimeUnits)} meals ran on overtime, costing ${fmt(calc.overtimeCost)} in overtime labor (a variable cost outside the unit costs above).`}
        </p>
      </div>
    </div>
  );
}

function StaticBudget({ b }: { b: MonthCalc }) {
  return (
    <div className="stack">
      <p><span className="tag">Frozen after R15</span> The Month 3 static budget uses every decision through Round 15, with no weather and no waste surcharge, because standards describe the planned recipe. Month 3 has not closed yet.</p>
      <DemandTable calc={b} caption="Budgeted Month 3 orders by customer group" />
      <FinTable caption="Month 3 static budget" cols={['Budget']} rows={[
        { label: 'Revenue', vals: [b.revenue] },
        { label: 'Variable costs', vals: [b.variableCost] },
        { label: 'Contribution margin', vals: [b.contributionMargin], kind: 'sub' },
        { label: 'Fixed costs', kind: 'head' },
        ...[...b.recurring, ...b.oneTime].map((f): Row => ({ label: f.label, vals: [f.amount], kind: 'indent' })),
        ...b.depreciation.map((f): Row => ({ label: `Depreciation: ${f.label}`, vals: [f.amount], kind: 'indent' })),
        { label: 'Total fixed costs', vals: [b.fixedTotal + b.oneTimeTotal + b.depreciationTotal], kind: 'sub' },
        { label: 'Budgeted operating income', vals: [b.operatingIncome], kind: 'total' },
      ]} />
    </div>
  );
}

export function VarianceView({ game }: { game: GameState }) {
  const b = game.budgetM3;
  if (!b) return <p>The Month 3 budget freezes after Round 15. Decide Round 15 to see it here.</p>;
  const close3 = game.closes.find((c) => c.month === 3);
  if (!close3) return <StaticBudget b={b} />;
  const a = close3.calc;
  const r = varianceReport(b, a);
  const flexRev = a.revenue - r.salesPriceVariance;
  const flexVar = a.variableCost + r.variableCostVariance;
  const consistent = flexRev - flexVar - r.budgetFixed === r.flexibleIncome
    && r.salesPriceVariance + r.variableCostVariance + r.fixedCostVariance === r.flexibleBudgetVariance;
  const V = (c: Cents) => <Variance c={c} />;
  return (
    <div className="stack">
      {!consistent && <Fail>The variance pieces do not add up to the flexible-budget totals. This is an engine error; please report it.</Fail>}
      <FinTable caption={<>Month 3: static budget, flexible budget and actual <Actual /></>} cols={['Static', 'Flexible', 'Actual']} rows={[
        { label: 'Revenue', vals: [b.revenue, flexRev, a.revenue] },
        { label: 'Variable costs', vals: [b.variableCost, flexVar, a.variableCost] },
        { label: 'Contribution margin', vals: [b.contributionMargin, flexRev - flexVar, a.contributionMargin], kind: 'sub' },
        { label: 'Fixed costs (incl. one-time and depreciation)', vals: [r.budgetFixed, r.budgetFixed, r.actualFixed] },
        { label: 'Operating income', vals: [r.staticIncome, r.flexibleIncome, r.actualIncome], kind: 'total' },
      ]} />
      <FinTable caption="Month 3 variances (F = favorable, U = unfavorable)" cols={['Variance']} rows={[
        { label: 'Net sales volume variance (flexible − static)', kind: 'head' },
        ...r.rows.map((x): Row => ({ label: `${x.label}: (${fmtUnits(x.actualUnits)} − ${fmtUnits(x.budgetUnits)} meals) × ${fmt(x.budgetUnitCM)} budgeted unit CM`, vals: [V(x.volumeVariance)], kind: 'indent' })),
        { label: 'Net sales volume variance', vals: [V(r.netSalesVolumeVariance)], kind: 'sub' },
        { label: 'Flexible-budget variance (actual − flexible)', kind: 'head' },
        { label: 'Sales price variance', vals: [V(r.salesPriceVariance)], kind: 'indent' },
        { label: 'Materials quantity variance (waste)', vals: [V(r.wasteVariance)], kind: 'indent' },
        { label: 'Other variable cost variance', vals: [V(r.otherVariableVariance)], kind: 'indent' },
        { label: 'Fixed cost variance', vals: [V(r.fixedCostVariance)], kind: 'indent' },
        { label: 'Flexible-budget variance', vals: [V(r.flexibleBudgetVariance)], kind: 'sub' },
        { label: 'Total variance (actual − static)', vals: [V(r.actualIncome - r.staticIncome)], kind: 'total' },
      ]} />
      <FinTable caption="Fixed cost variance by line" cols={['Budget', 'Actual', 'Variance']} rows={r.fixedLines.map((f): Row => ({ label: f.label, vals: [f.budget, f.actual, V(f.budget - f.actual)] }))} />
      <div className="callout">
        <p>Easton calls the contribution-based figure the net sales volume variance. Measured on revenue alone, the sales volume variance is {V(r.revenueSalesVolumeVariance)}.</p>
        <p>The bad weather cut walk-up demand. A volume shortfall from weather is not a cost the kitchen manager controls; judge the kitchen on the flexible-budget variance.</p>
        <p>The Round 18 labor overrun appears under fixed costs because your crew is paid as a fixed monthly payroll in this model. The Round 18 knowledge check splits the same overrun the textbook way: $396 rate variance plus $360 efficiency variance = $756 U.</p>
      </div>
    </div>
  );
}

function JournalByPeriod({ game }: { game: GameState }) {
  return (
    <div className="stack">
      {periodsOf(game).map((p) => (
        <section key={p}><h3>{periodLabel(p)}</h3><JournalView events={inPeriod(game, p)} /></section>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- reports dialog

type Tab = 'is' | 'bs' | 'cf' | 'var' | 'journal';
const TABS: { id: Tab; label: string }[] = [
  { id: 'is', label: 'Income statement' }, { id: 'bs', label: 'Balance sheet' }, { id: 'cf', label: 'Cash flow' },
  { id: 'var', label: 'Budget & variance' }, { id: 'journal', label: 'Journal' },
];

export function ReportsDialog({ open, onClose, game, truckName }: { open: boolean; onClose: () => void; game: GameState; truckName: string }) {
  const [tab, setTab] = useState<Tab>('is');
  return (
    <Sheet open={open} onClose={onClose} title={`${truckName}: the books`}>
      <Tabs tabs={TABS} value={tab} onChange={setTab} label="Financial reports" />
      <div role="tabpanel" aria-label={TABS.find((t) => t.id === tab)!.label}>
        {tab === 'is' && <IncomeStatementView game={game} />}
        {tab === 'bs' && <BalanceSheetView game={game} />}
        {tab === 'cf' && <CashFlowView game={game} />}
        {tab === 'var' && <VarianceView game={game} />}
        {tab === 'journal' && <JournalByPeriod game={game} />}
      </div>
    </Sheet>
  );
}

// ---------------------------------------------------------------- month close

export function MonthCloseView({ month, game, truckName, onContinue, onRescue, onRestartChapter }: {
  month: Month; game: GameState; truckName: string; onContinue: () => void; onRescue: (k: Rescue) => void; onRestartChapter: () => void;
}) {
  const ref = useFocusHeading(`close-${month}`);
  const close = game.closes.find((c) => c.month === month);
  const pending = game.pendingRescue?.month === month ? game.pendingRescue : undefined;
  if (!close) {
    return <div className="stack"><h1 ref={ref} tabIndex={-1}>Month {month} is not closed</h1><Fail>The ledger has no Month {month} close. Reload the game or restart this chapter.</Fail></div>;
  }
  const is = incomeStatement(inPeriod(game, month));
  const priorCash = balanceSheet(before(game, month)).cash;
  const rescueAmount = pending ? pending.shortfall + RESERVE_FLOOR : 0;
  return (
    <div className="stack">
      <h1 ref={ref} tabIndex={-1}>Month {month} is closed</h1>
      {pending && (
        <section className="rescue" aria-labelledby="rescue-h">
          <h2 id="rescue-h">Emergency funding needed</h2>
          <p>{truckName} has <strong>{fmt(-pending.shortfall)}</strong> of cash after the Month {month} close. A business cannot run on negative cash, so play stops until you cover the shortfall plus a {fmt(RESERVE_FLOOR)} buffer.</p>
          <div className="rescue-options">
            <div>
              <button className="btn primary" onClick={() => onRescue('equity')}>Owner contributes {fmt(rescueAmount)}</button>
              <p className="small">Equity. You put in more of your own money: cash and owner's capital both rise. It is not revenue and never counts as profit.</p>
            </div>
            <div>
              <button className="btn" onClick={() => onRescue('loan')}>Take a {fmt(rescueAmount)} bridge loan</button>
              <p className="small">Liability. Cash and the bridge loan both rise. Interest of {BRIDGE_RATE_MONTHLY * 100}% a month ({fmt(pct(rescueAmount, BRIDGE_RATE_MONTHLY))}) is paid in cash from next month, as a non-operating expense.</p>
            </div>
            <div>
              <button className="btn" onClick={onRestartChapter}>Restart this chapter</button>
              <p className="small">Reload your decisions from the start of this chapter and try a different path.</p>
            </div>
          </div>
        </section>
      )}
      {close.rescue && (
        <p className="callout">
          Month {month} needed an emergency {close.rescue.kind === 'equity' ? 'owner contribution' : 'bridge loan'} of {fmt(close.rescue.amount)}. The journal records it as financing.
          It does not count as profit: operating income and net income exclude it.
        </p>
      )}

      <div className="kpis">
        <div className="kpi"><div className="label">Net sales</div><div className="value">{fmt(is.netSales)}</div></div>
        <div className="kpi"><div className="label">Contribution margin</div><div className="value">{fmt(is.contributionMargin)}</div></div>
        <div className="kpi"><div className="label">Operating income</div><div className="value">{fmt(is.operatingIncome)}</div></div>
        <div className="kpi">
          <div className="label">Cash at close</div><div className="value">{fmt(close.cashAfter)}</div>
          <div className="delta"><Delta before={priorCash} after={close.cashAfter} /> <span className="muted">vs {month === 1 ? 'pre-launch' : `Month ${month - 1} close`}</span></div>
        </div>
      </div>

      <section className="card stack">
        <h2>Orders and capacity</h2>
        <DemandTable calc={close.calc} />
        {is.grossSales !== close.calc.revenue && (
          <p className="small">Gross sales of {fmt(is.grossSales)} also include {fmt(is.grossSales - close.calc.revenue)} from the corporate order, which the kitchen produced outside truck capacity.</p>
        )}
        <details>
          <summary>How demand was built</summary>
          <ul>{close.calc.demandNotes.map((n) => <li key={n}>{n}</li>)}</ul>
        </details>
      </section>
      <section className="card"><h2>Income statement</h2><IncomeStatementView game={game} period={month} defaultFormat="contribution" /></section>
      <section className="card"><h2>Cash bridge</h2><CashFlowView game={game} period={month} /></section>
      <section className="card"><h2>Balance sheet</h2><BalanceSheetView game={game} asOf={month} /></section>
      {month === 3 && game.budgetM3 && <section className="card"><h2>Budget and variance</h2><VarianceView game={game} /></section>}
      <details className="card">
        <summary>Month {month} journal entries</summary>
        <JournalView events={inPeriod(game, month)} />
      </details>

      <div className="btn-row">
        <button className="btn primary" onClick={onContinue} disabled={!!pending}>{month === 4 ? 'Go to expansion decisions' : 'See the chapter checkpoint'}</button>
        {pending && <span className="small">Choose how to cover the cash shortfall first.</span>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- final report

const TRUCK_SIZE: Record<string, TruckVariant> = { A: 'used', B: 'refurbished', C: 'premium' };

export function FinalReport({ game, save, score, onRestart, onBonus }: { game: GameState; save: Save; score: number; onRestart: () => void; onBonus: () => void }) {
  const ref = useFocusHeading('final');
  const [copy, setCopy] = useState<{ ok: boolean; msg: string }>();
  const [armed, setArmed] = useState(false);

  const months = game.closes.map((c) => ({ m: c.month, calc: c.calc, cash: c.cashAfter, rescue: c.rescue, is: incomeStatement(inPeriod(game, c.month)) }));
  const total = incomeStatement(game.journal.filter((e) => e.period >= 1 && e.period <= 4));
  const bsM4 = balanceSheet(upTo(game, 4));
  const bsFinal = balanceSheet(game.journal);
  const m5 = inPeriod(game, 5);
  const truck = game.journal.find((e) => e.id === 'R24-secondTruck');
  const financed = !!truck?.lines.some((l) => l.account === 'bankLoan');
  const firstRow = amortization(SECOND_TRUCK.loan / 100, SECOND_TRUCK.apr, SECOND_TRUCK.termMonths, 1).rows[0];
  const truckDep = monthlyDepreciation(SECOND_TRUCK.cost, SECOND_TRUCK.salvage, SECOND_TRUCK.lifeMonths, 1);

  // Diagnostics
  const avgFixed = months.length ? sum(months.map((x) => x.calc.fixedTotal)) / months.length : 0;
  const coverage = avgFixed > 0 ? bsFinal.cash / avgFixed : null;
  const rescues = months.filter((x) => x.rescue);
  const allBalanced = [upTo(game, 0), ...game.closes.map((c) => upTo(game, c.month)), game.journal].every((ev) => balanceSheet(ev).balanced);
  const achievements = [
    ...game.achievements.map((a) => ACHIEVEMENT_LABEL[a] ?? a),
    ...(rescues.length ? [] : ['Cash Guardian']),
    ...(allBalanced ? ['Investor Ready'] : []),
  ];

  // Feedback from the actual numbers
  const best = months.reduce((x, y) => (y.is.operatingIncome > x.is.operatingIncome ? y : x), months[0]);
  const lost = sum(months.map((x) => x.calc.lost));
  const worst = months.reduce((x, y) => (y.calc.lost > x.calc.lost ? y : x), months[0]);
  const r21 = game.journal.find((e) => e.id === 'R21-corporateOrder');
  const r21line = (acct: string) => r21?.lines.find((l) => l.account === acct);
  const credit = r21line('salesDiscounts') ? `You gave a ${fmt(r21line('salesDiscounts')!.dr)} early-payment discount on the corporate order to collect the cash at once.`
    : r21line('factoringFee') ? `You factored the corporate invoice, paying a ${fmt(r21line('factoringFee')!.dr)} fee to turn the receivable into cash.`
    : bsFinal.accountsReceivable > 0 ? `You sold the corporate order on credit, so ${fmt(bsFinal.accountsReceivable)} of earned revenue sits in accounts receivable, not cash.` : undefined;
  const debt = bsFinal.totalLiabilities === 0 ? 'no debt' : `${fmt(bsFinal.totalLiabilities)} of debt`;
  const financing = !truck ? `You kept one truck, ${fmt(bsFinal.cash)} of cash and ${debt}. A conservative path like this can be a sound decision when demand and cash are uncertain.`
    : financed ? `You financed the second truck with a ${fmt(SECOND_TRUCK.loan)} bank loan, which starts ${fmt(TRUCK_PAYMENT)} monthly payments in Month 5. A conservative path, such as waiting, can also be a sound decision.`
    : `You paid cash for the second truck, leaving ${fmt(bsFinal.cash)} of cash and ${debt}. A conservative path, such as waiting, can also be a sound decision.`;
  // Three items, at most four sentences: strongest month, then the most telling of capacity or credit, then financing.
  const shown = best ? [
    `Month ${best.m} was your strongest month, with ${fmt(best.is.operatingIncome)} of operating income.`,
    lost ? `You turned away ${fmtUnits(lost)} orders, ${fmtUnits(worst.calc.lost)} of them in Month ${worst.m}, so kitchen capacity was the binding constraint.`
      : credit ?? 'The truck served every order, so demand set your sales and capacity never bound.',
    financing,
  ] : [financing];

  const text = [
    `Startup Survivor investor report: ${save.truckName}`,
    `Accounting mastery: ${score}/100`,
    ...months.map((x) => `Month ${x.m}: net sales ${fmt(x.is.netSales)}, contribution margin ${fmt(x.is.contributionMargin)}, operating income ${fmt(x.is.operatingIncome)}, net income ${fmt(x.is.netIncome)}, ending cash ${fmt(x.cash)}`),
    `Four months: net sales ${fmt(total.netSales)}, operating income ${fmt(total.operatingIncome)}, net income ${fmt(total.netIncome)}`,
    `Final balance sheet: assets ${fmt(bsFinal.totalAssets)}, liabilities ${fmt(bsFinal.totalLiabilities)}, equity ${fmt(bsFinal.totalEquity)} (${bsFinal.balanced ? 'balances' : 'DOES NOT BALANCE'})`,
    `Ending cash ${fmt(bsFinal.cash)}; reserve coverage ${coverage === null ? 'n/a' : `${coverage.toFixed(1)} months`}; emergency rescues ${rescues.length}`,
    `Achievements: ${achievements.join(', ') || 'none'}`,
    shown.join(' '),
  ].join('\n');

  async function copyReport() {
    try {
      if (!navigator.clipboard) throw new Error('this browser blocks clipboard access on this page');
      await navigator.clipboard.writeText(text);
      setCopy({ ok: true, msg: 'Report copied.' });
    } catch (e) {
      setCopy({ ok: false, msg: `Copy failed: ${(e as Error).message}. Open "Plain-text report" below and copy it by hand.` });
    }
  }

  const resultsRow = (label: string, f: (x: (typeof months)[number]) => Cents, t: Cell, kind?: Row['kind']): Row => ({ label, vals: [...months.map(f), t], kind });
  const cmpRows = bsRows([bsM4, bsFinal]).map((r): Row => r.vals ? { ...r, vals: [...r.vals, <Money c={(r.vals[1] as Cents) - (r.vals[0] as Cents)} sign key="d" />] } : r);

  return (
    <div className="stack">
      <header className="final-head">
        <div>
          <p className="muted">Investor committee report</p>
          <h1 ref={ref} tabIndex={-1}>{save.truckName}</h1>
          <p>Four months of results, the start-of-Month-5 moves and what the books say now.</p>
        </div>
        <TruckHero name={save.truckName} size={TRUCK_SIZE[save.choices.R01 ?? 'B']} className="final-art" />
      </header>

      <section className="card">
        <FinTable caption={<>Four-month results <Actual /></>} first="Measure" cols={[...months.map((x) => `Month ${x.m}`), 'Total']} rows={[
          resultsRow('Net sales', (x) => x.is.netSales, total.netSales),
          resultsRow('Contribution margin', (x) => x.is.contributionMargin, total.contributionMargin),
          resultsRow('Operating income', (x) => x.is.operatingIncome, total.operatingIncome, 'sub'),
          resultsRow('Net income', (x) => x.is.netIncome, total.netIncome, 'sub'),
          resultsRow('Ending cash', (x) => x.cash, <span className="muted small" key="n">not summed</span>),
        ]} />
        <p className="small muted">Cash is a balance, so it has no four-month total.</p>
      </section>

      <section className="card stack">
        <h2>Start of Month 5</h2>
        {m5.length ? <JournalView events={m5} /> : <p>You made no start-of-Month-5 transactions: no second truck, distribution or prepaid advertising.</p>}
        <FinTable caption={<>Balance sheet: Month 4 close and after Rounds 24 and 25 <Actual /></>} cols={['End of Month 4', 'Final', 'Change']} rows={cmpRows} />
      </section>

      <section className="card stack">
        <h2>Final balance sheet</h2>
        <BalanceSheetTable bs={bsFinal} title="Final balance sheet" />
      </section>

      {(truck || bsFinal.bridgeLoan > 0) && (
        <section className="card stack">
          <h2>Month 5 outlook <ProForma /></h2>
          <p className="small">These are projections, not results. Month 5 is not simulated.</p>
          <ul>
            {truck && <li>Second truck depreciation: ({fmt(SECOND_TRUCK.cost)} − {fmt(SECOND_TRUCK.salvage)} salvage) / {SECOND_TRUCK.lifeMonths} months = {fmt(truckDep)} a month, starting in Month 5.</li>}
            {financed && <li>Bank loan payment: {fmt(TRUCK_PAYMENT)} a month beginning next month. The first payment is {fmt(roundHalfUp(firstRow.interest * 100))} interest expense and {fmt(roundHalfUp(firstRow.principal * 100))} principal; only the interest reduces income.</li>}
            {bsFinal.bridgeLoan > 0 && <li>Bridge loan interest pending: {BRIDGE_RATE_MONTHLY * 100}% of {fmt(bsFinal.bridgeLoan)} = {fmt(pct(bsFinal.bridgeLoan, BRIDGE_RATE_MONTHLY))} at the Month 5 close, a non-operating expense paid in cash.</li>}
          </ul>
        </section>
      )}

      <section className="two">
        <div className="card">
          <h2>Accounting mastery</h2>
          <p className="final-score">{score}<span className="muted">/100</span></p>
          <p className="small muted">From the 25 knowledge checks. This score is separate from business results.</p>
        </div>
        <div className="card">
          <h2>Business performance</h2>
          <dl className="diag">
            <dt>Cumulative operating income</dt><dd>{fmt(total.operatingIncome)}</dd>
            <dt>Ending cash</dt><dd>{fmt(bsFinal.cash)}</dd>
            <dt>Cash reserve coverage</dt>
            <dd>{coverage === null ? 'n/a' : `${coverage.toFixed(1)} months`}</dd>
            <dt>Emergency rescues used</dt><dd>{rescues.length}</dd>
          </dl>
          <p className="small muted">Coverage is ending cash divided by average monthly recurring fixed cash costs ({fmt(roundHalfUp(avgFixed))}).</p>
        </div>
      </section>

      <section className="card stack">
        <h2>Achievements</h2>
        {achievements.length ? <ul className="achievements">{achievements.map((a) => <li key={a}>{a}</li>)}</ul> : <p>No achievements this run.</p>}
        {!allBalanced && <Fail>At least one balance sheet does not balance, so Investor Ready is withheld. This is an engine error; please report it.</Fail>}
      </section>

      <section className="card">
        <h2>What the numbers say</h2>
        <p>{shown.join(' ')}</p>
      </section>

      <div className="stack">
        <div className="btn-row">
          <button className="btn" onClick={copyReport}>Copy report</button>
          <button className="btn primary" onClick={onBonus}>Try the Mastery Lab</button>
          <button className="btn" onClick={() => (armed ? onRestart() : setArmed(true))} onBlur={() => setArmed(false)}>
            {armed ? 'Click again to erase this save' : 'Start a new company'}
          </button>
        </div>
        <p role="status" className={copy ? (copy.ok ? 'pos' : 'neg') : undefined}>{copy?.msg}</p>
        <details>
          <summary>Plain-text report</summary>
          <textarea className="copy-text" readOnly value={text} aria-label="Plain-text report" rows={10} />
        </details>
      </div>
    </div>
  );
}
