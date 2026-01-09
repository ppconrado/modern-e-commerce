import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    console.error('Webhook signature verification failed:', error.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Handle different event types
  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        // Create order when payment is successful
        const metadata = paymentIntent.metadata;

        if (!metadata.userId || !metadata.cartId) {
          console.error('Missing userId or cartId in payment intent metadata');
          break;
        }

        // Pull items from cart to ensure server-side trusted quantities/prices
        const cart = await prisma.cart.findUnique({
          where: { id: metadata.cartId },
          include: { items: { include: { product: true } } },
        });

        if (!cart || !cart.items || cart.items.length === 0) {
          console.error('Cart not found or empty for cartId:', metadata.cartId);
          break;
        }

        // Create order with cart snapshot
        const order = await prisma.order.create({
          data: {
            userId: metadata.userId,
            total: paymentIntent.amount / 100,
            address: metadata.shippingAddress,
            city: metadata.shippingCity,
            zipCode: metadata.shippingZipCode,
            paymentMethod: 'stripe',
            status: 'PROCESSING',
            paymentStatus: 'PAID',
            stripePaymentIntentId: paymentIntent.id,
            OrderItem: {
              create: cart.items.map((ci) => ({
                productId: ci.productId,
                quantity: ci.quantity,
                price: ci.price,
              })),
            },
          },
        });

        // Update stock
        for (const ci of cart.items) {
          await prisma.product.update({
            where: { id: ci.productId },
            data: {
              stock: { decrement: ci.quantity },
            },
          });
        }

        // Clear user's cart after successful payment
        const userCart = await prisma.cart.findUnique({ where: { id: metadata.cartId } });

        if (userCart) {
          // Delete all cart items
          await prisma.cartItem.deleteMany({ where: { cartId: userCart.id } });

          // Reset cart totals and remove coupon
          await prisma.cart.update({
            where: { id: userCart.id },
            data: {
              subtotal: 0,
              discountAmount: 0,
              total: 0,
              couponCode: null,
            },
          });

          // Allow future coupon use in this cart by clearing usage records
          await prisma.couponUsage.deleteMany({ where: { cartId: userCart.id } });

          console.log(`🛒 Cart cleared for user: ${metadata.userId} cartId: ${userCart.id}`);
        }

        console.log(`✅ Order created successfully: ${order.id}`);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`❌ Payment failed: ${paymentIntent.id}`);
        // No need to create order, payment failed
        break;
      }

      case 'checkout.session.completed': {
        // Legacy support - keeping for existing orders
        const session = event.data.object as Stripe.Checkout.Session;

        // Update order with payment success
        const orderId =
          session.metadata?.orderId || session.client_reference_id;

        if (!orderId) {
          console.error('No orderId found in session metadata');
          break;
        }

        await prisma.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: 'PAID',
            status: 'PROCESSING',
            stripePaymentIntentId: session.payment_intent as string,
            updatedAt: new Date(),
          },
        });

        console.log(`✅ Payment successful for order ${orderId}`);
        break;
      }

      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId =
          session.metadata?.orderId || session.client_reference_id;

        if (!orderId) {
          console.error('No orderId found in session metadata');
          break;
        }

        await prisma.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: 'PAID',
            status: 'PROCESSING',
            updatedAt: new Date(),
          },
        });

        console.log(`✅ Async payment successful for order ${orderId}`);
        break;
      }

      case 'checkout.session.async_payment_failed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId =
          session.metadata?.orderId || session.client_reference_id;

        if (!orderId) {
          console.error('No orderId found in session metadata');
          break;
        }

        await prisma.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: 'FAILED',
            status: 'CANCELLED',
            updatedAt: new Date(),
          },
        });

        console.log(`❌ Async payment failed for order ${orderId}`);
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;

        // Find order by payment intent ID
        const order = await prisma.order.findFirst({
          where: { stripePaymentIntentId: charge.payment_intent as string },
        });

        if (order) {
          await prisma.order.update({
            where: { id: order.id },
            data: {
              paymentStatus: 'REFUNDED',
              status: 'CANCELLED',
              updatedAt: new Date(),
            },
          });

          console.log(`💰 Refund processed for order ${order.id}`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
