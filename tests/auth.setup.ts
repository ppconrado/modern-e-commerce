import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // Go to login page
  await page.goto('http://localhost:3000/login');

  // Fill in credentials
  await page.fill('input[type="email"]', 'jane@example.com');
  await page.fill('input[type="password"]', 'password123');

  // Click login button (form submit)
  await page.click('form button[type="submit"]');

  // Wait for redirect away from login page
  await page.waitForURL((url) => !url.pathname.includes('/login'), {
    timeout: 10000,
  });

  // Go to home to ensure session is active
  await page.goto('http://localhost:3000/');

  // Verify we're actually logged in by checking for Sign out button
  await page.waitForSelector('button:has-text("Sign out")', { timeout: 10000 });

  // Verify user name appears (Jane Smith)
  await expect(page.locator('text=Jane')).toBeVisible();

  // Save signed-in state
  await page.context().storageState({ path: authFile });

  console.log('✅ Authentication successful - session saved');
});
