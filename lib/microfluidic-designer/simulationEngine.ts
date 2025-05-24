console.log('<<<<<< EXECUTING TYPESCRIPT SIMULATION ENGINE - V1 >>>>>>');
import * as math from 'mathjs'; // Use mathjs for matrix operations
import { CanvasItemData, Connection } from './types'; // Assuming types are defined here

// import type { Group } from 'konva/lib/Group'; // Not used
import type { 
    SimulationNode,
    SimulationSegment,
    SimulationGraph,
    SimulationResults,
    TubingTypeDefinition
    // AVAILABLE_TUBING_TYPES removed from type-only import
} from './types';
import { AVAILABLE_TUBING_TYPES } from './types'; // Separate value import
import { 
    FLUID_VISCOSITY_PAS, 
    // DEFAULT_TUBE_INNER_RADIUS_M, // We'll get this from TubingTypeDefinition
    // AVAILABLE_TUBING_TYPES, // No longer from here
    POISEUILLE_CONSTANT_DEFAULT,
    MBAR_TO_PASCAL, 
    M3S_TO_ULMIN,
    PASCAL_TO_MBAR 
} from './constants';

// Use imported constants
const MICRO_LITERS_PER_MINUTE_FACTOR = M3S_TO_ULMIN;
const RESISTANCE_SCALE_FACTOR = 1e-12; // Factor to scale resistance for numerical stability
console.log(`Using Resistance Scale Factor: ${RESISTANCE_SCALE_FACTOR}`);
console.log(`This scales conductances UP by: ${(1/RESISTANCE_SCALE_FACTOR).toExponential(3)}`);

// --- Global-like state / dependencies ---
// This might be better managed by the calling component or a state manager
let currentSimulationResults: SimulationResults = {
  nodePressures: {},
  segmentFlows: {},
  warnings: [],
  errors: [],
};

// --- Utility Functions ---

/**
 * Generates a unique ID for an internal node within a chip, typically a junction point.
 * @param chipId The ID of the canvas item (chip).
 * @returns A string identifier for the internal node.
 */
export function getInternalNodeId(chipId: string): string {
  return `${chipId}_internal_junction`;
}

/**
 * Generates a unique ID for a segment (connection or internal path) between two nodes.
 * The order of node IDs does not matter.
 * @param nodeId1 The ID of the first node.
 * @param nodeId2 The ID of the second node.
 * @returns A string identifier for the segment.
 */
export function getSegmentId(node1Id: string, node2Id: string): string {
    // Always order node IDs alphabetically to ensure consistency
    const [first, second] = [node1Id, node2Id].sort();
    return `${first}--${second}`;
}

/**
 * Calculates the hydraulic resistance of a piece of tubing.
 * @param lengthInMeters Physical length of the tubing.
 * @param poiseuilleConstantToUse The Poiseuille constant for the tubing (8 * viscosity / (PI * radius^4)).
 * @returns The hydraulic resistance in Pa·s/m³.
 */
export function calculateTubingResistance(lengthInMeters: number, poiseuilleConstantToUse: number): number {
  if (lengthInMeters <= 0) return 0; // Or throw error for invalid length
  return poiseuilleConstantToUse * lengthInMeters;
}


// === SECTION: Simulation Engine Core ===

/**
 * Builds the hydraulic network graph from canvas items and connections.
 * This graph is then used by the solver.
 * @param canvasItems Array of items on the canvas.
 * @param canvasConnections Array of connections (tubing) on the canvas.
 * @returns A SimulationGraph object.
 */
