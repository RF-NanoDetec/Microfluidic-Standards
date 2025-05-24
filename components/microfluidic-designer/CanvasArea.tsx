'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Stage, Layer, Line, Path, Group, Circle, Rect } from 'react-konva';
import Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';

import KonvaCanvasItem from './canvas/KonvaCanvasItem';
import TooltipBox from '@/components/ui/TooltipBox';
import { Popover } from "@/components/ui/popover";
import type {
  CanvasItemData,
  Port,
  Connection,
  SimulationResults,
} from "@/lib/microfluidic-designer/types";
import { AVAILABLE_TUBING_TYPES } from "@/lib/microfluidic-designer/types";
import {
  CHANNEL_OUTLINE_COLOR,
  CHANNEL_OUTLINE_WIDTH,
  CHANNEL_FILL_WIDTH,
  CHANNEL_CAP,
  CHANNEL_JOIN,
  PASCAL_TO_MBAR,
} from '@/lib/microfluidic-designer/constants';
import {
  calculateTubePathData,
  calculateTemporaryConnectionPath
} from '@/lib/microfluidic-designer/utils/pathUtils';
import {
  getDynamicFlowColor,
  getPressureIndicatorColor,
  formatFlowRateForDisplay,
  formatFlowVelocityForDisplay,
} from '@/lib/microfluidic-designer/utils/visualizationUtils';

// NEW: Type for flow display mode
export type FlowDisplayMode = 'velocity' | 'rate';

// Grid configuration
const GRID_SIZE = 25; // Size of each grid cell in pixels
const GRID_COLOR = '#D1D5DB'; // Updated: More visible grid (e.g., zinc-300)
const GRID_STROKE_WIDTH = 0.75; // Updated: Slightly thicker grid lines
const SHADOW_VISIBILITY_MARGIN = 20; // New margin for shadow visibility

// NEW: Snap distance for connecting tubes to ports
const SNAP_DISTANCE_WORLD = GRID_SIZE * 0.75; // Approx 18.75 world units

// Drawing area boundary styling
const CANVAS_BOUNDARY_COLOR = '#94A3B8'; // Slate-400
const CANVAS_BOUNDARY_WIDTH = 1;


// Connection style constants
const CONNECTION_OUTLINE_COLOR = '#555555'; // Dark gray, same as channel outline
const CONNECTION_FILL_COLOR = '#e3f2fd'; // Light blue, same as channel fill
const CONNECTION_SELECTED_OUTLINE_COLOR = '#2c3e50'; // Darker outline for selected connections
const CONNECTION_SELECTED_FILL_COLOR = '#bbdefb'; // Slightly darker fill for selected connections
const CONNECTION_OUTLINE_WIDTH = 5; // Match channel outline width
const CONNECTION_FILL_WIDTH = 3.5; // Match channel fill width

// Simulation visualization constants
const PRESSURE_NODE_RADIUS = 4; // Reduced from 6 

// Zoom configuration

// Extended Canvas Area (the full area including under sidebars)
const EXTENDED_CANVAS_WIDTH = 3000;
const EXTENDED_CANVAS_HEIGHT = 1500;

const MBAR_TO_BAR = 0.001; // Added constant

interface CanvasAreaProps {
  droppedItems: CanvasItemData[];
  onDrop: (event: React.DragEvent<HTMLDivElement>, containerRef: React.RefObject<HTMLDivElement | null>) => void;
  onItemDragEnd: (itemId: string, newX: number, newY: number) => void;
  selectedItemId: string | null;
  selectedConnectionId: string | null; // For styling selected tubes
  connections: Connection[];
  inProgressConnection?: { sourceItem: CanvasItemData; sourcePort: Port; targetMousePos: {x: number, y: number} } | null;
  
  // Event handlers from page.tsx
  onStageClick: (event: KonvaEventObject<MouseEvent>, snappedTarget: { item: CanvasItemData; port: Port } | null) => void;
  onStageContextMenu: (event: KonvaEventObject<MouseEvent>) => void;
  onPortClick: (itemId: string, port: Port, event: KonvaEventObject<MouseEvent>) => void; // Left-click on port
  onTubeClick: (connectionId: string, event: KonvaEventObject<MouseEvent>) => void; // Left-click on tube
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

