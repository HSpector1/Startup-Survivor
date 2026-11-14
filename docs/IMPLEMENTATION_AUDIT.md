# Implementation audit and assumptions log

This log records how the engine resolves rules that the blueprint, round JSON and addendum leave open. Every resolution keeps the intended scenario and learning outcome. The input documents in `docs/` are unchanged.

Three reviews fed this log:

1. Lead engineer read-through of all five input documents.
2. An independent audit that rebuilt the reference path in its own Python simulator (exact fractions). It matched the engine to the cent.
3. A check of every formula and term against the Easton 7e solution workbooks for Modules 1 to 25 (supplied by the team in `Easton_Solutions_export.zip`). It found no formula conflicts; it did find naming and sign-convention differences, which are resolved below.

## Baseline

`python3 -I docs/startup_survivor_validation.py` prints:

```
PASS: 28 worked examples and 4 month-end ledger reconciliations
Month 1 sales $12,980.00, variable $5,445.00, fixed $5,700.00, dep $200.00, profit $1,635.00, cash $14,035.00
Month 2 sales $12,980.00, variable $6,105.00, fixed $5,700.00, dep $200.00, profit $975.00, cash $15,210.00
Month 3 sales $11,422.00, variable $5,565.90, fixed $6,456.00, dep $200.00, profit $-799.90, cash $14,610.10
Month 4 sales $15,380.00, variable $7,325.00, fixed $6,350.00, dep $200.00, profit $1,505.00, cash $13,915.10
After financed expansion: cash $6,715.10, A/R $2,400.00, PPE net $29,200.00, deposits $800.00, loan $10,800.00, equity $28,315.10
```

The TypeScript engine reproduces every figure (`tests/engine/reference-path.test.ts`). The reference path as option letters R01 to R25 is `ABBCCACCCCAACCCCCCAAAACBB`.

## Architecture decisions

| ID | Decision | Why |
|---|---|---|
| E1 | The save file stores decisions, rescues and quiz records only. The journal is replayed from decisions on load. | A replay cannot post an event twice, and a tampered save cannot inject cash. Closed months are immutable by construction; a test replays each prefix and compares it with the full game. |
| E2 | Each option's English effect is hand-translated into typed effects in `src/engine/model.ts`. Nothing parses English at runtime. | Addendum item 1. |
| E3 | Money is integer cents. NPV and loan math keep float precision until display. | Blueprint §4. |
| E4 | Capital purchases, the deposit, the R21 invoice and the R24/R25 transactions post when chosen. Operating revenue, variable costs, recurring costs and one-time period costs post once at the month close. | Within a month, timing does not change the statements, and a single close event cannot double count. |

## Resolved ambiguities

