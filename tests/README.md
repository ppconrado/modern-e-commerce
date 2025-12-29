# Testing Guide

## Overview

Comprehensive testing guide for the e-commerce application, including automated E2E tests with Playwright and manual testing checklists for all features.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Automated Tests (Playwright)](#automated-tests-playwright)
- [Manual Testing Checklists](#manual-testing-checklists)
  - [Authentication Testing](#authentication-testing)
  - [E2E Flow Testing](#e2e-flow-testing)
- [Test Credentials](#test-credentials)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### 1. Install Playwright Browsers

```bash
npx playwright install
```

### 2. Database Setup

Ensure database is seeded with products and test users:

```bash
# Run migrations
npm run db:migrate

# Seed database with products and test users
npm run db:seed
```

### 3. Environment Variables

Ensure `.env.local` has all required variables:

```env
DATABASE_URL="your-database-url"
AUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
STRIPE_SECRET_KEY="your-stripe-secret"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="your-stripe-publishable"
```

---

## Automated Tests (Playwright)

## Running Tests

### Run all tests

```bash
npm run test
```

### Run tests in UI mode (recommended for development)

```bash
npx playwright test --ui
```

### Run specific test file

```bash
npx playwright test tests/e-commerce.spec.ts
```

### Run tests in headed mode (see browser)

```bash
npx playwright test --headed
```

### Run tests in specific browser

```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## Test Coverage

### Unauthenticated User Tests

- ✅ Display products on home page
- ✅ Add product to cart (Zustand store)
- ✅ Navigate to cart page
- ✅ Require login for checkout

### Authenticated User Tests

- ✅ Access checkout page when authenticated
- ✅ Show address selection on checkout
- ✅ Require address selection before payment
- ✅ Display order history

## Test Configuration

Tests are configured in `playwright.config.ts`. Default settings:

- Browsers: Chromium, Firefox, WebKit
- Base URL: http://localhost:3000
- Timeout: 30 seconds per test
- Retries: 2 (on CI)

## Test Structure

```typescript
test.describe('Test Suite', () => {
  test('test name', async ({ page }) => {
    // Test implementation
  });

  test.describe('Nested suite', () => {
    test.beforeEach(async ({ page }) => {
      // Setup before each test
    });

    test('another test', async ({ page }) => {
      // Test implementation
    });
  });
});
```

## Troubleshooting

### Tests fail with "Executable doesn't exist"

**Solution:** Install Playwright browsers

```bash
npx playwright install
```

### Tests fail with timeout

**Solution:** Increase timeout or ensure dev server is running

```bash
# In playwright.config.ts, increase timeout
timeout: 60000 // 60 seconds
```

### Tests fail at login

**Solution:** Ensure test user exists in database

- Email: `test@example.com`
- Password: `password123`

### Tests fail on checkout

**Solution:**

1. Ensure you're logged in
2. Ensure cart has items
3. Ensure database has products
4. Check that application is running on http://localhost:3000

## Best Practices

1. **Always start fresh:** Tests clear cookies before authentication tests
2. **Wait for elements:** Use `waitForSelector` for dynamic content
3. **Use descriptive selectors:** Prefer text content over CSS classes
4. **Test user flows:** Test complete scenarios, not just individual actions
5. **Isolate tests:** Each test should be independent

## CI/CD Integration

Tests can run in CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Install dependencies
  run: npm ci

- name: Install Playwright Browsers
  run: npx playwright install --with-deps

- name: Run tests
  run: npm run test
```

## Updating Tests

When updating the application:

1. Update test selectors if UI changes
2. Add new tests for new features
3. Update test credentials if authentication changes
4. Run tests locally before committing

## Test Reports

View test results:

```bash
npx playwright show-report
```

This opens an HTML report with:

- Test results
- Screenshots on failure
- Video recordings (if enabled)
- Error traces

## Debugging Tests

### Debug mode

```bash
npx playwright test --debug
```

### Generate code

Record user actions and generate test code:

```bash
npx playwright codegen http://localhost:3000
```

---

## Manual Testing Checklists

### Authentication Testing

Comprehensive manual testing checklist for authentication features.

#### 1. Registration Flow

- [ ] Navigate to /register
- [ ] Fill form with new user data
- [ ] Submit form
- [ ] Verify redirect to /login
- [ ] Login with new credentials
- [ ] Verify user is logged in (name shows in header)
- [ ] Verify user role is CUSTOMER (no Admin link visible)

#### 2. Login Flow - Admin

- [ ] Navigate to /login
- [ ] Enter email: john@example.com
- [ ] Enter password: password123
- [ ] Submit form
- [ ] Verify redirect to homepage
- [ ] Verify "John Doe" appears in header
- [ ] Verify "Admin" link appears in header
- [ ] Verify "Sign out" button appears

#### 3. Login Flow - Regular User

- [ ] Navigate to /login
- [ ] Enter email: jane@example.com
- [ ] Enter password: password123
- [ ] Submit form
- [ ] Verify redirect to homepage
- [ ] Verify "Jane Doe" appears in header
- [ ] Verify NO "Admin" link in header
- [ ] Verify "Sign out" button appears

#### 4. Admin Access Protection - Not Logged In

- [ ] Ensure you are logged out
- [ ] Navigate to /admin directly
- [ ] Verify redirect to /login
- [ ] Login as admin
- [ ] Verify redirect back to /admin

#### 5. Admin Access Protection - Regular User

- [ ] Login as jane@example.com (CUSTOMER)
- [ ] Try to navigate to /admin
- [ ] Verify redirect to homepage (/)
- [ ] Verify cannot access admin panel

#### 6. Admin Access - Admin User

- [ ] Login as john@example.com (ADMIN)
- [ ] Click "Admin" link in header
- [ ] Verify admin dashboard loads
- [ ] Verify can see product management table
- [ ] Verify can create new products
- [ ] Verify can edit products
- [ ] Verify can delete products

#### 7. Logout Flow

- [ ] While logged in, click "Sign out"
- [ ] Verify redirect to homepage
- [ ] Verify header shows "Sign in" and "Sign up" buttons
- [ ] Verify "Admin" link removed (if was admin)
- [ ] Verify user name removed from header
- [ ] Try to access /admin
- [ ] Verify redirect to /login

#### 8. Error Handling - Login

- [ ] Navigate to /login
- [ ] Enter invalid email
- [ ] Enter any password
- [ ] Submit form
- [ ] Verify error message: "Invalid email or password"
- [ ] Verify not logged in

#### 9. Error Handling - Registration

- [ ] Navigate to /register
- [ ] Enter existing email (e.g., john@example.com)
- [ ] Fill other fields
- [ ] Submit form
- [ ] Verify error message: "User already exists"
- [ ] Verify user not created

#### 10. Session Persistence

- [ ] Login as any user
- [ ] Navigate to different pages
- [ ] Verify session persists (user stays logged in)
- [ ] Refresh page
- [ ] Verify still logged in
- [ ] Close and reopen browser
- [ ] Verify session persists (depends on browser settings)

### E2E Flow Testing

Complete checkout and payment flow testing.

#### 1. Product Browsing (Unauthenticated)

- [ ] Visit homepage
- [ ] Verify products are displayed
- [ ] Verify product images load
- [ ] Verify product prices show correctly
- [ ] Verify "Add to Cart" buttons work

#### 2. Cart Management (Unauthenticated)

- [ ] Add product to cart
- [ ] Verify cart badge updates in header
- [ ] Navigate to cart page
- [ ] Verify cart items display correctly
- [ ] Update quantities
- [ ] Remove items
- [ ] Verify total calculation is correct

#### 3. Checkout Flow (Authenticated)

- [ ] Try to access /checkout while logged out
- [ ] Verify redirect to /login
- [ ] Login as test user
- [ ] Navigate to cart with items
- [ ] Click "Proceed to Checkout"
- [ ] Verify redirect to /checkout
- [ ] Verify cart items display
- [ ] Verify total shows correctly (NOT $0.00)

#### 4. Address Selection

- [ ] Verify address dropdown is visible
- [ ] Select an address from dropdown
- [ ] Verify "Continue to Payment" button becomes enabled
- [ ] Verify shipping info updates

#### 5. Payment Processing

- [ ] Click "Continue to Payment"
- [ ] Verify Stripe Elements form loads
- [ ] Enter test card: 4242 4242 4242 4242
- [ ] Enter expiry: any future date (e.g., 12/25)
- [ ] Enter CVC: any 3 digits (e.g., 123)
- [ ] Click "Pay" button
- [ ] Verify processing state shows
- [ ] Verify redirect to /checkout/success

#### 6. Order Confirmation

- [ ] Verify success page shows
- [ ] Verify order details display
- [ ] Verify payment intent ID is shown
- [ ] Navigate to /orders
- [ ] Verify new order appears in order history
- [ ] Verify cart is empty after successful checkout

#### 7. Order History

- [ ] Navigate to /orders
- [ ] Verify all past orders display
- [ ] Verify order details (items, total, date)
- [ ] Verify order status

---

## Test Credentials

### Automated Tests

**Test User** (for Playwright tests)

- **Email:** test@example.com
- **Password:** password123
- **Role:** CUSTOMER

### Manual Testing

**Admin Account**

- **Email:** john@example.com
- **Password:** password123
- **Role:** ADMIN
- **Access:** Full admin panel

**Customer Account 1**

- **Email:** jane@example.com
- **Password:** password123
- **Role:** CUSTOMER
- **Access:** No admin panel

**Customer Account 2**

- **Email:** ppconrado@yahoo.com.br
- **Password:** password123
- **Role:** CUSTOMER
- **Access:** No admin panel

### Stripe Test Cards

**Successful Payment**

- Card: 4242 4242 4242 4242
- Expiry: Any future date
- CVC: Any 3 digits

**Declined Payment**

- Card: 4000 0000 0000 0002
- Expiry: Any future date
- CVC: Any 3 digits

**Requires Authentication**

- Card: 4000 0025 0000 3155
- Expiry: Any future date
- CVC: Any 3 digits

---

## Expected Behavior

### Header States

**Logged Out**

```
ShopHub | Products | [Sign in] [Sign up] [Cart (0)]
```

**Logged In - Customer**

```
ShopHub | Products | 👤 Jane Doe [Sign out] [Cart (2)]
```

**Logged In - Admin**

```
ShopHub | Products | Admin | 👤 John Doe [Sign out] [Cart (1)]
```

### Cart State (Zustand)

Cart data is stored in Zustand with localStorage persistence:

- **Key:** `cart-storage`
- **Location:** localStorage
- **Format:** JSON with items array and total

### Order Creation

**Development Environment**

- Orders created via `/api/test-create-order`
- Called from success page after payment

**Production Environment**

- Orders created via Stripe webhook
- Triggered on `payment_intent.succeeded` event

---

## Success Criteria

✅ All automated Playwright tests pass  
✅ All manual test scenarios complete successfully  
✅ No TypeScript errors  
✅ No console errors  
✅ Proper redirects working  
✅ Role-based access control functioning  
✅ Session management working  
✅ Cart persistence with Zustand  
✅ Stripe payment integration working  
✅ Order creation successful  
✅ Stock updates after orders  
✅ Error messages displayed correctly  
✅ UI updates based on auth state

---

## Known Limitations

**Authentication**

- No email verification
- No password reset functionality
- No rate limiting on login attempts
- No 2FA
- No account lockout after failed attempts

**Payment**

- Development uses test-create-order endpoint (should be disabled in production)
- Webhook signature verification required for production
- No payment retry mechanism
- No refund handling

**General**

- Webhook testing requires ngrok or similar for local development
- Session secret should be changed for production
- Error tracking/logging not implemented

---

## CI/CD Integration

Tests can run in CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright Browsers
        run: npx playwright install --with-deps

      - name: Run tests
        run: npm run test

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