function buildNetworkGraph(
    canvasItems: CanvasItemData[], 
    canvasConnections: Connection[],
): SimulationGraph {
  const graph: SimulationGraph = {
    nodes: {},
    segments: {},
    adjacency: {},
  };

  const addNode = (node: SimulationNode) => {
    if (!graph.nodes[node.id]) {
      graph.nodes[node.id] = node;
      graph.adjacency[node.id] = graph.adjacency[node.id] || [];
    } else {
      // Potentially update existing node if new info is more specific (e.g., type)
      // For now, we assume first add is complete enough or specific enough
      // Merge properties if necessary, e.g. if a port is defined generically then later identified as part of a pump
      if (node.type !== 'port' && graph.nodes[node.id].type === 'port') {
        graph.nodes[node.id].type = node.type;
      }
      if (node.pressure !== undefined) graph.nodes[node.id].pressure = node.pressure;
      if (node.isGround !== undefined) graph.nodes[node.id].isGround = node.isGround;
      if (node.canvasItemId) graph.nodes[node.id].canvasItemId = node.canvasItemId;
    }
  };
  
  const addSegmentToGraph = (node1Id: string, node2Id: string, resistance: number, type: SimulationSegment['type'], canvasConnectionId?: string, canvasItemId?: string) => {
    const segmentId = getSegmentId(node1Id, node2Id);
    if (resistance === undefined || !isFinite(resistance) || resistance < 0) { 
      console.warn(`[GraphBuild] Skipping segment ${segmentId} due to invalid or negative resistance: ${resistance}`);
      // Ensure nodes exist in adjacency list even if segment is skipped
      graph.adjacency[node1Id] = graph.adjacency[node1Id] || [];
      graph.adjacency[node2Id] = graph.adjacency[node2Id] || [];
      // Do not add to adjacency list if segment is invalid
      return;
    }
    if (resistance === 0) {
        // A zero resistance segment is a short circuit.
        // Depending on the solver, this might be problematic or handled.
        // For now, we allow it but log a warning.
        console.warn(`[GraphBuild] Segment ${segmentId} has zero resistance. This may lead to an unstable simulation if not handled carefully by the solver (e.g., by merging nodes).`);
    }

    // Scale the resistance
    const scaledResistance = resistance * RESISTANCE_SCALE_FACTOR;
    // console.log(`[GraphBuild] Segment ${segmentId} - Original R: ${resistance.toExponential(3)} Pa·s/m³, Scaled R: ${scaledResistance.toExponential(3)}`);

    graph.segments[segmentId] = { 
        id: segmentId, 
        node1Id, 
        node2Id, 
        resistance: scaledResistance, // Store scaled resistance
        type,
        canvasConnectionId,
        canvasItemId
    };
    
    graph.adjacency[node1Id] = graph.adjacency[node1Id] || [];
    graph.adjacency[node2Id] = graph.adjacency[node2Id] || [];
    if (!graph.adjacency[node1Id].includes(segmentId)) graph.adjacency[node1Id].push(segmentId);
    if (!graph.adjacency[node2Id].includes(segmentId)) graph.adjacency[node2Id].push(segmentId);
  };

  // 1. Create nodes from canvas items' ports
  canvasItems.forEach(item => {
    const canvasItemId = item.id;
    // Get fluid viscosity for this component, fallback to default from item definition or global
    const fluidViscosity = item.material === 'PDMS' ? 0.004 : FLUID_VISCOSITY_PAS; // Example, refine this logic
    // For simulation engine, we prefer direct attributes from CanvasItemData if available
    // const fluidViscosity = item.currentFluidViscosity || FLUID_VISCOSITY_PAS;

    item.ports.forEach(port => {
      // Generate the unique node ID for this port
      // First, extract the base port ID (without item prefixes)
      let basePortId = port.id;
      
      // If port ID already includes the canvas item ID, extract the base part
      if (basePortId.startsWith(`${canvasItemId}_`)) {
        basePortId = basePortId.substring(canvasItemId.length + 1);
        console.log(`[GraphBuild] Extracted base port ID ${basePortId} from full port ID ${port.id}`);
      }
      
      // Standardize the node ID format to be consistent throughout the simulation
      const portNodeId = `${canvasItemId}_${basePortId}`;
      
      console.log(`[GraphBuild] Creating node with ID: ${portNodeId} for canvas item ${canvasItemId} port ${port.id}`);
      
      let nodeType: SimulationNode['type'] = 'port';
      let pressure: number | undefined = undefined;
      let isGround = false;

      if (item.chipType === 'pump') {
        nodeType = 'pump';
        // Extract the original port ID from the unique port ID
        const uniquePortId = port.id; // e.g., item.id + '_' + original_port_id
        let originalPortId = uniquePortId;
        
        // Improved port ID extraction
        if (uniquePortId.includes('_')) {
          // Either extract after the first underscore or after the item ID prefix
          if (uniquePortId.startsWith(item.id + '_')) {
            originalPortId = uniquePortId.substring(item.id.length + 1);
          } else {
            originalPortId = uniquePortId.split('_').pop() || uniquePortId;
          }
        }
        
        // Handle different pump types
        if (item.pumpType === 'syringe') {
          // Syringe pumps specify flow rate, NOT pressure
          // Their pressure will be solved for based on the flow constraint
          console.log(`[GraphBuild] Syringe pump port: ${uniquePortId}, Original port ID: ${originalPortId}, Available port flow rates:`, item.portFlowRates);
          
          const flowRateUlMin = item.portFlowRates?.[originalPortId];
          if (flowRateUlMin !== undefined) {
            // Store the flow rate in the node for later use
            // Don't assign a pressure - it will be solved for
            console.log(`[GraphBuild] Syringe pump ${originalPortId}: ${flowRateUlMin} µL/min`);
          } else {
            console.warn(`[GraphBuild] No flow rate defined for syringe pump port ${originalPortId} on ${item.id}.`);
          }
          // DON'T set pressure for syringe pumps
          pressure = undefined;
        } else {
          // Pressure pumps specify pressure (existing behavior)
          console.log(`[GraphBuild] Pressure pump port: ${uniquePortId}, Original port ID: ${originalPortId}, Available port pressures:`, item.portPressures);
          pressure = item.portPressures?.[originalPortId]; 
          
          // Add backup value if not found (important for simulations)
          if (pressure === undefined) {
            console.warn(`[GraphBuild] No pressure defined for pressure pump port ${originalPortId} on ${item.id}. Using default 200 mbar.`);
            pressure = 200 * MBAR_TO_PASCAL; // Default to 200 mbar if not specified
          }
        }
      } else if (item.chipType === 'outlet') {
        nodeType = 'outlet';
        pressure = 0; // Atmospheric pressure
        isGround = true;
      }
      
      addNode({
        id: portNodeId,
        type: nodeType,
        pumpType: item.chipType === 'pump' ? item.pumpType : undefined,
        canvasItemId: canvasItemId,
        portId: port.id,
        pressure: pressure,
        isGround: isGround,
      });
    });

    // 2. Create internal nodes and segments for complex chips (T-junction, X-junction, etc.)
    // Using item properties directly instead of group.getAttr()

    const chipFluidViscosity = item.material === 'PDMS' ? 0.004 : FLUID_VISCOSITY_PAS; // Example, or item.currentFluidViscosity

    if (item.chipType === 'straight' || item.chipType === 'meander') {
        const lengthM = item.currentChannelLengthMm * 1e-3; // mm to m
        const widthM = item.currentChannelWidthMicrons * 1e-6;  // µm to m
        const heightM = item.currentChannelDepthMicrons * 1e-6; // µm to m

        if (!isNaN(lengthM) && !isNaN(widthM) && !isNaN(heightM) && lengthM > 0 && widthM > 0 && heightM > 0) {
            const calculatedResistance = calculateRectangularChannelResistance(lengthM, widthM, heightM, chipFluidViscosity);
            if (item.ports.length === 2) {
                // item.ports[x].id is already the unique node ID for the port (e.g., canvasItemId_portBaseId)
                const portNode1Id = item.ports[0].id;
                const portNode2Id = item.ports[1].id;
                
                // Create a unique segment ID using getSegmentId to ensure consistency
                const internalSegmentId = getSegmentId(portNode1Id, portNode2Id);
                
                console.log(`[GraphBuild] Adding internal segment for ${canvasItemId} (${item.chipType}): ${portNode1Id} <-> ${portNode2Id} (L:${lengthM.toExponential(2)}m, W:${widthM.toExponential(2)}m, H:${heightM.toExponential(2)}m, Parametric R=${calculatedResistance.toExponential(3)})`);
                
                // Add the segment using addSegmentToGraph to ensure proper adjacency list updates
                addSegmentToGraph(
                    portNode1Id,
                    portNode2Id,
                    calculatedResistance,
                    'internal_chip_path',
                    undefined,
                    canvasItemId
                );
            } else {
                console.warn(`[GraphBuild] Straight/Meander chip ${canvasItemId} does not have 2 ports as expected for internal connection.`);
            }
        } else {
            console.error(`[GraphBuild] Missing or invalid dimensions for ${item.chipType} chip ${canvasItemId} (L:${lengthM},W:${widthM},H:${heightM}). Cannot calculate resistance. Skipping internal segment.`);
        }
    } else if ((item.chipType === 't-type' || item.chipType === 'x-type')) {
        const centralJunctionNodeId = getInternalNodeId(canvasItemId);
        console.log(`[GraphBuild] Creating central junction node: ${centralJunctionNodeId} for ${item.chipType} chip ${canvasItemId}`);
        addNode({
            id: centralJunctionNodeId,
            type: 'junction',
            canvasItemId: canvasItemId,
        });

        // Get segment dimensions, falling back to channel dimensions if junction-specific not provided
        const segLengthM = (item.currentJunctionSegmentLengthMm ?? item.currentChannelLengthMm / 2) * 1e-3; // Default to half total length
        const segWidthM = (item.currentJunctionWidthMicrons ?? item.currentChannelWidthMicrons) * 1e-6;
        const segHeightM = (item.currentJunctionDepthMicrons ?? item.currentChannelDepthMicrons) * 1e-6;
        
        // Validate dimensions and calculate resistance
        let segmentResistance: number;
        if (!isNaN(segLengthM) && !isNaN(segWidthM) && !isNaN(segHeightM) && 
            segLengthM > 0 && segWidthM > 0 && segHeightM > 0) {
            
            segmentResistance = calculateRectangularChannelResistance(
                segLengthM,
                segWidthM,
                segHeightM,
                chipFluidViscosity
            );
            
            console.log(`[GraphBuild] T/X Junction ${canvasItemId} segment dimensions:`, {
                length: `${(segLengthM * 1000).toFixed(2)}mm`,
                width: `${(segWidthM * 1e6).toFixed(1)}µm`,
                height: `${(segHeightM * 1e6).toFixed(1)}µm`,
                resistance: segmentResistance.toExponential(3)
            });
            
        } else {
            // If dimensions are invalid, use a high default resistance
            // This is better than Infinity as it allows some flow but heavily restricts it
            segmentResistance = 1e12; // Same as reference implementation default
            console.warn(`[GraphBuild] Invalid dimensions for ${item.chipType} chip ${canvasItemId}. Using default high resistance:`, {
                length: segLengthM,
                width: segWidthM,
                height: segHeightM,
                defaultResistance: segmentResistance
            });
        }

        // Connect each port to the central junction with the calculated resistance
        item.ports.forEach(port => {
            // port.id is already the unique node ID (e.g., canvasItemId_portBaseId)
            const portNodeId = port.id; 
            if (!graph.nodes[portNodeId]) {
                console.warn(`[GraphBuild] Port node ${portNodeId} not found for T/X junction segment connection. This suggests an issue with node ID consistency for item ${canvasItemId}.`);
                console.warn(`[GraphBuild] Expected port.id format: ${canvasItemId}_[basePortId]`);
                console.warn(`[GraphBuild] Item ports available:`, item.ports.map(p => p.id));
                console.warn(`[GraphBuild] Graph nodes available for this item:`, Object.keys(graph.nodes).filter(n => n.startsWith(canvasItemId)));
                return;
            }
            
            console.log(`[GraphBuild] Adding internal segment for ${canvasItemId} (${item.chipType}): ${portNodeId} <-> ${centralJunctionNodeId} (R=${segmentResistance.toExponential(3)})`);
            addSegmentToGraph(
                portNodeId,
                centralJunctionNodeId,
                segmentResistance,
                'internal_chip_path',
                undefined,
                canvasItemId
            );
        });
    } else if (item.internalConnections) {
         console.warn(`[GraphBuild] Generic internal connection logic for chipType '${item.chipType}' not yet fully implemented. Relies on direct port-to-port or simple junction models for now.`);
    }
  });
  
  // 3. Create segments from canvas connections (tubing)
  canvasConnections.forEach(conn => {
    // Consistently generate node IDs for connection endpoints
    // Ensure basePortId extraction is robust
    let fromBasePortId = conn.fromPortId;
    if (conn.fromPortId.startsWith(`${conn.fromItemId}_`)) {
      fromBasePortId = conn.fromPortId.substring(conn.fromItemId.length + 1);
    }

    let toBasePortId = conn.toPortId;
    if (conn.toPortId.startsWith(`${conn.toItemId}_`)) {
      toBasePortId = conn.toPortId.substring(conn.toItemId.length + 1);
    }

    const fromNodeId = `${conn.fromItemId}_${fromBasePortId}`;
    const toNodeId = `${conn.toItemId}_${toBasePortId}`;

    console.log(`[GraphBuild] Attempting to connect: ${fromNodeId} (from item ${conn.fromItemId}, port ${conn.fromPortId}) to ${toNodeId} (from item ${conn.toItemId}, port ${conn.toPortId}) via connection ${conn.id}`);

    if (!graph.nodes[fromNodeId]) {
      console.warn(`[GraphBuild] Source node ${fromNodeId} for connection ${conn.id} NOT FOUND in graph.nodes.`);
      // Log available nodes that might be related to fromItemId for debugging
      Object.keys(graph.nodes).forEach(node_id => {
        if (node_id.startsWith(conn.fromItemId)) {
          console.warn(`  [GraphBuild] Possible match for source? Graph node: ${node_id}`);
        }
      });
    }
    if (!graph.nodes[toNodeId]) {
      console.warn(`[GraphBuild] Target node ${toNodeId} for connection ${conn.id} NOT FOUND in graph.nodes.`);
      Object.keys(graph.nodes).forEach(node_id => {
        if (node_id.startsWith(conn.toItemId)) {
          console.warn(`  [GraphBuild] Possible match for target? Graph node: ${node_id}`);
        }
      });
    }

    if (graph.nodes[fromNodeId] && graph.nodes[toNodeId]) {
        const tubeLengthM = conn.lengthMeters; // Already in meters from Connection type
        
        // Find the tubing definition to get the radius
        const tubingDef = AVAILABLE_TUBING_TYPES.find(t => t.id === conn.tubingTypeId);
        if (!tubingDef) {
            console.error(`[GraphBuild] Tubing type definition not found for ID: ${conn.tubingTypeId} on connection ${conn.id}. Skipping tube segment.`);
            return; // Skip this connection
        }
        const tubeRadiusM = tubingDef.innerRadiusMeters;
        const tubeViscosity = FLUID_VISCOSITY_PAS; // Assuming global viscosity for all tubes, or get from tubingDef.material if defined

        if (!isNaN(tubeLengthM) && !isNaN(tubeRadiusM) && tubeLengthM > 0 && tubeRadiusM > 0) {
            // Directly use calculateCircularTubeResistance (assuming it's defined in this file or imported)
            const calculatedResistance = calculateCircularTubeResistance(tubeLengthM, tubeRadiusM, tubeViscosity);
            console.log(`[GraphBuild] Adding external tube segment ${conn.id}: ${fromNodeId} <-> ${toNodeId} (L:${tubeLengthM.toExponential(2)}m, R:${tubeRadiusM.toExponential(2)}m, Parametric R=${calculatedResistance.toExponential(3)})`);
            addSegmentToGraph(fromNodeId, toNodeId, calculatedResistance, 'tubing', conn.id);
        } else {
            console.error(`[GraphBuild] Missing or invalid dimensions for tube ${conn.id} (L:${tubeLengthM}, R:${tubeRadiusM}). Skipping tube segment.`);
        }
    } else {
      console.warn(`[GraphBuild] SKIPPING connection ${conn.id} - one or both nodes missing after standardization. From=${fromNodeId}(${!!graph.nodes[fromNodeId]}), To=${toNodeId}(${!!graph.nodes[toNodeId]})`);
      // Fallback: Try the alternative finding logic IF the primary above fails
      // This should ideally not be needed if ID generation is consistent.
      const fromNodeIdAlt = Object.keys(graph.nodes).find(id => 
        id.includes(conn.fromItemId) && 
        (id.endsWith(fromBasePortId) || id.endsWith(`_${fromBasePortId}`))
      );
      const toNodeIdAlt = Object.keys(graph.nodes).find(id => 
        id.includes(conn.toItemId) && 
        (id.endsWith(toBasePortId) || id.endsWith(`_${toBasePortId}`))
      );

      if (fromNodeIdAlt && toNodeIdAlt && (fromNodeIdAlt !== fromNodeId || toNodeIdAlt !== toNodeId )) { // only if different from standardized
        console.warn(`[GraphBuild] Fallback: Found alternate node IDs for connection ${conn.id}: ${fromNodeIdAlt} and ${toNodeIdAlt}. USING THESE.`);
        addSegmentToGraph(fromNodeIdAlt, toNodeIdAlt, conn.resistance, 'tubing', conn.id);
      } else {
         console.warn(`[GraphBuild] Fallback also failed for connection ${conn.id}.`);
      }
    }
  });

  console.log("Network graph built (from CanvasItemData):", JSON.parse(JSON.stringify(graph)));
  return graph;
}

