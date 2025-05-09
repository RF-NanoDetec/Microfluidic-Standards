'use client';

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
// import CanvasArea from "@/components/microfluidic-designer/CanvasArea";
import DetailsSidebar from "@/components/microfluidic-designer/DetailsSidebar";
import PaletteSidebar from "@/components/microfluidic-designer/PaletteSidebar";
import type { PaletteItemData, CanvasItemData, Port, Connection, TubingTypeDefinition, MicrofluidicProductData } from "@/lib/microfluidic-designer/types";
import { AVAILABLE_TUBING_TYPES } from "@/lib/microfluidic-designer/types"; // Import available tubing types
import { calculateTubePathData } from "@/lib/microfluidic-designer/utils/pathUtils";
import { 
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

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>, containerRef: React.RefObject<HTMLDivElement | null>) => {
    event.preventDefault();
    const itemDataString = event.dataTransfer.getData('application/json');
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    const dropX = event.clientX - containerRect.left;
    const dropY = event.clientY - containerRect.top;

    if (itemDataString) {
      try {
        // Assume paletteItem might be a subset of MicrofluidicProductData or similar enough for now
        const paletteItem = JSON.parse(itemDataString) as PaletteItemData & Partial<MicrofluidicProductData>; 

        const newItemId = `${paletteItem.chipType || 'item'}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        
        // Default physical properties, to be overridden by paletteItem if present
        const channelWidth = paletteItem.channelWidthMicrons || DEFAULT_CHANNEL_WIDTH_MICRONS;
        const channelDepth = paletteItem.channelDepthMicrons || DEFAULT_CHANNEL_DEPTH_MICRONS;
        // channelLengthMm would ideally also come from paletteItem or product data
        // For now, we might need to use a placeholder or derive it based on chipType if not directly available.
        // Let's assume a placeholder or that it's part of `baseResistancePasM3` calculation for now.
        const channelLength = paletteItem.channelLengthMm || 5; // Defaulting to 5mm for example

        let calculatedResistance: number;
        // TODO: Refine this resistance calculation based on actual product data and chip type
        // This is a simplified fallback logic using pre-calculated constants.
        switch (paletteItem.chipType) {
          case 'straight':
            calculatedResistance = paletteItem.baseResistancePasM3 || RESISTANCE_STRAIGHT_CHIP_PAS_M3;
            break;
          case 't-type':
            calculatedResistance = paletteItem.baseResistancePasM3 || RESISTANCE_T_JUNCTION_SEGMENT_PAS_M3;
            break;
          case 'x-type':
            calculatedResistance = paletteItem.baseResistancePasM3 || RESISTANCE_X_JUNCTION_SEGMENT_PAS_M3;
            break;
          case 'meander':
            calculatedResistance = paletteItem.baseResistancePasM3 || RESISTANCE_MEANDER_CHIP_PAS_M3;
            break;
          case 'pump':
          case 'outlet':
            calculatedResistance = 0; // Pumps and outlets are sources/sinks, no resistance themselves
            break;
          default:
            console.warn(`Unknown chipType for resistance calculation: ${paletteItem.chipType}`);
            calculatedResistance = 1e18; // Fallback high resistance
        }
        // If you have calculateChipResistance ready for all types:
        // calculatedResistance = calculateChipResistance(
        //   paletteItem.chipType,
        //   (channelLength || 5) / 1000, // mm to m
        //   channelWidth / 1e6, // µm to m
        //   channelDepth / 1e6, // µm to m
        // );

        const newItem: CanvasItemData = {
          // Core properties from PaletteItemData that are part of CanvasItemData
          id: newItemId,
          productId: paletteItem.id, // Assuming paletteItem.id is the product ID
          name: paletteItem.name,
          chipType: paletteItem.chipType,
          x: dropX - (paletteItem.previewWidth || 80) / 2, // Use paletteItem.previewWidth or default
          y: dropY - (paletteItem.previewHeight || 40) / 2, // Use paletteItem.previewHeight or default
          width: paletteItem.previewWidth || 80, // Use actual item width from product later
          height: paletteItem.previewHeight || 40, // Use actual item height from product later
          ports: paletteItem.ports.map(p => ({...p, id: `${newItemId}_${p.id}`})), // Ensure port IDs are unique to this canvas item
          
          // Physical properties for this instance
          currentChannelWidthMicrons: channelWidth,
          currentChannelDepthMicrons: channelDepth,
          currentChannelLengthMm: channelLength, 
          material: paletteItem.material || 'Glass', // Example default
          resistance: calculatedResistance,
          portPressures: paletteItem.chipType === 'pump' ? (paletteItem.defaultPortPressures || {}) : undefined,
          // internalConnections will be defined by the specific KonvaCanvasItem or derived by chipType
          // For now, we assume it's on paletteItem if needed, or handled by component drawing logic.
          internalConnections: (paletteItem as any).internalConnections, // Cast if not strictly on PaletteItemData
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

  const currentSelectedItem = droppedItems.find(item => item.id === selectedItemId);

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 80px)', padding: '1rem', gap: '1rem' }}>
      <PaletteSidebar />
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
      />
      <DetailsSidebar selectedItem={currentSelectedItem} />
    </div>
  );
} 