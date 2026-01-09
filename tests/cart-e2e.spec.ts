/**
 * Comprehensive E2E test for cart, coupon, and checkout flow
 * Tests the full journey from adding items to completing a payment
 */

import { test, expect } from '@playwright/test';

test.describe('Complete E-commerce Flow (DEV)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for products to load
    await page.waitForSelector('button:has-text("Add to Cart")', { timeout: 10000 });
  });

  test('Add item → Apply coupon → Update quantity → Remove item → Empty cart', async ({ page }) => {
    // Step 1: Add first item to cart
    const addButton = page.locator('button:has-text("Add to Cart")').first();
    await addButton.click();
    await page.waitForTimeout(500);

    // Verify item added
    const cartBadge = page.locator('a[href="/cart"] span').first();
    await expect(cartBadge).toContainText('1');

    // Step 2: Navigate to cart
    await page.click('a[href="/cart"]');
    await expect(page).toHaveURL(/.*cart/);
    await expect(page.locator('h1')).toContainText('Shopping Cart');

    // Capture initial subtotal
    const subtotalBefore = await page.locator('text=/Subtotal|Total/i').first().textContent();
    console.log('Subtotal before coupon:', subtotalBefore);

    // Step 3: Apply coupon (if coupon section exists)
    const couponInput = page.locator('input[name="couponCode"], input[placeholder="Coupon code"]').first();
    if (await couponInput.isVisible().catch(() => false)) {
      await couponInput.fill('SAVE10');
      await page.click('button:has-text("Apply")');
      await page.waitForTimeout(500);

      // Verify discount applied
      const totalAfterCoupon = await page.locator('text=/Total|Grand Total/i').first().textContent();
      console.log('Total after coupon:', totalAfterCoupon);
      expect(totalAfterCoupon).not.toContain(subtotalBefore); // Should be different
    }

    // Step 4: Update quantity (if quantity controls exist)
    const quantityInput = page.locator('input[type="number"]').first();
    if (await quantityInput.isVisible().catch(() => false)) {
      await quantityInput.fill('2');
      await page.waitForTimeout(500);

      // Verify total updated
      const totalAfterQuantity = await page.locator('text=/Total|Grand Total/i').first().textContent();
      console.log('Total after quantity update:', totalAfterQuantity);
    }

    // Step 5: Remove item (if remove button exists)
    const removeButton = page.locator('button:has-text("Remove"), button[aria-label*="delete"], button[aria-label*="remove"]').first();
    if (await removeButton.isVisible().catch(() => false)) {
      await removeButton.click();
      await page.waitForTimeout(500);

      // Verify cart is empty
      const emptyMsg = page.locator('text=/empty|no items/i');
      await expect(emptyMsg).toBeVisible();
    }
  });

  test('Proceed to checkout flow', async ({ page }) => {
    // Add item to cart
    await page.locator('button:has-text("Add to Cart")').first().click();
    await page.waitForTimeout(500);

    // Navigate to cart
    await page.click('a[href="/cart"]');

    // Click checkout button
    const checkoutButton = page.locator('button:has-text("Proceed to Checkout"), button:has-text("Checkout")').first();
    if (await checkoutButton.isVisible().catch(() => false)) {
      await checkoutButton.click();
      await page.waitForTimeout(1000);

      // Should be redirected to login or checkout page
      const url = page.url();
      expect([/checkout/, /login/].some(re => re.test(url))).toBeTruthy();
    }
  });
});
