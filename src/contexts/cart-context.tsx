'use client';

import { createContext, useContext, useCallback, useEffect, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { useCartStore } from '@/store/cart';
import type { Product } from '@/types';

interface CartContextValue {
  items: any[];
  cartId: string | null;
  discountAmount: number;
  subtotal: number;
  total: number;
  couponCode: string | null;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  addToCart: (product: Product, quantity?: number) => Promise<any>;
  updateItemQuantity: (productId: string, quantity: number) => Promise<any>;
  removeFromCart: (productId: string) => Promise<any>;
  applyCoupon: (couponCode: string) => Promise<any>;
  removeCoupon: () => Promise<any>;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();

  // Inicializar carrinho ao montar e quando session mudar
  useEffect(() => {
    // Só inicializar quando a sessão estiver carregada
    if (status === 'loading') return;

    const initializeCart = async () => {
      try {
        const { setCart, setCartId, clearCart } = useCartStore.getState();
        
        if (session?.user?.id) {
          // Usuário logado - buscar carrinho do servidor
          const res = await fetch('/api/cart');
          if (res.ok) {
            const data = await res.json();
            if (data.cart) {
              setCart(data.cart);
              setCartId(data.cart.id);
            }
          }
        } else {
          // Usuário NÃO logado - verificar se acabou de fazer logout
          const savedAnonId = localStorage.getItem('anonCartId');
          
          if (!savedAnonId) {
            // Não há ID anônimo salvo - criar novo
            const newAnonId = `anon_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
            localStorage.setItem('anonCartId', newAnonId);
            clearCart(); // Limpar carrinho anterior
            setCartId('', newAnonId);
          } else {
            // Há ID anônimo - tentar recuperar carrinho
            const res = await fetch(`/api/cart?cartId=${savedAnonId}`);
            if (res.ok) {
              const data = await res.json();
              if (data.cart) {
                setCart(data.cart);
                setCartId(data.cart.id, data.cart.anonymousId || data.anonymousId);
              } else {
                // Carrinho não existe - limpar
                clearCart();
              }
            }
          }
        }
      } catch (error) {
        console.error('Error initializing cart:', error);
      }
    };

    initializeCart();
  }, [session?.user?.id, status]);

  const addToCart = useCallback(
    async (product: Product, quantity: number = 1) => {
      try {
        const { cartId, anonymousId: storeAnonymousId } = useCartStore.getState();
        
        // Para usuários não logados, garantir que temos um anonymousId
        let anonymousId = storeAnonymousId;
        if (!session?.user?.id) {
          if (!anonymousId) {
            // Tentar pegar do localStorage
            const savedAnonId = localStorage.getItem('anonCartId');
            if (savedAnonId) {
              anonymousId = savedAnonId;
            } else {
              // Gerar novo ID
              anonymousId = `anon_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
              localStorage.setItem('anonCartId', anonymousId);
            }
            // Atualizar store com o anonymousId
            useCartStore.getState().setCartId(cartId || '', anonymousId);
          }
        }
        
        const response = await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            productId: product.id, 
            quantity,
            anonymousId: anonymousId || undefined
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          let error;
          try {
            error = JSON.parse(errorText);
          } catch {
            error = { error: errorText };
          }
          throw new Error(error.error || 'Erro ao adicionar ao carrinho');
        }

        const responseData = await response.json();
        const { cart, anonymousId: newAnonymousId } = responseData;
        
        // Se recebeu um novo anonymousId, salvar no localStorage
        if (newAnonymousId && !session?.user?.id) {
          localStorage.setItem('anonCartId', newAnonymousId);
          useCartStore.getState().setCartId(cart.id, newAnonymousId);
        }
        
        useCartStore.getState().setCart(cart);

        return { success: true, cart };
      } catch (error: any) {
        console.error('Error adding to cart:', error);
        return { success: false, error: error.message };
      }
    },
    [session?.user?.id]
  );

  const updateItemQuantity = useCallback(
    async (productId: string, quantity: number) => {
      try {
        const { anonymousId } = useCartStore.getState();

        // Build request body - only include anonymousId if it exists
        const body: { productId: string; quantity: number; anonymousId?: string } = { 
          productId, 
          quantity 
        };
        if (anonymousId) {
          body.anonymousId = anonymousId;
        }

        // Call PATCH /api/cart with productId, quantity, and anonymousId if available
        const response = await fetch(`/api/cart`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao atualizar item');
        }

        const { cart } = await response.json();
        useCartStore.getState().setCart(cart);

        return { success: true, cart };
      } catch (error: any) {
        console.error('Error updating cart item:', error);
        return { success: false, error: error.message };
      }
    },
    []
  );

  const removeFromCart = useCallback(
    async (productId: string) => {
      try {
        const { anonymousId } = useCartStore.getState();
        
        console.log('🗑️ Remove from cart:', {
          productId,
          anonymousId,
          hasAnonymousId: !!anonymousId,
          isAuthenticated: !!session?.user?.id,
          sessionUser: session?.user?.email,
        });

        // Build request body - only include anonymousId if it exists
        const body: { productId: string; anonymousId?: string } = { productId };
        if (anonymousId) {
          body.anonymousId = anonymousId;
        }

        console.log('🗑️ Request body:', body);

        // Call DELETE /api/cart with productId and anonymousId if available
        const response = await fetch(`/api/cart`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        console.log('🗑️ Response status:', response.status);

        if (!response.ok) {
          const error = await response.json();
          console.error('🗑️ Error response:', error);
          throw new Error(error.error || 'Erro ao remover item');
        }

        const { cart } = await response.json();
        useCartStore.getState().setCart(cart);

        return { success: true, cart };
      } catch (error: any) {
        console.error('Error removing from cart:', error);
        return { success: false, error: error.message };
      }
    },
    [session?.user?.id, session?.user?.email]
  );

  const applyCoupon = useCallback(
    async (couponCode: string) => {
      try {
        const { cartId, setCart, applyCoupon: applyStoreCoupon, couponCode: appliedCode, total, discountAmount } = useCartStore.getState();
        if (!cartId) {
          throw new Error('Carrinho não inicializado');
        }

        // Normalizar código do cupom: remover espaços e padronizar maiúsculas
        const normalizedCode = couponCode.trim().toUpperCase();
        console.log('🎯 Applying coupon:', { normalizedCode, cartId, appliedCode });

        // Idempotência no cliente: se o mesmo cupom já está aplicado, retornar sucesso imediato
        if (appliedCode && appliedCode.toUpperCase() === normalizedCode) {
          return { success: true, cart: { total, discountAmount }, coupon: { code: normalizedCode } };
        }

        const response = await fetch('/api/cart/apply-coupon', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            couponCode: normalizedCode,
            cartId,
          }),
        });

        if (!response.ok) {
          let error;
          let responseText = '';
          try {
            // Clonar o response para poder ler o body duas vezes se necessário
            responseText = await response.clone().text();
            console.log('📄 Raw response text:', responseText, 'Length:', responseText.length);
            
            if (responseText && responseText.trim()) {
              error = JSON.parse(responseText);
              console.log('✅ Parsed JSON:', error);
            } else {
              console.warn('⚠️ Response text is empty');
              error = { error: 'Servidor retornou resposta vazia' };
            }
          } catch (e) {
            console.warn('⚠️ Failed to parse error response:', e);
            console.log('📄 Original responseText:', responseText);
            error = { error: responseText || 'Erro ao processar resposta do servidor' };
          }
          
          const errorMessage = error?.error || error?.message || String(error) || 'Erro ao aplicar cupom';
          console.warn('⚠️ API error full:', { error, status: response.status, statusText: response.statusText, message: errorMessage });
          throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log('✅ Coupon API response:', data);
        
        const { cart, coupon } = data;
        setCart(cart);
        applyStoreCoupon({
          code: coupon.code,
          discountAmount: cart.discountAmount,
          total: cart.total,
        });

        return { success: true, cart, coupon };
      } catch (error: any) {
        console.warn('⚠️ Error applying coupon:', error);
        return { success: false, error: error.message };
      }
    },
    []
  );

  const removeCoupon = useCallback(
    async () => {
      try {
        const { cartId, setCart, removeCoupon: removeStoreCoupon } = useCartStore.getState();
        if (!cartId) {
          throw new Error('Carrinho não inicializado');
        }

        const response = await fetch('/api/cart/remove-coupon', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cartId }),
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
    []
  );

  const store = useCartStore();

  const value: CartContextValue = {
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

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
