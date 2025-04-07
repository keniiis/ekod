// src/store/cart.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
}

// Wrap the store definition with the persist middleware
export const useCartStore = create(
  persist<CartStore>(
    // The first argument to persist is the store setup function (set, get)
    (set) => ({
      items: [],
      // Define actions within the setup function
      addItem: (item) => set((state) => {
        const existingItem = state.items.find((i) => i.id === item.id);
        if (existingItem) {
          // Update quantity if item exists
          return {
            items: state.items.map((i) =>
              i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
            ),
          };
        }
        // Add new item if it doesn't exist
        return { items: [...state.items, { ...item, quantity: 1 }] };
      }),
      removeItem: (id) => set((state) => ({
        items: state.items.filter((item) => item.id !== id),
      })),
      updateQuantity: (id, quantity) => set((state) => ({
        items: state.items.map((item) =>
          item.id === id ? { ...item, quantity: Math.max(0, quantity) } : item // Ensure quantity doesn't go below 0
        ).filter(item => item.quantity > 0), // Optionally remove if quantity is 0
      })),
      clearCart: () => set({ items: [] }),
    }),
    // The second argument to persist is the configuration object
    {
      name: 'cart-storage', // Unique name for localStorage key
      storage: createJSONStorage(() => localStorage), // Use localStorage for persistence
    }
  )
);
