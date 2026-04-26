import { existsSync } from 'fs';

import { defineConfig, devices } from '@playwright/test';

const AUTH_FILE = 'e2e/.auth/admin.json';

export default defineConfig({
  testDir: 'e2e',
  retries: 1,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  globalSetup: './e2e/global-setup.ts',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:4000',
    // storageState is only loaded when the auth file exists (created by globalSetup in T2+).
    // Specs that require auth use the authedPage fixture from e2e/fixtures.
    storageState: existsSync(AUTH_FILE) ? AUTH_FILE : undefined,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
