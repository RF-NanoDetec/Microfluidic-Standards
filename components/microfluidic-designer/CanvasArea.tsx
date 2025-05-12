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
import { Trash2, PlayCircle, RotateCcw, SquareDashedMousePointer } from 'lucide-react';
import { KonvaEventObject } from 'konva/lib/Node';
import FlowDisplayLegend from './canvas/FlowDisplayLegend';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import TooltipBox from '@/components/ui/TooltipBox';

// NEW: Type for flow display mode
export type FlowDisplayMode = 'velocity' | 'rate';

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
      <SquareDashedMousePointer
        size={48}
        strokeWidth={2}
        className="text-[#003C7E] mb-4 animate-fade-in"
        aria-hidden="true"
      />
      <div className="text-center">
        <h2 className="font-roboto-condensed font-bold text-2xl text-[#003C7E] mb-2">Start Designing</h2>
        <p className="font-inter text-base text-[#003C7E] max-w-md mx-auto">
          Drag a component from the <span className="font-semibold">left palette</span> and drop it here to build your microfluidic system.
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
  setFlowDisplayMode
}: CanvasAreaProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [stageDimensions, setStageDimensions] = useState({ width: 100, height: 100 });
  const containerRef = useRef<HTMLDivElement>(null);
  const stageContainerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [hoveredPressureNode, setHoveredPressureNode] = useState<null | { nodeId: string; x: number; y: number; content: string }>(null);
  const [tooltip, setTooltip] = useState<{ visible: boolean, x: number, y: number, content: string } | null>(null);

  // Calculate min/max flow velocities or rates from simulation results for dynamic scaling
  const minMaxFlowValues = useMemo(() => {
    let minValue = Infinity;
    let maxValue = 0;
    const allValues: number[] = [];

    if (!simulationResults || !simulationResults.segmentFlows) {
      return { min: 0, max: 0 };
    }

    // 1. Values from Connections (Tubes)
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

    // 2. Values from Internal Chip Paths (Straight/Meander for now)
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
      // TODO: Extend to T/X junction internal segments for both modes
    });

    if (allValues.length > 0) {
      allValues.forEach(v => {
        // For rates, 1e-13 m3/s is very small (6 nL/min). For velocity, 1e-9 m/s is very small.
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
    
    // Use ResizeObserver to get accurate dimensions of the flex container for the stage
    const resizeObserver = new ResizeObserver(entries => {
      // We expect only one entry since we are observing a single element
      const entry = entries[0];
      if (entry && entry.contentRect) {
        const { width, height } = entry.contentRect;
        console.log(`[CanvasArea] ResizeObserver detected size: ${width}x${height}`);
        setStageDimensions({
          width,
          height,
        });
      }
    });
    
    // Start observing the stage container div
    if (stageContainerRef.current) {
      resizeObserver.observe(stageContainerRef.current);
      console.log("[CanvasArea] Started observing stageContainerRef");
    }
    
    // Cleanup function to disconnect the observer when the component unmounts
    return () => {
      if (stageContainerRef.current) {
         resizeObserver.unobserve(stageContainerRef.current);
         console.log("[CanvasArea] Stopped observing stageContainerRef");
      }
      resizeObserver.disconnect();
       setIsMounted(false); // Optionally reset mounted state
    };
  }, []); // Empty dependency array means this effect runs only once on mount and cleans up on unmount

  // Log when simulation results or key change
  useEffect(() => {
    console.log("[CanvasArea] Received simulation results:", simulationResults);
  }, [simulationResults]);

  useEffect(() => {
    if (simulationVisualsKey !== undefined) {
      console.log("[CanvasArea] Simulation visuals key changed:", simulationVisualsKey);
      // This key change can be used to trigger re-rendering of specific visual elements if needed
    }
  }, [simulationVisualsKey]);

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
  
  const getPortAbsolutePosition = (itemId: string, portIdSubstring: string): {x: number, y: number} | null => {
    const item = droppedItems.find(i => i.id === itemId);
    if (!item) return null;
    // portIdSubstring in simulation node is like itemID_portID, we need the part after itemID_
    const actualPortId = portIdSubstring.startsWith(item.id + '_') ? portIdSubstring.substring(item.id.length + 1) : portIdSubstring;
    const port = item.ports.find(p => p.id === actualPortId || p.id === `${item.id}_${actualPortId}`);
    if (!port) {
      // console.warn(`[CanvasArea] Port not found for item ${itemId}, portIdSubstring ${portIdSubstring} (actualPortId: ${actualPortId})`);
      return null;
    }
    return { x: item.x + port.x, y: item.y + port.y };
  };
  
  // Generate grid lines for the canvas
  const renderGrid = () => {
    const gridLines = [];
    const { width, height } = stageDimensions;
    
    // Draw vertical grid lines
    for (let x = 0; x < width; x += GRID_SIZE) {
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
    for (let y = 0; y < height; y += GRID_SIZE) {
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

  // Helper to get relative mouse position in the canvas container
  const getRelativeMousePos = (evt: any) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: evt.evt.clientX - rect.left,
      y: evt.evt.clientY - rect.top,
    };
  };

  // Process internal segments for T-type and X-type junctions
  const renderInternalSegmentFlows = () => {
    // Only render segment overlays in flow mode
    if (inspectionMode !== 'flow') return [];
    const flowElements: React.ReactNode[] = [];
    if (!simulationResults || !simulationResults.segmentFlows) return flowElements;
    
    // Calculate min/max for internal flow scaling - temporary workaround
    let minVal = Infinity;
    let maxVal = 0;

    droppedItems.forEach(item => {
      // Handle straight and meander chips
      if ((item.chipType === 'straight' || item.chipType === 'meander') && item.ports.length === 2) {
        // Get the port positions
        const port1 = item.ports[0];
        const port2 = item.ports[1];
        const port1Pos = { x: item.x + port1.x, y: item.y + port1.y };
        const port2Pos = { x: item.x + port2.x, y: item.y + port2.y };
        
        // Get flow segment ID - should match what's in simulationEngine
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
          
          // Restore dynamic color calculation
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
          // Optionally, add text for flow rate/velocity
        }
      } else if (item.chipType === 't-type' || item.chipType === 'x-type') {
        // For T/X junctions, visualize flows for each internal segment
        // This requires knowing the internal junction node ID and how ports connect to it.
        const centralJunctionNodeId = `${item.id}_internal_junction`; // As defined in simulationEngine

        item.ports.forEach(port => {
          const portNodeId = port.id; // Already global: item.id + "_" + port.id (base)
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

          // Restore dynamic color calculation
          const color = getDynamicFlowColor(displayValue, minMaxFlowValues.min, minMaxFlowValues.max, inspectionMode === 'flow' ? 'velocity' : 'rate');
          
          const tooltipText = displayValue !== undefined 
            ? (flowDisplayMode === 'velocity' 
                ? `Velocity: ${formatFlowVelocityForDisplay(displayValue)}` 
                : `Flow Rate: ${formatFlowRateForDisplay(flowRateM3s)}`)
            : 'No flow data';

          const portAbsPos = { x: item.x + port.x, y: item.y + port.y };
          // Approximate junction center visually for now.
          // A more accurate representation would use the actual junction node coordinates if stored.
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

  // Modify the renderSimulationVisuals function
  const renderSimulationVisuals = (mode: 'none' | 'pressure' | 'flow' = inspectionMode) => {
    const flowVisuals: React.ReactNode[] = [];
    const pressureNodeVisuals: React.ReactNode[] = [];

    // Only add flow visuals in flow mode
    if (mode === 'flow') {
      // Add internal segment flow visualizations
      const internalSegmentVisuals = renderInternalSegmentFlows();
      flowVisuals.push(...internalSegmentVisuals);

      // Add flow visualizations for connections (tubes)
      if (simulationResults && simulationResults.segmentFlows) {
        connections.forEach(conn => {
          // --- Start Calculation for this Connection --- 
          const getBasePortId = (fullPortId: string, itemId: string): string => {
            const prefix = itemId + '_';
            if (fullPortId.startsWith(prefix)) {
              return fullPortId.substring(prefix.length);
            }
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
            } else { // 'rate'
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
          // --- End Calculation/Push for this Connection ---
        });
      }
    }

    // Next, collect all pressure node visualizations
    if (mode === 'pressure' && simulationResults && simulationResults.nodePressures) {
      // Add debugging for number of nodes being processed
      console.log(`[CanvasArea] Processing ${Object.keys(simulationResults.nodePressures).length} node pressures`);
      
      for (const nodeId in simulationResults.nodePressures) {
        const pressurePa = simulationResults.nodePressures[nodeId];
        if (pressurePa === undefined || !isFinite(pressurePa)) continue;

        // Debugging node processing
        console.log(`[CanvasArea] Processing node ${nodeId} with pressure ${pressurePa} Pa`);

        // Check if this is an internal node (like a T or X junction)
        if (nodeId.includes('_internal_junction')) {
          // This is an internal junction node - find the actual canvas item ID
          // The format is usually: itemId_internal_junction
          const canvasItemId = nodeId.split('_internal_junction')[0];
          const item = droppedItems.find(item => item.id === canvasItemId);
          
          if (item && (item.chipType === 't-type' || item.chipType === 'x-type')) {
            // Calculate center position
            const centerX = item.x + (item.width / 2);
            const centerY = item.y + (item.height / 2);
            
            // Create pressure node for internal junction
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
                  // Get absolute position for tooltip
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

        // NEW: If this point is reached for a regular port node (i.e., not an internal junction that was `continue`d above),
        // check if the port is actually connected to anything.
        // This filtering applies only when simulationResults are available.
        const isPortConnected = connections.some(conn => conn.fromPortId === nodeId || conn.toPortId === nodeId);
        if (!isPortConnected) {
          // If the port is not connected, skip rendering its pressure visual.
          console.log(`[CanvasArea] Skipping pressure visual for unconnected port node ${nodeId}`);
          continue; 
        }

        // Extract canvasItemId and portId from the node ID 
        // The format from simulation is often: itemId_itemId_portId or itemId_portId
        let canvasItemId, portId;
        
        // First, try to find an actual canvas item that might be part of the ID
        // The nodeId may contain the canvasItemId repeated, so we need to extract it carefully
        const actualCanvasItem = droppedItems.find(item => nodeId.includes(item.id));
        
        if (actualCanvasItem) {
          canvasItemId = actualCanvasItem.id;
          
          // Extract port ID by removing the item ID part(s)
          const remaining = nodeId.replace(canvasItemId + '_', '');
          
          // If the remaining string still contains the item ID (duplicated), remove it too
          if (remaining.startsWith(canvasItemId + '_')) {
            portId = remaining.substring(canvasItemId.length + 1);
          } else {
            portId = remaining;
          }
          
          // If portId still contains underscores, take just the last part
          if (portId.includes('_')) {
            portId = portId.split('_').pop() || portId;
          }
        } else {
          // Fallback to the old approach if we can't find a direct match
          if (nodeId.includes('_')) {
            const parts = nodeId.split('_');
            
            // Try to identify the most likely canvas item ID format (typically has hyphens)
            const candidateParts = parts.filter(part => part.includes('-'));
            
            if (candidateParts.length > 0) {
              canvasItemId = candidateParts[0];
              // The port is usually the last part
              portId = parts[parts.length - 1];
            } else {
              // Last resort fallback
              portId = parts[parts.length - 1];
              canvasItemId = parts.slice(0, -1).join('_');
            }
          } else {
            console.warn(`[CanvasArea] Unexpected node ID format: ${nodeId}`);
            continue;
          }
        }

        console.log(`[CanvasArea] Extracted canvasItemId: ${canvasItemId}, portId: ${portId} from nodeId: ${nodeId}`);
        
        // Find the item and validate it exists
        const item = droppedItems.find(item => item.id === canvasItemId);
        if (!item) {
          console.warn(`[CanvasArea] Could not find canvas item with ID ${canvasItemId}`);
          continue;
        }

        // Find the port in the item - need to handle full port IDs
        // The portId we extracted might be 'port_left', 'left', etc. but the actual port.id might be 'itemId_port_left'
        let port = item.ports.find(p => p.id === portId);
        
        // If not found directly, try with the full item prefix
        if (!port) {
          port = item.ports.find(p => p.id === `${canvasItemId}_${portId}`);
        }
        
        // Check if 'port_' prefix is missing
        if (!port && !portId.startsWith('port_')) {
          port = item.ports.find(p => p.id === `port_${portId}` || p.id === `${canvasItemId}_port_${portId}`);
        }

        if (!port) {
          console.warn(`[CanvasArea] Could not find port ${portId} in item ${canvasItemId}. Available ports:`, item.ports.map(p => p.id));
          continue;
        }

        // Calculate absolute position of port
        const portX = item.x + port.x;
        const portY = item.y + port.y;

        // Create pressure node
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
              // Get absolute position for tooltip
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
    
    // Combine flow visuals and pressure node visuals, with pressure nodes last (on top)
    return [...flowVisuals, ...pressureNodeVisuals];
  };

  return (
    <div ref={containerRef} className="relative w-full h-full flex flex-col bg-[#F5F7FA] overflow-hidden" onDragOver={e => e.preventDefault()}>
      {/* Show prompt if canvas is empty */}
      {droppedItems.length === 0 && <EmptyCanvasPrompt />}
      {/* Inspection Toggle UI */}
      {simulationResults && (Object.keys(simulationResults.nodePressures || {}).length > 0 || Object.keys(simulationResults.segmentFlows || {}).length > 0) && (
        <div className="absolute top-4 left-8 z-20 flex flex-row items-center gap-2 pointer-events-none">
          <div className="pointer-events-auto">
            <ToggleGroup type="single" value={inspectionMode} onValueChange={v => {
              setInspectionMode((v as any) || 'pressure');
              if (v !== 'flow') setFlowDisplayMode('rate'); // Reset to rate if not in flow
            }} className="bg-white/90 shadow rounded-md">
              <ToggleGroupItem value="pressure" aria-label="Show Pressures" className="text-xs px-2 min-w-[64px] h-7">Pressure</ToggleGroupItem>
              <ToggleGroupItem value="flow" aria-label="Show Flow" className="text-xs px-2 min-w-[64px] h-7">Flow</ToggleGroupItem>
            </ToggleGroup>
          </div>
          {/* Secondary toggle for flow display mode */}
          {inspectionMode === 'flow' && (
            <div className="pointer-events-auto ml-2">
              <ToggleGroup type="single" value={flowDisplayMode} onValueChange={v => setFlowDisplayMode((v as any) || 'rate')} className="bg-white/90 shadow rounded-md">
                <ToggleGroupItem value="rate" aria-label="Show Rate" className="text-xs px-2 min-w-[64px] h-7">Rate</ToggleGroupItem>
                <ToggleGroupItem value="velocity" aria-label="Show Velocity" className="text-xs px-2 min-w-[64px] h-7">Velocity</ToggleGroupItem>
              </ToggleGroup>
            </div>
          )}
        </div>
      )}
      {/* Main content area - Stage */}
      <div 
        ref={stageContainerRef}
        className="flex-1 min-w-0 h-full min-h-0 overflow-hidden" 
        onDragOver={handleDragOver}
        onDrop={localHandleDrop}
      >
        {/* Floating action buttons (bottom overlay) */}
        <div className="absolute bottom-4 left-4 right-4 z-30 flex flex-row items-end justify-between pointer-events-none w-auto">
          {/* Left: Clear button */}
          <div className="pointer-events-auto">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onClearCanvas} 
              className="h-8"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>
          {/* Right: Run and Reset buttons */}
          <div className="flex flex-row gap-2 pointer-events-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={runSimulation}
              className="h-8"
              disabled={simulationInProgress}
            >
              <PlayCircle className="h-4 w-4 mr-1" />
              Run
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={resetSimulation}
              className="h-8"
              disabled={!simulationResults}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
          </div>
        </div>
        {/* End floating action buttons */}
        {isMounted ? (
          <Stage 
            ref={stageRef}
            width={stageDimensions.width}
            height={stageDimensions.height}
            x={0}
            y={0}
            onClick={onStageClick}
            onContextMenu={onStageContextMenu}
            onMouseMove={internalHandleStageMouseMove}
          >
            {/* Base Layer: background grid, connections, etc. */}
            <Layer x={0} y={0}>
              {/* Background */}
              <Rect 
                x={0}
                y={0}
                width={stageDimensions.width}
                height={stageDimensions.height}
                fill="#fafbfc"
                listening={false}
              />
              
              {/* Grid */}
              {renderGrid()}
              
              {/* Connections (tubes) - Visual Rendering ONLY */}
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

                // Update visual color based on flow if results are available
                if (simulationResults && simulationResults.segmentFlows) {
                  // Construct the segmentId. Ensure port ID extraction matches simulation engine for robustness.
                  // The port IDs on `conn` (e.g., conn.fromPortId) are the full unique IDs like `itemId_portBaseId`
                  // The simulation engine typically uses `itemId_portBaseId` as node IDs directly.
                  
                  // ***** START REVISED LOGIC *****
                  // Reconstruct node IDs consistently with minMaxFlowValues calculation and likely simulation key format
                  // Handle cases where the prefix might already be included or missing.
                  const getBasePortId = (fullPortId: string, itemId: string): string => {
                    const prefix = itemId + '_';
                    if (fullPortId.startsWith(prefix)) {
                      return fullPortId.substring(prefix.length);
                    }
                    // Consider if the fullPortId *is* the base ID already (e.g., from older data)
                    // This might need adjustment based on actual port ID formats encountered.
                    // For now, assume it contains the base ID if prefix is missing.
                    console.warn(`[getBasePortId] Port ID ${fullPortId} for item ${itemId} did not have expected prefix.`);
                    return fullPortId; // Fallback, might be incorrect if format varies significantly
                  };

                  const port1BaseId = getBasePortId(conn.fromPortId, conn.fromItemId);
                  const port2BaseId = getBasePortId(conn.toPortId, conn.toItemId);

                  const node1Id = `${conn.fromItemId}_${port1BaseId}`;
                  const node2Id = `${conn.toItemId}_${port2BaseId}`;
                  // ***** END REVISED LOGIC *****
                  
                  // Ensure the segmentId construction here precisely matches how segment IDs are keyed in simulationResults.segmentFlows
                  // This usually involves sorting the node IDs.
                  const segmentIdKey = [node1Id, node2Id].sort().join('--'); // Use reconstructed IDs
                  
                  const flowRateM3s = simulationResults.segmentFlows[segmentIdKey];
                  // Add console log for debugging
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
                  // Optionally change outline too, or keep it standard
                  // tubeOutlineColor = getDynamicFlowColor(displayValueForTube, minMaxFlowValues.min, minMaxFlowValues.max); 
                }
                
                return (
                  <Group 
                    key={conn.id} 
                    id={conn.id}
                    opacity={1} 
                  > 
                    {/* Outline path (drawn first) */}
                    <Path
                      data={conn.pathData} 
                      stroke={tubeOutlineColor}
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
                      stroke={tubeFillColor}
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
                  />
                );
              })}
              
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
            
            {/* Separate top Layer for simulation visuals (HOVER PATHS AND PRESSURE NODES) */}
            <Layer x={0} y={0}>
              {simulationResults && inspectionMode !== 'none' && renderSimulationVisuals(inspectionMode)}
            </Layer>
          </Stage>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            Loading Canvas...
          </div>
        )}
      </div>
      {/* Tooltip Popover */}
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