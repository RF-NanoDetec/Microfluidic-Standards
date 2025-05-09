import * as math from 'mathjs';
import type { Group } from 'konva/lib/Group';
import type { Port, CanvasItemData, Connection, SimulationResults, Graph, NodeData, SegmentData } from './types';
import { 
    FLUID_VISCOSITY_PAS, 
    DEFAULT_TUBE_INNER_RADIUS_M, 
    POISEUILLE_CONSTANT_DEFAULT,
    MBAR_TO_PASCAL, 
    M3S_TO_ULMIN 
} from './constants';

// Use imported constants
const MICRO_LITERS_PER_MINUTE_FACTOR = M3S_TO_ULMIN;

// --- Global-like state / dependencies ---
let currentSimulationResults: SimulationResults = {
  pressures: {},
  flows: {},
};

// --- Utility Functions ---

export function getInternalNodeId(chipId: string): string {
  return `${chipId}_internal`;
}

export function getSegmentId(nodeId1: string, nodeId2: string): string {
  return [nodeId1, nodeId2].sort().join('--');
}

export function calculateTubingResistance(lengthInMeters: number, poiseuilleConstantToUse: number): number { // Renamed param
  if (lengthInMeters <= 0) return 0;
  return poiseuilleConstantToUse * lengthInMeters;
}


// === SECTION: Simulation Engine ===

function buildNetworkGraph(
    canvasItems: CanvasItemData[], 
    canvasConnections: Connection[],
    // getKonvaGroupById: (id: string) => Group | undefined // This function isn't used in the current buildNetworkGraph body
): Graph {
  // console.log("Building network graph...");
  const graph: Graph = {
    nodes: {},
    segments: {},
    adj: {},
  };

  const addSegment = (id1: string, id2: string, resistance: number) => {
    const segmentId = getSegmentId(id1, id2);
    if (resistance === undefined || !isFinite(resistance) || resistance <= 0) { // Guard against invalid resistance
      console.warn(`Skipping segment ${segmentId} due to invalid or non-positive resistance: ${resistance}`);
      graph.adj[id1] = graph.adj[id1] || [];
      graph.adj[id2] = graph.adj[id2] || [];
      if (!graph.adj[id1].includes(id2)) graph.adj[id1].push(id2);
      if (!graph.adj[id2].includes(id1)) graph.adj[id2].push(id1);
      return;
    }
    graph.segments[segmentId] = { resistance, node1: id1, node2: id2, id: segmentId }; 
    graph.adj[id1] = graph.adj[id1] || [];
    graph.adj[id2] = graph.adj[id2] || [];
    if (!graph.adj[id1].includes(id2)) graph.adj[id1].push(id2);
    if (!graph.adj[id2].includes(id1)) graph.adj[id2].push(id1);
  };

  canvasItems.forEach(item => {
    const chipId = item.id;
    const chipType = item.chipType; 
    const chipResistance = item.resistance; 

    item.ports.forEach(port => {
      const portId = port.id; 
      if (!portId) return;

      let nodeType: NodeData['type'] = 'port';
      if (chipType === 'pump') nodeType = 'pump';
      else if (chipType === 'outlet') nodeType = 'outlet';

      if (!graph.nodes[portId]) {
        graph.nodes[portId] = { type: nodeType, id: portId, chipType: chipType };
      } else {
        if(graph.nodes[portId].type === 'port'){ // Upgrade type if it was generic
            graph.nodes[portId].type = nodeType;
        }
        graph.nodes[portId].chipType = chipType; 
      }
      // Ensure properties from CanvasItemData relevant for NodeData are copied
      if (item.resistance !== undefined) graph.nodes[portId].resistance = item.resistance; // Chip's own resistance (for straight/meander)
      if (item.internalConnections) graph.nodes[portId].internalConnections = item.internalConnections;
      if (item.portPressures) graph.nodes[portId].portPressures = item.portPressures; 
      
      graph.adj[portId] = graph.adj[portId] || [];

      if (chipType === 'pump') {
        const pressuresPa = item.portPressures || {}; 
        graph.nodes[portId].pressure = pressuresPa[port.id] === undefined ? 0 : pressuresPa[port.id];
      } else if (chipType === 'outlet') {
        graph.nodes[portId].pressure = 0;
      }
    });

    const internalConns = item.internalConnections; 
    if (internalConns) {
      if (chipType === 'straight' || chipType === 'meander') {
        if (internalConns.length === 1 && internalConns[0].length === 2 && chipResistance !== undefined) {
          addSegment(internalConns[0][0], internalConns[0][1], chipResistance); // Use item.resistance directly
        } else {
          console.warn(`Invalid internal setup or resistance for ${chipType} chip ${chipId} (Res: ${chipResistance})`);
        }
      } else if (chipType === 't-type' || chipType === 'x-type') {
        const internalNodeId = getInternalNodeId(chipId);
        graph.nodes[internalNodeId] = { type: 'junction', id: internalNodeId };
        graph.adj[internalNodeId] = graph.adj[internalNodeId] || [];
        
        // item.resistance is resistance per segment for T/X types
        const segmentResistance = chipResistance !== undefined ? chipResistance : 1e12; 
        if (chipResistance === undefined) {
          console.warn(`Segment resistance missing for ${chipType} chip ${chipId}, using default ${segmentResistance}`);
        }
        item.ports.forEach(port => {
            const portId = port.id;
            if (portId && graph.nodes[portId]) {
                addSegment(portId, internalNodeId, segmentResistance);
            } else {
                // This case should ideally not happen if ports are always added to graph.nodes first
                console.warn(`[GraphBuild] Port ${portId} not found in graph.nodes when creating internal segment for ${chipId}`);
            }
        });
      }
    }
  });

  canvasConnections.forEach(conn => {
    if (!graph.nodes[conn.fromPortId] || !graph.nodes[conn.toPortId]) {
      console.warn(`[GraphBuild] Skipping connection ${conn.id} - port node missing: From=${!!graph.nodes[conn.fromPortId]}, To=${!!graph.nodes[conn.toPortId]}`);
      return;
    }
    addSegment(conn.fromPortId, conn.toPortId, conn.resistance); // Use conn.resistance directly
  });

  // console.log("Network graph built:", graph);
  return graph;
}


