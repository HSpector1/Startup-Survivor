# STARTUP SURVIVOR | Complete Game Design & Accounting Specification

**Auburn MBA BUSI 7230 · Cost Analysis and Systems | Fall 2026**  
**Version:** 1.0 · **Document status:** Build-ready planning specification, **not** the completed web application.  
**Audience:** 3–4-student project team, accounting reviewer, and AI-assisted coding agents.  
**Game scope:** 25 mandatory rounds + 5 optional mastery challenges; 5 chapters; 4 completed simulated operating months; 1 post-month-four expansion/board decision.

**Design principle:** Every important decision must produce an explainable change to demand, capacity, contribution margin, spending, available cash, a balance-sheet account, or a forward-looking forecast. We will not conflate cash payments with expenses, budgets with actuals, or forecasts with earned revenue.

## 1. Executive product definition

The player is the owner of a fictional food truck. They contribute **$25,000 in cash**, select a truck and location, price their food, respond to problems, interpret reports, and decide whether to expand. The experience combines a business simulation with carefully explained accounting checks. It is not a timed accounting exam; reasonable strategic decisions can be correct even if they earn less money.

**Primary learning outcomes:** (1) interpret financial statements and financial metrics; (2) use relevant managerial-accounting concepts to choose among alternatives; (3) explain the impacts of accounting recognition and cost allocation on reported income, cash flow, and business performance. These follow the supplied course objectives. Core topics are drawn from the managerial-accounting subject areas represented in the supplied Easton module workbooks; **all numerical scenarios in this blueprint are newly created fictional instructional cases**. Verify the exact course module sequence with the instructor’s assigned reading list before submission.

**Rubric optimization:** Accounting accuracy (8/25) is protected by a balanced double-entry ledger, transparent assumptions, and verified formulas. Teaching effectiveness (6/25) is protected by learning goals, hints and worked feedback. Engagement (4/25) comes from a continuous business story and consequences. Usability/professionalism (4/25) comes from mobile-first accessible interface, checkpoints, and fast evaluation mode. Value (3/25) comes from replayable MBA-relevant scenarios.

## 2. Audience, duration, modes and play loop

- **Full Career:** 25 rounds in five chapters. Target an approximately 25–35-minute first playthrough, subject to actual user testing; returning players will be faster. End-of-chapter saved checkpoints.
- **Peer Review Quick Challenge:** 5 self-contained, curated problems using preset reference states (suggested: R04 break-even, R10 catering, R17 materials, R19 flexible budget, R24 NPV). Target 5–8 minutes. Make this a separate mode, not a pretend continuation of a 25-round company.
- **Optional Mastery Lab:** Five harder bonus cases (B1–B5) after the main game or from the main menu; do not make them prerequisites for the instructor’s review.
- **Learn → Analyze → Decide → Consequence → Explain:** Each round opens with a one-line learning objective; shows a short event and a compact data card; asks a calculation or concept question; offers an optional hint; allows a strategic choice; explains the result and updates business/learning dashboards.
- **No dead ends:** If a player runs into a cash shortfall, launch a transparent emergency funding overlay (owner equity contribution, loan, or retry), not a silent negative bank account or an unexplained automatic rescue.
- **No personal data required:** no logins, emails or tracking. Save on the same browser using localStorage with a schema version; allow export/import of plain JSON if time permits.

## 3. Chronology: when each round changes the actual financial statements

| Period | Rounds | Posting rule | Checkpoint |
|---|---|---|---|
| Before Month 1 | 1–5 | Truck purchase and refundable deposit are immediate balance-sheet events; recurring plans are commitments only. | After R05: launch plan, no month closed |
| Month 1 | 6–10 | Apply menu, channels, promotions, capacity, catering, and recurring costs. Post actual orders only once. | Close Month 1 after R10 |
| Month 2 | 11–15 | Supplier/sauce/menu choices apply; capitalized mixer and one-time fees are posted; Month 3 budget is committed, not realized. | Close Month 2 after R15; freeze Month 3 budget |
| Month 3 | 16–20 | Weather shock, materials/waste, labor excess and segment choices affect actual Month 3. R19/R20 forward decisions are deferred to Month 4 as specified. | Close Month 3 after R20 |
| Month 4 | 21–23 | Credit sale, refrigerator and process equipment decisions affect Month 4. Post full Month 4 sales/expenses/depreciation. | Close Month 4 after R23 |
| Post-close / Start of Month 5 | 24–25 | Second-truck investment and financing, then owner draw or advertising prepayment. No new-truck Month 4 revenue/expenses. | Final board report; no second close of Month 4 |

**Event-timing invariant:** Never book a receipt or expense in more than one round. “Projected” revenue is only a forecast; “recognized” revenue is earned for fulfilled service. Reserve checks use actual posted cash after the latest close, not hypothetical future receipts.

## 4. Business economics: explicit assumptions

| Parameter | Rule |
|---|---|
| Opening funding | $25,000 cash, contributed by the owner; Dr Cash / Cr Owner Capital |
| Truck choices | $12,000 / $15,000 / $19,000; monthly capacity 1,200 / 1,550 / 2,100 meals; straight-line depreciation over 60 months, $0 salvage |
| Location choices | Economy $900/month + $0.50 per actual order; Standard $1,300/month; High Traffic $1,900/month and +250 potential regular orders; each requires $800 refundable deposit |
| Base recurring cash expense | Payroll $3,600 + utilities $350 + insurance $250 + marketing $200 = $4,400/month, before location, promotions and later actions |
| Bowl price and initial demand | $10 → 1,250, $12 → 1,100, $14 → 850 potential regular orders/month before location, menu and other modifiers |
| Bowl variable cost | $2.50 non-sauce ingredients + $1.30 sauce + $0.80 packaging + $0.40 payment processing = $5.00 per fulfilled order |
| Wrap price and cost | $10 selling price; $2.00 non-sauce ingredients + $1.30 sauce + $0.80 packaging + $0.40 payment processing = $4.50 |
| Premium bowl | $7 base variable cost; the same supply/sauce/waste/refrigeration modifiers are applied after the item launches |
| Unit demand | Estimated demand is not sales: every demand cohort is integer-rounded, allocated against monthly capacity and possibly lost |
| Sales settlement | Walk-up, app, direct pickup and catered transactions are collected when fulfilled unless explicitly specified otherwise; the special R21 invoice uses A/R |
| Inventory simplification | Ingredients are obtained just in time for sold meals; no opening/closing ingredients inventory in core game. B3 separately teaches inventory accounting. |
| Taxes and owner wages | Pre-tax teaching model, no income/sales taxes, owner salary or tax depreciation; tell the player these are simplifications |
| Capital expenditures | Dr Equipment / Cr Cash upon purchase; monthly depreciation begins once item is in service |
| Loan financing | Only R24 produces bank debt in standard gameplay; loan principal is a liability, not sales; interest starts in Month 5 |
| Currency/rounding | Currency calculated in integer cents or Decimal, display two decimals; whole meals only. Keep NPV precision until final dollar rounding. |

### 4.1 Price and cost modifiers must be additive, not overwriting or duplicating each other

Starting per-unit costs: Bowl $5.00, Wrap $4.50, Premium $7.00. For each sold meal add selected supplier surcharge from R11 ($0.60 or $0.20), subtract sauce procurement savings from R12 ($0.50 in-house; $0.25 bulk vendor), add actual waste surcharge from R17 ($0.20 default; $0.10 if R15 waste training; $0.05 if R17 training), subtract $0.15 ingredient savings only if R17 supplier renegotiation selected, and subtract $0.18 cold-chain savings only if R22 upgraded refrigeration selected. Include $0.50 extra variable location fee on each fulfilled order at Economy site. The $0.40 baseline payment fee stays included for all channels in this simplified model; delivery app commission is additional. Do not apply the separate R21 corporate order to this item-level cost model because its $1,000 cost is explicitly all-in.

**Equation:** `unit_variable_cost = menu_base_cost + supplier_surcharge - sauce_savings + waste_surcharge - renegotiation_savings - refrigeration_savings + economy_location_fee + channel_specific_fee + overtime_on_overflow_unit`. Apply overtime only on the defined incremental capacity cohort, not all meals. A discount changes the actual selling price of that cohort, not cost.

### 4.2 Demand and capacity allocation

1. Start with the price-specific regular demand from R3. Add High Traffic location potential and persistent menu/advertising effects. Apply permanent price-sensitivity reductions when decisions increase the price. Add temporary promotions and Month 3 weather effects only to the affected cohorts. Subtract cannibalized regular demand before adding premium orders. 2. Determine the bowl/wrap mix as whole-unit counts via largest-remainder rounding; the combined counts must equal the eligible regular demand. 3. Add additional non-walk-up order cohorts (premium, coupons, delivery, catering). 4. Fulfill capacity **in a published order**: contractual catering first, ordinary walk-up (including premium orders), direct pickup/coupons, then app delivery. Apply truck and staffing capacity limits. Preserve actual mix inside each priority tier with largest-remainder rounding. 5. Book sales and direct costs only for fulfilled orders. 6. Report unfulfilled customers and displaced contribution explicitly; do not label demand as realized revenue.

**Planning assumption:** A food truck can fulfill only one meal per capacity unit. Standard capacity is set by the truck choice. R9 hiring adds +300 capacity permanently; temporary overtime adds at most +180 capacity in Month 1 with +$2 extra cost per order served beyond prior capacity. R16 shortened shifts decrease Month 3 capacity by 100. R22 replacement choices preserve Month 4 safe service capacity. This rule prevents accepting two overlapping orders on the same kitchen capacity.

## 5. Accounting formulas and live reporting

