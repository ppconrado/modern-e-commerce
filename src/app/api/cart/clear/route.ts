import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// POST /api/cart/clear - Clear cart after successful payment
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      // For anonymous users, use cartId from body
      const body = await req.json().catch(() => ({}));
      const { cartId } = body;

      if (cartId) {
        // Delete all items from anonymous cart
        await prisma.cartItem.deleteMany({
          where: { cartId },
        });

        // Reset cart totals
        await prisma.cart.update({
          where: { id: cartId },
          data: {
            subtotal: 0,
            discountAmount: 0,
            total: 0,
            couponCode: null,
          },
        });
      }

      return NextResponse.json({ success: true });
    }

    // For authenticated users, find their cart
    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
    });

    if (!cart) {
      return NextResponse.json({ success: true });
    }

    // Delete all cart items
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    // Reset cart totals and remove coupon
    await prisma.cart.update({
      where: { id: cart.id },
      data: {
        subtotal: 0,
        discountAmount: 0,
        total: 0,
        couponCode: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing cart:', error);
    return NextResponse.json(
      { error: 'Failed to clear cart' },
      { status: 500 }
    );
  }
}
