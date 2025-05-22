'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
// import CanvasArea from "@/components/microfluidic-designer/CanvasArea";
import DetailsSidebar from "@/components/microfluidic-designer/DetailsSidebar";
import PaletteSidebar from "@/components/microfluidic-designer/PaletteSidebar";
import type { 
  PaletteItemData, 
  CanvasItemData, 
  Port, 
  Connection, 
  TubingTypeDefinition, 
  SimulationResults // Import from types
} from "@/lib/microfluidic-designer/types";
import { AVAILABLE_TUBING_TYPES, PALETTE_ITEMS } from "@/lib/microfluidic-designer/types"; // Import PALETTE_ITEMS
import { calculateTubePathData } from "@/lib/microfluidic-designer/utils/pathUtils";
import { 
  calculateRectangularChannelResistance,
  calculateChipResistance, 
  calculateTubingResistance 
} from "@/lib/microfluidic-designer/resistanceUtils";
import {
  FLUID_VISCOSITY_PAS,
  DEFAULT_TUBE_INNER_RADIUS_M,
  DEFAULT_CHANNEL_WIDTH_MICRONS,
  DEFAULT_CHANNEL_DEPTH_MICRONS,
  // Import specific chip resistances if used as fallbacks
  RESISTANCE_STRAIGHT_CHIP_PAS_M3,
  RESISTANCE_T_JUNCTION_SEGMENT_PAS_M3,
  RESISTANCE_X_JUNCTION_SEGMENT_PAS_M3,
  RESISTANCE_MEANDER_CHIP_PAS_M3,
} from "@/lib/microfluidic-designer/constants";
import { 
  runFluidSimulationLogic, 
  resetSimulationStateLogic 
} from '@/lib/microfluidic-designer/simulationEngine'; // Import simulation engine functions
import SimulationSummaryPanel from '@/components/microfluidic-designer/SimulationSummaryPanel';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X, Move } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Trash2, PlayCircle, RotateCcw, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { KonvaEventObject } from 'konva/lib/Node';

const CanvasArea = dynamic(() => import('@/components/microfluidic-designer/CanvasArea'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 w-screen h-screen flex items-center justify-center bg-[#F5F7FA]">
      <div className="bg-white/80 px-6 py-5 rounded-lg shadow-md backdrop-blur-sm border border-[#E1E4E8]">
        <div className="flex items-center justify-center mb-3">
          <div className="animate-spin h-6 w-6 border-3 border-[#003C7E] border-t-transparent rounded-full"></div>
        </div>
        <p className="font-inter text-sm text-[#8A929B] text-center">Loading Canvas...</p>
      </div>
    </div>
  )
});

// Define GRID_SIZE at the module level if it's fixed, or pass from CanvasArea if dynamic
const GRID_SIZE = 20; // Matching the one in CanvasArea.tsx for consistency

// Constants for Palette filtering (lifted from PaletteSidebar)
const FILTERS = [
  { label: "All", value: "all" },
  { label: "Chips", value: "chip" },
  { label: "Outlets", value: "outlet" },
];

const CATEGORY_ORDER = ["Microfluidic Chips", "Other"] as const;
type CategoryKey = typeof CATEGORY_ORDER[number];

// Helper function to check port connection status
function isPortConnected(itemId: string, portId: string, connections: Connection[]): boolean {
  return connections.some(conn =>
    (conn.fromItemId === itemId && conn.fromPortId === portId) ||
    (conn.toItemId === itemId && conn.toPortId === portId)
  );
}

const initialSimulationResults: SimulationResults = {
  nodePressures: {},
  segmentFlows: {},
  detailedFlows: {},
  warnings: [],
  errors: [],
};

// Default canvas size (can be adjusted or made dynamic if needed)
const HEADER_HEIGHT = 64; // px, matches top-16
const MIN_CANVAS_WIDTH = 900; // Minimum width for the canvas content area
const DEFAULT_SIDE_PADDING = 100; // Default padding on each side when space allows
const TOP_BOTTOM_PADDING = 20; // Fixed top and bottom padding

