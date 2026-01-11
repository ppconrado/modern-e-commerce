import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { isWishlistEnabled } from '@/lib/settings-helpers';

// GET /api/wishlist - Get user's wishlist
export async function GET(req: NextRequest) {
  try {
    // Check if wishlist is enabled
    const wishlistEnabled = await isWishlistEnabled();
    if (!wishlistEnabled) {
      return NextResponse.json(
        { error: 'Wishlist is currently disabled' },
        { status: 403 }
      );
    }

    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const wishlistItems = await prisma.wishlistItem.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        product: {
          include: {
            ProductImage: {
              orderBy: { order: 'asc' },
              take: 1,
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ items: wishlistItems });
  } catch (error) {
    console.error('Failed to fetch wishlist:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wishlist' },
      { status: 500 }
    );
  }
}

// POST /api/wishlist - Add item to wishlist
export async function POST(req: NextRequest) {
  try {
    // Check if wishlist is enabled
    const wishlistEnabled = await isWishlistEnabled();
    if (!wishlistEnabled) {
      return NextResponse.json(
        { error: 'Wishlist is currently disabled' },
        { status: 403 }
      );
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Você precisa estar logado para usar a wishlist.' }, { status: 401 });
    }

    // Confirma se o usuário existe no banco
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado. Faça logout e login novamente.' }, { status: 401 });
    }

    const { productId } = await req.json();
    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Add to wishlist (or do nothing if already exists)
    const wishlistItem = await prisma.wishlistItem.upsert({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId,
        },
      },
      create: {
        userId: session.user.id,
        productId,
      },
      update: {},
      include: {
        product: true,
      },
    });

    return NextResponse.json({
      message: 'Added to wishlist',
      item: wishlistItem,
    });
  } catch (error) {
    console.error('Failed to add to wishlist:', error);
    return NextResponse.json(
      { error: 'Failed to add to wishlist' },
      { status: 500 }
    );
  }
}

// DELETE /api/wishlist - Remove item from wishlist
export async function DELETE(req: NextRequest) {
  try {
    // Check if wishlist is enabled
    const wishlistEnabled = await isWishlistEnabled();
    if (!wishlistEnabled) {
      return NextResponse.json(
        { error: 'Wishlist is currently disabled' },
        { status: 403 }
      );
    }

    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    await prisma.wishlistItem.deleteMany({
      where: {
        userId: session.user.id,
        productId,
      },
    });

    return NextResponse.json({
      message: 'Removed from wishlist',
    });
  } catch (error) {
    console.error('Failed to remove from wishlist:', error);
    return NextResponse.json(
      { error: 'Failed to remove from wishlist' },
      { status: 500 }
    );
  }
}
