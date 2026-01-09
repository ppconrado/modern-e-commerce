import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

/**
 * Obtém ou cria um carrinho para o usuário (autenticado ou anônimo)
 * @param anonymousCartId - ID do carrinho anônimo (se aplicável)
 * @param includeItems - Se deve incluir items (apenas quando necessário para evitar N+1 queries)
 */
export async function getOrCreateCart(anonymousCartId?: string, includeItems = false) {
  const session = await auth();

  const cartInclude = includeItems 
    ? { items: { include: { product: true } } }
    : undefined;

  if (session?.user?.id) {
    // Usuário autenticado
    let cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: cartInclude,
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: session.user.id },
        include: cartInclude,
      });
    }

    return { cart, isAnonymous: false, userId: session.user.id };
  } else {
    // Usuário anônimo - usar ID fornecido ou gerar novo
    const anonymousId = anonymousCartId || generateAnonymousId();

    let cart = await prisma.cart.findUnique({
      where: { anonymousId },
      include: cartInclude,
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { anonymousId },
        include: cartInclude,
      });
    }

    return { cart, isAnonymous: true, anonymousId };
  }
}

export function generateAnonymousId(): string {
  // Gerar UUID-like ID para carrinho anônimo
  return `anon_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
}

export async function recalculateCartTotals(
  cartId: string,
  // 🔴 NOVO: Aceitar items já carregados para evitar query extra
  preloadedItems?: any[]
) {
  let cart;
  let items;

  // Se items já foram carregados, não fazer query novamente
  if (preloadedItems) {
    items = preloadedItems;
    cart = await prisma.cart.findUnique({
      where: { id: cartId },
    });
  } else {
    // Caso contrário, fazer query completa
    cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: { items: { include: { product: true } } },
    });
    items = cart?.items || [];
  }

  if (!cart) return null;

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  let discountAmount = 0;
  let couponCode = cart.couponCode;

  // Se carrinho está vazio, remover cupom
  if (items.length === 0) {
    couponCode = null;
    discountAmount = 0;
  } else if (cart.couponCode) {
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
    } else {
      // Cupom inválido - remover
      couponCode = null;
    }
  }

  const total = Math.max(0, subtotal - discountAmount);

  return await prisma.cart.update({
    where: { id: cartId },
    data: {
      subtotal: parseFloat(subtotal.toFixed(2)),
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
      couponCode,
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
  // Normalizar código do cupom para evitar erros por espaços/capitalização
  const normalized = couponCode.trim().toUpperCase();

  // Buscar de forma case-insensitive (mais robusto) e tolerante a espaços
  const coupon = await prisma.coupon.findFirst({
    where: { code: { equals: normalized, mode: 'insensitive' } },
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

  // 🔴 NOVO: Validar se carrinho tem itens (não permite cupom em carrinho vazio)
  if (cart.items.length === 0) {
    return { valid: false, error: 'Carrinho vazio - não é possível aplicar cupom' };
  }

  // 🔴 NOVO: Validar se cupom já foi aplicado a este carrinho
  const existingUsage = await prisma.couponUsage.findUnique({
    where: { couponId_cartId: { couponId: coupon.id, cartId } },
  });

  if (existingUsage) {
    return { valid: false, error: 'Este cupom já foi aplicado a este carrinho' };
  }

  const subtotal = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  if (subtotal < coupon.minimumAmount) {
    return {
      valid: false,
      error: `Compra mínima de $${coupon.minimumAmount} necessária (sua compra: $${subtotal})`,
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
