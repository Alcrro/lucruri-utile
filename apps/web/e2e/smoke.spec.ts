import { expect, test } from '@playwright/test';

test('pagina principală se încarcă, cu titlu și limbă corecte', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('lucruri-utile.ro');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ro');
  await expect(page.getByRole('heading', { level: 1, name: 'lucruri-utile.ro' })).toBeVisible();
});

test('health check răspunde pentru monitorul de uptime', async ({ request }) => {
  const res = await request.get('/api/health');
  expect(res.ok()).toBe(true);
  expect(await res.json()).toEqual({ ok: true });
});
