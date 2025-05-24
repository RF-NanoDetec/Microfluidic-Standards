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
  SimulationResults // Import from types
} from "@/lib/microfluidic-designer/types";
import { AVAILABLE_TUBING_TYPES, PALETTE_ITEMS } from "@/lib/microfluidic-designer/types"; // Import PALETTE_ITEMS
import { calculateTubePathData } from "@/lib/microfluidic-designer/utils/pathUtils";
import { 
  calculateRectangularChannelResistance,
  // calculateTubingResistance // Removed as it's unused
} from "@/lib/microfluidic-designer/resistanceUtils";
import {
  FLUID_VISCOSITY_PAS,
  DEFAULT_CHANNEL_WIDTH_MICRONS,
  DEFAULT_CHANNEL_DEPTH_MICRONS,
} from "@/lib/microfluidic-designer/constants";
import { 
  runFluidSimulationLogic, 
  resetSimulationStateLogic 
} from '@/lib/microfluidic-designer/simulationEngine'; // Import simulation engine functions
import FlowDisplayLegend from '@/components/microfluidic-designer/canvas/FlowVelocityLegend';
import PressureDisplayLegend from '@/components/microfluidic-designer/canvas/PressureDisplayLegend';
import { getDynamicFlowColor, formatFlowVelocityForDisplay, formatFlowRateForDisplay, getPressureIndicatorColor } from '@/lib/microfluidic-designer/utils/visualizationUtils';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Trash2, PlayCircle, RotateCcw, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { KonvaEventObject } from 'konva/lib/Node';
import Konva from 'konva'; // Import Konva namespace
import { VariantSelector } from '@/components/microfluidic-designer/VariantSelector';
import { PARENT_PRODUCTS, ParentProduct, ProductVariant, getDefaultVariant, createCanvasItemFromVariant, getTubingTypeByMaterial, calculateTubingResistanceByMaterial, getConnectionLength } from '@/lib/microfluidic-designer/productData';

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
// const GRID_SIZE = 20; // Matching the one in CanvasArea.tsx for consistency - REMOVED: unused

