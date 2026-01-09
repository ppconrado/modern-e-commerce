import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import {
  getOrCreateCart,
  recalculateCartTotals,
} from '@/lib/cart-utils';
import { logger } from '@/lib/logger';
import { validateRequest, AddToCartSchema, UpdateCartItemSchema, RemoveCartItemSchema } from '@/lib/validation';

// GET /api/cart - Obter carrinho do usuário
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const cartId = req.nextUrl.searchParams.get('cartId');

    if (!session?.user?.id && !cartId) {
      // Retorna carrinho vazio em vez de erro para usuários não autenticados
      return NextResponse.json({ cart: null, items: [] });
    }

    let cart;

    if (session?.user?.id) {
      cart = await prisma.cart.findUnique({
        where: { userId: session.user.id },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    } else if (cartId) {
      cart = await prisma.cart.findUnique({
        where: { anonymousId: cartId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    }

    if (!cart) {
      // Retorna carrinho vazio em vez de 404
      return NextResponse.json({ cart: null, items: [] });
    }

    return NextResponse.json({ 
      cart,
      anonymousId: cart.anonymousId 
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar carrinho' },
      { status: 500 }
    );
  }
}

// POST /api/cart - Adicionar item ao carrinho
// OTIMIZADO: Reduzido de 7 para 2-3 queries usando upsert
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = validateRequest(AddToCartSchema, body);

    if (!validation.valid) {
      logger.warn('Invalid add-to-cart request', { error: validation.error });
      return NextResponse.json(
        { error: 'Invalid request: ' + validation.error },
        { status: 400 }
      );
    }

    const { productId, quantity, anonymousId } = validation.data;

    // Query 1: Verificar produto e obter/criar carrinho em paralelo
    const [product, cartResult] = await Promise.all([
      prisma.product.findUnique({
        where: { id: productId },
        select: { id: true, price: true, stock: true },
      }),
      getOrCreateCart(anonymousId, false),
    ]);

    if (!product) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      );
    }

    if (product.stock < quantity) {
      return NextResponse.json(
        { error: 'Estoque insuficiente' },
        { status: 400 }
      );
    }

    const { cart, isAnonymous } = cartResult;
    const returnedAnonymousId = isAnonymous ? cartResult.anonymousId : null;

    // Query 2: Upsert item (criar ou atualizar quantidade)
    const cartItem = await prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId } },
      update: { quantity: { increment: quantity } },
      create: {
        cartId: cart.id,
        productId,
        quantity,
        price: product.price,
      },
      include: { product: true },
    });

    // Query 3: Recalcular totais
    const updatedCart = await recalculateCartTotals(cart.id);

    logger.info('Item added to cart', { cartId: cart.id, productId, quantity });

    return NextResponse.json({ 
      cart: updatedCart, 
      cartItem,
      anonymousId: returnedAnonymousId
    });
  } catch (error) {
    console.error('Error adding to cart:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: 'Erro ao adicionar ao carrinho' },
      { status: 500 }
    );
  }
}

// PATCH /api/cart - Atualizar quantidade de um item
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = validateRequest(UpdateCartItemSchema, body);

    if (!validation.valid) {
      logger.warn('Invalid update-item request', { error: validation.error });
      return NextResponse.json(
        { error: 'Invalid request: ' + validation.error },
        { status: 400 }
      );
    }

    const { productId, quantity, anonymousId } = validation.data;

    // Use getOrCreateCart() - matches POST logic for consistent authorization
    const { cart } = await getOrCreateCart(anonymousId, false);

    if (!cart?.id) {
      logger.warn('Cart not found', { cartId: cart?.id, anonymousId });
      return NextResponse.json(
        { error: 'Carrinho não encontrado' },
        { status: 404 }
      );
    }
    const cartId = cart.id;

    // Verificar se item existe no carrinho
    const existingItem = await prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId, productId } },
    });

    if (!existingItem) {
      logger.warn('Item not in cart', { cartId, productId });
      return NextResponse.json(
        { error: 'Item não encontrado no carrinho' },
        { status: 404 }
      );
    }

    if (quantity === 0) {
      // Remover item
      await prisma.cartItem.delete({
        where: { cartId_productId: { cartId, productId } },
      });
    } else {
      // Atualizar quantidade (respeitar estoque atual)
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { stock: true },
      });

      if (!product) {
        return NextResponse.json(
          { error: 'Produto não encontrado' },
          { status: 404 }
        );
      }

      if (product.stock < quantity) {
        return NextResponse.json(
          { error: 'Estoque insuficiente' },
          { status: 400 }
        );
      }

      await prisma.cartItem.update({
        where: { cartId_productId: { cartId, productId } },
        data: { quantity },
      });
    }

    const updatedCart = await recalculateCartTotals(cartId);

    logger.info('Cart item updated', { cartId, productId, newQuantity: quantity });

    return NextResponse.json({ cart: updatedCart });
  } catch (error) {
    logger.error('Error updating cart item', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Erro ao atualizar item do carrinho' },
      { status: 500 }
    );
  }
}

// DELETE /api/cart - Remover item do carrinho
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = validateRequest(RemoveCartItemSchema, body);

    if (!validation.valid) {
      logger.warn('Invalid remove-item request', { error: validation.error });
      return NextResponse.json(
        { error: 'Invalid request: ' + validation.error },
        { status: 400 }
      );
    }

    const { productId, anonymousId } = validation.data;

    // Use getOrCreateCart() - matches POST logic for consistent authorization
    const { cart } = await getOrCreateCart(anonymousId, false);

    if (!cart?.id) {
      logger.warn('Cart not found for deletion', { cartId: cart?.id, anonymousId });
      return NextResponse.json(
        { error: 'Carrinho não encontrado' },
        { status: 404 }
      );
    }
    const cartId = cart.id;

    // Verificar existência antes de remover
    const existingItem = await prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId, productId } },
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Item não encontrado no carrinho' },
        { status: 404 }
      );
    }

    await prisma.cartItem.delete({
      where: { cartId_productId: { cartId, productId } },
    });

    const updatedCart = await recalculateCartTotals(cartId);

    logger.info('Item removed from cart', { cartId, productId });

    return NextResponse.json({ cart: updatedCart });
  } catch (error) {
    logger.error('Error removing cart item', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Erro ao remover item do carrinho' },
      { status: 500 }
    );
  }
}
