// Calibration evidence for the Business Performance grade (audit A26). Run: npx vite-node scripts/calibrate-business-grade.ts
// Prints the grade for the named strategies and the letter distribution over randomized legal games.
import { availability, runGame, type Choices, type GameInput, type Rescue } from '../src/engine/sim';
import { ROUND_IDS, type OptionId } from '../src/engine/model';
import { gradeBusiness } from '../src/engine/business';

const path = (s: string): Choices => Object.fromEntries([...s].map((o, i) => [ROUND_IDS[i], o as OptionId]));
function rng(seed: number) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }
function randomGame(seed: number) {
  const rnd = rng(seed);
  const pick = () => [1, 0.95, 0.9, 0.875, 0.8, 0.75][Math.floor(rnd() * 6)];
  const input: GameInput = { choices: {}, rescues: {}, execution: seed % 2 ? { 1: pick(), 2: pick(), 3: pick(), 4: pick() } : undefined };
  for (const r of ROUND_IDS) {
    const av = availability(input, r);
    const ok = (['A', 'B', 'C'] as OptionId[]).filter((o) => av[o].ok);
    input.choices[r] = ok[Math.floor(rnd() * ok.length)];
    const g = runGame(input);
    if (g.pendingRescue) input.rescues![g.pendingRescue.month] = (rnd() < 0.5 ? 'equity' : 'loan') as Rescue;
  }
  return input;
}
/** Greedy: pick the affordable option with the most Months N-4 operating income given earlier picks; R24/R25 fixed. */
function greedy(r24: OptionId, r25: OptionId): Choices {
  const c: Choices = {};
  for (const r of ROUND_IDS) {
    if (r === 'R24') { c[r] = r24; continue; }
    if (r === 'R25') { c[r] = r25; continue; }
    const av = availability({ choices: c }, r);
    let best: OptionId = 'A'; let v = -Infinity;
    for (const o of ['A', 'B', 'C'] as OptionId[]) {
      if (!av[o].ok) continue;
      const rest: Choices = { ...c, [r]: o };
      const g = runGame({ choices: Object.fromEntries(ROUND_IDS.slice(0, 23).map((x) => [x, rest[x] ?? ({ R01: 'A', R02: 'B', R03: 'B', R04: 'C', R05: 'C', R06: 'A', R07: 'C', R08: 'C', R09: 'C', R10: 'C', R11: 'A', R12: 'A', R13: 'C', R14: 'C', R15: 'C', R16: 'C', R17: 'C', R18: 'C', R19: 'A', R20: 'A', R21: 'A', R22: 'A', R23: 'C' } as Record<string, OptionId>)[x]])) }, { projection: true });
      const total = g.closes.reduce((s, x) => s + x.cashAfter, 0);
      if (total > v) { v = total; best = o; }
    }
    c[r] = best;
  }
  return c;
}
const named: [string, GameInput][] = [
  ['reference (lean, validator path)', { choices: path('ABBCCACCCCAACCCCCCAAAACBB') }],
  ['reference, mastery all 2-pt (90%)', { choices: path('ABBCCACCCCAACCCCCCAAAACBB'), execution: { 1: 0.9, 2: 0.9, 3: 0.9, 4: 0.9 } }],
  ['reference, all revealed (75%), keeps one truck', { choices: path('ABBCCACCCCAACCCCCCAAAACCB'), execution: { 1: 0.75, 2: 0.75, 3: 0.75, 4: 0.75 } }],
  ['aggressive expansion', { choices: path('CCBAABABABBBAAABABCACBAAC') }],
  ['cash-constrained + bridge loan', { choices: path('CAABCACAACAACCBCACBCAABCB'), rescues: { 4: 'loan' } }],
  ['cash-constrained + owner rescue', { choices: path('CAABCACAACAACCBCACBCAABCB'), rescues: { 4: 'equity' } }],
  ['all no-action (NEUTRAL)', { choices: path('ABBCCACCCCAACCCCCCAAACCCB') }],
  ['strong conservative (greedy, keep one truck)', { choices: greedy('C', 'B') }],
  ['strong expansion (greedy, financed 2nd truck)', { choices: greedy('B', 'B') }],
];
for (const [name, input] of named) {
  const g = runGame(input);
  if (g.pendingRescue) { console.log(name, 'needs rescue'); continue; }
  const b = gradeBusiness(g);
  console.log(`${b.letter} ${b.score.toFixed(1).padStart(5)}  ${name}  [${b.dimensions.map((d) => `${d.label[0]}${d.points}`).join(' ')}]  ${ROUND_IDS.map((r) => input.choices[r]).join('')}${b.cap ? ' CAPPED' : ''}`);
}
const N = Number(process.argv[2] ?? 1000);
const dist: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 };
const scores: number[] = [];
for (let s = 1; s <= N; s++) {
  const b = gradeBusiness(runGame(randomGame(s * 7919)));
  dist[b.letter]++; scores.push(b.score);
}
scores.sort((a, b) => a - b);
console.log(`random legal games (${N}):`, Object.entries(dist).map(([k, v]) => `${k} ${(100 * v / N).toFixed(1)}%`).join('  '));
console.log('score percentiles p10/p25/p50/p75/p90:', [0.1, 0.25, 0.5, 0.75, 0.9].map((p) => scores[Math.floor(p * (N - 1))]).join(' / '));
