// website/store/cartStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Minimal CartItem definition
export type CartItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  sku: string;
  quantityInCart: number;
};

interface CartState {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantityInCart'>, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateItemQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getCartTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addToCart: (item, quantity = 1) =>
        set((state) => {
          const existingItemIndex = state.items.findIndex(
            (cartItem) => cartItem.id === item.id
          );
          if (existingItemIndex > -1) {
            // Product already in cart, update quantity
            const updatedItems = state.items.map((cartItem, index) =>
              index === existingItemIndex
                ? { ...cartItem, quantityInCart: cartItem.quantityInCart + quantity }
                : cartItem
            );
            return { items: updatedItems };
          } else {
            // Product not in cart, add new item
            return {
              items: [...state.items, { ...item, quantityInCart: quantity }],
            };
          }
        }),

      removeFromCart: (productId) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== productId),
        })),

      updateItemQuantity: (productId, quantity) =>
        set((state) => ({
          items: state.items
            .map((item) =>
              item.id === productId
                ? { ...item, quantityInCart: Math.max(0, quantity) }
                : item
            )
            .filter((item) => item.quantityInCart > 0),
        })),

      clearCart: () => set({ items: [] }),

      getItemCount: () => {
        return get().items.reduce((total, item) => total + item.quantityInCart, 0);
      },

      getCartTotal: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantityInCart,
          0
        );
      },
    }),
    {
      name: 'microfluidic-webshop-cart',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Optional: Log cart changes during development
if (process.env.NODE_ENV === 'development') {
  useCartStore.subscribe((state, prevState) => {
    console.log('Cart changed. New items:', state.items);
  });
} 