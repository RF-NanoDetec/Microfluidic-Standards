// === SECTION: Simulation Visualization ===
function clearSimulationVisuals() {
    // Clear all simulation-related visuals including dots
    layer.find('.simulation-label').forEach(label => { // Note: Depends on Konva layer variable
        label.destroy();
    });

    // Explicitly find and remove port dots (orange simulation dots)
    layer.find('.port-dot').forEach(dot => { // Note: Depends on Konva layer variable
        dot.destroy();
    });

    // Reset tube colors
    layer.find('._tube').forEach(tube => {
        // use default channel colors for reset
        tube.stroke(channelFillColor);
        const outline = layer.findOne('#' + tube.id().replace('_tube', '_outline')); // Note: Depends on Konva layer variable
        if (outline) outline.stroke(channelOutlineColor);
    });

    // Reset internal channel colors
    layer.find('.internalChannelFill').forEach(channel => {
        // Reset stroke color for all internal channels (straight, meander, etc.)
        channel.stroke(channelFillColor);
    });

    // Reset internal segment colors
    layer.find('.internalSegmentFill').forEach(segmentLine => { // Note: Depends on Konva layer variable
        segmentLine.stroke(channelFillColor);
    });

    // Hide the simulation summary box
    const summaryBox = document.getElementById('simulation-summary-box');
    if (summaryBox) {
        summaryBox.style.display = 'none';
    }

    layer.draw(); // Note: Depends on Konva layer variable
}

function getRelativeFlowColor(flowRateUlMin, maxFlowUlMin) {
    // Define the color gradient points with more stops for better visualization
    const colorStops = [
        { norm: 0, color: '#e0e0e0' },    // No flow - light gray
        { norm: 0.1, color: '#a0d8ef' },  // Very low flow - light blue
        { norm: 0.3, color: '#4dabf7' },  // Low flow - medium blue
        { norm: 0.5, color: '#1c7ed6' },  // Medium flow - blue
        { norm: 0.7, color: '#1864ab' },  // High flow - dark blue
        { norm: 0.9, color: '#0c4b8e' },  // Very high flow - darker blue
        { norm: 1.0, color: '#003366' }   // Max flow - darkest blue
    ];

    // Handle zero or near-zero max flow
    if (maxFlowUlMin <= 1e-9) {
        return colorStops[0].color; // Return 'no flow' color
    }

    // Calculate normalized flow (0 to 1) with logarithmic scaling for better visualization
    const normalizedFlow = Math.min(1, Math.max(0, Math.abs(flowRateUlMin) / maxFlowUlMin));

    // Find the two stops the normalized flow falls between
    for (let i = 0; i < colorStops.length - 1; i++) {
        if (normalizedFlow <= colorStops[i + 1].norm) {
            const lowerStop = colorStops[i];
            const upperStop = colorStops[i + 1];
            // Interpolate between the two stops
            const t = (normalizedFlow - lowerStop.norm) / (upperStop.norm - lowerStop.norm);
            // Ensure t is valid even with floating point inaccuracies near boundaries
            const factor = Math.max(0, Math.min(1, t));
            return interpolateColor(lowerStop.color, upperStop.color, factor);
        }
    }

    // If flow exceeds max (shouldn't happen with clamping), return max color
    return colorStops[colorStops.length - 1].color;
}

