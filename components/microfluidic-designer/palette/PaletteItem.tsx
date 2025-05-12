'use client';

import { useState, useRef } from 'react';
import type { PaletteItemData } from '@/lib/microfluidic-designer/types';
import KonvaChipPreview from './KonvaChipPreview';

interface PaletteItemProps {
  item: PaletteItemData;
}

export default function PaletteItem({ item }: PaletteItemProps) {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const itemRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>) => {
    // Important: Do NOT prevent default for drag operations, it will prevent the drag
    
    const itemDataString = JSON.stringify(item);
    event.dataTransfer.setData('application/json', itemDataString);
    
    // Set a custom drag image (or we can use the element itself)
    if (itemRef.current) {
      const rect = itemRef.current.getBoundingClientRect();
      // Adjust the drag image location to center it on the cursor
      const dragX = event.clientX - rect.left;
      const dragY = event.clientY - rect.top;
      event.dataTransfer.setDragImage(itemRef.current, dragX, dragY);
    }
    
    setIsDragging(true);
    
    // Clear the isDragging state when the drag operation ends
    const handleDragEnd = () => {
      setIsDragging(false);
      window.removeEventListener('dragend', handleDragEnd);
    };
    window.addEventListener('dragend', handleDragEnd);
  };
  
  // Set up the actual drag behavior
  const handleDragBehavior = (event: React.DragEvent<HTMLDivElement>) => {
    // Required for Firefox compatibility
    event.dataTransfer.effectAllowed = 'move';
    // You must call setData for drag to work in Firefox
    if (!event.dataTransfer.getData('application/json')) { // Only set if not already set
      const itemDataString = JSON.stringify(item);
      event.dataTransfer.setData('application/json', itemDataString);
    }
  };

  return (
    <div
      ref={itemRef}
      draggable={true}
      onDragStart={handleDragStart}
      onDrag={handleDragBehavior}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="w-full h-full cursor-grab relative"
      title={item.title}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      {/* Konva Preview Container - Apply hover styles here */}
      <div
        id={item.konvaPreviewId}
        className="w-[80px] h-[80px] mx-auto"
        style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          border: 'none',
          overflow: 'visible',
          pointerEvents: isDragging ? 'none' : 'auto'
        }}
        draggable={false}
      >
        <KonvaChipPreview chipType={item.chipType} isHovered={isHovered} />
      </div>
    </div>
  );
} 