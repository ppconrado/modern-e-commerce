import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// Validação para criar/atualizar cupom
const CouponSchema = z.object({
  code: z.string().min(3).max(50).toUpperCase(),
  description: z.string().min(10).max(255),
  discountType: z.enum(['PERCENTAGE', 'FIXED']),
  discountValue: z.number().positive(),
  maxUses: z.number().int().positive().nullable().optional(),
  minimumAmount: z.number().nonnegative().default(0),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  isActive: z.boolean().default(true),
  applicableCategories: z.string().optional(), // JSON string
});

// GET /api/admin/coupons - Listar todos os cupons
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
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
    logger.error('Error fetching coupons', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to fetch coupons' },
      { status: 500 }
    );
  }
}

// POST /api/admin/coupons - Criar novo cupom
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validation = CouponSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid coupon data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Verificar se cupom já existe
    const existing = await prisma.coupon.findFirst({
      where: { code: data.code },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Coupon ${data.code} already exists` },
        { status: 409 }
      );
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: data.code,
        description: data.description,
        discountType: data.discountType,
        discountValue: data.discountValue,
        maxUses: data.maxUses,
        minimumAmount: data.minimumAmount,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        isActive: data.isActive,
        applicableCategories: data.applicableCategories || null,
      },
    });

    logger.info('Coupon created', { couponCode: coupon.code, userId: session.user.id });

    return NextResponse.json({ coupon }, { status: 201 });
  } catch (error) {
    logger.error('Error creating coupon', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to create coupon' },
      { status: 500 }
    );
  }
}
