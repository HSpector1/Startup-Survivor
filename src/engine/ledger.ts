// Double-entry ledger: chart of accounts, balanced journal events, balances and statements.
import { assertCents, type Cents } from './money';
import type { Period } from './model';

export type AccountType = 'asset' | 'contraAsset' | 'liability' | 'equity' | 'contraEquity' | 'revenue' | 'contraRevenue' | 'expense';
export type ExpenseClass = 'variable' | 'fixed' | 'oneTime' | 'noncash' | 'nonOperating';

export const ACCOUNTS = {
  cash: { type: 'asset', label: 'Cash' },
  accountsReceivable: { type: 'asset', label: 'Accounts receivable' },
  prepaidAdvertising: { type: 'asset', label: 'Prepaid advertising' },
  deposits: { type: 'asset', label: 'Refundable deposits' },
  equipment: { type: 'asset', label: 'Equipment at cost' },
  accumulatedDepreciation: { type: 'contraAsset', label: 'Accumulated depreciation' },
  bankLoan: { type: 'liability', label: 'Bank loan payable' },
  bridgeLoan: { type: 'liability', label: 'Emergency bridge loan' },
  ownerCapital: { type: 'equity', label: "Owner's capital" },
  ownerDistributions: { type: 'contraEquity', label: 'Owner distributions' },
  sales: { type: 'revenue', label: 'Sales revenue' },
  salesDiscounts: { type: 'contraRevenue', label: 'Sales discounts' },
  foodCost: { type: 'expense', label: 'Food, packaging & card fees' },
  cateringDirect: { type: 'expense', label: 'Catering event packaging & transport' },
  corporateOrderCost: { type: 'expense', label: 'Corporate order production cost' },
  deliveryCommission: { type: 'expense', label: 'Delivery app commission' },
  locationFees: { type: 'expense', label: 'Per-order location fees' },
  overtime: { type: 'expense', label: 'Overtime labor' },
  payroll: { type: 'expense', label: 'Payroll' },
  rent: { type: 'expense', label: 'Site rent' },
  utilities: { type: 'expense', label: 'Utilities' },
  insurance: { type: 'expense', label: 'Insurance' },
  marketing: { type: 'expense', label: 'Marketing & advertising' },
  training: { type: 'expense', label: 'Training & coaching' },
  otherOperating: { type: 'expense', label: 'Onboarding, setup & menu support' },
  repairs: { type: 'expense', label: 'Repairs & maintenance' },
  equipmentRental: { type: 'expense', label: 'Equipment rental' },
  factoringFee: { type: 'expense', label: 'Factoring fee (loss on sale of receivable)' },
  depreciation: { type: 'expense', label: 'Depreciation expense' },
  interest: { type: 'expense', label: 'Interest expense' },
} as const satisfies Record<string, { type: AccountType; label: string }>;

export type Account = keyof typeof ACCOUNTS;
export type CashFlowClass = 'operating' | 'investing' | 'financing';

export interface Line {
  account: Account;
  dr: Cents;
  cr: Cents;
  memo: string;
  /** Expense behavior for the managerial (contribution) view. */
  cls?: ExpenseClass;
  /** Cash-flow statement class, required on every cash line. */
  cf?: CashFlowClass;
}

export interface JournalEvent {
  id: string;
  round: string;
  period: Period;
  memo: string;
  lines: Line[];
}

export const dr = (account: Account, amt: Cents, memo: string, extra: Partial<Line> = {}): Line => ({ account, dr: amt, cr: 0, memo, ...extra });
export const cr = (account: Account, amt: Cents, memo: string, extra: Partial<Line> = {}): Line => ({ account, dr: 0, cr: amt, memo, ...extra });

export function validateEvent(e: JournalEvent): void {
  let d = 0, c = 0;
  for (const l of e.lines) {
    assertCents(l.dr, `${e.id} ${l.account} debit`);
    assertCents(l.cr, `${e.id} ${l.account} credit`);
    if (l.dr < 0 || l.cr < 0) throw new Error(`${e.id}: negative amount on ${l.account}`);
    if (l.dr > 0 && l.cr > 0) throw new Error(`${e.id}: line on ${l.account} has both debit and credit`);
    if (l.account === 'cash' && (l.dr || l.cr) && !l.cf) throw new Error(`${e.id}: cash line without cash-flow class`);
    d += l.dr; c += l.cr;
  }
  if (d !== c) throw new Error(`${e.id}: debits ${d} ≠ credits ${c}`);
  if (d === 0) throw new Error(`${e.id}: empty journal event`);
}

/** Drop zero lines; a journal never shows $0.00 rows. */
export function event(id: string, round: string, period: Period, memo: string, lines: Line[]): JournalEvent {
  const e = { id, round, period, memo, lines: lines.filter((l) => l.dr !== 0 || l.cr !== 0) };
  validateEvent(e);
  return e;
}

export type Balances = Record<Account, Cents>;

/** Debit-positive balances for every account across the given events. */
export function balances(events: JournalEvent[]): Balances {
  const b = Object.fromEntries(Object.keys(ACCOUNTS).map((k) => [k, 0])) as Balances;
  for (const e of events) for (const l of e.lines) b[l.account] += l.dr - l.cr;
  return b;
}

