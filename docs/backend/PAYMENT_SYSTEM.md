# Payment System Documentation

## Overview

This document describes the complete payment processing flow in the e-commerce platform, including cart management, discount application, checkout, Stripe integration, and webhook handling.

---

## 1. Cart System

### 1.1 Cart Structure

Carts are stored in the database with the following key attributes:

```typescript
interface Cart {
  id: string;           // Unique cart ID (CUID)
  userId?: string;      // For authenticated users
  anonymousId?: string; // For guest checkouts
  
  // Cart totals (recalculated on each operation)
  subtotal: number;     // Sum of (item.price × item.quantity)
  discountAmount: number; // Discount applied (from coupon)
  total: number;        // subtotal - discountAmount
  
  // Coupon tracking
  couponCode?: string;  // Applied coupon code
  
  // Metadata
  items: CartItem[];    // Line items
  createdAt: Date;
  updatedAt: Date;
}

interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  price: number;       // Captured at add-time for consistency
  product: Product;    // Joined for display
}
```

### 1.2 Cart Management

#### Get or Create Cart

For **authenticated users**:
- Retrieves existing cart by `userId`
- Creates new cart if none exists

For **anonymous users**:
- Uses `anonymousId` (generated client-side)
- Maintains stable cart across sessions via localStorage
- Can be merged with user cart on login (future feature)

```typescript
// API: GET /api/cart?cartId={cartId}
// Returns: { cart, anonymousId }
```

#### Add Item to Cart

Optimized with parallel queries and upsert pattern:

```typescript
// API: POST /api/cart
// Body: { productId, quantity, anonymousId? }
// Returns: { cart, cartItem, anonymousId }

Flow:
1. Validate product exists and has stock
2. Get or create cart
3. Upsert cart item (create if new, increment quantity if exists)
4. Recalculate totals
```

#### Update Item Quantity

```typescript
// API: PATCH /api/cart
// Body: { productId, quantity, anonymousId? }
// Returns: { cart }

Features:
- quantity=0 removes item
- Validates stock before updating
- Recalculates totals and coupon validity
```

#### Remove Item from Cart

```typescript
// API: DELETE /api/cart
// Body: { productId, anonymousId? }
// Returns: { cart }

Note: Removes item and triggers total recalculation
```

---

## 2. Discount & Coupon System

### 2.1 Coupon Model

```typescript
interface Coupon {
  id: string;
  code: string;                    // Unique: SAVE10, WELCOME20, etc
  description: string;             // User-facing description
  
  // Discount definition
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;           // 10 (for 10%) or 50 (for $50)
  
  // Usage restrictions
  maxUses: number | null;          // null = unlimited
  usedCount: number;               // Incremented on each use
  minimumAmount: number;           // Minimum cart subtotal required
  
  // Availability
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  
  // Optional: category restrictions (future)
  applicableCategories?: string;   // JSON: ["Electronics", "Home"]
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

interface CouponUsage {
  couponId: string;
  cartId: string;
  userId?: string;                 // For analytics
  createdAt: Date;
  
  // Composite primary key: (couponId, cartId)
  // Ensures one coupon per cart
}
```

### 2.2 Coupon Validation Flow

When user applies coupon code in checkout:

```
User Input: "SAVE10"
    ↓
[1] Request Validation
    - Trim whitespace
    - Uppercase normalization
    - Schema validation (required, max 50 chars)
    ↓
[2] Coupon Lookup
    - Case-insensitive search in database
    - Returns coupon with all fields
    ↓
[3] Status Checks
    - ✓ isActive = true
    - ✓ startDate ≤ now ≤ endDate
    - ✓ usedCount < maxUses (if maxUses set)
    ↓
[4] Cart Validations
    - ✓ Cart exists
    - ✓ Cart has items (not empty)
    - ✓ Coupon not already applied (unique constraint)
    - ✓ subtotal ≥ minimumAmount
    ↓
[5] Category Check (if applicable)
    - Parse JSON applicableCategories
    - Check if any cart item matches
    ↓
[6] Success: Record Usage
    - Create CouponUsage record
    - Increment Coupon.usedCount
    - Update Cart.couponCode
    ↓
Return: { success: true, discount: $X.XX }
```

### 2.3 Validation Error Messages (User-Facing)

| Error | Condition | Message |
|-------|-----------|---------|
| Not Found | Coupon doesn't exist | "Cupom não encontrado" |
| Not Active | isActive = false | "Cupom não está ativo" |
| Not Yet Valid | now < startDate | "Cupom ainda não é válido" |
| Expired | now > endDate | "Cupom expirado" |
| Usage Limit | usedCount ≥ maxUses | "Cupom atingiu o limite de uso" |
| Minimum Amount | subtotal < minimumAmount | "Compra mínima de $X necessária" |
| Already Applied | CouponUsage exists | "Este cupom já foi aplicado a este carrinho" |
| Wrong Category | Product not in list | "Este cupom não se aplica aos produtos" |
| Empty Cart | items.length = 0 | "Carrinho vazio - não é possível aplicar cupom" |

