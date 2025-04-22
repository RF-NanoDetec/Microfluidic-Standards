// Structure to hold the calculated simulation results
let simulationResults = {
    pressures: {}, // { nodeId: pressureInPascals }
    flows: {}      // { segmentId: { flow: flowRateInM3ps, from: nodeId, to: nodeId } }
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

// --- Utility function to calculate tubing resistance ---
// MODIFIED: Accepts length in METERS directly
function calculateTubingResistance(lengthInMeters) {
    if (lengthInMeters <= 0) return 0;
    // R = (8 * mu * L) / (pi * r^4) = POISEUILLE_CONSTANT * L
    // No pixel conversion needed here anymore
    return POISEUILLE_CONSTANT * lengthInMeters;
}

// === SECTION: Simulation Engine ===
// Network graph builder, solver, and runner
// Dependencies: PIXEL_TO_METER_SCALE, POISEUILLE_CONSTANT, connections, layer, getSegmentId, getInternalNodeId, showNotification, math
function buildNetworkGraph() {
    console.log("Building network graph...");
    const graph = {
        nodes: {},      // { nodeId: { type: 'pump'/'outlet'/'internal'/'junction', pressure?: knownPressurePa } }
        segments: {},   // { segmentId: { resistance: R, node1: id1, node2: id2 } }
        adj: {}         // Adjacency list { nodeId: [neighborId1, ...] }
    };

    const addSegment = (id1, id2, resistance) => {
        const segmentId = getSegmentId(id1, id2);
        // Ensure resistance is positive and finite
        if (!resistance || resistance <= 0 || !isFinite(resistance)) {
             console.warn(`Skipping segment ${segmentId} due to invalid resistance: ${resistance}`);
             // Still add nodes to adjacency list even if segment is invalid, helps find isolated parts
             graph.adj[id1] = graph.adj[id1] || [];
             graph.adj[id2] = graph.adj[id2] || [];
             if (!graph.adj[id1].includes(id2)) graph.adj[id1].push(id2);
             if (!graph.adj[id2].includes(id1)) graph.adj[id2].push(id1);
             return;
        }
        graph.segments[segmentId] = { resistance: resistance, node1: id1, node2: id2 };

        // Update adjacency list (undirected for resistance network)
        graph.adj[id1] = graph.adj[id1] || [];
        graph.adj[id2] = graph.adj[id2] || [];
        if (!graph.adj[id1].includes(id2)) graph.adj[id1].push(id2);
        if (!graph.adj[id2].includes(id1)) graph.adj[id2].push(id1);
    };

    // 1. Process all draggable components (Chips, Pumps, Outlets)
    layer.find('Group').forEach(group => { // Note: Depends on Konva layer variable
        if (!group.draggable() || !group.id()) return; // Skip non-components or previews

        const chipId = group.id();
        const chipType = group.getAttr('chipType');
        const chipResistance = group.getAttr('resistance'); // For simple chips

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
                graph.nodes[portId].pressure = pressuresPa[portId] === undefined ? 0 : pressuresPa[portId];
                 console.log(`[GraphBuild] Pump Port ${portId} Pressure: ${graph.nodes[portId].pressure} Pa`); // Debug
    } else if (chipType === 'outlet') {
                graph.nodes[portId].type = 'outlet';
                graph.nodes[portId].pressure = 0; // Outlets are at 0 Pa relative pressure
                 console.log(`[GraphBuild] Outlet Port ${portId} Pressure: 0 Pa`); // Debug
            }
        });

        // 2. Add Internal Segments based on Chip Type
        const internalConns = group.getAttr('internalConnections');
        if (internalConns) {
            if (chipType === 'straight' || chipType === 'meander') {
                // Simple connection between the two ports with chip resistance
                if (internalConns.length === 1 && internalConns[0].length === 2 && chipResistance) {
                     console.log(`[GraphBuild] Adding internal segment for ${chipId}: ${internalConns[0][0]} <-> ${internalConns[0][1]} (R=${chipResistance})`);
                    addSegment(internalConns[0][0], internalConns[0][1], chipResistance);
    } else {
                    console.warn(`Invalid internal connection/resistance for ${chipType} chip ${chipId}`);
                }
            } else if (chipType === 't-type' || chipType === 'x-type') {
                // These require an internal junction node
                const internalNodeId = getInternalNodeId(chipId);
                 console.log(`[GraphBuild] Creating internal node ${internalNodeId} for ${chipType} chip ${chipId}`);
                graph.nodes[internalNodeId] = { type: 'junction' };
                graph.adj[internalNodeId] = []; // Initialize adjacency for internal node

                // Assume chipResistance is PER SEGMENT for T/X types (simplification)
                // Use a large default if resistance attribute is missing
                const segmentResistance = chipResistance || 1e12; // High default resistance
                if (!chipResistance) {
                     console.warn(`Resistance attribute missing for ${chipType} chip ${chipId}, using default ${segmentResistance}`);
                }

                const portIds = group.find('.connectionPort').map(p => p.id());
                portIds.forEach(portId => {
                    if (portId && graph.nodes[portId]) { // Ensure port exists
                         console.log(`[GraphBuild] Adding internal segment for ${chipId}: ${portId} <-> ${internalNodeId} (R=${segmentResistance})`);
                        addSegment(portId, internalNodeId, segmentResistance);
                    } else {
                         console.warn(`[GraphBuild] Skipping internal segment for ${chipId}: Invalid portId ${portId}`);
                    }
                });
            } // Pumps/Outlets don't have internal connections in this model
        }
    });

    // 3. Add External Tubing Segments
    connections.forEach(conn => { // Note: Depends on global connections array
        // Ensure ports exist in the graph nodes list before adding segment
        if (!graph.nodes[conn.fromPort] || !graph.nodes[conn.toPort]) {
             console.warn(`[GraphBuild] Skipping connection ${conn.lineId} - port node missing: From=${!!graph.nodes[conn.fromPort]}, To=${!!graph.nodes[conn.toPort]}`);
             return;
        }
         console.log(`[GraphBuild] Adding external tube segment ${conn.lineId}: ${conn.fromPort} <-> ${conn.toPort} (R=${conn.resistance})`);
        addSegment(conn.fromPort, conn.toPort, conn.resistance);
    });

    console.log("Network graph built:", graph);
    return graph;
}

