import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const UpdateCouponSchema = z.object({
  description: z.string().min(10).max(255).optional(),
  discountType: z.enum(['PERCENTAGE', 'FIXED']).optional(),
  discountValue: z.number().positive().optional(),
  maxUses: z.number().int().positive().nullable().optional(),
  minimumAmount: z.number().nonnegative().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isActive: z.boolean().optional(),
  applicableCategories: z.string().optional(),
});

// GET /api/admin/coupons/[id] - Obter cupom específico
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const coupon = await prisma.coupon.findUnique({
      where: { id },
    });

    if (!coupon) {
      return NextResponse.json(
        { error: 'Coupon not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ coupon });
  } catch (error) {
    logger.error('Error fetching coupon', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to fetch coupon' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/coupons/[id] - Atualizar cupom
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const validation = UpdateCouponSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid coupon data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const coupon = await prisma.coupon.findUnique({
      where: { id },
    });

    if (!coupon) {
      return NextResponse.json(
        { error: 'Coupon not found' },
        { status: 404 }
      );
    }

    const data = validation.data;
    const updateData: any = {};

    // Só atualizar campos fornecidos
    if (data.description !== undefined) updateData.description = data.description;
    if (data.discountType !== undefined) updateData.discountType = data.discountType;
    if (data.discountValue !== undefined) updateData.discountValue = data.discountValue;
    if (data.maxUses !== undefined) updateData.maxUses = data.maxUses;
    if (data.minimumAmount !== undefined) updateData.minimumAmount = data.minimumAmount;
    if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate);
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.applicableCategories !== undefined) updateData.applicableCategories = data.applicableCategories;

    const updated = await prisma.coupon.update({
      where: { id },
      data: updateData,
    });

    logger.info('Coupon updated', { couponCode: updated.code, userId: session.user.id });

    return NextResponse.json({ coupon: updated });
  } catch (error) {
    logger.error('Error updating coupon', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to update coupon' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/coupons/[id] - Deletar cupom
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const coupon = await prisma.coupon.findUnique({
      where: { id },
    });

    if (!coupon) {
      return NextResponse.json(
        { error: 'Coupon not found' },
        { status: 404 }
      );
    }

    // Delete associated usage records
    await prisma.couponUsage.deleteMany({
      where: { couponId: id },
    });

    await prisma.coupon.delete({
      where: { id },
    });

    logger.info('Coupon deleted', { couponCode: coupon.code, userId: session.user.id });

    return NextResponse.json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    logger.error('Error deleting coupon', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to delete coupon' },
      { status: 500 }
    );
  }
}
