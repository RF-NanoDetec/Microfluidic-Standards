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
    <aside className="w-[220px] flex flex-col bg-white border border-gray-300 overflow-y-auto">
      {categories.map((category, idx) => (
        <div key={category} className="w-full" draggable={false}>
          <div className="p-2 bg-white border-b border-gray-300" draggable={false}>
            <h2 className="font-medium text-gray-800 text-base">{category}</h2>
          </div>
          <div className="grid grid-cols-2" draggable={false}>
            {groupedItems[category].map((item, itemIdx) => {
              // Calculate border classes to create the table-like grid
              const isEven = itemIdx % 2 === 0;
              const isLast = itemIdx === groupedItems[category].length - 1 || 
                            itemIdx === groupedItems[category].length - 2;
              
              return (
                <div 
                  key={item.id} 
                  className={`
                    h-[110px] flex flex-col items-center justify-center 
                    ${isEven ? 'border-r border-gray-300' : ''}
                    ${!isLast ? 'border-b border-gray-300' : ''}
                    p-1
                  `}
                  draggable={false}
                >
                  <div 
                    className="w-[80px] h-[80px] flex items-center justify-center overflow-visible"
                    draggable={false}
                  >
                    <PaletteItem item={item} />
                  </div>
                  <div className="text-center text-xs text-gray-700 mt-1">{item.name}</div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </aside>
  );
} 