// Updated to draw individual segments with IDs
function addXChannel(group, chipId) { // <<< Added chipId parameter
    const cx = chipWidth / 2;
    const cy = chipHeight / 2;
    const internalNodeId = getInternalNodeId(chipId); // Get the internal node ID
    const fillExtension = 1; // <<< Extend fill lines by 1 pixel past center

    // --- Define Port Coordinates and IDs ---
    const ports = [
        { x: cx, y: 0, id: chipId + '_port_top' },          // Top
        { x: cx, y: chipHeight, id: chipId + '_port_bottom' }, // Bottom
        { x: 0, y: cy, id: chipId + '_port_left' },         // Left
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


function createXChipPreview(x, y) {
    const group = new Konva.Group({ x: x, y: y, draggable: false });
    // Apply glass style + shadow using the helper
    addComponentVisual(group, { 
        type: 'rect', 
        width: chipWidth, 
        height: chipHeight, 
        styleAttrs: previewRectStyle, 
        // shadowStyle: shadowStyle 
    });
    addXChannel(group); // Use helper
    return group;
}

function createXChip(x, y) {
    const chipId = 'chip_' + Konva.Util.getRandomColor().replace('#','');
    // Use the helper function to create the base group
    const group = createBaseComponentGroup({ 
        x: x, 
        y: y, 
        id: chipId, 
        draggable: true, 
        chipType: 'x-type'
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
    group.setAttr('resistance', RESISTANCE_X_TYPE); // <<< ADDED

    addXChannel(group, chipId); // Use helper

    // Define internal connections for the X-chip (FULL connectivity)
    const leftPortId = chipId + '_port_left';
    const rightPortId = chipId + '_port_right';
    const topPortId = chipId + '_port_top';
    const bottomPortId = chipId + '_port_bottom';
    group.setAttr('internalConnections', [
        [leftPortId, rightPortId],
        [leftPortId, topPortId],
        [leftPortId, bottomPortId],
        [rightPortId, topPortId],
        [rightPortId, bottomPortId],
        [topPortId, bottomPortId]
    ]);

    // Ports using setupPortVisualsAndLogic
    const leftPortGroup = setupPortVisualsAndLogic({ x: 0, y: chipHeight / 2, portId: 'x_left', uniqueId: leftPortId, mainDraggableGroup: group });
    group.add(leftPortGroup);
    const rightPortGroup = setupPortVisualsAndLogic({ x: chipWidth, y: chipHeight / 2, portId: 'x_right', uniqueId: rightPortId, mainDraggableGroup: group });
    group.add(rightPortGroup);
    const topPortGroup = setupPortVisualsAndLogic({ x: chipWidth / 2, y: 0, portId: 'x_top', uniqueId: topPortId, mainDraggableGroup: group });
    group.add(topPortGroup);
    const bottomPortGroup = setupPortVisualsAndLogic({ x: chipWidth / 2, y: chipHeight, portId: 'x_bottom', uniqueId: bottomPortId, mainDraggableGroup: group });
    group.add(bottomPortGroup);

    group.on('dragmove', () => { updateConnectionLines(group); updateSimulationDotsForGroup(group); });
    return group;
} 