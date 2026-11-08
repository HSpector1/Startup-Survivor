// Safe arithmetic for the in-game calculator: no eval. Supports + − × ÷ ^ %, parentheses,
// decimals, $ and thousands commas, unary minus. 1.1^3 and 1050/1.1^2 work for NPV.

type Tok = { t: 'num'; v: number } | { t: 'op'; v: string };

function tokenize(src: string): Tok[] {
  const s = src.replace(/[$,\s]/g, '').replace(/[×xX*]/g, '*').replace(/÷/g, '/').replace(/[−–]/g, '-');
  const out: Tok[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/[0-9.]/.test(c)) {
      let j = i;
      while (j < s.length && /[0-9.]/.test(s[j])) j++;
      const raw = s.slice(i, j);
      if ((raw.match(/\./g) ?? []).length > 1) throw new Error(`"${raw}" has more than one decimal point`);
      out.push({ t: 'num', v: Number(raw) });
      i = j;
    } else if ('+-*/^()%'.includes(c)) {
      out.push({ t: 'op', v: c });
      i++;
    } else {
      throw new Error(`"${c}" is not something the calculator understands`);
    }
  }
  return out;
}

/** Evaluate an expression. Throws an Error with a readable message on bad input. */
export function evaluate(src: string): number {
  const toks = tokenize(src);
  if (!toks.length) throw new Error('Type a calculation first');
  let p = 0;
  const peek = () => toks[p];
  const isOp = (v: string) => peek()?.t === 'op' && peek()!.v === v;

  // expr := term (('+'|'-') term)*
  function expr(): number {
    let v = term();
    while (isOp('+') || isOp('-')) { const op = toks[p++].v; const r = term(); v = op === '+' ? v + r : v - r; }
    return v;
  }
  // term := unary (('*'|'/') unary)*
  function term(): number {
    let v = unary();
    while (isOp('*') || isOp('/')) {
      const op = toks[p++].v; const r = unary();
      if (op === '/' && r === 0) throw new Error('Cannot divide by zero');
      v = op === '*' ? v * r : v / r;
    }
    return v;
  }
  // unary := '-' unary | power   (so -2^2 = -4, like a textbook)
  function unary(): number {
    if (isOp('-')) { p++; return -unary(); }
    if (isOp('+')) { p++; return unary(); }
    return power();
  }
  // power := postfix ('^' unary)?   right-associative
  function power(): number {
    const b = postfix();
    if (isOp('^')) { p++; return b ** unary(); }
    return b;
  }
  // postfix := atom '%'*
  function postfix(): number {
    let v = atom();
    while (isOp('%')) { p++; v /= 100; }
    return v;
  }
  function atom(): number {
    const t = toks[p];
    if (!t) throw new Error('The calculation ends too early');
    if (t.t === 'num') { p++; return t.v; }
    if (t.v === '(') {
      p++;
      const v = expr();
      if (!isOp(')')) throw new Error('A closing parenthesis is missing');
      p++;
      return v;
    }
    throw new Error(`Unexpected "${t.v}"`);
  }

  const v = expr();
  if (p < toks.length) throw new Error(`Unexpected "${(toks[p] as { v: unknown }).v}"`);
  if (!Number.isFinite(v)) throw new Error('The result is too large to show');
  return v;
}

/** Display with up to 6 decimals, no float noise (0.1 + 0.2 shows 0.3). */
export function formatResult(v: number): string {
  const r = Math.round(v * 1e6) / 1e6;
  return (Object.is(r, -0) ? 0 : r).toLocaleString('en-US', { maximumFractionDigits: 6 });
}
