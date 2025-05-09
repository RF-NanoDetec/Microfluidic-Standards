'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Stage, Layer, Line, Path, Group, Circle, Rect } from 'react-konva';
import Konva from 'konva';
import type { CanvasItemData, Port, Connection } from "@/lib/microfluidic-designer/types";
import KonvaCanvasItem from './canvas/KonvaCanvasItem';
import { CHANNEL_FILL_COLOR, CHANNEL_OUTLINE_COLOR } from '@/lib/microfluidic-designer/constants';
import { calculateTubePathData, calculateTemporaryConnectionPath } from '@/lib/microfluidic-designer/utils/pathUtils';

// Grid configuration
const GRID_SIZE = 20; // Size of each grid cell in pixels
const GRID_COLOR = '#f0f0f0'; // Light gray for grid lines
const GRID_STROKE_WIDTH = 0.5; // Thin grid lines

// Connection style constants
const CONNECTION_OUTLINE_COLOR = '#555555'; // Dark gray, same as channel outline
const CONNECTION_FILL_COLOR = '#e3f2fd'; // Light blue, same as channel fill
const CONNECTION_SELECTED_OUTLINE_COLOR = '#2c3e50'; // Darker outline for selected connections
const CONNECTION_SELECTED_FILL_COLOR = '#bbdefb'; // Slightly darker fill for selected connections
const CONNECTION_OUTLINE_WIDTH = 5; // Match channel outline width
const CONNECTION_FILL_WIDTH = 3.5; // Match channel fill width

interface CanvasAreaProps {
  droppedItems: CanvasItemData[];
  onDrop: (event: React.DragEvent<HTMLDivElement>, containerRef: React.RefObject<HTMLDivElement | null>) => void;
  onItemDragEnd: (itemId: string, newX: number, newY: number) => void;
  selectedItemId: string | null;
  selectedConnectionId: string | null; // For styling selected tubes
  connections: Connection[];
  inProgressConnection?: { sourceItem: CanvasItemData; sourcePort: Port; targetMousePos: {x: number, y: number} } | null;
  
  // Event handlers from page.tsx
  onStageClick: (event: any) => void;
  onStageContextMenu: (event: any) => void;
  onPortClick: (itemId: string, port: Port, event: any) => void; // Left-click on port
  onTubeClick: (connectionId: string, event: any) => void; // Left-click on tube
  onDeleteConnection: (connectionId: string) => void; // Retained for delete key logic in page
  onStagePointerMove?: (position: {x: number, y:number}) => void; // For updating guiding line
}