// Constants for Palette filtering (lifted from PaletteSidebar)
const FILTERS = [
  { label: "All", value: "all" },
  { label: "Chips", value: "chip" },
  { label: "Tools", value: "outlet" },
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
// const HEADER_HEIGHT = 64; // px, matches top-16 - REMOVED: unused
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

  // State for min/max flow rates and velocities
  const [minRate, setMinRate] = useState<number | undefined>(undefined);
  const [maxRate, setMaxRate] = useState<number | undefined>(undefined);
  const [minVelocity, setMinVelocity] = useState<number | undefined>(undefined);
  const [maxVelocity, setMaxVelocity] = useState<number | undefined>(undefined);
  // Added state for min/max pressures
  const [minPressure, setMinPressure] = useState<number | undefined>(undefined);
  const [maxPressure, setMaxPressure] = useState<number | undefined>(undefined);

  // State for variant selection
  const [isVariantSelectorOpen, setIsVariantSelectorOpen] = useState(false);
  const [pendingDrop, setPendingDrop] = useState<{
    parentProduct: ParentProduct;
    x: number;
    y: number;
    itemId: string;
  } | null>(null);

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

  // Variant selection handlers
  const handleVariantSelect = useCallback((variant: ProductVariant) => {
    if (!pendingDrop) return;

    const { parentProduct, x, y, itemId } = pendingDrop;
    
    // Create canvas item from the selected variant
    const newItem = createCanvasItemFromVariant(parentProduct, variant, itemId, x, y);
    
    // Calculate resistance for the specific variant
    const channelWidth = newItem.currentChannelWidthMicrons;
    const channelDepth = newItem.currentChannelDepthMicrons;
    const channelLength = newItem.currentChannelLengthMm;
    
    let calculatedResistance: number;

    if (parentProduct.chipType === 'straight' || parentProduct.chipType === 'meander') {
      calculatedResistance = calculateRectangularChannelResistance(
        channelLength * 1e-3, // mm to m
        channelWidth * 1e-6,  // µm to m
        channelDepth * 1e-6,  // µm to m
        FLUID_VISCOSITY_PAS
      );
    } else if (parentProduct.chipType === 't-type' || parentProduct.chipType === 'x-type') {
      calculatedResistance = calculateRectangularChannelResistance(
        (newItem.currentJunctionSegmentLengthMm || 2.5) * 1e-3,
        channelWidth * 1e-6,
        channelDepth * 1e-6,
        FLUID_VISCOSITY_PAS
      );
    } else if (parentProduct.chipType === 'pump' || parentProduct.chipType === 'outlet') {
      calculatedResistance = 0;
    } else {
      calculatedResistance = 1e18;
    }

    // Update the item with calculated resistance and selected variant info
    const finalItem = {
      ...newItem,
      resistance: calculatedResistance,
      selectedVariantId: variant.id,
    };

    setDroppedItems(prevItems => [...prevItems, finalItem]);
    setPendingDrop(null);
    setIsVariantSelectorOpen(false);
  }, [pendingDrop]);

  const handleVariantSelectorClose = useCallback(() => {
    setIsVariantSelectorOpen(false);
    setPendingDrop(null);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>, containerRef: React.RefObject<HTMLDivElement | null>) => {
    event.preventDefault();
    const itemDataString = event.dataTransfer.getData('application/json');
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect || containerRect.width === 0 || containerRect.height === 0) {
      console.warn("[Drop] Container dimensions are invalid or zero. Aborting drop.", containerRect);
      return;
    }

    const dropX = event.clientX - containerRect.left;
    const dropY = event.clientY - containerRect.top;

    if (itemDataString) {
      try {
        const paletteItem = JSON.parse(itemDataString) as PaletteItemData;
        const parentProduct = PARENT_PRODUCTS.find(p => p.id === paletteItem.id);

        if (!parentProduct) {
          console.error("Parent product not found for palette item:", paletteItem);
          return;
        }

        const itemWidth = parentProduct.defaultWidth || 80;
        const itemHeight = parentProduct.defaultHeight || 40;
        const initialX = dropX - itemWidth / 2;
        const initialY = dropY - itemHeight / 2;
        const clampedX = Math.max(0, Math.min(initialX, containerRect.width - itemWidth));
        const clampedY = Math.max(0, Math.min(initialY, containerRect.height - itemHeight));
        const newItemId = `${parentProduct.chipType || 'item'}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

        // Determine if VariantSelector should be shown
        const chipTypesRequiringSelector = ['straight', 'x-type', 't-type', 'meander'];
        const requiresVariantSelector = 
          chipTypesRequiringSelector.includes(parentProduct.chipType) && 
          parentProduct.variants && 
          parentProduct.variants.length > 1; // Only show if multiple variants exist

        if (requiresVariantSelector) {
          setPendingDrop({
            parentProduct,
            x: clampedX,
            y: clampedY,
            itemId: newItemId,
          });
          setIsVariantSelectorOpen(true);
          return;
        }
        
        // If no selector needed, or only one variant, create item directly
        let variantToUse: ProductVariant | undefined = undefined;
        if (parentProduct.variants && parentProduct.variants.length > 0) {
          variantToUse = getDefaultVariant(parentProduct.id);
          if (!variantToUse) { 
             variantToUse = parentProduct.variants[0];
          }
        }

        if (variantToUse) {
          // Create item using the selected/default variant
          const baseNewItem = createCanvasItemFromVariant(parentProduct, variantToUse, newItemId, clampedX, clampedY);
          
          // Calculate resistance for the specific variant (logic adapted from handleVariantSelect)
          const channelWidth = baseNewItem.currentChannelWidthMicrons;
          const channelDepth = baseNewItem.currentChannelDepthMicrons;
          const channelLength = baseNewItem.currentChannelLengthMm;
          let calculatedResistance: number;

          if (parentProduct.chipType === 'straight' || parentProduct.chipType === 'meander') {
            calculatedResistance = calculateRectangularChannelResistance(
              channelLength * 1e-3, // mm to m
              channelWidth * 1e-6,  // µm to m
              channelDepth * 1e-6,  // µm to m
              FLUID_VISCOSITY_PAS
            );
          } else if (parentProduct.chipType === 't-type' || parentProduct.chipType === 'x-type') {
            // For T/X junctions, ensure junction segment length is used if available
            const effectiveLengthMm = baseNewItem.currentJunctionSegmentLengthMm || channelLength || 2.5; // Default if all else fails
            calculatedResistance = calculateRectangularChannelResistance(
              effectiveLengthMm * 1e-3, 
              channelWidth * 1e-6,
              channelDepth * 1e-6,
              FLUID_VISCOSITY_PAS
            );
          } else if (parentProduct.chipType === 'pump' || parentProduct.chipType === 'outlet') {
            calculatedResistance = 0; // Pumps and outlets have no internal resistance for this model
          } else {
            // Fallback for other types if any, or placeholder for holders
            calculatedResistance = parentProduct.chipType === 'holder' ? 0 : 1e18; // High resistance for unhandled, 0 for holder
          }

          const finalItem = {
            ...baseNewItem,
            resistance: calculatedResistance,
            // selectedVariantId is already set by createCanvasItemFromVariant
          };
          setDroppedItems(prevItems => [...prevItems, finalItem]);

        } else if (!parentProduct.variants || parentProduct.variants.length === 0) {
          // For items like 'outlet-tool' that have no variants defined in PARENT_PRODUCTS
          console.log(`Creating item ${parentProduct.name} directly without variants (e.g., canvas tools).`);
          const newItem: CanvasItemData = {
            id: newItemId,
            productId: parentProduct.id,
            name: parentProduct.name,
            chipType: parentProduct.chipType,
            x: clampedX,
            y: clampedY,
            width: itemWidth,
            height: itemHeight,
            ports: parentProduct.defaultPorts.map((p: Port) => ({...p, id: `${newItemId}_${p.id}`})),
            resistance: 0, 
            currentChannelWidthMicrons: DEFAULT_CHANNEL_WIDTH_MICRONS, 
            currentChannelDepthMicrons: DEFAULT_CHANNEL_DEPTH_MICRONS, 
            currentChannelLengthMm: 5, 
            material: 'Glass', 
            pumpType: parentProduct.pumpType,
            portPressures: parentProduct.defaultPortPressures, 
            portFlowRates: parentProduct.defaultPortFlowRates,
            internalConnections: parentProduct.internalConnections,
            temperatureRange: { min: 0, max: 100, unit: '°C' },
            pressureRating: { maxPressure: 5, unit: 'bar' },
            chemicalResistance: ['Water', 'Ethanol'],
            isBiocompatible: true,
            isAutoclavable: true,
            // selectedVariantId remains undefined for these tool-type items
          };
          setDroppedItems(prevItems => [...prevItems, newItem]);
        } else {
           console.warn("Could not determine variant for product:", parentProduct.name, "and no direct creation path.");
        }

      } catch (error) {
        console.error("Failed to parse or process dropped item data:", error);
      }
    }
  }, []);

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

  const handlePortClick = useCallback((itemId: string, port: Port, konvaEvent: KonvaEventObject<MouseEvent>) => {
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
      
      // Determine tubing length and type based on connection
      const isPumpConnection = sourceItem.chipType === 'pump' || targetItem.chipType === 'pump';
      const physicalLengthMeters = getConnectionLength(isPumpConnection);
      const defaultMaterial: 'silicone' | 'ptfe' | 'peek' = 'silicone'; // Default to silicone
      const tubingType = getTubingTypeByMaterial(defaultMaterial);
      
      const tubeResistance = calculateTubingResistanceByMaterial(physicalLengthMeters, defaultMaterial);

      const newConnectionId = `conn-${sourceItem.id}_${sourcePort.id}-${targetItem.id}_${targetPort.id}-${Date.now()}`;
      const newConnection: Connection = {
        id: newConnectionId,
        fromItemId: sourceItem.id,
        fromPortId: sourcePort.id,
        toItemId: targetItem.id,
        toPortId: targetPort.id,
        pathData: pathData,
        tubingMaterial: defaultMaterial,
        lengthMeters: physicalLengthMeters,
        innerDiameterMm: tubingType.innerDiameterMm,
        resistance: tubeResistance,
        tubingTypeId: tubingType.id,
      };
      
      setConnections(prev => [...prev, newConnection]);
      setInProgressConnection(null); 
    }
  }, [inProgressConnection, droppedItems, connections]);

  const handleStageClick = useCallback(
  (
    konvaEvent: KonvaEventObject<MouseEvent>, // Updated type
    snappedTarget: { item: CanvasItemData; port: Port } | null // New second argument
  ) => {
    // 1. Handle connection in progress FIRST
    if (inProgressConnection) {
      if (snappedTarget) {
        // A snap is active! Form connection to snappedTarget.
        const sourceItem = inProgressConnection.sourceItem;
        const sourcePort = inProgressConnection.sourcePort;
        const targetItem = snappedTarget.item;
        const targetPort = snappedTarget.port;

        if (sourceItem.id === targetItem.id) {
          console.warn("Cannot connect an item to itself. Connection cancelled.");
          setInProgressConnection(null);
          return;
        }
        // Ensure the target port ID is the base ID if your system relies on that for isPortConnected check
        const baseTargetPortId = targetPort.id.startsWith(targetItem.id + '_') 
                               ? targetPort.id.substring(targetItem.id.length + 1) 
                               : targetPort.id;
                               
        if (isPortConnected(targetItem.id, baseTargetPortId, connections)) {
          console.warn(`Target port ${baseTargetPortId} on item ${targetItem.id} is already connected. Connection cancelled.`);
          setInProgressConnection(null);
          return;
        }

        const pathData = calculateTubePathData(sourceItem, sourcePort, targetItem, targetPort);
        const isPumpConnection = sourceItem.chipType === 'pump' || targetItem.chipType === 'pump';
        const physicalLengthMeters = getConnectionLength(isPumpConnection);
        const defaultMaterial: 'silicone' | 'ptfe' | 'peek' = 'silicone'; // Default to silicone
        const tubingType = getTubingTypeByMaterial(defaultMaterial);

        const tubeResistance = calculateTubingResistanceByMaterial(physicalLengthMeters, defaultMaterial);
        // Ensure port IDs in the connection ID are base IDs if that's the convention
        const baseSourcePortId = sourcePort.id.startsWith(sourceItem.id + '_')
                               ? sourcePort.id.substring(sourceItem.id.length + 1)
                               : sourcePort.id;

        const newConnectionId = `conn-${sourceItem.id}_${baseSourcePortId}-${targetItem.id}_${baseTargetPortId}-${Date.now()}`;
        const newConnection: Connection = {
          id: newConnectionId,
          fromItemId: sourceItem.id,
          fromPortId: sourcePort.id, // Store the full port ID from CanvasItemData.ports
          toItemId: targetItem.id,
          toPortId: targetPort.id,   // Store the full port ID from CanvasItemData.ports
          pathData: pathData,
          tubingMaterial: defaultMaterial,
          lengthMeters: physicalLengthMeters,
          innerDiameterMm: tubingType.innerDiameterMm,
          resistance: tubeResistance,
          tubingTypeId: tubingType.id,
        };

        setConnections(prev => [...prev, newConnection]);
        setInProgressConnection(null);
        console.log('Connection formed to SNAPPED target via stage click:', newConnection);
        setSelectedItemId(null); // Deselect source item after connection
        return; // Connection handled
      } else {
        // Connection in progress, but no snap was active during this click.
        // This means the user clicked somewhere else (e.g., stage background) to cancel.
        console.log('Connection attempt cancelled by stage click (no snap active).');
        setInProgressConnection(null);
        // If the click was directly on the stage background, also deselect items.
        if (konvaEvent.target === konvaEvent.target.getStage()) {
          setSelectedItemId(null);
          setSelectedConnectionId(null);
        }
        return; // Connection attempt cancelled or click was not for connection finalization
      }
    }

    // 2. If NO connection was in progress, handle normal stage clicks (selection, deselection)
    // This part of the logic is for selecting/deselecting items if no connection is being drawn.
    if (konvaEvent.target === konvaEvent.target.getStage()) {
      // Click on stage background
      setSelectedItemId(null);
      setSelectedConnectionId(null);
    } else {
      // Click on an item (or part of an item) - attempt to identify and select it.
      let currentNode: Konva.Node | null = konvaEvent.target; // More general Node type
      let identifiedItemId: string | null = null;

      while (currentNode && currentNode !== konvaEvent.target.getStage()) {
        const groupId = currentNode.id();
        if (groupId && typeof groupId === 'string' && droppedItems.some(item => item.id === groupId)) {
          identifiedItemId = groupId;
          break;
        }
        currentNode = currentNode.getParent();
      }

      if (identifiedItemId) {
        setSelectedItemId(prevId => (prevId === identifiedItemId ? null : identifiedItemId));
        setSelectedConnectionId(null);
      }
      // If click was on a port, onPortClick would have handled it.
      // If click was on a tube, onTubeClick would have handled it.
      // If click was on something else non-identifiable on the stage, it effectively does nothing here.
    }
  },
  [inProgressConnection, droppedItems, connections, setInProgressConnection, setConnections, setSelectedItemId, setSelectedConnectionId]
);

  const handleStageContextMenu = useCallback((konvaEvent: KonvaEventObject<MouseEvent>) => {
    konvaEvent.evt.preventDefault();
    if (inProgressConnection) {
      setInProgressConnection(null);
    }
  }, [inProgressConnection]);

  const handleTubeClick = useCallback((connectionId: string, konvaEvent: KonvaEventObject<MouseEvent>) => {
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
  
  const handleConnectionPropertyChange = useCallback((connectionId: string, property: keyof Connection, value: unknown) => {
    setConnections(prevConnections =>
      prevConnections.map(conn => {
        if (conn.id === connectionId) {
          const updatedConnection = { ...conn, [property]: value };
          console.log(`[ConnectionPropertyChange] Connection ${connectionId} updated. Property: ${property}, New Value:`, value, "Updated Connection:", updatedConnection);
          return updatedConnection;
        }
        return conn;
      })
    );
    // Clear simulation results when connection properties change
    setSimulationResults(initialSimulationResults);
    setSimulationVisualsKey(prev => prev + 1);
    setInspectionMode('none');
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
      // Prevent deletion if an input field is focused
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

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

  const handleItemPropertyChange = useCallback((itemId: string, propertyName: keyof CanvasItemData, value: unknown) => {
    setDroppedItems(prevItems =>
      prevItems.map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [propertyName]: value };

          // Recalculate resistance if a relevant dimension changed for certain chip types
          if (
            (propertyName === 'currentChannelWidthMicrons' ||
             propertyName === 'currentChannelDepthMicrons' ||
             propertyName === 'currentChannelLengthMm') &&
            (item.chipType === 'straight' || item.chipType === 'meander')
          ) {
            updatedItem.resistance = calculateRectangularChannelResistance(
              updatedItem.currentChannelLengthMm * 1e-3, 
              updatedItem.currentChannelWidthMicrons * 1e-6, 
              updatedItem.currentChannelDepthMicrons * 1e-6,
              FLUID_VISCOSITY_PAS
            );
          } else if ((propertyName === 'portPressures' || propertyName === 'portFlowRates') && item.chipType === 'pump') {
            // No specific recalculation needed here as pump properties are directly used
            // but this confirms we are handling them.
            // The simulation engine will use the new pump properties directly.
          }
          
          console.log(`[PropertyChange] Item ${itemId} updated. Property: ${propertyName}, New Value:`, value, "Updated Item:", updatedItem);
          return updatedItem;
        }
        return item;
      })
    );
    // If properties that affect simulation are changed, consider resetting or indicating simulation is stale
    // For now, we can clear previous results to prompt a re-run
    setSimulationResults(initialSimulationResults);
    setSimulationVisualsKey(prev => prev + 1);
    setInspectionMode('none'); 
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
    if ((selectedItemId || selectedConnectionId) && !wasRightPanelEverOpened) {
      setRightPanelOpen(true);
      setWasRightPanelEverOpened(true);
    }
  }, [selectedItemId, selectedConnectionId, wasRightPanelEverOpened]);

  // Effect to calculate min/max flow rates and velocities
  useEffect(() => {
    if (simulationResults && simulationResults.segmentFlows && connections && droppedItems) {
      const allVelocities: number[] = [];
      const allRates: number[] = [];
      const allPressures: number[] = []; // Added for pressures

      connections.forEach(conn => {
        const port1BaseId = conn.fromPortId.startsWith(conn.fromItemId + '_') ? conn.fromPortId.substring(conn.fromItemId.length + 1) : conn.fromPortId;
        const port2BaseId = conn.toPortId.startsWith(conn.toItemId + '_') ? conn.toPortId.substring(conn.toItemId.length + 1) : conn.toPortId;
        const node1Id = `${conn.fromItemId}_${port1BaseId}`;
        const node2Id = `${conn.toItemId}_${port2BaseId}`;
        const segmentIdKey = [node1Id, node2Id].sort().join('--');
        const flowRateM3s = simulationResults.segmentFlows![segmentIdKey];
        if (flowRateM3s !== undefined && isFinite(flowRateM3s)) {
          allRates.push(Math.abs(flowRateM3s));
          const tubingType = AVAILABLE_TUBING_TYPES.find(t => t.id === conn.tubingTypeId);
          if (tubingType && tubingType.innerRadiusMeters > 0) {
            const areaM2 = Math.PI * Math.pow(tubingType.innerRadiusMeters, 2);
            const velocity = flowRateM3s / areaM2;
            allVelocities.push(Math.abs(velocity));
          }
        }
      });
      droppedItems.forEach(item => {
        if ((item.chipType === 'straight' || item.chipType === 'meander') && item.ports.length === 2) {
          const node1Id = item.ports[0]!.id;
          const node2Id = item.ports[1]!.id;
          const segmentIdKey = [node1Id, node2Id].sort().join('--');
          const flowRateM3s = simulationResults.segmentFlows![segmentIdKey];
          if (flowRateM3s !== undefined && isFinite(flowRateM3s)) {
            allRates.push(Math.abs(flowRateM3s));
            if (item.currentChannelWidthMicrons > 0 && item.currentChannelDepthMicrons > 0) {
              const widthM = item.currentChannelWidthMicrons * 1e-6;
              const heightM = item.currentChannelDepthMicrons * 1e-6;
              const areaM2 = widthM * heightM;
              const velocity = flowRateM3s / areaM2;
              allVelocities.push(Math.abs(velocity));
            }
          }
        } else if (item.chipType === 't-type' || item.chipType === 'x-type') {
          const centralJunctionNodeId = `${item.id}_internal_junction`;
          item.ports.forEach(port => {
            const portNodeId = port.id;
            const segmentIdKey = [portNodeId, centralJunctionNodeId].sort().join('--');
            const flowRateM3s = simulationResults.segmentFlows![segmentIdKey];
            if (flowRateM3s !== undefined && isFinite(flowRateM3s)) {
              allRates.push(Math.abs(flowRateM3s));
              // Use junction dimensions if available, otherwise channel dimensions
              const widthMicrons = item.currentJunctionWidthMicrons ?? item.currentChannelWidthMicrons;
              const depthMicrons = item.currentJunctionDepthMicrons ?? item.currentChannelDepthMicrons;

              if (widthMicrons > 0 && depthMicrons > 0) {
                const widthM = widthMicrons * 1e-6;
                const heightM = depthMicrons * 1e-6;
                const areaM2 = widthM * heightM;
                const velocity = flowRateM3s / areaM2;
                allVelocities.push(Math.abs(velocity));
              }
            }
          });
        }
      });

      if (simulationResults.nodePressures) {
        Object.values(simulationResults.nodePressures).forEach(pressure => {
          if (pressure !== undefined && isFinite(pressure)) {
            allPressures.push(pressure);
          }
        });
      }

      setMinVelocity(allVelocities.length > 0 ? Math.min(...allVelocities) : undefined);
      setMaxVelocity(allVelocities.length > 0 ? Math.max(...allVelocities) : undefined);
      setMinRate(allRates.length > 0 ? Math.min(...allRates) : undefined);
      setMaxRate(allRates.length > 0 ? Math.max(...allRates) : undefined);
      setMinPressure(allPressures.length > 0 ? Math.min(...allPressures) : undefined); // Set min pressure
      setMaxPressure(allPressures.length > 0 ? Math.max(...allPressures) : undefined); // Set max pressure
    } else {
      setMinRate(undefined);
      setMaxRate(undefined);
      setMinVelocity(undefined);
      setMaxVelocity(undefined);
      setMinPressure(undefined); // Reset min pressure
      setMaxPressure(undefined); // Reset max pressure
    }
  }, [simulationResults, connections, droppedItems]);

  const handleStageResize = useCallback((newDimensions: { width: number; height: number }) => {
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
          minPressurePa={minPressure} // Pass minPressure
          maxPressurePa={maxPressure} // Pass maxPressure
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
            {/* Pressure/Flow Toggle Group */}
            <ToggleGroup type="single" value={inspectionMode} onValueChange={v => {
              const newMode = v as 'none' | 'pressure' | 'flow' || 'pressure';
              setInspectionMode(newMode);
              if (newMode !== 'flow') setFlowDisplayMode('rate');
            }} className="bg-white/80 shadow-md rounded-md border border-[#E1E4E8]">
              <ToggleGroupItem value="pressure" aria-label="Show Pressures" className="text-xs px-2 min-w-[64px] h-7 font-inter data-[state=on]:bg-[#003C7E] data-[state=on]:text-white">Pressure</ToggleGroupItem>
              <ToggleGroupItem value="flow" aria-label="Show Flow" className="text-xs px-2 min-w-[64px] h-7 font-inter data-[state=on]:bg-[#003C7E] data-[state=on]:text-white">Flow</ToggleGroupItem>
            </ToggleGroup>

            {/* Rate/Velocity Toggle Group (or placeholder for consistent layout) */}
            {inspectionMode === 'flow' ? (
              <ToggleGroup type="single" value={flowDisplayMode} onValueChange={v => setFlowDisplayMode(v as 'rate' | 'velocity' || 'rate')} className="bg-white/80 shadow-md rounded-md border border-[#E1E4E8]">
                <ToggleGroupItem value="rate" aria-label="Show Rate" className="text-xs px-2 min-w-[64px] h-7 font-inter data-[state=on]:bg-[#003C7E] data-[state=on]:text-white">Rate</ToggleGroupItem>
                <ToggleGroupItem value="velocity" aria-label="Show Velocity" className="text-xs px-2 min-w-[64px] h-7 font-inter data-[state=on]:bg-[#003C7E] data-[state=on]:text-white">Velocity</ToggleGroupItem>
              </ToggleGroup>
            ) : (
              <div className="w-[130px] h-[30px]" /> /* Placeholder for the Rate/Velocity toggle group */
            )}

            {/* Legends Container - Renders one legend at a time */}
            <div className="legend-container"> {/* Rely on parent gap-2. No ml-2 needed. */}
              {inspectionMode === 'flow' && flowDisplayMode === 'velocity' && (minVelocity !== undefined || maxVelocity !== undefined) && (
                <FlowDisplayLegend
                  minDisplayValue={minVelocity ?? 0}
                  maxDisplayValue={maxVelocity ?? 0.001}
                  displayMode="velocity"
                  getDynamicFlowColor={getDynamicFlowColor}
                  formatValueForDisplay={formatFlowVelocityForDisplay}
                  className="bg-white/80 shadow-md rounded-md border border-[#E1E4E8] p-2 text-xs font-sans text-zinc-800 z-30 w-[220px]"
                />
              )}
              {inspectionMode === 'flow' && flowDisplayMode === 'rate' && (minRate !== undefined || maxRate !== undefined) && (
                <FlowDisplayLegend
                  minDisplayValue={minRate ?? 0}
                  maxDisplayValue={maxRate ?? 0.000001}
                  displayMode="rate"
                  getDynamicFlowColor={getDynamicFlowColor}
                  formatValueForDisplay={formatFlowRateForDisplay}
                  className="bg-white/80 shadow-md rounded-md border border-[#E1E4E8] p-2 text-xs font-sans text-zinc-800 z-30 w-[220px]"
                />
              )}
              {inspectionMode === 'pressure' && (minPressure !== undefined && maxPressure !== undefined) && (
                <PressureDisplayLegend
                  minPressurePa={minPressure}
                  maxPressurePa={maxPressure}
                  getPressureIndicatorColor={getPressureIndicatorColor}
                  className="bg-white/80 shadow-md rounded-md border border-[#E1E4E8] p-2 text-xs font-sans text-zinc-800 z-30 w-auto min-w-[220px]"
                />
              )}
            </div>
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
          width: leftPanelOpen ? (isMobile ? '240px' : '280px') : '0px',
          maxHeight: 'calc(100vh - 8rem)', // Adjust to account for header/footer or other global UI
          transition: 'width 0.3s ease-in-out',
        }}
      >
        <div className={`relative h-full bg-background/90 flex flex-col overflow-y-auto transition-all duration-300 border-r border-border ${
          leftPanelOpen 
            ? 'shadow-[5px_5px_30px_rgba(0,0,0,0.2)] rounded-r-xl p-4' 
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
          className="absolute top-1/2 -right-4 transform -translate-y-1/2 z-50 bg-background rounded-full h-8 w-8 flex items-center justify-center border border-border transition-all hover:bg-accent/10"
          aria-label={leftPanelOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {leftPanelOpen ? <ChevronLeft size={16} className="text-[#003C7E]" /> : <ChevronRight size={16} className="text-[#003C7E]" />}
        </button>
      </div>

      {/* Right Panel - Properties */}
      <div 
        className="fixed top-1/2 right-0 transform -translate-y-1/2 z-40"
        style={{
          width: rightPanelOpen ? (isMobile ? '300px' : '360px') : '0px',
          maxHeight: 'calc(100vh - 8rem)',
          transition: 'width 0.3s ease-in-out'
        }}
      >
        <div className={`relative h-full bg-background/90 flex flex-col overflow-y-auto transition-all duration-300 border border-slate-300 ${
          rightPanelOpen 
            ? 'shadow-[0px_5px_30px_rgba(0,0,0,0.2)] rounded-l-xl p-4' 
            : 'p-0 shadow-none opacity-0'
        }`}>
          {rightPanelOpen && (
            <>
              <DetailsSidebar
                selectedItem={currentSelectedItem}
                selectedConnection={selectedConnectionId ? connections.find(conn => conn.id === selectedConnectionId) : undefined}
                droppedItems={droppedItems}
                connections={connections}
                onItemPropertyChange={handleItemPropertyChange}
                onConnectionPropertyChange={handleConnectionPropertyChange}
                onDeleteItem={handleDeleteItem}
                onDeleteConnection={handleDeleteConnection}
              />
            </>
          )}
        </div>
        
        <button
          onClick={() => setRightPanelOpen(!rightPanelOpen)}
          className="absolute top-1/2 -left-4 transform -translate-y-1/2 z-50 bg-background rounded-full h-8 w-8 flex items-center justify-center border border-border transition-all hover:bg-accent/10"
          aria-label={rightPanelOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {rightPanelOpen ? <ChevronRight size={16} className="text-[#003C7E]" /> : <ChevronLeft size={16} className="text-[#003C7E]" />}
        </button>
      </div>

      {/* Variant Selector Modal */}
      {pendingDrop && (
        <VariantSelector
          isOpen={isVariantSelectorOpen}
          onClose={handleVariantSelectorClose}
          parentProduct={pendingDrop.parentProduct}
          onVariantSelect={handleVariantSelect}
        />
      )}
    </div>
  );
} 