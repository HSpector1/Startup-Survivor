# HANDOFF

Last writer: Claude (Opus 5.5), 2026-11-08

## Where the work is
- Repo / branch: `HSpector1/Startup-Survivor`, branch `main`. Every push to `main` runs the tests and deploys to GitHub Pages: https://hspector1.github.io/Startup-Survivor/
- Required reading, in order: `README.md`, `docs/IMPLEMENTATION_AUDIT.md` (every accounting rule the specs left open), `CLAUDE.md`, then the specs in `docs/`.

## State (verified 2026-11-08)
- Game complete and playable: Full Career (25 rounds, 4 month closes, checkpoints, save/resume/export/import), Quick Challenge (5 rounds), Mastery Lab (B1 to B5), glossary (41 terms), Sources & assumptions, investor report.
- `python3 -I docs/startup_survivor_validation.py`: PASS, 28 examples and 4 reconciliations.
- In-game calculator added 2026-11-08 (`src/calc.ts` safe parser, no eval; `src/ui/calculator.tsx` panel). On phones it closes after "Use in answer" so the answer form stays reachable.
- `npx vitest run`: 423 passed. Covers all 75 options against hand-computed values, 300 randomized legal games, the lean, aggressive and constrained-cash paths, a recomputation of every worked answer, and a check that each wrong-answer diagnostic names the mistake that really produces its value.
- GitHub Actions run the validator, typecheck, Vitest and build on every push, then deploy. Runs for commits f7fe90d and 5b50df2 passed and deployed.
- A fourth review (adversarial CPA-level read of engine, content and reports) found no posting errors; its 12 content findings are fixed in 5b50df2.
- `npx playwright test`: 14 passed locally (adds the calculator test); the earlier 12 also passed against the live Pages site (`BASE_URL=https://hspector1.github.io/Startup-Survivor/`), desktop 1440px and mobile 375px: full career through the UI ends at the validator's numbers (cash $6,715.10, equity $28,315.10), reload/resume, keyboard-only round, no horizontal scroll, Quick Challenge with feedback and score.
- Three independent reviews ran: a spec audit with its own Python simulator (matches to the cent), a formula and terminology check against the Easton 7e workbooks, and per-screen self-checks by the UI builders. Their findings are resolved in `docs/IMPLEMENTATION_AUDIT.md` (A1 to A23).

## Next step
1. Team accounting review: read `docs/IMPLEMENTATION_AUDIT.md`, play one Full Career, and sign off or change the rules in its "Design observations for the team" section (dominated options R15B, R17B, R18A, R23B, and the 0.92 price response).
2. Peer-review test on a phone: open the Pages link, run the Quick Challenge, note anything unclear.

## Open decisions for the team
- Price response to a $1 increase: the spec says 0.92, which makes raising prices always win. Recommend keeping 0.92 for submission (it is the approved spec) unless the team wants 0.88, a one-line change in `src/engine/model.ts` (R11B, R19C), followed by updating the expected values in `tests/engine/options.test.ts`.
- `Easton_Solutions_export.zip` sits in this public repo. The game never shows its content, but the file itself is the publisher's solution manual. Recommend removing it from the repo (and its history) before you submit the link.

## How to change things safely
- Change a number: edit `src/engine/model.ts`, then run `npx vitest run`. The option tests pin hand-computed values, so failing tests show what moved.
- Change wording: `src/content/rounds.ts` (overlay) or `src/content/reference.ts` (glossary, assumptions, sources). The round JSON in `docs/` stays unchanged.
- Machine note: on macOS 12 Playwright needs the installed Google Chrome (`channel: 'chrome'`). If the web server times out, start `npx vite preview --port 4173` yourself first; the config reuses it.

## Blockers and warnings
- Rescue (emergency funding) can only trigger at the Month 4 close in practice: an exhaustive search found no path that goes negative earlier. Bridge-loan interest therefore never posts inside Months 1 to 4; the investor report shows it as pending.

## Auto snapshot
<!-- AUTO:BEGIN (handoff_guard.py rewrites this block) -->
<!-- AUTO:END -->
