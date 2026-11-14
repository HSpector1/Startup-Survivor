// Knowledge-check grading and mastery scoring. Wrong answers never touch the ledger.
import type { Mistake } from '../content/rounds';

export interface CheckSpec { answer: number; tolerance: number; variance?: 'F' | 'U'; mistakes?: Mistake[] }
export interface Attempt { value: number; label?: 'F' | 'U' }
/** `incomplete`: the amount is right but the F/U direction is missing. Not an attempt; the UI must not count it. */
export interface GradeResult { correct: boolean; message?: string; incomplete?: true }

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
    if (!a.label) return { correct: false, incomplete: true, message: 'The amount is right. Now mark the direction: favorable (F) or unfavorable (U)?' };
    if (a.label !== spec.variance) return { correct: false, message: `The amount is right but the direction is not. Ask: did this push income ${spec.variance === 'U' ? 'below' : 'above'} the benchmark?` };
    return { correct: true };
  }
  if (near(a.value, spec.answer, spec.tolerance)) return { correct: true };
  const m = spec.mistakes?.find((x) => near(a.value, x.value, Math.max(spec.tolerance, 0.005)));
  if (m) return { correct: false, message: m.message };
  if (spec.answer !== 0 && near(a.value, -spec.answer, spec.tolerance)) return { correct: false, message: 'Check the sign: the size is right but the direction is reversed.' };
  return { correct: false };
}

export interface MasteryRecord {
  attempts: number; hint: boolean; revealed: boolean; correct: boolean;
  /** Every graded answer in order (added 2026-11-14). Saves made earlier have no list: their answer values were never recorded. */
  answers?: Attempt[];
}
export const EMPTY_RECORD: MasteryRecord = { attempts: 0, hint: false, revealed: false, correct: false, answers: [] };

/** The record after one graded answer. Scoring reads only attempts/hint/revealed/correct; `answers` is for the learning review. */
export function recordAttempt(r: MasteryRecord, a: Attempt, correct: boolean): MasteryRecord {
  // An older record (no list) with earlier attempts keeps no list for those, so the review can say they were not recorded.
  const answers = r.answers ?? (r.attempts === 0 ? [] : undefined);
  return { ...r, attempts: r.attempts + 1, correct, answers: answers && [...answers, a.label ? { value: a.value, label: a.label } : { value: a.value }] };
}

/** 4 = right first try without the hint; 2 = right after a hint or a retry; 0 = answer revealed. */
export function points(r: MasteryRecord | undefined): number {
  if (!r || !r.correct || r.revealed) return 0;
  return r.attempts === 1 && !r.hint ? 4 : 2;
}

export const resolved = (r: MasteryRecord | undefined) => !!r && (r.correct || r.revealed);

/** 'Mastery affects sales' (owner decision, audit A24): 4 points → 100% of demand, 2 → 90%, 0 → 75%. */
export const EXECUTION_BY_POINTS: Record<number, number> = { 4: 1, 2: 0.9, 0: 0.75 };

/** Which month's demand each round's knowledge check feeds. */
export const FEEDS_MONTH = (roundNumber: number): 1 | 2 | 3 | 4 | 0 =>
  roundNumber <= 10 ? 1 : roundNumber <= 15 ? 2 : roundNumber <= 20 ? 3 : roundNumber <= 23 ? 4 : 0;

/**
 * Average execution factor per month over the knowledge checks resolved so far.
 * Unresolved checks are left out, so projections assume full marks on checks not yet taken.
 */
export function executionFactors(records: Partial<Record<string, MasteryRecord>>): Partial<Record<1 | 2 | 3 | 4, number>> {
  const acc: Record<number, number[]> = {};
  for (const [id, rec] of Object.entries(records)) {
    if (!resolved(rec)) continue;
    const m = FEEDS_MONTH(Number(id.slice(1)));
    if (m) (acc[m] ??= []).push(EXECUTION_BY_POINTS[points(rec)]);
  }
  const out: Partial<Record<1 | 2 | 3 | 4, number>> = {};
  for (const m of [1, 2, 3, 4] as const) if (acc[m]?.length) out[m] = acc[m].reduce((a, b) => a + b, 0) / acc[m].length;
  return out;
}
