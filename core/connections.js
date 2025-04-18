// === SECTION: Path Calculation Helper Functions ===

function getPortOrientation(port) {
    const portId = port.attrs.portId;
    if (!portId) return null;
    if (portId.includes('left')) return 'left';
    if (portId.includes('right')) return 'right';
    if (portId.includes('top')) return 'top';
    if (portId.includes('bottom')) return 'bottom';
    return null;
}

function calculatePathData(port1, port2) {
    if (!port1 || !port2) return ''; // Safety check

    const pos1 = port1.getAbsolutePosition();
    const pos2 = port2.getAbsolutePosition();
    const orient1 = getPortOrientation(port1);
    const orient2 = getPortOrientation(port2);

    if (!orient1 || !orient2) {
        console.error("Could not determine port orientation.");
        return ''; // Cannot calculate path without orientation
    }

    let stub1End = { ...pos1 };
    let stub2End = { ...pos2 };

    // Calculate end point of the first stub
    if (orient1 === 'left') stub1End.x -= connectionStubLength;
    else if (orient1 === 'right') stub1End.x += connectionStubLength;
    else if (orient1 === 'top') stub1End.y -= connectionStubLength;
    else if (orient1 === 'bottom') stub1End.y += connectionStubLength;

    // Calculate start point of the second stub (end point coming from port2)
    if (orient2 === 'left') stub2End.x -= connectionStubLength;
    else if (orient2 === 'right') stub2End.x += connectionStubLength;
    else if (orient2 === 'top') stub2End.y -= connectionStubLength;
    else if (orient2 === 'bottom') stub2End.y += connectionStubLength;

    // Calculate Control Points: Extend the stub lines symmetrically
    let cp1 = { ...stub1End };
    let cp2 = { ...stub2End };

    // Calculate distance between stub ends
    const dx = Math.abs(stub1End.x - stub2End.x);
    const dy = Math.abs(stub1End.y - stub2End.y);

    // Adjust control point extension based on distance for smoother curves
    // Use a fraction of the larger distance, but ensure a minimum extension
    const minExtension = connectionStubLength * 0.5; // Minimum curve even for short dist
    const dynamicExtension = Math.max(dx, dy) * 0.3; // Fraction of distance (tweak 0.3)
    const controlExtension = Math.max(minExtension, dynamicExtension);

    // cp1 extends from stub1End along orient1
    if (orient1 === 'left') cp1.x -= controlExtension;
    else if (orient1 === 'right') cp1.x += controlExtension;
    else if (orient1 === 'top') cp1.y -= controlExtension;
    else if (orient1 === 'bottom') cp1.y += controlExtension;

    // cp2 extends from stub2End along orient2 (towards the curve)
    if (orient2 === 'left') cp2.x -= controlExtension; // Extend left
    else if (orient2 === 'right') cp2.x += controlExtension; // Extend right
    else if (orient2 === 'top') cp2.y -= controlExtension; // Extend up
    else if (orient2 === 'bottom') cp2.y += controlExtension; // Extend down

    // Construct the SVG path data string
    return `M ${pos1.x} ${pos1.y} L ${stub1End.x} ${stub1End.y} C ${cp1.x} ${cp1.y} ${cp2.x} ${cp2.y} ${stub2End.x} ${stub2End.y} L ${pos2.x} ${pos2.y}`;
}

// === SECTION: Connection Management Functions ===

