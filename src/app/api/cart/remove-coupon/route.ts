import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// DELETE /api/cart/remove-coupon
export async function POST(req: NextRequest) {
  try {
    const { cartId } = await req.json();

    if (!cartId) {
      return NextResponse.json(
        { error: 'cartId é obrigatório' },
        { status: 400 }
      );
    }

    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
    });

    if (!cart) {
      return NextResponse.json(
        { error: 'Carrinho não encontrado' },
        { status: 404 }
      );
    }

    const session = await auth();
    if (session?.user?.id !== cart.userId && cart.userId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Remove coupon
    const updatedCart = await prisma.cart.update({
      where: { id: cartId },
      data: {
        couponCode: null,
        discountAmount: 0,
      },
      include: { items: { include: { product: true } } },
    });

    // Recalcular total
    const subtotal = updatedCart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const finalCart = await prisma.cart.update({
      where: { id: cartId },
      data: {
        subtotal: parseFloat(subtotal.toFixed(2)),
        total: parseFloat(subtotal.toFixed(2)),
      },
      include: { items: { include: { product: true } } },
    });

    return NextResponse.json({ cart: finalCart });
  } catch (error) {
    console.error('Error removing coupon:', error);
    return NextResponse.json(
      { error: 'Erro ao remover cupom' },
      { status: 500 }
    );
  }
}