| KPI | Exact rule |
|---|---|
| Unit contribution margin | Selling price − all variable cost per fulfilled order |
| Contribution margin ratio | Unit contribution margin / actual selling price |
| Break-even units | CEILING(monthly recurring fixed expenses incl. straight-line depreciation / weighted unit contribution margin); if margin <= 0, show “not attainable” |
| Target-profit units | CEILING((recurring fixed operating expenses + desired operating profit)/weighted unit contribution margin) |
| Expected fulfilled sales | MIN(total eligible potential demand, effective kitchen capacity), allocating by declared priority |
| Revenue | Σ(fulfilled units × collected/earned unit price) + recognized non-menu earned revenue, net of discounts |
| Variable cost | Σ(fulfilled units × exact cohort variable cost) + incremental channel fees, overtime, and direct service cost |
| Contribution margin | Net revenue − variable operating costs (include variable selling costs in managerial view) |
| Operating income | Contribution margin − fixed operating cash expenses − depreciation − one-time operating costs |
| Cash balance | Beginning cash + collected sales + owner financing/loans − cash operating expenses − capex − refundable deposits − draws/prepaids |
| Assets | Cash + accounts receivable + refundable deposits + prepaids + property/equipment cost − accumulated depreciation |
| Equity | Owner contributed capital + cumulative retained earnings − owner distributions |
| Balance sheet identity | Assets = Liabilities + Equity, to the cent after each posted event |
| Materials price variance | (Actual ingredient price − Standard ingredient price) × Actual quantity |
| Materials quantity variance | (Actual ingredient quantity − Allowed standard quantity for actual output) × Standard price |
| Labor rate variance | (Actual hourly rate − Standard rate) × Actual hours |
| Labor efficiency variance | (Actual hours − Standard hours for actual output) × Standard rate |
| Flexible budget operating income | Actual output × standard weighted unit CM − allowed fixed costs at relevant range |
| Flexible budget variance | Actual operating income − flexible-budget operating income |
| Sales-volume variance | Flexible budget income − static budget income (unfavorable when negative) |
| Segment margin | Segment sales − segment variable costs − avoidable segment-specific fixed costs |
| Make/buy crossover | (Incremental fixed costs + incremental monthly depreciation)/(per-unit savings), if savings positive |
| NPV | − investment today + Σ(year-end incremental unlevered cash flow/(1 + hurdle rate)^year) + discounted terminal cash |
| Loan amortization payment | P × r / (1 − (1+r)^(−n)), monthly r = APR/12 |

**Two views, one source of truth:** A managerial *contribution-format P&L* separately highlights variable and fixed costs. A financial *income statement and balance sheet* are generated from the same posted journal entries. Changing an ABC allocation changes only managerial reporting—not the total cash paid or the company’s net operating income. A forecast is marked PRO FORMA and is never merged with historical actuals.

## 6. A fully reconciled sample playthrough (default/lean path)

This is a tested reproducible reference path, **not** an assertion that it is the optimal strategy: $12,000 used truck; $1,300 flat-rent location; $12 bowls; no launch spending or recurring extra marketing; 90% bowls/10% wraps; no delivery, discount, new hire or catering; absorb supplier +$0.60; keep buying sauce; skip premium/advertising, absorb weather and waste, absorb $756 labor excess, keep wraps, complete a $2,400 credit sale, repair fridge for $650, make no Month-4 machine purchase; finance the second truck after Month 4; retain cash.

| Period | Revenue | Variable costs | Fixed cash costs* | Depreciation | Operating income | Ending cash |
|---|---:|---:|---:|---:|---:|---:|
| Month 1 | $12,980.00 | $5,445.00 | $5,700.00 | $200.00 | $1,635.00 | $14,035.00 |
| Month 2 | $12,980.00 | $6,105.00 | $5,700.00 | $200.00 | $975.00 | $15,210.00 |
| Month 3 | $11,422.00 | $5,565.90 | $6,456.00 | $200.00 | −$799.90 | $14,610.10 |
| Month 4 | $15,380.00 | $7,325.00 | $6,350.00 | $200.00 | $1,505.00 | $13,915.10 |

*Fixed cash costs includes one-time repair/labor overruns in relevant months; displayed as combined cash operating cost for the table. In Month 4, $2,400 of revenue is **credit sales**, so $2,400 goes to A/R, not cash; the $1,000 production cost is paid in cash and included in variable costs.*

**Month 1 proof:** 990 bowls × $12 + 110 wraps × $10 = $12,980 revenue. Variable costs = 990×$5 + 110×$4.50 = $5,445. Fixed cash expenses = $3,600 payroll + $350 utilities + $250 insurance + $200 marketing + $1,300 rent = $5,700. Depreciation = $200. Thus net operating profit = $12,980 − $5,445 − $5,700 − $200 = **$1,635**. Cash after truck/deposit = $12,200. Month-end cash = $12,200 + $12,980 − $5,445 − $5,700 = **$14,035**. Balance sheet: $14,035 cash + $800 deposit + $11,800 truck net = **$26,635 assets**, balanced by $25,000 capital + $1,635 retained earnings.

**Month 3 proof:** weather reduces 1,100 regular orders to 968, rounded as 871 bowls + 97 wraps. Supplier shock and waste raise costs to $5.80/bowl and $5.30/wrap. Revenue $11,422; variable costs $5,565.90; fixed cash costs $5,700 recurring + $756 labor variance = $6,456; depreciation $200. Operating income = **−$799.90**. The downturn is not counted as a cost on top of lower actual sales.

**Month 4 + finance proof:** Closing Month 4 cash = $13,915.10; A/R = $2,400; refundable deposit $800; used truck net book value $11,200. Assets = **$28,315.10**, equal to equity $25,000 + cumulative earnings $3,315.10. Buying the second truck with 60% financing at the start of Month 5 reduces cash by $7,200 to **$6,715.10**, increases PPE by $18,000, and creates a **$10,800 loan**. New assets = $39,115.10; liabilities $10,800 + equity $28,315.10 = $39,115.10. No new-truck sales are booked in Month 4.

## 7. Round-by-round specifications (all 25 core scenarios and 75 choices)

**Reading key:** Every round contains a *worked instructional mini-case* whose answer can be checked independently. Separately, the *live business decision* changes the player’s financial forecast or posted ledger according to the chosen path. Where the player’s actual prior choices change the arithmetic, the UI must also display a “Your Business” calculation using live state. This avoids presenting a fixed textbook-style example as if it were the user’s actual current costs.

## Chapter 1: Start Up

**Milestone:** Plan a business that can pay its bills; no operating month closes yet. R01 and R02 directly change assets/cash.

### R01 — Buy your first truck

**Course alignment:** Financial statement foundations / depreciation  
**Effective time:** Startup planning before Month 1  
**Learning goal:** Differentiate a capitalized asset purchase from an operating expense.

**Story and data card:** The owner invests $25,000 cash. A working truck includes equipment and will be depreciated straight-line over 60 months with zero salvage value. All three options can serve the same menu, but have different monthly capacity.

**Knowledge challenge:** With a $12,000 truck, how much cash remains immediately after the purchase?  
**Calculation:** `Cash after purchase = $25,000 - truck purchase price.`  
**Checked explanation:** $25,000 - $12,000 = $13,000; monthly depreciation = $12,000 / 60 = $200.  
**Expected answer:** **13000 USD** (validation tolerance 0.01).

**Player decisions and outcomes:**

- **A · Used truck - $12,000:** Dr Equipment 12,000 / Cr Cash 12,000; capacity 1,200 meals/month; monthly depreciation $200, beginning Month 1.
- **B · Refurbished truck - $15,000:** Dr Equipment 15,000 / Cr Cash 15,000; capacity 1,550 meals/month; monthly depreciation $250.
- **C · Premium truck - $19,000:** Dr Equipment 19,000 / Cr Cash 19,000; capacity 2,100 meals/month; monthly depreciation $316.67, with final-month rounding catch-up.

**Posting/financial-statement logic:** On purchase: Assets Cash decreases; PPE increases equally; profit unchanged. At each month-end: Dr Depreciation Expense / Cr Accumulated Depreciation.

**Incorrect-answer feedback:** An equipment purchase is not an immediate $12,000 operating expense. It exchanges one asset, cash, for another, equipment. Depreciation allocates the cost over its useful life.

**Implementation guardrail:** The premium option leaves little early liquidity; do not automatically mark it wrong. Ask the student to defend cash-versus-capacity tradeoffs.

---

### R02 — Choose where to park and prepare food

**Course alignment:** 15: cost behavior  
**Effective time:** Startup planning before Month 1  
**Learning goal:** Distinguish fixed rent from a per-order variable service fee and identify an activity-level crossover.

**Story and data card:** Every facility requires an $800 refundable deposit. All leases provide access to a safe, fully permitted operating site. Other baseline cash costs are payroll $3,600, utilities $350, insurance $250, and marketing $200 per month.

**Knowledge challenge:** At 1,000 orders, which of these two location contracts costs less: Economy at $900 + $0.50 per order, or Standard at $1,300?  
**Calculation:** `Economy = $900 + $0.50*Q; Standard = $1,300; crossover Q = (1,300-900)/0.50 = 800.`  
**Checked explanation:** At 1,000 meals, Economy costs $1,400 and Standard costs $1,300; Standard is cheaper by $100.  
**Expected answer:** **1300 USD** (validation tolerance 0.01).

**Player decisions and outcomes:**

- **A · Economy site:** Refundable cash deposit $800 becomes Deposits asset; recurring cash rent $900/month plus variable location fee $0.50 for every fulfilled order; no additional demand.
- **B · Standard site:** Same $800 deposit; recurring fixed cash rent $1,300/month; no per-order fee; no additional demand.
- **C · High-traffic site:** Same $800 deposit; recurring fixed cash rent $1,900/month; adds 250 regular prospective orders/month, subject to capacity.

**Posting/financial-statement logic:** Dr Refundable Deposits 800 / Cr Cash 800. Recognize actual rent and economy service fees as monthly expenses when incurred.

**Incorrect-answer feedback:** At low volumes, the fixed-plus-variable contract may be cheaper. At higher volumes, the flat lease can win. The deposit is an asset, not rent expense.

**Implementation guardrail:** Mastery numeric answer $1,300 tests selection via cheapest cost; UI also shows $1,400 Economy and $800-order crossover.

---

### R03 — Price your signature bowl

**Course alignment:** 16: CVP; 21: pricing  
**Effective time:** Startup planning before Month 1  
**Learning goal:** Calculate contribution margin and see how price influences both unit economics and demand.

**Story and data card:** Base bowl variable cost is $5: non-sauce ingredients $2.50, sauce $1.30, packaging $0.80, and payment fee $0.40. The below demand estimates are original game assumptions, not external market data.

**Knowledge challenge:** At a $12 price and $5 variable cost, what is the contribution margin per bowl?  
**Calculation:** `Unit CM = selling price - unit variable cost; CM ratio = CM / selling price.`  
**Checked explanation:** $12 - $5 = $7 per bowl; CM ratio = $7 / $12 = 58.33%.  
**Expected answer:** **7 USD** (validation tolerance 0.01).

**Player decisions and outcomes:**

- **A · Value price - $10:** Set bowl price $10; regular baseline demand 1,250 bowls/month before capacity, location and promotion effects; base CM $5.
- **B · Balanced price - $12:** Set bowl price $12; baseline demand 1,100 bowls/month; base CM $7.
- **C · Premium price - $14:** Set bowl price $14; baseline demand 850 bowls/month; base CM $9.

**Posting/financial-statement logic:** No journal entry on pricing selection. Recognize revenue and variable expenses for actual fulfilled orders at month close.

**Incorrect-answer feedback:** Revenue is not profit. Only the difference between selling price and variable cost contributes to covering fixed costs and operating income.

**Implementation guardrail:** No fixed best price: the best choice depends on facility choice, capacity, promotion choices and later cost shocks.

---

### R04 — Find your break-even point

