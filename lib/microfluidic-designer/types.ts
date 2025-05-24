import { CHIP_WIDTH, CHIP_HEIGHT, PUMP_CANVAS_WIDTH, PUMP_CANVAS_HEIGHT, DEFAULT_CHANNEL_WIDTH_MICRONS, DEFAULT_CHANNEL_DEPTH_MICRONS, DEFAULT_TUBE_INNER_RADIUS_M } from './constants';
import type { TemperatureRange, PressureRating } from '../types';

export type PortType = 'universal'; // All ports are now universal
export type PortOrientation = 'left' | 'right' | 'top' | 'bottom' | 'none';

export interface Port {
  id: string; 
  name: string; // Added name for clarity, can be same as id if simple
  x: number; 
  y: number; 
  type: PortType;
  orientation: PortOrientation;
  simulationRole?: 'inlet' | 'outlet' | 'inout';
}

// Represents a product from your catalog/library
export interface MicrofluidicProductData {
  id: string; // Product SKU or unique ID
  name: string;
  chipType: string; // Functional type, e.g., 'straight', 'pump'
  category: 'Microfluidic Chips' | 'Other';
  title: string; // Tooltip or short description
  previewImage?: string; // Optional path to a preview image for palette
  konvaPreviewId?: string; // ID for the div that will host the Konva preview for palette items

  // Physical properties for simulation
  channelWidthMicrons?: number;  // Default will be used if not provided
  channelDepthMicrons?: number;  // Default will be used if not provided
  channelLengthMm?: number;      // Important for resistance calculation
  baseResistancePasM3?: number; // Optional: if resistance is pre-calculated for the product
  material?: string;             // e.g., 'Glass', 'PDMS'

  // Operational and compatibility properties from e-commerce product
  temperatureRange?: TemperatureRange;
  pressureRating?: PressureRating;
  chemicalResistance?: string[];
  isBiocompatible?: boolean;
  isAutoclavable?: boolean;

  // Default ports definition for this product type
  // These are relative to the product's own coordinate system
  defaultPorts: Port[]; 
  defaultWidth?: number; // Visual width on canvas
  defaultHeight?: number; // Visual height on canvas
  internalConnections?: string[][]; // Needed for simulation graph for complex chips

  // Pump specific
  pumpType?: 'pressure' | 'syringe'; // Type of pump - determines the control method
  defaultPortPressures?: { [portId: string]: number }; // Initial pressures in Pascals for pressure pump ports
  defaultPortFlowRates?: { [portId: string]: number }; // Initial flow rates in µL/min for syringe pump ports
}


// Represents an item in the visual palette (derived from MicrofluidicProductData)
// For now, let PaletteItemData include all fields from MicrofluidicProductData 
// to ensure all data is available for being passed to CanvasItemData.
// We can refine this later with Pick if some fields are truly palette-specific.
export interface PaletteItemData extends MicrofluidicProductData {}


// Represents an item placed on the main canvas
export interface CanvasItemData {
  id: string; // Unique instance ID on the canvas (e.g., chipType-timestamp-random)
  productId: string; // ID of the MicrofluidicProductData it originated from
  name: string;      // Display name (can be from product, or user-customized later)
  chipType: string;  // Functional type from product
  x: number;         // Position on canvas
  y: number;
  width: number;     // Actual rendered width on canvas
  height: number;    // Actual rendered height on canvas
  ports: Port[];     // Instance of ports, with absolute positions potentially calculated later or relative to x,y
  rotation?: number; // Added for item rotation
  
  // Current physical properties for this instance, can be modified from product defaults by user later
  currentChannelWidthMicrons: number;
  currentChannelDepthMicrons: number;
  currentChannelLengthMm: number; // For straight/meander: total length
  
  // NEW: Specific dimensions for T/X junction segments
  currentJunctionSegmentLengthMm?: number; // Length of each segment from port to junction center
  currentJunctionWidthMicrons?: number;    // Width of junction segments (if different from channel)
  currentJunctionDepthMicrons?: number;    // Depth of junction segments (if different from channel)
  
  material?: string;

  // Operational and compatibility properties for this instance
  temperatureRange?: TemperatureRange;
  pressureRating?: PressureRating;
  chemicalResistance?: string[];
  isBiocompatible?: boolean;
  isAutoclavable?: boolean;

  resistance: number; // Calculated resistance for this specific instance, in Pa·s/m³

  // Pump specific properties for this instance
  pumpType?: 'pressure' | 'syringe'; // Type of pump - determines the control method
  portPressures?: { [portId: string]: number }; // Pressures in Pascals for each of its ports, if it's a pressure pump
  portFlowRates?: { [portId: string]: number }; // Flow rates in µL/min for each of its ports, if it's a syringe pump

  // Needed by simulation engine to know how internal ports connect
  internalConnections?: string[][]; // Array of [portId1, portId2] pairs for internal paths

  // Store the selected variant information
  selectedVariantId?: string; // ID of the selected product variant
  sku?: string;                // SKU of the selected variant
  price?: number;              // Price of the selected variant
  imageUrl?: string;           // Image URL of the selected variant
  // stockStatus?: string;     // Optional: stock status of the selected variant
}


export interface TubingTypeDefinition {
  id: string; // e.g., "silicone_standard"
  displayName: string; // e.g., "Silicone Tubing"
  material: 'silicone' | 'ptfe' | 'peek';
  innerRadiusMeters: number;
  innerDiameterMm: number; // For easier user interface
}

