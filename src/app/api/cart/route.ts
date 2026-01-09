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

    return NextResponse.json({ cart });
  } catch (error) {
    console.error('Error fetching cart:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar carrinho' },
      { status: 500 }
    );
  }
}

// POST /api/cart - Adicionar item ao carrinho
export async function POST(req: NextRequest) {
  try {
    const { productId, quantity, anonymousId } = await req.json();

    if (!productId || quantity < 1) {
      return NextResponse.json(
        { error: 'productId e quantity são obrigatórios' },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
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

    const { cart, anonymousId: returnedAnonymousId } = await getOrCreateCart(anonymousId);

    const existingItem = await prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } },
    });

    let cartItem;

    if (existingItem) {
      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
        include: { product: true },
      });
    } else {
      cartItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
          price: product.price,
        },
        include: { product: true },
      });
    }

    // Recalcular totais
    const updatedCart = await recalculateCartTotals(cart.id);

    return NextResponse.json({ 
      cart: updatedCart, 
      cartItem,
      anonymousId: returnedAnonymousId // Para o frontend salvar no localStorage
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    return NextResponse.json(
      { error: 'Erro ao adicionar ao carrinho' },
      { status: 500 }
    );
  }
}
