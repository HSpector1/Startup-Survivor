// Knowledge-check grading and mastery scoring. Wrong answers never touch the ledger.
import type { Mistake } from '../content/rounds';

export interface CheckSpec { answer: number; tolerance: number; variance?: 'F' | 'U'; mistakes?: Mistake[] }
export interface Attempt { value: number; label?: 'F' | 'U' }
export interface GradeResult { correct: boolean; message?: string }

const near = (a: number, b: number, tol: number) => Math.abs(a - b) <= tol + 1e-9;

export function grade(spec: CheckSpec, a: Attempt): GradeResult {
  if (!Number.isFinite(a.value)) return { correct: false, message: 'Enter a number.' };
  if (spec.variance) {
    // Variances are a positive amount plus a direction (Easton convention). A signed entry is read as its size.
    const size = Math.abs(spec.answer);
    if (!near(Math.abs(a.value), size, spec.tolerance)) {
      const m = spec.mistakes?.find((x) => near(Math.abs(a.value), Math.abs(x.value), spec.tolerance));
      return { correct: false, message: m?.message };
    }
    if (!a.label) return { correct: false, message: 'The amount is right. Now mark the direction: favorable (F) or unfavorable (U)?' };
    if (a.label !== spec.variance) return { correct: false, message: `The amount is right but the direction is not. Ask: did this push income ${spec.variance === 'U' ? 'below' : 'above'} the benchmark?` };
    return { correct: true };
  }
  if (near(a.value, spec.answer, spec.tolerance)) return { correct: true };
  const m = spec.mistakes?.find((x) => near(a.value, x.value, Math.max(spec.tolerance, 0.005)));
  if (m) return { correct: false, message: m.message };
  if (spec.answer !== 0 && near(a.value, -spec.answer, spec.tolerance)) return { correct: false, message: 'Check the sign: the size is right but the direction is reversed.' };
  return { correct: false };
}

export interface MasteryRecord { attempts: number; hint: boolean; revealed: boolean; correct: boolean }
export const EMPTY_RECORD: MasteryRecord = { attempts: 0, hint: false, revealed: false, correct: false };

/** 4 = right first try without the hint; 2 = right after a hint or a retry; 0 = answer revealed. */
export function points(r: MasteryRecord | undefined): number {
  if (!r || !r.correct || r.revealed) return 0;
  return r.attempts === 1 && !r.hint ? 4 : 2;
}

export const resolved = (r: MasteryRecord | undefined) => !!r && (r.correct || r.revealed);
