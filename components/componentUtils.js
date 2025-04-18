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
    // config: { type: 'rect'|'image', name: string, width: number, height: number, styleAttrs: object, shadowStyle: object, svgDataUri?: string }

    if (config.type === 'rect') {
        const rect = new Konva.Rect({
            width: config.width,
            height: config.height,
            ...config.styleAttrs, // Apply base styles (fill, stroke, opacity etc)
            ...config.shadowStyle // Apply shared shadow styles
            // Name is included in styleAttrs
        });
        group.add(rect);
    } else if (config.type === 'image' && config.svgDataUri) {
        Konva.Image.fromURL(config.svgDataUri, (imageNode) => {
            imageNode.setAttrs({
                width: config.width,
                height: config.height,
                name: config.name, // Use the provided name ('pumpImage component-border' etc)
                ...config.shadowStyle // Apply shared shadow styles
            });
            group.add(imageNode);
            // Draw layer if available after image load
            group.getLayer()?.batchDraw();
        });
    } else {
        console.error("Invalid config for addComponentVisual:", config);
    }
} 