import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { getOrCreateCart, recalculateCartTotals } from '@/lib/cart-utils';
import { auth } from '@/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { shippingInfo } = body;

    if (
      !shippingInfo?.address ||
      !shippingInfo?.city ||
      !shippingInfo?.zipCode
    ) {
      return NextResponse.json(
        { error: 'Shipping information is incomplete' },
        { status: 400 }
      );
    }

    // Get authenticated user's cart and ensure totals are accurate server-side
    const { cart } = await getOrCreateCart(undefined, true);

    if (!cart || !cart.items || cart.items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    // Recalculate totals to ensure coupon discounts are applied
    const updatedCart = await recalculateCartTotals(cart.id, cart.items);

    if (!updatedCart) {
      return NextResponse.json(
        { error: 'Failed to recalculate cart totals' },
        { status: 500 }
      );
    }

    const total = updatedCart.total;

    // Create Payment Intent (not creating order yet, wait for webhook confirmation)
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: Math.round(total * 100),
        currency: 'usd',
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          userId: session.user.id,
          userEmail: session.user.email || '',
          cartId: cart.id,
          subtotal: String(updatedCart.subtotal),
          discountAmount: String(updatedCart.discountAmount),
          couponCode: updatedCart.couponCode || '',
          shippingAddress: shippingInfo.address,
          shippingCity: shippingInfo.city,
          shippingZipCode: shippingInfo.zipCode,
          shippingPhone: shippingInfo.phone || '',
        },
      }
    );

    if (!paymentIntent.client_secret) {
      console.error('PaymentIntent created but client_secret is missing:', paymentIntent.id);
      return NextResponse.json(
        { error: 'Failed to create payment session' },
        { status: 500 }
      );
    }

    console.log('PaymentIntent created:', paymentIntent.id, 'Amount:', total);

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Payment intent creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}