// === SECTION: Pressure Solver ===
function solvePressures(graph) {
    console.log("Solving for pressures...");
    const nodeIds = Object.keys(graph.nodes);
    const unknownNodeIds = nodeIds.filter(id => graph.nodes[id].pressure === undefined);
    // const knownNodeIds = nodeIds.filter(id => graph.nodes[id].pressure !== undefined);

    if (unknownNodeIds.length === 0) {
        console.log("No unknown pressures to solve. All nodes have known pressures.");
        // Create a pressure map directly from graph.nodes
        const pressures = {};
        nodeIds.forEach(id => { pressures[id] = { ...graph.nodes[id] }; }); // Return node objects with pressure
        return pressures;
    }
    if (Object.keys(graph.segments).length === 0 && unknownNodeIds.length > 0) {
        console.warn("Cannot solve: No segments defined in the graph, but unknown nodes exist.");
        // alert("Cannot solve: No connections found.") // OLD
        showNotification("Cannot simulate: No connections found in the network.", 'error'); // NEW // Note: Depends on showNotification
        return null;
    }

    const n = unknownNodeIds.length;
    const nodeIndexMap = new Map(unknownNodeIds.map((id, i) => [id, i]));
    console.log("Unknown nodes:", unknownNodeIds);
    console.log("Node index map:", nodeIndexMap);

    // Initialize matrices A (conductance) and B (current sources)
    const A = math.zeros(n, n); // Note: Depends on math.js library
    const B = math.zeros(n); // Note: Depends on math.js library

    // Build the matrices based on KCL for each unknown node
    unknownNodeIds.forEach((nodeId, i) => {
        let diagSum = 0;
        const neighbors = graph.adj[nodeId] || [];
        if (neighbors.length === 0 && !graph.nodes[nodeId].pressure) { // Check if it truly is isolated and unknown
             console.warn(`Node ${nodeId} has no neighbors and unknown pressure. System might be ill-conditioned.`);
             // Setting diag to 1 and B to 0 forces pressure to 0 for this isolated node
             // This prevents NaN/Infinity issues later but might hide modeling errors.
             A.set([i, i], 1);
             B.set([i], 0);
             return; // Skip KCL for this isolated node
        }
        neighbors.forEach(neighborId => {
            const segmentId = getSegmentId(nodeId, neighborId);
            const segment = graph.segments[segmentId];
            // Check if the segment exists (it might have been skipped due to bad resistance)
            if (!segment) {
                return; // Skip if segment doesn't exist
            }
            const conductance = 1.0 / segment.resistance;
            diagSum += conductance;

            if (graph.nodes[neighborId]?.pressure !== undefined) {
                // Known pressure neighbor - contributes to B vector
                const knownPressure = graph.nodes[neighborId].pressure;
                B.set([i], B.get([i]) + conductance * knownPressure);
        } else {
                // Unknown pressure neighbor - contributes to A matrix (off-diagonal)
                const j = nodeIndexMap.get(neighborId);
                if (j !== undefined) {
                    A.set([i, j], A.get([i, j]) - conductance);
                } else {
                     console.warn(` Neighbor ${neighborId} of ${nodeId} is unknown but not in index map.`);
                }
            }
        });
        // Set diagonal element of A matrix only if it wasn't set for isolation
         if (neighbors.length > 0 || graph.nodes[nodeId].pressure !== undefined) {
             A.set([i, i], diagSum);
         }
    });

    console.log("Matrix A:", A.toArray ? A.toArray() : A);
    console.log("Vector B:", B.toArray ? B.toArray() : B);

    // --- Check for zero rows/columns or zero diagonal elements in A --- //
    let matrixOk = true;
    for (let i = 0; i < n; i++) {
        if (math.abs(A.get([i, i])) < 1e-15) { // Check diagonal element
             console.error(`Matrix A has near-zero diagonal at index ${i} (Node: ${unknownNodeIds[i]}). System may be singular (check for isolated nodes/networks).`);
             matrixOk = false;
             break;
        }
    }

    if (!matrixOk) {
         // alert("Failed to solve: Network appears to have isolated parts or errors (zero diagonal in matrix). Please check connections."); // OLD
         showNotification("Simulation failed: Network might have isolated parts or errors. Check connections.", 'error'); // NEW // Note: Depends on showNotification
         return null;
    }
    // --- End Matrix Check --- //

    // Solve Ax = B for x (the unknown pressures)
    let solvedPressuresVector;
    try {
        const lu = math.lup(A); // Note: Depends on math.js library
        solvedPressuresVector = math.lusolve(lu, B); // Note: Depends on math.js library
        console.log("Solved pressures vector:", solvedPressuresVector.toArray ? solvedPressuresVector.toArray() : solvedPressuresVector);
    } catch (error) {
        console.error("Error solving linear system with math.lusolve:", error);
        if (error.message && error.message.includes("singular")) {
            // alert("Failed to solve: The network configuration seems unstable or disconnected (singular matrix). Please check connections, especially to outlets."); // OLD
            showNotification("Simulation failed: Network unstable or disconnected. Check connections, especially to outlets.", 'error'); // NEW // Note: Depends on showNotification
        } else {
            // alert("An error occurred during the simulation calculation. Check console for details."); // OLD
            showNotification("An error occurred during simulation. Check console for details.", 'error'); // NEW // Note: Depends on showNotification
        }
        return null; // Indicate failure
    }

    // Update the graph nodes with solved pressures
    const allPressures = {};
    nodeIds.forEach(id => { // Initialize with all nodes
        allPressures[id] = { ...graph.nodes[id] }; // Copy node info
    });
    unknownNodeIds.forEach((nodeId, i) => {
        let pressureValue = solvedPressuresVector.get([i, 0]);
        if (typeof pressureValue === 'object' && pressureValue.isComplex) {
             console.warn(`Node ${nodeId} solved pressure is complex: ${pressureValue}. Using real part.`);
             pressureValue = pressureValue.re;
        }
        if (!isFinite(pressureValue)) {
             console.error(`Node ${nodeId} solved pressure is not finite: ${pressureValue}. Setting to NaN.`);
             pressureValue = NaN;
        }
        allPressures[nodeId].pressure = pressureValue;
    });

    console.log("All node pressures calculated:", allPressures);
    return allPressures;
}

