// Canonical text comes from docs/startup_survivor_round_specs.json (imported, never copied).
// This overlay adds what the JSON lacks: answer format, F/U variance answers, diagnostics for
// common wrong answers, course-aligned terminology fixes, and a student-facing strategy note.
import specs from '../../docs/startup_survivor_round_specs.json';
import type { OptionId, RoundId } from '../engine/model';

export interface SpecOption { id: OptionId; label: string; effect: string }
export interface MasteryCheck {
  prompt: string; formula: string; worked_solution: string; answer: number;
  unit?: string; tolerance?: number; feedback_for_wrong_answers?: string;
}
export interface RoundSpec {
  id: RoundId; number: number; chapter: number; title: string; modules: string; objective: string;
  scenario: string; mastery_check: MasteryCheck; options: SpecOption[];
  accounting_posting: string; designer_notes: string; timing: string;
}
export interface BonusSpec {
  id: string; title: string; topic: string; scenario: string;
  mastery_check: MasteryCheck; options: SpecOption[]; feedback_for_wrong_answers: string;
}

export const CHAPTERS: string[] = specs.chapters;
export const CHAPTER_BLURB = [
  'Plan a business that can pay its bills. No month closes yet.',
  'Run your first month of real sales and close the books.',
  'Costs jump. Respond, then lock a Month 3 budget.',
  'Weather, waste and labor hit Month 3. Explain the variances.',
  'Manage accruals, close Month 4 and pitch the expansion.',
];

export interface Mistake { value: number; message: string }
export interface Overlay {
  /** Shown under the input: what to type. */
  format: string;
  unitLabel: '$' | 'meals' | 'portions' | 'units';
  /** Variance questions are answered as a positive amount plus F/U, matching Easton's convention. */
  variance?: 'F' | 'U';
  prompt?: string;
  worked?: string;
  modules?: string;
  mistakes?: Mistake[];
  /** Student-facing strategy note: why no option is automatically wrong. */
  coach: string;
}