// --- NEW: Resistance Calculation Functions (moved from global or to be imported if separate) ---
// Ensure these functions are defined within this file or correctly imported.
// For brevity, I am assuming they are now part of this file or will be moved here.

/**
 * Calculates the hydrodynamic resistance of a rectangular microchannel.
 * @param {number} length Channel length in meters.
 * @param {number} width Channel width in meters.
 * @param {number} height Channel height in meters.
 * @param {number} viscosity Fluid viscosity in Pascal-seconds (Pa·s).
 * @returns {number} Hydrodynamic resistance in Pa·s/m³.
 */
function calculateRectangularChannelResistance(length: number, width: number, height: number, viscosity: number): number {
    if (width <= 0 || height <= 0 || length <= 0 || viscosity <=0) {
        // console.warn(`[ResistanceCalc] Invalid dimensions/viscosity for rectangular channel: L=${length}, W=${width}, H=${height}, V=${viscosity}. Returning Infinity.`);
        return Infinity;
    }
    const w_eff = Math.max(width, height);
    const h_eff = Math.min(width, height);
    const ar_eff = h_eff / w_eff;
    let factor_eff = 12; // default for alpha -> 0 (very wide plates)
    if (ar_eff <= 1 && ar_eff > 0) { // Polynomial fit for aspect ratio 0 < alpha <= 1
        factor_eff = 24 * (1 - 1.3553 * ar_eff + 1.9467 * Math.pow(ar_eff, 2) - 1.7012 * Math.pow(ar_eff, 3) + 0.9564 * Math.pow(ar_eff, 4) - 0.2537 * Math.pow(ar_eff, 5));
        factor_eff = Math.max(12, factor_eff); // Ensure it doesn't go below theoretical limit
    } else if (ar_eff === 0) {
        factor_eff = 12;
    } // else (ar_eff > 1) should not happen due to h_eff/w_eff, but if it did, factor_eff remains 12 (less accurate)
    return (factor_eff * viscosity * length) / (w_eff * Math.pow(h_eff, 3));
}