### 2.4 Admin Coupon Management

**Endpoint: `/admin/coupons`**

Operations:

```
GET /api/admin/coupons
  → Returns all coupons sorted by creation date

POST /api/admin/coupons
  Body: { code, description, discountType, discountValue, ... }
  → Creates new coupon with validations

PATCH /api/admin/coupons/:id
  Body: { isActive, maxUses, description, ... }
  → Updates specific fields only

DELETE /api/admin/coupons/:id
  → Deletes coupon and cascades to CouponUsage records
```

---

## 3. Checkout & Payment

### 3.1 Checkout Initiation

User navigates to `/checkout` (requires authentication):

1. **Load Cart Data**
   ```typescript
   // Backend retrieves authenticated user's cart
   const { cart } = await getOrCreateCart(undefined, true);
   ```

2. **Validate Cart**
   - Ensure cart exists and has items
   - Recalculate totals with coupon applied

3. **Collect Shipping Info**
   ```typescript
   interface ShippingInfo {
     address: string;     // Street address
     city: string;
     zipCode: string;     // Must match \d{5}(-\d{4})?
     phone?: string;      // Optional
   }
   ```

4. **Display Order Summary**
   - Item breakdown
   - Subtotal
   - Coupon discount (if applied) ✓
   - Total amount due

### 3.2 Create Payment Intent

When user clicks "Pay Now":

```typescript
// API: POST /api/checkout
// Body: { shippingInfo }

Backend:
1. Verify user authenticated
2. Validate shipping info with Zod
3. Get cart and verify totals
4. Recalculate with current coupon validity
5. Create Stripe PaymentIntent
   ↓
   amount: Math.round(total * 100)  // Convert to cents
   currency: 'usd'
   automatic_payment_methods: true
   
   metadata: {
     userId,
     userEmail,
     cartId,
     subtotal,        // ← Store for webhook verification
     discountAmount,  // ← Store for webhook verification
     couponCode,      // ← Store for webhook verification
     shippingAddress,
     shippingCity,
     shippingZipCode,
     shippingPhone,
   }
   ↓
6. Return { clientSecret } to frontend

Frontend:
- Initialize Stripe Elements with clientSecret
- User enters payment details in iframe
- Client-side validation before submission
```

### 3.3 Payment Processing (Client)

The checkout form uses Stripe Elements:

```typescript
// Controlled by: src/app/checkout/page.tsx CheckoutForm component

<form onSubmit={handlePaymentSubmit}>
  <PaymentElement />  // Stripe handles everything
  <button>Complete Payment</button>
</form>

handlePaymentSubmit:
1. confirmPayment(clientSecret)
2. Wait for Stripe response
3. On success: redirect to /payment-success
4. On failure: display error to user
```

---

## 4. Webhook Processing

### 4.1 Webhook URL

```
POST https://yourdomain.com/api/webhooks/stripe
Header: stripe-signature: t=...,v1=...
```

Configure in Stripe Dashboard:
- Endpoint URL: `/api/webhooks/stripe`
- Events: `payment_intent.succeeded`, `charge.refunded`

### 4.2 Event Handling

#### payment_intent.succeeded

When Stripe confirms payment:

```typescript
// Webhook Handler: src/app/api/webhooks/stripe/route.ts

event.type = 'payment_intent.succeeded'
paymentIntent = event.data.object

Flow:
1. Extract metadata from paymentIntent
2. Retrieve cart from database
3. Create Order with atomic transaction:
   ↓
   BEGIN TRANSACTION
   
   [1] Create Order
       - userId, total, address, city, zipCode, phone
       - paymentStatus: 'PAID'
       - stripePaymentIntentId
       
   [2] Create OrderItems (from CartItems snapshot)
       - For each item in cart.items:
         - productId, quantity, price (as captured)
         
   [3] Decrement Product Stock
       - For each item: stock -= quantity
       
   [4] Clear Cart
       - Delete all CartItems
       - Reset Cart totals to 0
       - Clear couponCode
       - Delete CouponUsage records
         (allows coupon reuse in new cart)
       
   COMMIT
   ↓
4. Log order creation
5. Return { received: true }
```

**Important Notes:**
- Uses cart snapshot (CartItems with prices) not frontend items
- Validates against price tampering
- Clears coupon usage so same user can reuse coupon in future cart
- Atomic transaction ensures consistency

#### charge.refunded

When customer requests refund:

```typescript
event.type = 'charge.refunded'
charge = event.data.object

Flow:
1. Find Order by stripePaymentIntentId
2. Update Order.paymentStatus = 'REFUNDED'
3. Log refund event
4. Optionally restore stock (business decision)
```

---

## 5. API Endpoints Summary

