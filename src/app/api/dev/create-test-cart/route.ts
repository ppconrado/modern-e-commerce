import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateCart, recalculateCartTotals } from '@/lib/cart-utils';

// POST /api/dev/create-test-cart - DEV ONLY: create a cart with one item and return cartId
export async function POST(req: NextRequest) {
  try {
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Forbidden in non-dev env' }, { status: 403 });
    }

    const { quantity = 1 } = await req.json().catch(() => ({ quantity: 1 }));

    // Find any available product
    const product = await prisma.product.findFirst({
      where: { stock: { gt: 0 } },
      select: { id: true, price: true },
    });

    if (!product) {
      return NextResponse.json({ error: 'No products with stock found' }, { status: 404 });
    }

    // Create anonymous cart and add item
    const { cart } = await getOrCreateCart(undefined, false);

    await prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId: product.id } },
      update: { quantity: { increment: quantity } },
      create: {
        cartId: cart.id,
        productId: product.id,
        quantity,
        price: product.price,
      },
    });

    const updatedCart = await recalculateCartTotals(cart.id);

    return NextResponse.json({
      cart: updatedCart,
      cartId: updatedCart.id,
      anonymousId: updatedCart.anonymousId,
    });
  } catch (error) {
    console.error('Error creating test cart:', error);
    return NextResponse.json(
      { error: 'Failed to create test cart' },
      { status: 500 }
    );
  }
}