/**
 * Calculates the hydrodynamic resistance of a circular tube (Poiseuille's Law).
 * @param {number} length Tube length in meters.
 * @param {number} radius Tube radius in meters.
 * @param {number} viscosity Fluid viscosity in Pascal-seconds (Pa·s).
 * @returns {number} Hydrodynamic resistance in Pa·s/m³.
 */
function calculateCircularTubeResistance(length: number, radius: number, viscosity: number): number {
    if (radius <= 0 || length <= 0 || viscosity <= 0) {
        // console.warn(`[ResistanceCalc] Invalid dimensions/viscosity for circular tube: L=${length}, R=${radius}, V=${viscosity}. Returning Infinity.`);
        return Infinity;
    }
    return (8 * viscosity * length) / (Math.PI * Math.pow(radius, 4));
}

/**
 * Solves for unknown node pressures in the hydraulic network graph.
 * Uses Modified Nodal Analysis (MNA) to handle both pressure sources and flow sources.
 * @param graph The SimulationGraph.
 * @param showNotification Callback to display notifications to the user.
 * @param syringePumpFlows Map of syringe pump node IDs to their target flow rates in m³/s
 * @returns A map of node IDs to their calculated pressures (in Pascals), or null if solving fails.
 */
function solvePressures(
    graph: SimulationGraph, 
    showNotification: (message: string, type: 'error' | 'warning' | 'info') => void,
    syringePumpFlows?: Map<string, number>
): { [nodeId: string]: number } | null {
    const nodeIds = Object.keys(graph.nodes);
    
    // Separate nodes into categories
    const pressurePumpNodes = nodeIds.filter(id => 
        graph.nodes[id].type === 'pump' && 
        graph.nodes[id].pumpType === 'pressure' && 
        graph.nodes[id].pressure !== undefined
    );
    
    const syringePumpNodes = nodeIds.filter(id => 
        graph.nodes[id].type === 'pump' && 
        graph.nodes[id].pumpType === 'syringe'
    );
    
    const groundNodes = nodeIds.filter(id => 
        graph.nodes[id].isGround || graph.nodes[id].type === 'outlet'
    );
    
    // All other nodes have unknown pressures
    const unknownPressureNodeIds = nodeIds.filter(id => 
        !pressurePumpNodes.includes(id) && 
        !groundNodes.includes(id)
    );

    console.log(`[Solve] Node classification:`, {
        pressurePumps: pressurePumpNodes.length,
        syringePumps: syringePumpNodes.length,
        ground: groundNodes.length,
        unknown: unknownPressureNodeIds.length
    });

    if (unknownPressureNodeIds.length === 0) {
        // All node pressures are already known
        const allPressures: { [nodeId: string]: number } = {};
        nodeIds.forEach(id => {
            allPressures[id] = graph.nodes[id].pressure !== undefined ? graph.nodes[id].pressure! : 0;
        });
        return allPressures;
    }

    if (Object.keys(graph.segments).length === 0 && unknownPressureNodeIds.length > 0) {
        console.warn("[Solve] Cannot solve: No segments defined, but unknown node pressures exist.");
        showNotification("Cannot simulate: System is not connected or under-constrained.", 'error');
        return null;
    }
    
    const n = unknownPressureNodeIds.length;
    const unknownNodeIndexMap = new Map(unknownPressureNodeIds.map((id, i) => [id, i]));

    const A_data: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));
    const B_data: number[] = Array(n).fill(0);

    // Build the conductance matrix and source vector
    unknownPressureNodeIds.forEach((nodeId_i, i) => {
        let diagonalSumConductance = 0;
        
        const connectedSegmentIds = graph.adjacency[nodeId_i] || [];
        if (connectedSegmentIds.length === 0) {
            console.warn(`[Solve] Node ${nodeId_i} has unknown pressure and is not connected to any segments.`);
            A_data[i][i] = 1; 
            B_data[i] = 0;
            return;
        }

        // Add contributions from connected segments
        connectedSegmentIds.forEach(segmentId => {
            const segment = graph.segments[segmentId];
            if (!segment || segment.resistance <= 0) {
                if (segment && segment.resistance === 0) {
                    console.warn(`[Solve] Segment ${segmentId} has zero resistance.`);
                }
                return;
            }
            
            const conductance = 1.0 / segment.resistance;
            diagonalSumConductance += conductance;

            const otherNodeId = segment.node1Id === nodeId_i ? segment.node2Id : segment.node1Id;
            const otherNode = graph.nodes[otherNodeId];

            if (pressurePumpNodes.includes(otherNodeId)) {
                // Connected to a pressure source
                B_data[i] += conductance * otherNode.pressure!;
            } else if (groundNodes.includes(otherNodeId)) {
                // Connected to ground (pressure = 0)
                B_data[i] += 0; // No contribution
            } else {
                // Connected to another unknown node
                const j = unknownNodeIndexMap.get(otherNodeId);
                if (j !== undefined) {
                    A_data[i][j] -= conductance;
                }
            }
        });
        
        A_data[i][i] = diagonalSumConductance;
        
        // Add current source contribution for syringe pumps
        if (syringePumpNodes.includes(nodeId_i) && syringePumpFlows) {
            const flowRate = syringePumpFlows.get(nodeId_i);
            if (flowRate !== undefined) {
                // Scale the flow rate to match the scaled conductance matrix
                // Since conductances are scaled up by 1/RESISTANCE_SCALE_FACTOR,
                // we need to scale currents up by the same factor
                const scaledFlowRate = flowRate / RESISTANCE_SCALE_FACTOR;
                B_data[i] += scaledFlowRate;
                console.log(`[Solve] Syringe pump at node ${nodeId_i}: injecting ${(flowRate * M3S_TO_ULMIN).toFixed(2)} µL/min (scaled: ${scaledFlowRate.toExponential(3)})`);
            }
        }
        
        // Check for singular rows
        if (diagonalSumConductance === 0 && B_data[i] === 0) {
            console.warn(`[Solve] Equation for node ${nodeId_i} results in 0 = 0.`);
            A_data[i][i] = 1;
        }
    });
  
    const A = math.matrix(A_data);
    const B = math.matrix(B_data);

    // Log matrix details for debugging
    console.log(`[Solve] Matrix dimensions: ${n}x${n}`);
    console.log(`[Solve] Condition number estimate:`, math.norm(A, 2));
    
    // Log some sample values to check scaling
    if (n > 0) {
        console.log(`[Solve] Sample diagonal conductance (A[0][0]): ${A_data[0][0].toExponential(3)}`);
        console.log(`[Solve] Sample B vector value (B[0]): ${B_data[0].toExponential(3)}`);
    }

    let solvedPressuresVector: math.Matrix;
    try {
        solvedPressuresVector = math.lusolve(A, B) as math.Matrix;
    } catch (error: any) {
        console.error("[Solve] Error during matrix solution: ", error);
        
        // Try to diagnose the issue
        const det = math.det(A);
        console.error(`[Solve] Matrix determinant: ${det}`);
        
        const errorMessage = error.message && error.message.toLowerCase().includes("singular") 
            ? "Simulation failed: Network is unstable or under-constrained (singular matrix). Check connections and ensure at least one pressure reference (outlet or pressure pump) exists."
            : "Simulation error during pressure calculation.";
        showNotification(errorMessage, 'error');
        return null;
    }

    // Assemble the complete pressure solution
    const allNodePressures: { [nodeId: string]: number } = {};
    
    // Known pressures
    pressurePumpNodes.forEach(id => {
        allNodePressures[id] = graph.nodes[id].pressure!;
    });
    
    groundNodes.forEach(id => {
        allNodePressures[id] = 0;
    });
    
    // Solved pressures
    unknownPressureNodeIds.forEach((nodeId, i) => {
        let pressureValueRaw = solvedPressuresVector.get([i, 0]);
        let pressureValue: number;

        if (typeof pressureValueRaw === 'object' && pressureValueRaw !== null && 're' in pressureValueRaw && 'im' in pressureValueRaw) {
            const complexVal = pressureValueRaw as math.Complex;
            if (math.abs(complexVal.im) > 1e-9) {
                console.warn(`[Solve] Node ${nodeId} pressure is complex: ${complexVal.toString()}. Using real part.`);
            }
            pressureValue = complexVal.re;
        } else {
            pressureValue = pressureValueRaw as number;
        }

        if (!isFinite(pressureValue)) {
            console.error(`[Solve] Node ${nodeId} pressure solution is not finite: ${pressureValue}.`);
            showNotification(`Warning: Unstable pressure calculated for ${graph.nodes[nodeId].canvasItemId || nodeId}.`, 'warning');
            pressureValue = NaN;
        }
        
        allNodePressures[nodeId] = pressureValue;
    });
    
    // Log results for syringe pumps
    syringePumpNodes.forEach(id => {
        const pressure = allNodePressures[id];
        console.log(`[Solve] Syringe pump ${id} solved pressure: ${(pressure/100).toFixed(1)} mbar`);
    });
    
    return allNodePressures;
}

