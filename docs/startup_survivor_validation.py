"""Deterministic reference calculations for Startup Survivor design handoff.
This is a math verification tool, not the game's full production engine.
"""
from decimal import Decimal, ROUND_HALF_UP
from math import ceil
D=lambda x: Decimal(str(x))
def money(x): return D(x).quantize(D('0.01'),rounding=ROUND_HALF_UP)

# Standardized worked-answer fixtures from 25 core rounds.
checks={
 'R01_cash_after_truck': (25000-12000, 13000),
 'R02_economy_cost_at_1000': (900+0.50*1000,1400),
 'R02_standard_cost': (1300,1300),
 'R03_cm_bowl': (12-5,7),
 'R04_break_even': (ceil((3600+350+250+200+1300+200)/(12-5)),843),
 'R05_target_units': (ceil((5900+1500)/7),1058),
 'R06_weighted_cm': (.75*7+.25*5.5,6.625),
 'R07_app_cm': (12-5-.25*12,4),
 'R08_discount_delta_cm': (200*(11-5)-1100,100),
 'R09_overtime_delta_profit': (120*(7-2),600),
 'R10_catering_delta_profit': (140*(11-6)-180,520),
 'R11_ingredient_shock': (1000*.60,600),
 'R12_make_sauce_break_even': ((90+180/60)/(.5),186),
 'R13_abc_wrap': ((1200/60)/25+(900/450)*.4,1.6),
 'R14_premium_delta': (180*(16-7)-70*7-250,880),
 'R15_budget_profit': (1100*(12-5)-5900,1800),
 'R16_sales_volume_variance': ((968-1100)*7,-924),
 'R17_material_variance': ((1.65-1.5)*1980+(1980-1800)*1.5,567),
 'R18_labor_variance': ((22-20)*198+(198-180)*20,756),
 'R19_flexible_budget_variance': (250-(900*(12-5)-5900),-150),
 'R20_lost_segment_profit': (400*(10-4.5)-300,1900),
 'R21_accrual_contribution': (2400-1000,1400),
 'R22_refrigeration_depreciation': (1800/36,50),
 'R23_machine_npv': (-2400+sum(1050/1.1**t for t in range(1,4))+300/1.1**3,436.58903080390655),
 'R24_truck_npv': (-18000+sum(6500/1.12**t for t in range(1,5))+3000/1.12**4,3649.3249882861273),
 'R25_equity': (12000-4000,8000),
 'B5_stressed_npv':(-18000+sum(5525/1.12**t for t in range(1,5))+3000/1.12**4,687.9093753253837),
 'R24_bank_payment':(10800*(.09/12)/(1-(1+.09/12)**(-60)),224.19023644462186)
}
for name,(actual,expected) in checks.items():
 assert abs(actual-expected) < 0.00001,(name,actual,expected)

# Full ledger-consistent example path: Used > Standard > $12 bowl >
# Lean marketing > 90:10 mix > no delivery/promo/hire/catering >
# absorb supplier increase > keep purchased sauce > no ABC promo/premium or budget initiative >
# weather untreated > no waste training > absorb labor overage > keep wraps >
# corporate credit sale > repair fridge > no machine > finance second truck > retain cash.
capital=D(25000); cash=D(25000-12000-800); equip_at_cost=D(12000);acc_dep=D(0)
deposit=D(800); ar=D(0); prepaid=D(0); debt=D(0); retained=D(0)
months=[]

def settle(month, bowls, wraps, bowl_cost, wrap_cost, extra_fixed=0, extra_rev=0, extra_vc=0, cash_extra_rev=None, extra_nonrec=0):
 global cash, acc_dep, retained
 bowls=D(bowls); wraps=D(wraps)
 sale=bowls*D(12)+wraps*D(10)+D(extra_rev)
 vc=bowls*D(bowl_cost)+wraps*D(wrap_cost)+D(extra_vc)
 fixed=D(5700)+D(extra_fixed)+D(extra_nonrec)
 dep=D(200)
 profit=sale-vc-fixed-dep
 # normal all sales collected; extra_rev can be an uncollected credit sale
 cash_collected=bowls*D(12)+wraps*D(10)+D(extra_rev if cash_extra_rev is None else cash_extra_rev)
 cash_change=cash_collected-vc-fixed
 cash+=cash_change;acc_dep+=dep;retained+=profit
 assets=cash+ar+deposit+prepaid+(equip_at_cost-acc_dep)
 equity=capital+retained
 assert money(assets-debt-equity)==D('0.00'), (month,assets,debt,equity)
 months.append((month, sale, vc, fixed, dep, profit, cash, assets, equity))

settle('Month 1',990,110,5,4.5)
settle('Month 2',990,110,5.6,5.1)
settle('Month 3',871,97,5.8,5.3,extra_fixed=756)
# Month 4 corporate order is completed on credit; its revenue is earned,
# the cash cost is paid, and the receivable remains at period-end.
ar+=D(2400)
settle('Month 4',990,110,5.8,5.3,extra_rev=2400,extra_vc=1000,cash_extra_rev=0,extra_nonrec=650)
assert money(cash)==D('13915.10'),cash
assert money(retained)==D('3315.10'),retained
# R24 after Month4 close: finance 60% of $18k truck with $10.8k liability
# and $7.2k net cash outflow.
cash-=D(7200);equip_at_cost+=D(18000);debt+=D(10800)
assets=cash+ar+deposit+prepaid+equip_at_cost-acc_dep
assert money(assets)==D('39115.10'), assets
assert money(assets-debt-capital-retained)==D('0.00')

if __name__=='__main__':
 print('PASS:',len(checks),'worked examples and 4 month-end ledger reconciliations')
 for m in months:
  name,sales,vc,fixed,dep,profit,month_end_cash,assets,equity=m
  print(f'{name:7} sales ${sales:,.2f}, variable ${vc:,.2f}, fixed ${fixed:,.2f}, dep ${dep:,.2f}, profit ${profit:,.2f}, cash ${month_end_cash:,.2f}')
 print(f'After financed expansion: cash ${cash:,.2f}, A/R ${ar:,.2f}, PPE net ${equip_at_cost-acc_dep:,.2f}, deposits ${deposit:,.2f}, loan ${debt:,.2f}, equity ${capital+retained:,.2f}')
