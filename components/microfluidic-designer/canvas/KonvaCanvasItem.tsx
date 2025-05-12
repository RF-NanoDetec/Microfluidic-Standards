'use client';

import type { CanvasItemData, Port, Connection } from "@/lib/microfluidic-designer/types";
import { Rect, Line, Circle, Group, Path, Image } from 'react-konva';
import { useState, useEffect, useRef } from 'react';
import {
  CHIP_WIDTH,
  CHIP_HEIGHT,
  CHIP_RECT_STYLE,
  CHANNEL_FILL_COLOR,
  CHANNEL_OUTLINE_COLOR,
  CHANNEL_FILL_WIDTH,
  CHANNEL_OUTLINE_WIDTH,
  CHANNEL_CAP,
  CHANNEL_JOIN,
  PORT_RADIUS,
  PORT_COLOR,
  PORT_SELECTED_COLOR,
  PORT_STROKE_COLOR,
  PORT_STROKE_WIDTH,
  PORT_HIT_RADIUS,
  SHADOW_STYLE_DEFAULT,
  SHADOW_STYLE_STRONG,
  PUMP_SVG_DATA_URI,
  OUTLET_SVG_DATA_URI,
  PUMP_SVG_DATA_URI_SELECTED,
  OUTLET_SVG_DATA_URI_SELECTED,
  OUTLET_WIDTH,
  OUTLET_HEIGHT,
  PUMP_CANVAS_WIDTH,
  PUMP_CANVAS_HEIGHT
} from '@/lib/microfluidic-designer/constants';

interface KonvaCanvasItemProps {
  item: CanvasItemData;
  onDragEnd: (itemId: string, x: number, y: number) => void;
  // onSelect is removed, selection handled by stage
  isSelected: boolean; // Still needed for visual styling if selected
  onPortClick?: (itemId: string, port: Port, event: any) => void; // For left-click on port
  connections?: Connection[]; 
  isSimulationActive?: boolean; // New prop to indicate if simulation is active
}