/**
 * Calculates flow rates through each segment based on solved node pressures.
 * @param graph The SimulationGraph.
 * @param solvedNodePressures A map of node IDs to their pressures (in Pascals).
 * @returns A map of segment IDs to their flow rates (in m³/s). Positive flow from node1 to node2.
 */
function calculateFlows(
    graph: SimulationGraph, 
    solvedNodePressures: { [nodeId: string]: number } | null
): { [segmentId: string]: number } {
    const segmentFlows: { [segmentId: string]: number } = {};
    if (!solvedNodePressures) {
        console.error("[FlowCalc] Cannot calculate flows: solvedNodePressures object is null.");
        // Populate with NaN for all segments if pressures are missing
        for (const segmentId in graph.segments) {
            segmentFlows[segmentId] = NaN;
        }
        return segmentFlows;
    }

    for (const segmentId in graph.segments) {
        const segment = graph.segments[segmentId];
        const { node1Id, node2Id, resistance } = segment;
        
        const p1 = solvedNodePressures[node1Id];
        const p2 = solvedNodePressures[node2Id];

        if (p1 === undefined || p2 === undefined || !isFinite(p1) || !isFinite(p2)) {
            console.warn(`[FlowCalc] Missing or non-finite pressure for segment ${segmentId} (P1: ${p1}, P2: ${p2}). Flow will be NaN.`);
            segmentFlows[segmentId] = NaN;
            continue;
        }
        
        if (resistance < 0) {
             console.warn(`[FlowCalc] Negative resistance (${resistance}) for segment ${segmentId}. Flow will be NaN.`);
             segmentFlows[segmentId] = NaN;
             continue;
        }
        if (resistance === 0) {
            // Flow is theoretically infinite if p1 !== p2, or indeterminate if p1 === p2.
            // This indicates a short circuit and should have been handled by merging nodes or specific solver.
            // For now, if pressures are different, flow is problematic (effectively infinite). If same, flow is zero.
            if (p1 !== p2) {
                console.warn(`[FlowCalc] Zero resistance for segment ${segmentId} with pressure difference (${p1 - p2} Pa). Flow is theoretically infinite. Setting to NaN.`);
                segmentFlows[segmentId] = NaN; 
            } else {
                // If P1=P2 and R=0, flow is technically 0/0, which is indeterminate.
                // However, in a practical sense, if there's no pressure difference, there's no driving force for flow.
                // Consider this zero flow for now.
                segmentFlows[segmentId] = 0;
            }
            continue;
        }
        
        // Calculate flow using SCALED resistance (already stored in segment.resistance)
        const flowRateM3s_scaled = (p1 - p2) / resistance;
        
        // Unscale the flow rate - CORRECTED LOGIC
        const flowRateM3s_unscaled = flowRateM3s_scaled * RESISTANCE_SCALE_FACTOR; // Multiply, not divide
        
        // Check for non-finite results after unscaling
        if (!isFinite(flowRateM3s_unscaled)) {
            console.warn(`[FlowCalc] Non-finite flow for segment ${segmentId} after unscaling (Scaled: ${flowRateM3s_scaled.toExponential(3)}, Unscaled: ${flowRateM3s_unscaled}). Setting to NaN.`);
            segmentFlows[segmentId] = NaN;
        } else {
            // console.log(`[FlowCalc] Segment ${segmentId} - Pressure diff: ${(p1-p2).toExponential(3)} Pa, Scaled R: ${resistance.toExponential(3)}, Scaled Flow: ${flowRateM3s_scaled.toExponential(3)}, Unscaled Flow: ${flowRateM3s_unscaled.toExponential(3)} m³/s = ${(flowRateM3s_unscaled * M3S_TO_ULMIN).toFixed(2)} µL/min`);
            segmentFlows[segmentId] = flowRateM3s_unscaled; // Store the unscaled flow rate
        }
    }
    return segmentFlows;
}

