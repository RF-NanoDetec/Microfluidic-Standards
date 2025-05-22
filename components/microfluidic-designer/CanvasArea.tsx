'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Stage, Layer, Line, Path, Group, Circle, Rect, Text } from 'react-konva';
import Konva from 'konva';
import type { 
  CanvasItemData, 
  Port, 
  Connection,
  SimulationResults,
  SimulationNode,
  SimulationSegment,
  TubingTypeDefinition
} from "@/lib/microfluidic-designer/types";
import { AVAILABLE_TUBING_TYPES } from "@/lib/microfluidic-designer/types";
import KonvaCanvasItem from './canvas/KonvaCanvasItem';
import { 
  CHANNEL_FILL_COLOR, 
  CHANNEL_OUTLINE_COLOR,
  M3S_TO_ULMIN,
  PASCAL_TO_MBAR,
  M3S_TO_NLMIN
} from '@/lib/microfluidic-designer/constants';
import { calculateTubePathData, calculateTemporaryConnectionPath } from '@/lib/microfluidic-designer/utils/pathUtils';
import { 
  getDynamicFlowColor,
  getPressureIndicatorColor,
  formatFlowRateForDisplay,
  formatFlowVelocityForDisplay
} from '@/lib/microfluidic-designer/utils/visualizationUtils';
import { Button } from '@/components/ui/button';
import { Trash2, PlayCircle, RotateCcw, SquareDashedMousePointer, Move } from 'lucide-react';
import { KonvaEventObject } from 'konva/lib/Node';
import FlowDisplayLegend from './canvas/FlowDisplayLegend';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import TooltipBox from '@/components/ui/TooltipBox';

// NEW: Type for flow display mode
export type FlowDisplayMode = 'velocity' | 'rate';

// Grid configuration
const GRID_SIZE = 10; // Size of each grid cell in pixels
const GRID_COLOR = '#D1D5DB'; // Updated: More visible grid (e.g., zinc-300)
const GRID_STROKE_WIDTH = 0.75; // Updated: Slightly thicker grid lines
const SHADOW_VISIBILITY_MARGIN = 20; // New margin for shadow visibility

// Drawing area boundary styling
const CANVAS_BOUNDARY_COLOR = '#94A3B8'; // Slate-400
const CANVAS_BOUNDARY_WIDTH = 1;
const CANVAS_SHADOW_BLUR = 20; // Base blur, we are overriding this on the Rect itself
const CANVAS_SHADOW_COLOR = 'rgba(0, 0, 0, 0.6)';

// Connection style constants
const CONNECTION_OUTLINE_COLOR = '#555555'; // Dark gray, same as channel outline
const CONNECTION_FILL_COLOR = '#e3f2fd'; // Light blue, same as channel fill
const CONNECTION_SELECTED_OUTLINE_COLOR = '#2c3e50'; // Darker outline for selected connections
const CONNECTION_SELECTED_FILL_COLOR = '#bbdefb'; // Slightly darker fill for selected connections
const CONNECTION_OUTLINE_WIDTH = 5; // Match channel outline width
const CONNECTION_FILL_WIDTH = 3.5; // Match channel fill width

// Simulation visualization constants
const PRESSURE_NODE_RADIUS = 4; // Reduced from 6 
const PRESSURE_TEXT_COLOR = '#333';
const PRESSURE_FONT_SIZE = 8; // Reduced from 10

// Flow visualization constants (REVISED - MAX_EXPECTED_FLOW_M3S will be replaced by dynamic scaling)
const FLOW_COLOR_NO_DATA = '#d0d0d0'; // Grey for no data / NaN
const FLOW_COLOR_ZERO = '#a0a0a0'; // Slightly different grey for zero flow
const FLOW_COLOR_LOW = '#64b5f6'; // Light Blue
// const FLOW_COLOR_MEDIUM = '#1e88e5'; // Blue - will be part of gradient
const FLOW_COLOR_HIGH = '#d32f2f'; // Red
// MAX_EXPECTED_FLOW_M3S will be determined dynamically

// Zoom configuration
const MIN_ZOOM = 1; // Updated based on user feedback
const MAX_ZOOM = 3.0;
const ZOOM_SENSITIVITY = 0.001; // Adjusted sensitivity

// Extended Canvas Area (the full area including under sidebars)
const EXTENDED_CANVAS_WIDTH = 3000;
const EXTENDED_CANVAS_HEIGHT = 1500;

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

  // Simulation visualization and control props
  simulationResults: SimulationResults; 
  simulationVisualsKey?: number;
  onClearCanvas: () => void;
  runSimulation: () => void;
  resetSimulation: () => void;
  simulationInProgress: boolean;
  // New props for inspection/flow mode
  inspectionMode: 'none' | 'pressure' | 'flow';
  setInspectionMode: React.Dispatch<React.SetStateAction<'none' | 'pressure' | 'flow'>>;
  flowDisplayMode: 'rate' | 'velocity';
  setFlowDisplayMode: React.Dispatch<React.SetStateAction<'rate' | 'velocity'>>;

  // New prop to notify parent of stage resize
  onStageResize?: (newDimensions: { width: number; height: number }) => void;
}