export const OVERLAY: Record<RoundId, Overlay> = {
  R01: { format: 'Dollars, no commas needed', unitLabel: '$', coach: 'More capacity costs more cash today. A cheaper truck keeps a bigger cushion; a bigger truck can serve more demand. Defend the tradeoff, not the price tag.',
    mistakes: [{ value: 12200, message: 'You also subtracted the $800 deposit. The question asks about cash right after the truck purchase only.' }, { value: 12000, message: 'That is the truck price, not the cash left over. Start from the $25,000 the owner invested.' }, { value: 24800, message: 'You subtracted one month of depreciation. Depreciation is not a cash payment; the full $12,000 leaves the bank today.' }] },
  R02: { format: 'Dollars: the monthly cost of the cheaper contract at 1,000 orders', unitLabel: '$', prompt: 'At 1,000 orders a month, which location contract costs less: Economy at $900 + $0.50 per order, or Standard at $1,300 flat? Enter the cheaper contract\'s monthly cost.',
    coach: 'The Economy site is a mixed cost: cheaper below 800 orders, dearer above. High Traffic adds demand but you must fill it with capacity.',
    mistakes: [{ value: 1400, message: '$1,400 is the Economy cost: $900 + $0.50 × 1,000. Compare it with Standard\'s $1,300. Which is lower?' }, { value: 800, message: '800 orders is the crossover point. The question asks for the cheaper monthly cost at 1,000 orders.' }, { value: 900, message: 'You left out the variable part of the Economy contract: $0.50 × 1,000 orders = $500.' }] },
  R03: { format: 'Dollars per bowl', unitLabel: '$', coach: 'A higher price earns more per bowl but sells fewer. The right price depends on your capacity and your fixed costs.',
    mistakes: [{ value: 12, message: '$12 is the selling price. Contribution margin subtracts the $5 variable cost.' }, { value: 0.5833, message: 'That is the CM ratio. The question asks for dollars of contribution per bowl.' }, { value: 58.33, message: 'That is the CM ratio as a percent. The question asks for dollars per bowl.' }] },
  R04: { format: 'Whole meals per month', unitLabel: 'meals', coach: 'Publicity buys demand, training buys capacity, holding cash buys safety. Check whether your truck is short on demand or short on capacity.',
    mistakes: [{ value: 842, message: 'Round up. At 842 bowls the business is still $1 short of covering fixed costs.' }, { value: 815, message: 'You left out the $200 depreciation. Break-even on operating profit includes every fixed cost, cash or not.' }, { value: 492, message: 'Divide by contribution margin ($7), not the selling price ($12).' }, { value: 491, message: 'Divide by contribution margin ($7), not the selling price ($12).' }] },
  R05: { format: 'Whole meals per month', unitLabel: 'meals', coach: 'Advertising raises fixed cost and demand together. It pays only if the extra contribution beats the extra spending, and only if you have capacity to serve it.',
    mistakes: [{ value: 1057, message: 'Round up: 1,057.14 bowls is not enough to reach $1,500.' }, { value: 843, message: 'That is break-even. A profit target adds the $1,500 to the fixed costs before dividing.' }, { value: 215, message: 'You divided only the target profit by CM. Fixed costs must be covered too.' }] },
  R06: { format: 'Dollars per meal, up to 3 decimals', unitLabel: '$', modules: '16: sales-mix CVP',
    coach: 'More wraps add demand but each wrap earns less than a bowl, and a bigger menu costs money to support.',
    mistakes: [{ value: 6.25, message: 'That is a simple average of $7 and $5.50. Weight each margin by its share of the mix.' }, { value: 11.5, message: 'You weighted the prices, not the contribution margins.' }] },
  R07: { format: 'Dollars per app order', unitLabel: '$', coach: 'App orders fill last. If your truck is already full, app demand may never be served.',
    mistakes: [{ value: 7, message: 'You left out the 25% app commission: 0.25 × $12 = $3.' }, { value: 9, message: 'The commission is a cost on top of the $5 variable cost, not a replacement for it.' }] },
  R08: { format: 'Dollars of incremental contribution', unitLabel: '$', coach: 'A blanket discount gives money back to customers who would have paid full price. Targeted coupons avoid that but cost a campaign.',
    mistakes: [{ value: 1200, message: 'You counted the new customers only. Every one of the 1,100 existing orders also loses $1.' }, { value: 1400, message: 'Two slips: new orders sell at $11, so each earns $6, not $7, and every one of the 1,100 existing orders also loses $1.' }, { value: -1100, message: 'You counted the discount on existing customers but left out the 200 new orders at $6 contribution each.' }] },
  R09: { format: 'Dollars for one month', unitLabel: '$', coach: 'Hiring is a step cost that lasts; overtime is a variable cost that only hits extra meals. Which fits a demand surge that may not last?',
    mistakes: [{ value: 840, message: 'Subtract the $2 overtime premium from the $7 margin on each overflow order.' }, { value: 240, message: 'That is the overtime cost alone (120 × $2). Profit = 120 × ($7 − $2) = $600.' }, { value: -50, message: 'Hiring costs $650 and lasts all month; the question asks about overtime on 120 orders.' }] },
  R10: { format: 'Dollars of incremental profit', unitLabel: '$', coach: 'Catering gets first claim on capacity. If the truck is full, regular customers lose their seats, and that lost margin is a real cost.',
    mistakes: [{ value: 700, message: 'You left out the $180 setup fee.' }, { value: 660, message: 'Each catered bowl costs $5 plus $1 transport, so $6, not $5: 140 × ($11 − $6) − $180.' }, { value: 1540, message: 'That is the catering revenue. Subtract the $6 variable cost per bowl and the $180 setup.' }] },
  R11: { format: 'Dollars of contribution lost per month', unitLabel: '$', coach: 'Absorbing protects volume, a price rise protects margin, switching suppliers costs a fee up front. Compare total contribution, not per-unit margin alone.',
    mistakes: [{ value: 200, message: '$0.20 is the replacement supplier\'s surcharge. The question asks about absorbing the full $0.60 increase.' }] },
  R12: { format: 'Whole portions per month', unitLabel: 'portions', modules: '17: make-or-buy',
    worked: '$1.30 − $0.80 = $0.50 saved per portion. Extra monthly fixed cost = $90 labor + $180 / 60 = $93. $93 / $0.50 = 186 portions to break even on monthly operating income. On a cash basis the break-even is $90 / $0.50 = 180 portions, and the $180 mixer is a one-time differential cash outlay.',
    coach: 'Making sauce saves $0.50 on every meal you sell, but adds fixed labor and an asset. Bulk buying saves less with no fixed cost.',
    mistakes: [{ value: 180, message: 'That is the cash break-even. The question asks about operating income, which also carries the $3 a month of mixer depreciation.' }, { value: 360, message: 'You divided only the $180 mixer by $0.50. The $90 of monthly labor is the main fixed cost; the mixer adds just $3 a month.' }, { value: 540, message: 'You expensed the whole $180 mixer in one month. Spread it over 60 months: $3 a month.' }] },
  R13: { format: 'Dollars of overhead per wrap', unitLabel: '$', coach: 'ABC reassigns costs you already pay. Only the $100 promotion is new spending.',
    mistakes: [{ value: 0.8, message: 'That is only one activity. Add the batch cost ($20 / 25 = $0.80) and the support cost (0.4 × $2 = $0.80).' }, { value: 2100, message: '$2,100 is the total existing cost pool. ABC spreads it; it is not a new cost per wrap.' }] },
  R14: { format: 'Dollars of first-month incremental operating income', unitLabel: '$',
    prompt: 'At ordinary bowl CM $7, what is the first-month incremental operating income of the $16 premium launch after its one-time $250 setup, before capacity effects?', coach: 'A premium item brings new margin, but some buyers would have bought a regular bowl anyway. Count what you lose too.',
    mistakes: [{ value: 1370, message: 'You left out the cannibalized regular bowls: 70 × $7 = $490.' }, { value: 1130, message: 'You left out the $250 launch cost.' }, { value: 1620, message: 'Subtract the $490 of lost regular-bowl contribution and the $250 launch cost.' }] },
  R15: { format: 'Dollars of budgeted operating income', unitLabel: '$', modules: '22: master budget; 23: flexible budgets', coach: 'A budget is a plan, not revenue. Your Month 3 budget freezes after this round; whatever happens next shows up as variances.',
    mistakes: [{ value: 7700, message: 'That is budgeted contribution margin. Subtract the $5,900 of fixed operating costs.' }, { value: 7300, message: 'You subtracted fixed costs from revenue. Subtract the $5 variable cost per meal first: 1,100 × $7 = $7,700 of contribution.' }, { value: 2000, message: 'Fixed operating costs are $5,900 here, including the $200 of depreciation.' }] },
  R16: { format: 'Amount and direction (F or U)', unitLabel: '$', variance: 'U', modules: '23: flexible budgets; net sales volume variance',
    prompt: 'What is the net sales volume variance in this example: (actual meals − budgeted meals) × budgeted contribution margin per meal? Enter the amount and mark it favorable (F) or unfavorable (U).',
    worked: '(968 − 1,100) × $7 = −$924, so $924 unfavorable (U). This contribution-based measure is what Easton calls the net sales volume variance. The revenue-based sales volume variance would be (968 − 1,100) × $12 = $1,584 U.',
    coach: 'Weather is outside your control. Cutting shifts saves cash but also capacity; a promotion wins some customers back at a price.',
    mistakes: [{ value: 1584, message: 'That uses the $12 price, which gives the revenue-based sales volume variance. This question asks for the contribution-based version, at $7 per meal.' }, { value: 132, message: 'That is the change in meals. Multiply it by the $7 budgeted contribution per meal.' }] },
  R17: { format: 'Amount and direction (F or U)', unitLabel: '$', variance: 'U',
    prompt: 'What is the total direct-materials variance in the audit (price variance + quantity variance)? Enter the amount and mark it F or U.',
    worked: 'Standard quantity allowed = 900 meals × 2.0 = 1,800 units. Price variance = ($1.65 − $1.50) × 1,980 actual units used = $297 U. Quantity variance = (1,980 − 1,800) × $1.50 = $270 U. Total = $567 U. Under the just-in-time assumption, quantity purchased equals quantity used.',
    coach: 'Training attacks waste (a quantity problem). Renegotiating attacks price. They fix different causes.',
    mistakes: [{ value: 297, message: 'That is only the price variance. Add the quantity variance: (1,980 − 1,800) × $1.50 = $270.' }, { value: 270, message: 'That is only the quantity variance. Add the price variance: $0.15 × 1,980 = $297.' }, { value: 540, message: 'Price variance uses actual quantity (1,980), not standard quantity (1,800).' }] },
  R18: { format: 'Amount and direction (F or U)', unitLabel: '$', variance: 'U',
    prompt: 'What is the total labor variance for the projected shift (rate variance + efficiency variance)? Enter the amount and mark it F or U.',
    worked: 'Rate variance = ($22 − $20) × 198 actual hours = $396 U. Efficiency variance = (198 − 180 standard hours allowed for actual output) × $20 = $360 U. Total = $756 U, which equals $4,356 actual − $3,600 standard.',
    coach: 'Each fix costs money now to save more later. Compare total cost (fee + remaining overrun), not just the fee.',
    mistakes: [{ value: 396, message: 'That is only the rate variance. Add the efficiency variance: 18 extra hours × $20 = $360.' }, { value: 360, message: 'That is only the efficiency variance. Add the rate variance: $2 × 198 hours = $396.' }, { value: 720, message: 'The rate variance uses actual hours (198), not standard hours (180).' }] },
  R19: { format: 'Amount and direction (F or U)', unitLabel: '$', variance: 'U', modules: '23: flexible budgets; responsibility reports',
    prompt: 'What is the flexible-budget operating-income variance (actual income compared with the flexible budget)? Enter the amount and mark it F or U.',
    worked: 'Flexible budget at 900 meals = 900 × ($12 − $5) − $5,900 = $400. Actual $250 − flexible $400 = −$150, so $150 U. The separate net sales volume variance is $400 − $1,100 = $700 U.',
    coach: 'Investigating costs nothing today. Cutting marketing saves cash but loses customers; raising prices restores margin but loses customers too.',
    mistakes: [{ value: 850, message: 'You compared actual income with the static budget ($1,100). The flexible budget is $400 at the 900 meals actually sold.' }, { value: 700, message: 'That is the net sales volume variance (flexible − static). The question asks for actual compared with flexible.' }] },
  R20: { format: 'Dollars of company profit lost', unitLabel: '$', coach: 'An allocated loss is not a reason to drop a line. Ask what you would actually stop earning and stop paying.',
    mistakes: [{ value: 2200, message: 'That is wrap contribution margin. Subtract the $300 of avoidable fixed costs that would go away.' }, { value: -300, message: 'You subtracted the $2,200 common overhead. It continues whether or not you sell wraps, so it is irrelevant.' }, { value: 4000, message: 'That is wrap revenue. Subtract variable costs and avoidable fixed costs.' }] },
  R21: { format: 'Dollars of profit contribution', unitLabel: '$', modules: '5: receivables; financial statement analysis',
    coach: 'Waiting keeps all $2,400 but leaves you short on cash. The discount and factoring trade a small cost for cash today.',
    mistakes: [{ value: -1000, message: 'That is the cash effect. Profit is earned when the service is delivered, even before the client pays.' }, { value: 2400, message: 'Subtract the $1,000 production cost you incurred.' }] },
  R22: { format: 'Dollars per month', unitLabel: '$', coach: 'A repair keeps what you have. An upgrade is a new asset that pays back through lower spoilage. Renting buys time.',
    mistakes: [{ value: 600, message: 'That is annual depreciation. The question asks for one month: $1,800 / 36.' }, { value: 1800, message: 'Capitalize the $1,800 and spread it over 36 months.' }] },
  R23: { format: 'Dollars, rounded to the nearest dollar', unitLabel: '$', coach: 'Positive NPV says the machine beats the 10% discount rate (cost of capital). Cash on hand still decides whether you can afford it now.',
    worked: 'PV of savings = $1,050 × (1/1.1 + 1/1.1² + 1/1.1³) = $2,611.19. PV of $300 resale at Year 3 = $225.39. NPV = −$2,400 + $2,611.19 + $225.39 = +$436.59 at full precision, about +$437. Simple payback ignoring resale is $2,400 / $1,050 = 2.29 years. In this pre-tax model depreciation is not a cash flow; with taxes, the depreciation tax shield would be.',
    mistakes: [{ value: 211, message: 'You left out the $300 resale value at Year 3 (PV $225.39).' }, { value: 750, message: 'You did not discount, and you left out the $300 resale.' }, { value: 1050, message: 'You did not discount: −$2,400 + 3 × $1,050 + $300 = $1,050. At 10%, each future dollar is worth less today.' }, { value: 957, message: 'You added the $300 resale every year. It arrives once, in Year 3.' }, { value: 1650, message: 'You did not discount, and you added the $300 resale every year. It arrives once, in Year 3.' }] },
  R24: { format: 'Dollars, rounded to the nearest dollar', unitLabel: '$', coach: 'NPV does not depend on how you pay. Financing changes your cash and debt, not the project\'s value.',
    worked: 'PV of $6,500 for 4 years at 12% = $19,742.77. PV of $3,000 resale at Year 4 = $1,906.55. NPV = −$18,000 + $19,742.77 + $1,906.55 = +$3,649.32, about +$3,649. The 12% is the discount rate (cost of capital) for this project. The loan does not change it.',
    mistakes: [{ value: 1743, message: 'You left out the $3,000 resale in Year 4 (PV $1,906.55).' }, { value: 11000, message: 'You did not discount the cash flows.' }, { value: 10849, message: 'Financing does not enter unlevered NPV. You subtracted the $10,800 loan; use the full $18,000 investment.' }, { value: 14449, message: 'Financing does not enter unlevered NPV. Use the full $18,000 investment, not the $7,200 down payment.' }] },
  R25: { format: 'Dollars of book equity', unitLabel: '$', coach: 'Paying yourself is allowed, but it reduces equity and cash. Prepaying advertising is an asset until the campaign runs.',
    mistakes: [{ value: 16000, message: 'Equity is assets minus liabilities, not plus.' }, { value: 4000, message: 'That is the liability balance. Equity = $12,000 − $4,000.' }] },
};

export const ROUNDS: RoundSpec[] = specs.rounds as RoundSpec[];
export const BONUS: BonusSpec[] = specs.bonus_challenges as BonusSpec[];
export const roundById = (id: RoundId) => ROUNDS.find((r) => r.id === id)!;

/** The prompt/worked solution shown to students (overlay wins when it corrects wording). */
export const promptOf = (r: RoundSpec) => OVERLAY[r.id].prompt ?? r.mastery_check.prompt;
export const workedOf = (r: RoundSpec) => OVERLAY[r.id].worked ?? r.mastery_check.worked_solution;
export const modulesOf = (r: RoundSpec) => OVERLAY[r.id].modules ?? r.modules;

/** Best judgment per bonus case. B2: declining (B) beats hiring (A) by $50, and the one-time $200 throughput fix (C) beats both at +$150, so C is best. */
export const BONUS_BEST: Record<string, OptionId> = { B1: 'A', B2: 'C', B3: 'A', B4: 'A', B5: 'A' };