// === SECTION: Flow Calculation ===
function calculateFlows(graph, pressures) {
    console.log("Calculating flows...");
    const flows = {};
    if (!pressures) {
        console.error("Cannot calculate flows: pressures object is null.");
        return {};
    }
    for (const segmentId in graph.segments) {
        const segment = graph.segments[segmentId];
        const node1Id = segment.node1;
        const node2Id = segment.node2;

        const p1Node = pressures[node1Id];
        const p2Node = pressures[node2Id];

        if (p1Node?.pressure === undefined || p2Node?.pressure === undefined) {
            console.warn(`Cannot calculate flow for segment ${segmentId}: Missing pressure for node ${p1Node?.pressure === undefined ? node1Id : node2Id}.`);
            continue;
        }

        const p1 = p1Node.pressure;
        const p2 = p2Node.pressure;

        if (!isFinite(p1) || !isFinite(p2)) {
            console.warn(`Cannot calculate flow for segment ${segmentId}: Non-finite pressure (P1=${p1}, P2=${p2}).`);
             flows[segmentId] = {
                 flow: NaN,
                 from: node1Id,
                 to: node2Id
             };
            continue;
        }

        const deltaP = p1 - p2;
        const resistance = segment.resistance;
        // Avoid division by zero if resistance is somehow invalid here
        if(resistance === 0) {
            console.warn(`Segment ${segmentId} has zero resistance. Flow calculation skipped.`);
             flows[segmentId] = {
                 flow: NaN, // Or Infinity? NaN seems safer.
                 from: node1Id,
                 to: node2Id
             };
             continue;
        }
        const flowRate = deltaP / resistance; // Q = (P1 - P2) / R

        flows[segmentId] = {
            flow: flowRate,
            from: flowRate >= 0 ? node1Id : node2Id,
            to: flowRate >= 0 ? node2Id : node1Id
        };
    }
    console.log("Calculated flows:", flows);
    return flows;
}

