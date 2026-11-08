// Capital budgeting helpers. Full float precision until the final display rounding.

/** NPV of year-end cash flows cf[0] = year 1 ... plus a terminal amount in the last year. */
export function npv(rate: number, investment: number, annual: number[], terminal = 0): number {
  const n = annual.length;
  return -investment + annual.reduce((s, cf, i) => s + cf / (1 + rate) ** (i + 1), 0) + terminal / (1 + rate) ** n;
}

/** Level monthly payment on an amortizing loan. */
export function loanPayment(principal: number, apr: number, months: number): number {
  const r = apr / 12;
  return (principal * r) / (1 - (1 + r) ** -months);
}

export function amortization(principal: number, apr: number, months: number, show = 6) {
  const pay = loanPayment(principal, apr, months);
  const rows: { n: number; payment: number; interest: number; principal: number; balance: number }[] = [];
  let bal = principal;
  for (let n = 1; n <= Math.min(show, months); n++) {
    const interest = bal * (apr / 12);
    bal -= pay - interest;
    rows.push({ n, payment: pay, interest, principal: pay - interest, balance: bal });
  }
  return { payment: pay, rows };
}
