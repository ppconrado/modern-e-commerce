import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@/types';

export interface CartItemWithId {
  id: string; // ID do CartItem no servidor
  product: Product;
  quantity: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartStore {
  items: CartItemWithId[];
  cartId: string | null;
  anonymousId: string | null;
  discountAmount: number;
  subtotal: number;
  total: number;
  couponCode: string | null;
  
  // Local actions (for optimistic UI)
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  
  // Server sync actions
  setCart: (cart: any) => void;
  setCartId: (cartId: string | null, anonymousId?: string) => void;
  applyCoupon: (coupon: any) => void;
  removeCoupon: () => void;
  getItemIdByProductId: (productId: string) => string | undefined;
  syncWithServer: () => Promise<void>;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      cartId: null,
      anonymousId: null,
      discountAmount: 0,
      subtotal: 0,
      total: 0,
      couponCode: null,

      addItem: (product) => {
        const items = get().items;
        const existingItem = items.find(
          (item) => item.product.id === product.id
        );

        if (existingItem) {
          set({
            items: items.map((item) =>
              item.product.id === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            ),
          });
        } else {
          set({
            items: [
              ...items,
              { id: '', product, quantity: 1 }, // ID será preenchido pelo servidor
            ],
          });
        }
      },

      removeItem: (productId) => {
        set({
          items: get().items.filter((item) => item.product.id !== productId),
        });
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }

        set({
          items: get().items.map((item) =>
            item.product.id === productId ? { ...item, quantity } : item
          ),
        });
      },

      clearCart: () => {
        set({
          items: [],
          couponCode: null,
          discountAmount: 0,
          subtotal: 0,
          total: 0,
        });
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        return (
          get().total ||
          get().items.reduce(
            (total, item) => total + item.product.price * item.quantity,
            0
          )
        );
      },

      getItemIdByProductId: (productId: string) => {
        const item = get().items.find((item) => item.product.id === productId);
        return item?.id;
      },

      setCart: (cart) => {
        if (!cart || !cart.items) {
          // Se carrinho for null ou inválido, apenas limpar
          set({
            items: [],
            discountAmount: 0,
            subtotal: 0,
            total: 0,
            couponCode: null,
          });
          return;
        }

        const items =
          cart.items?.map((item: any) => ({
            id: item.id,
            product: item.product,
            quantity: item.quantity,
          })) || [];

        set({
          items,
          cartId: cart.id,
          discountAmount: cart.discountAmount || 0,
          subtotal: cart.subtotal || 0,
          total: cart.total || 0,
          couponCode: cart.couponCode || null,
        });
      },

      setCartId: (cartId, anonymousId) => {
        set({
          cartId,
          anonymousId: anonymousId || null,
        });
      },

      applyCoupon: (coupon) => {
        set({
          couponCode: coupon.code,
          discountAmount: coupon.discountAmount || 0,
          total: coupon.total || get().total,
        });
      },

      removeCoupon: () => {
        set({
          couponCode: null,
          discountAmount: 0,
        });
      },

      syncWithServer: async () => {
        // Placeholder para sincronização com servidor
        // Implementar conforme necessário
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);
