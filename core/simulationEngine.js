console.log('<<<<<< EXECUTING NEW SIMULATION ENGINE - VERSION SCALED_RESISTANCE_V3 >>>>>>');

// Structure to hold the calculated simulation results
let simulationResults = {
    pressures: {}, // { nodeId: pressureInPascals }
    flows: {}      // { segmentId: { flow: flowRateInM3ps, from: nodeId, to: nodeId } }
};

// === SECTION: Simulation Constants and Scaling ===
// Calculations use SI units internally, but resistance is scaled down
// to improve numerical stability for the solver.
const SIMULATION = {
    PRESSURE_SCALE: 1,       // No scaling for pressures (Pa)
    RESISTANCE_SCALE: 1e-15,  // Scale down large resistances (e.g., 1e15 Pa·s/m³ -> 1 internal unit)
    // Thresholds for physical values (used AFTER unscaling if necessary)
    MIN_PRESSURE_DIFF: 1e-9,   // Minimum meaningful pressure difference in Pa (Adjusted for potential precision)
    MIN_FLOW_RATE: 1e-21,       // Minimum meaningful flow rate in m³/s (Adjusted for potential precision)
};

// Helper to generate a unique ID for internal chip nodes
function getInternalNodeId(chipId) {
    return `${chipId}_internal`;
}

// Helper to generate a unique ID for segments (tubes or internal chip paths)
function getSegmentId(nodeId1, nodeId2) {
    // Ensure consistent order for the segment ID
    return [nodeId1, nodeId2].sort().join('--');
}

// --- NEW: Default Fluid Viscosity (e.g., water at 20°C in Pa·s) ---
// IMPORTANT: Adjust this value based on the fluid used in your simulations.
const DEFAULT_FLUID_VISCOSITY = 0.001; // Pascal-seconds (Pa·s)

// --- NEW: Utility function to calculate rectangular microchannel resistance ---
/**
 * Calculates the hydrodynamic resistance of a rectangular microchannel.
 * NOTE: This formula is an approximation, especially for non-shallow/wide channels.
 * For high accuracy, consult fluid dynamics literature for shape factor calculations
 * based on aspect ratio (height/width).
 * @param {number} length Channel length in meters.
 * @param {number} width Channel width in meters.
 * @param {number} height Channel height in meters.
 * @param {number} viscosity Fluid viscosity in Pascal-seconds (Pa·s).
 * @returns {number} Hydrodynamic resistance in Pa·s/m³.
 */
function calculateRectangularChannelResistance(length, width, height, viscosity) {
    if (width <= 0 || height <= 0 || length <= 0) {
        console.warn(`[ResistanceCalc] Invalid dimensions for rectangular channel: L=${length}, W=${width}, H=${height}. Returning Infinity.`);
        return Infinity;
    }
    if (viscosity <= 0) {
        console.warn(`[ResistanceCalc] Invalid viscosity: ${viscosity}. Returning Infinity.`);
        return Infinity;
    }

    // Poiseuille flow approximation for rectangular channels
    // More accurate formulas exist, but this is common for high aspect ratios
    // See: https://en.wikipedia.org/wiki/Hagen%E2%80%93Poiseuille_equation#Rectangular_ducts
    // Using the formula from the provided reference implementation (simplified)
    const hydraulicDiameter = (2 * width * height) / (width + height);
    // Approximation factor 'f' depends on aspect ratio (height/width).
    // For simplicity, using a rough approximation or assuming square-like.
    // A better approach would use a lookup table or more complex formula based on aspect ratio.
    // Let's stick to the simple formula for now, but acknowledge its limitations.
    // R = 12 * viscosity * length / (width * height^3 * (1 - 0.63 * height/width)) for width >= height
    // R = 12 * viscosity * length / (height * width^3 * (1 - 0.63 * width/height)) for height > width
    // Simplified approximation (less accurate): R ≈ 12 * μ * L / (W * H³)
    // Let's use a slightly more robust hydraulic diameter approach as in some references:
    // A = W * H
    // P = 2 * (W + H)
    // Dh = 4 * A / P = 2*W*H / (W+H)
    // Resistance R = f * (μ * L) / (Dh^2 * A) -- where f is friction factor * Re, often approximated.
    // For laminar flow, Darcy friction factor f = 64/Re for circular pipes.
    // For rectangular, it varies (e.g., 57 for square, up to 96 for high aspect ratio). Let's use ~64 as approximation.
    // R = C * mu * L / Dh^4 where C depends on geometry? No, that seems wrong.
    // Let's revert to a known simple approximation: R = 12 * μ * L / (W * H³) - assuming W >> H or simple model.
    // This matches common microfluidic approximations. Need to be careful with aspect ratio.
    
    // Using the formula consistent with many online calculators for *high aspect ratio* w >> h:
    // R = 12 * μ * L / (w * h³)
    // If h >> w, R = 12 * μ * L / (h * w³)
    let resistance;
    if (width >= height) {
        resistance = (12 * viscosity * length) / (width * Math.pow(height, 3));
    } else {
        resistance = (12 * viscosity * length) / (height * Math.pow(width, 3));
    }

    if (!isFinite(resistance) || resistance < 0) {
        console.warn(`Calculated invalid resistance (${resistance}) for Rect L=${length}, W=${width}, H=${height}. Returning Infinity.`);
        return Infinity;
    }
     // console.log(`[Debug] Rect R Calc: L=${length.toExponential(2)}, W=${width.toExponential(2)}, H=${height.toExponential(2)}, mu=${viscosity.toExponential(2)} -> R_physical = ${resistance.toExponential(3)}`);
    return resistance; // Return physical resistance
}