// Example: A small library of available tubing types
export const AVAILABLE_TUBING_TYPES: TubingTypeDefinition[] = [
  {
    id: "silicone_standard",
    displayName: "Silicone Tubing",
    material: "silicone",
    innerRadiusMeters: 0.0005, // 0.5mm radius = 1mm diameter
    innerDiameterMm: 1.0,
  },
  {
    id: "ptfe_standard", 
    displayName: "PTFE Tubing",
    material: "ptfe",
    innerRadiusMeters: 0.0004, // 0.4mm radius = 0.8mm diameter
    innerDiameterMm: 0.8,
  },
  {
    id: "peek_standard",
    displayName: "PEEK Tubing", 
    material: "peek",
    innerRadiusMeters: 0.0003, // 0.3mm radius = 0.6mm diameter
    innerDiameterMm: 0.6,
  },
];


// Represents a connection (tubing) between two ports on the canvas
export interface Connection {
  id: string; // Unique ID for the connection (e.g., conn-item1portA-item2portB)
  fromItemId: string;    // ID of the CanvasItemData
  fromPortId: string;    // ID of the Port on the fromItem
  toItemId: string;      // ID of the CanvasItemData
  toPortId: string;      // ID of the Port on the toItem
  pathData: string;      // SVG path data for drawing the tube
  
  tubingMaterial: 'silicone' | 'ptfe' | 'peek'; // Material type for the tubing
  lengthMeters: number;    // Physical length of the tubing (user configurable)
  innerDiameterMm: number; // Inner diameter in mm (depends on material)
  resistance: number;    // Calculated resistance in Pa·s/m³
  
  // Legacy field for compatibility - will be derived from tubingMaterial
  tubingTypeId: string;  // Refers to TubingTypeDefinition.id
}


// PALETTE_ITEMS - Now imported from productData.ts
// Import the palette items from our new product data system
import { PALETTE_ITEMS_FROM_PRODUCTS } from './productData';
export const PALETTE_ITEMS: PaletteItemData[] = PALETTE_ITEMS_FROM_PRODUCTS;

// Simulation-specific types, to be used by simulationEngine.ts
// These types were previously defined locally in simulationEngine.ts

/**
 * Represents a node in the hydraulic network graph.
 * Nodes can be pumps, outlets, internal points within a chip, junctions between chips, or chip ports.
 */
export interface SimulationNode {
  id: string; // Unique identifier for the node (e.g., canvasItemId_portId, or canvasItemId_internalNodeX)
  type: 'pump' | 'outlet' | 'internal' | 'junction' | 'port';
  canvasItemId?: string; // Reference to the CanvasItemData.id this node belongs to or represents
  portId?: string; // Reference to the Port.id if this node represents a specific port
  pressure?: number; // Applied pressure in Pascals (e.g., for pumps or fixed pressure outlets)
  isGround?: boolean; // True if this node is a ground/reference pressure (e.g., atmospheric outlet)
  
  // Syringe pump specific properties
  pumpType?: 'pressure' | 'syringe'; // Type of pump this node represents
  flowRateM3s?: number; // Flow rate constraint in m³/s for syringe pumps
}

/**
 * Represents a segment (connection or internal path) in the hydraulic network graph.
 * Segments have a hydraulic resistance and connect two nodes.
 */
export interface SimulationSegment {
  id: string; // Unique identifier for the segment (e.g., connectionId, or canvasItemId_internalPathX)
  node1Id: string; // ID of the first SimulationNode
  node2Id: string; // ID of the second SimulationNode
  resistance: number; // Hydraulic resistance of the segment in Pa·s/m³
  type: 'tubing' | 'internal_chip_path';
  canvasConnectionId?: string; // If this segment represents a Connection
  canvasItemId?: string; // If this segment represents an internal path within a CanvasItemData
}

/**
 * Represents the entire hydraulic network graph for simulation.
 */
export interface SimulationGraph {
  nodes: { [nodeId: string]: SimulationNode };
  segments: { [segmentId: string]: SimulationSegment };
  // Adjacency list: nodeId -> array of connected segmentIds
  // This is useful for traversing the graph in the solver
  adjacency: { [nodeId: string]: string[] }; 
}

/**
 * Stores the results of a hydraulic simulation.
 */
export interface SimulationResults {
  /** Pressures at each node in Pascals. Key is SimulationNode.id. */
  nodePressures: { [nodeId: string]: number };
  /** Flow rates through each segment in m³/s. Key is SimulationSegment.id.
   *  Positive flow indicates flow from node1 to node2 of the segment.
   */
  segmentFlows: { [segmentId: string]: number };
  /**
   * Optional: Detailed flow information including direction if needed for visualization.
   * Key is SimulationSegment.id.
   */
  detailedFlows?: { 
    [segmentId: string]: { 
      flowRateM3s: number; 
      fromNodeId: string; 
      toNodeId: string; 
    } 
  };
  warnings?: string[]; // Any warnings generated during simulation
  errors?: string[];   // Any errors that occurred
}

// Type for the function that will run the simulation
export type SimulationFunction = (
  graph: SimulationGraph
) => Promise<SimulationResults>;


// Helper type for functions that build the graph from canvas items and connections
export type GraphBuilderFunction = (
  items: CanvasItemData[],
  connections: Connection[],
) => SimulationGraph; 