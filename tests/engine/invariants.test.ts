// Property tests over randomized legal decision paths, plus lean / aggressive / constrained-cash paths.
import { describe, expect, it } from 'vitest';
import { availability, cashOf, runGame, type Choices, type GameInput, type GameState, type Rescue } from '../../src/engine/sim';
import { ACCOUNTS, balanceSheet, incomeStatement } from '../../src/engine/ledger';
import { CLOSE_AFTER, ROUND_IDS, type OptionId, type RoundId } from '../../src/engine/model';
import { REFERENCE } from './reference-path.test';

function rng(seed: number) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }

/** Play a random legal game the way the UI does: only affordable options, rescue when required. */
function randomGame(seed: number): { input: GameInput; g: GameState } {
  const rnd = rng(seed);
  const input: GameInput = { choices: {}, rescues: {} };
  for (const r of ROUND_IDS) {
    const av = availability(input, r);
    const ok = (['A', 'B', 'C'] as OptionId[]).filter((o) => av[o].ok);
    input.choices[r] = ok[Math.floor(rnd() * ok.length)];
    const g = runGame(input);
    if (g.pendingRescue) input.rescues![g.pendingRescue.month] = (rnd() < 0.5 ? 'equity' : 'loan') as Rescue;
  }
  return { input, g: runGame(input) };
}

function assertInvariants(input: GameInput, g: GameState) {
  expect(g.roundsDone).toBe(25);
  expect(g.pendingRescue).toBeUndefined();
  const ids = g.journal.map((e) => e.id);
  expect(new Set(ids).size).toBe(ids.length); // no event posted twice

  // A = L + E after every single event, and debits = credits per event.
  for (let i = 1; i <= g.journal.length; i++) {
    const e = g.journal[i - 1];
    expect(e.lines.reduce((s, l) => s + l.dr, 0)).toBe(e.lines.reduce((s, l) => s + l.cr, 0));
    expect(balanceSheet(g.journal.slice(0, i)).balanced).toBe(true);
  }

  for (const c of g.closes) {
    const k = c.calc;
    let served = 0;
    for (const h of k.cohorts) {
      expect(Number.isInteger(h.fulfilled) && h.fulfilled >= 0).toBe(true);
      expect(h.fulfilled).toBeLessThanOrEqual(h.demand);
      expect(h.lost).toBe(h.demand - h.fulfilled);
      served += h.fulfilled;
    }
    expect(served).toBeLessThanOrEqual(k.capacity); // no double-sold capacity
    expect(k.overtimeUnits).toBeLessThanOrEqual(180);
    // A lower-priority cohort is served only if every higher tier is fully served.
    for (const h of k.cohorts) if (h.fulfilled > 0) for (const hi of k.cohorts) if (hi.tier < h.tier) expect(hi.lost).toBe(0);
    // Revenue in the ledger for the month = cohort sales + the R21 corporate order (Month 4 only).
    const is = incomeStatement(g.journal.filter((e) => e.period === c.month));
    const corporate = c.month === 4 ? 240_000 : 0;
    expect(is.grossSales).toBe(k.revenue + corporate);
    expect(c.cashAfter).toBeGreaterThanOrEqual(0);
    // Closed months are immutable: replaying only the decisions up to the close reproduces them exactly.
    const upto: Choices = {};
    for (const r of ROUND_IDS.slice(0, ROUND_IDS.indexOf(c.round) + 1)) upto[r] = input.choices[r];
    const prefix = runGame({ choices: upto, rescues: input.rescues });
    const sig = (gs: GameState) => JSON.stringify(gs.journal.filter((e) => e.period <= c.month && e.period > 0));
    expect(sig(prefix)).toBe(sig({ ...g, journal: g.journal.filter((e) => e.period <= c.month) }));
  }

  // Nothing but sales creates revenue; nothing posts revenue before launch or after Month 4 close.
  for (const e of g.journal) for (const l of e.lines) {
    if (ACCOUNTS[l.account].type === 'revenue') expect(e.period >= 1 && e.period <= 4).toBe(true);
  }
  // No unexplained money: ending cash = capital contributed + net income − distributions − non-cash assets + liabilities.
  const bs = balanceSheet(g.journal);
  const ni = incomeStatement(g.journal).netIncome;
  expect(bs.cash).toBe(bs.ownerCapital + ni - bs.distributions + bs.totalLiabilities - bs.accountsReceivable - bs.prepaidAdvertising - bs.deposits - bs.netPPE);
}

describe('randomized legal paths (300 seeds)', () => {
  for (let s = 1; s <= 300; s++) {
    it(`seed ${s}`, () => {
      const { input, g } = randomGame(s * 7919);
      assertInvariants(input, g);
    });
  }
});