// === SECTION: Simulation Runner ===
function runFluidSimulation() {
    console.log("--- Starting Fluid Simulation ---");
    clearSimulationVisuals(); // Clear previous results first // Note: Depends on clearSimulationVisuals

    // --- Build Graph and Check Connectivity --- //
    const graph = buildNetworkGraph();
    if (!graph || Object.keys(graph.nodes).length === 0) {
        console.error("Failed to build network graph or graph is empty.");
        showNotification("Cannot simulate: Network graph could not be built. Add components and connections.", 'error'); // Note: Depends on showNotification
        return;
    }

    // --- NEW: Check Pump-Outlet Connectivity using BFS --- // 
    const pumpPortIds = Object.entries(graph.nodes)
                            .filter(([id, node]) => node.type === 'pump')
                            .map(([id]) => id);
    const outletPortIds = new Set(Object.entries(graph.nodes)
                                  .filter(([id, node]) => node.type === 'outlet')
                                  .map(([id]) => id));

    let outletReachable = false;
    const visited = new Set();
    const queue = [...pumpPortIds]; // Start BFS from all pump ports
    pumpPortIds.forEach(id => visited.add(id));

    while (queue.length > 0) {
        const currentId = queue.shift();

        if (outletPortIds.has(currentId)) {
            outletReachable = true;
            break; // Found a path to an outlet
        }

        const neighbors = graph.adj[currentId] || [];
        neighbors.forEach(neighborId => {
            if (!visited.has(neighborId)) {
                visited.add(neighborId);
                queue.push(neighborId);
            }
        });
    }

    if (!outletReachable) {
        console.error("Simulation cancelled: No connected path found between pump and outlet.");
        showNotification("Cannot simulate: No complete path found from a pump to an outlet.", 'warning'); // Note: Depends on showNotification
        return; // Stop simulation
    }
    // --- END CONNECTIVITY CHECK ---

    // --- Pressure Source Check (Original logic remains) --- //
    const hasKnownPressure = Object.values(graph.nodes).some(node => node.pressure !== undefined);
    if (!hasKnownPressure) {
        console.error("Simulation requires at least one pump pressure set or an outlet.");
        showNotification("Cannot simulate: Set at least one pump pressure or add an outlet.", 'warning'); // Note: Depends on showNotification
        return;
    }

    // --- Proceed with Solving --- //
    const solvedPressures = solvePressures(graph);
    if (!solvedPressures) {
        console.error("Failed to solve for pressures.");
        // Alert already shown in solvePressures if it fails
        return;
    }

    const calculatedFlows = calculateFlows(graph, solvedPressures);

    // Store results (only the pressure value)
    simulationResults.pressures = {};
    for(const nodeId in solvedPressures) {
        if (solvedPressures[nodeId]?.pressure !== undefined) {
             simulationResults.pressures[nodeId] = solvedPressures[nodeId].pressure;
        }
    }
    simulationResults.flows = calculatedFlows;

    console.log("--- Simulation Complete ---");
    console.log("Final Pressures (Pa):", simulationResults.pressures);
    console.log("Final Flows (m³/s):", simulationResults.flows);

    visualizeSimulationResults(); // Visualize the results // Note: Depends on visualizeSimulationResults

    // --- NEW: Button Feedback --- //
    const simButton = document.getElementById('run-simulation-btn');
    if (simButton) {
        const originalText = simButton.textContent;
        const originalBgColor = simButton.style.backgroundColor; // Get original inline style if any
        const originalCssBgColor = window.getComputedStyle(simButton).backgroundColor; // Get computed style

        simButton.textContent = '✓ Complete';
        simButton.style.backgroundColor = '#28a745'; // Success green

             setTimeout(() => {
            simButton.textContent = originalText;
            // Restore original background color more robustly
            simButton.style.backgroundColor = originalBgColor || ''; // Reset inline style or set to original inline
            // If there was no inline style, CSS rule will take over. If there was, restore it.
        }, 1500); // Revert after 1.5 seconds
    }
    // --- END NEW --- //

    // REMOVED: alert("Simulation complete! Visualization updated. Check console for detailed results.");
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