import { test, expect } from '@playwright/test';

const EMAIL = 'owner@acme.test';
const PASSWORD = 'Passw0rd!';

test.describe('catalog / categories', () => {
  test('lists categories and creates a new one', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('E-mail').fill(EMAIL);
    await page.getByLabel('Senha').fill(PASSWORD);
    await page.getByRole('button', { name: /Entrar/i }).click();

    await page.waitForURL(/\/dashboard/, { timeout: 20_000 });

    await page.goto('/catalogo/categorias');
    await page.waitForURL(/\/catalogo\/categorias$/);

    await expect(
      page.getByRole('heading', { name: 'Categorias' }),
    ).toBeVisible();

    await expect(page.getByText('Carregando...')).toHaveCount(0, {
      timeout: 10_000,
    });

    const newCategoryButton = page.getByRole('button', {
      name: 'Nova Categoria',
    });
    await expect(newCategoryButton).toBeVisible();
    await newCategoryButton.click();

    const categoryName = `E2E Categoria ${Date.now()}`;
    await page.getByLabel('Nova categoria').fill(categoryName);
    await page.getByRole('button', { name: 'Adicionar' }).click();

    const newRow = page
      .locator('[data-testid^="category-row-"]')
      .filter({ hasText: categoryName });
    await expect(newRow).toHaveCount(1, { timeout: 10_000 });
    await expect(newRow.getByText(categoryName)).toBeVisible();
  });

  test('reorders categories via drag-and-drop and persists in the backend', async ({
    page,
    request,
  }) => {
    await page.goto('/login');

    await page.getByLabel('E-mail').fill(EMAIL);
    await page.getByLabel('Senha').fill(PASSWORD);
    await page.getByRole('button', { name: /Entrar/i }).click();

    await page.waitForURL(/\/dashboard/, { timeout: 20_000 });

    await page.goto('/catalogo/categorias');
    await page.waitForURL(/\/catalogo\/categorias$/);

    await expect(page.getByText('Carregando...')).toHaveCount(0, {
      timeout: 10_000,
    });

    const ts = Date.now();
    const nameA = `E2E Reorder A ${ts}`;
    const nameB = `E2E Reorder B ${ts}`;

    for (const name of [nameA, nameB]) {
      await page.getByRole('button', { name: 'Nova Categoria' }).click();
      await page.getByLabel('Nova categoria').fill(name);
      await page.getByRole('button', { name: 'Adicionar' }).click();
      await expect(
        page
          .locator('[data-testid^="category-row-"]')
          .filter({ hasText: name }),
      ).toHaveCount(1, { timeout: 10_000 });
    }

    const indexOf = (rows: { name?: string }[], text: string) =>
      rows.findIndex((r) => (r.name ?? '').includes(text));

    const rowA = page
      .locator('[data-testid^="category-row-"]')
      .filter({ hasText: nameA });
    const rowB = page
      .locator('[data-testid^="category-row-"]')
      .filter({ hasText: nameB });

    const reorderResponse = page.waitForResponse(
      (r) =>
        r.url().endsWith('/catalog/categories/reorder') &&
        r.request().method() === 'PUT',
    );

    await rowB.dispatchEvent('dragstart');
    await rowA.dispatchEvent('dragover');
    await rowA.dispatchEvent('drop');

    const reorderRes = await reorderResponse;
    expect(reorderRes.ok()).toBe(true);

    // Verify persistence by querying the backend directly (independent of the
    // browser's auth state, which has a known refresh-token rotation race on
    // full page reload — see commit 08a6534 for prior fix).
    const loginRes = await request.post('http://localhost:4000/auth/login', {
      data: { email: EMAIL, password: PASSWORD },
    });
    expect(loginRes.ok()).toBe(true);
    const { access_token } = (await loginRes.json()) as {
      access_token: string;
    };
    const listRes = await request.get(
      'http://localhost:4000/catalog/categories',
      {
        headers: { Authorization: `Bearer ${access_token}` },
      },
    );
    expect(listRes.ok()).toBe(true);
    const list = (await listRes.json()) as {
      data: Array<{ id: string; name: string; display_order?: number }>;
    };
    const indexA = indexOf(list.data, nameA);
    const indexB = indexOf(list.data, nameB);
    expect(indexA).toBeGreaterThan(-1);
    expect(indexB).toBeGreaterThan(-1);
    expect(indexB).toBeLessThan(indexA);
  });
});
