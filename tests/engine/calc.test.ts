import { describe, expect, it } from 'vitest';
import { evaluate, formatResult } from '../../src/calc';

describe('in-game calculator', () => {
  it('solves the game questions as students would type them', () => {
    expect(evaluate('25000 - 12000')).toBe(13000);                       // R01
    expect(Math.ceil(evaluate('(3600+350+250+200+1300+200)/(12-5)'))).toBe(843); // R04
    expect(evaluate('0.75*7 + 0.25*5.5')).toBe(6.625);                   // R06
    expect(evaluate('12 - 5 - 25% * 12')).toBe(4);                       // R07
    expect(evaluate('(1.65-1.50)*1980 + (1980-1800)*1.50')).toBeCloseTo(567, 9); // R17
    expect(evaluate('-2400 + 1050/1.1 + 1050/1.1^2 + 1050/1.1^3 + 300/1.1^3')).toBeCloseTo(436.589, 3); // R23
    expect(evaluate('$12,000 − $4,000')).toBe(8000);                     // R25, pasted with $ and commas
    expect(evaluate('1,800 ÷ 36')).toBe(50);                             // R22
    expect(evaluate('(968 − 1100) × 7')).toBe(-924);                     // R16
  });
  it('follows textbook precedence', () => {
    expect(evaluate('2+3*4')).toBe(14);
    expect(evaluate('2^3^2')).toBe(512);
    expect(evaluate('-2^2')).toBe(-4);
    expect(evaluate('2*-3')).toBe(-6);
  });
  it('rejects bad input with a readable message', () => {
    expect(() => evaluate('')).toThrow(/Type a calculation/);
    expect(() => evaluate('5/0')).toThrow(/divide by zero/);
    expect(() => evaluate('(1+2')).toThrow(/parenthesis/);
    expect(() => evaluate('2+')).toThrow(/ends too early/);
    expect(() => evaluate('alert(1)')).toThrow(/not something/);
    expect(() => evaluate('1.2.3')).toThrow(/decimal point/);
  });
  it('formats without float noise', () => {
    expect(formatResult(0.1 + 0.2)).toBe('0.3');
    expect(formatResult(842.857142857)).toBe('842.857143');
    expect(formatResult(-924)).toBe('-924');
  });
});
