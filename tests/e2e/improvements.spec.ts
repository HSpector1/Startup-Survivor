// Browser tests for the 2026-11-14 improvements: calculator reset per question, the in-game glossary panel,
// the Business Performance grade and the end-of-game learning review.
import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

const specs = JSON.parse(readFileSync('docs/startup_survivor_round_specs.json', 'utf8'));
const ROUNDS: { id: string; title: string; mastery_check: { answer: number } }[] = specs.rounds;
const REFERENCE = 'ABBCCACCCCAACCCCCCAAAACBB';

async function fresh(page: Page) {
  await page.goto('./');
  await page.evaluate(() => localStorage.clear());
  await page.goto('./');
}

async function startCareer(page: Page, name: string) {
  await fresh(page);
  await page.getByRole('button', { name: 'Start a full career' }).click();
  await page.getByLabel('Name your truck').fill(name);
  await page.getByRole('button', { name: 'Start Chapter 1' }).click();
  await expect(page.getByRole('heading', { level: 1, name: ROUNDS[0].title })).toBeVisible();
}

const calc = (page: Page) => page.getByRole('dialog', { name: 'Calculator' });

async function calculate(page: Page, expr: string) {
  if (!(await calc(page).isVisible())) await page.getByRole('button', { name: 'Calculator' }).click();
  await calc(page).getByLabel('Calculation').fill(expr);
  await calc(page).getByLabel('Calculation').press('Enter');
  // The calculator keeps its state while hidden; closing it keeps the phone's answer form reachable.
  await calc(page).getByLabel('Calculation').press('Escape');
}

async function openCalc(page: Page) {
  if (!(await calc(page).isVisible())) await page.getByRole('button', { name: 'Calculator' }).click();
}

async function expectCalcCleared(page: Page) {
  if (!(await calc(page).isVisible())) await page.getByRole('button', { name: 'Calculator' }).click();
  await expect(calc(page).getByLabel('Calculation')).toHaveValue('');
  await expect(calc(page).locator('output')).toHaveText(/^\s*$/);
  await expect(calc(page).getByText(/^Recent/)).toHaveCount(0);
  await expect(calc(page).getByRole('button', { name: 'Use in answer' })).toBeDisabled();
}

async function noSideScroll(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
}

test('calculator keeps its work within a question and clears on the next one (Full Career)', async ({ page }) => {
  await startCareer(page, 'Calc Reset');
  await calculate(page, '25000 - 12000');
  await openCalc(page);
  await expect(calc(page).locator('output')).toHaveText('= 13,000');
  await calc(page).getByLabel('Calculation').press('Escape');
  // A wrong answer is still the same question: nothing resets.
  await page.getByLabel(/Your answer/).fill('12000');
  await page.getByRole('button', { name: 'Check answer' }).click();
  await expect(page.getByText('Not yet.')).toBeVisible();
  await openCalc(page);
  await expect(calc(page).getByLabel('Calculation')).toHaveValue('25000 - 12000');
  await calc(page).getByRole('button', { name: 'Use in answer' }).click();
  if (await calc(page).isVisible()) await calc(page).getByLabel('Calculation').press('Escape');
  await page.getByRole('button', { name: 'Check answer' }).click();
  await expect(page.getByText('Correct.', { exact: false })).toBeVisible();
  if (!(await calc(page).isVisible())) await page.getByRole('button', { name: 'Calculator' }).click();
  await expect(calc(page).getByLabel('Calculation')).toHaveValue('25000 - 12000');
  await expect(calc(page).getByText(/^Recent/)).toBeVisible();
  await calc(page).getByLabel('Calculation').press('Escape');
  // Decide, read the consequence, move on: Round 2 starts with a clean calculator.
  await page.locator('.ticket').nth(0).click();
  await page.getByRole('button', { name: 'Confirm option A' }).click();
  await page.getByRole('button', { name: 'Next round' }).click();
  await expect(page.getByRole('heading', { level: 1, name: ROUNDS[1].title })).toBeVisible();
  await expectCalcCleared(page);
  // Resuming after a reload shows the current question's (empty) calculator, not Round 1's.
  await calculate(page, '900 + 0.5*1000');
  await page.reload();
  await page.getByRole('button', { name: /Resume Calc Reset/ }).first().click();
  await expect(page.getByRole('heading', { level: 1, name: ROUNDS[1].title })).toBeVisible();
  await expectCalcCleared(page);
});

