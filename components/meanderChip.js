// NEW: Helper to draw the meander path
function addMeanderChannel(group) {
    const w = chipWidth;
    const h = chipHeight;
    const r = 5; // Turn radius
    const w_seg = w / 6; // Width of horizontal segments (6 segments total)
    const y_top = h / 4; // Top extent of the meander
    const y_bottom = h * 3 / 4; // Bottom extent of the meander
    const y_mid = h / 2; // Start and end y-coordinate

    // Create a points array for the meander path - each pair is an x,y coordinate
    const points = [
        0, y_mid, // Start at left edge
        w_seg - r, y_mid, // Horizontal segment to first corner

        // We'll directly draw the rounded corners with line segments
        // Corner 1 (Up) - approximate curve with line segments
        w_seg - r/2, y_mid,
        w_seg, y_mid - r/2,
        w_seg, y_mid - r,

        // Vertical segment to second corner
        w_seg, y_top + r,

        // Corner 2 (Right) - approximate curve with line segments
        w_seg, y_top + r/2,
        w_seg + r/2, y_top,
        w_seg + r, y_top,

        // Horizontal segment to third corner
        w_seg * 2 - r, y_top,

        // Corner 3 (Down) - approximate curve with line segments
        w_seg * 2 - r/2, y_top,
        w_seg * 2, y_top + r/2,
        w_seg * 2, y_top + r,

        // Vertical segment to fourth corner
        w_seg * 2, y_bottom - r,

        // Corner 4 (Right) - approximate curve with line segments
        w_seg * 2, y_bottom - r/2,
        w_seg * 2 + r/2, y_bottom,
        w_seg * 2 + r, y_bottom,

        // Horizontal segment to fifth corner
        w_seg * 3 - r, y_bottom,

        // Corner 5 (Up) - approximate curve with line segments
        w_seg * 3 - r/2, y_bottom,
        w_seg * 3, y_bottom - r/2,
        w_seg * 3, y_bottom - r,

        // Vertical segment to sixth corner
        w_seg * 3, y_top + r,

        // Corner 6 (Right) - approximate curve with line segments
        w_seg * 3, y_top + r/2,
        w_seg * 3 + r/2, y_top,
        w_seg * 3 + r, y_top,

        // Horizontal segment to seventh corner
        w_seg * 4 - r, y_top,

        // Corner 7 (Down) - approximate curve with line segments
        w_seg * 4 - r/2, y_top,
        w_seg * 4, y_top + r/2,
        w_seg * 4, y_top + r,

        // Vertical segment to eighth corner
        w_seg * 4, y_bottom - r,

        // Corner 8 (Right) - approximate curve with line segments
        w_seg * 4, y_bottom - r/2,
        w_seg * 4 + r/2, y_bottom,
        w_seg * 4 + r, y_bottom,

        // Horizontal segment to ninth corner
        w_seg * 5 - r, y_bottom,

        // Corner 9 (Up to Middle) - approximate curve with line segments
        w_seg * 5 - r/2, y_bottom,
        w_seg * 5, y_bottom - r/2,
        w_seg * 5, y_bottom - r,

        // Vertical segment to final section
        w_seg * 5, y_mid + r,

        // Corner 10 (Right) - approximate curve with line segments
        w_seg * 5, y_mid + r/2,
        w_seg * 5 + r/2, y_mid,
        w_seg * 5 + r, y_mid,

        // Final horizontal segment to right edge
        w, y_mid
    ];

    // Draw the outline FIRST (will be at bottom)
    const outline = new Konva.Line({
        points: points,
        stroke: channelOutlineColor,
        strokeWidth: channelOutlineWidth,
        lineCap: channelCap,  // Changed from 'butt' to channelCap (which is 'round')
        lineJoin: channelJoin,  // Using channelJoin constant for consistency
        name: 'channelOutline',
        listening: false
    });
    group.add(outline);

    // Draw the fill line ON TOP
    const chipId = group.id(); // Get the chip ID if it exists
    const fill = new Konva.Line({
        points: points,
        stroke: channelFillColor,
        strokeWidth: channelFillWidth,
        lineCap: channelCap,  // Already using channelCap
        lineJoin: channelJoin,  // Using channelJoin constant for consistency
        name: 'internalChannelFill',
        id: chipId ? `${chipId}_internalChannelFill` : `preview_${Konva.Util.getRandomColor()}_internalFill`,
        listening: false
    });
    group.add(fill);
}

// NEW: Meander Chip Preview Function
function createMeanderChipPreview(x, y) {
    const group = new Konva.Group({ x: x, y: y, draggable: false });
    // Apply glass style + shadow using the helper
    addComponentVisual(group, { 
        type: 'rect', 
        width: chipWidth, 
        height: chipHeight, 
        styleAttrs: previewRectStyle, 
        // shadowStyle: shadowStyle 
    });

    // Draw meander channel FIRST
    addMeanderChannel(group);
    return group;
}

// NEW: Meander Chip Creation Function
function createMeanderChip(x, y) {
    const chipId = 'chip_' + Konva.Util.getRandomColor().replace('#','');
    // Use the helper function to create the base group
    const group = createBaseComponentGroup({ 
        x: x, 
        y: y, 
        id: chipId, 
        draggable: true, 
        chipType: 'meander'
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
    group.setAttr('resistance', RESISTANCE_MEANDER); // <<< ADDED

    // Draw meander channel FIRST
    addMeanderChannel(group);

    // Define internal connections for the meander chip
    const leftPortUniqueId = chipId + '_port_left';
    const rightPortUniqueId = chipId + '_port_right';
    group.setAttr('internalConnections', [
        [leftPortUniqueId, rightPortUniqueId]
    ]);

    // Add Ports LAST so they appear on top
    const leftPortGroup = setupPortVisualsAndLogic({ x: 0, y: chipHeight / 2, portId: 'meander_left', uniqueId: leftPortUniqueId, mainDraggableGroup: group });
    group.add(leftPortGroup);
    const rightPortGroup = setupPortVisualsAndLogic({ x: chipWidth, y: chipHeight / 2, portId: 'meander_right', uniqueId: rightPortUniqueId, mainDraggableGroup: group });
    group.add(rightPortGroup);

    group.on('dragmove', () => { updateConnectionLines(group); updateSimulationDotsForGroup(group); });
    return group;
} 