// --- NEW: Utility function to calculate circular tube resistance (Poiseuille's Law) ---
/**
 * Calculates the hydrodynamic resistance of a circular tube.
 * @param {number} length Tube length in meters.
 * @param {number} radius Tube radius in meters.
 * @param {number} viscosity Fluid viscosity in Pascal-seconds (Pa·s).
 * @returns {number} Hydrodynamic resistance in Pa·s/m³.
 */
function calculateCircularTubeResistance(length, radius, viscosity) {
    if (radius <= 0 || length <= 0) {
        console.warn(`[ResistanceCalc] Invalid dimensions for circular tube: L=${length}, R=${radius}. Returning Infinity.`);
        return Infinity;
    }
     if (viscosity <= 0) {
        console.warn(`[ResistanceCalc] Invalid viscosity: ${viscosity}. Returning Infinity.`);
        return Infinity;
    }
    return (8 * viscosity * length) / (Math.PI * Math.pow(radius, 4));
}

// --- Utility function to calculate tubing resistance ---
// MODIFIED: Accepts length in METERS directly
// THIS FUNCTION MIGHT BE OBSOLETE OR REPURPOSED if all tubes use calculateCircularTubeResistance
function calculateTubingResistance(lengthInMeters) {
    if (lengthInMeters <= 0) return 0;
    // R = (8 * mu * L) / (pi * r^4) = POISEUILLE_CONSTANT * L
    // No pixel conversion needed here anymore
    // This implies POISEUILLE_CONSTANT = (8 * mu) / (pi * r^4)
    // If using this, ensure POISEUILLE_CONSTANT is defined and uses a fixed radius and viscosity
    // For parametric approach, prefer calculateCircularTubeResistance.
    // For now, assuming POISEUILLE_CONSTANT is defined elsewhere if this is still used directly.
    if (typeof POISEUILLE_CONSTANT === 'undefined') {
        console.warn("POISEUILLE_CONSTANT is not defined. calculateTubingResistance will likely fail or use an implicit global.");
        // Fallback to a high resistance or throw error, rather than assuming 0 or using an undefined constant
        // For demonstration, let's assume it might be defined globally.
        // return 1e12 * lengthInMeters; // High resistance if constant is missing
    }
    return POISEUILLE_CONSTANT * lengthInMeters;
}

