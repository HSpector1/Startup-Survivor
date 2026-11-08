# CLAUDE.md — Startup Survivor Implementation Rules

You are building a complete, original educational accounting game for an Auburn University MBA group assignment. Read these files before changing code:

1. `docs/Startup_Survivor_Complete_Game_Blueprint.md` — overall model, chronology, content, formulas, architecture.
2. `docs/startup_survivor_round_specs.json` — canonical 25 core rounds + 5 optional bonus cases.
3. `docs/Startup_Survivor_Build_Readiness_Addendum.md` — unresolved production details and non-negotiable tests.
4. `docs/startup_survivor_validation.py` — reference numeric fixtures; passing it is necessary but not sufficient.
5. `docs/MBA Core Assignment 2 - Game.pdf` — the professor's actual deliverable and grading requirements.

## Mission
Create the running full game, not only a mock-up or plan. Begin with actual code, then iterate to full feature coverage and verified finance mechanics. Use Vite + React + TypeScript, Vitest, Playwright, a static responsive frontend with original graphics, and no server, authentication, paid APIs or runtime LLM for arithmetic.

## Safety and accuracy
- Never assume English-language option effects can be executed; map them into typed data and test all options.
- Practice-case questions must be labeled as such; live business financial reports must always come from actual chosen state.
- Make month closes and journal postings deterministic, balanced, idempotent, and correctly timed.
- Never put forecast revenue into actual financial statements. Never book debt as income, capex as an immediate expense, or credit sales as cash.
- If a rule is ambiguous, document and resolve it consistently with course objectives, noting changes; ask only for a genuine blocker.
- Don't publish copyrighted textbook solution sheets or asset images in the app.

## Implementation loop
- Inspect existing repository first; do not overwrite unrelated work.
- Create a typed accounting engine with tests, then implement R1–R10 as a true playable vertical slice and continue through R25; quick mode and optional bonus cases after core.
- Run lint/typecheck, unit/regression tests, and Playwright at relevant milestones. Maintain a brief TODO/QA log.
- Commit coherent working milestones if repo is configured. Do not push or deploy publicly without explicit user approval.
- Do not stop after a plan or scaffold. Show working functionality and concrete test results.

Use the source documents as design inputs, not as proof that every branch is already correct. Protect accounting accuracy above visual complexity.