test('calculator clears between Quick Challenge problems and between Mastery Lab cases', async ({ page }) => {
  await fresh(page);
  await page.getByRole('button', { name: 'Quick Challenge (5 min)' }).click();
  await page.getByRole('button', { name: 'Start problem 1' }).click();
  await calculate(page, '5900/7');
  await page.getByLabel('Your answer').fill('843');
  await page.getByRole('button', { name: 'Check answer' }).click();
  await openCalc(page);
  await expect(calc(page).getByLabel('Calculation')).toHaveValue('5900/7'); // same problem: kept
  await calc(page).getByLabel('Calculation').press('Escape');
  await page.locator('.ticket').first().click();
  await page.getByRole('button', { name: 'Next problem' }).click();
  await expectCalcCleared(page);
  await calc(page).getByLabel('Calculation').press('Escape');

  await page.getByRole('button', { name: 'Leave' }).click();
  await page.getByRole('button', { name: 'Open the Mastery Lab' }).click();
  await page.getByRole('button', { name: 'Start case 1' }).click();
  await calculate(page, '1800*25/100');
  await page.getByLabel('Your answer').fill('450');
  await page.getByRole('button', { name: 'Check answer' }).click();
  await page.locator('.ticket').first().click();
  await page.getByRole('button', { name: 'Next case' }).click();
  await expectCalcCleared(page);
});

test('glossary panel searches by abbreviation and closes without touching the question', async ({ page }) => {
  await startCareer(page, 'Gloss Cart');
  await page.getByLabel(/Your answer/).fill('130');
  await calculate(page, '2 + 2');
  const opener = page.getByRole('button', { name: 'Glossary', exact: true });
  await opener.click();
  const panel = page.getByRole('dialog', { name: 'Glossary' });
  await expect(panel).toBeVisible();
  const search = panel.getByLabel('Search by term or abbreviation');
  await expect(search).toBeFocused();
  for (const [q, term] of [['ABC', 'Activity-based costing'], ['NPV', 'Net present value'], ['CVP', 'Cost-volume-profit'], ['APV', 'Materials price and quantity variances'], ['unfavorable', 'favorable and unfavorable'], ['relevant cost', 'Relevant cost']] as const) {
    await search.fill(q);
    await expect(panel.locator('.gloss-entry h3').first()).toContainText(term);
    if (q === 'APV') await expect(panel.getByText(/APV is short for the materials price variance/)).toBeVisible();
  }
  await noSideScroll(page);
  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
  await expect(opener).toBeFocused();
  // Exactly where the player left off: same round, typed answer, calculator work.
  await expect(page.getByRole('heading', { level: 1, name: ROUNDS[0].title })).toBeVisible();
  await expect(page.getByLabel(/Your answer/)).toHaveValue('130');
  await openCalc(page);
  await expect(calc(page).getByLabel('Calculation')).toHaveValue('2 + 2');
  await calc(page).getByLabel('Calculation').press('Escape');
  // The Close button works too.
  await opener.click();
  await panel.getByRole('button', { name: 'Close' }).click();
  await expect(panel).toBeHidden();
  await expect(page.getByLabel(/Your answer/)).toHaveValue('130');
  // Round 13's text spells out ABC at first use (checked in Vitest); the panel is also on the Quick Challenge and Mastery Lab.
  await page.getByRole('button', { name: 'Startup Survivor' }).click();
  await page.getByRole('button', { name: 'Quick Challenge (5 min)' }).click();
  await page.getByRole('button', { name: 'Start problem 1' }).click();
  await page.getByLabel('Your answer').fill('84');
  await opener.click();
  await page.keyboard.press('Escape');
  await expect(page.getByLabel('Your answer')).toHaveValue('84');
});

