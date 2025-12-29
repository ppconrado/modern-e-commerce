import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const reviewUpdateSchema = z.object({
  rating: z.number().min(1).max(5).optional(),
  comment: z.string().optional(),
});

// PATCH - Update a review
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const validatedData = reviewUpdateSchema.parse(body);

    // Check if review exists and belongs to user
    const existingReview = await prisma.review.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingReview) {
      return NextResponse.json(
        { error: 'Review not found or unauthorized' },
        { status: 404 }
      );
    }

    // Update review
    const review = await prisma.review.update({
      where: { id },
      data: validatedData,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    // Recalculate product average rating if rating changed
    if (validatedData.rating) {
      const allReviews = await prisma.review.findMany({
        where: { productId: existingReview.productId },
        select: { rating: true },
      });

      const averageRating =
        allReviews.reduce((sum: number, r) => sum + r.rating, 0) /
        allReviews.length;

      await prisma.product.update({
        where: { id: existingReview.productId },
        data: { averageRating },
      });
    }

    return NextResponse.json({ review });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating review:', error);
    return NextResponse.json(
      { error: 'Failed to update review' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a review
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if review exists and belongs to user
    const existingReview = await prisma.review.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingReview) {
      return NextResponse.json(
        { error: 'Review not found or unauthorized' },
        { status: 404 }
      );
    }

    // Delete review
    await prisma.review.delete({
      where: { id },
    });

    // Recalculate product average rating and count
    const allReviews = await prisma.review.findMany({
      where: { productId: existingReview.productId },
      select: { rating: true },
    });

    const averageRating =
      allReviews.length > 0
        ? allReviews.reduce((sum: number, r) => sum + r.rating, 0) /
          allReviews.length
        : 0;

    await prisma.product.update({
      where: { id: existingReview.productId },
      data: {
        averageRating,
        reviewCount: allReviews.length,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json(
      { error: 'Failed to delete review' },
      { status: 500 }
    );
  }
}