const ofType = (t: AccountType) => (Object.keys(ACCOUNTS) as Account[]).filter((a) => ACCOUNTS[a].type === t);
export const EXPENSE_ACCOUNTS = ofType('expense');

export interface IncomeStatement {
  grossSales: Cents;
  salesDiscounts: Cents;
  netSales: Cents;
  expenses: { account: Account; label: string; amount: Cents }[];
  operatingExpenses: Cents;
  operatingIncome: Cents;
  interest: Cents;
  netIncome: Cents;
  /** Contribution format from the same lines. */
  variable: Cents;
  contributionMargin: Cents;
  fixedRecurring: Cents;
  oneTime: Cents;
  depreciation: Cents;
  lines: { label: string; account: Account; cls: ExpenseClass; amount: Cents }[];
}

export function incomeStatement(events: JournalEvent[]): IncomeStatement {
  const b = balances(events);
  const grossSales = 0 - b.sales;
  const salesDiscounts = b.salesDiscounts;
  const netSales = grossSales - salesDiscounts;
  const expenses = EXPENSE_ACCOUNTS.filter((a) => a !== 'interest' && b[a] !== 0).map((a) => ({ account: a, label: ACCOUNTS[a].label, amount: b[a] }));
  const operatingExpenses = expenses.reduce((s, x) => s + x.amount, 0);
  const operatingIncome = netSales - operatingExpenses;
  const interest = b.interest;

  const byCls: Record<ExpenseClass, Cents> = { variable: 0, fixed: 0, oneTime: 0, noncash: 0, nonOperating: 0 };
  const lineMap = new Map<string, { label: string; account: Account; cls: ExpenseClass; amount: Cents }>();
  for (const e of events) for (const l of e.lines) {
    if (ACCOUNTS[l.account].type !== 'expense') continue;
    const cls = l.cls ?? (() => { throw new Error(`${e.id}: expense line ${l.account} has no behavior class`); })();
    const amt = l.dr - l.cr;
    byCls[cls] += amt;
    const key = `${cls}|${l.memo}`;
    const cur = lineMap.get(key) ?? { label: l.memo, account: l.account, cls, amount: 0 };
    cur.amount += amt;
    lineMap.set(key, cur);
  }
  if (byCls.nonOperating !== interest) throw new Error('Non-operating lines do not equal interest expense');
  return {
    grossSales, salesDiscounts, netSales, expenses, operatingExpenses, operatingIncome, interest,
    netIncome: operatingIncome - interest,
    variable: byCls.variable,
    contributionMargin: netSales - byCls.variable,
    fixedRecurring: byCls.fixed,
    oneTime: byCls.oneTime,
    depreciation: byCls.noncash,
    lines: [...lineMap.values()].filter((l) => l.amount !== 0),
  };
}

export interface BalanceSheet {
  cash: Cents; accountsReceivable: Cents; prepaidAdvertising: Cents; deposits: Cents;
  equipment: Cents; accumulatedDepreciation: Cents; netPPE: Cents; totalAssets: Cents;
  bankLoan: Cents; bridgeLoan: Cents; totalLiabilities: Cents;
  ownerCapital: Cents; retainedEarnings: Cents; distributions: Cents; totalEquity: Cents;
  balanced: boolean;
}

export function balanceSheet(events: JournalEvent[]): BalanceSheet {
  const b = balances(events);
  const netPPE = b.equipment + b.accumulatedDepreciation;
  const totalAssets = b.cash + b.accountsReceivable + b.prepaidAdvertising + b.deposits + netPPE;
  const totalLiabilities = 0 - (b.bankLoan + b.bridgeLoan);
  const retainedEarnings = incomeStatement(events).netIncome;
  const totalEquity = 0 - b.ownerCapital - b.ownerDistributions + retainedEarnings;
  return {
    cash: b.cash, accountsReceivable: b.accountsReceivable, prepaidAdvertising: b.prepaidAdvertising, deposits: b.deposits,
    equipment: b.equipment, accumulatedDepreciation: 0 - b.accumulatedDepreciation, netPPE, totalAssets,
    bankLoan: 0 - b.bankLoan, bridgeLoan: 0 - b.bridgeLoan, totalLiabilities,
    ownerCapital: 0 - b.ownerCapital, retainedEarnings, distributions: b.ownerDistributions, totalEquity,
    balanced: totalAssets === totalLiabilities + totalEquity,
  };
}

export interface CashFlow {
  opening: Cents;
  operatingIn: Cents; operatingOut: Cents; investing: Cents; financing: Cents;
  closing: Cents;
  items: { memo: string; cf: CashFlowClass; amount: Cents }[];
}

/** Direct-method cash bridge for `events`, starting from `opening`. */
export function cashFlow(opening: Cents, events: JournalEvent[]): CashFlow {
  const out: CashFlow = { opening, operatingIn: 0, operatingOut: 0, investing: 0, financing: 0, closing: opening, items: [] };
  for (const e of events) for (const l of e.lines) {
    if (l.account !== 'cash') continue;
    const amt = l.dr - l.cr;
    if (l.cf === 'operating') amt >= 0 ? (out.operatingIn += amt) : (out.operatingOut += amt);
    else if (l.cf === 'investing') out.investing += amt;
    else out.financing += amt;
    out.closing += amt;
    out.items.push({ memo: l.memo, cf: l.cf!, amount: amt });
  }
  return out;
}