**Course alignment:** 15: cost classification; 16: CVP  
**Effective time:** Startup planning before Month 1  
**Learning goal:** Compute break-even units using recurring fixed expenses, depreciation and all variable per-order costs.

**Story and data card:** A basic launch planning case uses monthly fixed cash costs: payroll $3,600; utilities $350; insurance $250; marketing $200; standard location rent $1,300. Used truck depreciation is $200. Bowl price is $12 and unit variable cost $5.

**Knowledge challenge:** How many bowls per month must this business sell to break even on operating profit?  
**Calculation:** `Fixed operating costs = 3600+350+250+200+1300+200=5900; BE units = CEILING(5900/(12-5)).`  
**Checked explanation:** $5,900 / $7 = 842.857; round UP to 843 bowls. At 842 bowls, operating income is still negative.  
**Expected answer:** **843 meals** (validation tolerance 0).

**Player decisions and outcomes:**

- **A · Launch-day publicity:** One-time marketing cash payment/expense $250 in Month 1; raises Month 1 regular demand by 130 meals, subject to capacity.
- **B · Service-speed workshop:** One-time training cash payment/expense $180 in Month 1; increases Month 1 capacity by 100 meals; no recurring boost.
- **C · Preserve the cash:** No change to cost, demand or capacity.

**Posting/financial-statement logic:** At Month 1 close, recognize the one-time marketing/training expense and cash outflow if selected.

**Incorrect-answer feedback:** Break-even uses contribution margin, not selling price. Round UP because selling part of a meal is not an option. One-time launch costs should not be silently mixed into a recurring baseline.

**Implementation guardrail:** Actual game quiz calculates from the chosen truck, location, price and recurring costs; the $843 example is a fixed instructional reference case.

---

### R05 — Set the first operating profit target

**Course alignment:** 16: target-profit CVP; 22: budgeting  
**Effective time:** Startup planning before Month 1  
**Learning goal:** Calculate the units required to achieve a target operating profit and choose a demand-generation budget.

**Story and data card:** Use the same standalone reference case as Round 4: fixed operating costs $5,900/month, bowl CM $7/unit. The owner wants $1,500 monthly operating profit.

**Knowledge challenge:** How many bowls are needed to earn $1,500 of operating profit?  
**Calculation:** `Target units = CEILING((fixed operating costs + target profit) / unit contribution margin).`  
**Checked explanation:** ($5,900 + $1,500)/$7 = 1,057.14, so 1,058 meals.  
**Expected answer:** **1058 meals** (validation tolerance 0).

**Player decisions and outcomes:**

- **A · Growth-first advertising:** Add $300 to recurring monthly fixed marketing expense beginning Month 1; add 200 to regular monthly demand from Month 1 onward.
- **B · Moderate advertising:** Add $150 to recurring fixed marketing beginning Month 1; add 120 to regular demand from Month 1 onward.
- **C · Operate lean:** No extra fixed marketing and no extra demand; preserve liquidity.

**Posting/financial-statement logic:** Marketing is expensed monthly when services are received and paid. Its expected demand benefit does not create an asset or revenue until sales occur.

**Incorrect-answer feedback:** To reach a specific profit target, fixed costs AND desired profit must be covered by contribution margin. The advertising decision changes both sides of the profit equation.

**Implementation guardrail:** Checkpoint 1: display opening cash, truck capacity, unit CM, planned break-even, intended target units and one-sentence learning summary.

---

## Chapter 2: Grow

**Milestone:** Complete the first month of actual sales; show demand versus orders served, cash movements and a reconciled income statement at R10.

### R06 — Add a second menu item

**Course alignment:** 16: sales-mix CVP; 18: product costing  
**Effective time:** Month 1 operating decisions  
**Learning goal:** Use a weighted-average contribution margin for a multi-product business.

**Story and data card:** A wrap sells for $10 and costs $4.50 per unit: non-sauce ingredients $2, sauce $1.30, packaging $0.80 and payment $0.40. Bowls sell for $12 with $5 variable cost in the reference case.

**Knowledge challenge:** With a mix of 75% bowls and 25% wraps, what is the weighted-average contribution margin per meal?  
**Calculation:** `WACM = bowl mix * ($12-$5) + wrap mix * ($10-$4.50).`  
**Checked explanation:** 0.75*$7 + 0.25*$5.50 = $6.625 per meal (display $6.63; retain full precision internally).  
**Expected answer:** **6.625 USD** (validation tolerance 0.005).

**Player decisions and outcomes:**

- **A · Lean two-item menu:** Keep a simple menu with 90% bowls and 10% wraps; no complexity fee or new demand.
- **B · Balanced menu:** 25% of regular monthly orders are wraps; new monthly regular demand +100 orders; recurring cash menu-support cost $120/month.
- **C · Wrap-forward menu:** 45% of regular monthly orders are wraps; new monthly demand +180 orders; recurring cash menu-support cost $200/month.

**Posting/financial-statement logic:** All sales and associated actual variable expenses are recognized only when orders are fulfilled; recurring menu support is included in fixed monthly cash operating expense.

**Incorrect-answer feedback:** A greater number of sales does not always mean more profit. Use weighted contribution margin and account for the added recurring menu-support cost.

**Implementation guardrail:** To avoid fraction-of-a-meal errors, allocate whole units via largest-remainder rounding; bowl + wrap units must equal the regular-orders total.

---

### R07 — Should you join a delivery platform?

**Course alignment:** 17: relevant costs; 21: channel pricing  
**Effective time:** Month 1 operating decisions  
**Learning goal:** Evaluate a new sales channel based on incremental contribution and available capacity.

**Story and data card:** A delivery app expects 180 additional bowl orders/month. It charges 25% of the bowl selling price per app order. A direct-order campaign offers 100 extra orders/month but costs $150/month.

**Knowledge challenge:** For a $12 bowl with $5 variable costs and a 25% app commission, what is contribution margin on ONE app order?  
**Calculation:** `App-order CM = bowl price - bowl unit cost - app commission rate * bowl price.`  
**Checked explanation:** $12 - $5 - (0.25*$12) = $4 per delivery order.  
**Expected answer:** **4 USD** (validation tolerance 0.01).

**Player decisions and outcomes:**

- **A · Join the app:** Add a distinct app-order channel with 180 monthly bowl orders; app fee 25% of collected selling price per fulfilled app order; no new fixed fee.
- **B · Promote direct online orders:** Add distinct direct-pickup channel with 100 monthly bowl orders; add recurring marketing cash cost $150/month; no commission.
- **C · Stick to walk-up orders:** No channel cost and no added channel demand.

**Posting/financial-statement logic:** At month close post actual channel gross sales as Revenue, app percentage as selling expense, direct per-order costs as variable expense, and fixed direct marketing separately.

**Incorrect-answer feedback:** App sales may look attractive in revenue terms but only the contribution AFTER the app fee covers fixed costs. At capacity, new channel orders may displace more profitable walk-in sales.

**Implementation guardrail:** Channel demand is not guaranteed fulfilled sales; a documented capacity allocator must avoid counting demand exceeding the truck's capacity.

---

### R08 — Run a discount promotion

**Course alignment:** 16: incremental CVP; 21: pricing  
**Effective time:** Month 1 operating decisions  
**Learning goal:** Evaluate how a discount applied to existing customers can destroy margin even when it increases unit sales.

**Story and data card:** An illustrative test has 1,100 full-price bowl orders at $12 price and $5 unit cost. A blanket $1 discount brings 200 new meals, but also reduces the price of all 1,100 orders that would have purchased anyway.

**Knowledge challenge:** Without a capacity limit, what is the incremental contribution from the blanket $1 discount?  
**Calculation:** `Delta CM = new orders*(discounted price - variable cost) - existing orders*discount amount.`  
**Checked explanation:** 200*($11-$5) - 1,100*$1 = $1,200 - $1,100 = +$100, before any extra marketing expense.  
**Expected answer:** **100 USD** (validation tolerance 0.01).

**Player decisions and outcomes:**

- **A · Discount ALL walk-up orders by $1:** In Month 1 only, subtract $1 from selling price of every regular bowl/wrap order, and add 200 potential regular orders before capacity allocation.
- **B · Target new customers only:** In Month 1 only, spend $100 marketing; add 120 distinct coupon-only bowl orders priced at bowl price minus $1; existing orders retain full price.
- **C · No promotion:** No discount, marketing or new promotional demand.

**Posting/financial-statement logic:** Discounts reduce transaction revenue; the $100 targeted campaign is separately expensed. Store eligible channel and price for each order cohort.

**Incorrect-answer feedback:** The blanket promotion gives a price reduction to existing customers too. Its financial outcome may turn negative once real capacity constraints are applied.

**Implementation guardrail:** Never calculate discount gains using only incremental units. Include margin lost on customers who were already buying.

---

### R09 — Increase service capacity

**Course alignment:** 15: step costs; 17: relevant capacity costs  
**Effective time:** Month 1 operating decisions  
**Learning goal:** Compare added fixed hiring expense with variable overtime to relieve a capacity bottleneck.

**Story and data card:** A used truck normally serves 1,200 orders/month. For an isolated 120-order overflow at $7 regular CM, a part-time employee costs $650/month and overtime costs $2 for each order served above base capacity.

**Knowledge challenge:** If all 120 overflow orders can be served, what is the ONE-MONTH incremental operating profit from overtime?  
**Calculation:** `Overtime delta profit = overflow units * (ordinary unit CM - extra overtime cost per unit).`  
**Checked explanation:** 120*($7-$2) = $600 incremental operating profit for the month.  
**Expected answer:** **600 USD** (validation tolerance 0.01).

**Player decisions and outcomes:**

- **A · Hire a part-time employee:** Increase capacity +300 meals/month from this month onward; recurring cash payroll expense +$650/month.
- **B · Use overtime this month:** Increase capacity +180 meals for Month 1 only; charge an extra $2 variable overtime for each fulfilled meal above the pre-R9 capacity threshold, maximum 180.
- **C · Keep the current crew:** No capacity or expense change; potential orders above capacity are unfilled.

**Posting/financial-statement logic:** Recognize part-time pay in monthly payroll or temporary overtime expense based on actual overflow fulfilled. No salaries are capitalized.

**Incorrect-answer feedback:** Labor is neither always fixed nor always variable. Hiring can be a step-fixed cost, while overtime can add variable cost only to units produced beyond normal capacity.

**Implementation guardrail:** Keep a separate base-capacity threshold so overtime is not incorrectly charged on every meal sold.

---

### R10 — Win a catering contract

**Course alignment:** 17: special-order decisions; 16: capacity opportunity cost  
**Effective time:** Month 1 operating decisions  
**Learning goal:** Evaluate a special order using incremental revenues, relevant costs, and displaced ordinary sales.

