// === SECTION: Drag and Drop Logic ===

// Dependencies:
// - Konva objects: stage, layer
// - Global variables: dropIndicatorShape
// - Component creation functions: createStraightChip, createXChip, createTChip, createPump, createOutlet, createMeanderChip
// - UI update functions: updateComponentList, findFlowPathAndHighlight (or simulationVisuals update)
// - Constants: itemWidth, itemHeight, outletWidth, outletHeight, chipWidth, chipHeight
// - DOM Elements: palette items ([id$="-konva"][draggable="true"]), stage.container(), #getting-started-overlay

let dragChipType = null; // Tracks the type of chip being dragged

function setupDragAndDropListeners() {
    // Select the inner konva divs which are now draggable
    document.querySelectorAll('[id$="-konva"][draggable="true"]').forEach(konvaDiv => {
        if (!konvaDiv) return;

        konvaDiv.addEventListener('dragstart', (e) => {
            // Get the type from the konva div's data attribute
            dragChipType = konvaDiv.getAttribute('data-chip-type');
            console.log('Dragging:', dragChipType);

            // Change cursor
            if(e.target.style) e.target.style.cursor = 'grabbing';

            // Optional: Customize drag image (browser handles default)
            // e.dataTransfer.setData('text/plain', dragChipType);
            // if (e.dataTransfer.setDragImage) {
            //     const preview = konvaDiv.closest('.palette-chip');
            //     e.dataTransfer.setDragImage(preview, 0, 0);
            // }
        });

        konvaDiv.addEventListener('dragend', (e) => {
            console.log('Drag ended');

            // Reset cursor and remove indicator
            if(e.target.style) e.target.style.cursor = 'grab';
            if (dropIndicatorShape) {
                dropIndicatorShape.destroy();
                dropIndicatorShape = null;
                layer.batchDraw();
            }

            // Reset dragChipType in a timeout to avoid race conditions
            setTimeout(() => { dragChipType = null; }, 0);
        });
    });

    const stageContainer = stage.container();
    if (!stageContainer) {
        console.error("Stage container not found for D&D listeners!");
        return;
    }

    stageContainer.addEventListener('dragover', (e) => {
        e.preventDefault(); // Necessary to allow dropping

        // Show/Update drop indicator only if dragging a known chip type
        if (dragChipType) {
            stage.setPointersPositions(e);
            const pos = stage.getPointerPosition();
            if (!pos) return; // Exit if pointer position is not available

            let indicatorWidth, indicatorHeight;

            // Determine size based on the type being dragged
            switch (dragChipType) {
                case 'pump':
                    indicatorWidth = itemWidth;
                    indicatorHeight = itemHeight;
                    break;
                case 'outlet':
                    indicatorWidth = outletWidth;
                    indicatorHeight = outletHeight;
                    break;
                case 'straight':
                case 'x-type':
                case 't-type':
                case 'meander':
                    indicatorWidth = chipWidth;
                    indicatorHeight = chipHeight;
                    break;
                default:
                    // Unknown type, don't show indicator
                    if (dropIndicatorShape) {
                       dropIndicatorShape.destroy();
                       dropIndicatorShape = null;
                       layer.batchDraw();
                    }
                    return;
            }

            const dropX = pos.x - indicatorWidth / 2;
            const dropY = pos.y - indicatorHeight / 2;

            if (!dropIndicatorShape) {
                dropIndicatorShape = new Konva.Rect({
                    fill: 'rgba(0, 51, 102, 0.1)', // Semi-transparent blue
                    stroke: '#003366', // Solid blue border
                    strokeWidth: 1,
                    dash: [4, 2],
                    listening: false, // Non-interactive
                    name: 'dropIndicator' // Add name for potential identification
                });
                layer.add(dropIndicatorShape); // Add to main layer
            }

            // Update size and position
            dropIndicatorShape.setAttrs({
                x: dropX,
                y: dropY,
                width: indicatorWidth,
                height: indicatorHeight
            });

            layer.batchDraw(); // Draw the indicator updates
        }
    });

    stageContainer.addEventListener('dragleave', (e) => {
        // Remove indicator if the cursor leaves the stage container boundary
        if (dropIndicatorShape) {
            dropIndicatorShape.destroy();
            dropIndicatorShape = null;
            layer.batchDraw();
        }
    });

    stageContainer.addEventListener('drop', (e) => {
        e.preventDefault(); // Prevent default drop behavior (like opening file)

        // Destroy indicator regardless, before processing drop
        if (dropIndicatorShape) {
            dropIndicatorShape.destroy();
            dropIndicatorShape = null;
        }

        if (dragChipType) {
            stage.setPointersPositions(e);
            const pos = stage.getPointerPosition();
            if (!pos) {
                 console.error("Could not get pointer position on drop.");
                 dragChipType = null; // Reset drag type
                 return;
            }

            let dropX, dropY;
            let newItem;
            let isAsyncItem = false; // Flag for items that load asynchronously (like images)

            // Calculate drop position and create the corresponding component
            switch (dragChipType) {
                case 'pump':
                    dropX = pos.x - itemWidth / 2;
                    dropY = pos.y - itemHeight / 2;
                    newItem = createPump(dropX, dropY);
                    isAsyncItem = true; // Pump might load SVG, treat as async
                    break;
                case 'outlet':
                    dropX = pos.x - outletWidth / 2;
                    dropY = pos.y - outletHeight / 2;
                    newItem = createOutlet(dropX, dropY);
                    isAsyncItem = true; // Outlet loads SVG
                    break;
                case 'straight':
                    dropX = pos.x - chipWidth / 2;
                    dropY = pos.y - chipHeight / 2;
                    newItem = createStraightChip(dropX, dropY);
                    break;
                case 'x-type':
                    dropX = pos.x - chipWidth / 2;
                    dropY = pos.y - chipHeight / 2;
                    newItem = createXChip(dropX, dropY);
                    break;
                case 't-type':
                    dropX = pos.x - chipWidth / 2;
                    dropY = pos.y - chipHeight / 2;
                    newItem = createTChip(dropX, dropY);
                    break;
                case 'meander':
                    dropX = pos.x - chipWidth / 2;
                    dropY = pos.y - chipHeight / 2;
                    newItem = createMeanderChip(dropX, dropY);
                    break;
                default:
                    console.warn("Unknown chip type dropped:", dragChipType);
                    newItem = null;
            }

            if (newItem) {
                layer.add(newItem);
                console.log('Dropped', dragChipType, 'at', dropX.toFixed(1), dropY.toFixed(1));

                // Hide the 'getting started' overlay if it's visible
                const overlay = document.getElementById('getting-started-overlay');
                if (overlay && !overlay.classList.contains('hidden')) {
                     overlay.classList.add('hidden');
                }

                // Update UI elements after adding the item
                // Need to ensure these functions are accessible (global or passed)
                if (typeof findFlowPathAndHighlight === 'function') {
                     findFlowPathAndHighlight();
                } else {
                    console.warn("findFlowPathAndHighlight function not accessible in dragAndDrop.js");
                }

                // Use setTimeout for async items to allow image loading before list update
                const updateDelay = isAsyncItem ? 100 : 0;
                setTimeout(() => {
                    if (typeof updateComponentList === 'function') {
                         updateComponentList();
                    } else {
                        console.warn("updateComponentList function not accessible in dragAndDrop.js");
                    }
                    // Also update tubing calculation after list update
                     if (typeof calculateAndDisplayTubing === 'function') {
                         calculateAndDisplayTubing();
                    } else {
                        console.warn("calculateAndDisplayTubing function not accessible in dragAndDrop.js");
                    }
                }, updateDelay);

                layer.draw(); // Draw the newly added item
            }

            // Reset the dragged type AFTER processing the drop
            dragChipType = null;

        } else {
             // This might happen if dragend fired before drop, or if drop occurred without a prior dragstart
             console.log("Drop event occurred but no dragChipType was set. Ignoring.");
        }
    });

    console.log('Drag and Drop listeners setup complete.');
}

// Example of how this might be called (e.g., from app.js DOMContentLoaded):
// document.addEventListener('DOMContentLoaded', () => {
//     // ... other setup ...
//     setupDragAndDropListeners();
//     // ...
// }); 