function solvePressures(graph: Graph, showNotification: (message: string, type: 'error' | 'warning' | 'info') => void): { [nodeId: string]: NodeData } | null {
  // console.log("Solving for pressures...");
  const nodeIds = Object.keys(graph.nodes);
  const unknownNodeIds = nodeIds.filter(id => graph.nodes[id].pressure === undefined);

  if (unknownNodeIds.length === 0) {
    // console.log("No unknown pressures to solve.");
    const pressures: { [nodeId: string]: NodeData } = {};
    nodeIds.forEach(id => { pressures[id] = { ...graph.nodes[id] }; });
    return pressures;
  }
  if (Object.keys(graph.segments).length === 0 && unknownNodeIds.length > 0) {
    console.warn("Cannot solve: No segments defined, but unknown nodes exist.");
    showNotification("Cannot simulate: No connections found.", 'error');
    return null;
  }

  const n = unknownNodeIds.length;
  const nodeIndexMap = new Map(unknownNodeIds.map((id, i) => [id, i]));

  const A_data: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));
  const B_data: number[] = Array(n).fill(0);

  unknownNodeIds.forEach((nodeId, i) => {
    let diagSum = 0;
    const neighbors = graph.adj[nodeId] || [];
    if (neighbors.length === 0 && graph.nodes[nodeId].pressure === undefined) {
      console.warn(`Node ${nodeId} has no neighbors and unknown pressure.`);
      A_data[i][i] = 1; B_data[i] = 0; return;
    }
    neighbors.forEach((neighborId: string) => { // Explicitly type neighborId
      const segmentId = getSegmentId(nodeId, neighborId);
      const segment = graph.segments[segmentId];
      if (!segment) return;

      const conductance = 1.0 / segment.resistance;
      diagSum += conductance;

      if (graph.nodes[neighborId]?.pressure !== undefined) {
        const knownPressure = graph.nodes[neighborId].pressure!;
        B_data[i] += conductance * knownPressure;
      } else {
        const j = nodeIndexMap.get(neighborId);
        if (j !== undefined) { A_data[i][j] -= conductance; } 
        // else { console.warn(`Neighbor ${neighborId} of ${nodeId} is unknown but not in index map.`); }
      }
    });
    if (neighbors.length > 0 || graph.nodes[nodeId].pressure !== undefined) {
      A_data[i][i] = diagSum;
    }
  });
  
  const A = math.matrix(A_data);
  const B = math.matrix(B_data);

  let matrixOk = true;
  for (let i = 0; i < n; i++) {
    const diagonalValue = A.get([i, i]); // math.js get can return number or BigNumber or Fraction
    if (typeof diagonalValue === 'number' && math.abs(diagonalValue) < 1e-15) {
      console.error(`Matrix A has near-zero diagonal at index ${i} (Node: ${unknownNodeIds[i]}).`);
      matrixOk = false; break;
    } else if (typeof diagonalValue !== 'number') {
        // Handle BigNumber or Fraction if necessary, or assume it's fine.
        // For simplicity, if it's not a number and small, log a warning.
        if (math.abs(math.number(diagonalValue)) < 1e-15) { // Convert to number for check
            console.warn(`Matrix A diagonal at index ${i} is not a simple number and is small: ${diagonalValue}`);
        }
    }
  }

  if (!matrixOk) {
    showNotification("Simulation failed: Network issue (singular matrix). Check connections.", 'error');
    return null;
  }

  let solvedPressuresVector: math.Matrix;
  try {
    solvedPressuresVector = math.lusolve(A, B) as math.Matrix; 
  } catch (error: any) {
    console.error("Error solving: ", error);
    showNotification(error.message.includes("singular") ? "Simulation failed: Network unstable (singular matrix)." : "Simulation error.", 'error');
    return null;
  }

  const allPressures: { [nodeId: string]: NodeData } = {};
  nodeIds.forEach(id => { allPressures[id] = { ...graph.nodes[id] }; });
  unknownNodeIds.forEach((nodeId, i) => {
    let pressureValueRaw = solvedPressuresVector.get([i, 0]); 
    let pressureValue: number;
     if (typeof pressureValueRaw === 'object' && pressureValueRaw !== null && 're' in pressureValueRaw && 'im' in pressureValueRaw && typeof (pressureValueRaw as any).isComplex === 'boolean' && (pressureValueRaw as any).isComplex) { 
        console.warn(`Node ${nodeId} pressure is complex: ${pressureValueRaw}. Using real part.`);
        pressureValue = (pressureValueRaw as math.Complex).re;
    } else {
        pressureValue = pressureValueRaw as number;
    }
    if (!isFinite(pressureValue)) {
      console.error(`Node ${nodeId} pressure not finite: ${pressureValue}. Setting to NaN.`);
      pressureValue = NaN;
    }
    allPressures[nodeId].pressure = pressureValue;
  });
  // console.log("All node pressures calculated.");
  return allPressures;
}