**Story and data card:** A client offers a one-time Month 1 event. Each catered bowl costs the ordinary bowl variable cost ($5 in the reference case) plus $1 extra event packaging/transport. Event setup is $180.

**Knowledge challenge:** Ignoring capacity constraints, what is the incremental profit from 140 catered bowls sold at $11 each?  
**Calculation:** `Catering contribution - setup = Q*(event price - (bowl variable cost + $1)) - setup fee.`  
**Checked explanation:** 140*($11-$6)-$180 = $520 incremental operating profit, before displaced regular business.  
**Expected answer:** **520 USD** (validation tolerance 0.01).

**Player decisions and outcomes:**

- **A · Accept all 220 meals at $9:** Contract 220 bowls for $9 each; variable cost = live bowl cost + $1 per meal; one-time $180 setup expense; event orders receive first capacity priority.
- **B · Negotiate 140 meals at $11:** Contract 140 bowls for $11 each; variable cost = live bowl cost + $1 per meal; same $180 setup; event orders receive first capacity priority.
- **C · Decline the contract:** No catering sales or setup expense; preserve capacity for regular and delivery customers.

**Posting/financial-statement logic:** Catering cash received upon service. Recognize revenue and related direct costs in Month 1; setup is a period expense. Close Month 1 and generate the first operating income statement.

**Incorrect-answer feedback:** The $520 result is true only IF the new order does not displace more profitable customers. Opportunity cost = contribution lost on displaced orders; subtract it from incremental catering profit.

**Implementation guardrail:** Close Month 1 after this round. The standard fulfillment order is catering contract -> walk-up regular -> direct pickup/coupons -> app delivery, always subject to capacity. Revenue is based on served, not desired, meals.

---

## Chapter 3: Cost Crisis

**Milestone:** Respond to costs and prepare a real Month 3 budget. R15 closes Month 2 and freezes a Month 3 static-budget snapshot.

### R11 — Ingredient prices jump

**Course alignment:** 15: cost behavior; 21: pricing response  
**Effective time:** Month 2 operating decisions / Month 3 budget  
**Learning goal:** Analyze a commodity-cost increase and decide whether to absorb, pass on, or reduce the increase.

**Story and data card:** A supplier shock adds $0.60 of non-sauce ingredient cost per meal. A replacement supplier would limit the increase to $0.20 but charges a $240 onboarding fee. Price increases of $1 reduce prospective price-sensitive demand by 8% (game assumption).

**Knowledge challenge:** If 1,000 meals are sold and the business absorbs the full cost increase, how much does operating contribution decline?  
**Calculation:** `Change in total variable costs = actual meals * added variable cost per meal.`  
**Checked explanation:** 1,000*$0.60 = $600 decrease in monthly contribution, all else equal.  
**Expected answer:** **600 USD** (validation tolerance 0.01).

**Player decisions and outcomes:**

- **A · Absorb the entire increase:** Permanently add $0.60 to non-sauce ingredients per fulfilled meal beginning Month 2; no price or demand change.
- **B · Raise every current menu price by $1:** Permanently add $0.60 non-sauce cost per meal AND raise currently offered bowl/wrap prices by $1; multiply future price-sensitive demand by 0.92. The later premium price is set explicitly in Round 14.
- **C · Switch ingredient suppliers:** Permanently add only $0.20 non-sauce cost per meal; expense/pay $240 one-time onboarding in Month 2; no menu price or demand change.

**Posting/financial-statement logic:** Ingredient surcharge is variable food cost as sold; onboarding fee is a one-time period expense when incurred and paid.

**Incorrect-answer feedback:** A price increase may restore unit CM but lose customers. Compare total expected contribution at realistic demand rather than assuming passing on cost is always best.

**Implementation guardrail:** Do not apply the $0.60 shock first and then add an additional $0.20 for the switch. Selected post-shock surcharge is $0.20 total.

---

### R12 — Make your own sauce?

**Course alignment:** 17: make-or-buy; 18: product costing  
**Effective time:** Month 2 operating decisions / Month 3 budget  
**Learning goal:** Distinguish relevant make-or-buy costs from capital expenditures and depreciation.

**Story and data card:** Each meal uses one portion of sauce that currently costs $1.30 from the supplier. You could produce sauce for $0.80 per portion, incur $90 additional monthly fixed kitchen labor, and buy a $180 mixer depreciated over 60 months. A bulk vendor offers $1.05 per portion with a $200 one-time onboarding fee.

**Knowledge challenge:** Ignoring the $180 initial cash purchase, at how many portions does making sauce break even on MONTHLY operating income (including $3 monthly depreciation)?  
**Calculation:** `Make operating advantage per portion = $1.30 - $0.80 = $0.50; incremental monthly fixed cost = $90 + $180/60 = $93.`  
**Checked explanation:** $93 / $0.50 = 186 portions/month. Cash operating break-even would be 180, before considering the one-time $180 investment.  
**Expected answer:** **186 portions** (validation tolerance 0).

**Player decisions and outcomes:**

- **A · Continue buying sauce:** Keep sauce component at $1.30 per fulfilled meal; no fixed cost or capital purchase.
- **B · Make sauce in-house:** Set sauce component to $0.80 per meal; recurring incremental cash fixed kitchen labor $90/month starting Month 2; purchase mixer $180 PPE, 60-month zero-salvage life, $3/month depreciation.
- **C · Negotiate bulk vendor pricing:** Set sauce component to $1.05 per meal from Month 2; expense/pay a one-time $200 vendor onboarding fee; no extra monthly fixed cost.

**Posting/financial-statement logic:** For a mixer purchase post Dr PPE/Cr Cash; depreciate $3/month from its service month. Sauce cost flows through variable food expense on meals actually sold.

**Incorrect-answer feedback:** Do not expense the full mixer purchase immediately. $90 fixed labor changes profit today; $180 is upfront cash and an equipment asset, allocated through depreciation over time.

**Implementation guardrail:** Savings are per *all fulfilled meals*, including wrap, premium, delivery, and catering, except R21's separate corporate order is priced as an all-in case.

---

### R13 — Find hidden product costs

**Course alignment:** 19: activity-based costing; 20: overhead allocation  
**Effective time:** Month 2 operating decisions / Month 3 budget  
**Learning goal:** Allocate existing overhead by appropriate activity drivers without confusing allocated cost with incremental cash cost.

**Story and data card:** For a self-contained ABC lesson, $1,200 of existing monthly support cost relates to 60 prep batches and $900 of existing support cost to 450 support contacts. Wraps use 1 prep batch per 25 wraps and 0.4 support contacts per wrap.

**Knowledge challenge:** What is the ABC overhead assigned to one wrap?  
**Calculation:** `Batch rate = 1200/60 = $20 per batch; contact rate = 900/450 = $2 per contact; per-wrap ABC = (1/25)*20 + 0.4*2.`  
**Checked explanation:** $0.80 batch support + $0.80 customer support = $1.60 allocated overhead per wrap.  
**Expected answer:** **1.6 USD** (validation tolerance 0.01).

**Player decisions and outcomes:**

- **A · Promote bowls:** Spend/expense $100 once in Month 2; add 50 potential bowl orders in Month 2 only.
- **B · Promote wraps:** Spend/expense $100 once in Month 2; add 70 potential wrap orders in Month 2 only (only if wraps were added in Round 6).
- **C · No extra promotion:** Leave the menu mix and monthly demand unchanged; calculate allocations for informational reporting only.

**Posting/financial-statement logic:** ABC allocation is managerial-reporting-only. Only actual $100 marketing choices have cash/P&L effects. Total company expense must be identical before and after a pure reallocation.

**Incorrect-answer feedback:** The $1.60 is a cost allocation, not necessarily an avoidable cash expense from selling one more wrap. Do NOT add the $2,100 cost pools on top of the operating expenses already in the ledger.

**Implementation guardrail:** Every player offers at least 10% wraps after Round 6, so all ABC and segment options remain meaningful.

---

### R14 — Launch a premium menu item

**Course alignment:** 17: incremental analysis; 21: target pricing  
**Effective time:** Month 2 operating decisions / Month 3 budget  
**Learning goal:** Account for cannibalization and the incremental costs of a new menu item.

**Story and data card:** A gourmet bowl costs $7 variable per unit before supplier/sauce modifiers. A $16 version is forecast to attract 180 orders but replaces 70 regular bowls; a $14 version is forecast to attract 260 orders but replaces 150 regular bowls. Either launch incurs $250 one-time design/advertising.

**Knowledge challenge:** At ordinary bowl CM $7, what is the incremental contribution of the $16 premium launch after its $250 setup, before capacity effects?  
**Calculation:** `Incremental = premium Q*(premium price-premium variable cost) - displaced ordinary Q*ordinary bowl CM - setup.`  
**Checked explanation:** 180*($16-$7) - 70*$7 - $250 = $1,620-$490-$250=$880.  
**Expected answer:** **880 USD** (validation tolerance 0.01).

**Player decisions and outcomes:**

- **A · Launch $16 gourmet bowl:** Add premium cohort with 180 monthly potential orders, price $16, baseline unit variable cost $7 plus live ingredient modifications; remove 70 potential regular bowls/month; expense/pay $250 launch cost in Month 2.
- **B · Launch $14 value gourmet bowl:** Add premium cohort with 260 monthly potential orders, price $14, baseline unit variable cost $7 plus modifications; remove 150 potential regular bowls/month; expense/pay $250 launch cost in Month 2.
- **C · Delay premium launch:** No premium orders or launch expense; preserve existing menu.

**Posting/financial-statement logic:** Only fulfilled premium orders create revenue/variable expense. One-time launch campaign is expensed. Apply constrained-capacity allocation before determining realized gain.

**Incorrect-answer feedback:** A new product can appear more profitable than it actually is if part of its demand comes from customers who would otherwise buy the standard menu.

**Implementation guardrail:** The teaching case uses pre-shock baseline costs; the live game must incorporate Round 11 and 12 cost decisions when forecasting this investment.

---

### R15 — Approve next month's operating budget

**Course alignment:** 22: master/flexible budgets  
**Effective time:** Month 2 operating decisions / Month 3 budget  
**Learning goal:** Translate unit forecasts into a contribution-format operating budget and fund a management initiative.

**Story and data card:** A reference monthly budget calls for 1,100 standard bowls at $12, variable cost $5/meal, and $5,900 fixed operating expense.

**Knowledge challenge:** What is budgeted operating income in the reference case?  
**Calculation:** `Budgeted income = budgeted units*(price - variable unit cost) - budgeted fixed operating costs.`  
**Checked explanation:** 1,100*($12-$5)-$5,900 = $7,700-$5,900=$1,800.  
**Expected answer:** **1800 USD** (validation tolerance 0.01).

**Player decisions and outcomes:**

