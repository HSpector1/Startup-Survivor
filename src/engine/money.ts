// Money is always an integer number of cents. Display rounding happens only in fmt().

export type Cents = number;

export function assertCents(v: number, what = 'amount'): Cents {
  if (!Number.isSafeInteger(v)) throw new Error(`${what} must be an integer number of cents, got ${v}`);
  return v;
}

/** Round half away from zero to an integer (used for cents and whole meals). */
export function roundHalfUp(x: number): number {
  // The epsilon guards against binary noise such as 0.5 being stored as 0.49999999.
  const r = Math.sign(x) * Math.floor(Math.abs(x) + 0.5 + 1e-9);
  return r === 0 ? 0 : r;
}

export const dollars = (d: number): Cents => roundHalfUp(d * 100);

/** Multiply cents by a rate and round to the cent (commissions, fees, interest). */
export const pct = (c: Cents, rate: number): Cents => roundHalfUp(c * rate);

export function fmt(c: Cents, opts: { sign?: boolean; noCents?: boolean } = {}): string {
  const neg = c < 0;
  const abs = Math.abs(c) / 100;
  const s = abs.toLocaleString('en-US', {
    minimumFractionDigits: opts.noCents ? 0 : 2,
    maximumFractionDigits: opts.noCents ? 0 : 2,
  });
  if (neg) return `−$${s}`;
  return `${opts.sign && c > 0 ? '+' : ''}$${s}`;
}

export const fmtUnits = (n: number) => n.toLocaleString('en-US');

/**
 * Largest-remainder allocation of `total` whole units across weights.
 * Ties go to the earlier index so results are deterministic.
 */
export function largestRemainder(total: number, weights: number[]): number[] {
  if (!Number.isInteger(total) || total < 0) throw new Error(`largestRemainder total must be a nonnegative integer, got ${total}`);
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum <= 0) {
    if (total === 0) return weights.map(() => 0);
    throw new Error('largestRemainder: positive total with zero weights');
  }
  const exact = weights.map((w) => (w * total) / sum);
  const out = exact.map((x) => Math.floor(x + 1e-9));
  let left = total - out.reduce((a, b) => a + b, 0);
  const order = exact
    .map((x, i) => ({ i, frac: x - Math.floor(x + 1e-9) }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i);
  for (let k = 0; left > 0; k++, left--) out[order[k % order.length].i]++;
  return out;
}

export const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