function calculateFlows(graph: Graph, pressures: { [nodeId: string]: NodeData } | null): SimulationResults['flows'] {
  const flows: SimulationResults['flows'] = {};
  if (!pressures) {
    console.error("Cannot calculate flows: pressures object is null."); return {};
  }
  for (const segmentId in graph.segments) {
    const segment = graph.segments[segmentId];
    const { node1: node1Id, node2: node2Id, resistance } = segment;
    const p1Node = pressures[node1Id]; const p2Node = pressures[node2Id];

    if (p1Node?.pressure === undefined || p2Node?.pressure === undefined) {
      // console.warn(`Flow calc: Missing pressure for segment ${segmentId}.`); 
      continue;
    }
    const p1 = p1Node.pressure; const p2 = p2Node.pressure;
    if (!isFinite(p1) || !isFinite(p2)) {
      // console.warn(`Flow calc: Non-finite pressure for segment ${segmentId}.`);
      flows[segmentId] = { flow: NaN, from: node1Id, to: node2Id }; continue;
    }
    if (resistance === 0) {
      // console.warn(`Flow calc: Zero resistance for segment ${segmentId}.`);
      flows[segmentId] = { flow: NaN, from: node1Id, to: node2Id }; continue;
    }
    const flowRate = (p1 - p2) / resistance;
    flows[segmentId] = { flow: flowRate, from: flowRate >= 0 ? node1Id : node2Id, to: flowRate >= 0 ? node2Id : node1Id };
  }
  // console.log("Calculated flows.");
  return flows;
}