// Removed estimatePressureFromFlowRate and adjustSyringePumpPressures - no longer needed with proper MNA implementation

/**
 * Main function to run the fluid dynamics simulation.
 * Orchestrates graph building, pressure solving, and flow calculation.
 * @param canvasItems Current items on the design canvas.
 * @param canvasConnections Current connections on the design canvas.
 * @param updateSimulationResultsCb Callback to update the application state with simulation results.
 * @param triggerClearVisuals Callback to clear any existing simulation visuals from the canvas.
 * @param triggerVisualiseResults Callback to trigger the drawing of new simulation visuals.
 * @param triggerShowNotification Callback to display notifications (errors, warnings, info) to the user.
 * @param setRunButtonState Optional callback to update the state of a "Run Simulation" button.
 * @returns The SimulationResults object, or null if the simulation fails critically.
 */
export function runFluidSimulationLogic(
    canvasItems: CanvasItemData[], 
    canvasConnections: Connection[],
    updateSimulationResultsCb: (results: SimulationResults) => void,
    triggerClearVisuals: () => void,
    triggerVisualiseResults: () => void,
    triggerShowNotification: (message: string, type: 'error' | 'warning' | 'info') => void,
    setRunButtonState?: (text: string, color?: string, disabled?: boolean) => void
): SimulationResults | null {
    console.log("--- Starting Fluid Simulation ---");
    if (setRunButtonState) setRunButtonState("Simulating...", undefined, true);
    triggerClearVisuals();

    // Debug logs to help identify issues
    console.log("[SimRun] Canvas Items:", canvasItems);
    console.log("[SimRun] Canvas Connections:", canvasConnections);

    const warnings: string[] = [];
    const errors: string[] = [];
    const notificationCollector = (message: string, type: 'error' | 'warning' | 'info') => {
        if (type === 'error') errors.push(message);
        else if (type === 'warning') warnings.push(message);
        triggerShowNotification(message, type);
    };

    let graph = buildNetworkGraph(canvasItems, canvasConnections);
    
    // Collect syringe pump targets for flow rate control
    const syringePumpFlows = new Map<string, number>();
    canvasItems.forEach(item => {
        if (item.chipType === 'pump' && item.pumpType === 'syringe' && item.portFlowRates) {
            item.ports.forEach(port => {
                // Extract the original port ID from the unique port ID
                let originalPortId = port.id;
                if (port.id.startsWith(item.id + '_')) {
                    originalPortId = port.id.substring(item.id.length + 1);
                }
                
                const targetFlowRateUlMin = item.portFlowRates![originalPortId];
                if (targetFlowRateUlMin !== undefined) {
                    // Convert µL/min to m³/s
                    const targetFlowRateM3s = targetFlowRateUlMin * 1e-6 * 1e-3 / 60;
                    const nodeId = port.id; // Use the full port ID as node ID
                    syringePumpFlows.set(nodeId, targetFlowRateM3s);
                    console.log(`[SimRun] Registered syringe pump flow: ${nodeId} -> ${targetFlowRateUlMin} µL/min (${targetFlowRateM3s.toExponential(3)} m³/s)`);
                }
            });
        }
    });
    
    // Debug logs for graph analysis
    console.log("[SimRun] Built graph with nodes:", Object.keys(graph.nodes).length);
    console.log("[SimRun] Built graph with segments:", Object.keys(graph.segments).length);
    console.log("[SimRun] Syringe pump flows:", syringePumpFlows.size);
    
    // Check for isolated components
    let isolatedNodes = 0;
    for (const nodeId in graph.nodes) {
        const node = graph.nodes[nodeId];
        // Skip unconnected pump ports - only check if they have connections
        if (node.type === 'pump' && (!graph.adjacency[nodeId] || graph.adjacency[nodeId].length === 0)) {
            // Check if this port is connected to anything in canvasConnections
            const isPortConnected = canvasConnections.some(conn => 
                (conn.fromItemId === node.canvasItemId && conn.fromPortId === node.portId) ||
                (conn.toItemId === node.canvasItemId && conn.toPortId === node.portId)
            );
            
            if (!isPortConnected) {
                // Skip unconnected pump ports - they're intentionally unused
                continue;
            }
        }
        
        if (!graph.adjacency[nodeId] || graph.adjacency[nodeId].length === 0) {
            console.warn(`[SimRun] Isolated node detected: ${nodeId} (type: ${graph.nodes[nodeId].type})`);
            isolatedNodes++;
        }
    }
    if (isolatedNodes > 0) {
        console.warn(`[SimRun] Found ${isolatedNodes} isolated nodes that are not connected to the network`);
    }
    
    // Check for flow paths from pumps to outlets
    const graphPumpNodes = Object.values(graph.nodes).filter(node => node.type === 'pump');
    const graphOutletNodes = Object.values(graph.nodes).filter(node => node.type === 'outlet' || node.isGround);
    
    if (graphPumpNodes.length > 0 && graphOutletNodes.length > 0) {
        console.log(`[SimRun] Found ${graphPumpNodes.length} pump nodes and ${graphOutletNodes.length} outlet nodes`);
        
        // Check if there are paths from pumps to outlets
        let pumpOutletPaths = 0;
        for (const pumpNode of graphPumpNodes) {
            for (const outletNode of graphOutletNodes) {
                const hasPath = checkPathExists(graph, pumpNode.id, outletNode.id);
                if (hasPath) {
                    console.log(`[SimRun] Found path from pump ${pumpNode.id} to outlet ${outletNode.id}`);
                    pumpOutletPaths++;
                }
            }
        }
        
        if (pumpOutletPaths === 0) {
            console.warn(`[SimRun] No paths found from any pump to any outlet!`);
        }
    }
    
    if (!graph || Object.keys(graph.nodes).length === 0) {
        notificationCollector("Cannot simulate: The design is empty or invalid.", 'error');
        if (setRunButtonState) setRunButtonState("Run Simulation", undefined, false);
        const emptyResults: SimulationResults = { nodePressures: {}, segmentFlows: {}, warnings, errors };
        updateSimulationResultsCb(emptyResults);
        currentSimulationResults = emptyResults;
        return emptyResults; // Return empty results instead of null if it's just an empty graph
    }

    // --- Pre-simulation checks (Connectivity, Boundary Conditions) ---
    const pumpNodes = Object.values(graph.nodes).filter(n => n.type === 'pump' && n.pressure !== undefined);
    const outletNodes = Object.values(graph.nodes).filter(n => n.type === 'outlet' || n.isGround);

    if (pumpNodes.length === 0 && outletNodes.length === 0) {
        notificationCollector("Cannot simulate: Add at least one pump (with set pressure) or an outlet.", 'warning');
        if (setRunButtonState) setRunButtonState("Run Simulation", undefined, false);
        const emptyResults: SimulationResults = { nodePressures: {}, segmentFlows: {}, warnings, errors };
        updateSimulationResultsCb(emptyResults);
        currentSimulationResults = emptyResults;
        return emptyResults;
    }
    
    // Basic reachability: Is there a path from any pump to any outlet (if both exist)?
    if (pumpNodes.length > 0 && outletNodes.length > 0) {
        console.log(`[SimRun] Found ${pumpNodes.length} pump nodes:`, pumpNodes.map(n => n.id));
        console.log(`[SimRun] Found ${outletNodes.length} outlet nodes:`, outletNodes.map(n => n.id));
        
        let pathExists = false;
        for (const pumpNode of pumpNodes) {
            console.log(`[SimRun] Checking paths from pump ${pumpNode.id}`);
            for (const outletNode of outletNodes) {
                console.log(`[SimRun] Checking path to outlet ${outletNode.id}`);
                if (checkPathExists(graph, pumpNode.id, outletNode.id)) {
                    console.log(`[SimRun] Found valid path: ${pumpNode.id} -> ${outletNode.id}`);
                    pathExists = true;
                    break;
                }
            }
            if (pathExists) break;
        }
        
        if (!pathExists) {
            console.warn("[SimRun] No paths found from any pump to any outlet!");
            // Print graph state for debugging
            console.log("[SimRun] Graph state:", {
                nodes: Object.keys(graph.nodes),
                segments: Object.keys(graph.segments),
                adjacency: graph.adjacency
            });
            notificationCollector("Warning: No direct path found between any active pump and an outlet. Results may be localized or unstable.", 'warning');
        }
    }
    // --- End Pre-simulation checks ---

    const solvedNodePressures = solvePressures(graph, notificationCollector, syringePumpFlows);
    if (!solvedNodePressures) {
        console.error("[SimRun] Pressure solution failed.");
        // Errors should have been collected by notificationCollector
        if (setRunButtonState) setRunButtonState("Run Simulation", undefined, false); // Re-enable button
        const failedResults: SimulationResults = { nodePressures: {}, segmentFlows: {}, warnings, errors };
        updateSimulationResultsCb(failedResults);
        currentSimulationResults = failedResults;
        return null; // Critical failure
    }

    const calculatedSegmentFlows = calculateFlows(graph, solvedNodePressures);
    
    const finalResults: SimulationResults = { 
        nodePressures: solvedNodePressures, 
        segmentFlows: calculatedSegmentFlows,
        // Construct detailedFlows for easier consumption by visualizer
        detailedFlows: {},
        warnings, 
        errors 
    };

    for (const segmentId in calculatedSegmentFlows) {
        const flowRate = calculatedSegmentFlows[segmentId];
        const segment = graph.segments[segmentId];
        if (segment && isFinite(flowRate)) {
            finalResults.detailedFlows![segmentId] = {
                flowRateM3s: flowRate,
                fromNodeId: flowRate >= 0 ? segment.node1Id : segment.node2Id,
                toNodeId: flowRate >= 0 ? segment.node2Id : segment.node1Id,
            };
        } else if (segment) {
             finalResults.detailedFlows![segmentId] = { // Still provide entry for NaN flows
                flowRateM3s: NaN,
                fromNodeId: segment.node1Id,
                toNodeId: segment.node2Id,
            };
        }
    }
  
    updateSimulationResultsCb(finalResults);
    currentSimulationResults = finalResults; 

    console.log("--- Simulation Complete ---");
    console.log("Pressures (Pa):", solvedNodePressures);
    console.log("Flows (m³/s):", calculatedSegmentFlows);
    triggerVisualiseResults(); // This will use the results stored via updateSimulationResultsCb
  
    if (setRunButtonState) {
        const originalText = "Run Simulation"; 
        const success = errors.length === 0;
        setRunButtonState(success ? '✓ Results Ready' : '⚠ Issues Found', success ? '#28a745' : '#ffc107', false);
        // Keep the status until next run or reset
        // setTimeout(() => { setRunButtonState(originalText, undefined, false); }, 3000); 
    }
    return finalResults;
}

