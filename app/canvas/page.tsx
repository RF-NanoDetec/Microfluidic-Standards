'use client';

import { useState, useCallback, useEffect } from 'react';
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
import { AVAILABLE_TUBING_TYPES } from "@/lib/microfluidic-designer/types"; // Import available tubing types
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

const CanvasArea = dynamic(() => import('@/components/microfluidic-designer/CanvasArea'), {
  ssr: false,
  loading: () => <div className="flex-grow flex items-center justify-center text-slate-400">Loading Canvas...</div>
});

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

    const dropX = event.clientX - containerRect.left;
    const dropY = event.clientY - containerRect.top;

    if (itemDataString) {
      try {
        const paletteItem = JSON.parse(itemDataString) as PaletteItemData;

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
          x: dropX - (paletteItem.defaultWidth || 80) / 2,
          y: dropY - (paletteItem.defaultHeight || 40) / 2,
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
  }, []);

  const handleItemDragEnd = useCallback((itemId: string, newX: number, newY: number) => {
    const updatedDroppedItems = droppedItems.map(item =>
      item.id === itemId ? { ...item, x: newX, y: newY } : item
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
        if (inProgressConnection) { 
          setInProgressConnection(null);
        }
      } else {
        setSelectedItemId(null);
        setSelectedConnectionId(null);
        if (inProgressConnection) {
          setInProgressConnection(null);
        }
      }
    }
  }, [inProgressConnection, droppedItems, setSelectedItemId, setSelectedConnectionId, setInProgressConnection]);

  const handleStageContextMenu = useCallback((konvaEvent: any) => {
    konvaEvent.evt.preventDefault();
    setSelectedItemId(null);
    setSelectedConnectionId(null);
    if (inProgressConnection) {
      setInProgressConnection(null);
    }
  }, [inProgressConnection]);

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

  return (
    <div className="flex h-full min-h-0 w-full bg-zinc-50">
      {/* Palette Sidebar */}
      <div className="min-w-[180px] max-w-[220px] w-full h-full border-r border-zinc-200 overflow-y-auto flex-shrink-0">
        <PaletteSidebar />
      </div>
      {/* Canvas Area */}
      <div className="flex flex-col flex-1 min-w-0 h-full min-h-0 overflow-hidden">
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
        />
      </div>
      {/* Right Sidebar: Properties + Simulation Summary */}
      <div className="min-w-[220px] max-w-[260px] w-full h-full border-l border-zinc-200 flex flex-col flex-shrink-0">
        <div className="flex-1 min-h-0 overflow-y-auto">
          <DetailsSidebar
            selectedItem={currentSelectedItem}
            onItemPropertyChange={handleItemPropertyChange}
          />
        </div>
        <div className="flex-shrink-0 min-h-[280px] max-h-[360px] overflow-y-auto">
          <SimulationSummaryPanel
            results={simulationResults}
            inspectionMode={inspectionMode}
            flowDisplayMode={flowDisplayMode}
            droppedItems={droppedItems}
            connections={connections}
          />
        </div>
      </div>
    </div>
  );
} 