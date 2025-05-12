'use client';

import { PALETTE_ITEMS } from "@/lib/microfluidic-designer/types";
import dynamic from 'next/dynamic';

const PaletteItem = dynamic(() => import('./palette/PaletteItem'), {
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">Loading...</div>
});

export default function PaletteSidebar() {
  // Group palette items by category
  const groupedItems = PALETTE_ITEMS.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof PALETTE_ITEMS>);

  // Categories array for iteration
  const categories = Object.keys(groupedItems);

  return (
    <aside className="h-full flex flex-col overflow-y-auto">
      {categories.map((category, idx) => (
        <div key={category} className="w-full" draggable={false}>
          <div className="p-3 bg-zinc-200 border-b border-zinc-300" draggable={false}>
            <h2 className="font-roboto-condensed-semibold text-base text-[#003C7E]">{category}</h2>
          </div>
          <div className="grid grid-cols-2 gap-2 p-2" draggable={false}>
            {groupedItems[category].map((item, itemIdx) => {
              return (
                <div 
                  key={item.id} 
                  className="h-[110px] flex flex-col items-center justify-center p-1"
                  draggable={false}
                >
                  <div 
                    className="w-[80px] h-[80px] flex items-center justify-center overflow-visible"
                    draggable={false}
                  >
                    <PaletteItem item={item} />
                  </div>
                  <div className="text-center text-xs text-zinc-500 mt-1">{item.name}</div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </aside>
  );
} 