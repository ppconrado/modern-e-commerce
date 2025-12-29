import { test } from '@playwright/test';

test('debug login detailed', async ({ page }) => {
  // Enable detailed logging
  page.on('console', (msg) => {
    console.log('BROWSER LOG:', msg.type(), msg.text());
  });

  page.on('request', (request) => {
    console.log(
      'REQUEST:',
      request.method(),
      request.url().substring(request.url().indexOf('/', 10))
    );
  });

  page.on('response', async (response) => {
    if (response.url().includes('api/auth')) {
      console.log('AUTH RESPONSE:', response.status(), response.url());
      try {
        const body = await response.text();
        console.log('RESPONSE BODY:', body.substring(0, 200));
      } catch (e) {
        console.log('Could not read response body');
      }
    }
  });

  await page.goto('http://localhost:3000/login');
  console.log('\n=== 1. On login page ===');

  await page.fill('input[type="email"]', 'jane@example.com');
  await page.fill('input[type="password"]', 'password123');
  console.log('\n=== 2. Filled credentials ===');

  // Check if submit button is enabled and visible
  const button = page.locator('form button[type="submit"]');
  const isEnabled = await button.isEnabled();
  const isVisible = await button.isVisible();
  console.log('Button enabled:', isEnabled, 'visible:', isVisible);

  await button.click();
  console.log('\n=== 3. Clicked Sign In ===');

  // Wait and watch for any navigation or API calls
  await page.waitForTimeout(8000);

  console.log('\n=== 4. After 8 second wait ===');
  console.log('Current URL:', page.url());

  const errorElement = await page.locator('text=/invalid|error/i').count();
  console.log('Error messages found:', errorElement);

  if (errorElement > 0) {
    const errorText = await page
      .locator('text=/invalid|error/i')
      .first()
      .textContent();
    console.log('Error text:', errorText);
  }
});