- **A · Fund new advertising:** Beginning Month 3, raise fixed cash advertising $200/month and forecast +130 potential regular orders/month.
- **B · Fund food-waste training:** Pay/expense $400 at the start of Month 3; halves the upcoming baseline waste surcharge in Round 17 from $0.20 to $0.10 per meal.
- **C · Hold cash reserves:** No additional planned expenditure or demand; keep costs steady.

**Posting/financial-statement logic:** At Round 15 close recognize Month 2 actual results only. The Month 3 initiative is scheduled and posted in Month 3, then the Month 3 static budget is frozen before demand shock.

**Incorrect-answer feedback:** The budget is a PLAN, not actual revenue. After this choice, let the player lock a Month 3 forecast and show expected operating income; unexpected Month 3 events arrive next chapter.

**Implementation guardrail:** Checkpoint 3: include budget vs Month 2 actual, and freeze Month 3 planned units, mix, price, standards and fixed costs for variance analysis.

---

## Chapter 4: Financial Trouble

**Milestone:** Diagnose bad weather, materials/labor variances and segment economics. R20 closes Month 3 and reverses temporary events for the next month.

### R16 — Sales slump!

**Course alignment:** 22: flexible budgets; 23: sales-volume analysis  
**Effective time:** Month 3 operation and variance analysis  
**Learning goal:** Separate lower activity volume from spending and pricing performance.

**Story and data card:** A bad-weather episode reduces Month 3 price-sensitive walk-up demand by 12%. An instructional budget expected 1,100 meals, $7 contribution per meal; actual demand from the 12% reduction is 968 meals.

**Knowledge challenge:** What is the sales-volume CONTRIBUTION variance (actual minus budgeted) in this example?  
**Calculation:** `Sales-volume contribution variance = (actual units - budgeted units) * budgeted unit contribution margin.`  
**Checked explanation:** (968-1,100)*$7 = -$924, a $924 unfavorable volume variance.  
**Expected answer:** **-924 USD** (validation tolerance 0.01).

**Player decisions and outcomes:**

- **A · Shorten crew shifts temporarily:** Reduce Month 3 cash payroll/fixed expense by $400; reduce Month 3 capacity by 100 units; restore both in Month 4.
- **B · Emergency promotion:** Spend/expense $200 only in Month 3; recover 140 potential regular meals in Month 3, subject to capacity.
- **C · Ride out the weather:** No new cost or demand response; actual activity stays depressed for Month 3 only.

**Posting/financial-statement logic:** Reduce only Month 3 demand, not all months. Apply temporary changes once and reverse before Month 4.

**Incorrect-answer feedback:** A sales-volume variance is not the same thing as a material price variance or an unfavorable spending variance. Show the counterfactual results at the original planned activity level.

**Implementation guardrail:** Use the player's frozen budget standards for live variances; the 1,100-to-968 instructional example remains fixed for standardized mastery checking.

---

### R17 — Food waste and material variances

**Course alignment:** 23: direct-material price and quantity variances  
**Effective time:** Month 3 operation and variance analysis  
**Learning goal:** Calculate the materials price and usage variances and diagnose causes separately.

**Story and data card:** A standalone audit finds 900 meals made. Standard recipe: 2.0 ingredient units/meal at $1.50/unit. Actual consumption: 1,980 ingredient units at $1.65/unit. The live business also faces a small Month 3 waste surcharge of $0.20 per fulfilled meal (or $0.10 if it trained in Round 15).

**Knowledge challenge:** What is the TOTAL unfavorable direct-materials variance in the audit?  
**Calculation:** `APV = (actual price - standard price)*actual quantity; AUV = (actual quantity - allowed standard quantity)*standard price.`  
**Checked explanation:** Allowed SQ=900*2=1,800. Price var=(1.65-1.50)*1,980=$297 U. Usage var=(1,980-1,800)*1.50=$270 U. Total=$567 U.  
**Expected answer:** **567 USD** (validation tolerance 0.01).

**Player decisions and outcomes:**

- **A · Train food-prep employees:** Spend/expense $180 once in Month 3; final waste cost surcharge becomes $0.05 per fulfilled meal for Month 3 onward.
- **B · Renegotiate ingredient pricing:** Spend/expense $200 once in Month 3; reduce non-sauce ingredient cost by $0.15 per meal from Month 3 onward; waste surcharge stays at $0.20 (or $0.10 if pre-trained).
- **C · Do nothing:** Leave waste surcharge at $0.20/meal in Month 3 onward (or $0.10 if trained in Round 15); no new expense.

**Posting/financial-statement logic:** Live waste surcharges are added to actual variable ingredient cost; separate cash action fees are expensed. The fixed teaching case does not automatically inject an additional $567 into the live ledger.

**Incorrect-answer feedback:** Unfavorable price variance and unfavorable quantity variance have different causes. Keep standard quantity at actual output, not original budgeted output.

**Implementation guardrail:** The optional ingredient renegotiation applies once; it does not cancel a separate supplier surcharge without being recorded explicitly.

---

### R18 — A labor-efficiency problem

**Course alignment:** 23: labor rate and efficiency variances  
**Effective time:** Month 3 operation and variance analysis  
**Learning goal:** Calculate direct-labor rate and efficiency variances using ACTUAL hours and standard hours for actual output.

**Story and data card:** In a projected Month 3 staffing unit, standard labor is 180 hours at $20/hour ($3,600 budget). Without action, expected actual labor is 198 hours at $22/hour ($4,356), an incremental variance of $756 above baseline planned wages. You can intervene before the shift.

**Knowledge challenge:** What is the total unfavorable labor variance for the projected shift?  
**Calculation:** `Rate = (AR-SR)*AH; Efficiency=(AH-SH)*SR; sum = AH*AR - SH*SR.`  
**Checked explanation:** Rate=(22-20)*198=$396 U; efficiency=(198-180)*20=$360 U; total=$756 U.  
**Expected answer:** **756 USD** (validation tolerance 0.01).

**Player decisions and outcomes:**

- **A · Targeted shift coaching:** Pay/expense $220 once in Month 3; projected excess payroll above baseline falls from $756 to $456; total incremental cash operating cost $676.
- **B · Bring in an experienced floater:** Pay/expense $350 once in Month 3; projected excess payroll falls from $756 to $256; total incremental expense/cash cost $606.
- **C · Absorb the overtime:** Excess actual payroll is $756 above planned payroll; no intervention fee.

**Posting/financial-statement logic:** At Month 3 close, expense the chosen excess payroll and one-time intervention. Cash payments equal recognized labor and intervention expenses.

**Incorrect-answer feedback:** Rate variance uses ACTUAL hours, not standard hours. The standard $3,600 wage bill is already part of baseline recurring payroll, so only the excess and interventions are incremental in the live month.

**Implementation guardrail:** Do not first book the full $756 and then also book the reduced $456/$256 excess; use the selected projected outcome only.

---

### R19 — Explain the monthly variances

**Course alignment:** 22: static vs flexible budgets; 23: responsibility reports  
**Effective time:** Month 3 operation and variance analysis  
**Learning goal:** Reconcile static-budget, flexible-budget and actual performance without attributing volume changes to cost managers.

**Story and data card:** A reference budget for 1,000 meals at $12 price, $5 variable cost and $5,900 fixed overhead yields $1,100 operating income. Actual activity was 900 meals; a properly flexed budget gives $400. Suppose actual income is $250.

**Knowledge challenge:** What is the $-amount of the UNFAVORABLE flexible-budget operating-income variance (actual minus flexible budget)?  
**Calculation:** `Flexible budget income at actual volume = 900*($12-$5)-5900=400; flexible-budget variance = actual operating income - flexible budget income.`  
**Checked explanation:** $250 - $400 = -$150, or $150 unfavorable. The separate sales-volume variance is $400-$1,100 = -$700.  
**Expected answer:** **-150 USD** (validation tolerance 0.01).

**Player decisions and outcomes:**

- **A · Investigate the cost drivers:** No immediate financial change; earn an analysis achievement if the student explains both the $700 volume variance and $150 flex variance.
- **B · Cut marketing permanently:** Beginning Month 4, decrease recurring marketing cash expense by $150/month; reduce future regular demand by 120 meals/month.
- **C · Raise menu prices:** Beginning Month 4, add $1 to bowl and wrap selling prices (and premium if active); reduce price-sensitive demand by 8%.

**Posting/financial-statement logic:** The fixed illustrative variance exercise is separate from the player's live variance report, which must use actual budget snapshots and fulfilled output.

**Incorrect-answer feedback:** A decline in total profit from lower volume does not necessarily indicate poor spending control. Flexible budgets hold activity constant to compare the cost side properly.

**Implementation guardrail:** Never penalize an operations manager for a 12% weather-driven sales decline in the controllable-cost score.

---

### R20 — Drop the low-profit wrap?

**Course alignment:** 24: segment reporting; 17: avoidable costs  
**Effective time:** Month 3 operation and variance analysis  
**Learning goal:** Avoid dropping a profitable segment merely because allocated common fixed costs make reported segment income negative.

**Story and data card:** A reference wrap segment sells 400 wraps at $10 each with $4.50 variable cost per wrap, direct avoidable fixed costs of $300, and allocated common overhead of $2,200. The overhead would continue if the segment were dropped.

**Knowledge challenge:** How much total COMPANY operating profit is LOST by dropping wraps, assuming no replacement sales?  
**Calculation:** `Lost segment margin = segment revenue - segment variable costs - avoidable fixed costs. Common allocated cost is irrelevant if unavoidable.`  
**Checked explanation:** 400*($10-$4.50)-$300 = $2,200-$300=$1,900 decrease in company operating income if dropped.  
**Expected answer:** **1900 USD** (validation tolerance 0.01).

**Player decisions and outcomes:**

- **A · Keep the wrap line:** Retain the selected wrap share, menu-support fixed cost and demand from Round 6.
- **B · Discontinue wraps:** From Month 4 onward, remove wrap orders/demand and any separately modeled avoidable recurring wrap-support fee; add 100 prospective replacement bowl orders/month; leave common shared overhead unchanged.
- **C · Redesign the wrap recipe:** Spend/expense $180 once in Month 4; lower variable wrap cost $0.60 per sold wrap, reduce wrap demand by 7% from Month 4 onward.

**Posting/financial-statement logic:** At month close post actual sales and variable expenses; after Round 20 restore Month 3 temporary weather/overtime effects before Month 4.

**Incorrect-answer feedback:** An allocated segment loss is not sufficient evidence to discontinue. Use contribution that would be lost minus costs actually avoided, and account for any replacement sales.

**Implementation guardrail:** If wraps are discontinued, remove the +100/+180 menu-driven demand boost from R6, turn wrap share to zero, reverse avoidable wrap-support fee, and add only the 100 specified replacement bowl prospects. Common overhead continues.

---

