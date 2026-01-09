import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import {
  validateCouponForCart,
  recalculateCartTotals,
  isCouponValid,
} from '@/lib/cart-utils';
import { Prisma } from '@prisma/client';

// POST /api/cart/apply-coupon
export async function POST(req: NextRequest) {
  try {
    const { couponCode, cartId } = await req.json();

    if (!couponCode || !cartId) {
      return NextResponse.json(
        { error: 'couponCode e cartId são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar cupom
    const validation = await validateCouponForCart(
      couponCode.toUpperCase(),
      cartId
    );

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const coupon = validation.coupon!;

    try {
      // 🔴 CRÍTICO: Usar transação para garantir atomicidade
      // Tudo aqui é executado como uma única operação - ou funciona tudo ou nada
      const result = await prisma.$transaction(async (tx) => {
        // 1. Verificar se cupom já foi aplicado (dentro da transação para evitar race condition)
        const existingUsage = await tx.couponUsage.findUnique({
          where: { couponId_cartId: { couponId: coupon.id, cartId } },
        });

        if (existingUsage) {
          // Cupom já foi aplicado - retornar carrinho atual
          return await tx.cart.findUnique({
            where: { id: cartId },
            include: { items: { include: { product: true } } },
          });
        }

        // 2. Aplicar cupom ao carrinho (atualizar couponCode)
        const updatedCart = await tx.cart.update({
          where: { id: cartId },
          data: { couponCode: coupon.code },
          include: { items: { include: { product: true } } },
        });

        // 3. Registrar uso do cupom
        await tx.couponUsage.create({
          data: {
            couponId: coupon.id,
            cartId,
            userId: (await auth())?.user?.id,
          },
        });

        // 4. Incrementar contador de uso
        await tx.coupon.update({
          where: { id: coupon.id },
          data: { usedCount: { increment: 1 } }, // ← Usar increment para evitar race condition
        });

        return updatedCart;
      });

      // Recalcular totais (fora da transação, após confirmar aplicação)
      const finalCart = await recalculateCartTotals(cartId, result?.items || []);

      return NextResponse.json({
        success: true,
        cart: finalCart,
        coupon: {
          code: coupon.code,
          discountValue: coupon.discountValue,
          discountType: coupon.discountType,
        },
        message: 'Cupom aplicado com sucesso',
      });
    } catch (transactionError) {
      // Se falhar por constraint (ex: cupom já aplicado), tratar como erro 400
      if (
        transactionError instanceof Prisma.PrismaClientKnownRequestError &&
        transactionError.code === 'P2002'
      ) {
        return NextResponse.json(
          { error: 'Este cupom já foi aplicado a este carrinho' },
          { status: 400 }
        );
      }
      throw transactionError; // Re-lançar para ser capturado pelo catch externo
    }
  } catch (error) {
    console.error('❌ Erro ao aplicar cupom:', error);

    // Identificar tipo específico de erro para mensagem melhor
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'Este cupom já foi aplicado a este carrinho' },
          { status: 400 }
        );
      }
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

    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      return NextResponse.json(
        { error: 'Este cupom já foi aplicado a este carrinho' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Erro ao aplicar cupom. Tente novamente mais tarde.',
        debug: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : String(error) : undefined,
      },
      { status: 500 }
    );
  }
}
