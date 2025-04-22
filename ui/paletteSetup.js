// === SECTION: Palette Setup Logic ===

// Dependencies:
// - Konva: Konva.Stage, Konva.Layer, Konva.Text, Konva.Easings
// - Component Preview Functions: createStraightChipPreview, createXChipPreview, createTChipPreview, createMeanderChipPreview, createPumpPreview, createOutletPreview
// - Sidebar Function: handlePaletteSelection (from ui/sidebar.js)
// - Utility Function: getComponentDisplayName (from core/utils.js)
// - Constants: chipWidth, chipHeight, itemWidth, itemHeight, outletWidth, outletHeight, outletSvgDataUri
// - DOM Elements: #palette-straight-chip-konva, #palette-straight-chip, #palette-x-chip-konva, #palette-x-chip, #palette-t-chip-konva, #palette-t-chip, #palette-meander-chip-konva, #palette-meander-chip, #palette-pump-konva, #palette-pump, #palette-outlet-konva, #palette-outlet

// --- Define shadow style for preview hover ---
const previewHoverShadow = {
    shadowColor: 'rgba(0,0,0,0.4)', // Slightly darker shadow
    shadowBlur: 6,
    shadowOffsetX: 2,
    shadowOffsetY: 2,
    shadowOpacity: 1, // Opacity is controlled by shadowColor rgba alpha
    shadowEnabled: true
};