## Chapter 5: CFO/Expansion

**Milestone:** Manage accruals and the investment decision. R23 closes Month 4; R24 and R25 happen after that close, so financing does not create fake Month 4 performance.

### R21 — Profitable... but short on cash

**Course alignment:** Financial statement analysis; 17: relevant financing  
**Effective time:** Month 4 operations (close Month 4 at R23)  
**Learning goal:** Reconcile cash and accrual profit, record accounts receivable, and evaluate early collection discounts.

**Story and data card:** A one-time Month 4 corporate order has already been delivered using offsite capacity. Invoice price is $2,400, and all-in direct production costs paid now are $1,000. The client normally pays after Month 4. Alternatives provide immediate collection.

**Knowledge challenge:** If the client does NOT pay by month-end, how much operating profit is earned from this invoice BEFORE other overheads?  
**Calculation:** `Accrual gross contribution = revenue earned - production expense incurred, regardless of collection.`  
**Checked explanation:** $2,400 revenue - $1,000 cash-paid production cost = $1,400 profit contribution; A/R increases $2,400 while cash decreases $1,000.  
**Expected answer:** **1400 USD** (validation tolerance 0.01).

**Player decisions and outcomes:**

- **A · Invoice at normal terms:** Dr A/R 2,400 / Cr Sales 2,400; pay/expense $1,000 direct production; invoice remains outstanding at Month 4 end; cash received only in future period.
- **B · Offer 2% early-payment discount:** Collect $2,352 immediately; journal: Dr Cash 2,352; Dr Sales Discounts (contra-revenue) 48; Cr Sales Revenue 2,400. Recognize net sales of $2,352 and $1,000 direct production expense. No ending A/R for this invoice.
- **C · Factor the invoice without recourse:** Recognize $2,400 sales and $1,000 cost; transfer $2,400 A/R to a factor for $2,304 cash, expense $96 factoring fee; no ending A/R.

**Posting/financial-statement logic:** The invoice is a completed service outside the truck capacity model; the $1,000 is an incremental period variable expense, paid once. Never book it a second time at month close.

**Incorrect-answer feedback:** Net income and cash can move differently. A completed sale on credit creates revenue and receivable even though the bank account is still waiting.

**Implementation guardrail:** Offer the early-discount choice as an explicit 2% reduction in revenue, not as an unexplained reduction in A/R.

---

### R22 — The refrigerator breaks

**Course alignment:** Asset versus expense; depreciation  
**Effective time:** Month 4 operations (close Month 4 at R23)  
**Learning goal:** Classify a routine repair separately from purchasing an upgraded long-lived asset.

**Story and data card:** Your existing refrigerator can be repaired for $650. Alternatively, install an additional upgraded $1,800 refrigeration system with a 36-month zero-residual life that saves $0.18 in spoilage per meal. Or rent a temporary equivalent refrigerator for $130 for Month 4.

**Knowledge challenge:** If the new refrigerator costs $1,800 and lasts 36 months with no residual value, what is monthly straight-line depreciation?  
**Calculation:** `Monthly depreciation = (capitalized cost - residual value) / useful months.`  
**Checked explanation:** $1,800/36 = $50/month.  
**Expected answer:** **50 USD** (validation tolerance 0.01).

**Player decisions and outcomes:**

- **A · Repair existing refrigerator:** Cash -$650, Repairs Expense +$650 in Month 4; restore normal operating capacity; no new fixed asset.
- **B · Install upgraded refrigeration:** Cash -$1,800, PPE +$1,800; depreciate $50 from Month 4; reduce spoilage variable cost by $0.18 per actual sold meal from Month 4 onward.
- **C · Rent a temporary unit:** Expense/pay $130 in Month 4 for temporary rental; capacity restored for the month; no new asset or savings in per-meal cost.

**Posting/financial-statement logic:** Classify the purchase in PPE; depreciation reduces income but is noncash. Old truck assets remain in service; the game assumes no asset disposal or impairment.

**Incorrect-answer feedback:** Capitalizing ordinary repairs would overstate current profit. Buying a distinct multi-year asset does not make $1,800 an immediate operating expense.

**Implementation guardrail:** Every option maintains food safety and service capacity; the educational choice is cost classification and expected economics, not food safety.

---

### R23 — Invest in faster preparation equipment

**Course alignment:** 25: NPV; payback; depreciation  
**Effective time:** Month 4 operations (close Month 4 at R23)  
**Learning goal:** Evaluate a capital purchase using future incremental cash flows and differentiate NPV from accounting profit.

**Story and data card:** A process improvement machine costs $2,400 today; it saves $1,050 CASH annually in operating costs for 3 years and can be sold for $300 at the end of Year 3. The required return is 10%. Salvage value for depreciation is also assumed $300. Alternative lease is $95/month for the same monthly $87.50 savings.

**Knowledge challenge:** What is the project net present value (NPV), rounded to the nearest dollar?  
**Calculation:** `NPV = -2,400 + SUM(1,050/(1.10)^t for t=1,2,3) + 300/(1.10)^3.`  
**Checked explanation:** PV yearly savings = $2,611.20; PV terminal value = $225.39; NPV = +$436.59, rounded +$437. Simple payback ignoring residual is 2.29 years.  
**Expected answer:** **437 USD** (validation tolerance 1).

**Player decisions and outcomes:**

- **A · Buy the machine:** Buy $2,400 PPE now; record $300 residual value and depreciation ($2,400-$300)/36=$58.33/month from Month 4; save $87.50 monthly cash operating expense during modeled months.
- **B · Month-to-month equipment rental:** Take a cancellable month-to-month equipment rental for $95 cash/expense in Month 4, and realize $87.50 monthly operating cash cost savings; the simplified contract does not transfer title and creates no long-term committed lease.
- **C · Keep the existing process:** No investment or added cash savings.

**Posting/financial-statement logic:** Month 4: post machine acquisition (if bought), month-4 depreciation ($58.33), the $87.50 cost savings, or cancellable monthly rental cost ($95) if rented. Close all Month 4 operating transactions once at this checkpoint before Round 24.

**Incorrect-answer feedback:** Use incremental future CASH flows for NPV; do not subtract depreciation from NPV cash flows. The $300 end-of-life residual occurs in Year 3, not each year.

**Implementation guardrail:** Close Month 4 after this round, before expansion planning. In actual accounting, non-cancellable leases may require right-of-use assets and liabilities under ASC 842; this option is specifically a cancellable short-term rental. The $300 residual cash comes at Year 3.

---

### R24 — Should you open a second truck?

**Course alignment:** 25: capital budgeting; investment vs financing  
**Effective time:** Start of Month 5, after Month 4 close  
**Learning goal:** Calculate a project NPV independently from its financing method, and recognize loan proceeds as liabilities.

**Story and data card:** A second truck costs $18,000 now. It is forecast to generate $6,500 of incremental UNLEVERED cash flow at each of the next four year-ends, plus $3,000 terminal resale cash at Year 4. Hurdle rate: 12%. A bank will finance 60% at 9% APR with 60 equal monthly payments beginning next month.

**Knowledge challenge:** What is the NPV of opening the second truck, rounded to the nearest dollar?  
**Calculation:** `NPV = -18,000 + SUM(6,500/(1.12)^t for t=1..4) + 3,000/(1.12)^4.`  
**Checked explanation:** PV annuity = $19,742.77; PV resale = $1,906.55; NPV = +$3,649.32, rounded +$3,649.  
**Expected answer:** **3649 USD** (validation tolerance 1).

**Player decisions and outcomes:**

- **A · Buy the second truck with cash:** After Month 4 close, at the beginning of Month 5: if current cash >= $20,000, purchase the $18,000 truck as PPE for cash; maintain a $2,000 minimum cash reserve. No new-truck Month 4 revenue or depreciation. Depreciate over 48 months with $3,000 salvage from Month 5 if future statements are shown.
- **B · Finance 60% of the truck:** After Month 4 close, at the beginning of Month 5: if cash >= $9,200, record PPE +$18,000, bank loan +$10,800, cash -$7,200; monthly payment ~$224.19 begins one month later. No new-truck Month 4 revenue/depreciation. $2,000 reserve required.
- **C · Wait and build cash:** Do not expand; preserve cash, debt capacity and equipment flexibility.

**Posting/financial-statement logic:** At acquisition, Dr PPE 18,000, Cr Cash 18,000 for cash route; financed route also Dr Cash 10,800 / Cr Loan 10,800. Interest begins after month-end. No future projections are falsely counted as current realized profits.

**Incorrect-answer feedback:** Financing affects liquidity and debt service, not the NPV of the unlevered project. Loan proceeds are not revenue. The same project NPV applies whether paid in cash or financed.

**Implementation guardrail:** Round 23 has already closed Month 4. Finance and ownership decisions are start-of-Month-5 transactions and do not retroactively change Month 4 results. Financing affects liquidity/debt service, not project unlevered NPV.

---

### R25 — Present to the investor committee

**Course alignment:** Financial statements; 14: strategy; 24: segment analysis  
**Effective time:** Start of Month 5, after Month 4 close  
**Learning goal:** Read the completed financial statements, explain economic tradeoffs, and separate owner distributions, loan payments and prepaid costs from current operating profit.

**Story and data card:** Investors want a reconciled Month 4 income statement, a current balance sheet, a cash-flow bridge, a dashboard of margins, and a one-paragraph recommendation supported by accounting data.

**Knowledge challenge:** A business has $12,000 of assets and $4,000 of liabilities. What is book equity?  
**Calculation:** `Assets = Liabilities + Equity; Equity = Assets - Liabilities.`  
**Checked explanation:** $12,000-$4,000=$8,000 book equity. An owner draw reduces cash and equity, not operating expense.  
**Expected answer:** **8000 USD** (validation tolerance 0.01).

**Player decisions and outcomes:**

- **A · Distribute $1,000 to owner:** If cash remains >=$2,000, post a $1,000 owner distribution: Dr Owner Distributions (contra-equity)/Cr Cash; current profit unchanged.
- **B · Retain all current cash:** No ledger change; show ability to fund payroll, equipment maintenance and future opportunities.
- **C · Prepay $1,000 of next month's advertising:** If cash remains >=$2,000, Dr Prepaid Advertising 1,000 / Cr Cash 1,000; not expensed until campaign is delivered next month.

**Posting/financial-statement logic:** Generate final 4-month P&L and cash-flow bridge from already-closed months. Update post-Month-4 balance sheet for any R24 capital purchase/loan and R25 distributions or prepayments; do not close Month 4 a second time.

**Incorrect-answer feedback:** Book equity and cash are not synonyms, and an owner distribution does not decrease income. Current-period advertising expense also does not arise merely from paying in advance for next month.

**Implementation guardrail:** A post-close owner distribution reduces equity and cash, not Month 4 net income. Any prepaid Month 5 advertising is a current asset until consumed. Provide a restart and copyable report; do not collect personal information.