export default function KonvaCanvasItem({ 
  item, 
  onDragEnd, 
  isSelected, 
  onPortClick,
  connections,
  isSimulationActive // Destructure the new prop
}: KonvaCanvasItemProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  // For SVG images
  const [pumpImage, setPumpImage] = useState<HTMLImageElement | null>(null);
  const [outletImage, setOutletImage] = useState<HTMLImageElement | null>(null);
  
  // Load SVG images when needed
  useEffect(() => {
    let isMounted = true; // Flag to track mounted status

    if (item.chipType === 'pump') {
      const image = new window.Image();
      image.src = isSelected ? PUMP_SVG_DATA_URI_SELECTED : PUMP_SVG_DATA_URI;
      image.onload = () => {
        if (isMounted) { // Only update state if still mounted
          setPumpImage(image);
        }
      };
    } else if (item.chipType === 'outlet') {
      const image = new window.Image();
      image.src = isSelected ? OUTLET_SVG_DATA_URI_SELECTED : OUTLET_SVG_DATA_URI;
      image.onload = () => {
        if (isMounted) { // Only update state if still mounted
          setOutletImage(image);
        }
      };
    }

    return () => {
      isMounted = false; // Set to false on cleanup
    };
  }, [item.chipType, isSelected]);
  
  // Apply a constant, small shadow to all components on the main canvas
  // Special case: Outlet components get a stronger shadow
  const shadowProps = item.chipType === 'outlet' 
    ? { ...SHADOW_STYLE_STRONG } 
    : { ...SHADOW_STYLE_DEFAULT };

  // Use the visual styles from the original implementation
  const fillColor = isSelected ? '#b0becb' : CHIP_RECT_STYLE.fill;
  const fillOpacity = CHIP_RECT_STYLE.opacity;
  const strokeColor = CHIP_RECT_STYLE.stroke;
  const strokeWidth = isSelected ? 1 : CHIP_RECT_STYLE.strokeWidth;

  // Create a standard render method for the chip body
  const renderChipBody = () => (
    <Rect
      width={CHIP_WIDTH}
      height={CHIP_HEIGHT}
      fill={fillColor}
      opacity={fillOpacity}
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      cornerRadius={0} // No rounded corners to match original
      name="component-border"
      {...shadowProps}
    />
  );

  let shapes = null;

  switch (item.chipType) {
    case 'straight':
      shapes = (
        <Group>
          {renderChipBody()}
          
          {/* Channel outline (drawn first) */}
          <Line
            points={[0, CHIP_HEIGHT / 2, CHIP_WIDTH, CHIP_HEIGHT / 2]}
            stroke={CHANNEL_OUTLINE_COLOR}
            strokeWidth={CHANNEL_OUTLINE_WIDTH}
            lineCap={CHANNEL_CAP as any}
            lineJoin={CHANNEL_JOIN as any}
            name="channelOutline"
            listening={false}
          />
          
          {/* Channel fill (drawn on top) */}
          <Line
            points={[0, CHIP_HEIGHT / 2, CHIP_WIDTH, CHIP_HEIGHT / 2]}
            stroke={CHANNEL_FILL_COLOR}
            strokeWidth={CHANNEL_FILL_WIDTH}
            lineCap={CHANNEL_CAP as any}
            lineJoin={CHANNEL_JOIN as any}
            name="internalChannelFill"
            id={`${item.id}_internalChannelFill`}
            listening={false}
          />
        </Group>
      );
      break;
      
    case 'x-type':
      // Define center for convenience
      const centerX = CHIP_WIDTH / 2;
      const centerY = CHIP_HEIGHT / 2;
      
      shapes = (
        <Group>
          {renderChipBody()}
          
          {/* Channel outline (drawn first) - horizontal */}
          <Line
            points={[0, centerY, CHIP_WIDTH, centerY]}
            stroke={CHANNEL_OUTLINE_COLOR}
            strokeWidth={CHANNEL_OUTLINE_WIDTH}
            lineCap={CHANNEL_CAP as any}
            lineJoin={CHANNEL_JOIN as any}
            name="channelOutline"
            listening={false}
          />
          
          {/* Channel outline - vertical */}
          <Line
            points={[centerX, 0, centerX, CHIP_HEIGHT]}
            stroke={CHANNEL_OUTLINE_COLOR}
            strokeWidth={CHANNEL_OUTLINE_WIDTH}
            lineCap={CHANNEL_CAP as any}
            lineJoin={CHANNEL_JOIN as any}
            name="channelOutline"
            listening={false}
          />
          
          {/* Junction center circle outline */}
          <Circle
            x={centerX}
            y={centerY}
            radius={CHANNEL_OUTLINE_WIDTH / 2}
            fill={CHANNEL_OUTLINE_COLOR}
            listening={false}
          />
          
          {/* Channel fill - left to center segment */}
          <Line
            points={[0, centerY, centerX, centerY]}
            stroke={CHANNEL_FILL_COLOR}
            strokeWidth={CHANNEL_FILL_WIDTH}
            lineCap={CHANNEL_CAP as any}
            lineJoin={CHANNEL_JOIN as any}
            name="internalSegmentFill"
            id={`${item.id}_segmentLeftCenter`}
            listening={false}
          />
          
          {/* Channel fill - right to center segment */}
          <Line
            points={[centerX, centerY, CHIP_WIDTH, centerY]}
            stroke={CHANNEL_FILL_COLOR}
            strokeWidth={CHANNEL_FILL_WIDTH}
            lineCap={CHANNEL_CAP as any}
            lineJoin={CHANNEL_JOIN as any}
            name="internalSegmentFill"
            id={`${item.id}_segmentRightCenter`}
            listening={false}
          />
          
          {/* Channel fill - top to center segment */}
          <Line
            points={[centerX, 0, centerX, centerY]}
            stroke={CHANNEL_FILL_COLOR}
            strokeWidth={CHANNEL_FILL_WIDTH}
            lineCap={CHANNEL_CAP as any}
            lineJoin={CHANNEL_JOIN as any}
            name="internalSegmentFill"
            id={`${item.id}_segmentTopCenter`}
            listening={false}
          />
          
          {/* Channel fill - bottom to center segment */}
          <Line
            points={[centerX, centerY, centerX, CHIP_HEIGHT]}
            stroke={CHANNEL_FILL_COLOR}
            strokeWidth={CHANNEL_FILL_WIDTH}
            lineCap={CHANNEL_CAP as any}
            lineJoin={CHANNEL_JOIN as any}
            name="internalSegmentFill"
            id={`${item.id}_segmentBottomCenter`}
            listening={false}
          />
        </Group>
      );
      break;
      
    case 't-type':
      // Define center points for T-junction
      const tCenterX = CHIP_WIDTH / 2;
      const tCenterY = CHIP_HEIGHT / 2;
      
      shapes = (
        <Group>
          {renderChipBody()}
          
          {/* Updated T-Junction with vertical main channel and right branch to match original */}
          
          {/* Channel outline - vertical (top to bottom) */}
          <Line
            points={[tCenterX, 0, tCenterX, CHIP_HEIGHT]}
            stroke={CHANNEL_OUTLINE_COLOR}
            strokeWidth={CHANNEL_OUTLINE_WIDTH}
            lineCap={CHANNEL_CAP as any}
            lineJoin={CHANNEL_JOIN as any}
            name="channelOutline"
            listening={false}
          />
          
          {/* Channel outline - horizontal (center to right) */}
          <Line
            points={[tCenterX, tCenterY, CHIP_WIDTH, tCenterY]}
            stroke={CHANNEL_OUTLINE_COLOR}
            strokeWidth={CHANNEL_OUTLINE_WIDTH}
            lineCap={CHANNEL_CAP as any}
            lineJoin={CHANNEL_JOIN as any}
            name="channelOutline"
            listening={false}
          />
          
          {/* Junction center circle outline */}
          <Circle
            x={tCenterX}
            y={tCenterY}
            radius={CHANNEL_OUTLINE_WIDTH / 2}
            fill={CHANNEL_OUTLINE_COLOR}
            listening={false}
          />
          
          {/* Channel fill - top to center segment */}
          <Line
            points={[tCenterX, 0, tCenterX, tCenterY]}
            stroke={CHANNEL_FILL_COLOR}
            strokeWidth={CHANNEL_FILL_WIDTH}
            lineCap={CHANNEL_CAP as any}
            lineJoin={CHANNEL_JOIN as any}
            name="internalSegmentFill"
            id={`${item.id}_segmentTopCenter`}
            listening={false}
          />
          
          {/* Channel fill - center to right segment */}
          <Line
            points={[tCenterX, tCenterY, CHIP_WIDTH, tCenterY]}
            stroke={CHANNEL_FILL_COLOR}
            strokeWidth={CHANNEL_FILL_WIDTH}
            lineCap={CHANNEL_CAP as any}
            lineJoin={CHANNEL_JOIN as any}
            name="internalSegmentFill"
            id={`${item.id}_segmentCenterRight`}
            listening={false}
          />
          
          {/* Channel fill - center to bottom segment */}
          <Line
            points={[tCenterX, tCenterY, tCenterX, CHIP_HEIGHT]}
            stroke={CHANNEL_FILL_COLOR}
            strokeWidth={CHANNEL_FILL_WIDTH}
            lineCap={CHANNEL_CAP as any}
            lineJoin={CHANNEL_JOIN as any}
            name="internalSegmentFill"
            id={`${item.id}_segmentCenterBottom`}
            listening={false}
          />
        </Group>
      );
      break;
      
    case 'meander':
      // Using the exact same approach from the original meanderChip.js
      const w = CHIP_WIDTH;
      const h = CHIP_HEIGHT;
      const r = 5; // Turn radius
      const w_seg = w / 6; // Width of horizontal segments (6 segments total)
      const y_top = h / 4; // Top extent of the meander
      const y_bottom = h * 3 / 4; // Bottom extent of the meander
      const y_mid = h / 2; // Start and end y-coordinate

      // Create a points array for the meander path - each pair is an x,y coordinate
      const meanderPoints = [
        0, y_mid, // Start at left edge, middle (matching updated port)
        w_seg - r, y_mid, // Horizontal segment to first corner

        // Corner 1 (Down) - approximate curve with line segments
        w_seg - r/2, y_mid,
        w_seg, y_mid + r/2,
        w_seg, y_mid + r,

        // Vertical segment to fourth corner
        w_seg, y_bottom - r,

        // Corner 4 (Right) - approximate curve with line segments
        w_seg, y_bottom - r/2,
        w_seg + r/2, y_bottom,
        w_seg + r, y_bottom,

        // Horizontal segment to fifth corner
        w_seg * 2 - r, y_bottom,

        // Corner 5 (Up) - approximate curve with line segments
        w_seg * 2 - r/2, y_bottom,
        w_seg * 2, y_bottom - r/2,
        w_seg * 2, y_bottom - r,

        // Vertical segment to second corner
        w_seg * 2, y_top + r,

        // Corner 2 (Right) - approximate curve with line segments
        w_seg * 2, y_top + r/2,
        w_seg * 2 + r/2, y_top,
        w_seg * 2 + r, y_top,

        // Horizontal segment to third corner
        w_seg * 3 - r, y_top,

        // Corner 3 (Down) - approximate curve with line segments
        w_seg * 3 - r/2, y_top,
        w_seg * 3, y_top + r/2,
        w_seg * 3, y_top + r,

        // Vertical segment to sixth corner
        w_seg * 3, y_bottom - r,

        // Corner 6 (Right) - approximate curve with line segments
        w_seg * 3, y_bottom - r/2,
        w_seg * 3 + r/2, y_bottom,
        w_seg * 3 + r, y_bottom,

        // Horizontal segment to seventh corner
        w_seg * 4 - r, y_bottom,

        // Corner 7 (Up) - approximate curve with line segments
        w_seg * 4 - r/2, y_bottom,
        w_seg * 4, y_bottom - r/2,
        w_seg * 4, y_bottom - r,

        // Vertical segment to eighth corner
        w_seg * 4, y_top + r,

        // Corner 8 (Right) - approximate curve with line segments
        w_seg * 4, y_top + r/2,
        w_seg * 4 + r/2, y_top,
        w_seg * 4 + r, y_top,

        // Horizontal segment to ninth corner
        w_seg * 5 - r, y_top,

        // Corner 9 (Down to Middle) - approximate curve with line segments
        w_seg * 5 - r/2, y_top,
        w_seg * 5, y_top + r/2,
        w_seg * 5, y_top + r,

        // Vertical segment to final turn
        w_seg * 5, y_mid - r,

        // Final corner (Right) - approximate curve with line segments
        w_seg * 5, y_mid - r/2,
        w_seg * 5 + r/2, y_mid,
        w_seg * 5 + r, y_mid,

        // Final horizontal segment to right edge
        w, y_mid
      ];

      // Convert points array to SVG path data
      const meanderPathData = 'M ' + meanderPoints.join(' ');

      shapes = (
        <Group>
          {renderChipBody()}
          
          {/* Meander channel outline (drawn first) */}
          <Line
            points={meanderPoints}
            stroke={CHANNEL_OUTLINE_COLOR}
            strokeWidth={CHANNEL_OUTLINE_WIDTH}
            lineCap={CHANNEL_CAP as any}
            lineJoin={CHANNEL_JOIN as any}
            name="channelOutline"
            listening={false}
          />
          
          {/* Meander channel fill (drawn on top) */}
          <Line
            points={meanderPoints}
            stroke={CHANNEL_FILL_COLOR}
            strokeWidth={CHANNEL_FILL_WIDTH}
            lineCap={CHANNEL_CAP as any}
            lineJoin={CHANNEL_JOIN as any}
            name="internalChannelFill"
            id={`${item.id}_internalChannelFill`}
            listening={false}
          />
        </Group>
      );
      break;
      
    case 'pump':
      // Use the SVG image for the pump
      shapes = pumpImage ? (
        <Group>
          {/* Use the SVG as the entire pump visualization */}
          <Image
            image={pumpImage}
            width={PUMP_CANVAS_WIDTH} // Use new constant
            height={PUMP_CANVAS_HEIGHT} // Use new constant
            x={(CHIP_WIDTH - PUMP_CANVAS_WIDTH) / 2} // Center based on CHIP_WIDTH
            y={(CHIP_HEIGHT - PUMP_CANVAS_HEIGHT) / 2} // Center based on CHIP_HEIGHT
            {...shadowProps}
          />
        </Group>
      ) : (
        // Fallback while image is loading
        <Group>
          {/* Simple circular representation as fallback */}
          <Circle
            x={CHIP_WIDTH/2}
            y={CHIP_HEIGHT/2}
            radius={CHIP_WIDTH/2.5}
            fill={fillColor}
            opacity={fillOpacity}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            {...shadowProps}
          />
        </Group>
      );
      break;
      
    case 'outlet':
      // Use the outlet SVG image for exact match with original design
      shapes = outletImage ? (
        <Group>
          {/* The bounding Rect for selection highlight is removed. 
             Selection is now indicated by the SVG swap (color change) and the existing shadow on the Image. */}
          <Image
            image={outletImage}
            width={OUTLET_WIDTH} // Changed from OUTLET_WIDTH * 0.9
            height={OUTLET_HEIGHT} // Changed from OUTLET_HEIGHT * 0.9
            x={(CHIP_WIDTH - OUTLET_WIDTH) / 2} // Centered within CHIP_WIDTH
            y={(CHIP_HEIGHT - OUTLET_HEIGHT) / 2 + 2} // Centered within CHIP_HEIGHT, kept +2 offset
            {...shadowProps}
          />
        </Group>
      ) : (
        // Fallback while image is loading
        <Rect
          width={CHIP_WIDTH}
          height={CHIP_HEIGHT}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          cornerRadius={0}
          opacity={isDragging ? 0.5 : 1}
          {...shadowProps}
        />
      );
      break;
      
    default:
      shapes = (
        <Rect 
          width={CHIP_WIDTH} 
          height={CHIP_HEIGHT} 
          stroke="#FC8181" 
          fill="#FFF5F5" 
          cornerRadius={0} 
          {...shadowProps}
        />
      );
  }

  // Function to calculate visual offset for port
  const getPortOffset = (orientation: string): { offsetX: number, offsetY: number } => {
    // Mimic the visual offset from the original setupPortVisualsAndLogic
    switch (orientation) {
      case 'left':
        return { offsetX: -6, offsetY: 0 };
      case 'right':
        return { offsetX: 6, offsetY: 0 };
      case 'top':
        return { offsetX: 0, offsetY: -6 };
      case 'bottom':
        return { offsetX: 0, offsetY: 6 };
      default:
        return { offsetX: 0, offsetY: 0 };
    }
  };

  return (
    <Group
      key={item.id}
      id={item.id}
      x={item.x}
      y={item.y}
      draggable
      onDragStart={() => setIsDragging(true)}
      onDragEnd={(e) => {
        setIsDragging(false);
        onDragEnd(item.id, e.target.x(), e.target.y());
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      opacity={isDragging ? 0.6 : 1}
    >
      {shapes}
      {item.ports && item.ports.map(port => {
        const isConnected = connections?.some(conn => 
          (conn.fromItemId === item.id && conn.fromPortId === port.id) || 
          (conn.toItemId === item.id && conn.toPortId === port.id)
        );
        
        // Get visual offset for this port
        const portOffset = getPortOffset(port.orientation);

        return (
          <Group key={port.id} x={port.x} y={port.y}>
            {/* Actual connection port (hidden when connected) */}
            <Circle
              id={port.id}
              x={0}
              y={0}
              offsetX={-portOffset.offsetX}  // Apply visual offset
              offsetY={-portOffset.offsetY}  // Apply visual offset
              radius={PORT_RADIUS}
              fill={PORT_COLOR}
              stroke={PORT_STROKE_COLOR}
              strokeWidth={PORT_STROKE_WIDTH}
              visible={!isSimulationActive && !isConnected} // Updated visibility logic
              opacity={isConnected ? 0.3 : 0.9}
              name="connectionPort"
              hitRadius={PORT_HIT_RADIUS} // Larger invisible touch target
              attrs={{
                mainGroupId: item.id,
                portId: port.id
              }}
              onClick={(e) => {
                e.cancelBubble = true;
                if (onPortClick) {
                  onPortClick(item.id, port, e);
                }
              }}
              onMouseEnter={(e) => {
                e.target.getStage()!.container().style.cursor = 'pointer';
              }}
              onMouseLeave={(e) => {
                e.target.getStage()!.container().style.cursor = 'default';
              }}
            />
          </Group>
        );
      })}
    </Group>
  );
} 