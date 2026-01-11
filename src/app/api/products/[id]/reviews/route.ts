import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { areReviewsEnabled } from '@/lib/settings-helpers';
import { z } from 'zod';

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

// GET - Get all reviews for a product
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const reviews = await prisma.review.findMany({
      where: { productId: id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

// POST - Create a review for a product
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('=== REVIEW POST ENDPOINT CALLED ===');
  try {
    // Check if reviews are enabled
    const reviewsEnabled = await areReviewsEnabled();
    if (!reviewsEnabled) {
      return NextResponse.json(
        { error: 'Reviews are currently disabled' },
        { status: 403 }
      );
    }

    const session = await auth();

    if (!session?.user?.id) {
      console.log('No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Session user ID:', session.user.id);

    const { id: productId } = await params;
    const body = await req.json();
    const validatedData = reviewSchema.parse(body);

    console.log('Product ID:', productId);
    console.log('Review data:', validatedData);

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Check if user already reviewed this product
    const existingReview = await prisma.review.findUnique({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId,
        },
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this product' },
        { status: 400 }
      );
    }

    // CRITICAL: Check if user purchased and received this product
    console.log('=== CHECKING PURCHASE VERIFICATION ===');
    console.log('User ID:', session.user.id);
    console.log('Product ID:', productId);

    // Get all delivered orders for this user
    const userDeliveredOrders = await prisma.order.findMany({
      where: {
        userId: session.user.id,
        status: 'DELIVERED',
      },
      include: {
        OrderItem: {
          where: {
            productId: productId,
          },
        },
      },
    });

    console.log(
      'User delivered orders:',
      JSON.stringify(userDeliveredOrders, null, 2)
    );

    // Check if any delivered order contains this product
    const hasPurchasedProduct = userDeliveredOrders.some(
      (order) => order.OrderItem.length > 0
    );

    console.log('Has purchased this product:', hasPurchasedProduct);

    if (!hasPurchasedProduct) {
      console.log('BLOCKING REVIEW - User has not purchased this product');
      return NextResponse.json(
        {
          error: 'You can only review products you have purchased and received',
        },
        { status: 403 }
      );
    }

    console.log('ALLOWING REVIEW - User has purchased this product');

    // Create review
    const review = await prisma.review.create({
      data: {
        rating: validatedData.rating,
        comment: validatedData.comment,
        userId: session.user.id,
        productId,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    // Update product average rating and count
    const allReviews = await prisma.review.findMany({
      where: { productId },
      select: { rating: true },
    });

    const averageRating =
      allReviews.reduce((sum: number, r) => sum + r.rating, 0) /
      allReviews.length;

    await prisma.product.update({
      where: { id: productId },
      data: {
        averageRating,
        reviewCount: allReviews.length,
      },
    });

    return NextResponse.json(
      {
        review,
        verified: true, // Always true since we require purchase
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    );
  }
}
