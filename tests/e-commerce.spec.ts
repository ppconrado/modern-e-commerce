import { test, expect } from '@playwright/test';

test.describe('E-commerce MVP', () => {
  test('should display products on home page', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Wait for products to load
    await page.waitForSelector('text=Featured Products');

    // Check if product cards are displayed
    const productCards = await page.locator('[class*="card"]').count();
    expect(productCards).toBeGreaterThan(0);
  });

  test('should add product to cart', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Wait for products to load
    await page.waitForSelector('button:has-text("Add to Cart")');

    // Click first "Add to Cart" button
    await page.locator('button:has-text("Add to Cart")').first().click();

    // Check cart badge updates
    const cartBadge = page.locator('span').filter({ hasText: /^\d+$/ }).first();
    await expect(cartBadge).toBeVisible();
  });

  test('should navigate to cart page', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Add item to cart first
    await page.waitForSelector('button:has-text("Add to Cart")');
    await page.locator('button:has-text("Add to Cart")').first().click();

    // Navigate to cart
    await page.click('[class*="ShoppingCart"]');

    // Verify cart page
    await expect(page).toHaveURL(/.*cart/);
    await expect(page.locator('h1')).toContainText('Shopping Cart');
  });

  test('should validate checkout form', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Add item and go to cart
    await page.waitForSelector('button:has-text("Add to Cart")');
    await page.locator('button:has-text("Add to Cart")').first().click();
    await page.click('[class*="ShoppingCart"]');

    // Click checkout button
    await page.click('button:has-text("Proceed to Checkout")');

    // Try to submit empty form
    await page.click('button:has-text("Complete Purchase")');

    // Check for validation errors
    await expect(page.locator('text=Invalid email')).toBeVisible();
  });
});