/** A finished game on the reference path, written straight into storage. Mastery affects sales is off, so the ledger is the validator's. */
async function finishedSave(page: Page, mastery: Record<string, unknown>) {
  const choices = Object.fromEntries(ROUNDS.map((r, i) => [r.id, REFERENCE[i]]));
  const save = { schemaVersion: 1, truckName: 'Report Truck', choices, rescues: {}, mastery, masteryAffectsSales: false, view: { kind: 'final' }, checkpoints: {} };
  await fresh(page);
  await page.evaluate((s) => localStorage.setItem('startup-survivor:v1', JSON.stringify(s)), save);
  await page.goto('./');
  // The top bar (Calculator, Glossary, Resume) fits a phone without spilling sideways.
  const overhang = await page.evaluate(() => Math.max(...[...document.querySelectorAll('.topbar .btn')].map((b) => b.getBoundingClientRect().right - document.documentElement.clientWidth)));
  expect(overhang).toBeLessThanOrEqual(0);
  await noSideScroll(page);
  await page.getByRole('button', { name: /Resume Report Truck/ }).first().click();
  await expect(page.getByRole('heading', { level: 1, name: 'Report Truck' })).toBeVisible();
}

const perfect = () => Object.fromEntries(ROUNDS.map((r) => [r.id, { attempts: 1, hint: false, revealed: false, correct: true, answers: [{ value: Math.abs(r.mastery_check.answer), ...(['R16', 'R17', 'R18', 'R19'].includes(r.id) ? { label: 'U' } : {}) }] }]));

test('final report: business grade, learning review, decisions and export', async ({ page }) => {
  const m = perfect();
  m.R16 = { attempts: 2, hint: false, revealed: true, correct: false, answers: [{ value: 1584, label: 'U' }, { value: 924, label: 'F' }] };
  m.R04 = { attempts: 2, hint: true, revealed: false, correct: true, answers: [{ value: 842 }, { value: 843 }] };
  await finishedSave(page, m);
  await expect(page.getByRole('heading', { name: 'Grade C: Surviving Startup' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Business performance grade C' })).toBeVisible();
  await expect(page.locator('.mastery-card .final-score')).toContainText('94');
  await expect(page.locator('.grade-dims')).toContainText('$3,315 operating income over Months 1–4');

  await expect(page.getByRole('heading', { name: 'Your areas to improve' })).toBeVisible();
  await expect(page.locator('.area h3').first()).toContainText('Break-even and cost-volume-profit analysis');

  const card = page.locator('details.missed-card', { hasText: 'Round 16' });
  await expect(page.locator('details.missed-card')).toHaveCount(2);
  await card.locator('summary').click();
  await expect(card).toContainText('$1,584 U');
  await expect(card).toContainText('$924 F');
  await expect(card).toContainText('$924.00 U');
  await expect(card).toContainText('direction');
  await card.getByRole('button', { name: /^Glossary:/ }).click();
  const panel = page.getByRole('dialog', { name: 'Glossary' });
  await expect(panel.locator('.gloss-entry').first()).toContainText(/variance/i);
  await page.keyboard.press('Escape');

  await expect(page.getByRole('heading', { name: 'Business decisions to reconsider' })).toBeVisible();
  await expect(page.locator('#decisions-h ~ .tag, .tag.forecast', { hasText: 'Simulation' }).first()).toBeVisible();
  await expect(page.getByText(/In a simulation with/).first()).toBeVisible();

  await page.getByText('Plain-text report').click();
  const report = page.getByLabel('Plain-text report');
  await expect(report).toHaveValue(/Business performance: C, Surviving Startup/);
  await expect(report).toHaveValue(/Missed or assisted questions: R4, R16/);
  await expect(report).toHaveValue(/Accounting mastery: 94\/100/);
  await page.getByText('Plain-text study review').click();
  await expect(page.getByLabel('Plain-text study review')).toHaveValue(/Round 16, Sales slump!/);
  // The investor report itself is unchanged: validator numbers still show.
  await expect(page.getByText('$28,315.10').first()).toBeVisible();
  await noSideScroll(page);
});

test('final report: a perfect run gets congratulations, and an old save says answers were not recorded', async ({ page }) => {
  await finishedSave(page, perfect());
  await expect(page.getByText('Perfect run.')).toBeVisible();
  await expect(page.getByText('No weak areas.')).toBeVisible();

  const legacy = perfect();
  legacy.R10 = { attempts: 3, hint: false, revealed: false, correct: true }; // saved before answer history existed
  await finishedSave(page, legacy);
  const card = page.locator('details.missed-card', { hasText: 'Round 10' });
  await card.locator('summary').click();
  await expect(card).toContainText('Not recorded');
});
