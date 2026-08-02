import { defineConfig, devices } from '@playwright/test';

/**
 * There's no login-once-and-reuse setup step here. We checked the app and
 * it doesn't keep any login info (cookies, localStorage, etc.) between
 * pages, so there's nothing to save and reuse anyway. Instead, every test
 * just logs in for itself using the shopPage fixture (src/fixtures/base.ts).
 *
 * The 5 projects below just run the same 10 tests on different browsers:
 * chromium, firefox, and webkit cover desktop, and mobile-chrome /
 * mobile-safari (Pixel 7 / iPhone 14) repeat all 10 tests on emulated
 * mobile devices with real touch input.
 */
export default defineConfig({
  testDir: './tests',
  outputDir: './test-results',
  timeout: 30_000,
  expect: { timeout: 8_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }], ['list']]
    : [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: process.env.BASE_URL ?? 'https://demo-shop-pearl.vercel.app',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 14'] } },
  ],
});