// === SECTION: Simulation Engine ===
// Network graph builder, solver, and runner
// Dependencies: PIXEL_TO_METER_SCALE, POISEUILLE_CONSTANT, connections, layer, getSegmentId, getInternalNodeId, showNotification, math
function buildNetworkGraph() {
    console.log("[GraphBuild] Building network graph...");
    const graph = {
        nodes: {},      // { nodeId: { type: 'pump'/'outlet'/'internal'/'junction', pressure?: knownPressurePa } }
        segments: {},   // { segmentId: { resistance: R_scaled, node1: id1, node2: id2 } } // STORE SCALED RESISTANCE
        adj: {}         // Adjacency list { nodeId: [neighborId1, ...] }
    };

    // --- Helper to add nodes and segments ---
    const addNode = (nodeId, type, pressure = undefined) => {
        if (!graph.nodes[nodeId]) {
            graph.nodes[nodeId] = { type: type };
            graph.adj[nodeId] = [];
            // Store known pressures directly (already in Pa, PRESSURE_SCALE is 1)
            if (pressure !== undefined) {
                 graph.nodes[nodeId].pressure = pressure; // Store physical pressure
            }
             console.log(`[GraphBuild] Added node ${nodeId} (Type: ${type}${pressure !== undefined ? `, P: ${pressure} Pa` : ''})`);
        } else if (graph.nodes[nodeId].type === 'internal' && type !== 'internal') {
             // Allow upgrading an internal node if it connects to a pump/outlet later
             graph.nodes[nodeId].type = type;
             if (pressure !== undefined) {
                 graph.nodes[nodeId].pressure = pressure; // Update pressure if provided
             }
             console.log(`[GraphBuild] Updated node ${nodeId} type to ${type}${pressure !== undefined ? `, P: ${pressure} Pa` : ''}`);
        }
    };

    const addSegment = (id1, id2, physicalResistance) => {
        const segmentId = getSegmentId(id1, id2);
        // Ensure resistance is positive and finite BEFORE scaling
        if (!physicalResistance || physicalResistance <= 0 || !isFinite(physicalResistance)) {
             console.warn(`[GraphBuild] Skipping segment ${segmentId} due to invalid physical resistance: ${physicalResistance}. Segment will not conduct flow.`);
             return;
        }

        // --- Apply Resistance Scaling ---
        const scaledResistance = physicalResistance * SIMULATION.RESISTANCE_SCALE;

        if (!isFinite(scaledResistance) || scaledResistance < 0) {
             console.warn(`[GraphBuild] Skipping segment ${segmentId} due to invalid SCALED resistance: ${scaledResistance} (from physical ${physicalResistance}). Segment will not conduct flow.`);
             return;
        }
        
        if (!graph.segments[segmentId]) {
             // Store the SCALED resistance
            graph.segments[segmentId] = { resistance: scaledResistance, node1: id1, node2: id2 };
            // Update adjacency list
            graph.adj[id1]?.push(id2); // Use optional chaining
            graph.adj[id2]?.push(id1); // Use optional chaining
             console.log(`[GraphBuild] Added segment ${segmentId} (R_phys: ${physicalResistance.toExponential(3)}, R_scaled: ${scaledResistance.toExponential(3)})`);
        } else {
             console.warn(`[GraphBuild] Segment ${segmentId} already exists. Skipping duplicate.`);
        }
    };

    // 1. Process all draggable components (Chips, Pumps, Outlets)
    layer.find('Group').forEach(group => { // Note: Depends on Konva layer variable
        if (!group.draggable() || !group.id()) return; // Skip non-components or previews

        const chipId = group.id();
        const chipType = group.getAttr('chipType');

        // Get fluid viscosity for this component, fallback to default
        const fluidViscosity = parseFloat(group.getAttr('data-fluid-viscosity')) || DEFAULT_FLUID_VISCOSITY;
        if (isNaN(fluidViscosity) || fluidViscosity <= 0) {
            console.warn(`[GraphBuild] Invalid fluid viscosity for ${chipId} (${fluidViscosity}). Using default ${DEFAULT_FLUID_VISCOSITY}`);
        }

        // Process each connection port on the component
        group.find('.connectionPort').forEach(port => {
            const portId = port.id();
            if (!portId) return;

            // Add node to graph
            if (!graph.nodes[portId]) {
                graph.nodes[portId] = { type: 'port' }; // Default type
            }
            graph.adj[portId] = graph.adj[portId] || []; // Ensure adj entry exists

            // Set known pressures for pumps and outlets
    if (chipType === 'pump') {
                graph.nodes[portId].type = 'pump';
                const pressuresPa = group.getAttr('portPressures') || {};
                // Default 0 Pa if explicitly undefined OR not present
                const physicalPressure = pressuresPa[portId] === undefined ? 0 : pressuresPa[portId];
                graph.nodes[portId].pressure = physicalPressure;
                console.log(`[GraphBuild] Pump Port ${portId} Pressure: ${physicalPressure} Pa`);
    } else if (chipType === 'outlet') {
                graph.nodes[portId].type = 'outlet';
                graph.nodes[portId].pressure = 0; // Outlets are at 0 Pa relative pressure
                console.log(`[GraphBuild] Outlet Port ${portId} Pressure: 0 Pa`);
            }
        });

        // 2. Add Internal Segments based on Chip Type
        const internalConns = group.getAttr('internalConnections');
        if (internalConns) {
            if (chipType === 'straight' || chipType === 'meander') {
                const length = parseFloat(group.getAttr('data-channel-length'));
                const width = parseFloat(group.getAttr('data-channel-width'));
                const height = parseFloat(group.getAttr('data-channel-height'));

                if (!isNaN(length) && !isNaN(width) && !isNaN(height) && length > 0 && width > 0 && height > 0) {
                    const calculatedResistance = calculateRectangularChannelResistance(length, width, height, fluidViscosity);
                    if (internalConns.length === 1 && internalConns[0].length === 2) {
                        console.log(`[GraphBuild] Adding internal segment for ${chipId} (${chipType}): ${internalConns[0][0]} <-> ${internalConns[0][1]} (Physical R=${calculatedResistance.toExponential(3)})`);
                        addSegment(internalConns[0][0], internalConns[0][1], calculatedResistance);
                    } else {
                        console.warn(`[GraphBuild] Invalid or missing internalConnections structure for ${chipType} chip ${chipId}.`);
                    }
                } else {
                    console.error(`[GraphBuild] Missing or invalid dimensions for ${chipType} chip ${chipId} (L:${length},W:${width},H:${height}). Cannot calculate resistance. Skipping internal segment.`);
                }
            } else if (chipType === 't-type' || chipType === 'x-type') {
                const internalNodeId = getInternalNodeId(chipId);
                console.log(`[GraphBuild] Creating internal node ${internalNodeId} for ${chipType} chip ${chipId}`);
                graph.nodes[internalNodeId] = { type: 'junction' };
                graph.adj[internalNodeId] = []; // Initialize adjacency for internal node

                // Dimensions for segments connecting external ports to the internal junction
                const segLength = parseFloat(group.getAttr('data-channel-segment-length')); // Length from port to center
                const segWidth = parseFloat(group.getAttr('data-channel-width')); // Assume channel width applies to segments
                const segHeight = parseFloat(group.getAttr('data-channel-height')); // Assume channel height applies to segments
                let segmentResistance;

                if (!isNaN(segLength) && !isNaN(segWidth) && !isNaN(segHeight) && segLength > 0 && segWidth > 0 && segHeight > 0) {
                    segmentResistance = calculateRectangularChannelResistance(segLength, segWidth, segHeight, fluidViscosity);
                } else {
                    console.error(`[GraphBuild] Missing or invalid dimensions for internal segments of ${chipType} chip ${chipId} (L:${segLength},W:${segWidth},H:${segHeight}). Assigning Infinity resistance to segments.`);
                    segmentResistance = Infinity; // Assign Infinite resistance if dimensions are bad
                }

                const portIds = group.find('.connectionPort').map(p => p.id());
                portIds.forEach(portId => {
                    if (portId && graph.nodes[portId]) { // Ensure port exists
                        console.log(`[GraphBuild] Adding internal segment for ${chipId} (${chipType}): ${portId} <-> ${internalNodeId} (Physical R=${segmentResistance.toExponential(3)})`);
                        addSegment(portId, internalNodeId, segmentResistance);
                    } else {
                        console.warn(`[GraphBuild] Skipping internal segment for ${chipId}: Invalid portId ${portId} or port node does not exist.`);
                    }
                });
            } // Pumps/Outlets don't have internal connections in this model
        }
    });

    // 3. Add External Tubing Segments
    connections.forEach(conn => { // Note: Depends on global connections array
        if (!graph.nodes[conn.fromPort] || !graph.nodes[conn.toPort]) {
            console.warn(`[GraphBuild] Skipping connection ${conn.lineId} - port node missing: From=${!!graph.nodes[conn.fromPort]}, To=${!!graph.nodes[conn.toPort]}`);
            return;
        }

        const tubeLength = parseFloat(conn.lengthInMeters); // Assuming conn.lengthInMeters is available and in meters
        const tubeRadius = parseFloat(conn.radius); // Assuming conn.radius is available and in meters
        // Viscosity for tubes: could be specific to tube, or inherit from connected components, or global.
        // For now, let's try to use viscosity from one of the connected chip components, or default.
        // This is a simplification; a more robust system might store viscosity per connection or globally for tubes.
        let tubeViscosity = DEFAULT_FLUID_VISCOSITY;
        const fromChipNode = graph.nodes[conn.fromPort];
        const toChipNode = graph.nodes[conn.toPort];
        // A simple way to get a viscosity: check if connected components have it set.
        // This part can be refined based on how fluid properties are managed for tubes vs chips.
        if (fromChipNode && fromChipNode.type !== 'outlet' && fromChipNode.type !== 'junction') { // i.e. a port on a chip or pump
            const fromComponentGroup = layer.findOne('#' + conn.fromChip);
            if (fromComponentGroup) tubeViscosity = parseFloat(fromComponentGroup.getAttr('data-fluid-viscosity')) || tubeViscosity;
        }
        if (isNaN(tubeViscosity) || tubeViscosity <=0) tubeViscosity = DEFAULT_FLUID_VISCOSITY;


        if (!isNaN(tubeLength) && !isNaN(tubeRadius) && tubeLength > 0 && tubeRadius > 0) {
            const calculatedResistance = calculateCircularTubeResistance(tubeLength, tubeRadius, tubeViscosity);
            console.log(`[GraphBuild] Adding external tube segment ${conn.lineId}: ${conn.fromPort} <-> ${conn.toPort} (Physical R=${calculatedResistance.toExponential(3)})`);
            addSegment(conn.fromPort, conn.toPort, calculatedResistance);
        } else {
            console.error(`[GraphBuild] Missing or invalid dimensions for tube ${conn.lineId} (L:${tubeLength}, R:${tubeRadius}). Skipping tube segment.`);
        }
    });

    console.log("Network graph built:", JSON.parse(JSON.stringify(graph))); // Use stringify for deep copy for logging complex objects

    // --- Step 1 Audit: Print all nodes and segments for debugging ---
    console.log("=== AUDIT: NETWORK GRAPH ===");
    console.log("Nodes:");
    Object.entries(graph.nodes).forEach(([id, node]) => {
        console.log(`  Node ${id}:`, node);
    });
    console.log("Segments:");
    Object.entries(graph.segments).forEach(([id, seg]) => {
        console.log(`  Segment ${id}: from ${seg.node1} to ${seg.node2}, resistance = ${seg.resistance}`);
    });
    console.log("============================");

    return graph;
}

