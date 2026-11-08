import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

const specs = JSON.parse(readFileSync('docs/startup_survivor_round_specs.json', 'utf8'));
const ROUNDS: { id: string; title: string; mastery_check: { answer: number } }[] = specs.rounds;
const VARIANCE = new Set(['R16', 'R17', 'R18', 'R19']);
const REFERENCE = 'ABBCCACCCCAACCCCCCAAAACBB';
const CLOSE: Record<string, number> = { R10: 1, R15: 2, R20: 3, R23: 4 };

async function answer(page: Page, id: string, value: number) {
  await page.getByLabel(/Your answer/).fill(String(VARIANCE.has(id) ? Math.abs(value) : value));
  if (VARIANCE.has(id)) await page.getByText('U (unfavorable)').click();
  await page.getByRole('button', { name: 'Check answer' }).click();
  await expect(page.getByText('Correct.', { exact: false })).toBeVisible();
}

async function playRound(page: Page, i: number, letter: string) {
  const r = ROUNDS[i];
  await expect(page.getByRole('heading', { level: 1, name: r.title })).toBeVisible();
  await answer(page, r.id, r.mastery_check.answer);
  await page.locator('.ticket').nth('ABC'.indexOf(letter)).click();
  await page.getByRole('button', { name: `Confirm option ${letter}` }).click();
  await expect(page.getByRole('heading', { level: 1, name: new RegExp(`You chose ${letter}`) })).toBeVisible();
  if (r.id === 'R17') {
    // Doing nothing about waste wins Month 3 but training pays back in Month 4: the table must show both horizons.
    await expect(page.locator('table.fin th', { hasText: 'Months 3–4 operating income' })).toBeVisible();
    // Training (A) loses $34.80 in Month 3 but saves $0.15 on 1,100 Month 4 meals: +$130.20 through Month 4.
    await expect(page.getByText(/another option projects \$130\.20 more through Month 4/)).toBeVisible();
  }
  const m = CLOSE[r.id];
  if (m) {
    await page.getByRole('button', { name: `Close Month ${m}` }).click();
    await expect(page.getByRole('heading', { level: 1, name: new RegExp(`Month ${m}`) })).toBeVisible();
    await page.getByRole('button', { name: m === 4 ? 'Go to expansion decisions' : 'See the chapter checkpoint' }).click();
    if (m < 4) await page.getByRole('button', { name: /Start Chapter/ }).click();
  } else if (r.id === 'R05') {
    await page.getByRole('button', { name: 'Finish Chapter 1' }).click();
    await page.getByRole('button', { name: /Start Chapter 2/ }).click();
  } else if (r.id === 'R25') {
    await page.getByRole('button', { name: 'See the investor report' }).click();
  } else {
    await page.getByRole('button', { name: 'Next round' }).click();
  }
}

async function startCareer(page: Page, name = 'Test Truck') {
  await page.goto('./');
  await page.evaluate(() => localStorage.clear());
  await page.goto('./');
  await page.getByRole('button', { name: 'Start a full career' }).click();
  await page.getByLabel('Name your truck').fill(name);
  await page.getByRole('button', { name: 'Start Chapter 1' }).click();
}

test('full career on the reference path reproduces the validator to the cent', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await startCareer(page);
  for (let i = 0; i < 25; i++) {
    await playRound(page, i, REFERENCE[i]);
    if (ROUNDS[i].id === 'R10') await expect(page.locator('.till')).toContainText('$14,035.00');
    if (ROUNDS[i].id === 'R23') await expect(page.locator('.till')).toContainText('$13,915.10');
  }
  const till = page.locator('.till');
  await expect(till).toContainText('$6,715.10');
  await expect(till).toContainText('100 / 100'); // perfect mastery on the scripted path
  await expect(till).toContainText('Books balance');
  await expect(page.getByText('$28,315.10').first()).toBeVisible(); // equity after Month 4
  // Wide statements: on a phone the four-month table scrolls sideways, says so, and is keyboard-focusable; on a desktop it fits.
  const hints = page.getByText('Scroll sideways to see every column.');
  if (test.info().project.name === 'mobile') {
    await expect(hints.first()).toBeVisible();
    await expect(page.getByRole('region', { name: /scrolls sideways/ }).first()).toHaveAttribute('tabindex', '0');
  } else {
    await expect(hints).toHaveCount(0);
  }
  expect(errors).toEqual([]);
});

test('progress survives a reload and resumes at the same round', async ({ page }) => {
  await startCareer(page, 'Resume Wagon');
  for (let i = 0; i < 3; i++) await playRound(page, i, REFERENCE[i]);
  await page.reload();
  await page.getByRole('button', { name: /Resume Resume Wagon/ }).first().click();
  await expect(page.getByRole('heading', { level: 1, name: ROUNDS[3].title })).toBeVisible();
  await expect(page.locator('.till')).toContainText('$12,200.00'); // $25,000 − $12,000 truck − $800 deposit
});

