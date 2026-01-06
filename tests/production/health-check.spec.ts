import { test, expect } from '@playwright/test';

/**
 * Simple production health checks
 * Only tests routes that actually exist in the application
 */

test.describe('Production Health Checks', () => {
  test('homepage loads successfully', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toContainText('Featured Products');
  });

  test('cart page loads successfully', async ({ page }) => {
    const response = await page.goto('/cart');
    expect(response?.status()).toBe(200);
    // Cart can show "Shopping Cart" or "Your Cart is Empty"
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
  });

  test('login page loads successfully', async ({ page }) => {
    const response = await page.goto('/login');
    expect(response?.status()).toBe(200);
    // Just verify the page loaded, no specific text check
  });

  test('register page loads successfully', async ({ page }) => {
    const response = await page.goto('/register');
    expect(response?.status()).toBe(200);
    // Just verify the page loaded, no specific text check
  });

  test('API products endpoint returns data', async ({ request }) => {
    const response = await request.get('/api/products');
    expect(response.ok()).toBeTruthy();
    const products = await response.json();
    expect(Array.isArray(products)).toBeTruthy();
  });
});
