import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { items, shippingInfo } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

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

    // Fetch products from database to ensure prices are correct
    const productIds = items.map((item: any) => item.id);
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
    });

    // Verify all products exist
    if (products.length !== productIds.length) {
      return NextResponse.json(
        { error: 'Some products not found' },
        { status: 404 }
      );
    }

    // Build line items for Stripe
    const lineItems = items.map((item: any) => {
      const product = products.find((p) => p.id === item.id);
      if (!product) {
        throw new Error(`Product ${item.id} not found`);
      }

      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: product.name,
            description: product.description,
            images: [product.image],
          },
          unit_amount: Math.round(product.price * 100), // Convert to cents
        },
        quantity: item.quantity,
      };
    });

    // Calculate total
    const total = items.reduce((sum: number, item: any) => {
      const product = products.find((p) => p.id === item.id);
      return sum + product!.price * item.quantity;
    }, 0);

    // Create Payment Intent (not creating order yet, wait for webhook confirmation)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100), // Convert to cents
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        userId: session.user.id,
        userEmail: session.user.email || '',
        items: JSON.stringify(
          items.map((item: any) => ({
            id: item.id,
            quantity: item.quantity,
          }))
        ),
        shippingAddress: shippingInfo.address,
        shippingCity: shippingInfo.city,
        shippingZipCode: shippingInfo.zipCode,
        shippingPhone: shippingInfo.phone || '',
      },
    });

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
