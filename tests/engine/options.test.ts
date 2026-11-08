// Every one of the 75 options, applied to the reference path, checked against hand-computed values.
import { describe, expect, it } from 'vitest';
import { ChoiceError, runGame, type Choices, type CohortId, type GameState } from '../../src/engine/sim';
import { balanceSheet, incomeStatement } from '../../src/engine/ledger';
import { ROUND_IDS, type OptionId, type RoundId } from '../../src/engine/model';
import { REFERENCE } from './reference-path.test';

// Paths whose Month 4 cash cannot fund R24B's reserve take R24C instead (the gate itself is tested below).
const play = (r: RoundId, o: OptionId) => {
  const choices = { ...REFERENCE, [r]: o } as Choices;
  try { return runGame({ choices }); } catch (e) {
    if (!(e instanceof ChoiceError) || r === 'R24' || r === 'R25') throw e;
    return runGame({ choices: { ...choices, R24: 'C' } });
  }
};
const ref = runGame({ choices: REFERENCE });
const calc = (g: GameState, m: number) => g.closes[m - 1].calc;
const units = (g: GameState, m: number, id: CohortId) => calc(g, m).cohorts.find((c) => c.id === id)?.fulfilled ?? 0;
const demand = (g: GameState, m: number, id: CohortId) => calc(g, m).cohorts.find((c) => c.id === id)?.demand ?? 0;
const is = (g: GameState, m: number) => incomeStatement(g.journal.filter((e) => e.period === m));
const line = (g: GameState, m: number, label: string) => calc(g, m).recurring.concat(calc(g, m).oneTime).filter((f) => f.label === label).reduce((s, f) => s + f.amount, 0);
const bs = (g: GameState) => balanceSheet(g.journal);