| ID | Rounds | Resolution |
|---|---|---|
| A1 | R06, R20B | Dropping wraps removes wrap demand; wrap buyers leave, they do not switch to bowls. Bowl demand stays what it would have been, plus the 100 replacement bowl prospects. The wrap menu-support fee stops. Under the alternative reading, dropping wraps always wins, which reverses the round's lesson. |
| A2 | R16 weather | The 12% cut applies to walk-up demand: the regular bowl and wrap pool and the premium bowl. It does not apply to direct pickup, app delivery or catering. |
| A3 | R11B, R19C | The 0.92 demand response applies to every cohort whose price that decision raised: the regular pool plus direct and app orders, which are priced at the bowl price. R19C also hits premium. R11B does not, because R14 sets premium's price later. |
| A4 | Demand order | Regular demand = (base + persistent additions) × wrap share split, minus R14 cannibalization on bowls, then × price response × weather, then temporary promotions (R04A, R08A, R16B, R13). The exact values are summed, rounded half-up once, then split into whole bowls and wraps by largest remainder. |
| A5 | Capacity | Tiers fill in order: catering, then walk-up (bowls, wraps, premium), then direct pickup and coupons, then app. Within a tier, whole meals are split by largest remainder in proportion to demand. Ties go to the earlier cohort. |
| A6 | R09B | Overtime costs $2 for each meal served above the pre-R09 capacity (truck + R04B workshop), at most 180. It posts as its own variable line, Overtime labor. |
| A7 | R15B, R17 | The waste surcharge is $0.20 per meal from Month 3. R15B sets it to $0.10. R17A sets it to $0.05 whatever R15B did, because the latest decision wins. |
| A8 | R15 budget | The Month 3 static budget is frozen after R15, using every decision through R15. It excludes the weather and the waste surcharge, because standards describe the planned recipe. Waste therefore shows as a materials quantity variance, and the R18 overrun shows as a fixed-cost (labor) variance. |
| A9 | R19 report | The live variance report flexes each cohort at its actual units × its budgeted price and unit variable cost, following Easton E23-37. It reports the net sales volume variance (contribution-based), the sales price variance, the variable-cost variance (with waste shown separately) and the fixed-cost variance. Every variance is signed by its effect on income: + favorable, − unfavorable. |
| A10 | R16, R17, R18, R19 quizzes | Variance answers are entered as a positive amount plus F or U, matching Easton. A signed entry is read as its size. R16 is named the "net sales volume variance", and the worked solution also shows the revenue-based sales volume variance ($1,584 U). |
| A11 | R23 | The $87.50 monthly saving reduces Month 4 payroll as "Prep-time labor savings". The machine adds no capacity. R23B rents for $95 and saves the same $87.50. |
| A12 | R21C | Factoring journal: Dr A/R 2,400 / Cr Sales 2,400, then Dr Cash 2,304, Dr Factoring fee 96 / Cr A/R 2,400. The fee sits inside operating income as a one-time cost. |
| A13 | Cash-flow classes | Operating: meal sales, operating costs, the R21 order, the R25 prepaid advertising, interest. Investing: equipment and the refundable deposit. Financing: owner capital, loans, rescues and distributions. |
| A14 | Reserve gate | R12B, R22B and R23A need posted cash of at least the price + $2,000. R24A needs $20,000, R24B needs $9,200, and R25A and R25C need $3,000. Posted cash includes purchases already posted this month, so R23A sees R22B's $1,800. A blocked option shows its reason and cannot be chosen. |
| A15 | Rescue | If cash is below $0 after a close, play stops until the player chooses an owner contribution or a bridge loan of the shortfall + $2,000, or reloads the chapter checkpoint. Bridge interest is 1.5% a month, non-operating and paid in cash from the next close. Exhaustive search found no path that goes negative before Month 4, so in practice the interest starts in Month 5 and the final report shows it as pending. |
| A16 | Economy fee | The $0.50 per-order fee applies to every fulfilled order, including catering and app. It does not apply to the R21 corporate order, which is all-in. |
| A17 | Depreciation | A full month in the month the asset enters service. Each month rounds half-up to the cent, and the final month of the life absorbs the remainder. Truck C: $316.67. Machine: ($2,400 − $300) / 36 = $58.33. |
| A18 | R22B | The $0.18 saving is labeled cold-chain ingredient savings, applied to every meal from Month 4. |
| A19 | R16A and R18 | The R18 overrun ($756, $456 or $256) is independent of R16A's $400 shift cut and of R09A's part-time pay. |
| A20 | Scoring | 4 points for a correct first try without the hint. 2 points for correct after the hint or a retry. 0 points if the answer is revealed. 25 checks × 4 = 100. |
| A21 | R02, R14 prompts | R02 asks for the cheaper contract's monthly cost, since the answer is a dollar amount. R14 asks for first-month incremental operating income, because it includes the one-time $250. |
| A22 | R23 worked solution | The PV of the savings is $2,611.19 (the spec says $2,611.20); NPV +$436.59 is unchanged. |
| A23 | Module tags | Following the workbook review: R06 is tagged 16 (sales-mix CVP), R12 17 (make-or-buy), R15 22/23, R16 and R19 23, R21 5 (receivables). |
| A24 | Mastery affects sales (owner decision, 2026-11-08) | A setup switch, on by default. Each month's customer demand is multiplied by the average execution of the knowledge checks that feed it (R01-R10 Month 1, R11-R15 Month 2, R16-R20 Month 3, R21-R23 Month 4): 4 points = 100%, 2 points = 90%, 0 points = 75%. It scales walk-up, premium, direct, coupon and app demand after every other demand rule, before capacity. Contract catering and the R21 order are unchanged. It deliberately overrides the blueprint rule that wrong answers never affect the business; the ledger stays exact because only fewer customers arrive. The R15 budget does not include it, so a shortfall shows as volume variance. Saves made before the switch existed read it as off. Full marks reproduce the validator path exactly. |
| A25 | Multi-month comparison (2026-11-08) | Decision cards and the consequence table add "Months N-4 operating income" and Month 4 closing cash: this option, then every later round through R23 at its no-new-action option. Every option faces the same later scenario events, so the comparison is fair. It lets decisions that pay back after the current month (R15B, R17, R22B, R23A) show their full effect: R17A training is $34.80 behind doing nothing in Month 3 and $130.20 ahead through Month 4 on the reference path. |
| A26 | Business Performance grade (owner request, 2026-11-14) | A letter grade separate from accounting mastery, computed in `src/engine/business.ts` from the posted journal only. Profitability 40 points: Months 1-4 operating income, full at $12,000, plus 2.5 per profitable month. Liquidity 20: cash at the Month 4 close minus any rescue cash, divided by average monthly fixed costs, full at 3.5 months. Trajectory 20: Month 4 minus Month 1 operating income, −$2,000 = 0 to +$3,000 = 20. Resilience 20: 12 for no rescue plus up to 8 for the lowest month-end cash (full at $10,000). Cutoffs A 85, B 66, C 50, D 35; a rescued business is capped at C. All measures stop at the Month 4 close, so R24 and R25 (second truck, loan, distribution, prepaid advertising) neither raise nor lower the grade; owner capital, loans and rescues are financing and never count as income; equipment counts only through depreciation; Month 5 pro forma figures are never used. With mastery affecting sales, knowledge checks already changed actual demand, so there is no second deduction. Calibration (`scripts/calibrate-business-grade.ts`, output in `docs/business-grade-calibration.txt`): validator reference path C 57.2, aggressive expansion A 98.4, strong conservative and strong financed-expansion paths A 100, all no-action C 61.2, cash-constrained with rescue F 8.7; 1,000 random legal games A 21.9%, B 37.0%, C 24.3%, D 13.9%, F 2.9%. |
| A27 | Learning review (owner request, 2026-11-14) | Mastery records now keep every graded answer (`answers`). Points rules are unchanged. Saves made earlier have no list, and the review says their answer values were not recorded instead of guessing. Restarting a chapter restores the checkpoint's records, so discarded attempts disappear. Areas to improve rank six subjects by the share of knowledge-check points lost; business decisions never count as accounting weaknesses. Business decisions to reconsider replay the game with one of R01-R23 changed and every other decision, rescue and mastery factor kept; an alternative that would break a later decision or force a rescue is skipped, and only gains of $500 or more in Months 1-4 operating income are shown, labeled as a simulation with cash and capacity tradeoffs. |
| A28 | Glossary and abbreviations (2026-11-14) | The glossary panel (top bar, every mode) and the standalone page share one list and search names, abbreviations and text. "APV" appears only in the R17 spec formula, where it means the materials price variance (AUV is the usage variance); it is not adjusted present value or NPV. The R17 hint now spells both out, and the glossary explains the shorthand. ABC, CVP, NPV, CM, PV, APR, SQ and WACM are spelled out at first use in each round's text. A CVP entry was added. |

## Design observations for the team (spec values kept)

The independent audit flagged several options that are dominated on pure profit. The engine keeps the spec values, because changing them would change the approved design. Each round's coaching note tells students that a lower-profit option can still be defensible. The team should decide whether to retune these before submission:

- The 0.92 response to a $1 price rise makes a price increase gain profit whenever unit contribution is below $11.50, which covers every item (R11B, R19C). A factor of 0.88 would match R03's own demand curve.
- R15B ($400 for $0.10 waste) is dominated by R17A ($180 for $0.05). Taking both costs $580 for the same $0.05.
- R17B and R17A both cut $0.15 per meal from the baseline; B costs $20 more.
- R18A ($676 total) is dominated by R18B ($606).
- R23B rents for $95 to save $87.50, a $7.50 monthly loss. Its feedback calls this out.

## Known limits

- B1 to B5 are self-contained practice cases. They never touch the live ledger.
- Month 5 is not simulated. The final report shows R24's first loan payment ($224.19) and Month 5 depreciation as pro forma, not as results.
- The core game holds no inventory (just-in-time ingredients). B3 teaches inventory separately.
