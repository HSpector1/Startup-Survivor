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
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/');
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
