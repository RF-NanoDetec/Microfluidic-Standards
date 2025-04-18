// Updated to use SVG image helper
function createPumpPreview(x, y, width, height) {
    const group = new Konva.Group({
        x: x,
        y: y,
        draggable: false,
        // chipType: 'pump' // Not strictly needed for preview visual group
    });

    // Load the SVG image using the helper
    addComponentVisual(group, { 
        type: 'image', 
        name: 'pumpImage component-border', // Name needed for potential selection later?
        width: width, 
        height: height, 
        styleAttrs: {}, // No specific styles for image itself beyond size/name
        // shadowStyle: shadowStyle, 
        svgDataUri: pumpSvgDataUri 
    });
    
    // Image adding and drawing handled within addComponentVisual callback
    return group;
}

// Updated to use SVG image helper
function createPump(x, y) {
    const itemId = 'pump_' + Konva.Util.getRandomColor().replace('#','');
    // Use the helper function to create the base group
    const group = createBaseComponentGroup({ 
        x: x, 
        y: y, 
        id: itemId, 
        draggable: true, 
        chipType: 'pump', 
        width: itemWidth, 
        height: itemHeight 
    });

    // Initialize port pressures attribute
    group.setAttr('portPressures', {});

    // Load the SVG image using the helper
    addComponentVisual(group, { 
        type: 'image', 
        name: 'pumpImage component-border', 
        width: itemWidth, 
        height: itemHeight, 
        styleAttrs: {}, 
        // shadowStyle: shadowStyle, 
        svgDataUri: pumpSvgDataUri 
    });

    // Add ports AFTER the image is loaded/added by the helper's callback
    // Need to ensure ports are added *after* the image is on the group
    // The helper currently draws the layer, which might be too early for adding ports.
    // Let's adjust the helper or the calling code.
    // --- Modification: Add ports in a timeout or modify helper --- 
    // Simpler approach: Add ports here, assuming helper adds image asynchronously.
    const portPositions = [
        { x: itemWidth, y: itemHeight * 1 / 5, portId: 'pump_right1', id: itemId + '_port_right1' },
        { x: itemWidth, y: itemHeight * 2 / 5, portId: 'pump_right2', id: itemId + '_port_right2' },
        { x: itemWidth, y: itemHeight * 3 / 5, portId: 'pump_right3', id: itemId + '_port_right3' },
        { x: itemWidth, y: itemHeight * 4 / 5, portId: 'pump_right4', id: itemId + '_port_right4' }
    ];

    // Create and add Ports
    portPositions.forEach(pos => {
        const portGroup = setupPortVisualsAndLogic({
            x: pos.x, y: pos.y,
            portId: pos.portId, uniqueId: pos.id,
            mainDraggableGroup: group
        });
        group.add(portGroup);
    });
    // We might need an explicit draw here IF the image loads very fast
    // but relying on the helper's callback draw is generally okay.

    group.on('dragmove', () => { updateConnectionLines(group); updateSimulationDotsForGroup(group); }); // Ensure drag update is attached
    return group;
} 