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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
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
  { label: "Pumps", value: "pump" },
  { label: "Outlets", value: "outlet" },
];

const CATEGORY_ORDER = ["Microfluidic Chips", "Pumps & Flow Control", "Other"] as const;
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
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // State for Panning
  const [isSpacebarPressed, setIsSpacebarPressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [panStartPoint, setPanStartPoint] = useState({ x: 0, y: 0 });

  // State for Palette filtering (lifted from PaletteSidebar)
  const [paletteSearch, setPaletteSearch] = useState("");
  const [paletteActiveFilter, setPaletteActiveFilter] = useState("all");

  // Grouped and ordered items logic (lifted and adapted from PaletteSidebar)
  const groupedPaletteItems = useMemo(() => PALETTE_ITEMS.reduce((acc, item) => {
    let categoryKey: CategoryKey = "Other";
    const itemCat = item.category?.trim();
    const itemType = item.chipType?.trim();

    if (itemType && (itemType.includes('chip') || itemType.includes('junction') || itemType.includes('channel') || itemType.includes('meander'))) {
      categoryKey = "Microfluidic Chips";
    } else if (itemType === 'pump') {
      categoryKey = "Pumps & Flow Control";
    } else if (itemType === 'outlet') {
      categoryKey = "Other";
    } else if (itemCat && (itemCat === "Microfluidic Chips" || itemCat === "Pumps & Flow Control" || itemCat === "Other")) {
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
        (paletteActiveFilter === "pump" && item.chipType === "pump") ||
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

  // Effect for Spacebar detection
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault();
        setIsSpacebarPressed(true);
      }
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault();
        setIsSpacebarPressed(false);
        if (isPanning) { // Stop panning if spacebar is released during a pan
          setIsPanning(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPanning]); // Add isPanning to dependency array

  // Panning Mouse Handlers (global)
  const handleWindowMouseMoveForPanning = useCallback((event: MouseEvent) => {
    if (isPanning) {
      setPanOffset(prevOffset => ({
        x: prevOffset.x + (event.clientX - panStartPoint.x),
        y: prevOffset.y + (event.clientY - panStartPoint.y),
      }));
      setPanStartPoint({ x: event.clientX, y: event.clientY });
    }
  }, [isPanning, panStartPoint]);

  const handleWindowMouseUpForPanning = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
    }
    // Listeners are removed in the useEffect below
  }, [isPanning]);

  // Effect to add/remove global mouse listeners for panning
  useEffect(() => {
    if (isPanning) {
      window.addEventListener('mousemove', handleWindowMouseMoveForPanning);
      window.addEventListener('mouseup', handleWindowMouseUpForPanning);
      // Change cursor to 'grabbing' when panning
      document.body.style.cursor = 'grabbing';
    } else {
      window.removeEventListener('mousemove', handleWindowMouseMoveForPanning);
      window.removeEventListener('mouseup', handleWindowMouseUpForPanning);
      document.body.style.cursor = 'default'; // Reset cursor
    }
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMoveForPanning);
      window.removeEventListener('mouseup', handleWindowMouseUpForPanning);
      document.body.style.cursor = 'default'; // Ensure cursor is reset on unmount
    };
  }, [isPanning, handleWindowMouseMoveForPanning, handleWindowMouseUpForPanning]);

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
    runFluidSimulationLogic(
      droppedItems,
      connections,
      handleUpdateSimulationResults,
      handleClearVisualization, // Clears previous visuals before new run
      handleVisualizeResults,   // Triggers visualization of new results
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
    if (!containerRect) return;

    let dropX = event.clientX - containerRect.left;
    let dropY = event.clientY - containerRect.top;

    // Adjust for panOffset
    const worldDropX = dropX - panOffset.x;
    const worldDropY = dropY - panOffset.y;

    if (itemDataString) {
      try {
        const paletteItem = JSON.parse(itemDataString) as PaletteItemData;

        // Calculate initial position considering item dimensions for centering
        const initialX = worldDropX - (paletteItem.defaultWidth || 80) / 2;
        const initialY = worldDropY - (paletteItem.defaultHeight || 40) / 2;

        // Snapping logic removed
        // const snappedX = Math.round(initialX / GRID_SIZE) * GRID_SIZE;
        // const snappedY = Math.round(initialY / GRID_SIZE) * GRID_SIZE;

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
          x: initialX, // Use initialX directly
          y: initialY, // Use initialY directly
          width: paletteItem.defaultWidth || 80,
          height: paletteItem.defaultHeight || 40,
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
  }, [droppedItems, connections, panOffset]);

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
    if (isPanning || isSpacebarPressed) return; // Do nothing if panning or spacebar is pressed

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
  }, [isPanning, isSpacebarPressed, inProgressConnection, droppedItems, setSelectedItemId, setSelectedConnectionId, setInProgressConnection]);

  const handleStageContextMenu = useCallback((konvaEvent: any) => {
    konvaEvent.evt.preventDefault();
    if (isPanning || isSpacebarPressed) return; // Allow context menu if not panning, but might want to refine this

    setSelectedItemId(null);
    setSelectedConnectionId(null);
    if (inProgressConnection) {
      setInProgressConnection(null);
    }
  }, [isPanning, isSpacebarPressed, inProgressConnection, setSelectedItemId, setSelectedConnectionId, setInProgressConnection]);

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
  
  const handleStageMouseDown = useCallback((konvaEvent: KonvaEventObject<MouseEvent>) => {
    if (isSpacebarPressed) {
      setIsPanning(true);
      // Use clientX/clientY from the original DOM event for panStartPoint, as window listeners use these.
      setPanStartPoint({ x: konvaEvent.evt.clientX, y: konvaEvent.evt.clientY });
      konvaEvent.evt.preventDefault(); // Prevent text selection or other default browser actions
    }
    // If not spacebar pressed, normal click logic will be handled by onStageClick for item selection/deselection
    // and port click for connections. This handler is primarily for initiating pan.
    // Note: onStageClick is called by CanvasArea separately if this isn't a pan-initiating click.
  }, [isSpacebarPressed]);

  const handleStageMouseUp = useCallback(() => {
    // This is called by Konva's onMouseUp on the Stage.
    // Panning state (isPanning) is now primarily managed by the window mouseup listener.
    // We can leave this empty or use for other stage-specific mouseup logic if needed later.
    // For example, if we had a drawing tool active.
  }, []);

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

  return (
    <div className="fixed top-16 bottom-0 left-0 right-0 w-screen overflow-hidden bg-[#F5F7FA]">
      {/* New relative wrapper for CanvasArea and its overlay controls */}
      <div className="relative w-full h-full">
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
          onStageMouseDown={handleStageMouseDown}
          onStageMouseUp={handleStageMouseUp}
          panOffset={panOffset}
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
        />

        {/* === MOVED CONTROLS START === */}
        {/* Inspection Toggle UI - Positioned dynamically */}
        {showSimulationSummary && (
          <div 
            className="absolute top-4 z-40 flex flex-row items-center gap-2 pointer-events-auto"
            style={{ 
              left: leftPanelOpen ? `${(isMobile ? 280 : 320) + 16}px` : '16px',
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
        <div 
          className="absolute bottom-4 z-50 pointer-events-auto"
          style={{ 
            left: leftPanelOpen ? `${(isMobile ? 280 : 320) + 16}px` : '16px',
            transition: 'left 0.3s ease-in-out'
          }}
        >
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleClearCanvas} 
            className="h-8 bg-white/80 shadow-md border-[#E1E4E8] text-[#8A929B] hover:text-[#003C7E] hover:border-[#003C7E] transition-colors"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            <span className="font-inter text-xs">Clear</span>
          </Button>
        </div>
        <div 
          className="absolute bottom-4 z-50 flex flex-row gap-2 pointer-events-auto"
          style={{ 
            right: rightPanelOpen ? `${(isMobile ? 280 : 320) + 16}px` : '16px',
            transition: 'right 0.3s ease-in-out'
          }}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={handleRunSimulation}
            className={`h-8 bg-white/80 shadow-md border-[#E1E4E8] text-[#003C7E] hover:bg-[#003C7E]/10 transition-colors ${runButtonState.color ? runButtonState.color : ''}`}
            disabled={runButtonState.disabled}
          >
            <PlayCircle className="h-4 w-4 mr-1" />
            <span className="font-inter text-xs">{runButtonState.text}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetSimulation}
            className="h-8 bg-white/80 shadow-md border-[#E1E4E8] text-[#8A929B] hover:text-[#003C7E] hover:border-[#003C7E] transition-colors"
            disabled={!showSimulationSummary} // Reset is enabled if summary is shown (i.e. there are results or errors)
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            <span className="font-inter text-xs">Reset</span>
          </Button>
        </div>
        {/* === MOVED CONTROLS END === */}
      </div>
      
      {/* Left Panel - Component Palette */}
      <div 
        className={`fixed top-16 left-0 z-40 transition-all duration-300 transform ${
          leftPanelOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isMobile ? 'w-[220px]' : 'w-[220px]'}`}
      >
        <div className="relative h-auto max-h-[calc(100vh-4rem)] bg-white/70  shadow-lg flex flex-col rounded-r-xl p-4">
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

          <Tabs value={paletteActiveFilter} onValueChange={setPaletteActiveFilter} className="w-full mb-3">
            <TabsList className="grid w-full grid-cols-2 h-auto">
              {FILTERS.slice(0, 2).map(f => (
                <TabsTrigger key={f.value} value={f.value} className="text-xs px-2 py-1.5 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  {f.label}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsList className="grid w-full grid-cols-2 h-auto mt-1">
              {FILTERS.slice(2).map(f => (
                <TabsTrigger key={f.value} value={f.value} className="text-xs px-2 py-1.5 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  {f.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          
          <Separator className="mb-3"/>

          <div className="flex-grow overflow-y-auto">
            <PaletteSidebar 
              orderedCategories={orderedPaletteCategories}
              groupedItems={groupedPaletteItems}
              getFilteredItems={getFilteredPaletteItems}
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLeftPanelOpen(false)}
            className="absolute bottom-4 right-4 w-8 h-8 p-0 text-[#8A929B] hover:text-[#64707D] transition-colors bg-transparent hover:bg-transparent"
          >
            <X size={16} />
          </Button>
        </div>
      </div>

      {/* Right Panel - Properties */}
      <div 
        className={`fixed top-16 right-0 z-40 transition-all duration-300 transform ${
          rightPanelOpen ? 'translate-x-0' : 'translate-x-full'
        } ${isMobile ? 'w-[280px]' : 'w-[320px]'}`}
      >
        <div className="relative h-auto max-h-[calc(100vh-4rem)] bg-white/70 shadow-lg flex flex-col rounded-l-xl">
          <div className="p-4 border-b flex items-center justify-end">
          </div>
          <div className="flex-grow overflow-y-auto p-4">
            {/* Properties panel - Moved to the top */}
            <DetailsSidebar
              selectedItem={currentSelectedItem}
              onItemPropertyChange={handleItemPropertyChange}
            />
            {/* Conditionally show simulation results below properties */}
            {showSimulationSummary && (
              <div className="mt-6"> {/* Added margin-top for spacing */}
                <SimulationSummaryPanel
                  results={simulationResults}
                  inspectionMode={inspectionMode}
                  flowDisplayMode={flowDisplayMode}
                  droppedItems={droppedItems}
                  connections={connections}
                />
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRightPanelOpen(false)}
            className="absolute bottom-4 left-4 w-8 h-8 p-0 text-[#8A929B] hover:text-[#64707D] transition-colors bg-transparent hover:bg-transparent"
          >
            <X size={16} />
          </Button>
        </div>
      </div>

      {/* Toggle buttons for sidebars - only shown when panel is closed */}
      {!leftPanelOpen && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLeftPanelOpen(true)}
          className="fixed top-20 left-4 z-50 h-9 w-9 p-0 text-[#8A929B] hover:text-[#64707D] transition-colors bg-transparent hover:bg-transparent"
        >
          <ChevronRight size={18} />
        </Button>
      )}

      {!rightPanelOpen && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setRightPanelOpen(true)}
          className="fixed top-20 right-4 z-50 h-9 w-9 p-0 text-[#8A929B] hover:text-[#64707D] transition-colors bg-transparent hover:bg-transparent"
        >
          <ChevronLeft size={18} />
        </Button>
      )}
    </div>
  );
} 