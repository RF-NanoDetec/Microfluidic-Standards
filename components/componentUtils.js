// --- Utility function to create a base component group ---
function createBaseComponentGroup(config) {
    // config: { x, y, id, draggable, chipType, width?, height? }
    const group = new Konva.Group({
        x: config.x,
        y: config.y,
        id: config.id,
        draggable: config.draggable,
        chipType: config.chipType,
        width: config.width,   // Add width if provided
        height: config.height // Add height if provided
    });

    // Add dragmove listener only if draggable
    if (config.draggable) {
        group.on('dragmove', () => { updateConnectionLines(group); updateSimulationDotsForGroup(group); });
    }

    return group;
}



// --- Utility function to add the main visual (Rect or Image) to a component group ---
function addComponentVisual(group, config) {
    // config: { type: 'rect'|'image', name?: string, width: number, height: number, styleAttrs: object, shadowStyle?: object, svgDataUri?: string }

    if (config.type === 'rect') {
        // Ensure name includes 'visual-shape'
        const name = (config.styleAttrs.name || '') + ' visual-shape';
        const rect = new Konva.Rect({
            width: config.width,
            height: config.height,
            ...config.styleAttrs,
            name: name, // Apply modified name
            ...(config.shadowStyle || {}) // Apply shared shadow styles safely
        });
        group.add(rect);
    } else if (config.type === 'image' && config.svgDataUri) {
        // Ensure name includes 'visual-shape'
        const name = (config.name || '') + ' visual-shape'; // Add visual-shape to image name
        
        // Create a temporary image to get natural dimensions for aspect ratio calculation
        const tempImg = new Image();
        tempImg.onload = function() {
            const naturalWidth = tempImg.width;
            const naturalHeight = tempImg.height;
            const aspectRatio = naturalWidth / naturalHeight;
            
            // Calculate dimensions that preserve aspect ratio
            let finalWidth = config.width;
            let finalHeight = config.height;
            
            // Use the smaller dimension to maintain aspect ratio within the container
            if (config.width / config.height > aspectRatio) {
                // Container is wider than needed, constrain by height
                finalWidth = config.height * aspectRatio;
            } else {
                // Container is taller than needed, constrain by width
                finalHeight = config.width / aspectRatio;
            }
            
            // Center the image in the allocated space
            const offsetX = (config.width - finalWidth) / 2;
            const offsetY = (config.height - finalHeight) / 2;
            
            Konva.Image.fromURL(config.svgDataUri, (imageNode) => {
                imageNode.setAttrs({
                    width: finalWidth,
                    height: finalHeight,
                    x: offsetX,
                    y: offsetY,
                    name: name, // Use the modified name
                    ...(config.shadowStyle || {}) // Apply shared shadow styles safely
                });
                group.add(imageNode);
                group.getLayer()?.batchDraw();
            });
        };
        
        // Start loading the image to get dimensions
        tempImg.src = config.svgDataUri;
    } else {
        console.error("Invalid config for addComponentVisual:", config);
    }
}

// --- Utility function to add connection ports to a component group ---
// ... existing code ...

// === SECTION: Channel Drawing Helpers ===

// --- Helper to add a straight channel --- (ASSUMING similar structure for others)
function addStraightChannel(group) {
    const channel = new Konva.Line({
        points: [0, chipHeight / 2, chipWidth, chipHeight / 2],
        stroke: channelFillColor,
        strokeWidth: channelFillWidth,
        lineCap: channelCap,
        lineJoin: channelJoin,
        name: 'channel-path' // ADDED name
    });
    const channelOutline = new Konva.Line({
        points: [0, chipHeight / 2, chipWidth, chipHeight / 2],
        stroke: channelOutlineColor,
        strokeWidth: channelOutlineWidth,
        lineCap: channelCap,
        lineJoin: channelJoin,
        name: 'channel-path' // ADDED name
    });
    group.add(channelOutline, channel); // Outline behind fill
}

// --- Helper to add an X channel ---
function addXChannel(group) {
    const center = { x: chipWidth / 2, y: chipHeight / 2 };
    const channelOutline = new Konva.Path({
        data: `M0 ${center.y} L${chipWidth} ${center.y} M${center.x} 0 L${center.x} ${chipHeight}`,
        stroke: channelOutlineColor,
        strokeWidth: channelOutlineWidth,
        lineCap: channelCap,
        lineJoin: channelJoin,
        name: 'channel-path' // ADDED name
    });
    const channel = new Konva.Path({
        data: `M0 ${center.y} L${chipWidth} ${center.y} M${center.x} 0 L${center.x} ${chipHeight}`,
        stroke: channelFillColor,
        strokeWidth: channelFillWidth,
        lineCap: channelCap,
        lineJoin: channelJoin,
        name: 'channel-path' // ADDED name
    });
    group.add(channelOutline, channel);
}

// --- Helper to add a T channel ---
function addTChannel(group) {
    const center = { x: chipWidth / 2, y: chipHeight / 2 };
    const channelOutline = new Konva.Path({
        data: `M0 ${center.y} L${chipWidth} ${center.y} M${center.x} ${center.y} L${center.x} ${chipHeight}`,
        stroke: channelOutlineColor,
        strokeWidth: channelOutlineWidth,
        lineCap: channelCap,
        lineJoin: channelJoin,
        name: 'channel-path' // ADDED name
    });
     const channel = new Konva.Path({
        data: `M0 ${center.y} L${chipWidth} ${center.y} M${center.x} ${center.y} L${center.x} ${chipHeight}`,
        stroke: channelFillColor,
        strokeWidth: channelFillWidth,
        lineCap: channelCap,
        lineJoin: channelJoin,
        name: 'channel-path' // ADDED name
    });
    group.add(channelOutline, channel);
}

// --- Helper to add a Meander channel ---
function addMeanderChannel(group) {
    // Define path data for meander channel (simplified example)
    const pathData = "M5,5 L45,5 L45,15 L5,15 L5,25 L45,25 L45,35 L5,35 L5,45 L45,45";

    const channelOutline = new Konva.Path({
        data: pathData,
        stroke: channelOutlineColor,
        strokeWidth: channelOutlineWidth, // Use defined constants
        lineCap: channelCap,
        lineJoin: channelJoin,
        name: 'channel-path' // ADDED name
    });

    const channel = new Konva.Path({
        data: pathData,
        stroke: channelFillColor, // Use defined constants
        strokeWidth: channelFillWidth,
        lineCap: channelCap,
        lineJoin: channelJoin,
        name: 'channel-path' // ADDED name
    });

    group.add(channelOutline, channel); // Add outline behind main channel
}

// === SECTION: Port and Connection Logic ===
// ... rest of file ... 