const CHECKS: Record<RoundId, Record<OptionId, (g: GameState) => void>> = {
  R01: {
    A: (g) => { expect(bs(g).equipment).toBe(3_000_000); expect(calc(g, 1).capacity).toBe(1200); expect(calc(g, 1).depreciationTotal).toBe(20_000); },
    B: (g) => { expect(calc(g, 1).capacity).toBe(1550); expect(calc(g, 1).depreciationTotal).toBe(25_000); expect(g.closes[0].cashAfter).toBe(ref.closes[0].cashAfter - 300_000); },
    C: (g) => { expect(calc(g, 1).capacity).toBe(2100); expect(calc(g, 1).depreciationTotal).toBe(31_667); },
  },
  R02: {
    A: (g) => { expect(line(g, 1, 'Economy site rent')).toBe(90_000); expect(is(g, 1).expenses.find((e) => e.account === 'locationFees')!.amount).toBe(1100 * 50); },
    B: (g) => { expect(line(g, 1, 'Standard site rent')).toBe(130_000); expect(bs(g).deposits).toBe(80_000); },
    C: (g) => { expect(line(g, 1, 'High-traffic site rent')).toBe(190_000); expect([demand(g, 1, 'bowl'), demand(g, 1, 'wrap')]).toEqual([1215, 135]); expect([units(g, 1, 'bowl'), units(g, 1, 'wrap')]).toEqual([1080, 120]); expect(calc(g, 1).lost).toBe(150); },
  },
  R03: {
    A: (g) => { expect(calc(g, 1).prices.bowl).toBe(1000); expect([units(g, 1, 'bowl'), units(g, 1, 'wrap')]).toEqual([1080, 120]); },
    B: (g) => { expect(calc(g, 1).prices.bowl).toBe(1200); expect(units(g, 1, 'bowl')).toBe(990); },
    C: (g) => { expect(calc(g, 1).prices.bowl).toBe(1400); expect([units(g, 1, 'bowl'), units(g, 1, 'wrap')]).toEqual([765, 85]); },
  },
  R04: {
    A: (g) => { expect(line(g, 1, 'Launch-day publicity')).toBe(25_000); expect(demand(g, 1, 'bowl') + demand(g, 1, 'wrap')).toBe(1230); expect(demand(g, 2, 'bowl') + demand(g, 2, 'wrap')).toBe(1100); },
    B: (g) => { expect(calc(g, 1).capacity).toBe(1300); expect(calc(g, 2).capacity).toBe(1200); expect(line(g, 1, 'Service-speed workshop')).toBe(18_000); },
    C: (g) => expect(is(g, 1).operatingIncome).toBe(163_500),
  },
  R05: {
    A: (g) => { for (const m of [1, 2, 3, 4]) expect(line(g, m, 'Growth advertising')).toBe(30_000); expect(demand(g, 1, 'bowl') + demand(g, 1, 'wrap')).toBe(1300); expect(calc(g, 1).fulfilled).toBe(1200); },
    B: (g) => { expect(line(g, 2, 'Moderate advertising')).toBe(15_000); expect(demand(g, 1, 'bowl') + demand(g, 1, 'wrap')).toBe(1220); },
    C: (g) => expect(line(g, 1, 'Growth advertising')).toBe(0),
  },
  R06: {
    A: (g) => expect(calc(g, 1).wrapShare).toBe(0.1),
    B: (g) => { expect([units(g, 1, 'bowl'), units(g, 1, 'wrap')]).toEqual([900, 300]); expect(line(g, 1, 'Wrap menu support')).toBe(12_000); },
    C: (g) => { expect([demand(g, 1, 'bowl'), demand(g, 1, 'wrap')]).toEqual([704, 576]); expect([units(g, 1, 'bowl'), units(g, 1, 'wrap')]).toEqual([660, 540]); expect(line(g, 1, 'Wrap menu support')).toBe(20_000); },
  },
  R07: {
    A: (g) => { expect(demand(g, 1, 'app')).toBe(180); expect(units(g, 1, 'app')).toBe(100); expect(is(g, 1).expenses.find((e) => e.account === 'deliveryCommission')!.amount).toBe(100 * 300); },
    B: (g) => { expect(units(g, 1, 'direct')).toBe(100); expect(line(g, 1, 'Direct-order campaign')).toBe(15_000); },
    C: (g) => expect(units(g, 1, 'app') + units(g, 1, 'direct')).toBe(0),
  },
  R08: {
    A: (g) => { const b = calc(g, 1).cohorts.find((c) => c.id === 'bowl')!; expect(b.price).toBe(1100); expect([units(g, 1, 'bowl'), units(g, 1, 'wrap')]).toEqual([1080, 120]); expect(calc(g, 2).prices.bowl).toBe(1200); },
    B: (g) => { const c = calc(g, 1).cohorts.find((x) => x.id === 'coupon')!; expect([c.demand, c.fulfilled, c.price]).toEqual([120, 100, 1100]); expect(units(g, 1, 'bowl')).toBe(990); expect(demand(g, 2, 'coupon')).toBe(0); },
    C: (g) => expect(demand(g, 1, 'coupon')).toBe(0),
  },
  R09: {
    A: (g) => { expect(calc(g, 4).capacity).toBe(1500); expect(line(g, 4, 'Part-time employee')).toBe(65_000); },
    B: (g) => { expect(calc(g, 1).capacity).toBe(1380); expect(calc(g, 1).overtimeUnits).toBe(0); expect(calc(g, 2).capacity).toBe(1200); },
    C: (g) => expect(calc(g, 1).capacity).toBe(1200),
  },
  R10: {
    A: (g) => { const c = calc(g, 1).cohorts.find((x) => x.id === 'catering')!; expect([c.fulfilled, c.price, c.unitVariable]).toEqual([220, 900, 600]); expect([units(g, 1, 'bowl'), units(g, 1, 'wrap')]).toEqual([882, 98]); expect(line(g, 1, 'Catering event setup')).toBe(18_000); },
    B: (g) => { expect(units(g, 1, 'catering')).toBe(140); expect([units(g, 1, 'bowl'), units(g, 1, 'wrap')]).toEqual([954, 106]); },
    C: (g) => expect(units(g, 1, 'catering')).toBe(0),
  },
  R11: {
    A: (g) => expect(calc(g, 2).unitCosts.bowl.total).toBe(560),
    B: (g) => { expect([calc(g, 2).prices.bowl, calc(g, 2).prices.wrap]).toEqual([1300, 1100]); expect([demand(g, 2, 'bowl'), demand(g, 2, 'wrap')]).toEqual([911, 101]); expect(calc(g, 1).prices.bowl).toBe(1200); },
    C: (g) => { expect(calc(g, 2).unitCosts.bowl.total).toBe(520); expect(line(g, 2, 'Supplier onboarding fee')).toBe(24_000); },
  },
  R12: {
    A: (g) => expect(calc(g, 2).unitCosts.wrap.total).toBe(510),
    B: (g) => { expect(calc(g, 2).unitCosts.bowl.total).toBe(510); expect(line(g, 2, 'Sauce kitchen labor')).toBe(9_000); expect(calc(g, 2).depreciationTotal).toBe(20_300); expect(calc(g, 1).depreciationTotal).toBe(20_000); expect(is(g, 2).operatingIncome).toBe(97_500 + 1100 * 50 - 9_000 - 300); },
    C: (g) => { expect(calc(g, 2).unitCosts.bowl.total).toBe(535); expect(line(g, 2, 'Sauce vendor onboarding fee')).toBe(20_000); },
  },
  R13: {
    A: (g) => { expect(demand(g, 2, 'bowl')).toBe(1040); expect(demand(g, 3, 'bowl')).toBe(871); expect(line(g, 2, 'Bowl promotion')).toBe(10_000); },
    B: (g) => { expect(demand(g, 2, 'wrap')).toBe(180); expect(line(g, 2, 'Wrap promotion')).toBe(10_000); },
    C: (g) => expect(is(g, 2).operatingIncome).toBe(97_500),
  },
  R14: {
    A: (g) => { expect([units(g, 2, 'bowl'), units(g, 2, 'wrap'), units(g, 2, 'premium')]).toEqual([912, 109, 179]); expect(calc(g, 2).unitCosts.premium.total).toBe(760); expect(line(g, 2, 'Premium bowl launch')).toBe(25_000); },
    B: (g) => { expect([units(g, 2, 'bowl'), units(g, 2, 'wrap'), units(g, 2, 'premium')]).toEqual([833, 109, 258]); expect(calc(g, 2).prices.premium).toBe(1400); },
    C: (g) => expect(demand(g, 2, 'premium')).toBe(0),
  },
  R15: {
    A: (g) => { expect(line(g, 3, 'Month 3+ advertising')).toBe(20_000); expect(line(g, 2, 'Month 3+ advertising')).toBe(0); expect(units(g, 3, 'bowl') + units(g, 3, 'wrap')).toBe(1082); },
    B: (g) => { expect(line(g, 3, 'Food-waste training')).toBe(40_000); expect(calc(g, 3).unitCosts.bowl.total).toBe(570); expect(g.budgetM3!.oneTimeTotal).toBe(40_000); },
    C: (g) => expect(calc(g, 3).waste).toBe(20),
  },
  R16: {
    A: (g) => { expect(calc(g, 3).capacity).toBe(1100); expect(calc(g, 4).capacity).toBe(1200); expect(line(g, 3, 'Shortened crew shifts')).toBe(-40_000); expect(is(g, 3).operatingIncome).toBe(-79_990 + 40_000); },
    B: (g) => { expect([units(g, 3, 'bowl'), units(g, 3, 'wrap')]).toEqual([997, 111]); expect(line(g, 3, 'Emergency promotion')).toBe(20_000); expect(demand(g, 4, 'bowl')).toBe(990); },
    C: (g) => expect(units(g, 3, 'bowl')).toBe(871),
  },
  R17: {
    A: (g) => { expect(calc(g, 3).unitCosts.bowl.total).toBe(565); expect(calc(g, 4).waste).toBe(5); expect(line(g, 3, 'Food-prep training')).toBe(18_000); },
    B: (g) => { expect(calc(g, 3).unitCosts.bowl.total).toBe(565); expect(calc(g, 4).unitCosts.bowl.total).toBe(565); expect(line(g, 3, 'Ingredient renegotiation fee')).toBe(20_000); },
    C: (g) => expect(calc(g, 3).unitCosts.bowl.total).toBe(580),
  },
  R18: {
    A: (g) => { expect(line(g, 3, 'Labor overrun above standard')).toBe(45_600); expect(line(g, 3, 'Shift coaching')).toBe(22_000); expect(calc(g, 3).oneTimeTotal).toBe(67_600); },
    B: (g) => expect(calc(g, 3).oneTimeTotal).toBe(60_600),
    C: (g) => { expect(calc(g, 3).oneTimeTotal).toBe(75_600); expect(calc(g, 4).oneTimeTotal).toBe(65_000); },
  },
  R19: {
    A: (g) => expect(g.achievements).toContain('forecast-fixer'),
    B: (g) => { expect(line(g, 4, 'Permanent marketing cut')).toBe(-15_000); expect(demand(g, 4, 'bowl') + demand(g, 4, 'wrap')).toBe(980); expect(demand(g, 3, 'bowl') + demand(g, 3, 'wrap')).toBe(968); },
    C: (g) => { expect([calc(g, 4).prices.bowl, calc(g, 4).prices.wrap]).toEqual([1300, 1100]); expect([demand(g, 4, 'bowl'), demand(g, 4, 'wrap')]).toEqual([911, 101]); },
  },
  R20: {
    A: (g) => expect(units(g, 4, 'wrap')).toBe(110),
    B: (g) => { expect(demand(g, 4, 'wrap')).toBe(0); expect(units(g, 4, 'bowl')).toBe(1090); expect(units(g, 3, 'wrap')).toBe(97); },
    C: (g) => { expect([demand(g, 4, 'bowl'), demand(g, 4, 'wrap')]).toEqual([990, 102]); expect(calc(g, 4).unitCosts.wrap.total).toBe(470); expect(line(g, 4, 'Wrap recipe redesign')).toBe(18_000); },
  },
  R21: {
    A: (g) => { expect(bs(g).accountsReceivable).toBe(240_000); expect(is(g, 4).netSales).toBe(1_538_000); },
    B: (g) => { expect(bs(g).accountsReceivable).toBe(0); expect(is(g, 4).salesDiscounts).toBe(4_800); expect(is(g, 4).netSales).toBe(1_533_200); expect(g.closes[3].cashAfter).toBe(1_391_510 + 235_200); },
    C: (g) => { expect(bs(g).accountsReceivable).toBe(0); expect(is(g, 4).netSales).toBe(1_538_000); expect(is(g, 4).operatingIncome).toBe(150_500 - 9_600); expect(g.closes[3].cashAfter).toBe(1_391_510 + 230_400); },
  },
  R22: {
    A: (g) => expect(line(g, 4, 'Refrigerator repair')).toBe(65_000),
    B: (g) => { expect(calc(g, 4).depreciationTotal).toBe(25_000); expect(calc(g, 4).unitCosts.bowl.total).toBe(562); expect(bs(g).equipment).toBe(3_180_000); expect(is(g, 4).operatingIncome).toBe(150_500 + 65_000 - 5_000 + 1100 * 18); },
    C: (g) => expect(line(g, 4, 'Temporary refrigerator rental')).toBe(13_000),
  },
  R23: {
    A: (g) => { expect(calc(g, 4).depreciation.find((d) => d.label === 'Prep machine')!.amount).toBe(5_833); expect(line(g, 4, 'Prep-time labor savings')).toBe(-8_750); expect(is(g, 4).operatingIncome).toBe(150_500 - 5_833 + 8_750); },
    B: (g) => expect(is(g, 4).operatingIncome).toBe(150_500 - 9_500 + 8_750),
    C: (g) => expect(is(g, 4).operatingIncome).toBe(150_500),
  },
  R24: {
    A: () => { throw new Error('unreachable'); },
    B: (g) => { expect(bs(g).bankLoan).toBe(1_080_000); expect(bs(g).cash).toBe(671_510); },
    C: (g) => { expect(bs(g).bankLoan).toBe(0); expect(bs(g).cash).toBe(1_391_510); expect(bs(g).equipment).toBe(1_200_000); },
  },
  R25: {
    A: (g) => { expect(bs(g).distributions).toBe(100_000); expect(bs(g).totalEquity).toBe(2_731_510); expect(incomeStatement(g.journal).netIncome).toBe(331_510); },
    B: (g) => expect(bs(g).cash).toBe(671_510),
    C: (g) => { expect(bs(g).prepaidAdvertising).toBe(100_000); expect(bs(g).totalAssets).toBe(3_911_510); expect(incomeStatement(g.journal).netIncome).toBe(331_510); },
  },
};

