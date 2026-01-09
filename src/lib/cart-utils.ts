import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function getOrCreateCart(anonymousCartId?: string) {
  const session = await auth();
  
  if (session?.user?.id) {
    // Usuário autenticado
    let cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: { items: { include: { product: true } } },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: session.user.id },
        include: { items: { include: { product: true } } },
      });
    }

    return { cart, isAnonymous: false, userId: session.user.id };
  } else {
    // Usuário anônimo - usar ID fornecido ou gerar novo
    const anonymousId = anonymousCartId || generateAnonymousId();
    
    let cart = await prisma.cart.findUnique({
      where: { anonymousId },
      include: { items: { include: { product: true } } },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { anonymousId },
        include: { items: { include: { product: true } } },
      });
    }

    return { cart, isAnonymous: true, anonymousId };
  }
}

export function generateAnonymousId(): string {
  // Gerar UUID-like ID para carrinho anônimo
  return `anon_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
}

export async function recalculateCartTotals(cartId: string) {
  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: { items: { include: { product: true } } },
  });

  if (!cart) return null;

  const subtotal = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  let discountAmount = 0;
  if (cart.couponCode) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: cart.couponCode },
    });

    if (coupon && isCouponValid(coupon)) {
      discountAmount =
        coupon.discountType === 'PERCENTAGE'
          ? (subtotal * coupon.discountValue) / 100
          : coupon.discountValue;

      // Aplicar limites
      if (coupon.maxAmount && discountAmount > coupon.maxAmount) {
        discountAmount = coupon.maxAmount;
      }
    }
  }

  const total = Math.max(0, subtotal - discountAmount);

  return await prisma.cart.update({
    where: { id: cartId },
    data: {
      subtotal: parseFloat(subtotal.toFixed(2)),
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
    },
    include: { items: { include: { product: true } } },
  });
}

export function isCouponValid(coupon: any): boolean {
  const now = new Date();
  
  if (!coupon.isActive) return false;
  if (now < coupon.startDate || now > coupon.endDate) return false;
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) return false;
  
  return true;
}

export async function validateCouponForCart(
  couponCode: string,
  cartId: string
): Promise<{ valid: boolean; error?: string; coupon?: any }> {
  const coupon = await prisma.coupon.findUnique({
    where: { code: couponCode.toUpperCase() },
  });

  if (!coupon) {
    return { valid: false, error: 'Cupom não encontrado' };
  }

  if (!isCouponValid(coupon)) {
    return { valid: false, error: 'Cupom expirado ou inválido' };
  }

  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: { items: { include: { product: true } } },
  });

  if (!cart) {
    return { valid: false, error: 'Carrinho não encontrado' };
  }

  const subtotal = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  if (subtotal < coupon.minimumAmount) {
    return {
      valid: false,
      error: `Compra mínima de ${coupon.minimumAmount} necessária`,
    };
  }

  if (coupon.applicableCategories) {
    const categories = JSON.parse(coupon.applicableCategories);
    const hasValidCategory = cart.items.some((item) =>
      categories.includes(item.product.category)
    );

    if (!hasValidCategory) {
      return {
        valid: false,
        error: 'Este cupom não se aplica aos produtos do seu carrinho',
      };
    }
  }

  return { valid: true, coupon };
}