// --- Helper Function to Delete Connection ---
function deleteConnection(clickedTubePath) {
    if (!clickedTubePath || !clickedTubePath.id()?.endsWith('_tube')) {
        console.warn("deleteConnection called with invalid path:", clickedTubePath);
        return;
    };

    const tubePathId = clickedTubePath.id();
    const baseConnectionId = tubePathId.replace('_tube', '');
    const outlinePathId = baseConnectionId + '_outline';

    console.log("Attempting to delete connection:", baseConnectionId);

    const indexToRemove = connections.findIndex(conn => conn.lineId === baseConnectionId);

    if (indexToRemove !== -1) {
        // Get connection data BEFORE removing it
        const connData = connections[indexToRemove];

        // Find the outline path shape
        const outlinePath = layer.findOne('#' + outlinePathId);

        // Check if this connection involves a pump
        const fromGroup = stage.findOne('#' + connData.fromChip);
        const toGroup = stage.findOne('#' + connData.toChip);
        const isPumpConnection = fromGroup?.getAttr('chipType') === 'pump' ||
                               toGroup?.getAttr('chipType') === 'pump';

        // Remove data from array
        connections.splice(indexToRemove, 1);

        // --- Make ports visible again (if not outlet) ---
        const port1 = stage.findOne('#' + connData.fromPort);
        const port2 = stage.findOne('#' + connData.toPort);

        if (port1) {
            // Make connection port visible ONLY if no other connections exist for it
            if (!isPortConnected(connData.fromPort)) {
                port1.visible(true);
            }
        }
        if (port2) {
            // Make connection port visible ONLY if no other connections exist for it
            if (!isPortConnected(connData.toPort)) {
                port2.visible(true);
            }
        }

        // Remove shapes from layer
        clickedTubePath.destroy();
        if (outlinePath) {
            outlinePath.destroy();
        }

        // Reset ALL visual elements regardless of pump connection
        // This ensures consistent state before re-highlighting
        resetAllVisualElements(); // Note: resetAllVisualElements might need to be passed or made global

        // Trigger flow update AFTER removing connection and resetting visuals
        findFlowPathAndHighlight();

        layer.draw();
        console.log("Connection deleted successfully:", baseConnectionId);
    } else {
        console.warn("Could not find connection data for path:", baseConnectionId);
    }
}

// --- Helper Function to Check if Port is Connected ---
function isPortConnected(portId) {
    return connections.some(conn => conn.fromPort === portId || conn.toPort === portId);
}

