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
      case 'checkout.session.completed': {
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