export default function MicrofluidicDesignerPage() {
  const mainContainerRef = useRef<HTMLDivElement>(null);

  const [droppedItems, setDroppedItems] = useState<CanvasItemData[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [inProgressConnection, setInProgressConnection] = useState<{
    sourceItem: CanvasItemData;
    sourcePort: Port;
    targetMousePos: { x: number; y: number };
  } | null>(null);

  // State for simulation
  const [simulationResults, setSimulationResults] = useState<SimulationResults>(initialSimulationResults);
  const [simulationVisualsKey, setSimulationVisualsKey] = useState<number>(0); // Used to trigger re-render/clear for visuals
  const [runButtonState, setRunButtonState] = useState<{text: string; color?: string; disabled?: boolean}>(
    { text: "Run Simulation", disabled: false }
  );

  // Add state for inspectionMode and flowDisplayMode at the top of the component
  const [inspectionMode, setInspectionMode] = useState<'none' | 'pressure' | 'flow'>('none');
  const [flowDisplayMode, setFlowDisplayMode] = useState<'rate' | 'velocity'>('rate');

  // State for responsive UI
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // State for Palette filtering (lifted from PaletteSidebar)
  const [paletteSearch, setPaletteSearch] = useState("");
  const [paletteActiveFilter, setPaletteActiveFilter] = useState("all");

  // Add state to track if right panel was ever opened
  const [wasRightPanelEverOpened, setWasRightPanelEverOpened] = useState(false);

  // State to track the current actual canvas dimensions from CanvasArea
  const [currentCanvasDimensions, setCurrentCanvasDimensions] = useState({ width: 0, height: 0 });

  // Grouped and ordered items logic (lifted and adapted from PaletteSidebar)
  const groupedPaletteItems = useMemo(() => PALETTE_ITEMS.reduce((acc, item) => {
    let categoryKey: CategoryKey = "Other";
    const itemCat = item.category?.trim();
    const itemType = item.chipType?.trim();

    if (itemType && (itemType.includes('chip') || itemType.includes('junction') || itemType.includes('channel') || itemType.includes('meander'))) {
      categoryKey = "Microfluidic Chips";
    } else if (itemType === 'pump' || itemType === 'outlet') {
      categoryKey = "Other";
    } else if (itemCat === "Microfluidic Chips") {
      categoryKey = itemCat as CategoryKey;
    }

    if (!acc[categoryKey]) {
      acc[categoryKey] = [];
    }
    acc[categoryKey]!.push(item);
    return acc;
  }, {} as Record<CategoryKey, PaletteItemData[]>), []);

  const orderedPaletteCategories = useMemo(() => {
    const categories = CATEGORY_ORDER.filter(cat => groupedPaletteItems[cat] && groupedPaletteItems[cat]!.length > 0);
    (Object.keys(groupedPaletteItems) as CategoryKey[]).forEach(cat => {
      if (!categories.includes(cat)) {
        categories.push(cat);
      }
    });
    return categories;
  }, [groupedPaletteItems]);

  const getFilteredPaletteItems = useCallback((items: PaletteItemData[]) => {
    if (!items) return [];
    return items.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(paletteSearch.toLowerCase()) ||
                            (item.title && item.title.toLowerCase().includes(paletteSearch.toLowerCase())) ||
                            (item.chipType && item.chipType.toLowerCase().includes(paletteSearch.toLowerCase()));
      
      const matchesFilter =
        paletteActiveFilter === "all" ||
        (paletteActiveFilter === "chip" && (item.category?.toLowerCase().includes("chip") || item.chipType?.toLowerCase().includes("chip") || item.chipType?.toLowerCase().includes("junction") || item.chipType === 'straight' || item.chipType === 'meander' || item.chipType === 't-type' || item.chipType === 'x-type')) ||
        (paletteActiveFilter === "outlet" && item.chipType === "outlet");
      return matchesSearch && matchesFilter;
    });
  }, [paletteSearch, paletteActiveFilter]);

  // Check for mobile size on mount and resize
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkIfMobile();
    
    // Close both panels on mobile initially
    if (window.innerWidth < 768) {
      setLeftPanelOpen(false);
      setRightPanelOpen(false);
    }

    // Set up resize listener
    window.addEventListener('resize', checkIfMobile);
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // Simulation callback functions
  const handleUpdateSimulationResults = useCallback((results: SimulationResults) => {
    console.log("Simulation results updated:", results);
    setSimulationResults(results);
  }, []);

  const handleClearVisualization = useCallback(() => {
    console.log("Clearing simulation visuals...");
    // This could involve setting simulationResults to empty or passing a specific prop to CanvasArea
    // For now, we can bump a key that CanvasArea might use to reset its internal visual state
    setSimulationResults(prev => ({ ...prev, detailedFlows: {}, nodePressures: {} })); // Clear relevant parts
    setSimulationVisualsKey(prev => prev + 1); 
  }, []);

  const handleVisualizeResults = useCallback(() => {
    console.log("Triggering simulation results visualization...");
    // This is implicitly handled by CanvasArea re-rendering when simulationResults prop changes.
    // We might need a more explicit trigger if CanvasArea manages its own Konva shapes for results.
    setSimulationVisualsKey(prev => prev + 1); // Force re-render of canvas area if needed
  }, []);

  const handleShowNotification = useCallback((message: string, type: 'error' | 'warning' | 'info') => {
    // TODO: Integrate with a proper toast notification system (e.g., react-hot-toast)
    console.log(`[${type.toUpperCase()}] Notification: ${message}`);
    if (type === 'error') {
      // alert(`Error: ${message}`); // Basic alert for now
    } else if (type === 'warning') {
      // alert(`Warning: ${message}`);
    }
  }, []);

  const handleSetRunButtonState = useCallback((text: string, color?: string, disabled?: boolean) => {
    setRunButtonState({ text, color, disabled });
  }, []);
  
  // --- Simulation Control Functions ---
  const handleRunSimulation = useCallback(async () => {
    if (runButtonState.disabled) return;

    console.log("Initiating simulation run...");
    setInspectionMode('flow'); // Set inspection mode to flow after simulation
    setFlowDisplayMode('velocity'); // Set to velocity by default after simulation
    setRightPanelOpen(true); // Ensure right panel is open when simulation runs
    runFluidSimulationLogic(
      droppedItems,
      connections,
      handleUpdateSimulationResults,
      handleClearVisualization,
      handleVisualizeResults,
      handleShowNotification,
      handleSetRunButtonState
    );
  }, [
    droppedItems,
    connections,
    handleUpdateSimulationResults,
    handleClearVisualization,
    handleVisualizeResults,
    handleShowNotification,
    handleSetRunButtonState,
    runButtonState.disabled
  ]);

  const handleResetSimulation = useCallback(() => {
    console.log("Initiating simulation reset...");
    resetSimulationStateLogic(
      handleUpdateSimulationResults, // This will set results to empty
      handleClearVisualization,    // Clear visuals
      () => { /* Placeholder for findFlowPathAndHighlight, if needed for general reset */ },
      handleSetRunButtonState
    );
    // Optionally, also reset local selection state if desired after simulation reset
    // setSelectedItemId(null);
    // setSelectedConnectionId(null);
  }, [
    handleUpdateSimulationResults, 
    handleClearVisualization, 
    handleSetRunButtonState
  ]);

  const handleClearCanvas = useCallback(() => {
    console.log("Clearing canvas...");
    setDroppedItems([]);
    setConnections([]);
    setInProgressConnection(null);
    setSelectedItemId(null);
    setSelectedConnectionId(null);
    handleResetSimulation(); // Also reset simulation state
  }, [handleResetSimulation]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>, containerRef: React.RefObject<HTMLDivElement | null>) => {
    event.preventDefault();
    const itemDataString = event.dataTransfer.getData('application/json');
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect || containerRect.width === 0 || containerRect.height === 0) {
      console.warn("[Drop] Container dimensions are invalid or zero. Aborting drop.", containerRect);
      return;
    }

    let dropX = event.clientX - containerRect.left;
    let dropY = event.clientY - containerRect.top;

    if (itemDataString) {
      try {
        const paletteItem = JSON.parse(itemDataString) as PaletteItemData;

        const itemWidth = paletteItem.defaultWidth || 80;
        const itemHeight = paletteItem.defaultHeight || 40;

        // Calculate initial position considering item dimensions for centering within the drop coordinates
        const initialX = dropX - itemWidth / 2;
        const initialY = dropY - itemHeight / 2;

        // Clamp to actual container bounds (which is the stage itself)
        // The coordinates are already relative to the containerRect (stage)
        const clampedX = Math.max(0, Math.min(initialX, containerRect.width - itemWidth));
        const clampedY = Math.max(0, Math.min(initialY, containerRect.height - itemHeight));

        const newItemId = `${paletteItem.chipType || 'item'}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

        // Use dimensions from paletteItem, with fallbacks to global defaults
        const initialChannelWidth = paletteItem.channelWidthMicrons || DEFAULT_CHANNEL_WIDTH_MICRONS;
        const initialChannelDepth = paletteItem.channelDepthMicrons || DEFAULT_CHANNEL_DEPTH_MICRONS;
        // For straight/meander, paletteItem.channelLengthMm is the total length.
        // For T/X junctions, if paletteItem.channelLengthMm is set, it might be an overall dimension.
        // We need a *segment* length for the representative resistance calculation.
        // If not specified, use a small default (e.g., 2.5mm) or derive (e.g., paletteItem.channelLengthMm / 2 if that makes sense for the product definition).
        const initialChannelLength = paletteItem.channelLengthMm || 
                                   ( (paletteItem.chipType === 't-type' || paletteItem.chipType === 'x-type') ? 2.5 : 5 ); // Default segment length for T/X, or overall for others

        let calculatedResistance: number;

        if (paletteItem.chipType === 'straight' || paletteItem.chipType === 'meander') {
          calculatedResistance = calculateRectangularChannelResistance(
            initialChannelLength * 1e-3, // mm to m
            initialChannelWidth * 1e-6,  // µm to m
            initialChannelDepth * 1e-6,  // µm to m
            FLUID_VISCOSITY_PAS
          );
        } else if (paletteItem.chipType === 't-type' || paletteItem.chipType === 'x-type') {
          // For junctions, the representative resistance is for one of its internal segments.
          // The dimensions for these segments come from the general channel dimensions of the palette item.
          const segmentLengthMm = initialChannelLength; // Using the derived/defaulted initialChannelLength as the segment length for T/X initial R calc.
          const segmentWidthMicrons = initialChannelWidth;
          const segmentDepthMicrons = initialChannelDepth;
          
          calculatedResistance = calculateRectangularChannelResistance(
            segmentLengthMm * 1e-3,
            segmentWidthMicrons * 1e-6,
            segmentDepthMicrons * 1e-6,
            FLUID_VISCOSITY_PAS
          );
        } else if (paletteItem.chipType === 'pump' || paletteItem.chipType === 'outlet') {
          calculatedResistance = 0;
        } else {
          console.warn(`Unknown chipType for dynamic resistance calculation on drop: ${paletteItem.chipType}. Using high default.`);
          calculatedResistance = 1e18; // Fallback for unknown types
        }
        console.log(`[Drop] Initial calculated resistance for ${newItemId} (${paletteItem.chipType}): ${calculatedResistance.toExponential(3)}`);

        const newItem: CanvasItemData = {
          id: newItemId,
          productId: paletteItem.id,
          name: paletteItem.name,
          chipType: paletteItem.chipType,
          x: clampedX, // Use clampedX (stage-local)
          y: clampedY, // Use clampedY (stage-local)
          width: itemWidth,
          height: itemHeight,
          ports: paletteItem.defaultPorts.map((p: Port) => ({...p, id: `${newItemId}_${p.id}`})),
          
          currentChannelWidthMicrons: initialChannelWidth,
          currentChannelDepthMicrons: initialChannelDepth,
          currentChannelLengthMm: initialChannelLength, // This will be the overall length for S/M, or the segment length for T/X for now
          
          // Initialize specific junction dimensions from general channel dimensions if not directly on PaletteItemData
          // (No specific junction dimension properties on PaletteItemData, so these will typically be undefined unless added to types.ts for palette items)
          currentJunctionSegmentLengthMm: (paletteItem.chipType === 't-type' || paletteItem.chipType === 'x-type') ? initialChannelLength : undefined,
          currentJunctionWidthMicrons: (paletteItem.chipType === 't-type' || paletteItem.chipType === 'x-type') ? initialChannelWidth : undefined,
          currentJunctionDepthMicrons: (paletteItem.chipType === 't-type' || paletteItem.chipType === 'x-type') ? initialChannelDepth : undefined,
          
          material: paletteItem.material || 'Glass',
          resistance: calculatedResistance,
          portPressures: paletteItem.chipType === 'pump' ? (paletteItem.defaultPortPressures || {}) : undefined,
          internalConnections: paletteItem.internalConnections,

          temperatureRange: paletteItem.temperatureRange,
          pressureRating: paletteItem.pressureRating,
          chemicalResistance: paletteItem.chemicalResistance,
          isBiocompatible: paletteItem.isBiocompatible,
          isAutoclavable: paletteItem.isAutoclavable,
        };

        setDroppedItems(prevItems => [...prevItems, newItem]);
      } catch (error) {
        console.error("Failed to parse or process dropped item data:", error);
      }
    }
  }, [droppedItems, connections]);

  const handleItemDragEnd = useCallback((itemId: string, newX: number, newY: number) => {
    // Snapping logic removed
    // const snappedX = Math.round(newX / GRID_SIZE) * GRID_SIZE;
    // const snappedY = Math.round(newY / GRID_SIZE) * GRID_SIZE;

    const updatedDroppedItems = droppedItems.map(item =>
      item.id === itemId ? { ...item, x: newX, y: newY } : item // Use newX and newY directly
    );
    setDroppedItems(updatedDroppedItems);

    const affectedConnections = connections.filter(conn => conn.fromItemId === itemId || conn.toItemId === itemId);
    if (affectedConnections.length > 0) {
      const updatedConnections = connections.map(conn => {
        if (conn.fromItemId === itemId || conn.toItemId === itemId) {
          const fromItem = updatedDroppedItems.find(i => i.id === conn.fromItemId);
          const fromPort = fromItem?.ports.find(p => p.id === conn.fromPortId);
          const toItem = updatedDroppedItems.find(i => i.id === conn.toItemId);
          const toPort = toItem?.ports.find(p => p.id === conn.toPortId);
          if (fromItem && fromPort && toItem && toPort) {
            const newPathData = calculateTubePathData(fromItem, fromPort, toItem, toPort);
            return { ...conn, pathData: newPathData };
          }
        }
        return conn; 
      });
      setConnections(updatedConnections);
    }
  }, [droppedItems, connections]);

  const handlePortClick = useCallback((itemId: string, port: Port, konvaEvent: any) => {
    konvaEvent.cancelBubble = true;
    const clickedItem = droppedItems.find(i => i.id === itemId);
    if (!clickedItem) return;

    setSelectedItemId(null);
    setSelectedConnectionId(null);

    if (!inProgressConnection) {
      if (isPortConnected(itemId, port.id, connections)) {
        console.warn(`Port ${port.id} on item ${itemId} is already connected.`);
        return; 
      }
      setInProgressConnection({ 
        sourceItem: clickedItem, 
        sourcePort: port, 
        targetMousePos: { x: konvaEvent.evt.clientX, y: konvaEvent.evt.clientY } 
      });
    } else {
      const sourceItem = inProgressConnection.sourceItem;
      const sourcePort = inProgressConnection.sourcePort;
      const targetItem = clickedItem; 
      const targetPort = port;      

      if (sourceItem.id === targetItem.id) {
        console.warn("Cannot connect an item to itself. Connection cancelled.");
        setInProgressConnection(null); return;
      }
      if (isPortConnected(targetItem.id, targetPort.id, connections)) {
        console.warn(`Target port ${targetPort.id} on item ${targetItem.id} is already connected. Connection cancelled.`);
        setInProgressConnection(null); return;
      }

      const pathData = calculateTubePathData(sourceItem, sourcePort, targetItem, targetPort);
      
      // Determine tubing length and type
      const isPumpConnection = sourceItem.chipType === 'pump' || targetItem.chipType === 'pump';
      const physicalLengthMeters = isPumpConnection ? 0.3 : 0.05; // 30cm or 5cm
      const defaultTubingType = AVAILABLE_TUBING_TYPES.find(t => t.id === 'default_0.02_inch_ID_silicone') || AVAILABLE_TUBING_TYPES[0];
      if (!defaultTubingType) {
        console.error("Default tubing type not found!");
        setInProgressConnection(null); return;
      }

      const tubeResistance = calculateTubingResistance(
        physicalLengthMeters,
        defaultTubingType.innerRadiusMeters
      );

      const newConnectionId = `conn-${sourceItem.id}_${sourcePort.id}-${targetItem.id}_${targetPort.id}-${Date.now()}`;
      const newConnection: Connection = {
        id: newConnectionId,
        fromItemId: sourceItem.id,
        fromPortId: sourcePort.id,
        toItemId: targetItem.id,
        toPortId: targetPort.id,
        pathData: pathData,
        tubingTypeId: defaultTubingType.id,
        lengthMeters: physicalLengthMeters,
        resistance: tubeResistance,
      };
      
      setConnections(prev => [...prev, newConnection]);
      setInProgressConnection(null); 
    }
  }, [inProgressConnection, droppedItems, connections]);

  const handleStageClick = useCallback((konvaEvent: any) => {
    if (konvaEvent.target === konvaEvent.target.getStage()) {
      setSelectedItemId(null);
      setSelectedConnectionId(null);
      if (inProgressConnection) {
        setInProgressConnection(null);
      }
    } else {
      let node = konvaEvent.target;
      let identifiedItemId: string | null = null;
      while (node && node !== konvaEvent.target.getStage()) {
        const groupId = node.id(); 
        if (groupId && typeof groupId === 'string' && droppedItems.some(item => item.id === groupId)) {
          identifiedItemId = groupId;
          break; 
        }
        node = node.getParent(); 
      }
      if (identifiedItemId) {
        setSelectedItemId(prevId => (prevId === identifiedItemId ? null : identifiedItemId));
        setSelectedConnectionId(null); 
      } else {
        // This branch means the click was on the stage, but not directly on an item's main group,
        // nor on the empty stage background (that's handled above).
        // It could be a click on a port or a tube, which have their own handlers.
        // If it's truly a misclick on some other stage element while drawing, then cancel.
        // However, to be safe and rely on specific handlers for ports/tubes, 
        // we only cancel here if the click wasn't on anything identifiable and a connection is in progress.
        // The first `if` (konvaEvent.target === konvaEvent.target.getStage()) already handles empty stage clicks.
        // So, this `else` might not even be strictly necessary for cancelling if port/tube clicks stop propagation.
        // For now, let's assume if it reaches here and a connection is in progress, it was an unintended click.
        // However, if port/tube click handlers (`onPortClick`, `onTubeClick`) always `e.cancelBubble = true;`,
        // then a click on them shouldn't reach here anyway.
        // Let's assume that port/tube clicks manage their own interaction and stop bubbling if they handle the event.
        // Thus, if a click reaches here and a connection is in progress, it was likely a misclick not on a port/item.
        // This is still a bit tricky. The original code in this block was:
        // setSelectedItemId(null);
        // setSelectedConnectionId(null);
        // if (inProgressConnection) {
        //   setInProgressConnection(null);
        // }
        // For now, if it's not an item, and not the stage background, we probably don't want to change selection
        // or cancel connection UNLESS it's a true misclick. Ports/tubes handle their own logic.
      }
    }
  }, [inProgressConnection, droppedItems, setSelectedItemId, setSelectedConnectionId, setInProgressConnection]);

  const handleStageContextMenu = useCallback((konvaEvent: any) => {
    konvaEvent.evt.preventDefault();
    if (inProgressConnection) {
      setInProgressConnection(null);
    }
  }, [inProgressConnection, setSelectedItemId, setSelectedConnectionId, setInProgressConnection]);

  const handleTubeClick = useCallback((connectionId: string, konvaEvent: any) => {
    konvaEvent.cancelBubble = true;
    setSelectedConnectionId(prevId => (prevId === connectionId ? null : connectionId));
    setSelectedItemId(null);
    setInProgressConnection(null);
  }, []);

  const handleDeleteItem = useCallback((itemIdToDelete: string) => {
    setDroppedItems(prev => prev.filter(item => item.id !== itemIdToDelete));
    setConnections(prev => prev.filter(conn => conn.fromItemId !== itemIdToDelete && conn.toItemId !== itemIdToDelete));
    if (selectedItemId === itemIdToDelete) {
      setSelectedItemId(null);
    }
  }, [selectedItemId]);

  const handleDeleteConnection = useCallback((connectionIdToDelete: string) => {
    setConnections(prev => prev.filter(conn => conn.id !== connectionIdToDelete));
    if (selectedConnectionId === connectionIdToDelete) {
      setSelectedConnectionId(null);
    }
  }, [selectedConnectionId]);
  
  const handleStageMouseMove = useCallback((stagePointerPos: {x: number, y:number}) => {
    // This handler is now ONLY for the inProgressConnection line preview.
    // Panning movement is handled by handleWindowMouseMoveForPanning.
    if (inProgressConnection) {
      setInProgressConnection(prev => prev ? { ...prev, targetMousePos: stagePointerPos } : null);
    }
  }, [inProgressConnection]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (selectedItemId) {
          handleDeleteItem(selectedItemId);
        }
        if (selectedConnectionId) {
          handleDeleteConnection(selectedConnectionId);
        }
      }
      if (event.key === 'Escape') {
        if (inProgressConnection) {
          setInProgressConnection(null);
        }
        setSelectedItemId(null);
        setSelectedConnectionId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedItemId, selectedConnectionId, inProgressConnection, handleDeleteItem, handleDeleteConnection]);

  const handleItemPropertyChange = useCallback((itemId: string, propertyName: keyof CanvasItemData, value: any) => {
    setDroppedItems(prevItems => 
      prevItems.map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [propertyName]: value };

          // If a dimension changed for a relevant chip, recalculate its resistance
          if ((propertyName === 'currentChannelWidthMicrons' || 
               propertyName === 'currentChannelDepthMicrons' || 
               propertyName === 'currentChannelLengthMm') && 
              (updatedItem.chipType === 'straight' || updatedItem.chipType === 'meander')) {
            
            updatedItem.resistance = calculateRectangularChannelResistance(
              updatedItem.currentChannelLengthMm * 1e-3,      // mm to m
              updatedItem.currentChannelWidthMicrons * 1e-6,  // µm to m
              updatedItem.currentChannelDepthMicrons * 1e-6,  // µm to m
              FLUID_VISCOSITY_PAS // Default fluid viscosity (water). If different fluids are supported later, this might come from a fluid property on the item or a global canvas setting.
            );
            console.log(`[PropsChange] Recalculated resistance for ${itemId}: ${updatedItem.resistance.toExponential(3)}`);
          }
          return updatedItem;
        }
        return item;
      })
    );
  }, []);

  const currentSelectedItem = droppedItems.find(item => item.id === selectedItemId);

  useEffect(() => {
    if (mainContainerRef.current) {
      const height = mainContainerRef.current.offsetHeight;
      console.log(`[Page] Main container computed height: ${height}px`);
    }
  }, []);

  // Determine if simulation has meaningful results or attempts to show the summary panel
  const showSimulationSummary = 
    simulationResults && 
    (Object.keys(simulationResults.nodePressures || {}).length > 0 || 
     Object.keys(simulationResults.segmentFlows || {}).length > 0 || 
     (simulationResults.errors && simulationResults.errors.length > 0) || 
     (simulationResults.warnings && simulationResults.warnings.length > 0));

  // Add effect to handle automatic right panel opening on first item selection
  useEffect(() => {
    if (selectedItemId && !wasRightPanelEverOpened) {
      setRightPanelOpen(true);
      setWasRightPanelEverOpened(true);
    }
  }, [selectedItemId, wasRightPanelEverOpened]);

  const handleStageResize = useCallback((newDimensions: { width: number; height: number }) => {
    setCurrentCanvasDimensions(newDimensions);
    // Check if any items are out of bounds and adjust them
    setDroppedItems(prevItems => {
      let itemsChanged = false;
      const updatedItems = prevItems.map(item => {
        let newX = item.x;
        let newY = item.y;
        let itemModified = false;

        // Check and clamp right boundary
        if (item.x + item.width > newDimensions.width) {
          newX = newDimensions.width - item.width;
          itemModified = true;
        }
        // Check and clamp left boundary (shouldn't happen if x is always >= 0, but good practice)
        if (newX < 0) {
          newX = 0;
          itemModified = true;
        }

        // Check and clamp bottom boundary
        if (item.y + item.height > newDimensions.height) {
          newY = newDimensions.height - item.height;
          itemModified = true;
        }
        // Check and clamp top boundary (shouldn't happen if y is always >= 0, but good practice)
        if (newY < 0) {
          newY = 0;
          itemModified = true;
        }

        if (itemModified) {
          itemsChanged = true;
          return { ...item, x: newX, y: newY };
        }
        return item;
      });

      if (itemsChanged) {
        // If items moved, connections might need updating
        setConnections(prevConnections => 
          prevConnections.map(conn => {
            const fromItem = updatedItems.find(i => i.id === conn.fromItemId);
            const toItem = updatedItems.find(i => i.id === conn.toItemId);
            if (fromItem && toItem) {
              const fromPort = fromItem.ports.find(p => p.id === conn.fromPortId || `${fromItem.id}_${p.id}` === conn.fromPortId );
              const toPort = toItem.ports.find(p => p.id === conn.toPortId || `${toItem.id}_${p.id}` === conn.toPortId);
              if (fromPort && toPort) {
                const newPathData = calculateTubePathData(fromItem, fromPort, toItem, toPort);
                return { ...conn, pathData: newPathData };
              }
            }
            return conn;
          })
        );
        return updatedItems;
      }
      return prevItems; // No changes, return original items
    });
  }, []); // No specific dependencies here as it only sets state or uses latest state in setDroppedItems

  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);
  const [sidePadding, setSidePadding] = useState(DEFAULT_SIDE_PADDING);

  // Effect to update windowWidth on resize
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    // Set initial width
    handleResize(); 

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Effect to update sidePadding based on windowWidth
  useEffect(() => {
    let newSidePadding = DEFAULT_SIDE_PADDING;
    const totalDefaultPadding = DEFAULT_SIDE_PADDING * 2;

    if (windowWidth < MIN_CANVAS_WIDTH) {
      newSidePadding = 0; // Canvas takes full width, padding disappears
    } else if (windowWidth < MIN_CANVAS_WIDTH + totalDefaultPadding) {
      // Window is wide enough for min canvas, but not for full default padding
      // Distribute remaining space as padding
      const remainingSpaceForPadding = windowWidth - MIN_CANVAS_WIDTH;
      newSidePadding = Math.max(0, remainingSpaceForPadding / 2);
    } else {
      // Window is wide enough for min canvas + full default padding
      newSidePadding = DEFAULT_SIDE_PADDING;
    }
    setSidePadding(newSidePadding);
  }, [windowWidth]);

  return (
    <div 
      className="fixed top-16 bottom-0 left-0 right-0 w-screen overflow-hidden bg-[#F5F7FA] box-border flex flex-col"
      style={{
        paddingLeft: `${sidePadding}px`,
        paddingRight: `${sidePadding}px`,
        paddingTop: `${TOP_BOTTOM_PADDING}px`,
        paddingBottom: `${TOP_BOTTOM_PADDING}px`,
      }}
    >
      {/* This div establishes the padded area below the header */}
      <div className="relative w-full h-full flex-1">
        {/* CanvasArea and its sibling controls (buttons, inspection toggles) will be positioned within this relative container */}
        <CanvasArea
          droppedItems={droppedItems}
          onDrop={handleDrop}
          onItemDragEnd={handleItemDragEnd}
          selectedItemId={selectedItemId}
          selectedConnectionId={selectedConnectionId}
          connections={connections}
          inProgressConnection={inProgressConnection}
          onStageClick={handleStageClick}
          onStageContextMenu={handleStageContextMenu}
          onPortClick={handlePortClick}
          onTubeClick={handleTubeClick}
          onDeleteConnection={handleDeleteConnection}
          onStagePointerMove={handleStageMouseMove}
          simulationResults={simulationResults}
          simulationVisualsKey={simulationVisualsKey}
          onClearCanvas={handleClearCanvas}
          runSimulation={handleRunSimulation}
          resetSimulation={handleResetSimulation}
          simulationInProgress={runButtonState.disabled || false}
          inspectionMode={inspectionMode}
          setInspectionMode={setInspectionMode}
          flowDisplayMode={flowDisplayMode}
          setFlowDisplayMode={setFlowDisplayMode}
          onStageResize={handleStageResize} // Pass the new handler
        />

        {/* === MOVED CONTROLS START === */}
        {/* Inspection Toggle UI - Positioned dynamically */}
        {showSimulationSummary && (
          <div 
            className="absolute top-9 z-40 flex flex-row items-center gap-2 pointer-events-auto"
            style={{ 
              left: '36px',
              transition: 'left 0.3s ease-in-out' 
            }}
          >
            <ToggleGroup type="single" value={inspectionMode} onValueChange={v => {
              const newMode = v as 'none' | 'pressure' | 'flow' || 'pressure';
              setInspectionMode(newMode);
              if (newMode !== 'flow') setFlowDisplayMode('rate');
            }} className="bg-white/80 shadow-md rounded-md border border-[#E1E4E8]">
              <ToggleGroupItem value="pressure" aria-label="Show Pressures" className="text-xs px-2 min-w-[64px] h-7 font-inter data-[state=on]:bg-[#003C7E] data-[state=on]:text-white">Pressure</ToggleGroupItem>
              <ToggleGroupItem value="flow" aria-label="Show Flow" className="text-xs px-2 min-w-[64px] h-7 font-inter data-[state=on]:bg-[#003C7E] data-[state=on]:text-white">Flow</ToggleGroupItem>
            </ToggleGroup>
            {inspectionMode === 'flow' && (
              <ToggleGroup type="single" value={flowDisplayMode} onValueChange={v => setFlowDisplayMode(v as 'rate' | 'velocity' || 'rate')} className="bg-white/80 shadow-md rounded-md border border-[#E1E4E8] ml-2">
                <ToggleGroupItem value="rate" aria-label="Show Rate" className="text-xs px-2 min-w-[64px] h-7 font-inter data-[state=on]:bg-[#003C7E] data-[state=on]:text-white">Rate</ToggleGroupItem>
                <ToggleGroupItem value="velocity" aria-label="Show Velocity" className="text-xs px-2 min-w-[64px] h-7 font-inter data-[state=on]:bg-[#003C7E] data-[state=on]:text-white">Velocity</ToggleGroupItem>
              </ToggleGroup>
            )}
          </div>
        )}

        {/* Floating action buttons at bottom - Positioned dynamically */}
        <div className="absolute bottom-9 left-9 z-50 pointer-events-auto">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleClearCanvas} 
            className="h-8 bg-white/80 shadow-md border-[#E1E4E8] text-[#8A929B] hover:bg-[#F8F9FA] hover:text-[#2D3748] hover:shadow-lg hover:scale-105 transition-all duration-200"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            <span className="font-inter text-xs">Clear</span>
          </Button>
        </div>
        <div className="absolute bottom-9 right-9 z-50 flex flex-row gap-2 pointer-events-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRunSimulation}
            className={`h-8 bg-white/80 shadow-md border-[#E1E4E8] text-[#003C7E] hover:bg-[#003C7E] hover:text-white hover:border-[#003C7E] hover:shadow-lg hover:scale-105 transition-all duration-200 ${runButtonState.color ? runButtonState.color : ''}`}
            disabled={runButtonState.disabled}
          >
            <PlayCircle className="h-4 w-4 mr-1" />
            <span className="font-inter text-xs">{runButtonState.text}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetSimulation}
            className="h-8 bg-white/80 shadow-md border-[#E1E4E8] text-[#8A929B] hover:bg-[#F8F9FA] hover:text-[#2D3748] hover:shadow-lg hover:scale-105 transition-all duration-200"
            disabled={!showSimulationSummary}
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            <span className="font-inter text-xs">Reset</span>
          </Button>
        </div>
        {/* === MOVED CONTROLS END === */}
      </div>
      
      {/* Left Panel - Component Palette - Positioned in the middle left */}
      <div 
        className="fixed top-1/2 left-0 transform -translate-y-1/2 z-40"
        style={{ 
          width: leftPanelOpen ? (isMobile ? '220px' : '220px') : '0px',
          maxHeight: 'calc(100vh - 10rem)',
          transition: 'width 0.3s ease-in-out',
        }}
      >
        <div className={`relative h-full bg-white/90 flex flex-col overflow-y-auto transition-all duration-300 ${
          leftPanelOpen 
            ? 'shadow-lg rounded-r-xl p-4' 
            : 'p-0 shadow-none opacity-0'
        }`}>
          {leftPanelOpen && (
            <>
              <div className="flex items-center justify-between mb-3">
                <div className="relative flex-grow mr-2">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search components..."
                    value={paletteSearch}
                    onChange={e => setPaletteSearch(e.target.value)}
                    className="h-9 pl-8 text-sm rounded-lg border-border focus:ring-1 focus:ring-primary focus:border-primary shadow-sm bg-background/80 w-full"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                {FILTERS.map(f => (
                  <Button
                    key={f.value}
                    variant={paletteActiveFilter === f.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPaletteActiveFilter(f.value)}
                    className={`h-7 px-3 text-xs rounded-full font-inter transition-all duration-200 ease-in-out
                                ${paletteActiveFilter === f.value 
                                  ? 'bg-primary text-primary-foreground shadow-md hover:bg-primary/90' 
                                  : 'bg-background/70 border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:shadow-sm'
                                }`}
                  >
                    {f.label}
                  </Button>
                ))}
              </div>
              
              <div>
                <PaletteSidebar 
                  orderedCategories={orderedPaletteCategories}
                  groupedItems={groupedPaletteItems}
                  getFilteredItems={getFilteredPaletteItems}
                  isOpen={leftPanelOpen}
                  onToggle={() => {}}
                />
              </div>
            </>
          )}
        </div>
        
        <button
          onClick={() => setLeftPanelOpen(!leftPanelOpen)}
          className="absolute top-1/2 -right-4 transform -translate-y-1/2 z-50 bg-white shadow-md rounded-full h-8 w-8 flex items-center justify-center border border-slate-200 transition-all hover:bg-slate-50"
          aria-label={leftPanelOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {leftPanelOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>

      {/* Right Panel - Properties */}
      <div 
        className="fixed top-1/2 right-0 transform -translate-y-1/2 z-40"
        style={{
          width: rightPanelOpen ? (isMobile ? '280px' : '320px') : '0px',
          maxHeight: 'calc(100vh - 8rem)',
          transition: 'width 0.3s ease-in-out'
        }}
      >
        <div className={`relative h-full bg-white/90 flex flex-col overflow-y-auto transition-all duration-300 ${
          rightPanelOpen 
            ? 'shadow-lg rounded-l-xl p-4' 
            : 'p-0 shadow-none opacity-0'
        }`}>
          {rightPanelOpen && (
            <>
              {showSimulationSummary && (
                <div className="mb-6 border-b pb-6">
                  <SimulationSummaryPanel
                    results={simulationResults}
                    inspectionMode={inspectionMode}
                    flowDisplayMode={flowDisplayMode}
                    droppedItems={droppedItems}
                    connections={connections}
                  />
                </div>
              )}
              <DetailsSidebar
                selectedItem={currentSelectedItem}
                onItemPropertyChange={handleItemPropertyChange}
              />
            </>
          )}
        </div>
        
        <button
          onClick={() => setRightPanelOpen(!rightPanelOpen)}
          className="absolute top-1/2 -left-4 transform -translate-y-1/2 z-50 bg-white shadow-md rounded-full h-8 w-8 flex items-center justify-center border border-slate-200 transition-all hover:bg-slate-50"
          aria-label={rightPanelOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {rightPanelOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </div>
  );
} 