test('a whole round can be played with the keyboard only', async ({ page }) => {
  await startCareer(page, 'Keys Only');
  await expect(page.getByRole('heading', { level: 1, name: ROUNDS[0].title })).toBeFocused();
  async function tabTo(name: RegExp | string) {
    for (let k = 0; k < 80; k++) {
      await page.keyboard.press('Tab');
      const label = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        return el ? (el.getAttribute('aria-label') || el.innerText || (el as HTMLInputElement).id || '') : '';
      });
      if (typeof name === 'string' ? label.includes(name) : name.test(label)) return;
    }
    throw new Error(`Could not reach ${name} with Tab`);
  }
  await tabTo(/ans-R01/);
  await page.keyboard.type('13000');
  await page.keyboard.press('Enter');
  await expect(page.getByText('Correct.', { exact: false })).toBeVisible();
  await tabTo(/Used truck/);
  await page.keyboard.press('Space');
  await tabTo('Confirm option A');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { level: 1, name: /You chose A/ })).toBeVisible();
});

test('no horizontal page scroll on the round screen', async ({ page }) => {
  await startCareer(page, 'Narrow');
  await expect(page.getByRole('heading', { level: 1, name: ROUNDS[0].title })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test('calculator works out an answer and fills the answer box', async ({ page }) => {
  await startCareer(page, 'Calc Cart');
  await page.getByRole('button', { name: 'Calculator' }).click();
  const calc = page.getByRole('dialog', { name: 'Calculator' });
  await calc.getByLabel('Calculation').fill('25000 - 12000');
  await calc.getByLabel('Calculation').press('Enter');
  await expect(calc.locator('output')).toHaveText('= 13,000');
  await calc.getByRole('button', { name: 'Use in answer' }).click();
  await expect(page.getByLabel(/Your answer/)).toHaveValue('13000');
  await page.getByRole('button', { name: 'Check answer' }).click();
  await expect(page.getByText('Correct.', { exact: false })).toBeVisible();
  // On a phone the sheet steps aside after filling the answer; reopen it. History and input are kept.
  if (!(await calc.isVisible())) await page.getByRole('button', { name: 'Calculator' }).click();
  await expect(calc.getByLabel('Calculation')).toHaveValue('25000 - 12000');
  // Keypad and NPV-style powers
  await calc.getByRole('button', { name: 'Clear' }).click();
  await calc.getByLabel('Calculation').fill('1050/1.1^3');
  await calc.getByRole('button', { name: '=' }).click();
  await expect(calc.locator('output')).toHaveText('= 788.880541');
  await calc.getByLabel('Calculation').press('Escape');
  await expect(calc).toBeHidden();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test('mastery affects sales: a revealed answer lowers that month\'s demand, and the switch turns it off', async ({ page }) => {
  await page.goto('./'); await page.evaluate(() => localStorage.clear()); await page.goto('./');
  await page.getByRole('button', { name: 'Start a full career' }).click();
  await expect(page.getByLabel('Mastery affects sales')).toBeChecked();
  await page.getByLabel('Name your truck').fill('Shaky Books');
  await page.getByRole('button', { name: 'Start Chapter 1' }).click();
  // R01: miss, then reveal → 0 points → 75% for this check.
  await page.getByLabel(/Your answer/).fill('12000');
  await page.getByRole('button', { name: 'Check answer' }).click();
  await page.getByRole('button', { name: 'Reveal the answer' }).click();
  await expect(page.getByText(/Execution:.*75% for this check/)).toBeVisible();
  // Rest of Month 1 aced; Month 1 execution = (0.75 + 9 × 1) / 10 = 97.5%.
  const proForma = page.locator('.till dt', { hasText: 'Month 1 so far (pro forma)' }).locator('xpath=following-sibling::dd[1]');
  for (let i = 0; i < 10; i++) {
    // The dashboard's pro forma must follow the execution factor as soon as a check is answered, not only after a decision.
    const before = i === 3 ? await proForma.textContent() : null; // R04: (0.75 + 1 + 1) / 3 = 91.67% so far
    if (i > 0) await answer(page, ROUNDS[i].id, ROUNDS[i].mastery_check.answer);
    if (i === 3) await expect(proForma).not.toHaveText(before!); // now (0.75 + 3) / 4 = 93.75%
    await page.locator('.ticket').nth('ABC'.indexOf(REFERENCE[i])).click();
    await page.getByRole('button', { name: `Confirm option ${REFERENCE[i]}` }).click();
    const next = i === 9 ? 'Close Month 1' : i === 4 ? 'Finish Chapter 1' : 'Next round';
    await page.getByRole('button', { name: next }).click();
    if (i === 4) await page.getByRole('button', { name: /Start Chapter 2/ }).click();
  }
  // 1,100 × 0.975 = 1,072.5 → 1,073 regular orders: 966 bowls + 107 wraps.
  await expect(page.getByText(/Execution from your knowledge checks: ×0\.975/)).toBeAttached();
  await expect(page.locator('.till')).toContainText('$12,662.00'); // Month 1 sales: 966 × $12 + 107 × $10 = $11,592 + $1,070
});