function setupPalette() {
    console.log("Setting up component palette...");
    // --- Define fixed size for palette chip Konva stages --- //
    const chipPreviewSize = 64; // The visible size matching CSS
    const paletteStageRenderSize = 76; // Larger size for rendering buffer (e.g., 64 + 6*2 for shadow/scale)
    const centeringOffset = (paletteStageRenderSize - chipPreviewSize) / 2; // Offset to center 64px content in 76px stage

    // --- Helper Function to Setup a Single Palette Item --- //
    function setupPaletteItem(baseId, chipType, createPreviewFunc, ...previewArgs) {
        const konvaContainerId = `palette-${baseId}-konva`;
        const outerDivId = `palette-${baseId}`;
        const konvaContainer = document.getElementById(konvaContainerId);
        const outerDiv = document.getElementById(outerDivId);

        if (!konvaContainer) {
            console.error(`Palette container '${konvaContainerId}' not found!`);
            return;
        }
        if (!outerDiv) {
            console.error(`Palette outer div '${outerDivId}' not found!`);
            // Continue to setup Konva even if outer div listener fails
        }

        const paletteStage = new Konva.Stage({
            container: konvaContainerId,
            width: paletteStageRenderSize,  // Use larger render size
            height: paletteStageRenderSize, // Use larger render size
        });
        const paletteLayer = new Konva.Layer();
        paletteStage.add(paletteLayer);

        // Create the preview shape (this still uses original coords/sizes like chipWidth)
        const previewShape = createPreviewFunc(...previewArgs);
        if (previewShape) {
            // --- POSITION the preview shape group correctly in the larger stage ---
            // Add the centering offset to the existing position set by createPreviewFunc
            previewShape.x(previewShape.x() + centeringOffset);
            previewShape.y(previewShape.y() + centeringOffset);

            paletteLayer.add(previewShape);
             // Special handling for async previews (like images in outlets)
             // Drawing might happen within the createPreviewFunc callback
             if (!chipType || (chipType !== 'outlet' && chipType !== 'pump')) { // Assume others draw immediately
                  paletteLayer.draw();
             }
        } else {
             console.error(`Failed to create preview for ${chipType}`);
        }

        // --- NEW: Add hover effects (Revised Logic) ---
        if (outerDiv && previewShape) {
            outerDiv.addEventListener('mouseover', () => {
                // 1. Scale the entire group
                previewShape.to({
                    scaleX: 1.08,
                    scaleY: 1.08,
                    duration: 0.15,
                    easing: Konva.Easings.EaseInOut
                });

                // 2. Apply shadow ONLY to the visual-shape node(s) within the group
                const visualNodes = previewShape.find('.visual-shape');
                visualNodes.forEach(node => {
                    node.setAttrs(previewHoverShadow);
                    // Ensure visual node is slightly above channel if needed (optional)
                    // node.moveUp(); 
                });

                paletteLayer.batchDraw();
            });

            outerDiv.addEventListener('mouseout', () => {
                // 1. Scale the entire group back
                previewShape.to({
                    scaleX: 1,
                    scaleY: 1,
                    duration: 0.15,
                    easing: Konva.Easings.EaseInOut
                });

                // 2. Remove shadow from the visual-shape node(s)
                const visualNodes = previewShape.find('.visual-shape');
                visualNodes.forEach(node => {
                    node.shadowEnabled(false);
                });

                paletteLayer.batchDraw();
            });
        }
        // --- END NEW ---

        // Add click listener to the outer div for selection
        if (outerDiv) {
             // Ensure handlePaletteSelection is available
             if (typeof handlePaletteSelection === 'function') {
                 outerDiv.addEventListener('click', () => handlePaletteSelection(chipType));
             } else {
                 console.error(`handlePaletteSelection function not found for ${chipType} palette item.`);
             }
        } else {
             console.warn(`Outer div ${outerDivId} not found, click listener not added.`);
        }
    }

    // --- Setup Individual Palette Items --- //
    // Offsets for *within* the 64x64 component area remain relative to that area
    // The centeringOffset handles positioning the whole 64x64 area inside the 76x76 stage
    const chipOffsetX = 5; // Consistent X offset for previews inside their 64x64 logical space
    const chipOffsetY = 3; // Consistent Y offset for previews inside their 64x64 logical space

    // Straight Chip
    if (typeof createStraightChipPreview === 'function') {
        setupPaletteItem('straight-chip', 'straight', createStraightChipPreview, chipOffsetX, chipOffsetY);
    } else { console.error("createStraightChipPreview function not found."); }

    // X-Chip
    if (typeof createXChipPreview === 'function') {
        setupPaletteItem('x-chip', 'x-type', createXChipPreview, chipOffsetX, chipOffsetY);
    } else { console.error("createXChipPreview function not found."); }

    // T-Chip
    if (typeof createTChipPreview === 'function') {
        setupPaletteItem('t-chip', 't-type', createTChipPreview, chipOffsetX, chipOffsetY);
    } else { console.error("createTChipPreview function not found."); }

    // Meander Chip
    if (typeof createMeanderChipPreview === 'function') {
        setupPaletteItem('meander-chip', 'meander', createMeanderChipPreview, chipOffsetX, chipOffsetY);
    } else { console.error("createMeanderChipPreview function not found."); }

    // Pump
    if (typeof createPumpPreview === 'function') {
        // Pump preview might have different size needs, adjust offsets if necessary
        // Currently uses itemWidth/itemHeight, scaling is handled within createPumpPreview potentially
        setupPaletteItem('pump', 'pump', createPumpPreview, chipOffsetX, chipOffsetY, itemWidth, itemHeight);
    } else { console.error("createPumpPreview function not found."); }

    // Outlet
    if (typeof createOutletPreview === 'function') {
        const outletKonvaContainer = document.getElementById('palette-outlet-konva');
        if (outletKonvaContainer) {
            const padding = 10; // Padding inside the LOGICAL 64x64 area
            const availableWidth = chipPreviewSize - padding; // Max width within 64x64
            const availableHeight = chipPreviewSize - padding; // Max height within 64x64
            let previewScale = Math.min(availableWidth / outletWidth, availableHeight / outletHeight);
            previewScale *= 0.85; // Further shrink
            const previewWidth = outletWidth * previewScale;
            const previewHeight = outletHeight * previewScale;
            // Calculate X, Y relative to the top-left of the 64x64 logical area
            const previewX = (chipPreviewSize - previewWidth) / 2;
            const previewY = (chipPreviewSize - previewHeight) / 2;

            // Pass calculated dimensions relative to 64x64. The createOutletPreview function positions the group,
            // and setupPaletteItem centers that group using centeringOffset.
            setupPaletteItem('outlet', 'outlet', createOutletPreview, previewX, previewY, previewWidth, previewHeight, outletSvgDataUri);
        } else {
            console.error("Palette container 'palette-outlet-konva' not found for scaling calculation!");
        }
    } else { console.error("createOutletPreview function not found."); }

    console.log('Component palette setup complete.');
} 