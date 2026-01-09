import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET() {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    database: {
      connected: false,
      error: null,
      canQuery: false,
    },
    auth: {
      configured: false,
      hasSession: false,
    },
    cart: {
      canCreate: false,
      error: null,
    },
  };

  try {
    // 1. Testar conexão com banco
    await prisma.$queryRaw`SELECT 1`;
    diagnostics.database.connected = true;
    diagnostics.database.canQuery = true;

    // 2. Testar autenticação
    const session = await auth();
    diagnostics.auth.configured = true;
    diagnostics.auth.hasSession = !!session?.user?.id;
    diagnostics.auth.userId = session?.user?.id || null;

    // 3. Testar criação de carrinho anônimo
    const testAnonymousId = `test_${Date.now()}`;
    try {
      const testCart = await prisma.cart.create({
        data: {
          anonymousId: testAnonymousId,
          subtotal: 0,
          discountAmount: 0,
          total: 0,
        },
      });

      diagnostics.cart.canCreate = true;
      diagnostics.cart.testCartId = testCart.id;

      // Limpar o carrinho de teste
      await prisma.cart.delete({ where: { id: testCart.id } });
      diagnostics.cart.cleaned = true;
    } catch (cartError: any) {
      diagnostics.cart.error = cartError.message;
      diagnostics.cart.code = cartError.code;
    }

    // 4. Contar produtos disponíveis
    const productCount = await prisma.product.count();
    diagnostics.products = {
      total: productCount,
      available: await prisma.product.count({ where: { stock: { gt: 0 } } }),
    };

    return NextResponse.json({
      status: 'ok',
      diagnostics,
    });
  } catch (error: any) {
    diagnostics.database.error = error.message;
    diagnostics.database.code = error.code;

    return NextResponse.json(
      {
        status: 'error',
        diagnostics,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
