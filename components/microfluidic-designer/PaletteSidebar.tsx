'use client';

import { PALETTE_ITEMS } from "@/lib/microfluidic-designer/types";
import dynamic from 'next/dynamic';
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";

const PaletteItem = dynamic(() => import('./palette/PaletteItem'), {
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">Loading...</div>
});

const FILTERS = [
  { label: "All", value: "all" },
  { label: "Chips", value: "chip" },
  { label: "Pumps", value: "pump" },
  { label: "Outlets", value: "outlet" },
];

export default function PaletteSidebar() {
  const [search, setSearch] = useState("");
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
  const [activeFilter, setActiveFilter] = useState("all");

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

  // Filtered items by search and filter
  const getFilteredItems = (items: typeof PALETTE_ITEMS) =>
    items.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
      const matchesFilter =
        activeFilter === "all" ||
        (activeFilter === "chip" && item.category.toLowerCase().includes("chip")) ||
        (activeFilter === "pump" && item.chipType === "pump") ||
        (activeFilter === "outlet" && item.chipType === "outlet");
      return matchesSearch && matchesFilter;
    });

  return (
    <aside className="h-full w-full min-w-[180px] max-w-[220px] flex flex-col bg-gradient-to-b from-[#F5F7FA] to-[#E1E4E8] border-r border-zinc-200">
      <div className="flex flex-col h-full px-2 pt-4 pb-2">
        {/* Search and filter row */}
        <Input
          placeholder="Search components..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="h-8 text-sm bg-white/80 border border-zinc-300 focus:ring-2 focus:ring-[#003C7E] shadow-sm mb-2"
        />
        <div className="flex flex-wrap gap-2 mb-4 w-full">
          {FILTERS.map(f => (
            <Badge
              key={f.value}
              variant={activeFilter === f.value ? "default" : "outline"}
              className={`text-xs px-3 py-1 cursor-pointer select-none whitespace-nowrap min-w-max text-center ${activeFilter === f.value ? 'bg-[#003C7E] text-white' : 'text-[#003C7E] border-[#003C7E] bg-white/80'} transition-colors`}
              onClick={() => setActiveFilter(f.value)}
              tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setActiveFilter(f.value); }}
              aria-pressed={activeFilter === f.value}
            >
              {f.label}
            </Badge>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto min-w-0">
          {categories.map((category, idx) => {
            const isOpen = openCategories[category] ?? true;
            const filtered = getFilteredItems(groupedItems[category]);
            if (filtered.length === 0) return null;
            return (
              <div key={category} className="mb-4 min-w-0">
                {/* Section headline above grid */}
                <h2 className="text-base font-bold text-[#003C7E] tracking-tight leading-tight m-0 p-0 min-w-0 truncate mb-2 mt-4 text-center w-full">
                  {category}
                </h2>
                {/* Responsive grid, no card/box, just icon+label, centered */}
                <div className="grid gap-2 min-w-0 mx-auto justify-items-center items-start pt-2 w-full" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(72px, 1fr))' }}>
                  {filtered.map((item) => (
                    <button
                      key={item.id}
                      className="group flex flex-col items-center justify-start p-1 rounded-md bg-transparent transition-transform min-w-0 w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003C7E] hover:scale-105 active:scale-100"
                      draggable={false}
                      tabIndex={0}
                      aria-label={item.name}
                    >
                      <div className="flex items-center justify-center w-[60%] max-w-[40px] aspect-square min-w-0 mx-auto">
                        <PaletteItem item={item} />
                      </div>
                      <span className="block w-full text-center text-xs text-zinc-700 mt-2 font-medium group-hover:text-[#003C7E] group-focus:text-[#003C7E] break-words min-w-0 max-w-[80px]">
                        {item.name.split(/(?<=\w)[ -]/).length > 1
                          ? item.name.split(/(?<=\w)[ -]/).join("\n")
                          : item.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
} 