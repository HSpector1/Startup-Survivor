// 'Mastery affects sales' (audit A24): knowledge-check points scale customer demand, never contracts.
import { describe, expect, it } from 'vitest';
import { executionFactors } from '../../src/engine/scoring';
import { runGame } from '../../src/engine/sim';
import { balanceSheet, incomeStatement } from '../../src/engine/ledger';
import { REFERENCE } from './reference-path.test';

const four = { attempts: 1, hint: false, revealed: false, correct: true };
const two = { attempts: 2, hint: false, revealed: false, correct: true };
const zero = { attempts: 1, hint: false, revealed: true, correct: false };

describe('execution factors', () => {
  it('maps 4 / 2 / 0 points to 100% / 90% / 75% and averages by month', () => {
    const f = executionFactors({ R01: four, R02: zero, R11: two, R16: four, R21: zero, R24: zero, R25: zero });
    expect(f[1]).toBe(0.875);
    expect(f[2]).toBe(0.9);
    expect(f[3]).toBe(1);
    expect(f[4]).toBe(0.75);
    expect(executionFactors({ R03: { attempts: 1, hint: false, revealed: false, correct: false } })).toEqual({}); // unresolved: ignored
  });

  it('full marks leave the reference path exactly at the validator numbers', () => {
    const g = runGame({ choices: REFERENCE, execution: { 1: 1, 2: 1, 3: 1, 4: 1 } });
    expect(g.closes[3].cashAfter).toBe(1_391_510);
  });

  it('90% execution in Month 1 serves 891 bowls and 99 wraps; books still balance', () => {
    const g = runGame({ choices: REFERENCE, execution: { 1: 0.9 } });
    const c = g.closes[0].calc.cohorts;
    expect([c.find((x) => x.id === 'bowl')!.fulfilled, c.find((x) => x.id === 'wrap')!.fulfilled]).toEqual([891, 99]);
    const is = incomeStatement(g.journal.filter((e) => e.period === 1));
    expect(is.netSales).toBe(891 * 1200 + 99 * 1000);
    expect(is.operatingIncome).toBe(163_500 - (990 - 891) * 700 - (110 - 99) * 550);
    expect(balanceSheet(g.journal).balanced).toBe(true);
    expect(g.closes[1].calc.fulfilled).toBe(1100); // Month 2 unaffected
  });

  it('contracts are not scaled: catering stays 140 meals at 75% execution', () => {
    const g = runGame({ choices: { ...REFERENCE, R10: 'B' }, execution: { 1: 0.75, 4: 0.75 } });
    expect(g.closes[0].calc.cohorts.find((x) => x.id === 'catering')!.fulfilled).toBe(140);
    expect(incomeStatement(g.journal.filter((e) => e.period === 4)).grossSales - g.closes[3].calc.revenue).toBe(240_000); // R21 order intact
  });

  it('rejects an impossible factor', () => {
    expect(() => runGame({ choices: REFERENCE, execution: { 1: 1.2 } })).toThrow(/Execution factor/);
  });
});
