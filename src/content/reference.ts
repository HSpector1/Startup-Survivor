// Startup Survivor: educational content module
// Glossary, model assumptions and sources for "Startup Survivor: Build a Food Truck Empire"
// Auburn MBA BUSI 7230. All numbers are fictional teaching cases.

export const GLOSSARY: {
  term: string;
  definition: string;
  formula?: string;
  example?: string;
  rounds: string[];
}[] = [
  {
    term: "Asset",
    definition:
      "An asset is something your business owns or is owed that will help it earn money in the future. Cash, equipment, receivables, prepaid costs and refundable deposits are all assets.",
    example:
      "You buy a $12,000 truck with cash. Cash falls by $12,000 and Equipment rises by $12,000, so total assets stay the same.",
    rounds: ["R01", "R02", "R21", "R25", "B3"],
  },
  {
    term: "Liability",
    definition:
      "A liability is an amount your business owes to someone else. Bank loans and unpaid bills are liabilities, and they are not revenue.",
    example:
      "You borrow $10,800 from a bank to help buy a second truck. Cash rises by $10,800 and Loan Payable rises by $10,800. You earned nothing yet.",
    rounds: ["R24", "R25"],
  },
  {
    term: "Owner's equity",
    definition:
      "Owner's equity is the part of the business's assets that belongs to you after all liabilities are paid. It grows with your contributions and profits and shrinks with losses and owner distributions.",
    formula:
      "Equity = Contributed capital + Cumulative net income - Owner distributions",
    example:
      "You start with $25,000 of contributed capital. A $1,000 owner distribution later lowers equity by $1,000.",
    rounds: ["R01", "R25"],
  },
  {
    term: "Accounting equation",
    definition:
      "The accounting equation says everything the business has is funded by what it owes or by what the owner has put in or left in. It must balance to the cent after every posted event.",
    formula: "Assets = Liabilities + Owner's equity",
    example:
      "Assets of $12,000 and liabilities of $4,000 leave $8,000 of book equity.",
    rounds: ["R01", "R25"],
  },
  {
    term: "Revenue recognition",
    definition:
      "You record revenue when you deliver the meal or service and earn the right to be paid, whether or not the customer has paid yet. A forecast or a budget is never revenue. (General idea behind ASC 606.)",
    example:
      "A catered event is revenue on the day you serve the bowls, not on the day the client says yes.",
    rounds: ["R10", "R21", "R24"],
  },
  {
    term: "Accrual vs cash accounting",
    definition:
      "Accrual accounting records revenue when earned and expenses when incurred. Cash accounting records them only when money moves. Profit and cash can differ in the same month.",
    example:
      "You deliver a $2,400 corporate order and pay $1,000 to produce it. Profit contribution is $1,400, but cash falls by $1,000 until the client pays.",
    rounds: ["R21", "R25"],
  },
  {
    term: "Accounts receivable",
    definition:
      "Accounts receivable (A/R) is money customers owe you for sales you have already made on credit. It is an asset until the customer pays.",
    example:
      "The $2,400 corporate invoice sits in A/R at month-end. Sales rise by $2,400 and cash does not move.",
    rounds: ["R21", "R25"],
  },
  {
    term: "Sales discount (contra revenue)",
    definition:
      "A sales discount is a price reduction you give, such as a cash discount for paying early. It is recorded as a deduction from sales, so net sales fall by the discount.",
    formula: "Net sales = Gross sales - Sales discounts",
    example:
      "A 2% early-payment discount on a $2,400 invoice gives you $2,352 in cash, $48 of Sales Discounts and net sales of $2,352.",
    rounds: ["R21"],
  },
  {
    term: "Factoring (without recourse)",
    definition:
      "Factoring means selling your receivables to a finance company for immediate cash, usually at a fee. Without recourse means the factor, not you, absorbs the loss if the customer never pays.",
    example:
      "You sell the $2,400 invoice for $2,304 in cash. You record the $96 difference as a factoring expense, and the receivable leaves your books.",
    rounds: ["R21"],
  },
  {
    term: "Prepaid expense",
    definition:
      "A prepaid expense is a cost you pay before you use it. It is an asset until you use it up, and then it becomes an expense.",
    example:
      "At the start of Month 5 you prepay $1,000 for advertising that runs later. Prepaid Advertising rises by $1,000, and the expense is recorded when the campaign runs.",
    rounds: ["R25"],
  },
  {
    term: "Refundable deposit",
    definition:
      "A refundable deposit is cash you hand over that you expect to get back. It is an asset, not an expense, because you expect to get the cash back: a future benefit you control.",
    example:
      "Every location requires an $800 deposit. Cash falls by $800, Deposits rise by $800, and profit is unchanged.",
    rounds: ["R02", "R25"],
  },
  {
    term: "Capital expenditure vs repair",
    definition:
      "A capital expenditure buys or improves a long-lived asset, and you record it as an asset and depreciate it. A routine repair only keeps the existing asset working, so you expense it in the month it happens.",
    example:
      "Repairing the refrigerator for $650 is a $650 repair expense. Installing a new $1,800 refrigeration system is an asset that you depreciate.",
    rounds: ["R01", "R12", "R22", "R23", "R24"],
  },
  {
    term: "Depreciation (straight-line, salvage value)",
    definition:
      "Depreciation spreads an asset's cost over the months you expect to use it. Straight-line depreciation charges the same amount each month, and salvage value is what you expect the asset to be worth at the end.",
    formula:
      "Monthly depreciation = (Cost - Salvage value) / Useful life in months",
    example:
      "The $12,000 truck with $0 salvage over 60 months costs $200 a month. A $1,800 refrigeration system over 36 months costs $50 a month.",
    rounds: ["R01", "R12", "R22", "R23", "R24"],
  },
  {
    term: "Accumulated depreciation and net book value",
    definition:
      "Accumulated depreciation is the total depreciation recorded on an asset so far. Net book value is the asset's cost minus that total, which is the amount still carried on the balance sheet.",
    formula: "Net book value = Cost - Accumulated depreciation",
    example:
      "After 4 months the $12,000 truck has $800 of accumulated depreciation and a net book value of $11,200.",
    rounds: ["R01", "R22", "R25"],
  },
  {
    term: "Owner distribution",
    definition:
      "An owner distribution (or draw) is cash you take out of the business for yourself. It reduces cash and equity, and it is not an operating expense.",
    example:
      "You take $1,000 out after Month 4. Cash falls by $1,000, equity falls by $1,000 and Month 4 profit does not change.",
    rounds: ["R25"],
  },
  {
    term: "Loan principal vs interest",
    definition:
      "Principal is the amount you borrowed, and interest is the price of borrowing it. A payment reduces the liability by its principal part, and only the interest part is an expense.",
    formula: "Monthly interest = Loan balance x (APR / 12)",
    example:
      "On a $10,800 loan at 9% APR, the first month's interest is $81. Of a $224.19 payment, about $143.19 reduces principal.",
    rounds: ["R24", "R25"],
  },
  {
    term: "Fixed cost",
    definition:
      "A fixed cost stays the same in total as the number of meals changes, within a normal range of activity. It falls per meal as you sell more.",
    example:
      "Payroll $3,600, utilities $350, insurance $250, marketing $200, standard rent $1,300 and truck depreciation $200 total $5,900 a month at any volume.",
    rounds: ["R02", "R04", "R15", "R19", "R20"],
  },
  {
    term: "Variable cost",
    definition:
      "A variable cost rises and falls in total with the number of meals you serve, and stays about the same per meal.",
    example:
      "A bowl costs $5.00 to make and sell: $2.50 ingredients, $1.30 sauce, $0.80 packaging and $0.40 payment fee. 900 bowls cost $4,500.",
    rounds: ["R02", "R03", "R11", "R17"],
  },
  {
    term: "Mixed cost",
    definition:
      "A mixed cost has a fixed part and a variable part. You can split it into a base amount plus a rate per unit.",
    formula: "Total cost = Fixed amount + (Rate per unit x Units)",
    example:
      "The Economy location costs $900 a month plus $0.50 per order. At 1,000 meals it costs $900 + $500 = $1,400, compared with $1,300 flat at the Standard site.",
    rounds: ["R02"],
  },
  {
    term: "Step cost and relevant range",
    definition:
      "A step cost stays flat for a range of activity and then jumps when you cross a capacity limit. The relevant range is the span of activity where your cost assumptions hold.",
    example:
      "One kitchen shift serves 900 meals. Serving 50 more needs a $400 extra shift. Those 50 meals earn 50 x $7 = $350, so the shift loses $50.",
    rounds: ["R09", "R19", "B2"],
  },
  {
    term: "Contribution margin and CM ratio",
    definition:
      "Contribution margin is what each meal contributes toward fixed costs and profit after its variable costs. The CM ratio shows that amount as a percentage of the selling price.",
    formula:
      "Unit CM = Price - Variable cost per unit; CM ratio = Unit CM / Price",
    example:
      "A $12 bowl with $5 of variable cost has a unit CM of $7 and a CM ratio of 58.33%.",
    rounds: ["R03", "R06", "R07", "R08", "R09", "R10", "R11"],
  },
  {
    term: "Weighted-average CM and sales mix",
    definition:
      "Sales mix is the share of each product in total sales. Weighted-average contribution margin multiplies each product's unit CM by its share of the mix and adds the results.",
    formula: "Weighted CM = Sum of (Mix share x Unit CM)",
    example:
      "With 75% bowls (CM $7.00) and 25% wraps (CM $5.50), weighted CM = 0.75 x $7 + 0.25 x $5.50 = $6.625 per meal.",
    rounds: ["R06", "R14", "R16"],
  },
  {
    term: "Break-even point",
    definition:
      "The break-even point is the number of meals at which operating income is exactly zero. Round up, because you cannot sell part of a meal.",
    formula: "Break-even units = Fixed costs / Unit contribution margin",
    example:
      "$5,900 / $7 = 842.86, so you need 843 bowls a month. At 842 bowls you still lose money.",
    rounds: ["R02", "R04", "R12"],
  },
  {
    term: "Target profit and margin of safety",
    definition:
      "Target profit tells you how many meals you need to earn a chosen profit. Margin of safety is how far sales can fall before you reach break-even.",
    formula:
      "Target units = (Fixed costs + Target profit) / Unit CM; Margin of safety = Expected units - Break-even units",
    example:
      "To earn $1,500 you need ($5,900 + $1,500) / $7 = 1,057.14, so 1,058 meals. If you expect 1,100 bowls with break-even at 843, your margin of safety is 257 bowls (23.4%).",
    rounds: ["R04", "R05", "R15"],
  },
  {
    term: "Relevant cost",
    definition:
      "A relevant cost or revenue differs between the alternatives you are comparing and happens in the future. Only relevant items belong in the decision.",
    example:
      "Making sauce saves $1.30 - $0.80 = $0.50 per portion but adds $90 of labor and $3 of depreciation a month. Your total sauce spend today is not the issue.",
    rounds: ["R07", "R10", "R11", "R12", "R20", "R22"],
  },
  {
    term: "Sunk cost",
    definition:
      "A sunk cost is money you already spent that no future choice can change. It should not drive the decision.",
    example:
      "The $12,000 you paid for the truck is sunk. Whether to repair the refrigerator depends only on future costs and benefits.",
    rounds: ["R20", "R22"],
  },
  {
    term: "Opportunity cost",
    definition:
      "Opportunity cost is the profit you give up by choosing one option over the next-best use of the same resources.",
    example:
      "A premium bowl that replaces 70 regular bowls gives up 70 x $7 = $490 of contribution. A catering event uses kitchen capacity that regular customers could have used.",
    rounds: ["R10", "R14"],
  },
  {
    term: "Special order",
    definition:
      "A special order is a one-time sale outside your normal business. Accept it if its extra revenue exceeds its extra costs, including any regular sales it displaces.",
    formula:
      "Incremental profit = Units x (Event price - Variable cost per unit) - One-time costs",
    example:
      "140 catered bowls at $11 cost $6 each ($5 plus $1 transport). 140 x $5 - $180 setup = $520 extra profit, before any displaced regular sales.",
    rounds: ["R10"],
  },
  {
    term: "Make-or-buy",
    definition:
      "A make-or-buy decision compares the relevant cost of producing an item yourself with the cost of buying it. Include extra fixed costs and equipment depreciation in the make option.",
    formula:
      "Crossover units = Extra monthly fixed cost / Saving per unit",
    example:
      "Making sauce adds $90 + $3 = $93 a month and saves $0.50 per portion. $93 / $0.50 = 186 portions a month to break even.",
    rounds: ["R12"],
  },
  {
    term: "Activity-based costing, cost driver and allocation",
    definition:
      "Allocation spreads an existing shared cost across products. Activity-based costing (ABC) does that with a cost driver, the activity that causes the cost, such as prep batches. Allocation moves existing cost around and creates no new cash spending.",
    formula: "Rate = Cost pool / Total driver units",
    example:
      "$1,200 of support cost over 60 prep batches is $20 a batch, and $900 over 450 contacts is $2 a contact. Each wrap carries $0.80 + $0.80 = $1.60. For $1,800 of overhead split by 75 and 25 prep hours, wraps get $450.",
    rounds: ["R13", "R20", "B1"],
  },
  {
    term: "Cannibalization",
    definition:
      "Cannibalization happens when a new product takes sales from your existing products. Count the lost contribution from the old product as a cost of the new one.",
    formula:
      "Incremental profit = New units x New CM - Lost units x Old CM - One-time costs",
    example:
      "A $16 premium bowl draws 180 orders but replaces 70 regular bowls: 180 x $9 - 70 x $7 - $250 = $880.",
    rounds: ["R14"],
  },
  {
    term: "Static (master) budget and flexible budget",
    definition:
      "A static budget is built for one planned volume and never changes. A flexible budget restates revenue and variable costs at the volume you actually reached, with fixed costs held at their budgeted amounts.",
    formula:
      "Flexible-budget income = Actual units x Budgeted unit CM - Budgeted fixed costs",
    example:
      "A static budget for 1,000 meals shows $1,100 of income. Flexed to 900 meals it shows 900 x $7 - $5,900 = $400.",
    rounds: ["R15", "R16", "R19"],
  },
  {
    term: "Flexible-budget and sales-volume variances (favorable and unfavorable)",
    definition:
      "The sales-volume variance is the part of the gap caused by selling more or fewer meals than planned. The flexible-budget variance is the part caused by revenue and cost performance at the actual volume. A favorable variance raises income above the benchmark and an unfavorable one lowers it.",
    formula:
      "Sales-volume variance = Flexible-budget income - Static-budget income; Flexible-budget variance = Actual income - Flexible-budget income",
    example:
      "Static $1,100, flexed $400, actual $250. Sales-volume variance = -$700 (unfavorable). Flexible-budget variance = -$150 (unfavorable). In R16, 968 meals against 1,100 planned at $7 gives -$924.",
    rounds: ["R16", "R19"],
  },
  {
    term: "Materials price and quantity variances",
    definition:
      "The price variance compares what you paid per unit with the standard price. The quantity (usage) variance compares how much you used with the amount allowed for the meals you made. Look at them separately because different causes drive each.",
    formula:
      "Price variance = (Actual price - Standard price) x Actual quantity; Quantity variance = (Actual quantity - Standard quantity allowed) x Standard price",
    example:
      "900 meals at 2.0 units each allow 1,800 units at $1.50. You used 1,980 units at $1.65. Price: $0.15 x 1,980 = $297 U. Quantity: 180 x $1.50 = $270 U. Total $567 U.",
    rounds: ["R17"],
  },
  {
    term: "Labor rate and efficiency variances",
    definition:
      "The rate variance compares the hourly wage you paid with the standard wage. The efficiency variance compares the hours you worked with the hours allowed for the output you produced.",
    formula:
      "Rate variance = (Actual rate - Standard rate) x Actual hours; Efficiency variance = (Actual hours - Standard hours) x Standard rate",
    example:
      "Standard is 180 hours at $20. Actual is 198 hours at $22. Rate: $2 x 198 = $396 U. Efficiency: 18 x $20 = $360 U. Total $756 U.",
    rounds: ["R18"],
  },
  {
    term: "Controllable cost and responsibility accounting",
    definition:
      "A controllable cost is one a manager can influence through their decisions. Responsibility accounting judges managers on the items they control and keeps outside shocks, such as a storm, out of their report.",
    example:
      "A kitchen manager answers for food waste and shift scheduling. A $500 sales shortfall caused by a storm is $0 of controllable cost for that manager.",
    rounds: ["R19", "B4"],
  },
  {
    term: "Segment margin, avoidable and common fixed costs",
    definition:
      "Segment margin is a product line's sales minus its variable costs and the fixed costs you would avoid if you closed it. Common fixed costs continue either way, so they do not belong in a drop decision.",
    formula:
      "Segment margin = Segment sales - Segment variable costs - Avoidable fixed costs",
    example:
      "Wraps: 400 x ($10 - $4.50) - $300 avoidable fixed = $1,900. The $2,200 of allocated common overhead continues, so dropping wraps lowers income by $1,900.",
    rounds: ["R20"],
  },
  {
    term: "Net present value (NPV) and hurdle rate",
    definition:
      "NPV converts a project's future cash flows to today's dollars using your required return, the hurdle rate, and subtracts the investment. A positive NPV means the project earns more than the hurdle rate. Financing method does not change an unlevered project NPV.",
    formula:
      "NPV = -Investment + Sum of [Cash flow in year t / (1 + rate)^t] + Terminal cash / (1 + rate)^n",
    example:
      "A $2,400 machine saving $1,050 a year for 3 years, worth $300 at the end, at a 10% hurdle rate has an NPV of +$437. The $18,000 second truck at 12% has an NPV of +$3,649.",
    rounds: ["R23", "R24", "B5"],
  },
  {
    term: "Payback period",
    definition:
      "Payback period is how long a project takes to return its initial cost in cash. It is easy to compute, but it ignores the time value of money and any cash after the payback date.",
    formula: "Payback = Investment / Annual cash inflow (for level inflows)",
    example:
      "$2,400 / $1,050 a year = 2.29 years, ignoring the $300 resale value.",
    rounds: ["R23"],
  },
  {
    term: "Income statement, balance sheet and cash flow statement",
    definition:
      "The income statement shows revenue, expenses and profit for a period. The balance sheet shows assets, liabilities and equity on one date. The cash flow statement sorts cash movements into operating (day-to-day sales and costs), investing (buying or selling equipment) and financing (owner contributions, distributions and loans).",
    example:
      "Buying the truck is an investing outflow with no effect on profit. The $25,000 owner contribution and a loan are financing inflows. Meal sales collected are operating inflows.",
    rounds: ["R21", "R25"],
  },
];

