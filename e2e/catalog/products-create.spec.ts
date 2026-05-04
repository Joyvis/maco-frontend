import { test, expect } from '@playwright/test';

const EMAIL = 'owner@acme.test';
const PASSWORD = 'Passw0rd!';

test.describe('catalog / products create', () => {
  test('creates a product and shows it on the list page', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('E-mail').fill(EMAIL);
    await page.getByLabel('Senha').fill(PASSWORD);
    await page.getByRole('button', { name: /Entrar/i }).click();

    await page.waitForURL(/\/dashboard/, { timeout: 10_000 });

    const productName = `E2E Produto ${Date.now()}`;
    const basePrice = '19.90';

    await page.goto('/catalogo/produtos/new');
    await page.waitForURL(/\/catalogo\/produtos\/new/);

    await expect(
      page.getByRole('heading', { name: 'Novo Produto' }),
    ).toBeVisible();

    await page.getByLabel('Nome').fill(productName);
    await page.getByLabel('Descrição').fill('Produto criado pelo teste e2e');
    await page.getByLabel('Preço Base (R$)').fill(basePrice);

    await page.getByRole('button', { name: 'Salvar' }).click();

    await page.waitForURL(/\/catalogo\/produtos$/, { timeout: 10_000 });

    await expect(page.getByRole('heading', { name: 'Produtos' })).toBeVisible();

    await expect(page.getByText('Carregando...')).toHaveCount(0, {
      timeout: 10_000,
    });

    const table = page.getByRole('table');
    await expect(table).toBeVisible();

    await page.getByPlaceholder('Filtrar...').fill(productName);

    const matchingRow = table.locator('tbody tr', { hasText: productName });
    await expect(matchingRow).toHaveCount(1, { timeout: 10_000 });
    await expect(matchingRow.getByText(productName)).toBeVisible();
    await expect(matchingRow.getByText('R$ 19,90')).toBeVisible();
  });
});
