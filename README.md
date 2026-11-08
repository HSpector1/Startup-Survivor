# Startup Survivor: Build a Food Truck Empire

An accounting simulation for Auburn University BUSI 7230, Cost Analysis and Systems. You invest $25,000, buy a food truck and run it for four simulated months. You make 25 business decisions and answer 25 accounting checks, and every month closes into a balanced set of financial statements.

**Play it:** https://hspector1.github.io/Startup-Survivor/ (GitHub Pages, deployed on every push to `main`).

## What the game teaches

1. Interpret financial statements and financial metrics.
2. Use managerial-accounting concepts (cost behavior, CVP, relevant costs, ABC, budgets, variances, segments, NPV) to choose among alternatives.
3. Explain how revenue recognition and cost allocation change reported income, cash flow and performance.

## Modes

| Mode | Length | For |
|---|---|---|
| Full Career | 25 rounds in 5 chapters, about 30 minutes | Students. Saves in the browser after every step; checkpoint at each chapter. |
| Quick Challenge | 5 rounds (R04, R10, R17, R19, R24), 5 to 8 minutes | Peer reviewers. Uses a fixed reference business. |
| Mastery Lab | 5 optional harder cases (B1 to B5) | Extra practice. Never touches the live ledger. |

The game also includes a calculator (top bar, every screen: parentheses, powers for NPV, percent, and "Use in answer"), a glossary of 41 terms and a Sources & Assumptions page.

## How it works

- **Engine** (`src/engine/`): pure TypeScript functions. Money is integer cents. Each of the 75 options is a typed list of effects (`model.ts`). The simulation (`sim.ts`) replays the decisions into a double-entry journal (`ledger.ts`) and closes Month 1 after R10, Month 2 after R15, Month 3 after R20 and Month 4 after R23. R24 and R25 post at the start of Month 5.
- **Statements** are derived from the journal only: income statement (financial and contribution formats), balance sheet, direct-method cash flow, and the Month 3 budget-versus-actual report.
- **Saves** hold decisions, not balances. Loading a save replays the ledger, so an event can never post twice and a damaged save is rejected with a visible message.
- **Content** comes from `docs/startup_survivor_round_specs.json`, imported unchanged. `src/content/rounds.ts` adds answer formats, diagnostics for common wrong answers, and course-aligned wording.

Every rule the specs left open, and how the engine resolves it, is listed in [`docs/IMPLEMENTATION_AUDIT.md`](docs/IMPLEMENTATION_AUDIT.md). Read it before changing any number.

## Run it locally

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # Vitest engine suite
npm run typecheck
npm run build        # static site in dist/
npm run test:e2e     # Playwright, desktop 1440px and mobile 375px (uses installed Google Chrome)
npm run validate:py  # the original Python reference validator
```

## Verification

- `docs/startup_survivor_validation.py` passes (28 worked examples, 4 month-end reconciliations).
- The engine reproduces the validator's reference path to the cent, including the R24 financed balance sheet.
- Vitest covers all 75 options against hand-computed values, 300 randomized legal games (balanced books after every event, no double-sold capacity, closed months immutable), three full-game paths (lean, aggressive, constrained cash with rescue), and an independent recomputation of all 30 worked answers.
- Playwright plays the full career and the Quick Challenge on desktop and mobile, checks keyboard-only play and save/resume.

## Repository map

```
docs/                     input specs (unchanged) + IMPLEMENTATION_AUDIT.md
src/engine/               money, model (75 typed options), ledger, sim, finance, scoring
src/content/              round overlay, live "your business" insights, glossary/sources
src/ui/                   React screens and original SVG art
tests/engine/             Vitest suites
tests/e2e/                Playwright suites
.github/workflows/        test-then-deploy to GitHub Pages
HANDOFF.md                current state and next steps for whoever picks this up
```

## For teammates

Start with `HANDOFF.md`. The open design questions for the team (for example, options that are dominated on pure profit) are listed at the end of `docs/IMPLEMENTATION_AUDIT.md`. The course workbooks in `Easton_Solutions_export.zip` were used only to check formulas and terminology. The game reproduces none of their content.
