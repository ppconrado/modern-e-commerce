import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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

    // Carregar carrinho e itens
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

    // Se nenhum cupom está aplicado, tratar como idempotente
    if (!cart.couponCode) {
      const finalCart = await recalculateCartTotals(cart.id, cart.items);
      return NextResponse.json({
        success: true,
        cart: finalCart,
        message: 'Nenhum cupom aplicado',
      });
    }

    try {
      const resultCart = await prisma.$transaction(async (tx) => {
        // Early return if no coupon to remove
        if (!cart.couponCode) {
          return await tx.cart.update({
            where: { id: cartId },
            data: { couponCode: null },
            include: { items: { include: { product: true } } },
          });
        }

        // Obter cupom pelo código
        const coupon = await tx.coupon.findFirst({
          where: { code: { equals: cart.couponCode, mode: 'insensitive' } },
        });

        if (!coupon) {
          // Código fornecido não existe; remover referência do carrinho mesmo assim
          const cleared = await tx.cart.update({
            where: { id: cartId },
            data: { couponCode: null },
            include: { items: { include: { product: true } } },
          });
          return cleared;
        }

        // Verificar uso existente e remover
        const existingUsage = await tx.couponUsage.findUnique({
          where: { couponId_cartId: { couponId: coupon.id, cartId } },
        });

        if (existingUsage) {
          await tx.couponUsage.delete({
            where: { couponId_cartId: { couponId: coupon.id, cartId } },
          });
          // Decrementar contador de uso de forma segura
          await tx.coupon.update({
            where: { id: coupon.id },
            data: { usedCount: { decrement: 1 } },
          });
        }

        // Limpar cupom do carrinho
        const updatedCart = await tx.cart.update({
          where: { id: cartId },
          data: { couponCode: null },
          include: { items: { include: { product: true } } },
        });

        return updatedCart;
      });

      const finalCart = await recalculateCartTotals(cartId, resultCart.items);

      return NextResponse.json({
        success: true,
        cart: finalCart,
        message: 'Cupom removido com sucesso',
      });
    } catch (transactionError) {
      if (
        transactionError instanceof Prisma.PrismaClientKnownRequestError &&
        transactionError.code === 'P2002'
      ) {
        // Constraint unique falhou — tratar como sucesso idempotente
        const finalCart = await recalculateCartTotals(cartId, cart.items);
        return NextResponse.json({
          success: true,
          cart: finalCart,
          message: 'Cupom já estava removido',
        });
      }
      throw transactionError;
    }
  } catch (error) {
    console.error('❌ Erro ao remover cupom:', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return NextResponse.json(
          { error: 'Cupom ou carrinho não encontrado' },
          { status: 404 }
        );
      }
      if (error.code === 'P2003') {
        return NextResponse.json(
          { error: 'Dados inválidos para cupom ou carrinho' },
          { status: 400 }
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
