import { expect, test } from '@playwright/test';

// Peer-review mode: five problems on the fixed reference business, no setup.
const QUICK = [
  { title: 'Find your break-even point', value: '843' },
  { title: 'Win a catering contract', value: '520' },
  { title: 'Food waste and material variances', value: '567', u: true },
  { title: 'Explain the monthly variances', value: '150', u: true },
  { title: 'Should you open a second truck?', value: '3649' },
];

test('Quick Challenge: five problems, feedback, decisions and a 20-point score', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./');
  await page.evaluate(() => localStorage.clear());
  await page.goto('./');
  await page.getByRole('button', { name: /Quick Challenge/ }).first().click();
  await page.getByRole('button', { name: 'Start problem 1' }).click();

  for (const [i, q] of QUICK.entries()) {
    await expect(page.getByRole('heading', { level: 1, name: q.title })).toBeVisible();
    if (i === 0) {
      // A wrong answer first: the game explains the mistake instead of just saying "wrong".
      await page.getByLabel('Your answer').fill('842');
      await page.getByRole('button', { name: 'Check answer' }).click();
      await expect(page.getByText(/Round up/)).toBeVisible();
    }
    await page.getByLabel('Your answer').fill(q.value);
    if (i === 2) {
      // The right amount without a direction asks for F/U and must not cost an attempt.
      await page.getByRole('button', { name: 'Check answer' }).click();
      await expect(page.getByText(/mark the direction/)).toBeVisible();
      await expect(page.getByText('Attempts: 0')).toBeVisible();
    }
    if (q.u) await page.getByText('U (unfavorable)').click();
    await page.getByRole('button', { name: 'Check answer' }).click();
    if (i === 2) await expect(page.getByText(/You earned 4 of 4 points/)).toBeVisible();
    const tickets = page.locator('.ticket');
    await expect(tickets).toHaveCount(3);
    if (i === 4) await expect(tickets.nth(0)).toContainText('Not available'); // $13,915.10 cannot fund an $18,000 cash buy
    await tickets.nth(2).click();
    await expect(page.getByText(/is not automatically wrong/).first()).toBeVisible();
    await page.getByRole('button', { name: i === 4 ? 'See your results' : 'Next problem' }).click();
  }
  await expect(page.getByRole('heading', { level: 1, name: 'Quick Challenge results' })).toBeVisible();
  await expect(page.getByText(/18\s*\/\s*20|18 of 20/).first()).toBeVisible(); // 2 points lost to the retry on problem 1
  expect(errors).toEqual([]);
});

test('landing states the learning objectives up front', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByText(/Interpret financial statements/i).first()).toBeVisible();
  await expect(page.getByText(/no login/i).first()).toBeVisible();
});
