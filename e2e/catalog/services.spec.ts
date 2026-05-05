import { test, expect } from '@playwright/test';

const EMAIL = 'owner@acme.test';
const PASSWORD = 'Passw0rd!';

test.describe('catalog / services', () => {
  test('lists services, creates a new one, and shows it on the list', async ({
    page,
  }) => {
    await page.goto('/login');

    await page.getByLabel('E-mail').fill(EMAIL);
    await page.getByLabel('Senha').fill(PASSWORD);
    await page.getByRole('button', { name: /Entrar/i }).click();

    await page.waitForURL(/\/dashboard/, { timeout: 10_000 });

    await page.goto('/catalogo/servicos');
    await page.waitForURL(/\/catalogo\/servicos$/);

    await expect(page.getByRole('heading', { name: 'Serviços' })).toBeVisible();
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
      'Status',
      'Duração',
      'Preço',
      'Criado em',
    ]) {
      await expect(
        table.getByRole('columnheader', { name: header }),
      ).toBeVisible();
    }

    const newServiceLink = page.getByRole('link', { name: 'Novo Serviço' });
    await expect(newServiceLink).toBeVisible();
    await newServiceLink.click();

    await page.waitForURL(/\/catalogo\/servicos\/new$/, { timeout: 10_000 });
    await expect(
      page.getByRole('heading', { name: 'Novo Serviço' }),
    ).toBeVisible();

    const serviceName = `E2E Serviço ${Date.now()}`;
    const durationMinutes = '45';
    const basePrice = '29.90';

    await page.getByLabel('Nome').fill(serviceName);
    await page.getByLabel('Descrição').fill('Serviço criado pelo teste e2e');
    await page.getByLabel('Duração (minutos)').fill(durationMinutes);
    await page.getByLabel('Preço Base (R$)').fill(basePrice);

    await page.getByRole('button', { name: 'Salvar' }).click();

    await page.waitForURL(/\/catalogo\/servicos\/(?!new$)[^/]+$/, {
      timeout: 10_000,
    });

    await page.goto('/catalogo/servicos');
    await page.waitForURL(/\/catalogo\/servicos$/);
    await expect(page.getByRole('heading', { name: 'Serviços' })).toBeVisible();

    await expect(page.getByText('Carregando...')).toHaveCount(0, {
      timeout: 10_000,
    });

    await page.getByPlaceholder('Filtrar...').fill(serviceName);

    const matchingRow = table.locator('tbody tr', { hasText: serviceName });
    await expect(matchingRow).toHaveCount(1, { timeout: 10_000 });
    await expect(matchingRow.getByText(serviceName)).toBeVisible();
    await expect(matchingRow.getByText('45 min')).toBeVisible();
    await expect(matchingRow.getByText('R$ 29,90')).toBeVisible();
  });
});