export default function CanvasArea({ 
  droppedItems,
  onDrop,
  onItemDragEnd,
  selectedItemId,
  selectedConnectionId,
  connections,
  inProgressConnection,
  onStageClick,
  onStageContextMenu,
  onPortClick,
  onTubeClick,
  onDeleteConnection,
  onStagePointerMove
}: CanvasAreaProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [stageDimensions, setStageDimensions] = useState({ width: 100, height: 100 });
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);

  useEffect(() => {
    setIsMounted(true);
    if (containerRef.current) {
      setStageDimensions({
        width: containerRef.current.offsetWidth,
        height: containerRef.current.offsetHeight,
      });
    }
    const handleResize = () => {
      if (containerRef.current) {
        setStageDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  const localHandleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    onDrop(event, containerRef);
  }, [onDrop]);

  const internalHandleStageMouseMove = () => {
    if (!stageRef.current) return;
    const pos = stageRef.current.getPointerPosition();
    if (pos && onStagePointerMove) {
      onStagePointerMove(pos);
    }
  };
  
  const getPortAbsolutePosition = (itemId: string, portId: string): {x: number, y: number} | null => {
    const item = droppedItems.find(i => i.id === itemId);
    if (!item) return null;
    const port = item.ports.find(p => p.id === portId);
    if (!port) return null;
    return { x: item.x + port.x, y: item.y + port.y };
  };
  
  // Generate grid lines for the canvas
  const renderGrid = () => {
    const gridLines = [];
    const { width, height } = stageDimensions;
    
    // Draw vertical grid lines
    for (let x = GRID_SIZE; x < width; x += GRID_SIZE) {
      gridLines.push(
        <Line
          key={`v-${x}`}
          points={[x, 0, x, height]}
          stroke={GRID_COLOR}
          strokeWidth={GRID_STROKE_WIDTH}
          listening={false}
        />
      );
    }
    
    // Draw horizontal grid lines
    for (let y = GRID_SIZE; y < height; y += GRID_SIZE) {
      gridLines.push(
        <Line
          key={`h-${y}`}
          points={[0, y, width, y]}
          stroke={GRID_COLOR}
          strokeWidth={GRID_STROKE_WIDTH}
          listening={false}
        />
      );
    }
    
    return gridLines;
  };

  // Simplified in-progress connection calculation - directly use the specialized function
  const calculateInProgressPath = (
    sourceItem: CanvasItemData, 
    sourcePort: Port, 
    mousePos: {x: number, y: number}
  ) => {
    return calculateTemporaryConnectionPath(sourceItem, sourcePort, mousePos);
  };

  return (
    <main 
      ref={containerRef}
      className="flex-grow bg-white rounded-lg shadow-inner border border-slate-200 relative overflow-hidden p-0 m-0"
      onDragOver={handleDragOver}
      onDrop={localHandleDrop}
    >
      {isMounted ? (
        <Stage 
          ref={stageRef}
          width={stageDimensions.width} 
          height={stageDimensions.height}
          onClick={onStageClick}
          onContextMenu={onStageContextMenu}
          onMouseMove={internalHandleStageMouseMove}
        >
          <Layer>
            {/* Background */}
            <Rect 
              x={0}
              y={0}
              width={stageDimensions.width}
              height={stageDimensions.height}
              fill="#fafbfc" // Light background color similar to original
              listening={false}
            />
            
            {/* Grid */}
            {renderGrid()}
            
            {/* Connections (tubes) rendered below items */}
            {connections.map(conn => {
              if (!conn.pathData) { 
                console.error("[CanvasArea] Connection has NO pathData! Rendering fallback line.", conn);
                const fromPos = getPortAbsolutePosition(conn.fromItemId, conn.fromPortId);
                const toPos = getPortAbsolutePosition(conn.toItemId, conn.toPortId);
                if (!fromPos || !toPos) return null;
                return (
                  <Line
                    key={`${conn.id}-fallback`}
                    points={[fromPos.x, fromPos.y, toPos.x, toPos.y]}
                    stroke="#FF0000"
                    strokeWidth={1}
                  />
                );
              }

              const isSelected = conn.id === selectedConnectionId;
              
              return (
                <Group 
                  key={conn.id} 
                  id={conn.id}
                  opacity={1} // Full opacity always
                > 
                  {/* Outline path (drawn first) */}
                  <Path
                    data={conn.pathData} 
                    stroke={isSelected ? CONNECTION_SELECTED_OUTLINE_COLOR : CONNECTION_OUTLINE_COLOR}
                    strokeWidth={CONNECTION_OUTLINE_WIDTH}
                    lineCap="butt" // Match original channel caps
                    lineJoin="miter" // Match original channel joins
                    hitStrokeWidth={12} // Larger hit area for easier selection
                    onClick={(e) => {
                      e.cancelBubble = true; 
                      onTubeClick(conn.id, e);
                    }}
                    id={`${conn.id}_outline`}
                    name="tubeOutline"
                  />
                  
                  {/* Fill path (drawn on top) */}
                  <Path
                    data={conn.pathData}
                    stroke={isSelected ? CONNECTION_SELECTED_FILL_COLOR : CONNECTION_FILL_COLOR}
                    strokeWidth={CONNECTION_FILL_WIDTH}
                    lineCap="butt" // Match original channel caps
                    lineJoin="miter" // Match original channel joins
                    listening={false} // Only the outline receives clicks
                    id={`${conn.id}_tube`}
                    name="tubeFill"
                  />
                </Group>
              );
            })}
            
            {/* Dropped items rendered on top of connections */}
            {droppedItems.map((item) => (
              <KonvaCanvasItem 
                key={item.id}
                item={item} 
                onDragEnd={onItemDragEnd}
                isSelected={selectedItemId === item.id}
                onPortClick={onPortClick} 
                connections={connections} 
              />
            ))}
            
            {/* In-progress connection line */}
            {inProgressConnection && inProgressConnection.sourceItem && inProgressConnection.sourcePort && inProgressConnection.targetMousePos && (
              (() => {
                // Calculate a better looking temporary path instead with specialized function
                const tempPathData = calculateInProgressPath(
                  inProgressConnection.sourceItem,
                  inProgressConnection.sourcePort,
                  inProgressConnection.targetMousePos
                );
                
                // Use a path with the calculated data
                return (
                  <>
                    {/* Outline (drawn first) */}
                    <Path
                      data={tempPathData}
                      stroke={CONNECTION_OUTLINE_COLOR}
                      strokeWidth={CONNECTION_OUTLINE_WIDTH}
                      lineCap="butt"
                      lineJoin="miter"
                      dash={[6, 2]}
                      listening={false}
                    />
                    
                    {/* Fill (drawn on top) */}
                    <Path
                      data={tempPathData}
                      stroke={CONNECTION_FILL_COLOR}
                      strokeWidth={CONNECTION_FILL_WIDTH}
                      lineCap="butt"
                      lineJoin="miter"
                      dash={[6, 2]}
                      listening={false}
                    />
                  </>
                );
              })()
            )}
          </Layer>
        </Stage>
      ) : (
        <div className="w-full h-full flex items-center justify-center text-slate-400">
          Loading Canvas...
        </div>
      )}
      <div className="absolute top-4 left-4 text-xs text-slate-300 pointer-events-none">
        Drop components here
      </div>
    </main>
  );
} 