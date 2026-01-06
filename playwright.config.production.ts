import { defineConfig, devices } from '@playwright/test';

/**
 * Production Testing Configuration
 * Tests run against deployed Vercel app
 * No local webServer, no authentication setup needed
 */
export default defineConfig({
  testDir: './tests/production',
  fullyParallel: true,
  forbidOnly: true,
  retries: 2, // Retry flaky tests in production
  workers: 4,
  reporter: [
    ['html', { outputFolder: 'playwright-report-production' }],
    ['list'],
  ],
  timeout: 30000, // 30s timeout for production tests

  use: {
    baseURL: 'https://josepaulo-e-commerce.vercel.app',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // No webServer for production tests
});
