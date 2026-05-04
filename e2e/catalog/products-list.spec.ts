import { test, expect } from '@playwright/test';

const EMAIL = 'owner@acme.test';
const PASSWORD = 'Passw0rd!';

test.describe('catalog / products list', () => {
  test('renders products list page after login', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('E-mail').fill(EMAIL);
    await page.getByLabel('Senha').fill(PASSWORD);
    await page.getByRole('button', { name: /Entrar/i }).click();

    await page.waitForURL(/\/dashboard/, { timeout: 10_000 });

    await page.goto('/catalogo/produtos');
    await page.waitForURL(/\/catalogo\/produtos/);

    await expect(page.getByRole('heading', { name: 'Produtos' })).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Novo Produto' }),
    ).toBeVisible();
    await expect(page.getByLabel('Filtrar por status')).toBeVisible();
    await expect(page.getByLabel('Filtrar por categoria')).toBeVisible();

    await expect(page.getByText('Carregando...')).toHaveCount(0, {
      timeout: 10_000,
    });

    const table = page.getByRole('table');
    await expect(table).toBeVisible();
    for (const header of [
      'Nome',
      'Categoria',
      'Unidade',
      'Status',
      'Preço',
      'Criado em',
    ]) {
      await expect(
        table.getByRole('columnheader', { name: header }),
      ).toBeVisible();
    }

    const dataRows = table.locator('tbody tr');
    await expect(dataRows.first()).toBeVisible();

    const emptyCell = table.getByText('Nenhum resultado encontrado.');
    if ((await emptyCell.count()) === 0) {
      const rowCount = await dataRows.count();
      expect(rowCount).toBeGreaterThan(0);

      const firstRowCells = dataRows.first().locator('td');
      const cellCount = await firstRowCells.count();
      expect(cellCount).toBeGreaterThanOrEqual(6);

      const nameCellText = (await firstRowCells.nth(0).textContent())?.trim();
      expect(nameCellText && nameCellText.length).toBeGreaterThan(0);
    }
  });
});
