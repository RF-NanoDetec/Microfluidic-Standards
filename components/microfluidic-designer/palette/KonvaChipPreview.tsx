'use client';

import {
  Stage,
  Layer,
  Rect,
  Line,
  Circle,
  Group,
  Path,
  Image
} from 'react-konva';
import {
  CHIP_WIDTH,
  CHIP_HEIGHT,
  PREVIEW_RECT_STYLE,
  CHANNEL_FILL_COLOR,
  CHANNEL_OUTLINE_COLOR,
  CHANNEL_FILL_WIDTH,
  CHANNEL_OUTLINE_WIDTH,
  CHANNEL_CAP,
  CHANNEL_JOIN,
  PUMP_SVG_DATA_URI,
  OUTLET_SVG_DATA_URI,
  OUTLET_WIDTH,
  OUTLET_HEIGHT,
  SHADOW_STYLE_DEFAULT,
  SHADOW_STYLE_STRONG
} from '@/lib/microfluidic-designer/constants';
import { useEffect, useState } from 'react';

interface KonvaChipPreviewProps {
  chipType: string;
  isHovered?: boolean;
}

export default function KonvaChipPreview({ chipType, isHovered = false }: KonvaChipPreviewProps) {
  // Increased stage size to accommodate shadows (was 50x50)
  const stageWidth = 70;
  const stageHeight = 70;
  
  // Use the visual styles from the original site
  const fillColor = PREVIEW_RECT_STYLE.fill;
  const fillOpacity = PREVIEW_RECT_STYLE.opacity;
  const strokeColor = PREVIEW_RECT_STYLE.stroke;
  const strokeWidth = PREVIEW_RECT_STYLE.strokeWidth;
  
  // For SVG images
  const [pumpImage, setPumpImage] = useState<HTMLImageElement | null>(null);
  const [outletImage, setOutletImage] = useState<HTMLImageElement | null>(null);
  
  // Calculate scale factor to fit the components within the stage
  // If hovered, scale up
  const scaleBase = Math.min(stageWidth / CHIP_WIDTH, stageHeight / CHIP_HEIGHT) * 0.6;
  const scale = isHovered ? scaleBase * 1.08 : scaleBase;
  
  // Get the appropriate shadow style based on hover state
  const shadowStyle = isHovered ? SHADOW_STYLE_STRONG : SHADOW_STYLE_DEFAULT;
  
  // Center the chip in the preview
  const offsetX = (stageWidth - CHIP_WIDTH * scale) / 2;
  const offsetY = (stageHeight - CHIP_HEIGHT * scale) / 2;
  
  // Load SVG images
  useEffect(() => {
    if (chipType === 'pump') {
      const image = new window.Image();
      image.src = PUMP_SVG_DATA_URI;
      image.onload = () => {
        setPumpImage(image);
      };
    } else if (chipType === 'outlet') {
      const image = new window.Image();
      image.src = OUTLET_SVG_DATA_URI;
      image.onload = () => {
        setOutletImage(image);
      };
    }
  }, [chipType]);
  
  let shapes = null;

  switch (chipType) {
    case 'straight':
      shapes = (
        <Group x={offsetX} y={offsetY} scaleX={scale} scaleY={scale}>
          {/* Main chip body */}
          <Rect
            width={CHIP_WIDTH}
            height={CHIP_HEIGHT}
            fill={fillColor}
            opacity={fillOpacity}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            cornerRadius={0} // No rounded corners
            name="component-border"
            {...shadowStyle}
          />
          
          {/* Channel outline (drawn first) */}
          <Line
            points={[0, CHIP_HEIGHT / 2, CHIP_WIDTH, CHIP_HEIGHT / 2]}
            stroke={CHANNEL_OUTLINE_COLOR}
            strokeWidth={CHANNEL_OUTLINE_WIDTH}
            lineCap={CHANNEL_CAP as any}
            lineJoin={CHANNEL_JOIN as any}
            {...shadowStyle}
            shadowOpacity={0.1}
          />
          
          {/* Channel fill (drawn on top) */}
          <Line
            points={[0, CHIP_HEIGHT / 2, CHIP_WIDTH, CHIP_HEIGHT / 2]}
            stroke={CHANNEL_FILL_COLOR}
            strokeWidth={CHANNEL_FILL_WIDTH}
            lineCap={CHANNEL_CAP as any}
            lineJoin={CHANNEL_JOIN as any}
          />
        </Group>
      );
      break;
      
    case 'x-type':
      // Center point for reference
      const centerX = CHIP_WIDTH / 2;
      const centerY = CHIP_HEIGHT / 2;
      
      shapes = (
        <Group x={offsetX} y={offsetY} scaleX={scale} scaleY={scale}>
          {/* Main chip body */}
          <Rect
            width={CHIP_WIDTH}
            height={CHIP_HEIGHT}
            fill={fillColor}
            opacity={fillOpacity}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            cornerRadius={0} // No rounded corners
            name="component-border"
            {...shadowStyle}
          />
          
          {/* Channel outline - horizontal */}
          <Line
            points={[0, centerY, CHIP_WIDTH, centerY]}
            stroke={CHANNEL_OUTLINE_COLOR}
            strokeWidth={CHANNEL_OUTLINE_WIDTH}
            lineCap={CHANNEL_CAP as any}
            lineJoin={CHANNEL_JOIN as any}
            {...shadowStyle}
            shadowOpacity={0.1}
          />
          
          {/* Channel outline - vertical */}
          <Line
            points={[centerX, 0, centerX, CHIP_HEIGHT]}
            stroke={CHANNEL_OUTLINE_COLOR}
            strokeWidth={CHANNEL_OUTLINE_WIDTH}
            lineCap={CHANNEL_CAP as any}
            lineJoin={CHANNEL_JOIN as any}
            {...shadowStyle}
            shadowOpacity={0.1}
          />
          
          {/* Junction center circle for clean appearance */}
          <Circle
            x={centerX}
            y={centerY}
            radius={CHANNEL_OUTLINE_WIDTH/2}
            fill={CHANNEL_OUTLINE_COLOR}
            {...shadowStyle}
            shadowOpacity={0.1}
          />
          
          {/* Channel fill - horizontal */}
          <Line
            points={[0, centerY, CHIP_WIDTH, centerY]}
            stroke={CHANNEL_FILL_COLOR}
            strokeWidth={CHANNEL_FILL_WIDTH}
            lineCap={CHANNEL_CAP as any}
            lineJoin={CHANNEL_JOIN as any}
          />
          
          {/* Channel fill - vertical */}
          <Line
            points={[centerX, 0, centerX, CHIP_HEIGHT]}
            stroke={CHANNEL_FILL_COLOR}
            strokeWidth={CHANNEL_FILL_WIDTH}
            lineCap={CHANNEL_CAP as any}
            lineJoin={CHANNEL_JOIN as any}
          />
        </Group>
      );
      break;
      
    case 't-type':
      // Center point for reference
      const tCenterX = CHIP_WIDTH / 2;
      const tCenterY = CHIP_HEIGHT / 2;
      
      shapes = (
        <Group x={offsetX} y={offsetY} scaleX={scale} scaleY={scale}>
          {/* Main chip body */}
          <Rect
            width={CHIP_WIDTH}
            height={CHIP_HEIGHT}
            fill={fillColor}
            opacity={fillOpacity}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            cornerRadius={0} // No rounded corners
            name="component-border"
            {...shadowStyle}
          />
          
          {/* Updated T-Junction with vertical main channel and right branch */}
          
          {/* Channel outline - vertical (top to bottom) */}
          <Line
            points={[tCenterX, 0, tCenterX, CHIP_HEIGHT]}
            stroke={CHANNEL_OUTLINE_COLOR}
            strokeWidth={CHANNEL_OUTLINE_WIDTH}
            lineCap={CHANNEL_CAP as any}
            lineJoin={CHANNEL_JOIN as any}
            {...shadowStyle}
            shadowOpacity={0.1}
          />
          
          {/* Channel outline - horizontal (center to right) */}
          <Line
            points={[tCenterX, tCenterY, CHIP_WIDTH, tCenterY]}
            stroke={CHANNEL_OUTLINE_COLOR}
            strokeWidth={CHANNEL_OUTLINE_WIDTH}
            lineCap={CHANNEL_CAP as any}
            lineJoin={CHANNEL_JOIN as any}
            {...shadowStyle}
            shadowOpacity={0.1}
          />
          
          {/* Junction center circle for clean appearance */}
          <Circle
            x={tCenterX}
            y={tCenterY}
            radius={CHANNEL_OUTLINE_WIDTH/2}
            fill={CHANNEL_OUTLINE_COLOR}
            {...shadowStyle}
            shadowOpacity={0.1}
          />
          
          {/* Channel fill - vertical (top to bottom) */}
          <Line
            points={[tCenterX, 0, tCenterX, CHIP_HEIGHT]}
            stroke={CHANNEL_FILL_COLOR}
            strokeWidth={CHANNEL_FILL_WIDTH}
            lineCap={CHANNEL_CAP as any}
            lineJoin={CHANNEL_JOIN as any}
          />
          
          {/* Channel fill - horizontal (center to right) */}
          <Line
            points={[tCenterX, tCenterY, CHIP_WIDTH, tCenterY]}
            stroke={CHANNEL_FILL_COLOR}
            strokeWidth={CHANNEL_FILL_WIDTH}
            lineCap={CHANNEL_CAP as any}
            lineJoin={CHANNEL_JOIN as any}
          />
        </Group>
      );
      break;
      
    case 'meander':
      // Using the exact same approach from the canvas implementation
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
      
      shapes = (
        <Group x={offsetX} y={offsetY} scaleX={scale} scaleY={scale}>
          {/* Main chip body */}
          <Rect
            width={CHIP_WIDTH}
            height={CHIP_HEIGHT}
            fill={fillColor}
            opacity={fillOpacity}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            cornerRadius={0} // No rounded corners
            name="component-border"
            {...shadowStyle}
          />
          
          {/* Meander channel outline (drawn first) */}
          <Line
            points={meanderPoints}
            stroke={CHANNEL_OUTLINE_COLOR}
            strokeWidth={CHANNEL_OUTLINE_WIDTH}
            lineCap={CHANNEL_CAP as any}
            lineJoin={CHANNEL_JOIN as any}
            {...shadowStyle}
            shadowOpacity={0.1}
          />
          
          {/* Meander channel fill (drawn on top) */}
          <Line
            points={meanderPoints}
            stroke={CHANNEL_FILL_COLOR}
            strokeWidth={CHANNEL_FILL_WIDTH}
            lineCap={CHANNEL_CAP as any}
            lineJoin={CHANNEL_JOIN as any}
          />
        </Group>
      );
      break;
      
    case 'pump':
      // Use the original SVG image but scale it down for preview
      shapes = pumpImage ? (
        <Group x={stageWidth/2} y={stageHeight/2} scaleX={scale} scaleY={scale}>
          <Image 
            image={pumpImage} 
            width={stageWidth * 0.7}
            height={stageHeight * 0.7}
            offsetX={stageWidth * 0.7 / 2}
            offsetY={stageHeight * 0.7 / 2}
            {...shadowStyle}
          />
        </Group>
      ) : (
        // Fallback while image is loading
        <Group x={offsetX} y={offsetY} scaleX={scale} scaleY={scale}>
          <Circle
            x={CHIP_WIDTH/2}
            y={CHIP_HEIGHT/2}
            radius={CHIP_WIDTH/2.5}
            fill={fillColor}
            opacity={fillOpacity}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            {...shadowStyle}
          />
        </Group>
      );
      break;
      
    case 'outlet':
      // Use the exact SVG image from the original, but scaled down for preview
      const outletImageScaleFactor = 1.26; // Reduced by 10% from 1.4 for better fit
      shapes = outletImage ? (
        <Group x={offsetX} y={offsetY} scaleX={scale} scaleY={scale}>
          <Rect
            width={CHIP_WIDTH} // This Rect acts as a container for centering the image
            height={CHIP_HEIGHT}
            fill="transparent"
            stroke="transparent"
            strokeWidth={0}
            cornerRadius={0}
          />
          <Image
            image={outletImage}
            width={OUTLET_WIDTH * outletImageScaleFactor}
            height={OUTLET_HEIGHT * outletImageScaleFactor}
            x={(CHIP_WIDTH - (OUTLET_WIDTH * outletImageScaleFactor)) / 2} // Center the enlarged image within the container Rect
            y={(CHIP_HEIGHT - (OUTLET_HEIGHT * outletImageScaleFactor)) / 2} // Center the enlarged image
            {...shadowStyle}
          />
        </Group>
      ) : (
        // Fallback while image is loading
        <Group x={offsetX} y={offsetY} scaleX={scale} scaleY={scale}>
          <Rect
            width={CHIP_WIDTH}
            height={CHIP_HEIGHT}
            fill={fillColor}
            opacity={fillOpacity}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            cornerRadius={0}
            {...shadowStyle}
          />
        </Group>
      );
      break;
      
    default:
      shapes = <Rect x={10} y={10} width={30} height={30} stroke="#FC8181" fill="#FFF5F5" cornerRadius={0} {...shadowStyle} />;
  }

  return (
    <Stage 
      width={stageWidth} 
      height={stageHeight}
    >
      <Layer>{shapes}</Layer>
    </Stage>
  );
} 