/**
 * Resets the simulation state, clearing results and visuals.
 * @param updateSimulationResultsCb Callback to update application state with empty results.
 * @param triggerClearVisuals Callback to clear simulation visuals.
 * @param triggerFindFlowPathAndHighlight Callback for any default highlighting (e.g. selected component).
 * @param setRunButtonState Optional callback to reset the run button.
 */
export function resetSimulationStateLogic(
    updateSimulationResultsCb: (results: SimulationResults) => void,
    triggerClearVisuals: () => void,
    triggerFindFlowPathAndHighlight: () => void, // This might be for general canvas interaction reset
    setRunButtonState?: (text: string, color?: string, disabled?: boolean) => void
) {
    console.log("Resetting simulation state...");
    triggerClearVisuals();
    const emptyResults: SimulationResults = { nodePressures: {}, segmentFlows: {}, warnings: [], errors: [] };
    updateSimulationResultsCb(emptyResults);
    currentSimulationResults = emptyResults; // Reset local cache if still used
    
    // This function seems more related to general canvas state than simulation reset.
    // If it's meant to clear selection highlights that are simulation-dependent, it's fine.
    triggerFindFlowPathAndHighlight(); 
    
    if (setRunButtonState) {
        setRunButtonState("Run Simulation", undefined, false);
    }
    console.log("Simulation state reset.");
}

