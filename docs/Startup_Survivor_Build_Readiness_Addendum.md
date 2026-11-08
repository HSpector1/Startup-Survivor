# Startup Survivor — Build Readiness Addendum

**Purpose:** This is a supplementary implementation checklist, not a change to the approved game concept. The core source of truth is the full game blueprint + round JSON. Use this addendum to prevent mistakes that a coding agent might make when converting descriptive accounting rules into running code.

## What is already checked
- 25 core rounds, with three strategic options each; five bonus cases.
- A 25-question knowledge-check inventory, a four-month sample financial path, and 28 numerical fixtures.
- `startup_survivor_validation.py` currently passes the 28 arithmetic assertions and four month-end reconciliations. This is a **reference/smoke test only**, not an exhaustive proof of all decision branches.

## Open implementation issues to resolve explicitly
1. **Descriptive vs. executable effects.** Round JSON `options[].effect` fields are English descriptions, NOT directly executable financial state changes. Derive a typed, fully explicit `ChoiceEffect` schema and validate every one of the 75 options. Do not write a runtime parser that guesses the accounting effect from English.
2. **Illustrative knowledge checks vs. personalized company arithmetic.** Several `mastery_check` questions explicitly use standardized, self-contained reference cases. Present them as 'Practice case', not 'Your current business'. Add a separate live-state impact preview that dynamically uses the player's selected truck, location, prices, mix, capacity, unit costs, and monthly position.
3. **Time and posting.** R01–R05 plan pre-launch. Close Month 1 after R10, Month 2 after R15, Month 3 after R20, Month 4 after R23. R24–R25 happen *after* Month 4 close at the start of Month 5. Do not book projected Month-5 revenue as Month-4 income.
4. **Capacity and distinct demand cohorts.** Model regular bowls/wraps, premium, coupons, delivery, and catering separately. Catering has priority, and all cohorts compete for capacity. Unfulfilled orders generate zero sales and zero per-unit cost. No order can be fulfilled twice.
5. **Pricing and cost modifiers.** Apply price changes and per-unit costs cumulatively, with clear effective dates, and no double-counting or silently overwriting a previous choice. Keep allocation rounding deterministic.
6. **Month-3 variance analysis.** Freeze one Month-3 budget snapshot after R15 based on the actual chosen setup. Do not present static reference-case numbers as if they were the player's realized variance. Clearly label static budget, flexible budget, and actuals.
7. **Cash, accruals, and financing.** Record equipment as an asset, depreciate only when in service; R21 on-credit sale creates A/R, not cash; R24 loan proceeds create debt, not revenue; R25 distribution decreases equity, not income; advertising prepayment creates a prepaid asset, not current expense.
8. **ABC vs. new spending.** R13 is an allocation of costs that already exist, not a new $2,100 cash expense; only the actual promotional choice can create incremental cash spending.
9. **Choice availability and rescue.** An unaffordable choice must be visibly disabled or routed through transparent funding and recovery rules; don't silently permit negative cash. Implement no-dead-end failure paths.
10. **Reporting and reconciliation.** Managerial contribution views and financial statements must derive from the same posted transactions. After each event and month close, assert debits equal credits and Assets = Liabilities + Equity. Display realized amounts separately from forecasts.

## Engineering acceptance gates

### Gate A — Baseline and tests
- Preserve original input docs unmodified under `/docs`.
- Create a short assumptions/ambiguities log. For genuine accounting inconsistencies, resolve transparently and log any changes; do not quietly rewrite the scenario.
- Run the supplied Python validator and record its exact output.
- Add a typed schema for all scenarios/options, plus data-validation tests that check IDs, chapters, unique choices, question answers, precision, state effects, and chronology.

### Gate B — Correct financial engine
- Unit money in integer cents (or another deterministic decimal representation).
- Pure functions for cohort generation, capacity allocation, item costs, fixed and one-time costs, posting, depreciation, statement derivation, budget snapshots/variance, NPV/financing, emergency funding, and scoring.
- Invariance/property tests across many randomized legal combinations (not merely the sample path): unique journal events; no sold units over capacity; nonnegative units; accurate total demand and realized sales; debit/credit balance; A = L + E; no posted month mutated after close.
- Regression test the supplied sample path exactly and test each of the 75 options in at least one representative state. Explicitly test 3 full-game paths: lean, aggressive, and constrained-cash.

### Gate C — Playable vertical slice
- Implement onboarding and learning objectives, R01–R10, month 1 closure, save/restore, financial dashboard, before/after decision explanations, and a responsive layout. Ensure it's genuinely playable, not just static screens.

### Gate D — Complete content and reporting
- Implement R11–R25, Month-3 budget/variance center, month-4 credit sale, equipment decisions, final expansion, income statement, balance sheet, cash bridge, end report, quick-review mode, and the five optional bonus challenges.
- Every question has meaningful feedback and a correct worked explanation. Correct decisions do not always equal maximum short-term cash or profit.

### Gate E — Review and deployment readiness
- Automated unit tests and Playwright smoke tests at 375px and 1440px; keyboard-only testing; clear errors and restore; no account or backend required.
- Public link must work without sign-in on desktop and mobile. Do not deploy or change a live domain without the user's approval.
- Include an in-game Sources & Assumptions screen, credit original course inspiration without republishing the copyrighted Easton solution sheets.
- Ask accounting reviewers on the team to approve assumptions, all round explanations, and the final ledger before submission.

## Suggested status format after each engineering milestone
- **Implemented:** working functionality, not plans.
- **Tests run:** named commands, pass/fail.
- **Known issues:** unresolved content, accounting, usability, or deployment problems.
- **Files/commits changed:** paths and summary.
- **Next step:** what you will build next without seeking approval for routine coding choices.

**Priority order:** accounting correctness > complete playability > teaching feedback > mobile UX/accessibility > animation/visual flair.