describe('all 75 options on the reference path', () => {
  for (const r of ROUND_IDS) for (const o of ['A', 'B', 'C'] as OptionId[]) {
    it(`${r}${o}`, () => {
      if (r === 'R24' && o === 'A') {
        expect(() => play(r, o)).toThrow(ChoiceError); // $13,915.10 < $20,000 reserve rule
        return;
      }
      const g = play(r, o);
      expect(g.roundsDone).toBe(25);
      if ((r === 'R01' && o === 'C') || (r === 'R03' && o === 'A')) expect(() => runGame({ choices: { ...REFERENCE, [r]: o } })).toThrow(/R24B is unavailable/);
      expect(bs(g).balanced).toBe(true);
      CHECKS[r][o](g);
    });
  }

  it('R24A with enough cash: $18,000 truck for cash, no loan, no Month 4 effect', () => {
    // Found by random search: ends Month 4 with $33,365 posted cash.
    const rich = Object.fromEntries([...'BCCCBABBBABBAAACCCCABCB'].map((o, i) => [ROUND_IDS[i], o])) as Choices;
    rich.R24 = 'A'; rich.R25 = 'B';
    const g = runGame({ choices: rich });
    const before = runGame({ choices: { ...rich, R24: 'C' } });
    expect(bs(g).bankLoan).toBe(0);
    expect(bs(g).cash).toBe(bs(before).cash - 1_800_000);
    expect(is(g, 4).operatingIncome).toBe(is(before, 4).operatingIncome);
  });
});
