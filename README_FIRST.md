# Startup Survivor — Claude Code starter pack

This ZIP contains all documents needed to give Claude Code an autonomous but test-driven start on the 25-round MBA accounting learning game.

## How to start
1. Create or open a new project folder in VS Code. Unzip these files at the root of that folder. You should see `CLAUDE.md` and a `docs/` directory.
2. Open Claude Code with the current working directory set to that folder.
3. Paste the kickoff prompt from the ChatGPT answer (or use its condensed alternative: "Read CLAUDE.md and all /docs materials. Build Startup Survivor end-to-end. Start implementing the deterministic accounting engine and a playable R01-R10 vertical slice, follow the milestones, test each one, and continue to all 25 core rounds. Do not stop at a plan. No external deployment without approval.").
4. After the first milestone, play R1-R10 yourself and have team members review course accuracy and explanations.
5. When the core game is complete, test quick-review mode on phone and desktop before requesting public deployment.

## Contents
- `CLAUDE.md` — repo-level coding-agent guidance.
- `docs/Startup_Survivor_Complete_Game_Blueprint.md` — full game design and accounting math.
- `docs/startup_survivor_round_specs.json` — all 25 core round descriptions, three choices per round, and five bonus cases.
- `docs/startup_survivor_validation.py` — reference arithmetic and month-close verification.
- `docs/Startup_Survivor_Build_Readiness_Addendum.md` — production-risk checklist and engineering acceptance gates.
- `docs/MBA Core Assignment 2 - Game.pdf` — professor's rubric and deliverable rules.

## Important distinction
This pack is a detailed design **not yet a working React game**. The JSON effect fields are human-readable specifications rather than typed executable effects. One reference path has been validated, not every possible strategy or branching state. Claude must build and test the engine and all gameplay, then your group must review educational and accounting correctness.
