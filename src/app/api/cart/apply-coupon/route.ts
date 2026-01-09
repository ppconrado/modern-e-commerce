import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import {
  validateCouponForCart,
  recalculateCartTotals,
  isCouponValid,
} from '@/lib/cart-utils';
import { Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';
import { validateRequest, ApplyCouponSchema } from '@/lib/validation';

// POST /api/cart/apply-coupon
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('📥 Apply coupon request body:', body);
    
    const validationResult = validateRequest(ApplyCouponSchema, body);
    console.log('🔍 Validation result:', validationResult);

    if (!validationResult.valid) {
      const errorMessage = 'Invalid request: ' + validationResult.error;
      const response = { error: errorMessage };
      logger.warn('Invalid coupon apply request', { error: validationResult.error });
      console.error('🔴 Invalid request:', { error: validationResult.error, body, response });
      console.log('🔴 Sending 400 response with:', response);
      return NextResponse.json(response, { status: 400 });
    }

    const { couponCode, cartId } = validationResult.data;
    console.log('✅ Request validated. Coupon:', couponCode, 'CartId:', cartId);

    // Validar cupom
    const couponValidation = await validateCouponForCart(
      couponCode.toUpperCase(),
      cartId
    );

    if (!couponValidation.valid) {
      const errorMessage = couponValidation.error || 'Cupom inválido';
      const response = { error: errorMessage };
      logger.warn('Coupon validation failed', { error: errorMessage, cartId });
      console.error('🔴 Coupon validation failed:', {
        error: errorMessage,
        cartId,
        couponCode,
        validationResult: couponValidation,
        response,
      });
      return NextResponse.json(response, { status: 400 });
    }

    const coupon = couponValidation.coupon!;

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

      logger.info('Coupon applied successfully', { cartId, couponCode, discount: finalCart?.discountAmount });

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
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('❌ Erro ao aplicar cupom', error instanceof Error ? error : new Error(errorMessage));
    console.error('🔴 Error applying coupon:', { error: errorMessage, stack: error instanceof Error ? error.stack : undefined });

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

    const debugMessage = process.env.NODE_ENV === 'development' ? errorMessage : undefined;
    const response = { 
      error: 'Erro ao aplicar cupom. Tente novamente mais tarde.',
      ...(debugMessage && { debug: debugMessage }),
    };
    console.error('🔴 Final error response:', { error: errorMessage, response });
    return NextResponse.json(response, { status: 500 });
  }
}