// Helper function to interpolate between two hex colors
function interpolateColor(color1, color2, factor) {
    // Convert hex to RGB
    const r1 = parseInt(color1.substring(1, 3), 16);
    const g1 = parseInt(color1.substring(3, 5), 16);
    const b1 = parseInt(color1.substring(5, 7), 16);

    const r2 = parseInt(color2.substring(1, 3), 16);
    const g2 = parseInt(color2.substring(3, 5), 16);
    const b2 = parseInt(color2.substring(5, 7), 16);

    // Interpolate
    const r = Math.round(r1 + (r2 - r1) * factor);
    const g = Math.round(g1 + (g2 - g1) * factor);
    const b = Math.round(b1 + (b2 - b1) * factor);

    // Convert back to hex
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function visualizeSimulationResults() {
    console.log("Visualizing simulation results...");
    // clearSimulationVisuals() is called at the start of runFluidSimulation

    // REMOVED Redundant hiding logic - should happen in clearSimulationVisuals
    // layer.find('.connectionPort').forEach(port => {
    //     port.visible(false);  // Hide the blue connection dots
    // });

    const { pressures, flows } = simulationResults; // Note: Depends on simulationResults variable
    // const mbarToPascal = 100; // <<< MOVED TO CONSTANTS
    const microLitersPerMinuteFactor = 6e+7; // <<< MOVED TO CONSTANTS

    // --- Calculate Max Absolute Flow Rate ---
    let maxFlowUlMin = 0;
    for (const segmentId in flows) {
        const flowData = flows[segmentId];
        if (isFinite(flowData.flow)) {
            maxFlowUlMin = Math.max(maxFlowUlMin, Math.abs(flowData.flow * microLitersPerMinuteFactor));
        }
    }
    console.log("Maximum calculated flow rate (abs):", maxFlowUlMin, "µL/min");

    // 1. Visualize all flows (color channels and tubes using RELATIVE color)
    for (const segmentId in flows) {
        const flowData = flows[segmentId];
        const flowRateM3ps = flowData.flow;
        if (!isFinite(flowRateM3ps)) continue;

        const flowRateUlMin = flowRateM3ps * microLitersPerMinuteFactor;

        // --- Refactored Element Finding and Typing Logic ---
        let visualElement = null;
        let elementType = null; // 'tube', 'straight-channel', 'meander-channel', 'tx-segment'

        // Try finding internal T/X segment line first
        visualElement = layer.findOne('#' + segmentId); // Note: Depends on Konva layer variable
        if (visualElement && visualElement.name() === 'internalSegmentFill') {
            elementType = 'tx-segment';
        }

        // Try finding external tube
        if (!visualElement) {
            const nodeIds = segmentId.split('--');
            if (nodeIds.length === 2) {
                const conn = connections.find(c => (c.fromPort === nodeIds[0] && c.toPort === nodeIds[1]) || (c.fromPort === nodeIds[1] && c.toPort === nodeIds[0])); // Note: Depends on connections array
                if (conn) {
                    visualElement = layer.findOne('#' + conn.lineId + '_tube'); // Note: Depends on Konva layer variable
                    if (visualElement) elementType = 'tube';
                }
            }
        }

        // Try finding straight/meander internal channel
        if (!visualElement) {
            const nodeIds = segmentId.split('--');
            if (nodeIds.length === 2) {
                const portId = nodeIds[0]; // Use the first port ID from the segment
                const portShape = stage.findOne('#' + portId); // Note: Depends on Konva stage variable

                if (portShape) {
                    const mainGroupId = portShape.getAttr('mainGroupId'); // Get the ID of the main chip group
                    if (mainGroupId) {
                        const chipGroup = stage.findOne('#' + mainGroupId); // Note: Depends on Konva stage variable

                        if (chipGroup) {
                            const chipType = chipGroup.getAttr('chipType');
                            if (chipType === 'straight' || chipType === 'meander') {
                                // Find the channel fill element within the CORRECT chip group
                                visualElement = chipGroup.findOne('.internalChannelFill');
                                if (visualElement) {
                                    elementType = (chipType === 'straight') ? 'straight-channel' : 'meander-channel';

                                    // Ensure outline exists, but DO NOT change its Z-order here
                                    const outlineElement = chipGroup.findOne('.channelOutline');
                                    // if (outlineElement) {
                                    //     // No Z-order changes needed here - rely on creation order
                                    // }
                                } else {
                                    console.warn(`[Visualize] Found ${chipType} chip ${mainGroupId} but could not find .internalChannelFill`);
                                }
                            } // else: chipType is not straight or meander
                        } else {
                            console.warn(`[Visualize] Could not find chip group with ID: ${mainGroupId}`);
                        }
                    } else {
                         console.warn(`[Visualize] Port ${portId} is missing mainGroupId attribute.`);
                    }
                } else {
                     console.warn(`[Visualize] Could not find port shape with ID: ${portId}`);
                }
            }
        }
        // --- End Refactored Element Finding ---

        // --- Apply colors based on elementType and flow rate ---
        if (visualElement) {
            // Determine color based on flow (or base color if flow is negligible)
            const flowColor = (Math.abs(flowRateM3ps) > 1e-15)
                              ? getRelativeFlowColor(flowRateUlMin, maxFlowUlMin)
                              : getRelativeFlowColor(0, maxFlowUlMin); // Base color for zero/low flow

            console.log(`Applying color ${flowColor} to ${elementType} for flow ${flowRateUlMin.toFixed(2)} µL/min`);

            switch (elementType) {
                case 'tube':
                    // Apply to stroke for tubes
                    visualElement.stroke(flowColor);
                    // Keep tube outline gray
                    const outline = layer.findOne('#' + visualElement.id().replace('_tube', '_outline')); // Note: Depends on Konva layer variable
                    if (outline) outline.stroke('#555555');
                    console.log(`[Debug Visualize] Tube ${visualElement.id()} stroke set to ${flowColor}`);
                    break;
                case 'meander-channel':
                    // For meander channels, we need to update the stroke color
                    if (visualElement instanceof Konva.Line) {
                        console.log(`[Debug Visualize] Meander ${segmentId}: Targeting element`, visualElement);
                        console.log(`[Debug Visualize] Meander ${segmentId}: Current stroke: ${visualElement.stroke()}`);
                        visualElement.stroke(flowColor);
                        console.log(`[Debug Visualize] Meander ${segmentId}: Attempted stroke set to ${flowColor}. New stroke: ${visualElement.stroke()}`);
                        // NO moveToTop() - rely on creation order
                    } else {
                        console.warn(`[Visualize] Expected Konva.Line for meander-channel ${segmentId}, got:`, visualElement);
                    }
                    break;
                case 'straight-channel':
                    // For straight channels (now lines), we update the stroke color
                    if (visualElement instanceof Konva.Line) { // Check for Line
                        console.log(`[Debug Visualize] Straight ${segmentId}: Targeting element`, visualElement);
                        console.log(`[Debug Visualize] Straight ${segmentId}: Current stroke: ${visualElement.stroke()}`); // Check stroke
                        visualElement.stroke(flowColor); // USE STROKE
                        console.log(`[Debug Visualize] Straight ${segmentId}: Attempted stroke set to ${flowColor}. New stroke: ${visualElement.stroke()}`); // Log stroke
                        // NO moveToTop() - rely on creation order
                    } else {
                        console.warn(`[Visualize] Expected Konva.Line for straight-channel ${segmentId}, got:`, visualElement); // Updated warning
                    }
                    break;
                case 'tx-segment':
                    // For T and X junction segments, update the stroke
                     console.log(`[Debug Visualize] TX Segment ${segmentId}: Targeting element`, visualElement);
                     console.log(`[Debug Visualize] TX Segment ${segmentId}: Current stroke: ${visualElement.stroke()}`);
                    visualElement.stroke(flowColor);
                     console.log(`[Debug Visualize] TX Segment ${segmentId}: Attempted stroke set to ${flowColor}. New stroke: ${visualElement.stroke()}`);
                    break;
                default:
                    console.warn(`[Visualize] Unknown element type for coloring: ${elementType}, segmentId: ${segmentId}`);
            }

            // Force a redraw of the element and its parent group
            visualElement.draw();
            const group = visualElement.getParent();
            if (group) group.draw();
        } else {
            // Only log if the flow is significant, otherwise missing elements might just be disconnected parts
            if (Math.abs(flowRateM3ps) > 1e-15) {
                console.warn(`[Visualize] Could not find visual element for segmentId: ${segmentId}`);
            }
        }
    }

    // 2. Move all external tube paths to the bottom
    connections.forEach(conn => { // Note: Depends on connections array
        const tubePath = layer.findOne('#' + conn.lineId + '_tube'); // Note: Depends on Konva layer variable
        const outlinePath = layer.findOne('#' + conn.lineId + '_outline'); // Note: Depends on Konva layer variable
        if (tubePath) tubePath.moveToBottom();
        if (outlinePath) outlinePath.moveToBottom();
    });

    // Calculate simulation summary data
    let totalFlow = 0, simMaxFlow = 0, minPressure = Infinity, maxPressure = -Infinity, activeSegments = 0;
    Object.values(flows).forEach(flow => {
        if (isFinite(flow.flow)) {
            const absFlow = Math.abs(flow.flow);
            totalFlow += absFlow;
            simMaxFlow = Math.max(simMaxFlow, absFlow);
            activeSegments++;
        }
    });
    Object.values(pressures).forEach(pressure => {
        if (isFinite(pressure)) {
            minPressure = Math.min(minPressure, pressure);
            maxPressure = Math.max(maxPressure, pressure);
        }
    });

    // Update the simulation summary in the sidebar
    const summaryBox = document.getElementById('simulation-summary-box');
    const summaryContent = document.getElementById('simulation-summary-content');

    if (summaryBox && summaryContent) {
        // Show the summary box
        summaryBox.style.display = 'block';

        // --- MODIFIED: Update numerical summary content ---
        // Clear existing summary items first
        summaryContent.querySelectorAll('.summary-item, .simulation-description').forEach(item => item.remove()); // Also remove old description

        // Prepend the new summary items with improved structure
        const summaryHtml = `
            <div class="summary-item">
                <span class="summary-label">Active Segments:</span>
                <span class="summary-value">${activeSegments}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Max Flow:</span>
                <span class="summary-value">${(simMaxFlow * microLitersPerMinuteFactor).toFixed(2)} µL/min</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Pressure Range:</span>
                <span class="summary-value">${(minPressure / MBAR_TO_PASCAL).toFixed(1)} to ${(maxPressure / MBAR_TO_PASCAL).toFixed(1)} mbar</span>
            </div>
        `;
        summaryContent.insertAdjacentHTML('afterbegin', summaryHtml);

        // --- NEW: Add Simulation Description ---
        const descriptionHtml = `
            <div class="simulation-description">
                 <p>Steady-state pressure-driven flow simulation (laminar).</p>
            </div>
        `;
        // Append description after the legend (assuming legend is already in HTML)
        const legendElement = summaryContent.querySelector('.legend-container'); // Assuming legend has this wrapper class
        if (legendElement) {
            legendElement.insertAdjacentHTML('afterend', descriptionHtml);
        } else {
            // Fallback: Append to the end of the content if legend container not found
            summaryContent.insertAdjacentHTML('beforeend', descriptionHtml);
             console.warn("Could not find '.legend-container' to place description after. Appending to end.");
        }
        // --- END NEW ---


        // --- Update HTML Flow Legend (Assuming structure from CSS suggestion) --- //
        // Ensure your HTML for the legend looks something like this:
        /*
        <div class="legend-container">
            <div class="legend-title">Flow Rate (µL/min)</div>
            <div class="flow-legend">
                <div class="gradient-bar"></div>
                <div class="legend-labels">
                    <span class="max-label"></span> <!- Populated by JS ->
                    <span class="mid-label"></span> <!- Populated by JS ->
                    <span class="zero-label">0.00</span>
                </div>
            </div>
        </div>
        */
        const gradientBar = summaryContent.querySelector('.gradient-bar');
        const maxLabel = summaryContent.querySelector('.max-label');
        const midLabel = summaryContent.querySelector('.mid-label'); // Using mid label again

        if (gradientBar && maxLabel && midLabel) {
            // Update Gradient Bar Background
            const colorStop0 = getRelativeFlowColor(maxFlowUlMin * 1.0, maxFlowUlMin);
            const colorStop1 = getRelativeFlowColor(maxFlowUlMin * 0.9, maxFlowUlMin);
            const colorStop3 = getRelativeFlowColor(maxFlowUlMin * 0.7, maxFlowUlMin);
            const colorStop5 = getRelativeFlowColor(maxFlowUlMin * 0.5, maxFlowUlMin);
            const colorStop7 = getRelativeFlowColor(maxFlowUlMin * 0.3, maxFlowUlMin);
            const colorStop9 = getRelativeFlowColor(maxFlowUlMin * 0.1, maxFlowUlMin);
            const colorStop10 = getRelativeFlowColor(0, maxFlowUlMin);
            gradientBar.style.background = `linear-gradient(to bottom,
                ${colorStop0} 0%,
                ${colorStop1} 10%,
                ${colorStop3} 30%,
                ${colorStop5} 50%,
                ${colorStop7} 70%,
                ${colorStop9} 90%,
                ${colorStop10} 100%)`;

            // Update Labels
            const maxFlowText = maxFlowUlMin.toFixed(maxFlowUlMin >= 1 ? 1 : 2);
            const midFlowText = (maxFlowUlMin / 2).toFixed(maxFlowUlMin >= 2 ? 1 : 2);
            maxLabel.textContent = maxFlowText;
            midLabel.textContent = midFlowText; // Update mid label
            // Zero label is static HTML
        } else {
            console.error("Could not find all required HTML legend elements (.gradient-bar, .max-label, .mid-label) to update.");
        }
        // --- END Update HTML Flow Legend --- //

    } else {
        console.error("Simulation summary box or content container not found!");
    }

    // 4. Add/Update the dots
    layer.find('.connectionPort').forEach(port => { // Note: Depends on Konva layer variable
        const portGroup = port.getParent();
        if (!portGroup) return;

        // Remove existing orange simulation dot for this port if it exists
        portGroup.find('.port-dot').forEach(dot => dot.destroy());

        // --- Check port details ---
        const portId = port.id();
        const mainGroupId = port.getAttr('mainGroupId');
        const componentGroup = stage.findOne('#' + mainGroupId); // Note: Depends on Konva stage variable
        const componentType = componentGroup?.getAttr('chipType');
        const isPumpPort = (componentType === 'pump');
        const isOutletPort = (componentType === 'outlet');
        const isConnected = connections.some(conn => conn.fromPort === portId || conn.toPort === portId); // Note: Depends on connections array
        const shouldAddOrangeDot = !isPumpPort || isConnected; // Add dot if it's NOT a pump OR if it IS a pump AND is connected

        if (shouldAddOrangeDot) { // Only add orange simulation dot if the condition is met
            const originalRadius = 4; // <<< Increased base radius
            const hoverRadius = 6; // <<< Increased hover radius

            const dot = new Konva.Circle({
                x: port.x(),
                y: port.y(),
                radius: originalRadius, // <<< Use original radius
                fill: '#FF5722',
                stroke: 'black', // <<< Changed stroke to black
                strokeWidth: 1, // <<< Adjusted stroke width to 1
                name: 'port-dot simulation-label',
                listening: true, // Only listening for hover if the orange dot is present
                id: portId + '_simdot' // <<< Unique ID for this port's simulation dot
            });

            // --- MODIFIED: Add hover effects ---
            dot.on('mouseover', () => {
                document.body.style.cursor = 'pointer';
                dot.radius(hoverRadius); // Enlarge dot
                layer.batchDraw(); // Redraw layer // Note: Depends on Konva layer variable
                showNodeDetails(portId);
            });
            dot.on('mouseout', () => {
                document.body.style.cursor = 'default';
                dot.radius(originalRadius); // Reset dot size
                layer.batchDraw(); // Redraw layer // Note: Depends on Konva layer variable
                hideNodeDetails();
            });
            // --- END MODIFICATION ---

            // --- NEW: Add dot to layer instead of portGroup ---
            layer.add(dot); // Note: Depends on Konva layer variable
            // Position dot absolutely based on port's absolute position
            const absPos = port.getAbsolutePosition();
            dot.position(absPos);
            // Ensure dot is at the very top of the layer
            dot.moveToTop();
        }

        // --- NEW: Hide port visuals after simulation ---
        // Hide inner grey connection port ONLY for outlets and unconnected pump ports
        // if (isOutletPort || (isPumpPort && !isConnected)) {
        //     port.visible(false); // Hide inner connection circle
        // } else {
        //     // Ensure inner port is visible if it shouldn't be hidden
        //     port.visible(true);
        // } // REMOVED BLOCK END
        // The blue connectionPort dot should remain hidden after simulation,
        // as clearSimulationVisuals() already hid it. Only orange port-dots are shown.

    });

    // 5. Final draw (Konva layer)
    layer.draw(); // Note: Depends on Konva layer variable
    console.log("Visualization updated with relative colors. Legend updated in sidebar.");
}


// === SECTION: Node Details Popups ===
function showNodeDetails(nodeId) {
    // Remove any existing details panel
    hideNodeDetails();

    const { pressures, flows } = simulationResults; // Note: Depends on simulationResults variable
    // const mbarToPascal = 100; // <<< MOVED TO CONSTANTS
    const microLitersPerMinuteFactor = 6e+7; // <<< MOVED TO CONSTANTS

    // Get pressure at this node
    const pressurePa = pressures[nodeId];
    if (pressurePa === undefined || !isFinite(pressurePa)) {
        console.warn(`No valid pressure for node ${nodeId}`);
        return;
    }

    const pressureMbar = pressurePa / MBAR_TO_PASCAL;

    // Find the port shape and its parent component type
    const portShape = stage.findOne('#' + nodeId); // Note: Depends on Konva stage variable
    if (!portShape) {
        console.warn(`Could not find port shape for node ${nodeId}`);
        return;
    }
    // --- CORRECTED LOGIC ---
    // Get the ID of the main draggable group from the port's attribute
    const mainComponentId = portShape.getAttr('mainGroupId');
    if (!mainComponentId) {
        console.error(`[showNodeDetails] Port ${nodeId} is missing the 'mainGroupId' attribute!`);
        return;
    }
    // Find the main component group using its ID
    const componentGroup = stage.findOne('#' + mainComponentId); // Note: Depends on Konva stage variable
    if (!componentGroup) {
        console.error(`[showNodeDetails] Could not find main component group with ID: ${mainComponentId}`);
        return;
    }
    const componentType = componentGroup.getAttr('chipType'); // Get type from the correct group
    // --- END CORRECTED LOGIC ---

    // --- DEBUG LOGGING ---
    console.log(`[showNodeDetails] Hovered node: ${nodeId}`);
    console.log(`[showNodeDetails] Found main component group (ID: ${mainComponentId}):`, componentGroup); // Log the group object
    console.log(`[showNodeDetails] Determined componentType: ${componentType}`);
    // --- END DEBUG LOGGING ---


    // Calculate total absolute flow rate connected to the node
    let totalAbsoluteFlowM3ps = 0;
    for (const segmentId in flows) {
        const flowData = flows[segmentId]; // {flow, from, to}
        // Check if connected to nodeId AND flow is finite and significant
        if ((flowData.from === nodeId || flowData.to === nodeId) && isFinite(flowData.flow) && Math.abs(flowData.flow) > 1e-15) {
            totalAbsoluteFlowM3ps += Math.abs(flowData.flow);
        }
    }

    // Determine the correct flow value and label based on component type
    let displayFlowM3ps;
    let flowLabel;

    if (componentType === 'pump') {
        displayFlowM3ps = totalAbsoluteFlowM3ps; // Total flow leaving this pump port
        flowLabel = 'Pump Output:';
    } else if (componentType === 'outlet') {
        displayFlowM3ps = totalAbsoluteFlowM3ps; // Total flow entering this outlet port
        flowLabel = 'Outlet Input:';
    } else {
        // For all other nodes (junctions, connections between chips), calculate throughput
        displayFlowM3ps = totalAbsoluteFlowM3ps / 2.0;
        flowLabel = 'Throughput:';
    }

    const displayFlowULMin = displayFlowM3ps * microLitersPerMinuteFactor;

    // Get the port position
    const portPos = portShape.getAbsolutePosition();

    // Create details panel
    const detailsGroup = new Konva.Group({
        x: portPos.x + 20,
        y: portPos.y - 40, // Adjusted Y position slightly
        name: 'node-details'
    });

    // Fixed panel height
    const panelHeight = 70;
    const bg = new Konva.Rect({
        x: 0,
        y: 0,
        width: 160, // Adjusted width slightly if needed for longer labels
        height: panelHeight,
        fill: 'rgba(255, 255, 255, 0.95)',
        stroke: '#333',
        cornerRadius: 5,
        shadowColor: 'black',
        shadowBlur: 5,
        shadowOpacity: 0.2
    });
    detailsGroup.add(bg);

    // Title
    // --- MODIFIED: Dynamic Title ---
    let panelTitle = 'Port Details'; // Default
    const genericPortId = portShape.getAttr('portId'); // Get the generic ID like 'pump_right1', 't_top', 'outlet_top_in'

    if (componentType === 'pump') {
        // Find the index of this port within the pump component
        const pumpPorts = componentGroup.find('.connectionPort');
        const portIndex = pumpPorts.findIndex(p => p.id() === nodeId);
        if (portIndex !== -1) {
            panelTitle = `Pump Port ${portIndex + 1}`;
        } else {
            panelTitle = 'Pump Port (Unknown)';
        }
    } else if (componentType === 'outlet') {
        panelTitle = getComponentDisplayName('outlet'); // "Flow Outlet" // Note: Depends on getComponentDisplayName
    } else if (genericPortId) {
        // Format generic chip port IDs (e.g., 'straight_left' -> 'Left Port')
        const parts = genericPortId.split('_');
        if (parts.length > 1) {
             // Capitalize the direction part and add "Port"
             panelTitle = parts.slice(1).map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ') + ' Port';
        } else {
            // Fallback if format is unexpected
            panelTitle = genericPortId.charAt(0).toUpperCase() + genericPortId.slice(1) + ' Port';
        }
    }
    // --- END MODIFICATION ---

    const title = new Konva.Text({
        x: 10,
        y: 10,
        text: panelTitle, // Use the dynamic title
        fontSize: 12,
        fontFamily: 'Arial',
        fill: '#333',
        fontWeight: 'bold'
    });
    detailsGroup.add(title);

    // Pressure
    const pressureText = new Konva.Text({
        x: 10,
        y: 30,
        text: `Pressure: ${pressureMbar.toFixed(1)} mbar`,
        fontSize: 10,
        fontFamily: 'Arial',
        fill: '#333'
    });
    detailsGroup.add(pressureText);

    // Display the calculated flow value with the appropriate label
    const flowText = new Konva.Text({
        x: 10,
        y: 48, // Adjusted Y position
        text: `${flowLabel} ${displayFlowULMin.toFixed(2)} µL/min`, // Use dynamic label
        fontSize: 10,
        fontFamily: 'Arial',
        fill: '#333'
    });
    detailsGroup.add(flowText);

    layer.add(detailsGroup); // Note: Depends on Konva layer variable
    layer.draw(); // Note: Depends on Konva layer variable
}

// Function to hide the details panel
function hideNodeDetails() {
    layer.find('.node-details').forEach(el => el.destroy()); // Note: Depends on Konva layer variable
    layer.draw(); // Note: Depends on Konva layer variable
}

// === SECTION: Flow Pathfinding & Highlighting (Pre-Simulation) ===
// Moved from app.js
// Dependencies: clearSimulationVisuals, stage, layer, connections, Konva, getInternalNodeId, getSegmentId, flowHighlightColor, channelOutlineColor
function findFlowPathAndHighlight() {
    console.log("Updating flow visualization (Pump Reachability)...");

    // Reset all visual elements to non-highlighted state using the function in this file
    clearSimulationVisuals(); // <<< CHANGED from resetAllVisualElements

    // 1. Identify Start (Pump) Ports
    const pumpPorts = new Set();
    // console.log("[Port Check] Starting port identification..."); // Optional debug log
    stage.find('.connectionPort').forEach(port => {
        const mainGroupId = port.getAttr('mainGroupId');
        if (!mainGroupId) { return; }
        const mainGroup = stage.findOne('#' + mainGroupId);
        if (!mainGroup) { return; }
        const groupType = mainGroup.getAttr('chipType');
        if (groupType === 'pump') {
            // console.log(`[Port Check] -> ADDING Pump Port: ${port.id()}`); // Optional debug log
            pumpPorts.add(port.id());
        }
    });
    // console.log(`[Port Check] Finished identification. Final pumpPorts size: ${pumpPorts.size}`); // Optional debug log
    if (pumpPorts.size === 0) {
        console.log("No initialized pump ports found for pre-simulation highlighting.");
        layer.draw(); // Draw the cleared state
        return;
    }

    // 2. Build Adjacency List (adj) from connections and internal chip structure
    const adj = {};
    const addInternalEdge = (u, v) => {
        if (!adj[u]) adj[u] = [];
        if (!adj[v]) adj[v] = [];
        if (!adj[u].includes(v)) adj[u].push(v);
        if (!adj[v].includes(u)) adj[v].push(u);
    };
    connections.forEach(conn => {
        const port1Id = conn.fromPort;
        const port2Id = conn.toPort;
        const group1 = stage.findOne('#' + conn.fromChip);
        const group2 = stage.findOne('#' + conn.toChip);
        if (!group1 || !group2) { return; }
        const type1 = group1.getAttr('chipType');
        const type2 = group2.getAttr('chipType');
        let addForward = true;
        let addReverse = true;
        // Outlets act as sinks, flow only goes towards them in this visualization
        if (type2 === 'outlet') { addReverse = false; }
        if (type1 === 'outlet') { addForward = false; }
        if (addForward) {
            if (!adj[port1Id]) adj[port1Id] = [];
            if (!adj[port1Id].includes(port2Id)) adj[port1Id].push(port2Id);
        }
        if (addReverse) {
            if (!adj[port2Id]) adj[port2Id] = [];
            if (!adj[port2Id].includes(port1Id)) adj[port2Id].push(port1Id);
        }
    });
    layer.getChildren().forEach(group => {
        if (group instanceof Konva.Group && group.draggable()) {
            const groupType = group.getAttr('chipType');
            const chip = group;
            const internalConns = chip.getAttr('internalConnections') || [];
            if (groupType === 'straight' || groupType === 'meander') {
                internalConns.forEach(pair => { if (pair.length === 2 && pair[0] && pair[1]) { addInternalEdge(pair[0], pair[1]); } });
            } else if (groupType === 't-type' || groupType === 'x-type') {
                // Ensure getInternalNodeId is accessible (likely from simulationEngine.js)
                const internalNodeId = (typeof getInternalNodeId === 'function') ? getInternalNodeId(chip.id()) : `${chip.id()}_internal`;
                if (!adj[internalNodeId]) adj[internalNodeId] = [];
                const portIds = chip.find('.connectionPort').map(p => p.id());
                portIds.forEach(portId => { if (portId) { addInternalEdge(portId, internalNodeId); } });
            }
        }
    });
    // console.log("[Adj Build - PreSim] Finished. Final Adjacency List:", adj); // Optional debug log

    // 3. Perform BFS from all Pump Ports to find reachable elements
    const queue = [];
    const visitedPorts = new Set();
    const elementsToHighlight = new Set(); // IDs of segments/tubes
    const highlightedChipJunctions = new Set(); // Store chip IDs of highlighted T/X junctions

    pumpPorts.forEach(startPortId => {
        if (!visitedPorts.has(startPortId)) {
            queue.push(startPortId);
            visitedPorts.add(startPortId);
        }
    });

    while (queue.length > 0) {
        const currentId = queue.shift();
        const neighbors = adj[currentId] || [];

        neighbors.forEach(neighborId => {
            let elementIdToHighlight = null;
            const conn = connections.find(c => (c.fromPort === currentId && c.toPort === neighborId) || (c.toPort === currentId && c.fromPort === neighborId));

            if (conn) { // External tube connection
                elementIdToHighlight = conn.lineId + '_tube';
            } else { // Internal chip connection
                const isCurrentInternal = currentId.includes('_internal');
                const isNeighborInternal = neighborId.includes('_internal');
                let externalPortId = null;
                let internalNodeId = null;

                if (isCurrentInternal && !isNeighborInternal) {
                    externalPortId = neighborId;
                    internalNodeId = currentId;
                } else if (!isCurrentInternal && isNeighborInternal) {
                    externalPortId = currentId;
                    internalNodeId = neighborId;
                } else if (!isCurrentInternal && !isNeighborInternal) {
                    externalPortId = currentId; // Straight/meander: need port to find chip
                } else {
                    // Internal-to-internal, or other unexpected cases
                    // console.warn(`[FlowViz BFS PreSim] Unexpected node pairing: ${currentId} <-> ${neighborId}`);
                }

                if (externalPortId) {
                    const portShape = stage.findOne('#' + externalPortId);
                    const chipGroupId = portShape?.getAttr('mainGroupId');
                    const chipGroup = chipGroupId ? stage.findOne('#' + chipGroupId) : null;
                    const chipType = chipGroup?.getAttr('chipType');

                    if (chipType === 'straight' || chipType === 'meander') {
                        if (chipGroupId) {
                            elementIdToHighlight = chipGroupId + '_internalChannelFill';
                        }
                    } else if (chipType === 't-type' || chipType === 'x-type') {
                        // Ensure getSegmentId is accessible (likely from simulationEngine.js)
                         if (internalNodeId && externalPortId && typeof getSegmentId === 'function') {
                            elementIdToHighlight = getSegmentId(externalPortId, internalNodeId);
                            highlightedChipJunctions.add(chipGroupId);
                         } else if (internalNodeId && externalPortId) {
                            elementIdToHighlight = [externalPortId, internalNodeId].sort().join('--'); // Fallback ID creation
                             highlightedChipJunctions.add(chipGroupId);
                            console.warn("getSegmentId function not found, using fallback ID for T/X segment.");
                         }
                    }
                }
            }

            if (elementIdToHighlight) {
                elementsToHighlight.add(elementIdToHighlight);
            }

            if (!visitedPorts.has(neighborId)) {
                const neighborPortShape = stage.findOne('#' + neighborId);
                const neighborMainGroupId = neighborPortShape?.getAttr('mainGroupId');
                const neighborGroup = neighborMainGroupId ? stage.findOne('#' + neighborMainGroupId) : null;
                const neighborChipType = neighborGroup?.getAttr('chipType');

                if (neighborChipType !== 'outlet') {
                    visitedPorts.add(neighborId);
                    queue.push(neighborId);
                } else {
                    visitedPorts.add(neighborId); // Mark outlet as visited but don't traverse further
                    // console.log(`[FlowViz BFS PreSim] Reached outlet ${neighborId}. Stopping path here.`); // Optional debug log
                }
            }
        });
    }

    // 4. Apply Highlights ONLY to reachable elements
    if (elementsToHighlight.size > 0) {
        // console.log("Highlighting elements (PreSim):", elementsToHighlight); // Optional debug log

        elementsToHighlight.forEach(elementId => {
            if (elementId.endsWith('_tube')) {
                const tube = layer.findOne('#' + elementId);
                if (tube) {
                    tube.stroke(flowHighlightColor);
                    const outline = layer.findOne('#' + elementId.replace('_tube', '_outline'));
                    if (outline) {
                        outline.stroke(channelOutlineColor); // Keep outline standard color
                    }
                }
            } else if (elementId.endsWith('_internalChannelFill')) {
                const chipGroupId = elementId.replace('_internalChannelFill', '');
                const chipGroup = layer.findOne('#' + chipGroupId);
                if (chipGroup) {
                    const channelFillElement = chipGroup.findOne('.internalChannelFill');
                    if (channelFillElement) {
                         channelFillElement.stroke(flowHighlightColor); // Straight/Meander uses stroke now
                    } else {
                        // console.warn(`[Highlight PreSim] Could not find '.internalChannelFill' element in group ${chipGroupId}`);
                    }
                } else {
                    // console.warn(`[Highlight PreSim] Could not find group ${chipGroupId} for element ${elementId}`);
                }
            } else { // Assumed to be a T/X internal segment ID
                const segmentLine = layer.findOne('#' + elementId);
                if (segmentLine && segmentLine.name() === 'internalSegmentFill') {
                    segmentLine.stroke(flowHighlightColor);
                }
            }
        });
    } else {
        console.log("Nothing reachable from pump ports to highlight (PreSim).");
    }

    layer.draw(); // Draw changes
} 