// === SECTION: Pressure Solver ===
function solvePressures(graph) {
    console.log("Solving for pressures...");
    const nodeIds = Object.keys(graph.nodes);
    
    // Find unknown nodes (nodes without a known pressure)
    const unknownNodeIds = nodeIds.filter(id => graph.nodes[id].pressure === undefined);
    
    if (unknownNodeIds.length === 0) {
        console.log("No unknown pressures to solve. All nodes have known pressures.");
        const pressures = {};
        nodeIds.forEach(id => { pressures[id] = { ...graph.nodes[id] }; });
        return pressures;
    }
    if (Object.keys(graph.segments).length === 0 && unknownNodeIds.length > 0) {
        console.warn("Cannot solve: No segments defined in the graph, but unknown nodes exist.");
        showNotification("Cannot simulate: No connections found in the network.", 'error');
        return null;
    }

    const n = unknownNodeIds.length;
    const nodeIndexMap = new Map(unknownNodeIds.map((id, i) => [id, i]));
    
    console.log("Unknown Node IDs:", unknownNodeIds);
    console.log("Node Index Map (nodeId -> matrix_index):");
    nodeIndexMap.forEach((index, id) => console.log(`  ${id} -> ${index}` ));
    
    const A = math.zeros(n, n);
    const B = math.zeros(n);

    // For each unknown node, create the KCL equation
    unknownNodeIds.forEach((nodeId, i) => {
        let diagSum = 0;
        const neighbors = graph.adj[nodeId] || [];
        
        // Special case - isolated nodes
        if (neighbors.length === 0) {
            console.warn(`Node ${nodeId} has no neighbors and unknown pressure. Setting pressure to zero.`);
            A.set([i, i], 1);
            B.set([i], 0);
            return;
        }
        
        // Process each neighbor
        neighbors.forEach(neighborId => {
            const segmentId = getSegmentId(nodeId, neighborId);
            const segment = graph.segments[segmentId];
            if (!segment) {
                console.warn(`Skipping neighbor ${neighborId} for node ${nodeId}: segment ${segmentId} not found`);
                return;
            }
            
            const conductance = 1.0 / segment.resistance;
            diagSum += conductance;
            
            // If neighbor has known pressure, add to source term
            if (graph.nodes[neighborId]?.pressure !== undefined) {
                const knownPressure = graph.nodes[neighborId].pressure;
                B.set([i], B.get([i]) + conductance * knownPressure);
            }
            // Else, add to the system matrix
            else {
                const j = nodeIndexMap.get(neighborId);
                if (j !== undefined) {
                    A.set([i, j], A.get([i, j]) - conductance);
                } else {
                    console.warn(`Neighbor ${neighborId} of ${nodeId} is unknown but not in index map.`);
                }
            }
        });
        
        // Set the diagonal element
        A.set([i, i], diagSum);
    });

    // --- Check for ill-conditioned matrix --- //
    let matrixOk = true;
    for (let i = 0; i < n; i++) {
        if (math.abs(A.get([i, i])) < 1e-10) { // Relaxed threshold for normalized values
            console.error(`Matrix A has near-zero diagonal at index ${i} (Node: ${unknownNodeIds[i]}). System may be singular.`);
            matrixOk = false;
            break;
        }
    }

    if (!matrixOk) {
        showNotification("Simulation failed: Network might have isolated parts or errors. Check connections.", 'error');
        return null;
    }

    // Solve Ax = B for x (the unknown pressures)
    let solvedPressuresVector;
    try {
        const lu = math.lup(A);
        solvedPressuresVector = math.lusolve(lu, B);
    } catch (error) {
        console.error("Error solving linear system:", error);
        showNotification("Simulation failed: Network unstable or disconnected. Check connections.", 'error');
        return null;
    }

    // Update with solved pressures
    const allPressures = {};
    nodeIds.forEach(id => {
        allPressures[id] = { 
            ...graph.nodes[id],
            pressure: solvedPressuresVector.get([nodeIndexMap.get(id), 0])
        };
    });
    
    unknownNodeIds.forEach((nodeId, i) => {
        let pressureValue = solvedPressuresVector.get([i, 0]);
        
        // Handle complex numbers (should be rare with normalized values)
        if (typeof pressureValue === 'object' && pressureValue.isComplex) {
            console.warn(`Node ${nodeId} solved pressure is complex. Using real part.`);
            pressureValue = pressureValue.re;
        }
        
        // Store both normalized and physical pressures
        allPressures[nodeId].pressure = pressureValue;
    });

    console.log("All node pressures calculated:", 
        Object.entries(allPressures).map(([id, data]) => ({
            id, 
            pressure: data.pressure
        }))
    );
    
    return allPressures;
}

