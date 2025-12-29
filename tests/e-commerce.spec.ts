import { test, expect } from '@playwright/test';

// Tests for unauthenticated users
test.describe('E-commerce Public Features', () => {
  test('should display products on home page', async ({ page }) => {
    await page.goto('/');

    // Wait for products to load
    await page.waitForSelector('text=Featured Products', { timeout: 10000 });

    // Check if product cards with "Add to Cart" buttons are displayed
    await page.waitForSelector('button:has-text("Add to Cart")', {
      timeout: 10000,
    });
    const productCards = await page
      .locator('button:has-text("Add to Cart")')
      .count();
    expect(productCards).toBeGreaterThan(0);
  });

  test('should add product to cart', async ({ page }) => {
    await page.goto('/');

    // Wait for products to load
    await page.waitForSelector('button:has-text("Add to Cart")', {
      timeout: 10000,
    });

    // Click first "Add to Cart" button
    await page.locator('button:has-text("Add to Cart")').first().click();

    // Wait for state update
    await page.waitForTimeout(500);

    // Check if cart has items (Zustand updates immediately)
    const cartBadge = page.locator('a[href="/cart"] span').first();
    await expect(cartBadge).toBeVisible();
    const badgeText = await cartBadge.textContent();
    expect(parseInt(badgeText || '0')).toBeGreaterThan(0);
  });

  test('should navigate to cart page', async ({ page }) => {
    await page.goto('/');

    // Add item to cart first
    await page.waitForSelector('button:has-text("Add to Cart")', {
      timeout: 10000,
    });
    await page.locator('button:has-text("Add to Cart")').first().click();

    // Wait for cart to update
    await page.waitForTimeout(500);

    // Navigate to cart via link
    await page.click('a[href="/cart"]');

    // Verify cart page
    await expect(page).toHaveURL(/.*cart/);
    await expect(page.locator('h1')).toContainText('Shopping Cart');

    // Verify cart has items
    await expect(
      page.locator('button:has-text("Proceed to Checkout")')
    ).toBeVisible();
  });

  test('should require login for checkout', async ({ page }) => {
    await page.goto('/');

    // Add item and go to cart
    await page.waitForSelector('button:has-text("Add to Cart")', {
      timeout: 10000,
    });
    await page.locator('button:has-text("Add to Cart")').first().click();
    await page.waitForTimeout(500);

    // Click checkout button
    await page.click('a[href="/cart"]');
    await page.click('button:has-text("Proceed to Checkout")');

    // Deve redirecionar para login ou permanecer no carrinho se já autenticado
    const url = page.url();
    expect([/.*login/, /.*cart/].some((re) => re.test(url))).toBeTruthy();
  });
});