---

## 8. Optional advanced Mastery Lab (5 bonus cases)

The optional challenges extend content without making peer reviewers play an excessively long game. Their accounting math is fully separate from the live business ledger unless the team explicitly builds an “Apply to My Truck” extension and records incremental effects consistently.

### B1 — Allocate overhead by preparation hours

**Topic:** 20: cost allocation  
**Scenario:** Existing shared monthly overhead is $1,800; bowls use 75 setup/prep hours and wraps use 25 hours.  
**Question:** How much overhead should the wraps receive if prep hours are the driver?  
**Calculation:** `Rate = 1800/(75+25)=$18/hour; wraps overhead=25*$18.`  
**Solution:** $450 wraps; $1,350 bowls; total reconciles to $1,800.  
**Expected answer:** **450**

- **A · Use preparation hours:** Correct driver for the stated labor-preparation workload; managerial allocation only.
- **B · Split overhead equally:** Assign $900 to each line, despite different driver use; demonstrate distortion.
- **C · Allocate by sales revenue:** Allocate proportionally to revenue; results differ from the specified prep-hour basis.

**Feedback:** Allocation redistributes an existing total; it does not create another $1,800 of expense.

### B2 — One more employee at a step-cost threshold

**Topic:** 15: step cost / CVP  
**Scenario:** You can serve 900 meals; demand is 950. Incremental 50 meals have $7 contribution margin each, but adding a shift costs $400.  
**Question:** What is the incremental MONTHLY profit from hiring just for these 50 sales?  
**Calculation:** `50*$7 -$400.`  
**Solution:** -$50: reject the $400 shift on these facts unless benefits outside this month justify it.  
**Expected answer:** **-50**

- **A · Hire additional shift:** Serve 50 extra, $350 contribution, $400 cost, net -$50.
- **B · Decline the extra 50:** No additional contribution and no shift cost; profit $50 higher than A.
- **C · Improve kitchen throughput:** Hypothetical alternative: spend $200 for a one-time 50-meal efficiency boost; net +$150, if feasible.

**Feedback:** The most sales is not automatically the most profit; thresholds matter.

### B3 — Inventory is not automatically expensed

**Topic:** Financial accounting inventory / COGS  
**Scenario:** The owner buys $1,000 ingredients before operating; $720 is used in meals sold, and $280 remains usable in inventory.  
**Question:** What is closing inventory?  
**Calculation:** `Closing inventory=beginning inventory + purchases - ingredients consumed.`  
**Solution:** 0+1000-720=$280 inventory; $720 COGS; total cash spend $1,000.  
**Expected answer:** **280**

- **A · Record $280 closing inventory:** Correct: recognize $720 expense and $280 asset.
- **B · Expense all $1,000 now:** Incorrect: understates inventory and profit by $280.
- **C · Record $1,000 ending inventory:** Incorrect: ignores $720 ingredients consumed in sold meals.

**Feedback:** Cash outflows for buying inventory and expense recognition for ingredients used occur at different points.

### B4 — Evaluate managers fairly

**Topic:** 23: responsibility accounting  
**Scenario:** A kitchen manager can influence food waste and shift schedules, but cannot control a citywide power rate increase or an unexpected storm.  
**Question:** How much of a $500 storm-driven sales shortfall is controllable by the kitchen manager without additional evidence?  
**Calculation:** `Responsibility reports should isolate controllable items when evaluating the manager.`  
**Solution:** $0 directly attributable as a controllable operating cost on the stated evidence.  
**Expected answer:** **0**

- **A · Focus on controllable waste and productivity:** Correct: assess manager using relevant controllable measures.
- **B · Penalize manager for the storm:** Misattributes demand shock to a production supervisor.
- **C · Ignore all performance measures:** Fails to use useful operational data, even for controllable costs.

**Feedback:** Responsibility accounting is about decision rights and controllability, not only arithmetic.

### B5 — Stress-test the second truck

**Topic:** 25: NPV sensitivity  
**Scenario:** Second-truck cash inflows decline 15%, from $6,500 to $5,525 per year for 4 years. Project remains $18,000 initial investment, $3,000 Year-4 resale and 12% discount.  
**Question:** What is the stressed NPV rounded to dollars?  
**Calculation:** `NPV=-18000+SUM(5525/1.12^t,t=1..4)+3000/1.12^4.`  
**Solution:** $687.91, or +$688. Break-even annual CF ≈$5,298.52, a roughly 18.48% decline from original.  
**Expected answer:** **688**

- **A · Invest: positive NPV:** Correct on the simplified risk-adjusted known scenario, subject to liquidity and uncertainties.
- **B · Reject because inflows declined:** Incorrect: decline alone does not imply negative NPV.
- **C · Ignore the sensitivity:** Fails to compare expected value with downside conditions.

**Feedback:** A positive NPV does not eliminate risk; present stress tests, risk tolerance, and liquidity separately.

## 9. Accounting engine: data model and transaction integrity

### 9.1 Core entities

```ts
type Money = number; // integer CENTS, never floating point for posted ledger values
type Month = 1 | 2 | 3 | 4 | 5;
type Stage = "prelaunch" | "operating" | "postclose";
type Account = "cash" | "accountsReceivable" | "deposits" | "prepaidAdvertising" |
  "equipmentCost" | "accumulatedDepreciation" | "loansPayable" |
  "ownerCapital" | "retainedEarnings" | "ownerDistributions" |
  "revenue" | "salesDiscounts" | "variableFood" | "deliveryFees" |
  "variableLocationFees" | "payroll" | "rent" | "utilities" |
  "insurance" | "marketing" | "onboarding" | "repair" |
  "factoringExpense" | "depreciationExpense" | "otherOperatingExpense";
type Posting = { account: Account; debitCents: Money; creditCents: Money };
type JournalEvent = { id: string; roundId: string; effectiveMonth: Month;
  kind: string; posted: boolean; postings: Posting[] };
type MenuItem = { id: "bowl" | "wrap" | "premium"; priceCents: Money;
  baseVariableCostCents: Money; expectedDemand: number };
type Cohort = { id: string; itemId: string; demand: number;
  priceCents: Money; variableCostCents: Money; priority: number };
type Asset = { id: string; costCents: Money; salvageCents: Money;
  usefulMonths: number; inServiceMonth: Month; accumulatedDepreciationCents: Money };
type BudgetSnapshot = { month: Month; unitsByCohort: Record<string,number>;
  pricesCents: Record<string,Money>; standardVariableCostsCents: Record<string,Money>;
  fixedExpenseCents: Money; createdAfterRound: "R15"; frozen: true };
type SaveGame = { schemaVersion: 1; gameMode: "full" | "quick";
  nextRound: number; choices: Record<string,string>; journal: JournalEvent[];
  inventorySimplification: true; budgetMonth3?: BudgetSnapshot;
  checkpoints: Record<string,unknown>; masteryAttempts: Record<string,number>;
  scores: { mastery: number; operating: number }; rescued: boolean };
```

### 9.2 Idempotent accounting operations

- Every journal event has a stable unique ID such as `R10-M1-settlement`; prevent posting the same event twice (including refresh, back-navigation or resume).
- Validate each event: sum(debits) = sum(credits), amounts nonnegative, and asset/liability/equity identity holds after event is posted.
- Post equipment purchases as asset swaps, monthly depreciation as noncash expense plus accumulated depreciation, owner withdrawals as contra-equity, and loan proceeds as liabilities.
- Do not book prospective demand or budget targets as revenue. Do not count allocated overhead twice. Do not count the purchased mixer or refrigerator as an immediate full operating expense.
- Use exact money amounts in CENTS; use Decimal or rational numbers for NPV and high precision for allocation, then round display at prescribed boundaries.
- Preserve posted months as immutable; from then on allow only explicitly dated adjustment journal entries, never rewrite prior results in place.
- Recompute managerial reporting views from ledger + actual order detail so the same transaction cannot be categorized twice.

### 9.3 Recommended month-close pseudocode

```ts
function closeOperatingMonth(save, month) {
  assert(month === expectedNextMonth(save));
  const config = deriveCurrentPolicies(save.choices, month);
  const wanted = deriveDemandCohorts(config, month);
  const fulfilled = allocateWholeMealsByPriority(wanted, config.capacity);
  const sales = sum(fulfilled.map(c => c.units * c.priceCents));
  const variable = sum(fulfilled.map(c => c.units * c.variableCostCents));
  const fixed = deriveRecurringAndOneTimeExpenses(config, month);
  const depreciation = sumMonthlyAssetDepreciation(save.assets, month);
  const extra = explicitCreditSalesAndTimingEvents(save, month);
  const draftJournal = createBalancedPostingBatch(sales, variable, fixed, depreciation, extra);
  verifyJournalBalances(draftJournal);
  verifyNoEventAlreadyPosted(save.journal, draftJournal);
  const result = appendPostedEvents(save, draftJournal);
  verifyBalanceSheetIdentity(result);
  return freezeMonthEnd(result, month);
}
```

### 9.4 Account chart

| Group | Accounts | Posting examples |
|---|---|---|
| Current assets | Cash; A/R; Refundable deposits; Prepaid advertising | Sales collection, R21 credit invoice, R02 deposit, R25 prepaid campaign |
| Long-lived assets | Equipment at cost; Accumulated depreciation | R01/R12/R22/R23/R24 equipment, month-end depreciation |
| Liabilities | Bank loan payable | R24 financing; future interest/principal schedules |
| Owner equity | Owner capital; retained earnings; distributions | Initial $25k contribution, monthly results, R25 owner draw |
| Revenue | Bowl/wrap/premium/catering sales; contra-revenue discounts | Only fulfilled/delivered sales and discounts |
| Direct variable costs | Ingredients; sauce; packaging; processing; app commission; variable rent/overtime | Per actual fulfilled cohort and explicit channel rules |
| Fixed/one-time costs | Payroll, rent, insurance, utilities, marketing, onboarding, repairs, factoring | Month expenses and events specified in round choices |
| Noncash costs | Depreciation | Month-dependent cost allocation, never a cash payment |

## 10. Learning feedback, game mechanics and fairness

