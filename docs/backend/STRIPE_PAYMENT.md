# Stripe Payment Integration

## Overview

This project uses **Stripe Payment Intents with Elements** for secure payment processing. Stripe handles all sensitive payment information, PCI compliance, and provides an embedded payment form experience.

## Features Implemented

### 1. Secure Payment Processing

- ✅ Stripe Payment Intents integration (embedded payment form)
- ✅ Stripe Elements for customizable payment UI
- ✅ Support for all major credit/debit cards
- ✅ PCI DSS compliant (no card data touches our servers)
- ✅ 256-bit SSL encryption
- ✅ Real-time payment confirmation via webhooks
- ✅ Automatic payment methods (Apple Pay, Google Pay when available)

### 2. Order Management

- ✅ Payment status tracking (PENDING, PROCESSING, PAID, FAILED, REFUNDED)
- ✅ Order status tracking (PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED)
- ✅ Stripe Payment Intent ID storage
- ✅ Automatic order creation via webhook after successful payment
- ✅ Stock management (automatic decrement on order creation)
- ✅ Development endpoint for order creation (when webhooks not available)

### 3. User Experience

- ✅ Embedded payment form on checkout page (no redirect)
- ✅ Address management (save multiple addresses)
- ✅ Order summary with cart items
- ✅ Success page after payment
- ✅ Automatic cart clearing (Zustand store integration)
- ✅ Dynamic return URL (works in any environment)
- ✅ Order history page

## Setup Instructions

### 1. Get Stripe API Keys

