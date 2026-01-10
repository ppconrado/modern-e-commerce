import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const couponSchema = z.object({
  code: z.string().min(3).max(50).toUpperCase(),
  description: z.string().min(10).max(255),
  discountType: z.enum(['PERCENTAGE', 'FIXED']),
  discountValue: z.number().positive(),
  maxUses: z.number().int().positive().optional().nullable(),
  minimumAmount: z.number().nonnegative().default(0),
  startDate: z.string(),
  endDate: z.string(),
  isActive: z.boolean().default(true),
  applicableCategories: z.string().optional(),
});

// GET /api/admin/coupons - List all coupons (admin only)
export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (
      !session ||
      (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        code: true,
        description: true,
        discountType: true,
        discountValue: true,
        maxUses: true,
        usedCount: true,
        minimumAmount: true,
        startDate: true,
        endDate: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ coupons });
  } catch (error) {
    console.error('Failed to fetch coupons:', error);
    return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 });
  }
}

// POST /api/admin/coupons - Create new coupon (admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (
      !session ||
      (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = couponSchema.parse(body);

    // Check if coupon already exists
    const existing = await prisma.coupon.findFirst({
      where: { code: validatedData.code },
    });

    if (existing) {
      return NextResponse.json({ error: 'Coupon code already exists' }, { status: 400 });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: validatedData.code,
        description: validatedData.description,
        discountType: validatedData.discountType,
        discountValue: validatedData.discountValue,
        maxUses: validatedData.maxUses,
        minimumAmount: validatedData.minimumAmount,
        startDate: new Date(validatedData.startDate),
        endDate: new Date(validatedData.endDate),
        isActive: validatedData.isActive,
        applicableCategories: validatedData.applicableCategories || null,
      },
    });

    return NextResponse.json({ coupon }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Failed to create coupon:', error);
    return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 });
  }
}
