// === SECTION: Canvas Interaction Logic ===

// Dependencies:
// - Konva: stage, layer, Konva.Group
// - Global variables: selectedComponent, connections
// - UI Update Functions: updatePropertiesPanel, updateComponentList, calculateAndDisplayTubing
// - Constants: chipStroke

function setupCanvasEventListeners() {
    console.log("Setting up Canvas Event Listeners...");

    // --- Stage Click Listener for Component Selection/Deselection ---
    stage.on('click tap', function (e) {
        // If click is on the stage background, deselect everything
        if (e.target === stage) {
            // Visually deselect previous canvas component
            if (selectedComponent && selectedComponent instanceof Konva.Group && !selectedComponent.isPaletteItem) {
                const border = selectedComponent.findOne('.component-border');
                if (border) {
                    const type = selectedComponent.getAttr('chipType');
                    // Pumps/Outlets have no border when deselected
                    if (type === 'outlet' || type === 'pump') {
                        border.stroke(null);
                        border.strokeWidth(0);
                    } else {
                        border.stroke(chipStroke); // Default border for chips
                        border.strokeWidth(1);
                    }
                }
            }

            // Logically deselect (clear the variable)
            selectedComponent = null;

            // Update the properties panel to show nothing
            if (typeof updatePropertiesPanel === 'function') {
                updatePropertiesPanel();
            } else {
                 console.warn("updatePropertiesPanel function not available in canvasInteractions.js");
            }

            // Hide the selected component details box in the UI
            const selectedBox = document.querySelector('.selected-component-box');
            if (selectedBox) selectedBox.style.display = 'none';

            layer.draw(); // Redraw layer to remove highlight
            return; // Stop processing
        }

        // If click was not on the stage, try to find the component group clicked
        let componentGroup = e.target.findAncestor('Group', true); // Find draggable ancestor
        if (e.target instanceof Konva.Group && e.target.draggable()) {
            componentGroup = e.target; // Clicked directly on the group
        }

        // If a valid, draggable component group was clicked
        if (componentGroup && componentGroup.draggable()) {
            // If this is a different component than already selected
            if (componentGroup !== selectedComponent) {
                // Deselect previous component (if any)
                if (selectedComponent && selectedComponent instanceof Konva.Group && !selectedComponent.isPaletteItem) {
                    const oldBorder = selectedComponent.findOne('.component-border');
                    if (oldBorder) {
                        const oldType = selectedComponent.getAttr('chipType');
                        if (oldType === 'outlet' || oldType === 'pump') {
                            oldBorder.stroke(null); oldBorder.strokeWidth(0);
                        } else {
                            oldBorder.stroke(chipStroke); oldBorder.strokeWidth(1);
                        }
                    }
                }
                // No visual deselection if previous was palette item

                // Select the new component
                selectedComponent = componentGroup;

                // Update the properties panel
                 if (typeof updatePropertiesPanel === 'function') {
                    updatePropertiesPanel();
                } else {
                    console.warn("updatePropertiesPanel function not available in canvasInteractions.js");
                }

                // Show the component details box
                const selectedBox = document.querySelector('.selected-component-box');
                if (selectedBox) selectedBox.style.display = 'flex'; // Use flex as defined for .sidebar-box

                // Visually highlight the new selection
                const newBorder = selectedComponent.findOne('.component-border');
                if (newBorder) {
                    newBorder.stroke('blue');
                    newBorder.strokeWidth(2);
                }

                layer.draw(); // Redraw to show highlight
            }
            // If clicked the same component, do nothing (it's already selected)
        }
        // If click was on something non-selectable within the stage, do nothing
    });
    console.log("Stage click/tap listener for selection attached.");

    // --- Keyboard Listener for Deleting Components ---
    document.addEventListener('keydown', (e) => {
        // Check if Delete or Backspace was pressed AND a component is selected
        if ((e.key === 'Delete' || e.key === 'Backspace') && selectedComponent) {

             // Prevent default browser behavior (e.g., navigating back)
             // Especially important if the focus is not on an input field
             if (document.activeElement?.tagName !== 'INPUT') {
                 e.preventDefault();
             }

            // Only act on components on the canvas (Konva Groups), not palette items
            if (selectedComponent instanceof Konva.Group && !selectedComponent.isPaletteItem) {
                console.log(`Delete requested for component: ${selectedComponent.id()}`);
                const componentToDelete = selectedComponent; // Store reference
                const groupPorts = componentToDelete.find('.connectionPort');
                const portsToRestore = new Set(); // Track ports on OTHER components

                // Remove connections linked to this component
                groupPorts.forEach(port => {
                    const portId = port.id();
                    // Find connections involving this port
                    const connectionsToRemove = connections.filter(conn =>
                        conn.fromPort === portId || conn.toPort === portId
                    );

                    connectionsToRemove.forEach(conn => {
                        // Find the visual lines
                        const tubePath = layer.findOne('#' + conn.lineId + '_tube');
                        const outlinePath = layer.findOne('#' + conn.lineId + '_outline');
                        if (tubePath) tubePath.destroy();
                        if (outlinePath) outlinePath.destroy();

                        // Identify the port on the OTHER component
                        const otherPortId = conn.fromPort === portId ? conn.toPort : conn.fromPort;
                        portsToRestore.add(otherPortId);

                        // Remove connection data
                        const index = connections.findIndex(c => c.lineId === conn.lineId);
                        if (index > -1) {
                            connections.splice(index, 1);
                        }
                    });
                });

                // Restore visibility of ports on connected components
                portsToRestore.forEach(portId => {
                    const port = stage.findOne('#' + portId);
                    if (port && !isPortConnected(portId)) { // Ensure isPortConnected is available
                         port.visible(true);
                         // Optional: Restore boundary circle if used
                         // const boundary = port.getParent()?.findOne('.portBoundary');
                         // if (boundary) boundary.visible(true);
                    }
                });

                // Remove the component group itself
                componentToDelete.destroy();

                // Reset selection state
                selectedComponent = null;

                // Update UI
                if (typeof updatePropertiesPanel === 'function') updatePropertiesPanel();
                if (typeof updateComponentList === 'function') updateComponentList();
                if (typeof calculateAndDisplayTubing === 'function') calculateAndDisplayTubing();
                // Optionally, re-run flow path highlighting if needed
                if (typeof findFlowPathAndHighlight === 'function') findFlowPathAndHighlight();


                layer.draw(); // Redraw canvas
                console.log(`Component ${componentToDelete.id()} deleted.`);
            }
        }
    });
    console.log("Keydown listener for delete/backspace attached.");

    console.log("Canvas Event Listeners setup complete.");
}

// Example call:
// document.addEventListener('DOMContentLoaded', () => {
//    // ... other setup
//    setupCanvasEventListeners();
// }); 