// === SECTION: Flow Calculation ===
function calculateFlows(graph, pressures) {
    console.log("[FlowCalc] Calculating flows with scaled resistances...");
    const scaledFlows = {}; // Note: these are SCALED flows

    if (!pressures) {
        console.error("[FlowCalc] Cannot calculate flows: pressures object is null.");
        return {}; // Return empty for scaled flows
    }

    // First pass: Calculate raw SCALED flows based on pressure differences and SCALED resistances
    for (const segmentId in graph.segments) {
        const segment = graph.segments[segmentId];
        const node1Id = segment.node1;
        const node2Id = segment.node2;

        // Pressures are already in physical units (Pascals) as PRESSURE_SCALE is 1
        const p1 = pressures[node1Id]?.pressure;
        const p2 = pressures[node2Id]?.pressure;

        if (p1 === undefined || p2 === undefined) {
            console.warn(`[FlowCalc] Cannot calculate flow for segment ${segmentId}: Missing pressure for node.`);
            scaledFlows[segmentId] = { flow: 0, from: node1Id, to: node2Id, warning: "Missing pressure" };
            continue;
        }

        const deltaP = p1 - p2; // Physical deltaP in Pascals
        const scaledResistance = segment.resistance; // This is R_physical * RESISTANCE_SCALE

        let scaledFlowRate = 0;
        if (scaledResistance > 0 && isFinite(scaledResistance)) {
            // Q_scaled = deltaP / R_scaled = deltaP / (R_physical * RESISTANCE_SCALE)
            // So, Q_scaled relates to Q_physical by a factor of 1/RESISTANCE_SCALE
            // Q_physical = deltaP / R_physical
            // Q_scaled = Q_physical / SIMULATION.RESISTANCE_SCALE --- this is wrong
            // Q_physical = Q_scaled * SIMULATION.RESISTANCE_SCALE --- this is also wrong
            // Let's be clear:
            // R_scaled = R_physical * SIMULATION.RESISTANCE_SCALE
            // Q_scaled = deltaP_physical / R_scaled
            // Q_physical = deltaP_physical / R_physical
            // Therefore, Q_physical = deltaP_physical / (R_scaled / SIMULATION.RESISTANCE_SCALE)
            // Q_physical = (deltaP_physical / R_scaled) * SIMULATION.RESISTANCE_SCALE
            // Q_physical = Q_scaled * SIMULATION.RESISTANCE_SCALE.
            // The variable `scaledFlowRate` here IS Q_scaled.
            scaledFlowRate = deltaP / scaledResistance;
        } else if (scaledResistance === 0 && deltaP !== 0) {
            console.warn(`[FlowCalc] Segment ${segmentId} has zero scaled resistance and non-zero deltaP (${deltaP.toExponential(3)} Pa). Potential infinite flow.`);
            scaledFlows[segmentId] = { flow: deltaP > 0 ? Infinity : -Infinity, from: node1Id, to: node2Id, error: "Zero resistance with deltaP" };
            simulationResults.errors.push(`Segment ${segmentId}: Zero resistance with pressure drop.`);
            continue;
        } else {
             if (scaledResistance <= 0) console.log(`[FlowCalc] Segment ${segmentId} has non-positive scaled resistance (${scaledResistance.toExponential(3)}). Flow is zero.`);
            scaledFlowRate = 0;
        }
        
        if (deltaP >= 0) {
            scaledFlows[segmentId] = { flow: scaledFlowRate, from: node1Id, to: node2Id };
        } else { 
            scaledFlows[segmentId] = { flow: -scaledFlowRate, from: node2Id, to: node1Id }; 
        }
        // console.log(`[FlowCalc] Segment ${segmentId} (${node1Id} -> ${node2Id}): P1=${p1?.toExponential(3)}, P2=${p2?.toExponential(3)}, DeltaP=${deltaP.toExponential(3)}, R_scaled=${scaledResistance.toExponential(3)}, Q_scaled=${scaledFlows[segmentId].flow.toExponential(3)}`);
    }
    
    // --- KCL ENFORCEMENT (Kirchhoff's Current Law) ---
    // Operates on SCALED flows.
    console.log("[FlowCalc KCL] Attempting KCL enforcement for outlet segments...");
    Object.keys(graph.nodes).forEach((nodeId) => {
        const nodeMeta = graph.nodes[nodeId];
        if (!nodeMeta || nodeMeta.type === 'pump' || nodeMeta.type === 'outlet') return;

        const neighbors = graph.adj[nodeId] || [];
        let outletNeighborId = null;
        let outletSegmentId = null;
        const connectedSegmentsInfo = [];

        for (const neighborId of neighbors) {
            const segmentId = getSegmentId(nodeId, neighborId);
            const flowData = scaledFlows[segmentId];
            if (!flowData) continue;

            let flowIntoNode = 0;
            if (flowData.to === nodeId) {
                flowIntoNode = flowData.flow;
            } else if (flowData.from === nodeId) {
                flowIntoNode = -flowData.flow;
            }

            const isOutletSegment = graph.nodes[neighborId]?.type === 'outlet';
            if (isOutletSegment) {
                outletNeighborId = neighborId;
                outletSegmentId = segmentId;
            }
            connectedSegmentsInfo.push({ segmentId, flowIntoNode, isOutletSegment, neighborId });
        }

        if (outletSegmentId && scaledFlows[outletSegmentId]) {
            const outletFlowData = scaledFlows[outletSegmentId];
            let netFlowIntoNodeFromNonOutletSegments = 0;
            
            connectedSegmentsInfo.forEach(info => {
                if (!info.isOutletSegment) {
                    netFlowIntoNodeFromNonOutletSegments += info.flowIntoNode;
                }
            });
            
            let currentOutletFlowMagnitude = 0;
            if (outletFlowData.from === nodeId) currentOutletFlowMagnitude = outletFlowData.flow;
            else if (outletFlowData.to === nodeId) currentOutletFlowMagnitude = -outletFlowData.flow; 
            
            // SCALED threshold for flow comparison
            const scaledMinFlowThreshold = SIMULATION.MIN_FLOW_RATE / SIMULATION.RESISTANCE_SCALE; 
            
            if (Math.abs(netFlowIntoNodeFromNonOutletSegments) > scaledMinFlowThreshold && 
                (Math.abs(currentOutletFlowMagnitude) < scaledMinFlowThreshold || Math.sign(currentOutletFlowMagnitude) !== Math.sign(netFlowIntoNodeFromNonOutletSegments)) ) {
                
                console.warn(`[FlowCalc KCL] Correcting flow for outlet segment ${outletSegmentId} at node ${nodeId}.`);
                console.warn(`  Net scaled flow into node (excl. outlet seg): ${netFlowIntoNodeFromNonOutletSegments.toExponential(3)}`);
                console.warn(`  Original scaled flow in outlet seg ${outletSegmentId} (from ${outletFlowData.from} to ${outletFlowData.to}): ${outletFlowData.flow.toExponential(3)}`);
                
                const correctedScaledFlow = netFlowIntoNodeFromNonOutletSegments;

                scaledFlows[outletSegmentId] = {
                    flow: Math.abs(correctedScaledFlow), 
                    from: correctedScaledFlow >= 0 ? nodeId : outletNeighborId,
                    to: correctedScaledFlow >= 0 ? outletNeighborId : nodeId,
                    kcl_corrected: true
                };
                console.warn(`  KCL Corrected Scaled Flow for ${outletSegmentId}: ${scaledFlows[outletSegmentId].flow.toExponential(3)} from ${scaledFlows[outletSegmentId].from} to ${scaledFlows[outletSegmentId].to}`);
                 simulationResults.warnings.push(`KCL corrected flow for segment ${outletSegmentId}.`);
            }
        }
    });

    // console.log("[FlowCalc] Calculated scaled flows:", scaledFlows);
    return scaledFlows; // Return SCALED flows
}

