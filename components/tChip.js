// Updated to draw individual segments with IDs
function addTChannel(group, chipId) { // <<< Added chipId parameter
    const cx = chipWidth / 2;
    const cy = chipHeight / 2;
    const internalNodeId = getInternalNodeId(chipId); // Get the internal node ID
    const fillExtension = 1; // <<< Extend fill lines by 1 pixel past center

    // --- Define Port Coordinates and IDs ---
    const ports = [
        { x: cx, y: 0, id: chipId + '_port_top' },          // Top
        { x: cx, y: chipHeight, id: chipId + '_port_bottom' }, // Bottom
        { x: chipWidth, y: cy, id: chipId + '_port_right' }   // Right
    ];

    // --- Draw OUTLINES first ---
    ports.forEach(port => {
        const points = [port.x, port.y, cx, cy];
        group.add(new Konva.Line({
            points: points,
            stroke: channelOutlineColor,
            strokeWidth: channelOutlineWidth,
            lineCap: channelCap,
            listening: false
        }));
    });

    // --- Draw outline circle at the center junction ---
    group.add(new Konva.Circle({
        x: cx,
        y: cy,
        radius: channelOutlineWidth / 2,
        fill: channelOutlineColor,
        listening: false
    }));

    // --- Draw FILLS second (on top of outlines) ---
    ports.forEach(port => {
        // Calculate direction vector from port to center
        const dx = cx - port.x;
        const dy = cy - port.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        let endX = cx;
        let endY = cy;
        // Extend endpoint slightly past center if distance is not zero
        if (dist > 1e-6) {
            endX += (dx / dist) * fillExtension;
            endY += (dy / dist) * fillExtension;
        }

        const points = [port.x, port.y, endX, endY]; // Use extended endpoint
        const segmentId = chipId ? getSegmentId(port.id, internalNodeId) : `preview_segment_${Konva.Util.getRandomColor()}`;

        group.add(new Konva.Line({
            points: points,
            stroke: channelFillColor,
            strokeWidth: channelFillWidth,
            lineCap: 'butt', // Use butt cap for precise end at extended point
            listening: false,
            id: segmentId,
            name: 'internalSegmentFill'
        }));
    });
}

function createTChipPreview(x, y) {
    const group = new Konva.Group({ x: x, y: y, draggable: false });
    // Apply glass style + shadow using the helper
    addComponentVisual(group, { 
        type: 'rect', 
        width: chipWidth, 
        height: chipHeight, 
        styleAttrs: previewRectStyle, 
        // shadowStyle: shadowStyle 
    });
    addTChannel(group); // Use helper
    return group;
}

function createTChip(x, y) {
    const chipId = 'chip_' + Konva.Util.getRandomColor().replace('#','');
    // Use the helper function to create the base group
    const group = createBaseComponentGroup({ 
        x: x, 
        y: y, 
        id: chipId, 
        draggable: true, 
        chipType: 't-type'
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
    group.setAttr('resistance', RESISTANCE_T_TYPE);

    addTChannel(group, chipId); // Use helper

    // Define internal connections for the T-chip
    const topPortUniqueId = chipId + '_port_top';
    const bottomPortUniqueId = chipId + '_port_bottom';
    const rightPortUniqueId = chipId + '_port_right';
    group.setAttr('internalConnections', [
        [topPortUniqueId, bottomPortUniqueId],
        [topPortUniqueId, rightPortUniqueId],
        [bottomPortUniqueId, rightPortUniqueId]
    ]);

    // Ports using setupPortVisualsAndLogic
    const cx = chipWidth / 2, cy = chipHeight / 2;
    const topPortGroup = setupPortVisualsAndLogic({ x: cx, y: 0, portId: 't_top', uniqueId: topPortUniqueId, mainDraggableGroup: group });
    group.add(topPortGroup);
    const bottomPortGroup = setupPortVisualsAndLogic({ x: cx, y: chipHeight, portId: 't_bottom', uniqueId: bottomPortUniqueId, mainDraggableGroup: group });
    group.add(bottomPortGroup);
    const rightPortGroup = setupPortVisualsAndLogic({ x: chipWidth, y: cy, portId: 't_right', uniqueId: rightPortUniqueId, mainDraggableGroup: group });
    group.add(rightPortGroup);

    group.on('dragmove', () => { updateConnectionLines(group); updateSimulationDotsForGroup(group); });
    return group;
} 