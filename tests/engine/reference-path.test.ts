import { describe, expect, it } from 'vitest';
import { runGame, varianceReport, type Choices } from '../../src/engine/sim';
import { balanceSheet, incomeStatement } from '../../src/engine/ledger';

// Blueprint §6 / validator lean path.
export const REFERENCE: Choices = {
  R01: 'A', R02: 'B', R03: 'B', R04: 'C', R05: 'C', R06: 'A', R07: 'C', R08: 'C', R09: 'C', R10: 'C',
  R11: 'A', R12: 'A', R13: 'C', R14: 'C', R15: 'C', R16: 'C', R17: 'C', R18: 'C', R19: 'A', R20: 'A',
  R21: 'A', R22: 'A', R23: 'C', R24: 'B', R25: 'B',
};

const inPeriod = (j: ReturnType<typeof runGame>['journal'], p: number) => j.filter((e) => e.period === p);
const upTo = (j: ReturnType<typeof runGame>['journal'], p: number) => j.filter((e) => e.period <= p);

describe('reference path matches docs/startup_survivor_validation.py to the cent', () => {
  const g = runGame({ choices: REFERENCE });
  const expected = [
    { m: 1, rev: 1_298_000, vc: 544_500, fixed: 570_000, dep: 20_000, oi: 163_500, cash: 1_403_500 },
    { m: 2, rev: 1_298_000, vc: 610_500, fixed: 570_000, dep: 20_000, oi: 97_500, cash: 1_521_000 },
    { m: 3, rev: 1_142_200, vc: 556_590, fixed: 645_600, dep: 20_000, oi: -79_990, cash: 1_461_010 },
    { m: 4, rev: 1_538_000, vc: 732_500, fixed: 635_000, dep: 20_000, oi: 150_500, cash: 1_391_510 },
  ];
  for (const x of expected) {
    it(`Month ${x.m}`, () => {
      const is = incomeStatement(inPeriod(g.journal, x.m));
      expect(is.netSales).toBe(x.rev);
      expect(is.variable).toBe(x.vc);
      expect(is.fixedRecurring + is.oneTime).toBe(x.fixed);
      expect(is.depreciation).toBe(x.dep);
      expect(is.operatingIncome).toBe(x.oi);
      expect(g.closes[x.m - 1].cashAfter).toBe(x.cash);
      expect(balanceSheet(upTo(g.journal, x.m)).balanced).toBe(true);
    });
  }

  it('Month 1 sells 990 bowls and 110 wraps; Month 3 weather gives 871 + 97', () => {
    const units = (m: number, id: string) => g.closes[m - 1].calc.cohorts.find((c) => c.id === id)!.fulfilled;
    expect([units(1, 'bowl'), units(1, 'wrap')]).toEqual([990, 110]);
    expect([units(3, 'bowl'), units(3, 'wrap')]).toEqual([871, 97]);
  });

  it('Month 4 close balance sheet', () => {
    const bs = balanceSheet(upTo(g.journal, 4));
    expect(bs.cash).toBe(1_391_510);
    expect(bs.accountsReceivable).toBe(240_000);
    expect(bs.deposits).toBe(80_000);
    expect(bs.netPPE).toBe(1_120_000);
    expect(bs.totalAssets).toBe(2_831_510);
    expect(bs.retainedEarnings).toBe(331_510);
  });

  it('R24 financed expansion after Month 4 close', () => {
    const bs = balanceSheet(g.journal);
    expect(bs.cash).toBe(671_510);
    expect(bs.accountsReceivable).toBe(240_000);
    expect(bs.netPPE).toBe(2_920_000);
    expect(bs.deposits).toBe(80_000);
    expect(bs.bankLoan).toBe(1_080_000);
    expect(bs.totalEquity).toBe(2_831_510);
    expect(bs.totalAssets).toBe(3_911_510);
    expect(incomeStatement(inPeriod(g.journal, 5)).netSales).toBe(0); // loan is not revenue
  });

  it('Month 3 variance report reconciles static → flexible → actual', () => {
    const v = varianceReport(g.budgetM3!, g.closes[2].calc);
    expect(v.staticIncome).toBe(97_500);
    expect(v.flexibleIncome).toBe(14_970);
    expect(v.actualIncome).toBe(-79_990);
    expect(v.netSalesVolumeVariance).toBe(-82_530);
    expect(v.flexibleBudgetVariance).toBe(-94_960);
    expect(v.wasteVariance).toBe(-19_360);
    expect(v.fixedCostVariance).toBe(-75_600);
    expect(v.salesPriceVariance + v.variableCostVariance + v.fixedCostVariance).toBe(v.flexibleBudgetVariance);
  });
});