  // New props for dynamic pressure coloring
  minPressurePa?: number;
  maxPressurePa?: number;
}



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
  onStagePointerMove,
  simulationResults,
  simulationVisualsKey,
  inspectionMode,
  flowDisplayMode,
  onStageResize,
  minPressurePa,
  maxPressurePa,
}: CanvasAreaProps) {

  const [currentPixelRatio, setCurrentPixelRatio] = useState(1); // New state for pixelRatio
  const [stageDimensions, setStageDimensions] = useState({ width: 100, height: 100 });
  const containerRef = useRef<HTMLDivElement>(null);
  const stageContainerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [hoveredPressureNode, setHoveredPressureNode] = useState<null | { nodeId: string; x: number; y: number; content: string }>(null);
  const [tooltip, setTooltip] = useState<{ visible: boolean, x: number, y: number, content: string } | null>(null);
  const [snappedPortTarget, setSnappedPortTarget] = useState<null | { item: CanvasItemData; port: Port }>(null);
  const activeTweensRef = useRef(new Map<string, Konva.Tween>()); // Ref to store active tweens

  const minMaxFlowValues = useMemo(() => {
    let minValue = Infinity;
    let maxValue = 0; // Initialize maxValue to 0 as we are using Math.abs
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
      } else if (item.chipType === 't-type' || item.chipType === 'x-type') {
        const centralJunctionNodeId = `${item.id}_internal_junction`;
        item.ports.forEach(port => {
          const portNodeId = port.id;
          const segmentIdKey = [portNodeId, centralJunctionNodeId].sort().join('--');
          const flowRateM3s = simulationResults.segmentFlows[segmentIdKey];
          if (flowRateM3s !== undefined && isFinite(flowRateM3s)) {
            if (inspectionMode === 'flow' && flowDisplayMode === 'velocity') {
              const widthMicrons = item.currentJunctionWidthMicrons ?? item.currentChannelWidthMicrons;
              const depthMicrons = item.currentJunctionDepthMicrons ?? item.currentChannelDepthMicrons;
              if (widthMicrons > 0 && depthMicrons > 0) {
                const widthM = widthMicrons * 1e-6;
                const heightM = depthMicrons * 1e-6;
                const areaM2 = widthM * heightM;
                const velocity = flowRateM3s / areaM2;
                allValues.push(Math.abs(velocity));
              }
            } else if (inspectionMode === 'flow' && flowDisplayMode === 'rate') {
              allValues.push(Math.abs(flowRateM3s));
            }
          }
        });
      }
    });

    if (allValues.length > 0) {
      allValues.forEach(v => {
        // const nearZeroThreshold = flowDisplayMode === 'velocity' ? 1e-9 : 1e-13; // Threshold no longer needed here for min value
        // if (v > nearZeroThreshold) { 
        //      minValue = Math.min(minValue, v);
        // }
        // maxValue = Math.max(maxValue, v);
        if (isFinite(v)) { // Ensure value is a valid number
          minValue = Math.min(minValue, v);
          maxValue = Math.max(maxValue, v);
        }
      });
      if (minValue === Infinity) { // If no valid flow values were found
        minValue = 0;
      }
    } else {
      minValue = 0;
      // maxValue remains 0, which is correct if allValues is empty
    }
    
    // This check might still be useful if, for some reason (e.g. all flows are exactly 0),
    // minValue becomes 0 and maxValue becomes 0, but due to prior logic minValue could have ended up > maxValue
    // However, with the current Math.abs and initialization, this should be less likely.
    // For safety, we can keep it, or refine it if it causes issues with truly zero-flow states.
    if (minValue > maxValue) {
        // This case should ideally not happen if all values are positive and maxValue starts at 0.
        // If it does, it might indicate an issue with how values are pushed or an edge case.
        // For now, setting minValue = maxValue is a safe fallback.
        console.warn(`[CanvasArea] minMaxFlowValues: minValue (${minValue}) was greater than maxValue (${maxValue}). Setting minValue = maxValue.`);
        minValue = maxValue;
    }

    const unit = flowDisplayMode === 'velocity' ? 'm/s' : 'm³/s';
    console.log(`[CanvasArea] Calculated Min/Max Flow Values (${flowDisplayMode}): Min=${minValue.toExponential(3)} ${unit}, Max=${maxValue.toExponential(3)} ${unit}`);
    return { 
      min: minValue, 
      max: maxValue, 
    };
  }, [simulationResults, connections, droppedItems, inspectionMode, flowDisplayMode]);

  useEffect(() => {
    setCurrentPixelRatio(window.devicePixelRatio || 1); // Set pixelRatio here
    
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
      const currentContainer = stageContainerRef.current;
      if (currentContainer) {
         resizeObserver.unobserve(currentContainer);
         console.log("[CanvasArea] Stopped observing stageContainerRef");
      }
      resizeObserver.disconnect();
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

  useEffect(() => {
    if (inProgressConnection && inProgressConnection.targetMousePos && stageRef.current) {
      const { sourceItem, targetMousePos } = inProgressConnection;
      const worldMousePos = targetMousePos; // targetMousePos is already in world coordinates

      let closestSnapTarget: { item: CanvasItemData; port: Port; distance: number } | null = null;

      droppedItems.forEach(item => {
        if (item.id === sourceItem.id) return; // Don't snap to source item's own ports

        item.ports.forEach(port => {
          // Future enhancement: check if port is connectable (e.g., not already at max connections)
          const portAbsPos = { x: item.x + port.x, y: item.y + port.y };
          const dx = worldMousePos.x - portAbsPos.x;
          const dy = worldMousePos.y - portAbsPos.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < SNAP_DISTANCE_WORLD) {
            if (!closestSnapTarget || distance < closestSnapTarget.distance) {
              closestSnapTarget = { item, port, distance };
            }
          }
        });
      });

      if (closestSnapTarget) {
        const { item, port } = closestSnapTarget;
        setSnappedPortTarget({ item, port });
      } else {
        setSnappedPortTarget(null);
      }
    } else {
      setSnappedPortTarget(null); // Clear snap if no connection in progress or missing data
    }
  }, [inProgressConnection, droppedItems, stageRef]);

  const handleDragOver = useCallback((_event: React.DragEvent<HTMLDivElement>) => {
    _event.preventDefault();
  }, []);



  const internalHandleStageMouseMove = (_e: KonvaEventObject<MouseEvent>) => {
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

  const getRelativeMousePos = (evt: KonvaEventObject<MouseEvent>) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: evt.evt.clientX - rect.left,
      y: evt.evt.clientY - rect.top,
    };
  };

  const renderInternalSegmentFlows = () => {
    const flowElements: React.ReactNode[] = [];
    if (!simulationResults || !simulationResults.segmentFlows || !stageRef.current) {
      return flowElements;
    }

    const stage = stageRef.current; // Get the stage for finding nodes

    // Small overlap for fill lines to ensure they meet connections cleanly
    const overlapAmount = 0.5; // pixels, adjust as needed

    droppedItems.forEach(item => {
      if (item.ports.length === 2) { // Applies to straight and meander
        const node1Id = item.ports[0].id;
        const node2Id = item.ports[1].id;
        const segmentIdKey = [node1Id, node2Id].sort().join('--');
        const flowRateM3s = simulationResults.segmentFlows[segmentIdKey];

        if (flowRateM3s !== undefined && isFinite(flowRateM3s)) {
          let displayValue: number | undefined = undefined;
          if (flowDisplayMode === 'velocity') {
            if (item.currentChannelWidthMicrons > 0 && item.currentChannelDepthMicrons > 0) {
              const widthM = item.currentChannelWidthMicrons * 1e-6;
              const heightM = item.currentChannelDepthMicrons * 1e-6;
              const areaM2 = widthM * heightM;
              displayValue = flowRateM3s / areaM2;
            }
          } else if (flowDisplayMode === 'rate') {
            displayValue = flowRateM3s;
          }

          const color = getDynamicFlowColor(displayValue, minMaxFlowValues.min, minMaxFlowValues.max, flowDisplayMode);
          const tooltipText = displayValue !== undefined 
            ? (flowDisplayMode === 'velocity' 
                ? formatFlowVelocityForDisplay(displayValue)
                : formatFlowRateForDisplay(flowRateM3s))
            : 'No flow data';

          if (item.chipType === 'straight') {
            const port1Abs = { x: item.x + item.ports[0].x, y: item.y + item.ports[0].y };
            const port2Abs = { x: item.x + item.ports[1].x, y: item.y + item.ports[1].y };

            // Overlap adjustment for FILL line only
            const vecX = port2Abs.x - port1Abs.x;
            const vecY = port2Abs.y - port1Abs.y;
            const len = Math.sqrt(vecX * vecX + vecY * vecY);
            let port1Abs_for_fill = { ...port1Abs };
            let port2Abs_for_fill = { ...port2Abs };

            if (len > 0) {
              const normVecX = vecX / len;
              const normVecY = vecY / len;
              // Extend FILL line start and end points slightly outwards
              port1Abs_for_fill = { x: port1Abs.x - normVecX * overlapAmount, y: port1Abs.y - normVecY * overlapAmount };
              port2Abs_for_fill = { x: port2Abs.x + normVecX * overlapAmount, y: port2Abs.y + normVecY * overlapAmount };
            }
            
            // Outline uses ORIGINAL port positions
            flowElements.push(
              <Line
                key={`${item.id}-internal-flow-outline`}
                points={[port1Abs.x, port1Abs.y, port2Abs.x, port2Abs.y]}
                stroke={CHANNEL_OUTLINE_COLOR}
                strokeWidth={CHANNEL_OUTLINE_WIDTH}
                lineCap={CHANNEL_CAP as 'butt' | 'round' | 'square'}
                lineJoin={CHANNEL_JOIN as 'miter' | 'round' | 'bevel'}
                listening={false}
              />,
              // Fill uses EXTENDED port positions for overlap
              <Line
                key={`${item.id}-internal-flow-fill`}
                points={[port1Abs_for_fill.x, port1Abs_for_fill.y, port2Abs_for_fill.x, port2Abs_for_fill.y]}
                stroke={color}
                strokeWidth={CHANNEL_FILL_WIDTH}
                lineCap={CHANNEL_CAP as 'butt' | 'round' | 'square'}
                lineJoin={CHANNEL_JOIN as 'miter' | 'round' | 'bevel'}
                listening={false}
              />,
              // Hover line uses ORIGINAL port positions
              <Line
                key={`${item.id}-internal-hover`}
                points={[port1Abs.x, port1Abs.y, port2Abs.x, port2Abs.y]}
                stroke={"transparent"}
                strokeWidth={Math.max(10, CHANNEL_OUTLINE_WIDTH)} // Make hover area generous
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
          } else if (item.chipType === 'meander') {
            const meanderFillShape = stage.findOne(`#${item.id}_internalChannelFill`);
            if (meanderFillShape instanceof Konva.Line) {
              meanderFillShape.stroke(color);
              // No new elements pushed to flowElements for meander fill, as we're modifying the existing one.
              // We could potentially add a hover Line here if needed, similar to straight channels,
              // but it would need to follow the meander path as well.
              // For now, let's rely on the hover effects directly on KonvaCanvasItem if any.
              // Or, if a separate hover indication for flow is needed on meanders,
              // that would be a new Line with meanderPoints and transparent stroke.
            } else {
              console.warn(`[CanvasArea] Could not find meander fill shape for item ${item.id}`);
            }
            // The outline for meander is already drawn by KonvaCanvasItem.
            // If we want a hover effect for the flow value display on meanders,
            // we would need to create a new Konva.Line with the meanderPoints here,
            // similar to the transparent hover line for straight channels.
            // This would require accessing or recalculating meanderPoints for the item.
            // For simplicity, this is omitted for now. The tooltip can be triggered by other means
            // or this can be added later if essential.
          }
        } else if (item.chipType === 'meander') {
          // If there's no flow data for a meander, ensure its color is reset to default (or transparent)
          // This assumes KonvaCanvasItem handles the non-simulation state color.
          // If simulation is active but this specific meander has no flow, we might want to explicitly set its color.
          const meanderFillShape = stage.findOne(`#${item.id}_internalChannelFill`);
          if (meanderFillShape instanceof Konva.Line) {
            // What should the color be if simulation is on, but THIS segment has no flow?
            // Option 1: Transparent (if KonvaCanvasItem has a base fill color that shows through)
            // meanderFillShape.stroke("transparent");
            // Option 2: Default channel fill color
            // meanderFillShape.stroke(CHANNEL_FILL_COLOR); // Assuming CHANNEL_FILL_COLOR is imported
            // For now, let's assume KonvaCanvasItem's original fill handles this.
            // Or, if simulation is active, it should perhaps take a "no flow in simulation" color.
            // This part might need refinement based on desired visual behavior.
          }
        }
      } else if (item.chipType === 't-type' || item.chipType === 'x-type') {
        const centralJunctionNodeId = `${item.id}_internal_junction`;
        const approxJunctionCenterX = item.x + item.width / 2;
        const approxJunctionCenterY = item.y + item.height / 2;

        item.ports.forEach(port => {
          const pAbs_original = { x: item.x + port.x, y: item.y + port.y }; // Original port position
          const segmentIdKey = [port.id, centralJunctionNodeId].sort().join('--');
          const flowRateM3s = simulationResults.segmentFlows[segmentIdKey];
          
          if (flowRateM3s !== undefined && isFinite(flowRateM3s)) {
            const vecX = approxJunctionCenterX - pAbs_original.x;
            const vecY = approxJunctionCenterY - pAbs_original.y;
            const len = Math.sqrt(vecX * vecX + vecY * vecY);
            let pAbs_for_fill = { ...pAbs_original };

            if (len > 0) {
              const normVecX = vecX / len;
              const normVecY = vecY / len;
              // Extended coordinate for FILL line's port end only
              pAbs_for_fill = { x: pAbs_original.x - normVecX * overlapAmount, y: pAbs_original.y - normVecY * overlapAmount };
            }
            
            let displayValue: number | undefined = undefined;
            if (flowDisplayMode === 'velocity') {
              const widthM = (item.currentJunctionWidthMicrons || item.currentChannelWidthMicrons || item.width) * 1e-6;
              const heightM = (item.currentJunctionDepthMicrons || item.currentChannelDepthMicrons || item.height) * 1e-6;
              if (widthM > 0 && heightM > 0) {
                 const areaM2 = widthM * heightM;
                 displayValue = flowRateM3s / areaM2;
              }
            } else if (flowDisplayMode === 'rate') {
              displayValue = flowRateM3s;
            }

            const color = getDynamicFlowColor(displayValue, minMaxFlowValues.min, minMaxFlowValues.max, flowDisplayMode);
            const tooltipText = displayValue !== undefined 
              ? (flowDisplayMode === 'velocity' 
                  ? formatFlowVelocityForDisplay(displayValue)
                  : formatFlowRateForDisplay(flowRateM3s))
              : 'No flow data';

            // Outline uses ORIGINAL port position
            flowElements.push(
              <Line
                key={`${item.id}-${port.id}-internal-flow-outline`}
                points={[pAbs_original.x, pAbs_original.y, approxJunctionCenterX, approxJunctionCenterY]}
                stroke={CHANNEL_OUTLINE_COLOR}
                strokeWidth={CHANNEL_OUTLINE_WIDTH}
                lineCap={CHANNEL_CAP as 'butt' | 'round' | 'square'}
                lineJoin={CHANNEL_JOIN as 'miter' | 'round' | 'bevel'}
                listening={false}
              />,
              // Fill uses EXTENDED port position for overlap
              <Line
                key={`${item.id}-${port.id}-internal-flow-fill`}
                points={[pAbs_for_fill.x, pAbs_for_fill.y, approxJunctionCenterX, approxJunctionCenterY]}
                stroke={color}
                strokeWidth={CHANNEL_FILL_WIDTH}
                lineCap={CHANNEL_CAP as 'butt' | 'round' | 'square'}
                lineJoin={CHANNEL_JOIN as 'miter' | 'round' | 'bevel'}
                listening={false}
              />,
              // Hover line uses ORIGINAL port position
              <Line
                key={`${item.id}-${port.id}-internal-hover`}
                points={[pAbs_original.x, pAbs_original.y, approxJunctionCenterX, approxJunctionCenterY]}
                stroke={"transparent"}
                strokeWidth={Math.max(10, CHANNEL_OUTLINE_WIDTH)}
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
    }

    if (mode === 'pressure' && simulationResults && simulationResults.nodePressures) {
      console.log(`[CanvasArea] Processing ${Object.keys(simulationResults.nodePressures).length} node pressures`);
      
      for (const nodeId in simulationResults.nodePressures) {
        const pressurePa = simulationResults.nodePressures[nodeId];
        if (pressurePa === undefined || !isFinite(pressurePa)) continue;

        // Common event handler logic for pressure nodes
        const handlePressureNodeMouseEnter = (e: Konva.KonvaEventObject<MouseEvent>, currentPressurePa: number, id: string) => {
          const group = e.currentTarget as Konva.Group; // Cast to Group
          const konvaNode = group.findOne('.pressureCircle'); // Use selector
          if (!konvaNode) return;

          // Stop and remove any existing tween for this node
          if (activeTweensRef.current.has(id)) {
            activeTweensRef.current.get(id)?.destroy();
          }

          const tween = new Konva.Tween({
            node: konvaNode,
            duration: 0.15, // Fast animation
            scaleX: 1.15,
            scaleY: 1.15,
            shadowBlur: 12,
            shadowOpacity: 0.6,
            easing: Konva.Easings.EaseInOut,
          });
          activeTweensRef.current.set(id, tween);
          tween.play();

          const pos = getRelativeMousePos(e);
          const pressureMbar = currentPressurePa * PASCAL_TO_MBAR;
          let displayPressure;
          if (Math.abs(pressureMbar) >= 1000) {
            displayPressure = (pressureMbar * MBAR_TO_BAR).toFixed(2) + ' bar';
          } else {
            displayPressure = pressureMbar.toFixed(2) + ' mbar';
          }
          setHoveredPressureNode({
            nodeId: id,
            x: pos.x,
            y: pos.y,
            content: `${displayPressure}`
          });
        };

        const handlePressureNodeMouseLeave = (e: Konva.KonvaEventObject<MouseEvent>, id: string) => {
          const group = e.currentTarget as Konva.Group; // Cast to Group
          const konvaNode = group.findOne('.pressureCircle'); // Use selector
          if (!konvaNode) return;

          // Stop and remove any existing tween for this node
          if (activeTweensRef.current.has(id)) {
            activeTweensRef.current.get(id)?.destroy();
          }

          const tween = new Konva.Tween({
            node: konvaNode,
            duration: 0.15,
            scaleX: 1,
            scaleY: 1,
            shadowBlur: 8,
            shadowOpacity: 0.4,
            easing: Konva.Easings.EaseInOut,
          });
          activeTweensRef.current.set(id, tween);
          tween.play();
          
          setHoveredPressureNode(null);
        };

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
                aria-label={`Pressure node: ${(pressurePa * PASCAL_TO_MBAR).toFixed(1)} mbar`}
                className="cursor-pointer focus:outline-none"
                onMouseEnter={e => handlePressureNodeMouseEnter(e, pressurePa, nodeId)}
                onMouseLeave={e => handlePressureNodeMouseLeave(e, nodeId)}
              >
                <Circle
                  name="pressureCircle" // Added name for tweening
                  radius={PRESSURE_NODE_RADIUS}
                  fill={getPressureIndicatorColor(pressurePa, minPressurePa, maxPressurePa)}
                  stroke={CHANNEL_OUTLINE_COLOR}
                  strokeWidth={1}
                  shadowColor={getPressureIndicatorColor(pressurePa, minPressurePa, maxPressurePa)}
                  shadowBlur={8} // Initial value
                  shadowOpacity={0.4} // Initial value
                  scaleX={1} // Initial value
                  scaleY={1} // Initial value
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

        let foundItem: CanvasItemData | undefined = undefined;
        let foundPort: Port | undefined = undefined;

        for (const item of droppedItems) {
          const port = item.ports.find(p => p.id === nodeId);
          if (port) {
            foundItem = item;
            foundPort = port;
            break;
          }
        }

        if (!foundItem || !foundPort) {
          console.warn(`[CanvasArea] Could not find item/port for nodeId: ${nodeId}. This node might be an internal junction or there's a mismatch.`);
          // Check if it's an internal node that was missed by the earlier check (shouldn't happen if logic is correct)
          if (nodeId.includes('_internal_junction')) {
            console.log(`[CanvasArea] Node ${nodeId} confirmed as internal, should have been handled earlier.`);
          } else {
            console.log(`[CanvasArea] Node ${nodeId} is not an internal junction and was not found as a direct port. Available nodeIds from results:`, Object.keys(simulationResults.nodePressures));
            console.log(`[CanvasArea] Dropped items and their port IDs:`);
            droppedItems.forEach(di => {
              console.log(`  Item ${di.id}: Ports: ${di.ports.map(p => p.id).join(', ')}`);
            });
          }
          continue;
        }
        
        const item = foundItem;
        const port = foundPort;
        
        const portX = item.x + port.x;
        const portY = item.y + port.y;

        pressureNodeVisuals.push(
          <Group
            key={`pressure-node-${nodeId}`}
            x={portX}
            y={portY}
            tabIndex={0}
            role="button"
            aria-label={`Pressure node: ${(pressurePa * PASCAL_TO_MBAR).toFixed(1)} mbar`}
            className="cursor-pointer focus:outline-none"
            onMouseEnter={e => handlePressureNodeMouseEnter(e, pressurePa, nodeId)}
            onMouseLeave={e => handlePressureNodeMouseLeave(e, nodeId)}
          >
            <Circle
              name="pressureCircle" // Added name for tweening
              radius={PRESSURE_NODE_RADIUS}
              fill={getPressureIndicatorColor(pressurePa, minPressurePa, maxPressurePa)}
              stroke={CHANNEL_OUTLINE_COLOR}
              strokeWidth={1}
              shadowColor={getPressureIndicatorColor(pressurePa, minPressurePa, maxPressurePa)}
              shadowBlur={8}      // Initial value
              shadowOpacity={0.4} // Initial value
              scaleX={1}          // Initial value
              scaleY={1}          // Initial value
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
            pixelRatio={currentPixelRatio}
            onClick={(e: KonvaEventObject<MouseEvent>) => {
              if (onStageClick) {
                onStageClick(e, snappedPortTarget);
              }
            }}
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
                const tubeOutlineColor = isSelected ? CONNECTION_SELECTED_OUTLINE_COLOR : CONNECTION_OUTLINE_COLOR;

                // Get flow data for tooltip
                let flowTooltipText = 'No flow data';
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
                              flowTooltipText = formatFlowVelocityForDisplay(displayValueForTube);
                          }
                      } else if (inspectionMode === 'flow' && flowDisplayMode === 'rate') {
                          displayValueForTube = flowRateM3s;
                          flowTooltipText = formatFlowRateForDisplay(flowRateM3s);
                      }
                  }

                  if (displayValueForTube !== undefined && inspectionMode === 'flow') {
                    tubeFillColor = getDynamicFlowColor(displayValueForTube, minMaxFlowValues.min, minMaxFlowValues.max, flowDisplayMode);
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
                      onMouseEnter={(e) => {
                        if (inspectionMode === 'flow' && simulationResults) {
                          const pos = getRelativeMousePos(e);
                          setTooltip({ visible: true, x: pos.x, y: pos.y, content: flowTooltipText });
                        }
                      }}
                      onMouseMove={(e) => {
                        if (inspectionMode === 'flow' && simulationResults && tooltip) {
                          const pos = getRelativeMousePos(e);
                          setTooltip(t => t ? { ...t, x: pos.x, y: pos.y } : null);
                        }
                      }}
                      onMouseLeave={() => {
                        if (inspectionMode === 'flow') {
                          setTooltip(null);
                        }
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
                  let tempPathData;
                  const sourceItem = inProgressConnection.sourceItem;
                  const sourcePort = inProgressConnection.sourcePort;

                  if (snappedPortTarget && snappedPortTarget.item.id !== sourceItem.id) {
                    const targetItem = snappedPortTarget.item;
                    const targetPort = snappedPortTarget.port;

                    // Pass the full item and port objects as per calculateTubePathData signature
                    tempPathData = calculateTubePathData(sourceItem, sourcePort, targetItem, targetPort);
                  } else {
                    // Not snapped, or targetMousePos is explicitly needed for direct mouse following.
                    // calculateInProgressPath takes world coordinates for its targetMousePos argument.
                    tempPathData = calculateInProgressPath(
                      sourceItem,
                      sourcePort,
                      inProgressConnection.targetMousePos
                    );
                  }

                  if (!tempPathData) return null;
                  
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