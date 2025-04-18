// === SECTION: UI Interaction Logic ===

// Dependencies:
// - DOM Elements: #clear-canvas-btn, #run-simulation-btn, #reset-simulation-btn, #howto-icon, #how-to-use-guide, #howto-modal-overlay, #close-howto-modal, #palette, #component-list, #toggle-palette-btn, #toggle-component-list-btn, #palette-toggle-icon, #details-toggle-icon, header, #main-content, #canvas-container
// - Simulation functions: runFluidSimulation, resetSimulationState, clearSimulationVisuals
// - Core functions: layer.find, layer.findOne, layer.draw, connections.splice, stage.findOne, updatePropertiesPanel, updateComponentList, calculateAndDisplayTubing
// - Global variables: layer, connections, startPort, selectedComponent, stage
// - Konva: Konva.Group

function setupUIEventListeners() {
    // console.log(">>> ENTERING setupUIEventListeners function.");

    // --- Clear Canvas Button Listener ---
    const clearButton = document.getElementById('clear-canvas-btn');
    // console.log("--- Checking Clear Canvas Button Listener Setup ---");
    if (clearButton) {
        // console.log("clearButton found, attaching listener...");
        clearButton.addEventListener('click', () => {
            // console.log('Clear Canvas button clicked');

            // Clear all simulation visuals first
            if (typeof clearSimulationVisuals === 'function') {
                clearSimulationVisuals();
            } else {
                // console.warn("clearSimulationVisuals function not found.");
            }

            // Then clear all components and connections
            layer.find('Group').forEach(group => {
                if (group.draggable()) {
                    const groupPorts = group.find('.connectionPort');
                    groupPorts.forEach(port => {
                        const portId = port.id();
                        const connectionsToRemove = connections.filter(conn =>
                            conn.fromPort === portId || conn.toPort === portId
                        );
                        connectionsToRemove.forEach(conn => {
                            const tubePath = layer.findOne('#' + conn.lineId + '_tube');
                            const outlinePath = layer.findOne('#' + conn.lineId + '_outline');
                            if (tubePath) tubePath.destroy();
                            if (outlinePath) outlinePath.destroy();
                            const index = connections.findIndex(c => c.lineId === conn.lineId);
                            if (index > -1) {
                                connections.splice(index, 1);
                            }
                        });
                    });
                    group.destroy();
                }
            });

            // Clear remaining connections data
            connections.length = 0;

            // Reset port selection if active
            if (startPort) {
                // Assuming cancelConnectionAttempt handles resetting visual state and nullifying startPort
                 if (typeof cancelConnectionAttempt === 'function') {
                    cancelConnectionAttempt();
                } else {
                     // Manual reset if function unavailable
                     startPort.fill(startPort.getAttr('originalFill') || portColor); // Fallback color
                     startPort = null;
                     // console.warn("cancelConnectionAttempt function not found, performing manual reset.")
                }
            }

            // Reset selected component and properties panel
            selectedComponent = null;
            if (typeof updatePropertiesPanel === 'function') {
                updatePropertiesPanel();
            } else {
                // console.warn("updatePropertiesPanel function not found.")
            }

            // Redraw the layer
            layer.draw();

            // Update UI lists
            if (typeof updateComponentList === 'function') updateComponentList();
            if (typeof calculateAndDisplayTubing === 'function') calculateAndDisplayTubing();

            // console.log('Canvas cleared.');
        });
    } else {
        // console.error('Clear Canvas button (#clear-canvas-btn) not found!');
    }

    // --- Simulation Button Listener ---
    const simButton = document.getElementById('run-simulation-btn');
    if (simButton) {
         if (typeof runFluidSimulation === 'function') {
            simButton.addEventListener('click', runFluidSimulation);
        } else {
             // console.error("runFluidSimulation function not found, cannot attach listener.");
             simButton.disabled = true; // Disable button if function missing
        }
    } else {
        // console.error("Run Simulation button (#run-simulation-btn) not found!");
    }

    // --- Reset Simulation Button Listener ---
    const resetButton = document.getElementById('reset-simulation-btn');
    if (resetButton) {
         if (typeof resetSimulationState === 'function') {
             resetButton.addEventListener('click', resetSimulationState);
         } else {
             // console.error("resetSimulationState function not found, cannot attach listener.");
             resetButton.disabled = true; // Disable button if function missing
         }
    } else {
        // console.error("Reset Simulation button (#reset-simulation-btn) not found!");
    }

    // --- How-to Modal Logic ---
    const howtoIcon = document.getElementById('howto-icon');
    const howtoModal = document.getElementById('how-to-use-guide'); // Content div
    const howtoOverlay = document.getElementById('howto-modal-overlay'); // Overlay div
    const closeHowtoBtn = document.getElementById('close-howto-modal');

    function openHowtoModal() {
        if(howtoModal && howtoOverlay) {
            howtoOverlay.classList.add('modal-visible');
        } else {
            // console.error("Cannot open modal: Modal or overlay element not found.");
        }
    }

    function closeHowtoModal() {
         if(howtoModal && howtoOverlay) {
            howtoOverlay.classList.remove('modal-visible');
        } else {
            // console.error("Cannot close modal: Modal or overlay element not found.");
        }
    }

    if (howtoIcon && howtoModal && howtoOverlay && closeHowtoBtn) {
        howtoIcon.addEventListener('click', openHowtoModal);
        closeHowtoBtn.addEventListener('click', closeHowtoModal);
        // Close modal if user clicks outside the modal content (on the overlay)
        howtoOverlay.addEventListener('click', (e) => {
             if (e.target === howtoOverlay) { // Ensure click is on overlay itself
                 closeHowtoModal();
             }
        });
        // console.log("Howto modal event listeners attached.");
    } else {
        // console.error("Could not find all elements for How-to-Use modal functionality.", {
        //     howtoIcon: !!howtoIcon,
        //     howtoModal: !!howtoModal,
        //     howtoOverlay: !!howtoOverlay,
        //     closeHowtoBtn: !!closeHowtoBtn
        // });
    }

    // --- Sidebar Toggle Logic --- //
    const palette = document.getElementById('palette');
    const componentList = document.getElementById('component-list');
    const togglePaletteBtn = document.getElementById('toggle-palette-btn');
    const toggleComponentListBtn = document.getElementById('toggle-component-list-btn');
    const paletteIcon = document.getElementById('palette-toggle-icon');
    const detailsIcon = document.getElementById('details-toggle-icon');

    if (palette && togglePaletteBtn && paletteIcon) {
        togglePaletteBtn.addEventListener('click', () => {
            const willBeVisible = !palette.classList.contains('sidebar-visible');
            palette.classList.toggle('sidebar-visible');
            // Hide component list if palette is shown (on small screens)
            if (componentList && palette.classList.contains('sidebar-visible') && window.matchMedia('(max-width: 992px)').matches) {
                componentList.classList.remove('sidebar-visible');
                if (detailsIcon) {
                    detailsIcon.src = 'icons/right_panel_open_24dp_1F1F1F_FILL0_wght400_GRAD0_opsz24.svg';
                }
            }
            // Update palette icon
            paletteIcon.src = willBeVisible ? 'icons/left_panel_close_24dp_1F1F1F_FILL0_wght400_GRAD0_opsz24.svg' : 'icons/left_panel_open_24dp_1F1F1F_FILL0_wght400_GRAD0_opsz24.svg';
        });
    } else {
        // console.error("Missing elements for Palette toggle:", { palette: !!palette, togglePaletteBtn: !!togglePaletteBtn, paletteIcon: !!paletteIcon });
    }

    if (componentList && toggleComponentListBtn && detailsIcon) {
        toggleComponentListBtn.addEventListener('click', () => {
            const willBeVisible = !componentList.classList.contains('sidebar-visible');
            componentList.classList.toggle('sidebar-visible');
             // Hide palette if component list is shown (on small screens)
            if (palette && componentList.classList.contains('sidebar-visible') && window.matchMedia('(max-width: 992px)').matches) {
                palette.classList.remove('sidebar-visible');
                if (paletteIcon) {
                    paletteIcon.src = 'icons/left_panel_open_24dp_1F1F1F_FILL0_wght400_GRAD0_opsz24.svg';
                }
            }
            // Update details icon
            detailsIcon.src = willBeVisible ? 'icons/right_panel_close_24dp_1F1F1F_FILL0_wght400_GRAD0_opsz24.svg' : 'icons/right_panel_open_24dp_1F1F1F_FILL0_wght400_GRAD0_opsz24.svg';
        });
    } else {
        // console.error("Missing elements for Details/Component List toggle:", { componentList: !!componentList, toggleComponentListBtn: !!toggleComponentListBtn, detailsIcon: !!detailsIcon });
    }

    // --- Dynamic Height Adjustment for Small Screens --- //
    const header = document.querySelector('header');
    const mainContent = document.getElementById('main-content');
    const appContainerPaddingSmall = 20; // Matches CSS padding

    function adjustLayoutHeights() {
        const missingElements = [];
        if (!header) missingElements.push('header');
        if (!palette) missingElements.push('#palette'); // Already checked, but good practice
        if (!componentList) missingElements.push('#component-list'); // Already checked
        if (!mainContent) missingElements.push('#main-content');

        if (missingElements.length > 0) {
            // console.error("Height Adjust: Missing element(s):", missingElements.join(', '));
            return;
        }

        if (window.matchMedia('(max-width: 992px)').matches) {
            const headerHeight = header.offsetHeight;
            const viewportHeight = window.innerHeight;
            const correctTop = headerHeight;
            const availableHeight = viewportHeight - correctTop - appContainerPaddingSmall;

            if (availableHeight > 0) {
                const topPx = `${correctTop}px`;
                const heightPx = `${availableHeight}px`;
                palette.style.top = topPx;
                componentList.style.top = topPx;
                palette.style.height = heightPx;
                componentList.style.height = heightPx;
                mainContent.style.maxHeight = heightPx;
                const canvasContainer = document.getElementById('canvas-container');
                if(canvasContainer) canvasContainer.style.height = heightPx;
            } else {
                 // Reset if calculation is invalid
                 palette.style.top = '';
                 componentList.style.top = '';
                 palette.style.height = '';
                 componentList.style.height = '';
                 mainContent.style.maxHeight = '';
                 const canvasContainer = document.getElementById('canvas-container');
                 if(canvasContainer) canvasContainer.style.height = '';
            }
        } else {
            // Reset styles for large screens
            palette.style.top = '';
            componentList.style.top = '';
            palette.style.height = '';
            componentList.style.height = '';
            mainContent.style.maxHeight = '';
            const canvasContainer = document.getElementById('canvas-container');
            if(canvasContainer) canvasContainer.style.height = '';
        }
    }

    // Initial adjustment on load
    adjustLayoutHeights();

    // Adjust heights on window resize
    window.addEventListener('resize', adjustLayoutHeights);

    // console.log("<<< FINISHED setupUIEventListeners function.");
}

// Example of how this might be called (e.g., from app.js DOMContentLoaded):
// document.addEventListener('DOMContentLoaded', () => {
//     // ... other setup ...
//     setupUIEventListeners();
//     // ...
// }); 