- **Accounting mastery:** 25 scored knowledge checks, maximum 4 points each. First-try correct = 4; correct after optional hint = 2; answer revealed = 0. Display why errors happen and the correct formula after completion. Wrong answers never corrupt the financial ledger.
- **Business performance:** separate diagnostic view for cumulative realized operating income, liquid cash/reserve coverage, contribution margin, and budget quality. Do not call every financially smaller outcome a wrong decision, especially when liquidity or uncertainty justifies caution.
- **Attempt UX:** Numeric questions display dollars/meals/percent and allowable rounding. Explanation is visible before moving on. For decision-only dilemmas, always show a counterfactual: “If you had selected the other choice, given your current capacity, here is the estimated Δ profit/cash.” This is a simulation, so the assumptions must be shown.
- **Bankruptcy and recovery:** At a month close with cash < $0, present a visible mandatory emergency funding event. Offer required owner equity equal to the shortfall plus a $2,000 buffer, equivalent bridge debt (assumed 1.5% monthly starting next month), or restart checkpoint; neither equity nor borrowing is revenue. Record rescues separately, and do not award a fictional “best profit” from injected cash.
- **Achievement examples:** Break-Even Boss (R4), Margin Detective (R17), Forecast Fixer (R19), Investor Ready (finish with reconciled statements), Cash Guardian (no rescue event). They are cosmetic, not extra accounting credit.
- **Replayability:** deterministic base conditions with branching choices, plus an optional “random scenario seed” only after the deterministic mode is graded and tested. All formula explanations must remain valid under seeds.
- **Accessibility:** full keyboard operation, visible focus, aria labels, no color-only feedback, proper contrast, large tap targets, transcript alternatives for any sound and no required audio or animations.
- **No unjustified pressure:** “Your store survived but borrowed to fund its expansion” can be a valid ending. Show the effects, not a moral judgment or unsupported promise of investment success.

## 11. UI map, screen-by-screen

- **Landing and objectives:** Title, concise 3-learning-objective intro, Full Career / Quick Challenge / Resume / Bonus Lab, 25/5 scope, no login.
- **Business creation:** Name your truck with a default fictional name; enter no personal information; select mode. Explain $25,000 equity funding.
- **Round play:** Top: chapter/progress and one-sentence learning goal. Left/main: story, demand/financial data. Center: numeric question + hint. Bottom: 3 strategic decision cards. On mobile stack vertically.
- **Consequences:** Before/after financial KPIs, −/$ changes and their cause. Correct/incorrect explanation with equation and link to concept glossary. Advance button only after acknowledgment.
- **Persistent CFO Dashboard:** Cash (not profit), realized sales, contribution margin, operating income, booked A/R, PPE, loan debt, net equity; month selector with actual/forecast tags.
- **Income statement:** Toggle financial GAAP-style presentation vs managerial contribution format; show net sales, variable costs, fixed expenses, depreciation and operating income.
- **Cash-flow and balance sheet:** Simple cash receipts/payment bridge, assets/liabilities/equity with identity check; cash-versus-profit insight especially in R21.
- **Budget center:** R15 locked Month-3 assumptions, R16–R20 static/flexible/actual waterfall with labeled variance causes.
- **Checkpoint:** 5-round teaching recap, score trend, financial statements, retry/resume/export; quick explanation of what changed.
- **Final investor report:** Four-month results table; start-of-Month-5 investment/financing impact; cumulative mastery; two-sentence tailored risk analysis; restart/copy result.
- **Instructor/reviewer panel:** Sources and assumptions, keyboard instructions, accessibility, expected completion time and option to play 5 quick cases.

## 12. Hosting, coding architecture and content packaging

**Suggested stack:** Vite + React + TypeScript for the mobile-friendly web application; a small modular CSS system or Tailwind; Vitest for unit tests; Playwright for end-to-end desktop/mobile regression; Cloudflare Pages or another static HTTPS host. No database, user account, third-party billing API, or external financial data is needed. Keep accounting code in pure testable functions separate from React components. Do not request external artwork or copyrighted images; use original SVG/icons and CSS graphics.

```text
src/
  game/content/rounds.json              # all R01–R25 + B1–B5 content
  game/content/glossary.ts               # original definitions, citations
  game/engine/money.ts                   # exact cents, rounding
  game/engine/demand.ts                  # cohorts, elasticity, mix, priority
  game/engine/costs.ts                   # unit costs, fixed spending, capacity
  game/engine/ledger.ts                  # balanced postings, balance sheet
  game/engine/depreciation.ts            # assets, useful life, salvage
  game/engine/budgets.ts                 # month-3 frozen standards & variances
  game/engine/investments.ts             # NPV, loan payment, cash reserve
  game/engine/scoring.ts                 # mastery and diagnostic KPIs
  game/engine/scenarios.ts               # apply decision -> monthly state
  game/storage.ts                        # localStorage version/repair
  components/Dashboard.tsx
  components/DecisionCard.tsx
  components/LearningCheck.tsx
  components/FinancialStatements.tsx
  components/Checkpoint.tsx
  components/Results.tsx
tests/engine/*.test.ts
tests/e2e/full-career.spec.ts
tests/e2e/quick-review.spec.ts
```

**Data handoff:** Use the companion `startup_survivor_round_specs.json` as the canonical scenario/story/question/choice inventory, with `R01…R25` and `B1…B5` stable IDs. The JSON describes financial effects in plain English so the coding agent must convert them into explicit typed, deterministic `ChoiceEffect` objects with numeric parameters and unit tests. Do not attempt to calculate financial statements with an LLM at runtime; code the formulas and transaction postings.

## 13. Test plan: must pass before deployment

- Every fixed worked answer in the 25 rounds and five bonus questions agrees with its formula at stated rounding (reference validator currently checks 28 arithmetic examples).
- On every posted event and every month end, debits equal credits and A=L+E to within zero cents.
- Reference used-truck path: Month 1 net income $1,635 and bank balance $14,035; M2 profit $975; M3 loss $799.90; M4 profit $1,505; final Month 4 cash $13,915.10.
- Reference R24 financing after Month 4: cash $6,715.10, A/R $2,400, net PPE $29,200, refundable deposit $800, loan $10,800 and equity $28,315.10.
- R21 credit sale: profit increases $1,400 but cash declines $1,000 and A/R increases $2,400; immediate payment changes cash and, with discount/factoring, net income as explicitly documented.
- R13 ABC reallocates existing costs and never increases total company expense by $2,100.
- R18 records ONLY chosen wage excess and intervention payment, not a redundant $756 charge.
- R24 debt proceeds do not appear in revenue; interest begins after the first Month-5 accrual and new truck produces no Month-4 revenue.
- For each of 75 strategic choices, snapshot and verify changed state variables (prices, cohort demand, mix, capacity, expense, assets, liabilities, equity and month timing).
- Property-based tests: random legal combinations produce no negative fulfilled meal count, no double-sold capacity, accurate cohort totals, no duplicate event postings, and no unexplained balance-sheet differences.
- Reserve and failure paths: user cannot select capital option if available posted cash would drop below $2,000; all paths have a nonblocking next choice or transparent recovery UI.
- Browser QA: one iPhone-size viewport (375px), one desktop viewport (1440px), mouse/keyboard navigation, reload/resume at each chapter, fresh-browser quick-review mode, poor network/offline once loaded.
- Content review by two team members for formulas, reasonable assumptions, readability at limited-accounting experience level, and consistent pronunciation of “unfavorable”, “opportunity cost”, and “noncash”.
- Final link must open without authentication on PC, Mac and mobile; source acknowledgments and original asset policy must be visible.

## 14. Suggested team work plan and completion gates

| Workstream | Deliverable | Acceptance gate |
|---|---|---|
| Accounting lead | Sign off all 25 answers, no double counting, assumptions, sample statements | Balance sheet and month-close validator pass; instructor-friendly explanation |
| Narrative/teaching lead | Game copy, objectives, hints, glossary, all 75 choices and alternate feedback | Every wrong answer explains *why*; all assumptions visible |
| Development lead | React game, persistence, engine, reports, deployment | All unit/E2E tests pass; stable public link |
| Testing/design lead | Desktop/mobile playtests, accessibility, QA screenshots, peer-review walkthrough | Quick mode fits peer-review use; chapter save/restore works |
| Whole team | Final review, citations, peer evaluation requirements | All members contribute and individually complete assigned peer evaluations |

**Delivery sequence:** Freeze mechanics, then implement a reliable accounting engine, then complete R1–R5 and one month-close, then add chapters 2–5, then final reporting, then Quick Challenge, then optional bonuses/polish. Do not spend effort on animations until the financial engine balances and the core flow is complete.

## 15. Copy-paste coding-agent implementation brief

> Build a mobile-first, accessible React + TypeScript web game titled “Startup Survivor: Build a Food Truck Empire.” Use the companion JSON for all 25 core scenarios, 75 strategic options and five optional challenges. The player begins with $25,000 owner equity and operates one food truck over four simulated months. Implement deterministic unit demand, order cohorts, truck capacity, product mix, special orders, pricing, expense choices, accruals, depreciable assets, bank financing, and balanced double-entry journal postings. Close Month 1 at R10, Month 2 at R15, Month 3 at R20, Month 4 at R23. Treat R24–R25 as start-of-Month-5 post-close financial/board decisions. Every knowledge question must have objective, hint, worked numerical explanation, meaningful feedback and correct rounding; strategic alternatives must show accounting consequences without falsely calling reasonable tradeoffs wrong. Build persistent dashboards, managerial and financial statements, cash-flow and budget/variance panels, five-round checkpoints, quick peer-review mode, local save/resume, 25-round score, investor report, and the optional bonus lab. No server, authentication, copyrighted images, proprietary assets, third-party paid APIs, or runtime LLM calculations. Use pure functions for financial calculations, cents for money, Vitest and Playwright tests, an accessible small-screen interface, and static HTTPS deployment. First ensure that every journal balances, then match the validated reference scenario and all 28 arithmetic checks in the `startup_survivor_validation.py` file. Include an assumptions and sources screen. Do not invent additional accounting treatments that conflict with the provided model.

## 16. Source and originality notes

- Instructor project requirements: supplied “MBA Core Assignment 2 - Game.pdf” (web-based PC/Mac/mobile, objectives, explanations for wrong answers, no copyrighted imagery, external source citations, five-part peer grading).
- Course context: user-provided Auburn University BUSI 7230 Fall 2026 syllabus, taught by Duane Brandon, which prioritizes interpreting financial information and using managerial accounting for business decisions.
- Module inspiration: user-provided archive of 25 solution workbooks for Financial & Managerial Accounting for MBAs, 7th edition, by Easton (Module 15 cost behavior, 16 CVP, 17 relevant costs, 19 ABC, 21 pricing, 22 budgeting, 23 variances, 24 segments, 25 capital budgeting), subject to confirming the instructor’s actual module list.
- All names, food-truck examples, prices, demand forecasts, financial statements, worked calculations, game mechanics and fictional case narratives in this document are newly proposed teaching content; the application must not publish textbook solution sheets or copy copyrighted artwork.
- No real-world earnings or investment return is promised; every rate, volume, hurdle and operating assumption is fictional and for educational demonstration.

**End of planning document.** Companion files: `startup_survivor_round_specs.json` (full machine-readable round inventory), `startup_survivor_validation.py` (arithmetic and reconciled four-month reference path).

