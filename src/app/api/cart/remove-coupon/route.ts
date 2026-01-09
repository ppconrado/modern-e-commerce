import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { recalculateCartTotals } from '@/lib/cart-utils';

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

    // Se havia um cupom aplicado, limpar registros de uso para permitir reaplicação
    if (cart.couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: cart.couponCode },
      });

      if (coupon) {
        // Remover registro de uso vinculado ao carrinho
        await prisma.couponUsage.deleteMany({
          where: { couponId: coupon.id, cartId },
        });

        // Decrementar contador de uso (não deixar negativo)
        if (coupon.usedCount && coupon.usedCount > 0) {
          await prisma.coupon.update({
            where: { id: coupon.id },
            data: { usedCount: coupon.usedCount - 1 },
          });
        }
      }
    }

    // Remover cupom do carrinho
    await prisma.cart.update({
      where: { id: cartId },
      data: {
        couponCode: null,
        discountAmount: 0,
      },
    });

    // Recalcular totais com utilitário centralizado
    const finalCart = await recalculateCartTotals(cartId);

    return NextResponse.json({ cart: finalCart });
  } catch (error) {
    console.error('Error removing coupon:', error);
    return NextResponse.json(
      { error: 'Erro ao remover cupom' },
      { status: 500 }
    );
  }
}
