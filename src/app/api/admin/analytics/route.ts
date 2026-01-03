import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/analytics - Get analytics data (admin only)
export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (
      !session ||
      (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get total revenue
    const totalRevenue = await prisma.order.aggregate({
      where: {
        status: {
          in: ['PROCESSING', 'SHIPPED', 'DELIVERED'],
        },
      },
      _sum: {
        total: true,
      },
    });

    // Get total orders
    const totalOrders = await prisma.order.count();

    // Get total products
    const totalProducts = await prisma.product.count();

    // Get total customers
    const totalCustomers = await prisma.user.count({
      where: {
        role: 'CUSTOMER',
      },
    });

    // Get orders by status
    const ordersByStatus = await prisma.order.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    });

    // Get recent orders
    const recentOrders = await prisma.order.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        User: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        _count: {
          select: {
            OrderItem: true,
          },
        },
      },
    });

    // Get top selling products
    const topProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: {
        quantity: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 5,
    });

    // Get product details for top products
    const topProductsWithDetails = await Promise.all(
      topProducts.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: {
            id: true,
            name: true,
            image: true,
            price: true,
          },
        });
        return {
          ...product,
          totalSold: item._sum.quantity || 0,
          orderCount: item._count.id,
        };
      })
    );

    // Get revenue by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const revenueByMonth = await prisma.$queryRaw<
      Array<{ month: string; revenue: number }>
    >`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', "createdAt"), 'YYYY-MM') as month,
        SUM(total) as revenue
      FROM "Order"
      WHERE "createdAt" >= ${sixMonthsAgo}
        AND status IN ('PROCESSING', 'SHIPPED', 'DELIVERED')
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month DESC
    `;

    // Get low stock products
    const lowStockProducts = await prisma.product.findMany({
      where: {
        stock: {
          lte: 10,
        },
      },
      orderBy: {
        stock: 'asc',
      },
      take: 10,
      select: {
        id: true,
        name: true,
        stock: true,
        image: true,
        price: true,
      },
    });

    return NextResponse.json({
      overview: {
        totalRevenue: totalRevenue._sum.total || 0,
        totalOrders,
        totalProducts,
        totalCustomers,
      },
      ordersByStatus: ordersByStatus.map((item) => ({
        status: item.status,
        count: item._count.id,
      })),
      recentOrders,
      topProducts: topProductsWithDetails,
      revenueByMonth,
      lowStockProducts,
    });
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
