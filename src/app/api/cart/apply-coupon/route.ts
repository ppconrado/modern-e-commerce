import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import {
  validateCouponForCart,
  recalculateCartTotals,
  isCouponValid,
} from '@/lib/cart-utils';

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

    // Idempotência: se o mesmo cupom já está aplicado, retornar sucesso
    const currentCart = await prisma.cart.findUnique({ where: { id: cartId } });
    if (currentCart?.couponCode === coupon.code) {
      const finalCart = await recalculateCartTotals(cartId);
      return NextResponse.json({
        cart: finalCart,
        coupon: {
          code: coupon.code,
          discountValue: coupon.discountValue,
          discountType: coupon.discountType,
        },
      });
    }

    // Verificar se cupom já foi aplicado neste carrinho
    const existingUsage = await prisma.couponUsage.findUnique({
      where: { couponId_cartId: { couponId: coupon.id, cartId } },
    });

    if (existingUsage) {
      // Cupom já aplicado anteriormente: garantir que o carrinho tenha o código e retornar sucesso
      if (!currentCart?.couponCode) {
        await prisma.cart.update({
          where: { id: cartId },
          data: { couponCode: coupon.code },
        });
      }
      const finalCart = await recalculateCartTotals(cartId);
      return NextResponse.json({
        cart: finalCart,
        coupon: {
          code: coupon.code,
          discountValue: coupon.discountValue,
          discountType: coupon.discountType,
        },
      });
    }

    // Aplicar cupom ao carrinho
    const updatedCart = await prisma.cart.update({
      where: { id: cartId },
      data: { couponCode: coupon.code },
      include: { items: { include: { product: true } } },
    });

    // Registrar uso do cupom
    await prisma.couponUsage.create({
      data: {
        couponId: coupon.id,
        cartId,
        userId: (await auth())?.user?.id,
      },
    });

    // Incrementar contador de uso
    await prisma.coupon.update({
      where: { id: coupon.id },
      data: { usedCount: coupon.usedCount + 1 },
    });

    // Recalcular totais
    const finalCart = await recalculateCartTotals(cartId);

    return NextResponse.json({
      cart: finalCart,
      coupon: {
        code: coupon.code,
        discountValue: coupon.discountValue,
        discountType: coupon.discountType,
      },
    });
  } catch (error) {
    console.error('Error applying coupon:', error);
    return NextResponse.json(
      { error: 'Erro ao aplicar cupom' },
      { status: 500 }
    );
  }
}
