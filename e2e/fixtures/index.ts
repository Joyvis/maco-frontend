import { test as base, type Page } from '@playwright/test';

const ADMIN_AUTH_FILE = 'e2e/.auth/admin.json';
const CUSTOMER_AUTH_FILE = 'e2e/.auth/customer.json';

type Fixtures = {
  authedPage: Page;
  customerPage: Page;
};

export const test = base.extend<Fixtures>({
  authedPage: async ({ browser }, provide) => {
    const context = await browser.newContext({ storageState: ADMIN_AUTH_FILE });
    const page = await context.newPage();
    await provide(page);
    await context.close();
  },
  customerPage: async ({ browser }, provide) => {
    const context = await browser.newContext({
      storageState: CUSTOMER_AUTH_FILE,
    });
    const page = await context.newPage();
    await provide(page);
    await context.close();
  },
});

export { expect } from '@playwright/test';
