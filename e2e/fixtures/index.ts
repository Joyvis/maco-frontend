import { test as base, type Page } from '@playwright/test';

const AUTH_FILE = 'e2e/.auth/admin.json';

type Fixtures = {
  authedPage: Page;
};

export const test = base.extend<Fixtures>({
  authedPage: async ({ browser }, provide) => {
    const context = await browser.newContext({ storageState: AUTH_FILE });
    const page = await context.newPage();
    await provide(page);
    await context.close();
  },
});

export { expect } from '@playwright/test';
