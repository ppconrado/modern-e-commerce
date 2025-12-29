# Stripe Payment Integration

## Overview

This project uses **Stripe Checkout** for secure payment processing. Stripe handles all sensitive payment information, PCI compliance, and provides a professional checkout experience.

## Features Implemented

### 1. Secure Payment Processing

- ✅ Stripe Checkout integration (hosted payment page)
- ✅ Support for all major credit/debit cards
- ✅ PCI DSS compliant (no card data touches our servers)
- ✅ 256-bit SSL encryption
- ✅ Real-time payment confirmation via webhooks

### 2. Order Management

- ✅ Payment status tracking (PENDING, PROCESSING, PAID, FAILED, REFUNDED)
- ✅ Order status tracking (PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED)
- ✅ Stripe session ID and payment intent ID storage
- ✅ Automatic order creation before payment
- ✅ Order update after successful payment

### 3. User Experience

- ✅ Simplified checkout form (only shipping address required)
- ✅ Redirect to Stripe's secure payment page
- ✅ Success page after payment
- ✅ Automatic cart clearing after successful payment
- ✅ Email receipt from Stripe (automatic)

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
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`
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
1. User adds products to cart
   ↓
2. User goes to /cart and clicks "Proceed to Checkout"
   ↓
3. User fills out shipping address
   ↓
4. User clicks "Proceed to Payment"
   ↓
5. Server creates Order (status: PENDING, paymentStatus: PENDING)
   ↓
6. Server creates Stripe Checkout Session
   ↓
7. User is redirected to Stripe's checkout page
   ↓
8. User enters card details on Stripe
   ↓
9. Stripe processes payment
   ↓
10. Stripe sends webhook to our server
    ↓
11. Server updates Order (status: PROCESSING, paymentStatus: PAID)
    ↓
12. User redirected to /checkout/success
    ↓
13. Cart is cleared
```

### Database Schema

#### Order Model

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
  OrderItem             OrderItem[]
}
```

#### Payment Status Enum

```prisma
enum PaymentStatus {
  PENDING      // Payment not yet processed
  PROCESSING   // Payment is being processed
  PAID         // Payment successful
  FAILED       // Payment failed
  REFUNDED     // Payment was refunded
}
```

## API Endpoints

### POST /api/checkout

Creates a Stripe Checkout session.

**Authentication:** Required (NextAuth session)

**Request:**

```json
{
  "items": [
    {
      "id": "product_id",
      "quantity": 2
    }
  ],
  "shippingInfo": {
    "address": "123 Main St",
    "city": "New York",
    "zipCode": "10001"
  }
}
```

**Response:**

```json
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/c/pay/cs_test_..."
}
```

**Process:**

1. Validates user authentication
2. Validates cart items exist in database
3. Creates Order in database (PENDING status)
4. Creates Stripe Checkout Session
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

4. **charge.refunded**
   - Updates order: `paymentStatus = REFUNDED`, `status = CANCELLED`

## File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── checkout/
│   │   │   └── route.ts              # Create Stripe checkout session
│   │   └── webhooks/
│   │       └── stripe/
│   │           └── route.ts          # Handle Stripe webhooks
│   └── checkout/
│       └── success/
│           └── page.tsx              # Success page after payment
├── components/
│   └── checkout-form.tsx             # Updated to use Stripe
└── lib/
    └── stripe.ts                     # Stripe client initialization
```

## Security Considerations

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

   - Admin interface for refunds
   - Automatic inventory restocking on refunds
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
- [ ] Complete payment
- [ ] Redirected to success page
- [ ] Order shows in database with PAID status
- [ ] Cart is cleared

### Error Scenarios

- [ ] Test declined card: `4000 0000 0000 0002`
- [ ] Test without authentication (should redirect to login)
- [ ] Test with empty cart
- [ ] Test with invalid shipping info
- [ ] Cancel payment on Stripe page (should return to cart)

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

### Issue: "Invalid signature" webhook error

**Solution:** Make sure STRIPE_WEBHOOK_SECRET in `.env` matches the one from Stripe CLI or Dashboard

### Issue: Payment successful but order not updated

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