### Cart Operations

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/cart` | Get cart by userId or cartId |
| POST | `/api/cart` | Add item to cart |
| PATCH | `/api/cart` | Update item quantity |
| DELETE | `/api/cart` | Remove item from cart |

### Coupon Operations

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/cart/apply-coupon` | Apply coupon to cart |
| POST | `/api/cart/remove-coupon` | Remove coupon from cart |
| GET | `/api/admin/coupons` | List all coupons |
| POST | `/api/admin/coupons` | Create coupon |
| PATCH | `/api/admin/coupons/:id` | Update coupon |
| DELETE | `/api/admin/coupons/:id` | Delete coupon |

### Checkout & Payment

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/checkout` | Create payment intent |
| POST | `/api/webhooks/stripe` | Handle Stripe webhooks |

---

## 6. Data Validation & Security

### Input Validation (Zod Schemas)

```typescript
// src/lib/validation.ts

ApplyCouponSchema:
  - cartId: required CUID
  - couponCode: required, 1-50 chars, trimmed

AddToCartSchema:
  - productId: required CUID
  - quantity: required, 1-1000
  - anonymousId: optional

UpdateCartItemSchema:
  - productId: required CUID
  - quantity: required, 0-1000
  - anonymousId: optional

CheckoutSchema:
  - shippingInfo.address: required, 5-255 chars
  - shippingInfo.city: required, 2-100 chars
  - shippingInfo.zipCode: required, matches \d{5}(-\d{4})?
  - shippingInfo.phone: optional
```

### Server-Side Validations

1. **Cart Authorization**
   - Authenticated users: owned by session.user.id
   - Anonymous users: cartId must match anonymousId

2. **Product Validation**
   - Product must exist in database
   - Stock must be sufficient

3. **Coupon Validation**
   - Database lookup required (never trust client)
   - All constraints checked server-side
   - Atomic transaction for consistency

4. **Payment Security**
   - PCI DSS compliant (via Stripe)
   - No card data stored
   - PaymentIntent amount verified server-side
   - Webhook signature validated

---

## 7. Error Handling

### Client-Side Error Display

In checkout form:

```typescript
state: {
  couponError: string | '';  // Specific error message
}

When user applies coupon:
1. If error: 
   - Set couponError state
   - Input border turns red
   - Error message displays below
2. On success:
   - Clear couponError
   - Show discount in UI

When user types in input:
   - Clear couponError (retry)
```

### Server-Side Logging

All operations logged with context:

```typescript
logger.info('Item added to cart', {
  cartId,
  productId,
  quantity,
  subtotal: cart.total,
});

logger.warn('Coupon validation failed', {
  couponCode,
  error: 'Cupom atingiu o limite de uso',
  usedCount: coupon.usedCount,
  maxUses: coupon.maxUses,
});

logger.error('Payment error', error, {
  userId,
  cartId,
  amount: paymentIntent.amount,
});
```

---

## 8. Database Transactions

All coupon operations use atomic transactions:

```typescript
// Apply coupon
await prisma.$transaction(async (tx) => {
  // 1. Check duplicate
  const existing = await tx.couponUsage.findUnique(...);
  if (existing) throw new Error('Already applied');
  
  // 2. Apply to cart
  await tx.cart.update({ couponCode });
  
  // 3. Record usage
  await tx.couponUsage.create(...);
  
  // 4. Increment counter
  await tx.coupon.update({ usedCount: { increment: 1 } });
});
```

**Why atomic?**
- Prevents race conditions
- Ensures consistency
- All-or-nothing execution
- Prevents duplicate coupons if user clicks twice

---

## 9. Test Coupons

Pre-configured for development:

| Code | Type | Value | Min | Max Uses | Period |
|------|------|-------|-----|----------|--------|
| WELCOME10 | % | 10 | $0 | ∞ | Full year |
| SAVE10 | % | 10 | $0 | ∞ | Full year |
| SAVE50 | $ | 50 | $200 | 10 | Full year |
| NEWYEAR20 | % | 20 | $100 | 50 | Jan 1-31 |
| TECH25 | % | 25 | $50 | 100 | Full year |

---

## 10. Future Improvements

- [ ] Coupon per-user limits (maxUsesPerUser)
- [ ] Email-specific coupons
- [ ] Tiered discounts based on cart total
- [ ] Cart merging on user login
- [ ] Automatic coupon suggestions
- [ ] Analytics dashboard (ROI per coupon)
- [ ] Integration with email marketing
- [ ] Subscription discounts
- [ ] Referral coupon system

---

## 11. References

- **Stripe Docs**: https://stripe.com/docs/payments
- **Prisma Transactions**: https://www.prisma.io/docs/concepts/components/prisma-client/transactions
- **Next.js Middleware**: https://nextjs.org/docs/advanced-features/middleware
- **Zod Validation**: https://zod.dev
