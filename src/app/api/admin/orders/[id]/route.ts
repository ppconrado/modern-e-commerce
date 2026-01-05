import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateOrderSchema = z.object({
  status: z.enum([
    'PENDING',
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
  ]),
});

// GET /api/admin/orders/[id] - Get single order with full details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (
      !session ||
      (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        User: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        OrderItem: {
          include: {
            Product: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Failed to fetch order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/orders/[id] - Update order status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (
      !session ||
      (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = updateOrderSchema.parse(body);

    const order = await prisma.order.update({
      where: { id },
      data: {
        status: validatedData.status,
        updatedAt: new Date(),
      },
      include: {
        User: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        OrderItem: {
          include: {
            Product: true,
          },
        },
      },
    });

    return NextResponse.json({ order });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid order status' },
        { status: 400 }
      );
    }
    console.error('Failed to update order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}
