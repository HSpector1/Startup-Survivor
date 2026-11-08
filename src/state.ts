// Save, resume, export and import. The save holds decisions only; the ledger is replayed (audit E1).
import { ROUND_IDS, type Month, type OptionId, type RoundId } from './engine/model';
import { runGame, type GameInput, type Rescue } from './engine/sim';
import { executionFactors, type MasteryRecord } from './engine/scoring';

export const SAVE_KEY = 'startup-survivor:v1';
export const SCHEMA_VERSION = 1;

export type View =
  | { kind: 'round'; round: RoundId }
  | { kind: 'consequence'; round: RoundId }
  | { kind: 'close'; month: Month }
  | { kind: 'checkpoint'; chapter: number }
  | { kind: 'final' };

export interface Snapshot { choices: GameInput['choices']; rescues: Partial<Record<Month, Rescue>>; mastery: Partial<Record<RoundId, MasteryRecord>> }

export interface Save {
  schemaVersion: 1;
  truckName: string;
  choices: Partial<Record<RoundId, OptionId>>;
  rescues: Partial<Record<Month, Rescue>>;
  mastery: Partial<Record<RoundId, MasteryRecord>>;
  view: View;
  /** Knowledge-check mastery scales customer demand (audit A24). Saves made before this setting existed read as off. */
  masteryAffectsSales?: boolean;
  /** State at the start of each chapter, for "restart this chapter". */
  checkpoints: Partial<Record<number, Snapshot>>;
}

export const DEFAULT_NAME = 'Golden Hour Bowls';

export function newSave(truckName: string, masteryAffectsSales = true): Save {
  const name = truckName.trim().slice(0, 28) || DEFAULT_NAME;
  return {
    schemaVersion: 1, truckName: name, choices: {}, rescues: {}, mastery: {}, masteryAffectsSales,
    view: { kind: 'round', round: 'R01' },
    checkpoints: { 1: { choices: {}, rescues: {}, mastery: {} } },
  };
}

/** Throws a readable error if the object is not a playable save. Replays the ledger to prove it. */
export function validateSave(x: unknown): Save {
  const s = x as Save;
  if (!s || typeof s !== 'object') throw new Error('The save file is empty or not JSON.');
  if (s.schemaVersion !== SCHEMA_VERSION) throw new Error(`This save uses schema version ${String(s.schemaVersion)}; this game reads version ${SCHEMA_VERSION}.`);
  if (typeof s.truckName !== 'string') throw new Error('The save has no truck name.');
  for (const k of Object.keys(s.choices ?? {})) {
    if (!ROUND_IDS.includes(k as RoundId)) throw new Error(`The save names an unknown round "${k}".`);
    if (!['A', 'B', 'C'].includes(String(s.choices[k as RoundId]))) throw new Error(`Round ${k} has an unknown option.`);
  }
  if (!s.view || !['round', 'consequence', 'close', 'checkpoint', 'final'].includes(s.view.kind)) throw new Error('The save has no valid screen position.');
  runGame(gameInput({ ...s, rescues: s.rescues ?? {}, mastery: s.mastery ?? {} })); // throws ChoiceError on an impossible decision path
  return { ...s, rescues: s.rescues ?? {}, mastery: s.mastery ?? {}, checkpoints: s.checkpoints ?? {} };
}

export type LoadResult = { save: Save } | { save: null; error?: string };

export function loadSave(): LoadResult {
  let raw: string | null;
  try { raw = localStorage.getItem(SAVE_KEY); } catch {
    return { save: null, error: 'This browser blocks local storage, so progress will not be saved between visits.' };
  }
  if (!raw) return { save: null };
  try { return { save: validateSave(JSON.parse(raw)) }; } catch (e) {
    return { save: null, error: `Your saved game could not be restored: ${(e as Error).message} Start a new game, or import a backup file.` };
  }
}

/** Returns an error message when the browser refuses to store the save. */
export function storeSave(s: Save | null): string | undefined {
  try {
    if (s) localStorage.setItem(SAVE_KEY, JSON.stringify(s));
    else localStorage.removeItem(SAVE_KEY);
    return undefined;
  } catch {
    return 'This browser refused to save your progress. Use Export to keep a backup file.';
  }
}

export function exportSave(s: Save) {
  const blob = new Blob([JSON.stringify(s, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${s.truckName.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'startup-survivor'}-save.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export async function importSave(file: File): Promise<Save> {
  const text = await file.text();
  let obj: unknown;
  try { obj = JSON.parse(text); } catch { throw new Error('That file is not a Startup Survivor save (it is not valid JSON).'); }
  return validateSave(obj);
}

/** The engine input for a save: decisions, rescues and (if the setting is on) the execution factors. */
export function gameInput(s: Pick<Save, 'choices' | 'rescues' | 'mastery' | 'masteryAffectsSales'>): GameInput {
  return { choices: s.choices, rescues: s.rescues, execution: s.masteryAffectsSales ? executionFactors(s.mastery) : undefined };
}

export const chapterOf = (r: RoundId) => Math.floor((Number(r.slice(1)) - 1) / 5) + 1;
export const nextRound = (r: RoundId): RoundId | undefined => ROUND_IDS[ROUND_IDS.indexOf(r) + 1];
