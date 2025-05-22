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
  defaultPortPressures?: { [portId: string]: number }; // Initial pressures in Pascals for pump ports
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
  portPressures?: { [portId: string]: number }; // Pressures in Pascals for each of its ports, if it's a pump

  // Needed by simulation engine to know how internal ports connect
  internalConnections?: string[][]; // Array of [portId1, portId2] pairs for internal paths

  // Original data from palette/product for reference or reset
  // This is a bit redundant if productId is present, but can be useful for quick access
  // to base properties without re-fetching product data.
  // Consider if this is truly needed or if productId is enough.
  // baseProductData?: MicrofluidicProductData; 
}


export interface TubingTypeDefinition {
  id: string; // e.g., "default_0.02_inch_ID_silicone"
  displayName: string; // e.g., "Silicone 0.02 inch ID"
  innerRadiusMeters: number;
  material?: string;
}

// Example: A small library of available tubing types
export const AVAILABLE_TUBING_TYPES: TubingTypeDefinition[] = [
  {
    id: "default_0.02_inch_ID_silicone",
    displayName: "Silicone Tubing (0.02\" ID)",
    innerRadiusMeters: DEFAULT_TUBE_INNER_RADIUS_M, // From constants
    material: "Silicone",
  },
  // Add more tubing types here later if needed
  // {
  //   id: "ptfe_0.01_inch_ID",
  //   displayName: "PTFE Tubing (0.01\" ID)",
  //   innerRadiusMeters: 0.000127, // 0.01 inches
  //   material: "PTFE",
  // },
];


// Represents a connection (tubing) between two ports on the canvas
export interface Connection {
  id: string; // Unique ID for the connection (e.g., conn-item1portA-item2portB)
  fromItemId: string;    // ID of the CanvasItemData
  fromPortId: string;    // ID of the Port on the fromItem
  toItemId: string;      // ID of the CanvasItemData
  toPortId: string;      // ID of the Port on the toItem
  pathData: string;      // SVG path data for drawing the tube
  
  tubingTypeId: string;  // Refers to TubingTypeDefinition.id
  lengthMeters: number;    // Physical length of the tubing
  resistance: number;    // Calculated resistance in Pa·s/m³
}


// PALETTE_ITEMS definition (initial example, to be refined or replaced by dynamic product loading)
// This is adapted from your existing types.ts, but should ideally be generated from MicrofluidicProductData objects.

