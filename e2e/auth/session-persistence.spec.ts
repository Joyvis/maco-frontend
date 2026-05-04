import { test, expect } from '@playwright/test';

const EMAIL = 'owner@acme.test';
const PASSWORD = 'Passw0rd!';
const PROTECTED_ROUTE = '/catalogo/servicos';

test.describe('session persistence', () => {
  test('session survives reload, ends on logout, and blocks protected routes', async ({
    page,
  }) => {
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

    await page.getByRole('button', { name: /user menu/i }).click();
    await page.getByRole('menuitem', { name: /Sair/i }).click();

    await page.waitForURL(/\/login/, { timeout: 10_000 });

    const cookiesAfterLogout = await page.context().cookies();
    expect(
      cookiesAfterLogout.find((c) => c.name === 'refresh_token'),
    ).toBeUndefined();

    await page.reload();
    await page.waitForURL(/\/login/, { timeout: 10_000 });
    expect(page.url()).toContain('/login');

    await page.goto(PROTECTED_ROUTE);
    await page.waitForURL(/\/login/, { timeout: 10_000 });
    expect(page.url()).toContain('/login');
    expect(page.url()).not.toContain(PROTECTED_ROUTE);
  });
});