// No need to re-export types from here, they are available from './types'
// export type { SimulationResults, SimulationGraph, SimulationNode, SimulationSegment };

export type { SimulationResults, SimulationGraph, SimulationNode, SimulationSegment }; 

// Helper function to check if a path exists between two nodes in the graph
function checkPathExists(graph: SimulationGraph, startNodeId: string, endNodeId: string): boolean {
    console.log(`[PathCheck] Starting path check from ${startNodeId} to ${endNodeId}`);
    
    const visited = new Set<string>();
    const queue: string[] = [startNodeId];
    const pathTrace = new Map<string, string>(); // Track how we got to each node
    
    while (queue.length > 0) {
        const currentNodeId = queue.shift()!;
        
        if (currentNodeId === endNodeId) {
            // Reconstruct and log the path we found
            let pathNode = currentNodeId;
            const path: string[] = [pathNode];
            while (pathTrace.has(pathNode)) {
                pathNode = pathTrace.get(pathNode)!;
                path.unshift(pathNode);
            }
            console.log(`[PathCheck] Found path! Route:`, path.join(' -> '));
            return true;
        }
        
        if (visited.has(currentNodeId)) {
            continue;
        }
        
        visited.add(currentNodeId);
        console.log(`[PathCheck] Visiting node: ${currentNodeId}`);
        
        const adjacentSegmentIds = graph.adjacency[currentNodeId] || [];
        console.log(`[PathCheck] Found ${adjacentSegmentIds.length} adjacent segments:`, adjacentSegmentIds);
        
        for (const segmentId of adjacentSegmentIds) {
            const segment = graph.segments[segmentId];
            if (!segment) {
                console.warn(`[PathCheck] Missing segment ${segmentId} referenced in adjacency list`);
                continue;
            }
            
            const neighborNodeId = segment.node1Id === currentNodeId ? segment.node2Id : segment.node1Id;
            console.log(`[PathCheck] Following segment ${segmentId} to neighbor: ${neighborNodeId}`);
            
            if (!visited.has(neighborNodeId)) {
                queue.push(neighborNodeId);
                pathTrace.set(neighborNodeId, currentNodeId); // Remember how we got here
            }
        }
    }
    
    console.log(`[PathCheck] No path found from ${startNodeId} to ${endNodeId}`);
    console.log(`[PathCheck] Visited nodes:`, Array.from(visited));
    return false;
}
