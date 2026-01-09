import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { recalculateCartTotals } from '@/lib/cart-utils';

// PUT /api/cart/[itemId] - Atualizar quantidade
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { quantity } = await req.json();
    const { itemId } = await params;

    if (quantity < 0) {
      return NextResponse.json(
        { error: 'Quantidade inválida' },
        { status: 400 }
      );
    }

    const cartItem = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { product: true, cart: true },
    });

    if (!cartItem) {
      return NextResponse.json(
        { error: 'Item do carrinho não encontrado' },
        { status: 404 }
      );
    }

    const session = await auth();
    if (session?.user?.id !== cartItem.cart.userId && cartItem.cart.userId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    let updatedItem;

    if (quantity === 0) {
      // Deletar item
      await prisma.cartItem.delete({
        where: { id: itemId },
      });
      updatedItem = null;
    } else {
      if (cartItem.product.stock < quantity) {
        return NextResponse.json(
          { error: 'Estoque insuficiente' },
          { status: 400 }
        );
      }

      updatedItem = await prisma.cartItem.update({
        where: { id: itemId },
        data: { quantity },
        include: { product: true },
      });
    }

    // Recalcular totais
    const updatedCart = await recalculateCartTotals(cartItem.cart.id);

    return NextResponse.json({ cartItem: updatedItem, cart: updatedCart });
  } catch (error) {
    console.error('Error updating cart item:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar item' },
      { status: 500 }
    );
  }
}

// DELETE /api/cart/[itemId]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;

    const cartItem = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true },
    });

    if (!cartItem) {
      return NextResponse.json(
        { error: 'Item não encontrado' },
        { status: 404 }
      );
    }

    const session = await auth();
    if (session?.user?.id !== cartItem.cart.userId && cartItem.cart.userId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    await prisma.cartItem.delete({
      where: { id: itemId },
    });

    const updatedCart = await recalculateCartTotals(cartItem.cart.id);

    return NextResponse.json({ cart: updatedCart });
  } catch (error) {
    console.error('Error deleting cart item:', error);
    return NextResponse.json(
      { error: 'Erro ao remover item' },
      { status: 500 }
    );
  }
}