// === SECTION: Simulation Runner ===
function runFluidSimulation() {
    console.log("--- Starting Fluid Simulation ---");
    clearSimulationVisuals(); 
    simulationResults = {
        pressures: {}, // { nodeId: { pressure: physicalPressureInPascals, type: nodeType } }
        flows: {},     // { segmentId: { flow: physicalFlowRateInM3ps, from: nodeId, to: nodeId } }
        warnings: [],
        errors: []
    };

    const graph = buildNetworkGraph(); // Builds graph with SCALED resistances
    if (!graph || Object.keys(graph.nodes).length === 0) {
        console.error("[SimRun] Failed to build network graph or graph is empty.");
        showNotification("Cannot simulate: Network graph could not be built.", 'error');
        updateSimulationVisuals(simulationResults); 
        return;
    }
    
    // Check for basic connectivity (pump to outlet)
    // ... (existing BFS check can remain, it operates on the graph structure)

    const pumpNodes = Object.values(graph.nodes).filter(n => n.type === 'pump' && n.pressure !== undefined);
    const outletNodes = Object.values(graph.nodes).filter(n => n.type === 'outlet');

    if (pumpNodes.length === 0) {
        console.warn("[SimRun] No active pumps with defined pressure in the simulation.");
        simulationResults.warnings.push("No active pump with defined pressure.");
        // Allow simulation to proceed if there are outlets, might be passive flow or error state
    }
    if (outletNodes.length === 0) {
        console.warn("[SimRun] No outlets in the simulation. Pressure reference is missing, results may be unreliable.");
        simulationResults.warnings.push("No outlet found. Pressure reference missing.");
        // Allow simulation to proceed, but results will likely be all zero or solver might fail.
    }
     if (pumpNodes.length === 0 || outletNodes.length === 0) {
        console.warn("[SimRun] Simulation lacks either active pumps or outlets. Results will likely be trivial (zero flow).");
    }

    let solvedPressures = {}; // Physical pressures (Pa)
    let calculatedScaledFlows = {}; // Flows calculated using scaled resistances

    // --- Try Analytical Solution for Simple Series ---
    // Expects graph with scaled resistances, returns physical pressures and SCALED flows
    const analyticalSolution = tryAnalyticalSeriesSolution(graph); 

    if (analyticalSolution) {
        console.log("[SimRun] Using analytical solution for simple series circuit.");
        solvedPressures = analyticalSolution.pressures;     // Physical pressures
        calculatedScaledFlows = analyticalSolution.flows;   // SCALED flows
        
        // Store physical pressures
        Object.entries(solvedPressures).forEach(([nodeId, pressureVal]) => {
            // If pressureVal is an object { pressure, type }, use that, else assume it's just the value
             const pressure = typeof pressureVal === 'object' && pressureVal !== null ? pressureVal.pressure : pressureVal;
             const type = typeof pressureVal === 'object' && pressureVal !== null ? pressureVal.type : graph.nodes[nodeId]?.type || 'unknown';
            simulationResults.pressures[nodeId] = { pressure: pressure, type: type };
        });

    } else {
        console.log("[SimRun] Using matrix solver for complex circuit.");
        // solvePressures uses the graph (with scaled resistances) but solves for physical pressures
        solvedPressures = solvePressures(graph); 

        if (Object.keys(solvedPressures).length === 0 && Object.keys(graph.nodes).length > 0) {
            console.error("[SimRun] Pressure solver returned no results. Aborting flow calculation.");
            simulationResults.errors.push("Pressure solver failed.");
            updateSimulationVisuals(simulationResults);
            return;
        }
        
        // Store physical pressures
        Object.entries(solvedPressures).forEach(([nodeId, data]) => {
            simulationResults.pressures[nodeId] = { pressure: data.pressure, type: data.type };
        });
        
        // calculateFlows uses physical pressures and scaled resistances -> returns SCALED flows
        calculatedScaledFlows = calculateFlows(graph, solvedPressures); 
    }


    // --- Unscale Flows and Store Results ---
    console.log("[SimRun] Unscaling flows and finalizing results...");
    if (SIMULATION.RESISTANCE_SCALE === 0) {
        console.error("[SimRun] RESISTANCE_SCALE is zero, cannot unscale flows properly!")
        simulationResults.errors.push("Internal Error: RESISTANCE_SCALE is zero.");
    } else {
        for (const segmentId in calculatedScaledFlows) {
            const scaledFlowData = calculatedScaledFlows[segmentId];
            
            // Q_physical = Q_scaled * RESISTANCE_SCALE. See derivation in calculateFlows.
            let physicalFlowRate = scaledFlowData.flow * SIMULATION.RESISTANCE_SCALE;

            if (scaledFlowData.flow === Infinity) physicalFlowRate = Infinity;
            if (scaledFlowData.flow === -Infinity) physicalFlowRate = -Infinity;

            // Check against minimum physical flow rate threshold AFTER unscaling
            if (Math.abs(physicalFlowRate) < SIMULATION.MIN_FLOW_RATE) {
                 // console.log(`[SimRun] Segment ${segmentId}: Physical flow ${physicalFlowRate.toExponential(3)} below threshold ${SIMULATION.MIN_FLOW_RATE.toExponential(3)}. Setting to 0.`);
                 // physicalFlowRate = 0; // Option: uncomment to zero out negligible flows
            }

            simulationResults.flows[segmentId] = {
                flow: physicalFlowRate,
                from: scaledFlowData.from,
                to: scaledFlowData.to,
                ...(scaledFlowData.warning && { warning: scaledFlowData.warning }),
                ...(scaledFlowData.error && { error: scaledFlowData.error }),
                ...(scaledFlowData.kcl_corrected && { kcl_corrected: true })
            };
            console.log(`[SimRun] Segment ${segmentId}: Q_scaled=${scaledFlowData.flow.toExponential(3)}, R_SCALE=${SIMULATION.RESISTANCE_SCALE.toExponential(3)} -> Q_physical=${physicalFlowRate.toExponential(3)}`);
        }
    }
    
    console.log("[SimRun] Final Physical Pressures:", simulationResults.pressures);
    console.log("[SimRun] Final Physical Flows:", simulationResults.flows);

    updateSimulationVisuals(simulationResults);
    console.log("--- Fluid Simulation Finished ---");
}