export const ASSUMPTIONS: { area: string; rule: string }[] = [
  {
    area: "Taxes",
    rule: "The model is pre-tax. It has no income tax, sales tax or tax depreciation.",
  },
  {
    area: "Owner pay",
    rule: "The model has no owner salary. You take money out only as owner distributions, which are not expenses.",
  },
  {
    area: "Ingredients",
    rule: "You buy ingredients just in time for the meals you sell, so the core game has no ingredient inventory. Bonus case B3 teaches inventory separately.",
  },
  {
    area: "Rounding",
    rule: "All money is calculated in whole cents and displayed with two decimals. NPV keeps full precision until the final rounding to dollars.",
  },
  {
    area: "Whole meals",
    rule: "You sell whole meals only. Demand groups are rounded to whole numbers, and bowl and wrap counts use largest-remainder rounding so they add up exactly.",
  },
  {
    area: "Demand vs sales",
    rule: "Demand is an estimate, not a sale. You book sales and direct costs only for meals you actually fulfill, and the game reports unfulfilled customers separately.",
  },
  {
    area: "Capacity priority",
    rule: "When demand exceeds capacity, the kitchen serves in this order: contracted catering, ordinary walk-up (including premium orders), direct pickup and coupons, then app delivery.",
  },
  {
    area: "Capacity changes",
    rule: "Truck choice sets monthly capacity. A hire adds 300 permanently. Overtime adds at most 180 in Month 1, with $2 extra cost per order above prior capacity.",
  },
  {
    area: "Depreciation timing",
    rule: "Depreciation starts the month an asset enters service. It is straight-line and posts at month-end.",
  },
  {
    area: "Asset lives",
    rule: "The first truck depreciates over 60 months with $0 salvage. The mixer uses 60 months, the upgraded refrigerator 36 months with $0 salvage, the prep machine 36 months with $300 salvage ($58.33 a month), and the second truck 48 months with $3,000 salvage.",
  },
  {
    area: "Deposits",
    rule: "The $800 location deposit is a refundable asset, not an expense. It does not change profit.",
  },
  {
    area: "Forecasts",
    rule: "Forecasts, budgets and projected sales are never booked as revenue. Pro forma figures are labeled and kept apart from actual results.",
  },
  {
    area: "Collections",
    rule: "Customers pay when you fulfill the order. The one exception is the R21 corporate invoice, which goes to accounts receivable.",
  },
  {
    area: "Per-meal costs",
    rule: "Unit cost modifiers add and subtract in a stated order and never overwrite each other. The $0.40 payment fee applies to every channel, and delivery commission is charged on top.",
  },
  {
    area: "Posting once",
    rule: "Each event posts to the books once. The game never books the same receipt or expense in two rounds.",
  },
  {
    area: "Standalone cases",
    rule: "Some rounds (such as R04, R05, R15, R17, R19 and R20) use fixed reference numbers so every player faces the same math. Those numbers can differ from your live company.",
  },
  {
    area: "Timing of R24 and R25",
    rule: "R24 and R25 happen at the start of Month 5, after the Month 4 close. They add no Month 4 revenue, expense or depreciation, and Month 4 never closes a second time.",
  },
  {
    area: "Loans",
    rule: "Only the R24 second-truck financing creates bank debt in standard play. Loan proceeds are a liability, never revenue, and interest starts in Month 5.",
  },
  {
    area: "NPV method",
    rule: "NPV uses unlevered incremental cash flows at year-end, discounted at the stated hurdle rate. Financing choices change cash and debt payments, not the project's NPV.",
  },
  {
    area: "Cash reserve",
    rule: "Expansion purchases and owner distributions require you to keep at least a $2,000 cash reserve. Checks use cash actually posted after the latest close, never expected future receipts.",
  },
  {
    area: "Emergency funding",
    rule: "If cash is below $0 at a month close, you must choose a visible rescue: an owner contribution of the shortfall plus a $2,000 buffer, bridge debt at an assumed 1.5% a month, or a restart from a checkpoint. Rescue cash is not revenue and the game records it separately.",
  },
  {
    area: "Allocation",
    rule: "Allocating overhead changes only managerial reports. It never changes total cash paid or total operating income.",
  },
  {
    area: "Fictional numbers",
    rule: "All prices, demand levels, costs, rates and hurdle rates are made-up teaching values. They are not market data and promise no real return.",
  },
  {
    area: "Saving",
    rule: "The game needs no login and collects no personal data. It saves your progress in your own browser.",
  },
];

