import { defineConfig, devices } from '@playwright/test';

const basePath = `${(process.env.BASE_PATH || '/ufo-data').replace(/\/+$/, '')}/`;
const origin = 'http://127.0.0.1:4321';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: `${origin}${basePath}`,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium-mobile',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1',
    url: `${origin}${basePath}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