// NEW: Creates the visual group for a port and sets up its interactions
function setupPortVisualsAndLogic(config) {
    // config: { x, y, portId, uniqueId, mainDraggableGroup }
    const portVisualGroup = new Konva.Group({ x: config.x, y: config.y });

    // Determine the visual offset direction for the blue dot based on the port ID
    let visualOffsetX = 0, visualOffsetY = 0;
    const portId = config.portId;
    if (portId.includes('left')) {
        visualOffsetX = -6;  // Move left
    } else if (portId.includes('right')) {
        visualOffsetX = 6;   // Move right
    } else if (portId.includes('top')) {
        visualOffsetY = -6;  // Move up
    } else if (portId.includes('bottom')) {
        visualOffsetY = 6;   // Move down
    }

    // Add the center connection point (the actual interactive port)
    // Keep the hit detection and connection point at (0,0)
    const connectionPort = new Konva.Circle({
        x: 0, y: 0,  // Keep the actual port at center for connections
        radius: portRadius,
        fill: portColor,
        stroke: '#2c3e50', // Dark blue-grey outline
        strokeWidth: 1,
        portId: config.portId,
        id: config.uniqueId,
        hitRadius: 15,
        mainGroupId: config.mainDraggableGroup.id(),
        name: 'connectionPort', // <<< Add name for reliable finding
        offsetX: -visualOffsetX,  // Offset the visual appearance only
        offsetY: -visualOffsetY   // Offset the visual appearance only
    });
    portVisualGroup.add(connectionPort);

    // --- Attach Listeners to the INNER connectionPort ---

    connectionPort.on('contextmenu', (e) => {
        e.evt.preventDefault();
        const clickedPort = e.target; // This is the inner connectionPort circle
        const clickedPortId = clickedPort.id(); // uniqueId
        const clickedPortMainGroupId = clickedPort.getAttr('mainGroupId');
        const clickedPortGroup = stage.findOne('#' + clickedPortMainGroupId);
        const clickedPortType = clickedPortGroup?.getAttr('chipType');

        if (startPort === null) {
            // --- Select first port --- Call the new helper function ---
            if (!handleInitiateConnection(clickedPort)) {
                return; // Selection was not initiated
            }
        } else {
            // --- Select second port (Logic for completing/canceling connection) ---
            if (clickedPort !== startPort && clickedPort.attrs.portId) {
                if (clickedPortType !== 'outlet' && isPortConnected(clickedPortId)) {
                    console.log("Target port", clickedPortId, "is already connected (and not an outlet). Cancelling selection.");
                    showNotification("The target port is already connected. Connection cancelled.", 'warning');
                    cancelConnectionAttempt();
                    return;
                }

                const endPort = clickedPort;
                const startMainGroupId = startPort.getAttr('mainGroupId');
                const endMainGroupId = endPort.getAttr('mainGroupId');

                if (!startMainGroupId || !endMainGroupId) {
                    console.error("Could not retrieve main group IDs from port attributes!", startPort, endPort);
                    cancelConnectionAttempt();
                    return;
                }

                // Get component types
                const startGroup = stage.findOne('#' + startMainGroupId);
                const endGroup = stage.findOne('#' + endMainGroupId);
                const startType = startGroup?.getAttr('chipType');
                const endType = endGroup?.getAttr('chipType');

                const pathData = calculatePathData(startPort, endPort);

                if (pathData) {
                    const baseConnectionId = 'conn_' + startPort.id() + '_' + endPort.id();
                    const outlinePath = new Konva.Path({
                        data: pathData,
                        stroke: channelOutlineColor,
                        strokeWidth: channelOutlineWidth,
                        id: baseConnectionId + '_outline',
                        listening: false
                    });
                    const tubePath = new Konva.Path({
                        data: pathData,
                        stroke: channelFillColor, // Use the same light blue as channels
                        strokeWidth: channelFillWidth,
                        id: baseConnectionId + '_tube'
                    });
                    tubePath.on('contextmenu', (evt) => { evt.evt.preventDefault(); deleteConnection(evt.target); });
                    layer.add(outlinePath);
                    layer.add(tubePath);
                    connections.push({
                        fromChip: startMainGroupId,
                        fromPort: startPort.id(),
                        toChip: endMainGroupId,
                        toPort: endPort.id(),
                        lineId: baseConnectionId,
                        resistance: calculateTubingResistance(tubePath.getLength()) // Note: calculateTubingResistance needs to be accessible
                    });
                    console.log(`Connection successful: ${startPort.id()} -> ${endPort.id()} (Resistance: ${calculateTubingResistance(tubePath.getLength()).toExponential(2)})`);

                    // --- Hide port visuals on successful connection ---
                    if (startType !== 'outlet') {
                        startPort.visible(false);
                    }
                    endPort.visible(false);

                    // --- Trigger flow update AFTER connection registered & ports hidden ---
                    findFlowPathAndHighlight(); // Note: findFlowPathAndHighlight needs to be accessible

                    // Update tubing length
                    calculateAndDisplayTubing(); // Note: calculateAndDisplayTubing needs to be accessible

                } else {
                    console.error("Could not calculate path data for connection.");
                }

                cancelConnectionAttempt();
                layer.draw();
            } else {
                console.log("Connection cancelled (clicked same port or invalid target).");
                cancelConnectionAttempt();
            }
        }
    });

    connectionPort.on('mouseenter', () => {
        stage.container().style.cursor = 'pointer';
        connectionPort.radius(portRadius * 1.5);
        layer.batchDraw();
        showNodeDetails(connectionPort.id()); // Note: showNodeDetails needs to be accessible
    });

    connectionPort.on('mouseleave', () => {
        stage.container().style.cursor = 'default';
        connectionPort.radius(portRadius);
        layer.batchDraw();
        hideNodeDetails(); // Note: hideNodeDetails needs to be accessible
    });

    return portVisualGroup;
}

// --- Helper function for initiating a connection ---
function handleInitiateConnection(clickedPort) {
    const clickedPortId = clickedPort.id();
    const clickedPortMainGroupId = clickedPort.getAttr('mainGroupId');
    const clickedPortGroup = stage.findOne('#' + clickedPortMainGroupId);
    const clickedPortType = clickedPortGroup?.getAttr('chipType');

    if (clickedPortType !== 'outlet' && isPortConnected(clickedPortId)) {
        console.log("Port", clickedPortId, "is already connected (and not an outlet).");
        showNotification("This port is already connected and cannot be selected.", 'warning'); // Note: showNotification needs to be accessible
        return false; // Return false to indicate selection was not initiated
    }

    startPort = clickedPort;
    startPort.setAttr('originalFill', portColor); // Store the original blue color
    startPort.fill(portSelectedColor); // Use selected color
    console.log("Selected start port:", startPort.id());

    // Set cursor and create temporary line
    stage.container().style.cursor = 'crosshair';
    const startPos = startPort.getAbsolutePosition();
    tempConnectionLine = new Konva.Line({
        points: [startPos.x, startPos.y, startPos.x, startPos.y],
        stroke: portSelectedColor, // Use same green as port
        strokeWidth: 2,
        dash: [4, 2], // Dashed line
        listening: false, // Prevent interaction with the line
    });
    layer.add(tempConnectionLine);
    layer.draw(); // Draw the changes (highlight + temp line)
    return true; // Return true to indicate selection was initiated
}

