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

    // Save or update address if provided and not using existing addressId
    let addressId = shippingInfo.addressId;
    
    if (!addressId && shippingInfo.address) {
      // Create new address or update existing default shipping address
      const existingShippingAddr = await prisma.address.findFirst({
        where: {
          userId: session.user.id,
          type: 'SHIPPING',
          isDefault: true,
        },
      });

      if (existingShippingAddr) {
        // Update existing default shipping address
        await prisma.address.update({
          where: { id: existingShippingAddr.id },
          data: {
            address: shippingInfo.address,
            city: shippingInfo.city,
            zipCode: shippingInfo.zipCode,
            phone: shippingInfo.phone,
          },
        });
        addressId = existingShippingAddr.id;
      } else {
        // Create new shipping address
        const newAddress = await prisma.address.create({
          data: {
            userId: session.user.id,
            type: 'SHIPPING',
            label: 'Shipping Address',
            address: shippingInfo.address,
            city: shippingInfo.city,
            zipCode: shippingInfo.zipCode,
            phone: shippingInfo.phone,
            isDefault: true,
          },
        });
        addressId = newAddress.id;
      }
    }

    // Create order in database first
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        total,
        address: shippingInfo.address,
        city: shippingInfo.city,
        zipCode: shippingInfo.zipCode,
        paymentMethod: 'stripe',
        status: 'PENDING',
        paymentStatus: 'PENDING',
        OrderItem: {
          create: items.map((item: any) => {
            const product = products.find((p) => p.id === item.id);
            return {
              productId: item.id,
              quantity: item.quantity,
              price: product!.price,
            };
          }),
        },
      },
    });

    // Create Stripe checkout session
    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXTAUTH_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/cart`,
      customer_email: session.user.email || undefined,
      client_reference_id: order.id,
      metadata: {
        orderId: order.id,
        userId: session.user.id,
      },
    });

    // Update order with Stripe session ID
    await prisma.order.update({
      where: { id: order.id },
      data: {
        stripeSessionId: stripeSession.id,
      },
    });

    return NextResponse.json({
      sessionId: stripeSession.id,
      url: stripeSession.url,
    });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
