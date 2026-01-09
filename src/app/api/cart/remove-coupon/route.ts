import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { recalculateCartTotals } from '@/lib/cart-utils';
import { Prisma } from '@prisma/client';

// POST /api/cart/remove-coupon
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
      include: { items: { include: { product: true } } },
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

    // Se não há cupom aplicado, retornar carrinho sem mudanças
    if (!cart.couponCode) {
      return NextResponse.json({
        success: true,
        cart,
        message: 'Nenhum cupom aplicado',
      });
    }

    // 🔴 CRÍTICO: Usar transação para garantir atomicidade
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Buscar o cupom para obter seu ID
        const coupon = await tx.coupon.findUnique({
          where: { code: cart.couponCode! },
        });

        if (!coupon) {
          // Cupom não existe mais - apenas remover a referência do carrinho
          return await tx.cart.update({
            where: { id: cartId },
            data: {
              couponCode: null,
              discountAmount: 0,
            },
            include: { items: { include: { product: true } } },
          });
        }

        // Remover registro de uso (permite reaplicação do cupom)
        await tx.couponUsage.deleteMany({
          where: { couponId: coupon.id, cartId },
        });

        // Decrementar contador de uso (não deixar negativo)
        await tx.coupon.update({
          where: { id: coupon.id },
          data: { usedCount: { decrement: 1 } },
        });

        // Remover cupom do carrinho
        return await tx.cart.update({
          where: { id: cartId },
          data: {
            couponCode: null,
            discountAmount: 0,
          },
          include: { items: { include: { product: true } } },
        });
      });

      // Recalcular totais
      const finalCart = await recalculateCartTotals(cartId, result.items);

      return NextResponse.json({
        success: true,
        cart: finalCart,
        message: 'Cupom removido com sucesso',
      });
    } catch (transactionError) {
      if (
        transactionError instanceof Prisma.PrismaClientKnownRequestError &&
        transactionError.code === 'P2025'
      ) {
        return NextResponse.json(
          { error: 'Cupom ou carrinho não encontrado' },
          { status: 404 }
        );
      }
      throw transactionError;
    }
  } catch (error) {
    console.error('❌ Erro ao remover cupom:', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return NextResponse.json(
          { error: 'Dados não encontrados' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      {
        error: 'Erro ao remover cupom. Tente novamente mais tarde.',
        debug:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      },
      { status: 500 }
    );
  }
}