// Function to cancel the current connection attempt
function cancelConnectionAttempt() {
    if (startPort) {
        startPort.fill(portColor); // Reset to original blue color
        startPort = null;
    }

    // Reset cursor and remove temporary line
    stage.container().style.cursor = 'default';
    if (tempConnectionLine) {
        tempConnectionLine.destroy();
        tempConnectionLine = null;
    }
    layer.draw();
}

// --- Function to Update Connection Lines (now Paths) ---
function updateConnectionLines(movedChipGroup) {
    const movedChipId = movedChipGroup.id();

    connections.forEach(conn => {
        if (conn.fromChip === movedChipId || conn.toChip === movedChipId) {
            // Find the port shapes
            const port1 = stage.findOne('#' + conn.fromPort);
            const port2 = stage.findOne('#' + conn.toPort);

            // Find BOTH path shapes using base ID + suffixes
            const tubePath = layer.findOne('#' + conn.lineId + '_tube');
            const outlinePath = layer.findOne('#' + conn.lineId + '_outline');

            // Ensure all elements exist before proceeding
            if (tubePath && outlinePath && port1 && port2) {
                const newPathData = calculatePathData(port1, port2);
                if (newPathData) {
                    // Update the data for BOTH paths
                    tubePath.data(newPathData);
                    outlinePath.data(newPathData);

                    // --- Recalculate and update resistance ---
                    const newLengthPx = tubePath.getLength();
                    const newResistance = calculateTubingResistance(newLengthPx); // Note: calculateTubingResistance needs to be accessible
                    const connIndex = connections.findIndex(c => c.lineId === conn.lineId);
                    if (connIndex !== -1) {
                        connections[connIndex].resistance = newResistance;
                         console.log(`Updated resistance for ${conn.lineId}: ${newResistance.toExponential(2)} (Length: ${newLengthPx.toFixed(1)}px)`); // Debug log
                    } else {
                        console.warn("Could not find connection in array to update resistance:", conn.lineId);
                    }
                    // --- End resistance update ---

                } else {
                    console.warn("Could not recalculate path data for connection:", conn.lineId);
                }
            } else {
                console.warn("Could not find all required elements for connection update:", conn.lineId, {
                    tubeExists: !!tubePath,
                    outlineExists: !!outlinePath,
                    port1Exists: !!port1,
                    port2Exists: !!port2
                });
            }
        }
    });

    layer.batchDraw(); // Update the layer once all paths are adjusted
}

// === SECTION: Global Stage Listeners for Connections ===

// --- Add Stage Context Menu Listener for Cancellation ---
stage.on('contextmenu', (e) => {
    // Only act if the context menu is triggered directly on the stage,
    // not on a specific shape (like a port or connection line, which have their own handlers)
    if (e.target === stage) {
        e.evt.preventDefault(); // Prevent the default browser context menu

        // If a connection attempt is in progress (startPort is selected),
        // cancel it by calling the existing helper function.
        if (startPort !== null) {
            console.log("Connection cancelled (clicked stage background).");
            cancelConnectionAttempt(); // This function resets startPort and removes temp line
        }
    }
});

// --- Stage MouseMove Listener for Temporary Connection Line ---
stage.on('mousemove', (e) => {
    // Only act if a connection attempt is in progress (startPort is selected)
    // and the temporary line object exists.
    if (startPort !== null && tempConnectionLine !== null) {
        // Get the absolute position of the starting port
        const startPos = startPort.getAbsolutePosition();
        // Get the current pointer position relative to the stage
        const pointerPos = stage.getPointerPosition();

        // Update the points of the temporary line to go from the start port
        // to the current mouse pointer position.
        tempConnectionLine.points([startPos.x, startPos.y, pointerPos.x, pointerPos.y]);

        // Redraw the layer efficiently using batchDraw
        layer.batchDraw();
    }
}); 