// --- Analytical Solver for Simple Series Circuit ---
// Assumes graph has SCALED resistances.
// Returns { pressures: {nodeId: physicalPressure}, flows: {segmentId: {flow: SCALED_flow, from, to}} }
function tryAnalyticalSeriesSolution(graph) {
    // ... (path finding logic remains the same)
     const pumpNodes = Object.entries(graph.nodes).filter(([_, n]) => n.type === 'pump' && n.pressure !== undefined).map(([id, data]) => ({ id, pressure: data.pressure }));
    const outletNodes = Object.entries(graph.nodes).filter(([_, n]) => n.type === 'outlet').map(([id, data]) => ({ id, pressure: data.pressure }));

    if (pumpNodes.length !== 1 || outletNodes.length !== 1) {
        return null;
    }
    const pump = pumpNodes[0];
    const outlet = outletNodes[0];

    let path = [];
    let current = pump.id;
    let visited = new Set();
    let totalScaledResistance = 0;
    let segmentPath = []; // Stores {id, resistance (scaled)} for segments in path

    function findPath(currNodeId, currentPath, currentSegments, currentResistanceSum) {
        visited.add(currNodeId);
        currentPath.push(currNodeId);

        if (currNodeId === outlet.id) {
            path = [...currentPath];
            totalScaledResistance = currentResistanceSum;
            segmentPath = [...currentSegments];
            return true;
        }
        const neighbors = (graph.adj[currNodeId] || []);
        let nextNode = null;
        let segmentToNext = null;
        let validNextSteps = 0;
        for (const neighborId of neighbors) {
             if (!visited.has(neighborId)) {
                if (nextNode) return false; 
                nextNode = neighborId;
                const segmentId = getSegmentId(currNodeId, neighborId);
                if (!graph.segments[segmentId]) return false;
                segmentToNext = {id: segmentId, resistance: graph.segments[segmentId].resistance};
                validNextSteps++;
            } else if (neighborId === currentPath[currentPath.length - 2]) {
                // Previous node, ok
            } else {
                return false; // Cycle or complex
            }
        }
        if (validNextSteps === 1 && nextNode && segmentToNext) {
             currentSegments.push(segmentToNext);
            if (findPath(nextNode, currentPath, currentSegments, currentResistanceSum + segmentToNext.resistance)) {
                return true;
            }
            currentSegments.pop(); 
        } else if (currNodeId !== outlet.id && validNextSteps === 0 && neighbors.length > 0) {
            return false; // Dead end
        } else if (validNextSteps > 1) {
            return false; // Branch
        }
        currentPath.pop();
        return false;
    }

    if (!findPath(pump.id, [], [], 0) || path.length === 0) {
        return null;
    }
    if (Object.keys(graph.nodes).length !== path.length) {
        return null; // Ensure no other nodes
    }
    for (let i = 1; i < path.length - 1; i++) {
        if ((graph.adj[path[i]] || []).length !== 2) {
            return null; // Intermediate nodes degree 2
        }
    }

    console.log(`[Analytical] Simple series path found: ${path.join(" -> ")}`);
    console.log(`[Analytical] Total SCALED resistance: ${totalScaledResistance.toExponential(3)}`);

    const totalPressureDifference = pump.pressure - outlet.pressure; // Physical
    
    // Calculate SCALED flow rate
    let scaledFlowRate = 0;
     if (totalScaledResistance > 0 && isFinite(totalScaledResistance)) {
         scaledFlowRate = totalPressureDifference / totalScaledResistance;
     } else if (totalScaledResistance === 0 && totalPressureDifference !== 0) {
         console.warn(`[Analytical] Zero total scaled resistance with non-zero deltaP. Infinite scaled flow.`);
         scaledFlowRate = totalPressureDifference > 0 ? Infinity : -Infinity;
         // We probably should return null here, as infinite flow is hard to handle downstream.
         return null; 
     } // Else: 0 resistance and 0 deltaP -> 0 flow, or invalid resistance -> 0 flow.

    if (!isFinite(scaledFlowRate)) {
        console.warn(`[Analytical] Calculated non-finite scaled flow rate: ${scaledFlowRate}.`);
        // It's better to indicate failure than propagate Infinity/NaN perhaps
        // scaledFlowRate = 0; // Or return null
        return null; 
    }

    console.log(`[Analytical] Total physical DeltaP: ${totalPressureDifference.toExponential(3)} Pa, Scaled Flow Rate: ${scaledFlowRate.toExponential(3)}`);

    const pressures = {}; // Physical pressures
    const scaledFlows = {}; // SCALED flows { segmentId: { flow, from, to } }

    pressures[pump.id] = pump.pressure;
    let currentPressure = pump.pressure;

    for (let i = 0; i < path.length - 1; i++) {
        const node1Id = path[i];
        const node2Id = path[i+1];
        const segmentDetails = segmentPath[i]; // {id, resistance (scaled)}
        
        if (!segmentDetails || segmentDetails.resistance === undefined) return null;
        
        const scaledSegmentResistance = segmentDetails.resistance;
        const pressureDrop = scaledFlowRate * scaledSegmentResistance; // Physical pressure drop
        currentPressure -= pressureDrop;
        pressures[node2Id] = currentPressure; // Store physical pressure

        // Store SCALED flow for this segment
        scaledFlows[segmentDetails.id] = {
            flow: Math.abs(scaledFlowRate),
            from: scaledFlowRate >= 0 ? node1Id : node2Id,
            to: scaledFlowRate >= 0 ? node2Id : node1Id
        };
    }
    
    // Optional: Verify outlet pressure
    const calculatedOutletPressure = pressures[outlet.id];
    if (Math.abs(calculatedOutletPressure - outlet.pressure) > Math.abs(outlet.pressure * 1e-6) + 1e-9) { // Relative + absolute tolerance
        console.warn(`[Analytical] Mismatch in calculated outlet pressure: Expected ${outlet.pressure.toExponential(3)}, Got ${calculatedOutletPressure.toExponential(3)}. Diff: ${(calculatedOutletPressure - outlet.pressure).toExponential(3)}`);
    }

    console.log("[Analytical] Calculated Pressures (physical):", pressures);
    console.log("[Analytical] Calculated Flows (scaled):", scaledFlows);

    // Return physical pressures and SCALED flows
    return { pressures, flows: scaledFlows }; 
}

