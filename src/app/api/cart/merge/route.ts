import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// POST /api/cart/merge - Merge cart anônimo com usuário logado
export async function POST(req: NextRequest) {
  try {
    const { anonymousCartId } = await req.json();
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    if (!anonymousCartId) {
      // Se não há carrinho anônimo, só garantir que o usuário tem um
      let userCart = await prisma.cart.findUnique({
        where: { userId: session.user.id },
        include: { items: { include: { product: true } } },
      });

      if (!userCart) {
        userCart = await prisma.cart.create({
          data: { userId: session.user.id },
          include: { items: { include: { product: true } } },
        });
      }

      return NextResponse.json({ cart: userCart });
    }

    // Buscar carrinhos
    const anonymousCart = await prisma.cart.findUnique({
      where: { anonymousId: anonymousCartId },
      include: { items: { include: { product: true } } },
    });

    let userCart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: { items: { include: { product: true } } },
    });

    if (!userCart) {
      userCart = await prisma.cart.create({
        data: { userId: session.user.id },
        include: { items: { include: { product: true } } },
      });
    }

    if (anonymousCart && anonymousCart.items.length > 0) {
      // Mesclar itens do carrinho anônimo para o usuário
      for (const anonItem of anonymousCart.items) {
        const existingItem = await prisma.cartItem.findUnique({
          where: {
            cartId_productId: {
              cartId: userCart.id,
              productId: anonItem.productId,
            },
          },
        });

        if (existingItem) {
          // Somar quantidade
          await prisma.cartItem.update({
            where: { id: existingItem.id },
            data: {
              quantity: existingItem.quantity + anonItem.quantity,
            },
          });
        } else {
          // Copiar item
          await prisma.cartItem.create({
            data: {
              cartId: userCart.id,
              productId: anonItem.productId,
              quantity: anonItem.quantity,
              price: anonItem.price,
            },
          });
        }
      }

      // Mesclar cupom se houver
      if (anonymousCart.couponCode && !userCart.couponCode) {
        await prisma.cart.update({
          where: { id: userCart.id },
          data: { couponCode: anonymousCart.couponCode },
        });
      }

      // Deletar carrinho anônimo
      await prisma.cart.delete({
        where: { id: anonymousCart.id },
      });
    }

    // Recalcular totais do carrinho do usuário
    const finalCart = await prisma.cart.findUnique({
      where: { id: userCart.id },
      include: { items: { include: { product: true } } },
    });

    const subtotal = finalCart!.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const mergedCart = await prisma.cart.update({
      where: { id: userCart.id },
      data: {
        subtotal: parseFloat(subtotal.toFixed(2)),
      },
    });

    return NextResponse.json({
      cart: mergedCart,
      message: 'Carrinhos mesclados com sucesso',
    });
  } catch (error) {
    console.error('Error merging carts:', error);
    return NextResponse.json(
      { error: 'Erro ao mesclar carrinhos' },
      { status: 500 }
    );
  }
}
