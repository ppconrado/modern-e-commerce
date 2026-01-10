import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const couponUpdateSchema = z.object({
  description: z.string().min(10).max(255).optional(),
  discountType: z.enum(['PERCENTAGE', 'FIXED']).optional(),
  discountValue: z.number().positive().optional(),
  maxUses: z.number().int().positive().optional().nullable(),
  minimumAmount: z.number().nonnegative().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isActive: z.boolean().optional(),
  applicableCategories: z.string().optional(),
});

// GET /api/admin/coupons/[id] - Get single coupon (admin only)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (
      !session ||
      (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const coupon = await prisma.coupon.findUnique({
      where: { id },
    });

    if (!coupon) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    return NextResponse.json({ coupon });
  } catch (error) {
    console.error('Failed to fetch coupon:', error);
    return NextResponse.json({ error: 'Failed to fetch coupon' }, { status: 500 });
  }
}

// PATCH /api/admin/coupons/[id] - Update coupon (admin only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (
      !session ||
      (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const validatedData = couponUpdateSchema.parse(body);

    const coupon = await prisma.coupon.findUnique({
      where: { id },
    });

    if (!coupon) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    const updateData: any = {};

    // Only update provided fields
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.discountType !== undefined) updateData.discountType = validatedData.discountType;
    if (validatedData.discountValue !== undefined) updateData.discountValue = validatedData.discountValue;
    if (validatedData.maxUses !== undefined) updateData.maxUses = validatedData.maxUses;
    if (validatedData.minimumAmount !== undefined) updateData.minimumAmount = validatedData.minimumAmount;
    if (validatedData.startDate !== undefined) updateData.startDate = new Date(validatedData.startDate);
    if (validatedData.endDate !== undefined) updateData.endDate = new Date(validatedData.endDate);
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive;
    if (validatedData.applicableCategories !== undefined) {
      updateData.applicableCategories = validatedData.applicableCategories;
    }

    const updated = await prisma.coupon.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ coupon: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Failed to update coupon:', error);
    return NextResponse.json({ error: 'Failed to update coupon' }, { status: 500 });
  }
}

// DELETE /api/admin/coupons/[id] - Delete coupon (admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (
      !session ||
      (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const coupon = await prisma.coupon.findUnique({
      where: { id },
    });

    if (!coupon) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    // Delete associated usage records
    await prisma.couponUsage.deleteMany({
      where: { couponId: id },
    });

    await prisma.coupon.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    console.error('Failed to delete coupon:', error);
    return NextResponse.json({ error: 'Failed to delete coupon' }, { status: 500 });
  }
}