export const PALETTE_ITEMS: PaletteItemData[] = [
  {
    id: 'straight-chip-product',
    name: 'Straight Channel',
    chipType: 'straight',
    konvaPreviewId: 'palette-straight-chip-konva',
    title: 'Straight Channel: Simple fluid path.',
    category: 'Microfluidic Chips',
    material: 'Glass',
    channelWidthMicrons: 100,
    channelDepthMicrons: 50,
    channelLengthMm: 20,
    baseResistancePasM3: 1.5e12,
    temperatureRange: { min: 0, max: 100, unit: '°C' },
    pressureRating: { maxPressure: 5, unit: 'bar' },
    chemicalResistance: ['Water', 'Ethanol'],
    isBiocompatible: true,
    isAutoclavable: true,
    defaultPorts: [
      { id: 'port_left', name: 'Left', x: 0, y: CHIP_HEIGHT / 2, type: 'universal', orientation: 'left', simulationRole: 'inlet' },
      { id: 'port_right', name: 'Right', x: CHIP_WIDTH, y: CHIP_HEIGHT / 2, type: 'universal', orientation: 'right', simulationRole: 'outlet' },
    ],
    defaultWidth: CHIP_WIDTH,
    defaultHeight: CHIP_HEIGHT,
  },
  {
    id: 'x-chip-product',
    name: 'X-Type Junction',
    chipType: 'x-type',
    konvaPreviewId: 'palette-x-chip-konva',
    title: 'X-Type Junction: 4-way intersection.',
    category: 'Microfluidic Chips',
    defaultPorts: [
      { id: 'port_left', name: 'Left', x: 0, y: CHIP_HEIGHT / 2, type: 'universal', orientation: 'left', simulationRole: 'inout' },
      { id: 'port_right', name: 'Right', x: CHIP_WIDTH, y: CHIP_HEIGHT / 2, type: 'universal', orientation: 'right', simulationRole: 'inout' },
      { id: 'port_top', name: 'Top', x: CHIP_WIDTH / 2, y: 0, type: 'universal', orientation: 'top', simulationRole: 'inout' },
      { id: 'port_bottom', name: 'Bottom', x: CHIP_WIDTH / 2, y: CHIP_HEIGHT, type: 'universal', orientation: 'bottom', simulationRole: 'inout' },
    ],
    defaultWidth: CHIP_WIDTH, 
    defaultHeight: CHIP_HEIGHT,
  },
  {
    id: 't-chip-product',
    name: 'T-Type Junction',
    chipType: 't-type',
    konvaPreviewId: 'palette-t-chip-konva',
    title: 'T-Type Junction: Split or merge streams.',
    category: 'Microfluidic Chips',
    defaultPorts: [
      { id: 'port_top', name: 'Top', x: CHIP_WIDTH / 2, y: 0, type: 'universal', orientation: 'top', simulationRole: 'inout' },
      { id: 'port_right', name: 'Right', x: CHIP_WIDTH, y: CHIP_HEIGHT / 2, type: 'universal', orientation: 'right', simulationRole: 'inout' },
      { id: 'port_bottom', name: 'Bottom', x: CHIP_WIDTH / 2, y: CHIP_HEIGHT, type: 'universal', orientation: 'bottom', simulationRole: 'inout' },
    ],
    defaultWidth: CHIP_WIDTH, 
    defaultHeight: CHIP_HEIGHT,
  },
  {
    id: 'meander-chip-product',
    name: 'Meander Structure',
    chipType: 'meander',
    konvaPreviewId: 'palette-meander-chip-konva',
    title: 'Meander Structure: Increases path length.',
    category: 'Microfluidic Chips',
    channelWidthMicrons: 100,
    channelDepthMicrons: 100,
    channelLengthMm: 1000,
    material: 'Glass',
    defaultPorts: [
      { id: 'port_left', name: 'Left', x: 0, y: CHIP_HEIGHT / 2, type: 'universal', orientation: 'left', simulationRole: 'inlet' }, 
      { id: 'port_right', name: 'Right', x: CHIP_WIDTH, y: CHIP_HEIGHT / 2, type: 'universal', orientation: 'right', simulationRole: 'outlet' }, 
    ],
    defaultWidth: CHIP_WIDTH, 
    defaultHeight: CHIP_HEIGHT,
  },
  {
    id: 'pump-product',
    name: 'Pump',
    chipType: 'pump',
    konvaPreviewId: 'palette-pump-konva',
    title: 'Fluid Pump: Provides pressure source.',
    category: 'Other',
    defaultPortPressures: { 'out1': 10000, 'out2': 10000, 'out3': 0, 'out4': 0 },
    defaultPorts: [
      { id: 'out1', name: 'Port 1', x: PUMP_CANVAS_WIDTH, y: PUMP_CANVAS_HEIGHT * 1/5 , type: 'universal', orientation: 'right', simulationRole: 'outlet' },
      { id: 'out2', name: 'Port 2', x: PUMP_CANVAS_WIDTH, y: PUMP_CANVAS_HEIGHT * 2/5, type: 'universal', orientation: 'right', simulationRole: 'outlet' },
      { id: 'out3', name: 'Port 3', x: PUMP_CANVAS_WIDTH, y: PUMP_CANVAS_HEIGHT * 3/5, type: 'universal', orientation: 'right', simulationRole: 'outlet' },
      { id: 'out4', name: 'Port 4', x: PUMP_CANVAS_WIDTH, y: PUMP_CANVAS_HEIGHT * 4/5, type: 'universal', orientation: 'right', simulationRole: 'outlet' },
    ],
    defaultWidth: PUMP_CANVAS_WIDTH, 
    defaultHeight: PUMP_CANVAS_HEIGHT,
  },
  {
    id: 'outlet-product',
    name: 'Outlet',
    chipType: 'outlet',
    konvaPreviewId: 'palette-outlet-konva',
    title: 'Flow Outlet: Exit at atmospheric pressure.',
    category: 'Other',
    defaultPorts: [
      { id: 'in1', name: 'Inlet', x: CHIP_WIDTH / 2, y: 18, type: 'universal', orientation: 'top', simulationRole: 'inlet' },
    ],
    defaultWidth: CHIP_WIDTH, 
    defaultHeight: CHIP_HEIGHT,
  },
];

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