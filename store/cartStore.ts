// website/store/cartStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AnyProduct } from '@/lib/types'; // Assuming your product types are here

// Revised CartItem definition
export type CartItem = AnyProduct & {
  quantityInCart: number;
};

interface CartState {
  items: CartItem[];
  addToCart: (product: AnyProduct, quantity?: number) => void;
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

      addToCart: (product, quantity = 1) =>
        set((state) => {
          const existingItemIndex = state.items.findIndex(
            (item) => item.id === product.id
          );
          if (existingItemIndex > -1) {
            // Product already in cart, update quantity
            const updatedItems = state.items.map((item, index) =>
              index === existingItemIndex
                ? { ...item, quantityInCart: item.quantityInCart + quantity }
                : item
            );
            return { items: updatedItems };
          } else {
            // Product not in cart, add new item
            return {
              items: [...state.items, { ...product, quantityInCart: quantity }],
            };
          }
        }),

      removeFromCart: (productId) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== productId),
        })),

      updateItemQuantity: (productId, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === productId
              ? { ...item, quantityInCart: Math.max(0, quantity) } // Ensure quantity isn't negative
              : item
          ).filter(item => item.quantityInCart > 0), // Remove item if quantity becomes 0
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
      name: 'microfluidic-webshop-cart', // Name for the localStorage key
      storage: createJSONStorage(() => localStorage), // Use localStorage for persistence
    }
  )
);

// Optional: Log cart changes during development
if (process.env.NODE_ENV === 'development') {
  useCartStore.subscribe((state, prevState) => {
    console.log('Cart changed. New items:', state.items);
  });
} 