1. Create a Stripe account at [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Go to [Developers → API keys](https://dashboard.stripe.com/test/apikeys)
3. Copy your test keys:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`)

### 2. Configure Environment Variables

Add to your `.env` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key_here"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key_here"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret_here"

# Note: NEXT_PUBLIC_ prefix makes the key available to the browser (safe for publishable key only)
```

### 3. Set Up Stripe Webhooks (Development)

#### Option A: Using Stripe CLI (Recommended)

1. **Install Stripe CLI:**

   ```bash
   # Windows (with Scoop)
   scoop install stripe

   # macOS (with Homebrew)
   brew install stripe/stripe-cli/stripe

   # Or download from: https://github.com/stripe/stripe-cli/releases
   ```

2. **Login to Stripe:**

   ```bash
   stripe login
   ```

3. **Forward webhooks to localhost:**

   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

4. **Copy the webhook signing secret** (starts with `whsec_`) and add to `.env`:
   ```env
   STRIPE_WEBHOOK_SECRET="whsec_..."
   ```

#### Option B: Using ngrok (Alternative)

1. Install ngrok: https://ngrok.com/download
2. Start ngrok:
   ```bash
   ngrok http 3000
   ```
3. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
4. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/test/webhooks)
5. Click "Add endpoint"
6. Enter: `https://abc123.ngrok.io/api/webhooks/stripe`
7. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - (Legacy support: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`)
   - `charge.refunded`
8. Copy the webhook signing secret to `.env`

### 4. Test Stripe Integration

Use Stripe's test card numbers:

#### Successful Payment

- **Card:** `4242 4242 4242 4242`
- **Expiry:** Any future date (e.g., `12/34`)
- **CVC:** Any 3 digits (e.g., `123`)
- **ZIP:** Any 5 digits (e.g., `12345`)

#### Declined Payment

- **Card:** `4000 0000 0000 0002`
- **Expiry:** Any future date
- **CVC:** Any 3 digits
- **ZIP:** Any 5 digits

More test cards: https://stripe.com/docs/testing

## How It Works

### Payment Flow

```
1. User adds products to cart (Zustand store)
   ↓
2. User goes to /cart and clicks "Proceed to Checkout"
   ↓
3. User selects/adds shipping address on /checkout
   ↓
4. User clicks "Proceed to Payment"
   ↓
5. Server creates Payment Intent with order metadata
   ↓
6. Payment form appears on same page (Stripe Elements)
   ↓
7. User enters card details in embedded form
   ↓
8. User clicks "Complete Order"
   ↓
9. Stripe processes payment
   ↓
10. User redirected to /checkout/success
    ↓
11. Development: Order created via /api/test-create-order
    Production: Stripe webhook creates order automatically
    ↓
12. Order saved (status: PROCESSING, paymentStatus: PAID)
    ↓
13. Product stock decremented
    ↓
14. Cart cleared (Zustand)
    ↓
15. User can view order in /orders
```

### Development vs Production

#### Development (localhost)

- Stripe webhooks cannot reach localhost directly
- Uses `/api/test-create-order` endpoint
- Order data saved in sessionStorage during checkout
- Order created on success page using saved data

#### Production (deployed)

- Stripe webhooks POST directly to `/api/webhooks/stripe`
- OrdersPaymentIntentId String? @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  User User @relation(fields: [userId], references: [id])
  OrderItem OrderItem[]
  }

````

**Note:** `stripeSessionId` removed - now using Payment Intents only
```prisma
model Order {
  id                    String        @id
  userId                String
  status                OrderStatus   @default(PENDING)
  paymentStatus         PaymentStatus @default(PENDING)
  total                 Float
  address               String
  city                  String
  zipCode               String
  paymentMethod         String
  stripeSessionId       String?       @unique
  stripePaymentIntentId String?       @unique
  createdAt             DateTime      @default(now())
  updatedAt             DateTime
  User                  User          @relation(fields: [userId], references: [id])
  OrderItem      Payment Intent.

**Authentication:** Required (NextAuth session)

**Request:**

```json
{
  "items": [
    {
      "id": "product_id",
      "name": "Product Name",
      "price": 29.99,
      "image": "https://...",
      "quantity": 2
    }
  ],
  "shippingInfo": {
    "address": "123 Main St",
    "city": "New York",
    "zipCode": "10001",
    "phone": "+1234567890"
  }
}
````

**Response:**

```json
{
  "clientSecret": "pi_xxx_secret_yyy"
}
```

**Process:**

1. Validates user authentication
2. Validates cart items and shipping info
3. Fetches products from database (server-side price verification)
4. Creates Payment Intent with metadata:
   - `userId`, `userEmail`
   - `items` (JSON string of product IDs and quantities)
   - `shippingAddress`, `shippingCity`, `shippingZipCode`, `shippingPhone`
5. Returns `clientSecret` for Stripe Elements

### POST /api/test-create-order

**⚠️ Development only** - Creates orders when webhooks are not available.

**Authentication:** Required (NextAuth session)

**Request:**

```json
{
  "paymentIntentId": "pi_xxx",
  "items": [...],
  "shippingInfo": {...},
  "total": 59.98
}
```

**Response:**

```json
{
  "order": { ... },
  "supayment_intent.succeeded** (Primary)

   - Creates new Order in database
   - Sets: `paymentStatus = PAID`, `status = PROCESSING`
   - Stores `stripePaymentIntentId`
   - Creates OrderItems from metadata
   - Decrements product stock

2. **payment_intent.payment_failed**

   - Logs payment failure
   - No order created

3. **checkout.session.completed** (Legacy support)

   - Updates existing order: `paymentStatus = PAID`, `status = PROCESSING`
   - Stores `stripePaymentIntentId`

4. **checkout.session.async_payment_succeeded** (Legacy)

   - Updates order: `paymentStatus = PAID`, `status = PROCESSING`

5. **checkout.session.async_payment_failed** (Legacy)
Payment Intent
│   │   ├── test-create-order/
│   │   │   └── route.ts              # Dev-only: create orders without webhooks
│   │   └── webhooks/
│   │       └── stripe/
│   │           └── route.ts          # Handle Stripe webhooks
│   ├── checkout/
│   │   ├── page.tsx                  # Checkout page with Stripe Elements
│   │   └── success/
│   │       └── page.tsx              # Success page (clears cart, creates order in dev)
│   ├── cart/
│   │   └── page.tsx                  # Shopping cart
│   └── orders/
│       └── page.tsx                  # Order history
├── store/
│   └── cart.ts                       # Zustand cart store with persistence
└── lib/
    └── stripe.ts                     # Stripe client initialization
```

**Removed:**

- ❌ `src/componenafter successful payment (prevents failed orders)
- Payment Intent metadata prevents lost orders
- Dynamic return URLs (no hardcoded localhost)
- Zustand store for cart (persistent across page reloads)
- SessionStorage for order data (temporary, cleared after success)

5. Updates Order with stripeSessionId
6. Returns Stripe checkout URL

### POST /api/webhooks/stripe

Handles Stripe webhook events.

**Authentication:** Stripe signature verification

**Events Handled:**

1. **checkout.session.completed**

   - Updates order: `paymentStatus = PAID`, `status = PROCESSING`
   - Stores `stripePaymentIntentId`

2. **checkout.session.async_payment_succeeded**

   - Updates order: `paymentStatus = PAID`, `status = PROCESSING`

3. **checkout.session.async_payment_failed**

   - Updates order: `paymentStatus = FAILED`, `status = CANCELLED`

   - Consider using Resend, SendGrid, or similar

4. **Implement Refund Handling**

   - Admin interface for refunds (already handles refund webhooks)
   - Automatic inventory restocking on refunds
   - Customer notification system

5. **Disable Development Endpoint**
   - Remove or restrict `/api/test-create-order` in production
   - Add environment check: `if (process.env.NODE_ENV === 'production') return 403`
     src/
     ├── app/
     │ ├── api/
     │ │ ├── checkout/
     │ │ │ └── route.ts # Create Stripe checkout session
     │ │ └── webhooks/
     │ │ View cart with correct totals

- [ ] Click "Proceed to Checkout"
- [ ] Select or add shipping address
- [ ] Click "Proceed to Payment"
- [ ] See embedded Stripe payment form (no redirect)
- [ ] Enter test card: `4242 4242 4242 4242`
- [ ] Click "Complete Order"
- [ ] See payment processing state
- [ ] Redirected to success page
- [ ] Order created and visible in /orders
- [ ] Order shows PAID and PROCESSING status
- [ ] Cart is cleared (Zustand store)
- [ ] Product stock decrement # Stripe client initialization

```
 (should redirect to home)
- [ ] Test with invalid shipping info
- [ ] Test payment form without Stripe Elements loaded
- [ ] Test with incomplete card information
### ✅ Implemented

- Stripe handles all card data (PCI compliant)
- Webhook signature verification
- Server-side price calculation (prevents client manipulation)
- Authentication required for checkout
- Order creation before payment (prevents lost orders)
- Unique session IDs prevent duplicate charges

### 🔒 Production Recommendations

1. **Use Production API Keys**

   - Replace test keys with live keys from Stripe Dashboard
   - Never commit API keys to git
   - Use environment variables

2. **Configure Webhook Endpoints**

   - Set up production webhook endpoint in Stripe Dashboard
   - Use HTTPS only
   - Configure proper event filtering

3. **Enable Fraud Prevention**

   - Use Stripe Radar (included free)
   - Enable 3D Secure for EU cards (SCA compliance)
   - Set up email notifications for suspicious activity

4. **Add Email Notifications**

   - Send order confirmation emails
   - Send shipping notifications
   - Send refund notifications

5. **Implement Refund Handling**
created after payment
- [ ] Check webhook logs in Stripe Dashboard
- [ ] Test duplicate webhook delivery (idempotency)
- [ ] In dev: verify /api/test-create-order creates order
- [ ] In dev: verify sessionStorage is cleared after success
   - Customer notification system

6. **Add Error Handling**
   - Retry logic for failed webhooks
   - Dead letter queue for failed events
   - Monitoring and alerting

## Testing Checklist

### Basic Flow

- [ ] Add products to cart
- [ ] Click "Proceed to Checkout"
- [ ] Fill shipping address
- [ ] Click "Proceed to Payment"
- [ ] Redirected to Stripe
- [ ] Enter test card: `4242 4242 4242 4242`
- [ ] Complete paymentcreated

**Solution:**

**In Development:**
1. Check browser console for errors from /api/test-create-order
2. Verify sessionStorage has 'pendingOrder' data
3. Check success page is calling the API
4. Verify user is authenticated

**In Production:**
1. Check webhook is being received (Stripe CLI logs or Dashboard)
2. Check server logs for errors
3. Verify database connection
4. Test webhook endpoint manually with Stripe test events
5. Ensure Payment Intent metadata contains all required fields

### Issue: "Missing required fields" on test-create-order

**Solution:** Verify sessionStorage contains order data. This is set during checkout when clicking "Proceed to Payment".
- [ ] Test without authentication (should redirect to login)
- [ ] Test with empty cart
- [ ] Test with invalid shipping info
- [ ] Cancel payment on Stripe page (should return to cart)
This should not happen anymore - payment form is embedded on checkout page. If you see a redirect, check that you're using Payment Intents, not Checkout Sessions.

### Issue: Cart not clearing after payment

**Solution:**
1. Verify Zustand store is imported in success page
2. Check `clearCart()` is being called
3. Check browser localStorage for `cart-storage` key
4. Hard refresh page (Ctrl+F5) to reload store
### Webhook Testing

- [ ] Test webhook with Stripe CLI
- [ ] Verify order updates after payment
- [ ] Check webhook logs in Stripe Dashboard
- [ ] Test duplicate webhook delivery (idempotency)

## Common Issues & Solutions

### Issue: "STRIPE_SECRET_KEY is not set"

**Solution:** Add Stripe keys to `.env` file and restart dev server

### Issue: Webhook not receiving events

**Solution:**

1. Ensure Stripe CLI is running: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
2. Check STRIPE_WEBHOOK_SECRET matches the CLI output
3. Restart dev server after adding webhook secret
Production Ready
**Architecture:** Payment Intents + Stripe Elements
**Cart:** Zustand with persistence
**Development:** Test endpoint for order creation
**Production:** Webhook-based order creation

## Recent Updates (December 2025)

### Migration from Checkout Sessions to Payment Intents

**Why the change:**
- Better control over payment flow
- Embedded payment form (better UX, no redirect)
- More customization options
- Same security and compliance

**What changed:**
- Removed Stripe Checkout Sessions
- Added Stripe Elements for embedded payment form
- Changed from redirect-based to embedded payment flow
- Added development endpoint for testing without webhooks
- Integrated Zustand for cart state management
- Removed duplicate checkout form component

**Migration steps for existing projects:**
1. Update dependencies: `@stripe/react-stripe-js`, `@stripe/stripe-js`
2. Update `/api/checkout` to create Payment Intents
3. Update checkout page to use Stripe Elements
4. Update webhook to handle `payment_intent.succeeded`
5. Test thoroughly with test cards

## Additional Resources

- [Stripe Payment Intents Documentation](https://stripe.com/docs/payments/payment-intents)
- [Stripe Elements Documentation](https://stripe.com/docs/stripe-js

**Solution:**

1. Check webhook is being received (Stripe CLI logs)
2. Check server logs for errors
3. Verify database connection
4. Test webhook endpoint manually with Stripe test events

### Issue: Redirecting to Stripe but getting 404

**Solution:** Stripe checkout session expired or invalid. Check that session was created successfully and URL is correct.

## Next Steps

1. **Test Complete Flow**

   - Test with Stripe test cards
   - Verify webhooks are working
   - Check order creation and updates

2. **Add Order History Page**

   - Create `/orders` route
   - Show payment status
   - Show order details

3. **Admin Dashboard**

   - View all orders
   - Process refunds
   - Track payment analytics

4. **Production Deployment**
   - Switch to live Stripe keys
   - Configure production webhooks
   - Set up monitoring

---

**Status:** ✅ Feature #2 Complete - Ready for testing
**Next Feature:** Image Upload & Product Management

## Additional Resources

- [Stripe Checkout Documentation](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Test Cards](https://stripe.com/docs/testing)
- [Stripe Dashboard](https://dashboard.stripe.com/)
```
