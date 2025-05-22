'use client';

import type { PaletteItemData } from "@/lib/microfluidic-designer/types";
import dynamic from 'next/dynamic';
import { ScrollArea } from "@/components/ui/scroll-area";

const PaletteItem = dynamic(() => import('./palette/PaletteItem'), {
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">Loading...</div>
});

// Define a type for the category keys based on CATEGORY_ORDER (still needed for prop typing)
// This could also be imported from types.ts if it were defined there globally
const CATEGORY_ORDER_FOR_TYPES = ["Microfluidic Chips", "Other"] as const;
type CategoryKey = typeof CATEGORY_ORDER_FOR_TYPES[number];

interface PaletteSidebarProps {
  orderedCategories: CategoryKey[];
  groupedItems: Record<CategoryKey, PaletteItemData[]>;
  getFilteredItems: (items: PaletteItemData[]) => PaletteItemData[];
  isOpen?: boolean;
  onToggle?: () => void;
}

export default function PaletteSidebar({ 
  orderedCategories, 
  groupedItems, 
  getFilteredItems,
  isOpen = true,
  onToggle
}: PaletteSidebarProps) {
  if (!isOpen) { // If panel is not open, render nothing
    return null;
  }

  return (
    <div className="pr-2"> 
      {orderedCategories.map((category) => {
        // Use the getFilteredItems function passed from the parent
        const filteredCategoryItems = getFilteredItems(groupedItems[category] || []);
        if (filteredCategoryItems.length === 0) return null;
        
        return (
          <div key={category} className="mb-4">
            <h2 className="text-sm font-semibold text-primary tracking-tight mb-2 px-1">
              {category}
            </h2>
            <div className="grid gap-x-2 gap-y-3 min-w-0 justify-items-stretch" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(75px, 1fr))' }}>
              {filteredCategoryItems.map((item) => (
                <button
                  key={item.id}
                  className="group flex flex-col items-center justify-start p-1.5 rounded-lg bg-transparent hover:bg-transparent border border-transparent transition-all min-w-0 w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  draggable={false} // Draggable is handled by PaletteItem itself now
                  tabIndex={0}
                  aria-label={item.name}
                >
                  <div className="flex items-center justify-center w-[70%] max-w-[48px] aspect-square min-w-0 mx-auto mb-1.5 transform transition-transform group-hover:scale-105">
                    <PaletteItem item={item} />
                  </div>
                  <span className="block w-full text-center text-[11px] leading-tight text-foreground font-medium group-hover:text-primary break-words min-w-0 max-w-[90px]">
                    {item.name.length > 20 ? `${item.name.substring(0, 18)}...` : item.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
} 