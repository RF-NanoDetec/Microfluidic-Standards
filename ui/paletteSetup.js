// === SECTION: Palette Setup Logic ===

// Dependencies:
// - Konva: Konva.Stage, Konva.Layer, Konva.Text
// - Component Preview Functions: createStraightChipPreview, createXChipPreview, createTChipPreview, createMeanderChipPreview, createPumpPreview, createOutletPreview
// - Sidebar Function: handlePaletteSelection (from ui/sidebar.js)
// - Utility Function: getComponentDisplayName (from core/utils.js)
// - Constants: chipWidth, chipHeight, itemWidth, itemHeight, outletWidth, outletHeight, outletSvgDataUri
// - DOM Elements: #palette-straight-chip-konva, #palette-straight-chip, #palette-x-chip-konva, #palette-x-chip, #palette-t-chip-konva, #palette-t-chip, #palette-meander-chip-konva, #palette-meander-chip, #palette-pump-konva, #palette-pump, #palette-outlet-konva, #palette-outlet

function setupPalette() {
    console.log("Setting up component palette...");
    // --- Define fixed size for palette chip Konva stages --- //
    const chipPreviewSize = 64; // Match the CSS width/height for .palette-chip

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
            width: chipPreviewSize,
            height: chipPreviewSize,
        });
        const paletteLayer = new Konva.Layer();
        paletteStage.add(paletteLayer);

        // Create and add the preview shape
        const previewShape = createPreviewFunc(...previewArgs);
        if (previewShape) {
            paletteLayer.add(previewShape);
             // Special handling for async previews (like images in outlets)
             // Drawing might happen within the createPreviewFunc callback
             if (!chipType || (chipType !== 'outlet' && chipType !== 'pump')) { // Assume others draw immediately
                  paletteLayer.draw();
             }
        } else {
             console.error(`Failed to create preview for ${chipType}`);
        }

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
    const chipOffsetX = 5; // Consistent X offset for previews
    const chipOffsetY = 3; // Consistent Y offset for previews

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
        // Outlet requires scaling calculation
        const outletKonvaContainer = document.getElementById('palette-outlet-konva');
        if (outletKonvaContainer) {
             const padding = 10;
             const availableWidth = chipPreviewSize - padding;
             const availableHeight = chipPreviewSize - padding;
             let previewScale = Math.min(availableWidth / outletWidth, availableHeight / outletHeight);
             previewScale *= 0.85; // Further shrink
             const previewWidth = outletWidth * previewScale;
             const previewHeight = outletHeight * previewScale;
             const previewX = (chipPreviewSize - previewWidth) / 2;
             const previewY = (chipPreviewSize - previewHeight) / 2;

            // Pass calculated dimensions and the SVG data URI
            setupPaletteItem('outlet', 'outlet', createOutletPreview, previewX, previewY, previewWidth, previewHeight, outletSvgDataUri);
        } else {
            console.error("Palette container 'palette-outlet-konva' not found for scaling calculation!");
        }
    } else { console.error("createOutletPreview function not found."); }

    console.log('Component palette setup complete.');
} 