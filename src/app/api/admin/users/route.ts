import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Get all users (ADMIN and SUPER_ADMIN)
export async function GET() {
  try {
    const session = await auth();

    if (
      !session?.user ||
      (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            Order: true,
            Review: true,
            Address: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate total spent for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const orders = await prisma.order.findMany({
          where: {
            userId: user.id,
            status: 'DELIVERED',
          },
          select: {
            total: true,
          },
        });

        const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);

        return {
          ...user,
          totalSpent,
          orderCount: user._count.Order,
          reviewCount: user._count.Review,
          addressCount: user._count.Address,
        };
      })
    );

    return NextResponse.json({ users: usersWithStats });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
