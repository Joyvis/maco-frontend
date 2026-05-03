import { test, expect } from '@playwright/test';

const EMAIL = 'owner@acme.test';
const PASSWORD = 'Passw0rd!';

test.describe('session persistence', () => {
  test('user stays on dashboard after page refresh', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('E-mail').fill(EMAIL);
    await page.getByLabel('Senha').fill(PASSWORD);
    await page.getByRole('button', { name: /Entrar/i }).click();

    await page.waitForURL(/\/dashboard/, { timeout: 10_000 });
    expect(page.url()).toContain('/dashboard');

    const cookiesAfterLogin = await page.context().cookies();
    expect(
      cookiesAfterLogin.find((c) => c.name === 'refresh_token'),
    ).toBeDefined();

    await page.reload();
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/dashboard');
    expect(page.url()).not.toContain('/login');

    const cookiesAfterReload = await page.context().cookies();
    expect(
      cookiesAfterReload.find((c) => c.name === 'refresh_token'),
    ).toBeDefined();
  });
});
