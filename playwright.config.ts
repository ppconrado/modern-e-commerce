import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: [
    // Setup project - runs first to create authenticated state
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    // Tests that require authentication
    {
      name: 'chromium-authenticated',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
      testMatch: /.*\.auth\.spec\.ts/,
    },
    {
      name: 'firefox-authenticated',
      use: {
        ...devices['Desktop Firefox'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
      testMatch: /.*\.auth\.spec\.ts/,
    },
    {
      name: 'webkit-authenticated',
      use: {
        ...devices['Desktop Safari'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
      testMatch: /.*\.auth\.spec\.ts/,
    },
    // Tests that don't require authentication
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: /.*\.auth\.spec\.ts/,
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testIgnore: /.*\.auth\.spec\.ts/,
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testIgnore: /.*\.auth\.spec\.ts/,
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
