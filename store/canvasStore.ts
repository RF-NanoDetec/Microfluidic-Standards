import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CanvasItemData, Connection } from '@/lib/microfluidic-designer/types';

interface CanvasState {
  droppedItems: CanvasItemData[];
  connections: Connection[];
  setDroppedItems: (items: CanvasItemData[]) => void;
  setConnections: (connections: Connection[]) => void;
  addItem: (item: CanvasItemData) => void;
  updateItemPosition: (itemId: string, x: number, y: number) => void;
  updateItemDetails: (itemId: string, newDetails: Partial<CanvasItemData>) => void;
  removeItem: (itemId: string) => void;
  addConnection: (connection: Connection) => void;
  removeConnection: (connectionId: string) => void;
  updateConnectionDetails: (connectionId: string, newDetails: Partial<Connection>) => void;
  resetCanvas: () => void;
}

export const useCanvasStore = create<CanvasState>()(
  persist(
    (set) => ({
      droppedItems: [],
      connections: [],
      setDroppedItems: (items) => set({ droppedItems: items }),
      setConnections: (connections) => set({ connections }),
      addItem: (item) => set((state) => ({ droppedItems: [...state.droppedItems, item] })),
      updateItemPosition: (itemId, x, y) =>
        set((state) => ({
          droppedItems: state.droppedItems.map((item) =>
            item.id === itemId ? { ...item, x, y } : item
          ),
        })),
      updateItemDetails: (itemId, newDetails) =>
        set((state) => ({
          droppedItems: state.droppedItems.map((item) =>
            item.id === itemId ? { ...item, ...newDetails } : item
          ),
        })),
      removeItem: (itemId) =>
        set((state) => ({
          droppedItems: state.droppedItems.filter((item) => item.id !== itemId),
          connections: state.connections.filter(
            (conn) => conn.fromItemId !== itemId && conn.toItemId !== itemId
          ),
        })),
      addConnection: (connection) =>
        set((state) => ({ connections: [...state.connections, connection] })),
      removeConnection: (connectionId) =>
        set((state) => ({
          connections: state.connections.filter((conn) => conn.id !== connectionId),
        })),
      updateConnectionDetails: (connectionId, newDetails) =>
        set((state) => ({
          connections: state.connections.map((conn) =>
            conn.id === connectionId ? { ...conn, ...newDetails } : conn
          ),
        })),
      resetCanvas: () => set({ droppedItems: [], connections: [] }),
    }),
    {
      name: 'canvas-storage', // Name for the localStorage key
      storage: createJSONStorage(() => localStorage), // Use localStorage for persistence
      // Optionally, you can specify which parts of the state to persist:
      // partialize: (state) => ({ droppedItems: state.droppedItems, connections: state.connections }),
    }
  )
);

// Optional: Log store changes during development
if (process.env.NODE_ENV === 'development') {
  useCanvasStore.subscribe((state, prevState) => {
    console.log('Canvas store changed:');
    if (state.droppedItems !== prevState.droppedItems) {
      console.log('  Dropped items:', state.droppedItems);
    }
    if (state.connections !== prevState.connections) {
      console.log('  Connections:', state.connections);
    }
  });
} 