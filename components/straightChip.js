// === SECTION: Channel Drawing Helper Functions ===

// Updated to use a single Path with fill and stroke
function addStraightChannel(group) {
    const startX = 0;
    const endX = chipWidth;
    const y = chipHeight / 2;
    const points = [startX, y, endX, y];
    const chipId = group.id(); // Get the chip ID

    // Draw the outline FIRST (will be at bottom)
    const outline = new Konva.Line({
        points: points,
        stroke: channelOutlineColor,
        strokeWidth: channelOutlineWidth, // Use constant 5
        lineCap: channelCap,
        name: 'channelOutline', // Keep consistent naming
        listening: false
    });
    group.add(outline);

    // Draw the fill line ON TOP
    const fill = new Konva.Line({
        points: points,
        stroke: channelFillColor,
        strokeWidth: channelFillWidth, // Use constant 3
        lineCap: channelCap,
        // Assign ID based on chip ID for highlighting/simulation lookup
        id: chipId ? `${chipId}_internalChannelFill` : `preview_${Konva.Util.getRandomColor()}_internalFill`, // Use chip ID if available, otherwise unique preview ID
        name: 'internalChannelFill', // Keep consistent naming
        listening: false
    });
    group.add(fill);
}

// === SECTION: Preview Chip Creation Functions ===

function createStraightChipPreview(x, y) {
    // Use new Konva.Group for previews, as they don't need ID or specific chipType logic handled by createBaseComponentGroup
    const group = new Konva.Group({ x: x, y: y, draggable: false }); 
    // Apply the same glass style + shadow to the preview rectangle using the helper
    addComponentVisual(group, { 
        type: 'rect', 
        width: chipWidth, 
        height: chipHeight, 
        styleAttrs: previewRectStyle, 
        // shadowStyle: shadowStyle 
    });
    addStraightChannel(group); // Use helper
    return group;
}

// === SECTION: Main Component Creation Functions ===

function createStraightChip(x, y) {
    const chipId = 'chip_' + Konva.Util.getRandomColor().replace('#','');
    // Use the helper function to create the base group
    const group = createBaseComponentGroup({ 
        x: x, 
        y: y, 
        id: chipId, 
        draggable: true, 
        chipType: 'straight'
    });
    // Apply glass style + shadow using the helper
    addComponentVisual(group, { 
        type: 'rect', 
        width: chipWidth, 
        height: chipHeight, 
        styleAttrs: chipRectStyle, // Use chip style
        // shadowStyle: shadowStyle 
    });

    // Set resistance attribute
    group.setAttr('resistance', RESISTANCE_STRAIGHT);

    addStraightChannel(group); // Use helper

    // <<< Add internal connection data using UNIQUE IDs >>>
    const leftPortUniqueId = chipId + '_port_left';
    const rightPortUniqueId = chipId + '_port_right';
    group.setAttr('internalConnections', [
        [leftPortUniqueId, rightPortUniqueId]
    ]);

    // Ports using setupPortVisualsAndLogic
    const leftPortGroup = setupPortVisualsAndLogic({ x: 0, y: chipHeight / 2, portId: 'straight_left', uniqueId: leftPortUniqueId, mainDraggableGroup: group });
    group.add(leftPortGroup);
    const rightPortGroup = setupPortVisualsAndLogic({ x: chipWidth, y: chipHeight / 2, portId: 'straight_right', uniqueId: rightPortUniqueId, mainDraggableGroup: group });
    group.add(rightPortGroup);

    group.on('dragmove', () => { updateConnectionLines(group); updateSimulationDotsForGroup(group); });
    return group;
} 