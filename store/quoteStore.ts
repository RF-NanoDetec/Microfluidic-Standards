import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { toast } from 'sonner';

// Define the structure for an item in the quote
export interface QuoteItem {
  id: string; // Unique identifier for the product/variant
  name: string;
  imageUrl?: string;
  // Price might not be directly relevant for a quote item, or could be indicative
  // For now, let's omit price, but it can be added if needed for display.
  // price: number; 
  quantity: number; // How many units the user is interested in for the quote
  notes?: string; // User-specific notes for this particular item in the quote
  // Add any other product-specific details that might be relevant for a quote
  // e.g., key attributes like material, dimensions, if not part of the name
  attributes?: Record<string, string | number>; 
}

// Define the state and actions for the quote store
interface QuoteState {
  items: QuoteItem[];
  addToQuote: (item: Omit<QuoteItem, 'quantity' | 'notes'>, quantity?: number, notes?: string) => void;
  removeFromQuote: (itemId: string) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;
  updateItemNotes: (itemId:string, notes: string) => void;
  clearQuote: () => void;
  getItemCount: () => number;
  // getQuoteTotal might not be applicable if items don't have fixed prices for quotes
}

export const useQuoteStore = create<QuoteState>()(
  persist(
    (set, get) => ({
      items: [],

      addToQuote: (newItemDetails, quantity = 1, notes = '') => {
        set((state) => {
          const existingItemIndex = state.items.findIndex(
            (item) => item.id === newItemDetails.id
          );

          let updatedItems;
          if (existingItemIndex > -1) {
            // Item already exists, update its quantity and notes
            updatedItems = state.items.map((item, index) =>
              index === existingItemIndex
                ? { 
                    ...item, 
                    quantity: item.quantity + quantity,
                    notes: notes || item.notes // Keep existing notes if new notes are empty
                  }
                : item
            );
            toast.success(`${newItemDetails.name} quantity updated in quote.`);
          } else {
            // Item is new, add it to the quote
            const itemToAdd: QuoteItem = {
              ...newItemDetails,
              quantity,
              notes,
            };
            updatedItems = [...state.items, itemToAdd];
            toast.success(`${newItemDetails.name} added to quote request.`);
          }
          return { items: updatedItems };
        });
      },

      removeFromQuote: (itemId: string) => {
        set((state) => {
          const itemToRemove = state.items.find(item => item.id === itemId);
          if (itemToRemove) {
            toast.error(`${itemToRemove.name} removed from quote request.`);
          }
          return {
            items: state.items.filter((item) => item.id !== itemId),
          };
        });
      },

      updateItemQuantity: (itemId: string, quantity: number) => {
        set((state) => {
          if (quantity < 1) {
            // If quantity becomes less than 1, remove the item
            // Alternatively, clamp to 1: Math.max(1, quantity)
            const itemToRemove = state.items.find(item => item.id === itemId);
            if (itemToRemove) {
              toast.error(`${itemToRemove.name} removed from quote as quantity set to zero.`);
            }
            return { items: state.items.filter((item) => item.id !== itemId) };
          }
          const itemToUpdate = state.items.find(item => item.id === itemId);
          if (itemToUpdate) {
            toast.info(`Quantity updated for ${itemToUpdate.name} in quote.`);
          }
          return {
            items: state.items.map((item) =>
              item.id === itemId ? { ...item, quantity } : item
            ),
          };
        });
      },

      updateItemNotes: (itemId: string, notes: string) => {
        set((state) => {
          const itemToUpdate = state.items.find(item => item.id === itemId);
          if (itemToUpdate) {
            toast.info(`Notes updated for ${itemToUpdate.name} in quote.`);
          }
          return {
            items: state.items.map((item) =>
              item.id === itemId ? { ...item, notes } : item
            ),
          };
        });
      },
      
      clearQuote: () => {
        set({ items: [] });
        toast.warning("All items cleared from quote request.");
      },

      getItemCount: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
    }),
    {
      name: 'quote-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
    }
  )
);

// Example usage (for testing or demonstrating):
// const { addToQuote, items } = useQuoteStore.getState();
// addToQuote({ id: 'prod1', name: 'Super Chip 1000', imageUrl: '/chip.jpg', attributes: { material: 'Glass', size: '10mm'} }, 2, 'Needs custom coating');
// console.log(items);