describe('representative full-game paths', () => {
  it('lean: the blueprint reference path', () => {
    const g = runGame({ choices: REFERENCE });
    assertInvariants({ choices: REFERENCE }, g);
    expect(cashOf(g.journal)).toBe(671_510);
  });

  it('aggressive: premium truck, high traffic, every growth lever', () => {
    const choices = Object.fromEntries([...'CCBAABABABBBAAABABCACBAAC'].map((o, i) => [ROUND_IDS[i], o])) as Choices;
    // R12B mixer and R22B/R23A equipment need the reserve; the path is only legal if each was affordable.
    for (const r of ROUND_IDS) expect(availability({ choices }, r)[choices[r]!].ok).toBe(true);
    const g = runGame({ choices });
    assertInvariants({ choices }, g);
    expect(g.closes[0].calc.capacity).toBe(2100 + 300);
    expect(balanceSheet(g.journal).equipment).toBe(1_900_000 + 18_000 + 180_000 + 240_000 + 1_800_000);
    expect(balanceSheet(g.journal).bankLoan).toBe(0);
  });

  it('constrained cash: Month 4 close goes negative and requires a visible rescue', () => {
    const choices = Object.fromEntries([...'CAABCACAACAACCBCACBCAAB'].map((o, i) => [ROUND_IDS[i], o])) as Choices;
    const stuck = runGame({ choices });
    expect(stuck.pendingRescue?.month).toBe(4);
    const shortfall = stuck.pendingRescue!.shortfall;
    expect(shortfall).toBeGreaterThan(0);

    const viaEquity = runGame({ choices, rescues: { 4: 'equity' } });
    expect(viaEquity.closes[3].cashAfter).toBe(200_000); // shortfall + $2,000 buffer
    expect(balanceSheet(viaEquity.journal).ownerCapital).toBe(2_500_000 + shortfall + 200_000);
    expect(incomeStatement(viaEquity.journal).netSales).toBe(incomeStatement(stuck.journal).netSales); // rescue is not revenue

    const viaLoan = runGame({ choices, rescues: { 4: 'loan' } });
    expect(balanceSheet(viaLoan.journal).bridgeLoan).toBe(shortfall + 200_000);
    expect(incomeStatement(viaLoan.journal).netIncome).toBe(incomeStatement(viaEquity.journal).netIncome);

    // Finish the game after the rescue.
    const done = runGame({ choices: { ...choices, R24: 'C', R25: 'B' }, rescues: { 4: 'loan' } });
    assertInvariants({ choices: { ...choices, R24: 'C', R25: 'B' }, rescues: { 4: 'loan' } }, done);
  });

  it('a Month 4 bridge loan accrues no interest inside Months 1-4 (interest starts Month 5)', () => {
    // Exhaustive search over R11-R20 from the tightest known prefix found no close before Month 4 with cash < $0
    // (lowest Month 1-3 close: $209). So in practice rescues happen at the Month 4 close.
    const choices = Object.fromEntries([...'CAABCACAACAACCBCACBCAABCB'].map((o, i) => [ROUND_IDS[i], o])) as Choices;
    const g = runGame({ choices, rescues: { 4: 'loan' } });
    expect(balanceSheet(g.journal).bridgeLoan).toBeGreaterThan(0);
    expect(incomeStatement(g.journal).interest).toBe(0);
    expect(g.journal.some((e) => e.id.endsWith('-interest'))).toBe(false);
  });

  it('month closes happen exactly after R10, R15, R20, R23', () => {
    expect(CLOSE_AFTER).toEqual({ R10: 1, R15: 2, R20: 3, R23: 4 });
    const partial = runGame({ choices: Object.fromEntries(ROUND_IDS.slice(0, 9).map((r) => [r, REFERENCE[r]])) as Choices });
    expect(partial.closes.length).toBe(0);
    const m1 = runGame({ choices: Object.fromEntries(ROUND_IDS.slice(0, 10).map((r) => [r, REFERENCE[r]])) as Choices });
    expect(m1.closes.map((c) => c.month)).toEqual([1]);
    expect(m1.journal.filter((e) => e.id === 'M1-operations').length).toBe(1);
  });

  it('rejects decisions out of order and unknown options', () => {
    expect(() => runGame({ choices: { R01: 'A', R03: 'B' } })).toThrow(/before an earlier round/);
    expect(() => runGame({ choices: { R01: 'D' as OptionId } })).toThrow(/no option/);
  });

  it('R13 ABC allocation is informational: choosing C changes no expense', () => {
    const a = runGame({ choices: { ...REFERENCE, R13: 'C' } });
    expect(incomeStatement(a.journal).operatingExpenses).toBe(incomeStatement(runGame({ choices: REFERENCE }).journal).operatingExpenses);
  });

  it('R18 books only the chosen overrun, never the $756 plus the reduced amount', () => {
    for (const [o, total] of [['A', 67_600], ['B', 60_600], ['C', 75_600]] as [OptionId, number][]) {
      const g = runGame({ choices: { ...REFERENCE, R18: o } });
      const payroll = incomeStatement(g.journal.filter((e) => e.period === 3)).lines.filter((l) => l.cls === 'oneTime');
      expect(payroll.reduce((s, l) => s + l.amount, 0)).toBe(total);
    }
  });
});

export const _unused: RoundId | undefined = undefined;
