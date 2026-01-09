import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import {
  getOrCreateCart,
  recalculateCartTotals,
} from '@/lib/cart-utils';

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
    const { productId, quantity, anonymousId } = await req.json();

    if (!productId || quantity < 1) {
      return NextResponse.json(
        { error: 'productId e quantity são obrigatórios' },
        { status: 400 }
      );
    }

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
