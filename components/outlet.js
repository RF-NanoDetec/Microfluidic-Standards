// Added createOutletPreview using SVG Data URI helper
function createOutletPreview(x, y, width, height, svgDataUri) {
    const group = new Konva.Group({
        x: x,
        y: y,
        draggable: false,
        // chipType: 'outlet' // Not strictly needed for preview visual group
    });
    
    // Load the SVG image using the helper
    addComponentVisual(group, { 
        type: 'image', 
        name: 'outletImage component-border',
        width: width, 
        height: height, 
        styleAttrs: {}, 
        // shadowStyle: shadowStyle, 
        svgDataUri: svgDataUri // Use passed-in URI
    });

    // Image adding and drawing handled within addComponentVisual callback
    // Let's add an explicit draw call here for the preview's layer
    setTimeout(() => group.getLayer()?.draw(), 0); // Ensure draw happens after helper call
    return group;
}

// Updated to use setupPortVisualsAndLogic and helper
function createOutlet(x, y) {
    const itemId = 'outlet_' + Konva.Util.getRandomColor().replace('#','');
    // Use the helper function to create the base group, including width/height
    const group = createBaseComponentGroup({ 
        x: x, 
        y: y, 
        id: itemId, 
        draggable: true, 
        chipType: 'outlet', 
        width: outletWidth,  // Pass width
        height: outletHeight // Pass height
    });

    // Load the SVG image using the helper
    addComponentVisual(group, { 
        type: 'image', 
        name: 'outletImage component-border', 
        width: outletWidth, 
        height: outletHeight, 
        styleAttrs: {}, 
        // shadowStyle: shadowStyle, 
        svgDataUri: outletSvgDataUri 
    });
    
    // Similar to pump, add port after initiating image load
    const portX = outletWidth / 2;
    const portY = 0;
    const portGroup = setupPortVisualsAndLogic({
        x: portX, y: portY,
        portId: 'outlet_top_in', uniqueId: itemId + '_port_in',
        mainDraggableGroup: group
    });
    group.add(portGroup);

    // --- Trigger flow update AFTER outlet is fully initialized ---
    // This might still be slightly racy depending on image load speed,
    // but generally works. A more robust solution uses promises/callbacks.
    setTimeout(() => { 
        findFlowPathAndHighlight(); 
        updateComponentList(); // Ensure list updates after potential async ops
    }, 100); // Delay slightly
    // --- End Trigger Modification ---

    group.on('dragmove', () => { updateConnectionLines(group); updateSimulationDotsForGroup(group); });
    return group;
} 