// === SECTION: Simulation Reset & Interaction ===
function resetSimulationState() {
    console.log("Resetting simulation state...");

    // 1. Clear all simulation-specific visuals (colors, dots, legend, summary)
    clearSimulationVisuals(); // Note: Depends on clearSimulationVisuals

    // 2. Reset the simulationResults object
    simulationResults = {
        pressures: {},
        flows: {}
    };

    // 3. Restore the initial connectivity highlighting (Pump Reachability)
    findFlowPathAndHighlight(); // Note: Depends on findFlowPathAndHighlight

    // 4. Re-enable ports for interaction
    layer.find('.connectionPort').forEach(port => { // Note: Depends on Konva layer variable
        const mainGroup = stage.findOne('#' + port.getAttr('mainGroupId')); // Note: Depends on Konva stage variable
        const chipType = mainGroup?.getAttr('chipType');
        
        // Show blue connection dot only if:
        // - Not an outlet port
        // - Not connected to anything
        if (!isPortConnected(port.id())) { // Note: Depends on isPortConnected
            port.visible(true);
        }
    });

    // 5. Clear the properties panel if it's showing simulation data
    if (selectedComponent) { // Note: Depends on global selectedComponent variable
        updatePropertiesPanel(); // Re-render properties without simulation data // Note: Depends on updatePropertiesPanel
    }

    // 6. Redraw the layer
    layer.draw(); // Note: Depends on Konva layer variable
    console.log("Simulation state reset.");
} 