// Helper to convert flow rate in m³/s to µL/min for display
const convertToMicrolitersPerMinute = (flowRateM3s: number): number => {
  return flowRateM3s * M3S_TO_ULMIN;
};

// Helper function to generate a segment ID for connections (tubes)
// This needs to match the logic in simulationEngine.ts's getSegmentId
const getTubeSegmentId = (fromItemId: string, fromPortId: string, toItemId: string, toPortId: string): string => {
  const node1Id = `${fromItemId}_${fromPortId.split('_').pop()}`;
  const node2Id = `${toItemId}_${toPortId.split('_').pop()}`;
  const [first, second] = [node1Id, node2Id].sort();
  return `${first}--${second}`;
};

// Helper function to generate a segment ID for internal chip paths (straight/meander)
// This needs to match the logic in simulationEngine.ts's getSegmentId
const getInternalChipSegmentId = (item: CanvasItemData): string | null => {
  if ((item.chipType === 'straight' || item.chipType === 'meander') && item.ports.length === 2) {
    // Port IDs on CanvasItemData.ports are already globally unique (e.g., 'itemId_portBaseId')
    // These are directly used as node IDs in the simulation graph construction for these chip types.
    const node1Id = item.ports[0].id;
    const node2Id = item.ports[1].id;
    const [first, second] = [node1Id, node2Id].sort();
    return `${first}--${second}`;
  }
  // For T/X junctions, flow visualization is more complex due to multiple internal segments.
  // This helper currently doesn't cover T/X internal segments precisely for individual color mapping.
  // The current renderInternalSegmentFlows might show an average or dominant flow.
  // For dynamic scaling, we'll focus on identifiable segments first (tubes, straight/meander internal).
  return null; 
};

// Helper to get pressure color
/* // Moved to visualizationUtils.ts
const getPressureIndicatorColor = (pressurePa: number | undefined): string => {
  // ... function body ...
};
*/

// Helper to convert flow rate from m³/s to a displayable string with appropriate units
/* // Moved to visualizationUtils.ts
const formatFlowRateForDisplay = (flowRateM3s: number): string => {
  // ... function body ...
};
*/

// Helper to convert flow velocity from m/s to a displayable string with appropriate units
/* // Moved to visualizationUtils.ts
const formatFlowVelocityForDisplay = (flowVelocityMps: number): string => {
  // ... function body ...
};
*/

function EmptyCanvasPrompt() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none bg-transparent z-10">
      <div className="bg-[#E1E4E8]/70 px-6 py-5 rounded-lg shadow-lg border border-[#E1E4E8]">
        <div className="mb-2 flex justify-center">
          <SquareDashedMousePointer size={32} className="text-[#003C7E]" />
        </div>
        <h2 className="font-roboto-condensed font-bold text-base text-[#003C7E] mb-1 text-center">Start Designing</h2>
        <p className="font-inter text-sm text-slate-500 text-center max-w-xs">
          Drag components from the palette to build your circuit.
        </p>
      </div>
    </div>
  );
}

