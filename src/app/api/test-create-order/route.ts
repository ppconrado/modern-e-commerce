import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

/**
 * Rota temporária para criar pedidos em desenvolvimento
 * quando os webhooks do Stripe não estão configurados
 *
 * Esta rota deve ser chamada pela página de sucesso
 * após confirmar o pagamento
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { paymentIntentId, items, shippingInfo, total } = body;

    if (!paymentIntentId || !items || !shippingInfo) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verificar se o pedido já existe
    const existingOrder = await prisma.order.findFirst({
      where: {
        stripePaymentIntentId: paymentIntentId,
      },
    });

    if (existingOrder) {
      return NextResponse.json({
        order: existingOrder,
        message: 'Order already exists',
      });
    }

    // Fetch products to get current prices
    const productIds = items.map((item: any) => item.id);
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
    });

    // Create order
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        total: total,
        address: shippingInfo.address,
        city: shippingInfo.city,
        zipCode: shippingInfo.zipCode,
        paymentMethod: 'stripe',
        status: 'PROCESSING',
        paymentStatus: 'PAID',
        stripePaymentIntentId: paymentIntentId,
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
      include: {
        OrderItem: {
          include: {
            Product: true,
          },
        },
      },
    });

    // Update stock
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.id },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
    }

    console.log(`✅ Order created successfully: ${order.id}`);

    return NextResponse.json({ order, success: true });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
