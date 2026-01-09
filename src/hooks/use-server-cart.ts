import { useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useCartStore } from '@/store/cart';
import type { Product } from '@/types';

export function useServerCart() {
  const { data: session } = useSession();
  const store = useCartStore();
  const { setCart, setCartId, getItemIdByProductId, applyCoupon: applyStoreCoupon, removeCoupon: removeStoreCoupon } = store;

  // Inicializar ou recuperar carrinho ao montar
  useEffect(() => {
    const initializeCart = async () => {
      try {
        // Se usuário está logado
        if (session?.user?.id) {
          const res = await fetch('/api/cart');
          if (res.ok) {
            const data = await res.json();
            if (data.cart) {
              setCart(data.cart);
              setCartId(data.cart.id);
            }
          } else {
            console.error('Failed to fetch cart:', res.status, res.statusText);
          }
        } else {
          // Usuário anônimo - verificar se há ID salvo
          const savedAnonId = localStorage.getItem('anonCartId');
          if (savedAnonId) {
            const res = await fetch(`/api/cart?cartId=${savedAnonId}`);
            if (res.ok) {
              const data = await res.json();
              if (data.cart) {
                setCart(data.cart);
                setCartId(data.cart.id, data.cart.anonymousId);
              }
            } else {
              console.error('Failed to fetch anonymous cart:', res.status);
            }
          } else {
            // Gerar novo ID anônimo (será criado no primeiro POST)
            const newAnonId = `anon_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
            localStorage.setItem('anonCartId', newAnonId);
            setCartId('', newAnonId);
          }
        }
      } catch (error) {
        console.error('Error initializing cart:', error);
      }
    };

    initializeCart();
  }, [session?.user?.id, setCart, setCartId]);

  const addToCart = useCallback(
    async (product: Product, quantity: number = 1) => {
      try {
        const response = await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: product.id, quantity }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao adicionar ao carrinho');
        }

        const { cart } = await response.json();
        setCart(cart);

        return { success: true, cart };
      } catch (error: any) {
        console.error('Error adding to cart:', error);
        return { success: false, error: error.message };
      }
    },
    [setCart]
  );

  const updateItemQuantity = useCallback(
    async (productId: string, quantity: number) => {
      try {
        const itemId = getItemIdByProductId(productId);
        if (!itemId) {
          throw new Error('Item não encontrado no carrinho');
        }

        const response = await fetch(`/api/cart/${itemId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quantity }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao atualizar item');
        }

        const { cart } = await response.json();
        setCart(cart);

        return { success: true, cart };
      } catch (error: any) {
        console.error('Error updating cart item:', error);
        return { success: false, error: error.message };
      }
    },
    [getItemIdByProductId, setCart]
  );

  const removeFromCart = useCallback(
    async (productId: string) => {
      try {
        const itemId = getItemIdByProductId(productId);
        if (!itemId) {
          throw new Error('Item não encontrado no carrinho');
        }

        const response = await fetch(`/api/cart/${itemId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao remover item');
        }

        const { cart } = await response.json();
        setCart(cart);

        return { success: true, cart };
      } catch (error: any) {
        console.error('Error removing from cart:', error);
        return { success: false, error: error.message };
      }
    },
    [getItemIdByProductId, setCart]
  );

  const applyCoupon = useCallback(
    async (couponCode: string) => {
      try {
        if (!store.cartId) {
          throw new Error('Carrinho não inicializado');
        }

        const response = await fetch('/api/cart/apply-coupon', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            couponCode: couponCode.toUpperCase(),
            cartId: store.cartId,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao aplicar cupom');
        }

        const { cart, coupon } = await response.json();
        setCart(cart);
        applyStoreCoupon({
          code: coupon.code,
          discountAmount: cart.discountAmount,
          total: cart.total,
        });

        return { success: true, cart, coupon };
      } catch (error: any) {
        console.error('Error applying coupon:', error);
        return { success: false, error: error.message };
      }
    },
    [store.cartId, setCart, applyStoreCoupon]
  );

  const removeCoupon = useCallback(
    async () => {
      try {
        if (!store.cartId) {
          throw new Error('Carrinho não inicializado');
        }

        const response = await fetch('/api/cart/remove-coupon', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cartId: store.cartId }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao remover cupom');
        }

        const { cart } = await response.json();
        setCart(cart);
        removeStoreCoupon();

        return { success: true, cart };
      } catch (error: any) {
        console.error('Error removing coupon:', error);
        return { success: false, error: error.message };
      }
    },
    [store.cartId, setCart, removeStoreCoupon]
  );

  return {
    items: store.items,
    cartId: store.cartId,
    discountAmount: store.discountAmount,
    subtotal: store.subtotal,
    total: store.total,
    couponCode: store.couponCode,
    getTotalItems: store.getTotalItems,
    getTotalPrice: store.getTotalPrice,
    addToCart,
    updateItemQuantity,
    removeFromCart,
    applyCoupon,
    removeCoupon,
    clearCart: store.clearCart,
  };
}