export const SOURCES: { label: string; detail: string }[] = [
  {
    label: "Course requirements document",
    detail:
      "The instructor's MBA Core Assignment 2 (Game) sets the project requirements: a web game that runs on PC, Mac and mobile, stated learning objectives, explanations for wrong answers, no copyrighted imagery, citations for outside sources, and five-part peer grading.",
  },
  {
    label: "BUSI 7230 syllabus context",
    detail:
      "Auburn University BUSI 7230, Cost Analysis and Systems, Fall 2026, taught by Duane Brandon. The course centers on interpreting financial information and using managerial accounting to support business decisions. The game's three outcomes follow from that: interpret statements and metrics, choose among alternatives with relevant managerial concepts, and explain how recognition and allocation affect income and cash flow.",
  },
  {
    label: "Textbook topic inspiration",
    detail:
      "Topic coverage draws on the subject areas of Easton, Financial & Managerial Accounting for MBAs, 7th edition (cost behavior, cost-volume-profit, relevant costs, activity-based costing, pricing, budgeting, variances, segment analysis and capital budgeting). The book is credited as inspiration for topics only. This game does not reproduce textbook problems, solutions, solution workbooks, figures or images. Every scenario, number and worked example is newly written for this game.",
  },
  {
    label: "ASC 606 (revenue recognition)",
    detail:
      "The revenue rules in the game follow the general idea of FASB ASC 606: record revenue when you deliver the promised meal or service. The game does not apply the standard's full five-step model or any detailed guidance.",
  },
  {
    label: "ASC 842 (leases)",
    detail:
      "ASC 842 is mentioned only as general background for the location lease and the equipment lease alternative. The game expenses lease payments as they occur and does not model right-of-use assets or lease liabilities.",
  },
  {
    label: "Artwork",
    detail:
      "All artwork, icons, names and characters in the game are original to this project. The game uses no copyrighted images, logos or brand names.",
  },
  {
    label: "Data",
    detail:
      "The game uses no real market data. All demand figures, prices, costs, rates and results are fictional and exist for teaching only. They are not predictions, and no real earnings or investment return is implied.",
  },
];