function getContrastTextColor(bgColor: string): string {
  // Simple luminance check
  const rgb = hexToRgb(bgColor.replace('rgb(', '').replace(')', ''));
  if (!rgb) return '#fff';
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.6 ? '#003C7E' : '#fff';
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  // Remove # if present
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map(x => x + x).join('');
  }
  if (hex.length !== 6) return null;
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return { r, g, b };
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
  onStagePointerMove,
  simulationResults,
  simulationVisualsKey,
  onClearCanvas,
  runSimulation,
  resetSimulation,
  simulationInProgress,
  inspectionMode,
  setInspectionMode,
  flowDisplayMode,
  setFlowDisplayMode,
  onStageResize,
}: CanvasAreaProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [stageDimensions, setStageDimensions] = useState({ width: 100, height: 100 });
  const containerRef = useRef<HTMLDivElement>(null);
  const stageContainerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [hoveredPressureNode, setHoveredPressureNode] = useState<null | { nodeId: string; x: number; y: number; content: string }>(null);
  const [tooltip, setTooltip] = useState<{ visible: boolean, x: number, y: number, content: string } | null>(null);

  const minMaxFlowValues = useMemo(() => {
    let minValue = Infinity;
    let maxValue = 0;
    const allValues: number[] = [];

    if (!simulationResults || !simulationResults.segmentFlows) {
      return { min: 0, max: 0 };
    }

    connections.forEach(conn => {
      const port1BaseId = conn.fromPortId.startsWith(conn.fromItemId + '_') ? conn.fromPortId.substring(conn.fromItemId.length + 1) : conn.fromPortId;
      const port2BaseId = conn.toPortId.startsWith(conn.toItemId + '_') ? conn.toPortId.substring(conn.toItemId.length + 1) : conn.toPortId;

      const node1Id = `${conn.fromItemId}_${port1BaseId}`;
      const node2Id = `${conn.toItemId}_${port2BaseId}`;
      const segmentIdKey = [node1Id, node2Id].sort().join('--');
      
      const flowRateM3s = simulationResults.segmentFlows[segmentIdKey];

      if (flowRateM3s !== undefined && isFinite(flowRateM3s)) {
        if (inspectionMode === 'flow' && flowDisplayMode === 'velocity') {
          const tubingType = AVAILABLE_TUBING_TYPES.find(t => t.id === conn.tubingTypeId);
          if (tubingType && tubingType.innerRadiusMeters > 0) {
            const areaM2 = Math.PI * Math.pow(tubingType.innerRadiusMeters, 2);
            const velocity = flowRateM3s / areaM2;
            allValues.push(Math.abs(velocity));
          }
        } else if (inspectionMode === 'flow' && flowDisplayMode === 'rate') {
          allValues.push(Math.abs(flowRateM3s));
        }
      }
    });

    droppedItems.forEach(item => {
      if ((item.chipType === 'straight' || item.chipType === 'meander') && item.ports.length === 2) {
        const node1Id = item.ports[0].id;
        const node2Id = item.ports[1].id;
        const segmentIdKey = [node1Id, node2Id].sort().join('--');
        
        const flowRateM3s = simulationResults.segmentFlows[segmentIdKey];

        if (flowRateM3s !== undefined && isFinite(flowRateM3s)) {
          if (inspectionMode === 'flow' && flowDisplayMode === 'velocity') {
            if (item.currentChannelWidthMicrons > 0 && item.currentChannelDepthMicrons > 0) {
              const widthM = item.currentChannelWidthMicrons * 1e-6;
              const heightM = item.currentChannelDepthMicrons * 1e-6;
              const areaM2 = widthM * heightM;
              const velocity = flowRateM3s / areaM2;
              allValues.push(Math.abs(velocity));
            }
          } else if (inspectionMode === 'flow' && flowDisplayMode === 'rate') {
            allValues.push(Math.abs(flowRateM3s));
          }
        }
      }
    });

    if (allValues.length > 0) {
      allValues.forEach(v => {
        const nearZeroThreshold = flowDisplayMode === 'velocity' ? 1e-9 : 1e-13;
        if (v > nearZeroThreshold) { 
             minValue = Math.min(minValue, v);
        }
        maxValue = Math.max(maxValue, v);
      });
      if (minValue === Infinity) minValue = 0;
    } else {
      minValue = 0;
    }
    
    if (minValue > maxValue) minValue = maxValue;

    const unit = flowDisplayMode === 'velocity' ? 'm/s' : 'm³/s';
    console.log(`[CanvasArea] Calculated Min/Max Flow Values (${flowDisplayMode}): Min=${minValue.toExponential(3)} ${unit}, Max=${maxValue.toExponential(3)} ${unit}`);
    return { 
      min: minValue, 
      max: maxValue, 
    };
  }, [simulationResults, connections, droppedItems, inspectionMode, flowDisplayMode]);

  useEffect(() => {
    setIsMounted(true);
    
    const resizeObserver = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry && entry.contentRect) {
        const { width, height } = entry.contentRect;
        console.log(`[CanvasArea] ResizeObserver detected size: ${width}x${height}`);
        // Ensure width and height are positive before setting stage dimensions
        if (width > 0 && height > 0) {
          setStageDimensions({
            width,
            height,
          });
          // Call the new onStageResize callback
          if (onStageResize) {
            onStageResize({ width, height });
          }
        } else {
          // Optionally, set to a small default or log if dimensions are zero
          // For now, we'll just avoid setting zero dimensions
          console.warn(`[CanvasArea] ResizeObserver detected zero or negative dimensions: ${width}x${height}. Not updating stage dimensions.`);
        }
      }
    });
    
    if (stageContainerRef.current) {
      resizeObserver.observe(stageContainerRef.current);
      console.log("[CanvasArea] Started observing stageContainerRef");
    }
    
    return () => {
      if (stageContainerRef.current) {
         resizeObserver.unobserve(stageContainerRef.current);
         console.log("[CanvasArea] Stopped observing stageContainerRef");
      }
      resizeObserver.disconnect();
      setIsMounted(false);
    };
  }, [onStageResize]);

  useEffect(() => {
    console.log("[CanvasArea] Received simulation results:", simulationResults);
  }, [simulationResults]);

  useEffect(() => {
    if (simulationVisualsKey !== undefined) {
      console.log("[CanvasArea] Simulation visuals key changed:", simulationVisualsKey);
    }
  }, [simulationVisualsKey]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  const localHandleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    onDrop(event, containerRef);
  }, [onDrop]);

  const internalHandleStageMouseMove = (e: KonvaEventObject<MouseEvent>) => {
    if (!stageRef.current) return;
    const stage = stageRef.current;
    const pointerPosition = stage.getPointerPosition();
    if (pointerPosition && onStagePointerMove) {
      onStagePointerMove(pointerPosition);
    }
  };
  
  const getPortAbsolutePosition = (itemId: string, portIdSubstring: string): {x: number, y: number} | null => {
    const item = droppedItems.find(i => i.id === itemId);
    if (!item) return null;
    const actualPortId = portIdSubstring.startsWith(item.id + '_') ? portIdSubstring.substring(item.id.length + 1) : portIdSubstring;
    const port = item.ports.find(p => p.id === actualPortId || p.id === `${item.id}_${actualPortId}`);
    if (!port) {
      return null;
    }
    return { x: item.x + port.x, y: item.y + port.y };
  };
  
  const renderGrid = () => {
    const gridLines = [];
    const currentWidth = stageDimensions.width; // Use dynamic width
    const currentHeight = stageDimensions.height; // Use dynamic height

    const minGridX = SHADOW_VISIBILITY_MARGIN;
    const maxGridX = currentWidth - SHADOW_VISIBILITY_MARGIN;
    const minGridY = SHADOW_VISIBILITY_MARGIN;
    const maxGridY = currentHeight - SHADOW_VISIBILITY_MARGIN;

    gridLines.push(
      <Rect
        key="extended-canvas-background"
        x={-EXTENDED_CANVAS_WIDTH/2} // This can remain for off-screen buffer if needed
        y={-EXTENDED_CANVAS_HEIGHT/2} // This can remain for off-screen buffer if needed
        width={EXTENDED_CANVAS_WIDTH}
        height={EXTENDED_CANVAS_HEIGHT}
        fill="#F5F7FA"
        listening={false}
      />
    );
    
    gridLines.push(
      <Rect
        key="conceptual-canvas-bounds" // This is now the dynamic stage bounds
        x={SHADOW_VISIBILITY_MARGIN} // Apply margin
        y={SHADOW_VISIBILITY_MARGIN} // Apply margin
        width={currentWidth - SHADOW_VISIBILITY_MARGIN * 2} // Adjust width for margin
        height={currentHeight - SHADOW_VISIBILITY_MARGIN * 2} // Adjust height for margin
        fill="#FFFFFF" // Set to white
        stroke={CANVAS_BOUNDARY_COLOR}
        strokeWidth={CANVAS_BOUNDARY_WIDTH}
        shadowColor='black'
        shadowBlur={7} // User's preference from last change
        shadowOffset={{ x: 0, y: 0 }} // User's preference from last change
        shadowOpacity={0.15} // User's preference from last change
        cornerRadius={0} // User's preference from last change
        listening={false}
      />
    );
    
    for (let x = 0; x <= currentWidth; x += GRID_SIZE) {
      if (x >= minGridX && x <= maxGridX) {
        gridLines.push(
          <Line
            key={`v-${x}`}
            points={[x, minGridY, x, maxGridY]}
            stroke={GRID_COLOR}
            strokeWidth={GRID_STROKE_WIDTH}
            listening={false}
          />
        );
      }
    }
    
    for (let y = 0; y <= currentHeight; y += GRID_SIZE) {
      if (y >= minGridY && y <= maxGridY) {
        gridLines.push(
          <Line
            key={`h-${y}`}
            points={[minGridX, y, maxGridX, y]}
            stroke={GRID_COLOR}
            strokeWidth={GRID_STROKE_WIDTH}
            listening={false}
          />
        );
      }
    }
    
    return gridLines;
  };

  const calculateInProgressPath = (
    sourceItem: CanvasItemData, 
    sourcePort: Port, 
    mousePos: {x: number, y: number}
  ) => {
    // Convert mouse position from screen coordinates to world coordinates
    // to account for stage scaling and panning
    const stage = stageRef.current;
    if (!stage) return calculateTemporaryConnectionPath(sourceItem, sourcePort, mousePos);
    
    // Calculate the inverse transform to convert from screen to world coordinates
    const stageScale = stage.scaleX();
    const stageX = stage.x();
    const stageY = stage.y();
    
    // Apply inverse transform to get world coordinates
    const worldMousePos = {
      x: (mousePos.x - stageX) / stageScale,
      y: (mousePos.y - stageY) / stageScale
    };
    
    return calculateTemporaryConnectionPath(sourceItem, sourcePort, worldMousePos);
  };

  const getRelativeMousePos = (evt: any) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: evt.evt.clientX - rect.left,
      y: evt.evt.clientY - rect.top,
    };
  };

  const renderInternalSegmentFlows = () => {
    if (inspectionMode !== 'flow') return [];
    const flowElements: React.ReactNode[] = [];
    if (!simulationResults || !simulationResults.segmentFlows) return flowElements;
    
    let minVal = Infinity;
    let maxVal = 0;

    droppedItems.forEach(item => {
      if ((item.chipType === 'straight' || item.chipType === 'meander') && item.ports.length === 2) {
        const port1 = item.ports[0];
        const port2 = item.ports[1];
        const port1Pos = { x: item.x + port1.x, y: item.y + port1.y };
        const port2Pos = { x: item.x + port2.x, y: item.y + port2.y };
        
        const segmentIdKey = [port1.id, port2.id].sort().join('--');
        
        const flowRateM3s = simulationResults.segmentFlows[segmentIdKey];
        if (flowRateM3s !== undefined && isFinite(flowRateM3s)) {
          let displayValue: number | undefined = undefined;
          
          if (inspectionMode === 'flow' && flowDisplayMode === 'velocity') {
            if (item.currentChannelWidthMicrons > 0 && item.currentChannelDepthMicrons > 0) {
              const widthM = item.currentChannelWidthMicrons * 1e-6;
              const heightM = item.currentChannelDepthMicrons * 1e-6;
              const areaM2 = widthM * heightM;
              displayValue = flowRateM3s / areaM2;
            }
          } else if (inspectionMode === 'flow' && flowDisplayMode === 'rate') {
            displayValue = flowRateM3s;
          }
          
          const color = getDynamicFlowColor(displayValue, minMaxFlowValues.min, minMaxFlowValues.max, inspectionMode === 'flow' ? 'velocity' : 'rate');

          const tooltipText = displayValue !== undefined 
            ? (flowDisplayMode === 'velocity' 
                ? `Velocity: ${formatFlowVelocityForDisplay(displayValue)}` 
                : `Flow Rate: ${formatFlowRateForDisplay(flowRateM3s)}`)
            : 'No flow data';

          flowElements.push(
            <Line
              key={`${item.id}-internal-flow`}
              points={[port1Pos.x, port1Pos.y, port2Pos.x, port2Pos.y]}
              stroke={color}
              strokeWidth={CONNECTION_FILL_WIDTH}
              lineCap="round"
              lineJoin="round"
              listening={false}
            />,
            <Line
              key={`${item.id}-internal-hover`}
              points={[port1Pos.x, port1Pos.y, port2Pos.x, port2Pos.y]}
              stroke="transparent"
              strokeWidth={10}
              listening={true}
              onMouseEnter={e => {
                const pos = getRelativeMousePos(e);
                setTooltip({ visible: true, x: pos.x, y: pos.y, content: tooltipText });
              }}
              onMouseMove={e => {
                const pos = getRelativeMousePos(e);
                setTooltip(t => t ? { ...t, x: pos.x, y: pos.y } : null);
              }}
              onMouseLeave={() => setTooltip(null)}
            />
          );
        }
      } else if (item.chipType === 't-type' || item.chipType === 'x-type') {
        const centralJunctionNodeId = `${item.id}_internal_junction`;

        item.ports.forEach(port => {
          const portNodeId = port.id;
          const segmentIdKey = [portNodeId, centralJunctionNodeId].sort().join('--');
          const flowRateM3s = simulationResults.segmentFlows[segmentIdKey];
          
          let displayValue: number | undefined = undefined;
          if (flowRateM3s !== undefined && isFinite(flowRateM3s)) {
            if (inspectionMode === 'flow' && flowDisplayMode === 'velocity') {
              const widthM = (item.currentJunctionWidthMicrons || item.currentChannelWidthMicrons) * 1e-6;
              const heightM = (item.currentJunctionDepthMicrons || item.currentChannelDepthMicrons) * 1e-6;
              if (widthM > 0 && heightM > 0) {
                 const areaM2 = widthM * heightM;
                 displayValue = flowRateM3s / areaM2;
              }
            } else if (inspectionMode === 'flow' && flowDisplayMode === 'rate') {
              displayValue = flowRateM3s;
            }
          }

          const color = getDynamicFlowColor(displayValue, minMaxFlowValues.min, minMaxFlowValues.max, inspectionMode === 'flow' ? 'velocity' : 'rate');
          
          const tooltipText = displayValue !== undefined 
            ? (flowDisplayMode === 'velocity' 
                ? `Velocity: ${formatFlowVelocityForDisplay(displayValue)}` 
                : `Flow Rate: ${formatFlowRateForDisplay(flowRateM3s)}`)
            : 'No flow data';

          const portAbsPos = { x: item.x + port.x, y: item.y + port.y };
          const approxJunctionCenterX = item.x + item.width / 2;
          const approxJunctionCenterY = item.y + item.height / 2;

          flowElements.push(
            <Line
              key={`${item.id}-${port.id}-internal-flow`}
              points={[portAbsPos.x, portAbsPos.y, approxJunctionCenterX, approxJunctionCenterY]}
              stroke={color}
              strokeWidth={CONNECTION_FILL_WIDTH}
              lineCap="round"
              lineJoin="round"
              listening={false}
            />,
            <Line
              key={`${item.id}-${port.id}-internal-hover`}
              points={[portAbsPos.x, portAbsPos.y, approxJunctionCenterX, approxJunctionCenterY]}
              stroke="transparent"
              strokeWidth={10}
              listening={true}
              onMouseEnter={e => {
                const pos = getRelativeMousePos(e);
                setTooltip({ visible: true, x: pos.x, y: pos.y, content: tooltipText });
              }}
              onMouseMove={e => {
                const pos = getRelativeMousePos(e);
                setTooltip(t => t ? { ...t, x: pos.x, y: pos.y } : null);
              }}
              onMouseLeave={() => setTooltip(null)}
            />
          );
        });
      }
    });
    return flowElements;
  };

  const renderSimulationVisuals = (mode: 'none' | 'pressure' | 'flow' = inspectionMode) => {
    const flowVisuals: React.ReactNode[] = [];
    const pressureNodeVisuals: React.ReactNode[] = [];

    if (mode === 'flow') {
      const internalSegmentVisuals = renderInternalSegmentFlows();
      flowVisuals.push(...internalSegmentVisuals);

      if (simulationResults && simulationResults.segmentFlows) {
        connections.forEach(conn => {
          const getBasePortId = (fullPortId: string, itemId: string): string => {
            const prefix = itemId + '_';
            if (fullPortId.startsWith(prefix)) {
              return fullPortId.substring(prefix.length);
            }
            console.warn(`[getBasePortId] Port ID ${fullPortId} for item ${itemId} did not have expected prefix.`);
            return fullPortId;
          };
          const port1BaseId = getBasePortId(conn.fromPortId, conn.fromItemId);
          const port2BaseId = getBasePortId(conn.toPortId, conn.toItemId);

          const node1Id = `${conn.fromItemId}_${port1BaseId}`;
          const node2Id = `${conn.toItemId}_${port2BaseId}`;
          const segmentIdKey = [node1Id, node2Id].sort().join('--');
          const flowRateM3s = simulationResults.segmentFlows[segmentIdKey];
          let displayValueForTube: number | undefined = undefined;
          let tooltipText = 'No flow data';
          if (flowRateM3s !== undefined && isFinite(flowRateM3s)) {
            if (flowDisplayMode === 'velocity') {
              const tubingType = AVAILABLE_TUBING_TYPES.find(t => t.id === conn.tubingTypeId);
              if (tubingType && tubingType.innerRadiusMeters > 0) {
                const areaM2 = Math.PI * Math.pow(tubingType.innerRadiusMeters, 2);
                displayValueForTube = flowRateM3s / areaM2;
                tooltipText = `Velocity: ${formatFlowVelocityForDisplay(displayValueForTube)}`;
              }
            } else {
              displayValueForTube = flowRateM3s;
              tooltipText = `Flow Rate: ${formatFlowRateForDisplay(flowRateM3s)}`;
            }
          }
          flowVisuals.push(
            <Path
              key={`${conn.id}-flow-overlay`}
              data={conn.pathData}
              stroke={'transparent'}
              strokeWidth={10}
              listening={true}
              onMouseEnter={e => {
                const pos = getRelativeMousePos(e);
                setTooltip({ visible: true, x: pos.x, y: pos.y, content: tooltipText });
              }}
              onMouseMove={e => {
                const pos = getRelativeMousePos(e);
                setTooltip(t => t ? { ...t, x: pos.x, y: pos.y } : null);
              }}
              onMouseLeave={() => setTooltip(null)}
            />
          );
        });
      }
    }

    if (mode === 'pressure' && simulationResults && simulationResults.nodePressures) {
      console.log(`[CanvasArea] Processing ${Object.keys(simulationResults.nodePressures).length} node pressures`);
      
      for (const nodeId in simulationResults.nodePressures) {
        const pressurePa = simulationResults.nodePressures[nodeId];
        if (pressurePa === undefined || !isFinite(pressurePa)) continue;

        console.log(`[CanvasArea] Processing node ${nodeId} with pressure ${pressurePa} Pa`);

        if (nodeId.includes('_internal_junction')) {
          const canvasItemId = nodeId.split('_internal_junction')[0];
          const item = droppedItems.find(item => item.id === canvasItemId);
          
          if (item && (item.chipType === 't-type' || item.chipType === 'x-type')) {
            const centerX = item.x + (item.width / 2);
            const centerY = item.y + (item.height / 2);
            
            pressureNodeVisuals.push(
              <Group
                key={`pressure-node-${nodeId}`}
                x={centerX}
                y={centerY}
                tabIndex={0}
                role="button"
                aria-label={`Pressure node: ${pressurePa.toFixed(1)} mbar`}
                className="cursor-pointer focus:outline-none"
                onMouseEnter={e => {
                  const stage = e.target.getStage();
                  if (stage) {
                    const pointerPos = stage.getPointerPosition();
                    if (pointerPos) {
                      setHoveredPressureNode({
                        nodeId,
                        x: pointerPos.x,
                        y: pointerPos.y,
                        content: `Pressure: ${pressurePa.toFixed(2)} mbar${item ? `\nType: ${item.chipType}` : ''}`
                      });
                    }
                  }
                }}
                onMouseLeave={() => setHoveredPressureNode(null)}
              >
                <Circle
                  radius={PRESSURE_NODE_RADIUS}
                  fill={getPressureIndicatorColor(pressurePa)}
                  stroke="#000"
                  strokeWidth={1}
                  shadowColor={getPressureIndicatorColor(pressurePa)}
                  shadowBlur={hoveredPressureNode?.nodeId === nodeId ? 12 : 8}
                  shadowOpacity={hoveredPressureNode?.nodeId === nodeId ? 0.6 : 0.4}
                  scaleX={hoveredPressureNode?.nodeId === nodeId ? 1.15 : 1}
                  scaleY={hoveredPressureNode?.nodeId === nodeId ? 1.15 : 1}
                />
              </Group>
            );
            
            console.log(`[CanvasArea] Added internal junction pressure visual at (${centerX}, ${centerY}) for ${nodeId}`);
            continue;
          }
        }

        const isPortConnected = connections.some(conn => conn.fromPortId === nodeId || conn.toPortId === nodeId);
        if (!isPortConnected) {
          console.log(`[CanvasArea] Skipping pressure visual for unconnected port node ${nodeId}`);
          continue; 
        }

        let canvasItemId, portId;
        
        const actualCanvasItem = droppedItems.find(item => nodeId.includes(item.id));
        
        if (actualCanvasItem) {
          canvasItemId = actualCanvasItem.id;
          
          const remaining = nodeId.replace(canvasItemId + '_', '');
          
          if (remaining.startsWith(canvasItemId + '_')) {
            portId = remaining.substring(canvasItemId.length + 1);
          } else {
            portId = remaining;
          }
          
          if (portId.includes('_')) {
            portId = portId.split('_').pop() || portId;
          }
        } else {
          if (nodeId.includes('_')) {
            const parts = nodeId.split('_');
            
            const candidateParts = parts.filter(part => part.includes('-'));
            
            if (candidateParts.length > 0) {
              canvasItemId = candidateParts[0];
              portId = parts[parts.length - 1];
            } else {
              portId = parts[parts.length - 1];
              canvasItemId = parts.slice(0, -1).join('_');
            }
          } else {
            console.warn(`[CanvasArea] Unexpected node ID format: ${nodeId}`);
            continue;
          }
        }

        console.log(`[CanvasArea] Extracted canvasItemId: ${canvasItemId}, portId: ${portId} from nodeId: ${nodeId}`);
        
        const item = droppedItems.find(item => item.id === canvasItemId);
        if (!item) {
          console.warn(`[CanvasArea] Could not find canvas item with ID ${canvasItemId}`);
          continue;
        }

        let port = item.ports.find(p => p.id === portId);
        
        if (!port) {
          port = item.ports.find(p => p.id === `${canvasItemId}_${portId}`);
        }
        
        if (!port && !portId.startsWith('port_')) {
          port = item.ports.find(p => p.id === `port_${portId}`);
        }

        if (!port) {
          console.warn(`[CanvasArea] Could not find port ${portId} in item ${canvasItemId}. Available ports:`, item.ports.map(p => p.id));
          continue;
        }

        const portX = item.x + port.x;
        const portY = item.y + port.y;

        pressureNodeVisuals.push(
          <Group
            key={`pressure-node-${nodeId}`}
            x={portX}
            y={portY}
            tabIndex={0}
            role="button"
            aria-label={`Pressure node: ${pressurePa.toFixed(1)} mbar`}
            className="cursor-pointer focus:outline-none"
            onMouseEnter={e => {
              const stage = e.target.getStage();
              if (stage) {
                const pointerPos = stage.getPointerPosition();
                if (pointerPos) {
                  setHoveredPressureNode({
                    nodeId,
                    x: pointerPos.x,
                    y: pointerPos.y,
                    content: `Pressure: ${pressurePa.toFixed(2)} mbar${item ? `\nType: ${item.chipType}` : ''}`
                  });
                }
              }
            }}
            onMouseLeave={() => setHoveredPressureNode(null)}
          >
            <Circle
              radius={PRESSURE_NODE_RADIUS}
              fill={getPressureIndicatorColor(pressurePa)}
              stroke="#000"
              strokeWidth={1}
              shadowColor={getPressureIndicatorColor(pressurePa)}
              shadowBlur={hoveredPressureNode?.nodeId === nodeId ? 12 : 8}
              shadowOpacity={hoveredPressureNode?.nodeId === nodeId ? 0.6 : 0.4}
              scaleX={hoveredPressureNode?.nodeId === nodeId ? 1.15 : 1}
              scaleY={hoveredPressureNode?.nodeId === nodeId ? 1.15 : 1}
            />
          </Group>
        );

        console.log(`[CanvasArea] Added port pressure visual at (${portX}, ${portY}) for ${nodeId}`);
      }
    }
    
    return [...flowVisuals, ...pressureNodeVisuals];
  };

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden" onDragOver={e => e.preventDefault()}>
      {droppedItems.length === 0 && <EmptyCanvasPrompt />}
      
      <div 
        ref={stageContainerRef}
        className="absolute inset-0 w-full h-full overflow-hidden"
        onDrop={(e) => onDrop(e, containerRef)}
        onDragOver={handleDragOver}
      >
        <div className="w-full h-full flex justify-center items-center">
          <Stage 
            ref={stageRef}
            width={stageDimensions.width}
            height={stageDimensions.height}
            x={0}
            y={0}
            scaleX={1}
            scaleY={1}
            onClick={onStageClick}
            onContextMenu={onStageContextMenu}
            onPointerMove={internalHandleStageMouseMove}
          >
            <Layer x={0} y={0}>
              {renderGrid()}
              
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
                
                let tubeFillColor = isSelected ? CONNECTION_SELECTED_FILL_COLOR : CONNECTION_FILL_COLOR;
                let tubeOutlineColor = isSelected ? CONNECTION_SELECTED_OUTLINE_COLOR : CONNECTION_OUTLINE_COLOR;

                if (simulationResults && simulationResults.segmentFlows) {
                  const getBasePortId = (fullPortId: string, itemId: string): string => {
                    const prefix = itemId + '_';
                    if (fullPortId.startsWith(prefix)) {
                      return fullPortId.substring(prefix.length);
                    }
                    console.warn(`[getBasePortId] Port ID ${fullPortId} for item ${itemId} did not have expected prefix.`);
                    return fullPortId;
                  };

                  const port1BaseId = getBasePortId(conn.fromPortId, conn.fromItemId);
                  const port2BaseId = getBasePortId(conn.toPortId, conn.toItemId);

                  const node1Id = `${conn.fromItemId}_${port1BaseId}`;
                  const node2Id = `${conn.toItemId}_${port2BaseId}`;
                  
                  const segmentIdKey = [node1Id, node2Id].sort().join('--');
                  
                  const flowRateM3s = simulationResults.segmentFlows[segmentIdKey];
                  console.log(`[TubeRender] ConnID: ${conn.id}, Trying SegmentKey: ${segmentIdKey}, Found Flow: ${flowRateM3s}`);

                  let displayValueForTube: number | undefined = undefined;
                  if (flowRateM3s !== undefined && isFinite(flowRateM3s)) {
                      if (inspectionMode === 'flow' && flowDisplayMode === 'velocity') {
                          const tubingType = AVAILABLE_TUBING_TYPES.find(t => t.id === conn.tubingTypeId);
                          if (tubingType && tubingType.innerRadiusMeters > 0) {
                              const areaM2 = Math.PI * Math.pow(tubingType.innerRadiusMeters, 2);
                              displayValueForTube = flowRateM3s / areaM2;
                          }
                      } else if (inspectionMode === 'flow' && flowDisplayMode === 'rate') {
                          displayValueForTube = flowRateM3s;
                      }
                  }

                  if (displayValueForTube !== undefined) {
                    tubeFillColor = getDynamicFlowColor(displayValueForTube, minMaxFlowValues.min, minMaxFlowValues.max, inspectionMode === 'flow' ? 'velocity' : 'rate');
                  }
                }
                
                return (
                  <Group 
                    key={conn.id} 
                    id={conn.id}
                    opacity={1} 
                  > 
                    <Path
                      data={conn.pathData} 
                      stroke={tubeOutlineColor}
                      strokeWidth={CONNECTION_OUTLINE_WIDTH}
                      lineCap="butt"
                      lineJoin="miter"
                      hitStrokeWidth={12}
                      onClick={(e) => {
                        e.cancelBubble = true; 
                        onTubeClick(conn.id, e);
                      }}
                      id={`${conn.id}_outline`}
                      name="tubeOutline"
                    />
                    
                    <Path
                      data={conn.pathData}
                      stroke={tubeFillColor}
                      strokeWidth={CONNECTION_FILL_WIDTH}
                      lineCap="butt"
                      lineJoin="miter"
                      listening={false}
                      id={`${conn.id}_tube`}
                      name="tubeFill"
                    />
                  </Group>
                );
              })}
              
              {droppedItems.map((item) => {
                const hasActiveSimulationResults = 
                  simulationResults && 
                  (Object.keys(simulationResults.nodePressures || {}).length > 0 || 
                   Object.keys(simulationResults.segmentFlows || {}).length > 0);

                return (
                  <KonvaCanvasItem 
                    key={item.id}
                    item={item} 
                    onDragEnd={onItemDragEnd}
                    isSelected={selectedItemId === item.id}
                    onPortClick={onPortClick} 
                    connections={connections} 
                    isSimulationActive={hasActiveSimulationResults}
                    conceptualCanvasDimensions={{ width: stageDimensions.width, height: stageDimensions.height }}
                  />
                );
              })}
              
              {inProgressConnection && inProgressConnection.sourceItem && inProgressConnection.sourcePort && inProgressConnection.targetMousePos && (
                (() => {
                  const tempPathData = calculateInProgressPath(
                    inProgressConnection.sourceItem,
                    inProgressConnection.sourcePort,
                    inProgressConnection.targetMousePos
                  );
                  
                  return (
                    <>
                      <Path
                        data={tempPathData}
                        stroke={CONNECTION_OUTLINE_COLOR}
                        strokeWidth={CONNECTION_OUTLINE_WIDTH}
                        lineCap="butt"
                        lineJoin="miter"
                        dash={[6, 2]}
                        listening={false}
                      />
                      
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
            
            <Layer x={0} y={0}>
              {simulationResults && inspectionMode !== 'none' && renderSimulationVisuals(inspectionMode)}
            </Layer>
          </Stage>
        </div>
      </div>
      
      {tooltip?.visible && (
        <Popover open={true}>
          <div
            style={{
              position: 'absolute',
              left: tooltip.x + 12,
              top: tooltip.y - 8,
              pointerEvents: 'none',
              zIndex: 1000,
            }}
          >
            <TooltipBox className="select-none" aria-live="polite">
              {tooltip.content}
            </TooltipBox>
          </div>
        </Popover>
      )}
      {hoveredPressureNode && (
        <Popover open={true}>
          <div
            style={{
              position: 'absolute',
              left: hoveredPressureNode.x + 12,
              top: hoveredPressureNode.y - 8,
              pointerEvents: 'none',
              zIndex: 1000,
            }}
          >
            <TooltipBox className="select-none" aria-live="polite">
              {hoveredPressureNode.content}
            </TooltipBox>
          </div>
        </Popover>
      )}
    </div>
  );
} 