export function runFluidSimulationLogic(
    canvasItems: CanvasItemData[], 
    canvasConnections: Connection[],
    // getKonvaGroupById: (id: string) => Group | undefined, // Not used in buildNetworkGraph anymore
    updateSimulationResultsCb: (results: SimulationResults) => void,
    triggerClearVisuals: () => void,
    triggerVisualiseResults: () => void,
    triggerShowNotification: (message: string, type: 'error' | 'warning' | 'info') => void,
    setRunButtonState?: (text: string, color?: string) => void
): SimulationResults | null {
  console.log("--- Starting Fluid Simulation ---");
  triggerClearVisuals();

  const graph = buildNetworkGraph(canvasItems, canvasConnections /*, getKonvaGroupById */); // getKonvaGroupById removed as it's not used
  if (!graph || Object.keys(graph.nodes).length === 0) {
    triggerShowNotification("Cannot simulate: Network graph empty.", 'error'); return null;
  }

  const pumpPortIds = Object.values(graph.nodes).filter(n => n.type === 'pump').map(n => n.id);
  const outletPortIds = new Set(Object.values(graph.nodes).filter(n => n.type === 'outlet').map(n => n.id));

  let outletReachable = false;
  if (pumpPortIds.length === 0 && outletPortIds.size > 0) outletReachable = true; 
  else if (pumpPortIds.length > 0 && outletPortIds.size === 0) outletReachable = true; 
  else if (pumpPortIds.length === 0 && outletPortIds.size === 0) {
    triggerShowNotification("Cannot simulate: Add pumps or outlets.", 'warning'); return null;
  } else {
      const visited = new Set<string>(); const queue = [...pumpPortIds];
      pumpPortIds.forEach(id => visited.add(id));
      while (queue.length > 0) {
        const currentId = queue.shift()!;
        if (outletPortIds.has(currentId)) { outletReachable = true; break; }
        (graph.adj[currentId] || []).forEach((neighborId: string) => { // Explicit type for neighborId
          if (!visited.has(neighborId)) { visited.add(neighborId); queue.push(neighborId); }
        });
      }
  }
  
  if (!outletReachable && pumpPortIds.length > 0 && outletPortIds.size > 0) { 
    triggerShowNotification("Cannot simulate: No path from pump to outlet.", 'warning'); return null;
  }

  // Modified check for known pressures
  const hasSetPumpPressure = Object.values(graph.nodes).some(node => node.type === 'pump' && node.pressure !== undefined && node.pressure !== 0);
  const hasOutlets = outletPortIds.size > 0;

  if (pumpPortIds.length > 0 && !hasSetPumpPressure && !hasOutlets) {
    triggerShowNotification("Cannot simulate: Set pump pressures or add an outlet if pumps are present.", 'warning'); return null;
  }
  if (pumpPortIds.length === 0 && !hasOutlets) {
     triggerShowNotification("Cannot simulate: No pressure sources (pumps with set pressure or outlets) defined.", 'warning'); return null;
  }

  const solvedPressuresMap = solvePressures(graph, triggerShowNotification);
  if (!solvedPressuresMap) { console.error("Pressure solution failed."); return null; }

  const calculatedFlowsMap = calculateFlows(graph, solvedPressuresMap);
  const results: SimulationResults = { pressures: {}, flows: calculatedFlowsMap };
  for (const nodeId in solvedPressuresMap) {
    if (solvedPressuresMap[nodeId]?.pressure !== undefined) {
      results.pressures[nodeId] = solvedPressuresMap[nodeId].pressure!;
    }
  }
  
  updateSimulationResultsCb(results);
  currentSimulationResults = results; 

  console.log("--- Simulation Complete ---");
  triggerVisualiseResults();
  
  if (setRunButtonState) {
    const originalText = "Run Simulation"; 
    setRunButtonState('✓ Complete', '#28a745');
    setTimeout(() => { setRunButtonState(originalText); }, 1500);
  }
  return results;
}

export function resetSimulationStateLogic(
    updateSimulationResultsCb: (results: SimulationResults) => void,
    triggerClearVisuals: () => void,
    triggerFindFlowPathAndHighlight: () => void,
) {
  console.log("Resetting simulation state...");
  triggerClearVisuals();
  const emptyResults: SimulationResults = { pressures: {}, flows: {} };
  updateSimulationResultsCb(emptyResults);
  currentSimulationResults = emptyResults;
  triggerFindFlowPathAndHighlight();
  console.log("Simulation state reset.");
}

// Export only the types we want to expose
export type { SimulationResults, Graph, NodeData, SegmentData }; 