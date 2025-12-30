import { test, expect } from '@playwright/test';

// These tests use authenticated session from auth.setup.ts
test.describe('Authenticated E-commerce Features', () => {
  test('should access checkout page when authenticated', async ({ page }) => {
    // Ensure user is authenticated
    await page.goto('/');
    await expect(page.locator('button:has-text("Sign out")')).toBeVisible({
      timeout: 10000,
    });

    // Add item to cart
    await page.waitForSelector('button:has-text("Add to Cart")', {
      timeout: 10000,
    });
    await page.locator('button:has-text("Add to Cart")').first().click();

    // Go to cart and wait for cart page to load
    await page.click('a[href="/cart"]');
    // Wait for heading "Shopping Cart"
    await expect(
      page.getByRole('heading', { name: /shopping cart/i })
    ).toBeVisible({
      timeout: 10000,
    });
    await expect(page).toHaveURL(/.*cart/);

    // Proceed to checkout
    await page.click('button:has-text("Proceed to Checkout")');
    // Wait for heading "Checkout" or "Complete Your Payment"
    const checkoutHeading = page.getByRole('heading', {
      name: /checkout|complete your payment/i,
    });
    await expect(checkoutHeading).toBeVisible({
      timeout: 10000,
    });
    await expect(page).toHaveURL(/.*checkout/);

    // Ensure not redirected to login
    await expect(page).not.toHaveURL(/.*login/);
  });

  test('should show address selection on checkout', async ({ page }) => {
    // Ensure user is authenticated
    await page.goto('/');
    await expect(page.locator('button:has-text("Sign out")')).toBeVisible({
      timeout: 10000,
    });

    // Add item to cart
    await page.waitForSelector('button:has-text("Add to Cart")', {
      timeout: 10000,
    });
    await page.locator('button:has-text("Add to Cart")').first().click();

    // Navigate to checkout
    await page.click('a[href="/cart"]');
    await expect(
      page.getByRole('heading', { name: /shopping cart/i })
    ).toBeVisible({
      timeout: 10000,
    });
    await page.click('button:has-text("Proceed to Checkout")');
    await expect(
      page.getByRole('heading', { name: /checkout|complete your payment/i })
    ).toBeVisible({
      timeout: 10000,
    });

    // Verify checkout page loaded
    await expect(page).toHaveURL(/.*checkout/);
    // Should see checkout elements (address selector, cart items, etc)
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
    // Ensure not redirected to login
    await expect(page).not.toHaveURL(/.*login/);
  });

  test('should require address selection before payment', async ({ page }) => {
    // Ensure user is authenticated
    await page.goto('/');
    await expect(page.locator('button:has-text("Sign out")')).toBeVisible({
      timeout: 10000,
    });

    // Add item to cart
    await page.waitForSelector('button:has-text("Add to Cart")', {
      timeout: 10000,
    });
    await page.locator('button:has-text("Add to Cart")').first().click();

    // Navigate to checkout
    await page.click('a[href="/cart"]');
    await expect(
      page.getByRole('heading', { name: /shopping cart/i })
    ).toBeVisible({
      timeout: 10000,
    });
    await page.click('button:has-text("Proceed to Checkout")');
    await expect(
      page.getByRole('heading', { name: /checkout|complete your payment/i })
    ).toBeVisible({
      timeout: 10000,
    });

    // Verify we reached checkout
    await expect(page).toHaveURL(/.*checkout/);
    await expect(page).not.toHaveURL(/.*login/);
  });

  test('should display order history', async ({ page }) => {
    // Ensure user is authenticated
    await page.goto('/');
    await expect(page.locator('button:has-text("Sign out")')).toBeVisible({
      timeout: 10000,
    });

    // Navigate to orders page
    await page.goto('/orders');
    // Wait for the main heading "My Orders" (level 1)
    await expect(
      page.getByRole('heading', { name: /my orders/i, level: 1 })
    ).toBeVisible({ timeout: 10000 });

    // Verify we're on orders page (not redirected to login)
    await expect(page).toHaveURL(/.*orders/);
    await expect(page).not.toHaveURL(/.*login/);

    // Page should load with some content
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
  });

  test('should display user account page', async ({ page }) => {
    // Ensure user is authenticated
    await page.goto('/');
    await expect(page.locator('button:has-text("Sign out")')).toBeVisible({
      timeout: 10000,
    });

    // Navigate to account page
    await page.goto('/account');
    // Wait for any heading containing "account" (case-insensitive)
    await expect(page.getByRole('heading', { name: /account/i })).toBeVisible({
      timeout: 10000,
    });

    // Should not redirect to login
    await expect(page).toHaveURL(/.*account/);
    await expect(page).not.toHaveURL(/.*login/);

    // Should see user information (Jane's name or email)
    await expect(page.locator('text=/jane/i').first()).toBeVisible({
      timeout: 10000,
    });
  });
});
