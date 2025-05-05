// Sidebar UI Management Functions
// Originally from app.js
// Dependencies:
// - Global variables: selectedComponent, propertiesContainer, tubingInfoContainer, componentListContainer, stage, layer, connections, simulationResults
// - Constants: MBAR_TO_PASCAL, PASCAL_TO_MBAR, PIXEL_TO_METER_SCALE, MICRO_LITERS_PER_MINUTE_FACTOR, chipWidth, chipHeight, itemWidth, itemHeight, outletWidth, outletHeight, CHANNEL_WIDTH_MICRONS, CHANNEL_DEPTH_MICRONS, LENGTH_STRAIGHT_MM, LENGTH_T_X_SEGMENT_MM, LENGTH_MEANDER_MM, TUBE_INNER_RADIUS_M
// - Utility functions (from core/utils.js): getComponentDisplayName, formatScientificNotation
// - Helper functions (from core/simulationHelpers.js or app.js if not moved): getInternalNodeId, getSegmentId
// - Konva objects: stage, layer

// --- NEW: Global reference for the Konva pump pressure panel ---
let currentPumpPanel = null; // Holds the Konva.Group of the currently displayed panel

// --- DOM Element References ---
const componentListContainer = document.getElementById('component-list-content');
const propertiesContainer = document.getElementById('selected-component-properties');
const tubingInfoContainer = document.getElementById('tubing-info');
const selectedBox = document.querySelector('.selected-component-box'); // Get reference to the box itself
const selectedBoxTitle = selectedBox ? selectedBox.querySelector('h2') : null; // Get reference to the title

function updatePropertiesPanel(component = selectedComponent, tubeId = null) {
    // --- NEW: Remove any existing Konva pump panel ---
    removePumpPanel(); // Clear the on-canvas panel whenever selection changes

    if (!propertiesContainer || !selectedBox || !selectedBoxTitle) {
        console.error("Sidebar elements (properties container, box, or title) not found!");
        return;
    }

    propertiesContainer.innerHTML = ''; // Clear previous content

    // --- Handle Tube Selection ---
    if (tubeId && !component) { // Check if a tube is selected AND no component is selected
        selectedBoxTitle.textContent = 'Fluidic Tubing'; // Update title
        const tube = layer.findOne('#' + tubeId); // Find the tube shape
        const connData = connections.find(conn => conn.lineId === tubeId.replace('_tube', ''));

        if (!tube || !connData) {
            propertiesContainer.innerHTML = '<p>Error: Could not find selected tube details.</p>';
            selectedBox.style.display = 'flex'; // Show the box even on error
            return;
        }

        // Determine intended length based on pump connection
        const group1 = stage.findOne('#' + connData.fromChip);
        const group2 = stage.findOne('#' + connData.toChip);
        let intendedLengthCm = 5; // Default length (user requested 5cm)
        if (group1 && group2) {
            if (group1.getAttr('chipType') === 'pump' || group2.getAttr('chipType') === 'pump') {
                intendedLengthCm = 30;
            }
        } else {
            console.warn("Could not find groups to determine tube length for:", connData.lineId);
        }

        // Get resistance (calculated from visual length)
        const resistance = connData.resistance;
        // Get inner dimension used in calculation (from constants.js)
        const innerRadiusM = typeof TUBE_INNER_RADIUS_M !== 'undefined' ? TUBE_INNER_RADIUS_M : 0.000254;
        const innerDiameterInches = (innerRadiusM * 2 * 1000 / 25.4).toFixed(3); // Convert m to inches

        let propertiesHtml = `<p style="font-size: 0.8em; color: #666; margin-top: -8px; margin-bottom: 10px;">ID: ${connData.lineId}</p>`;
        propertiesHtml += '<div class="properties-grid">'; // Use grid for consistency
        propertiesHtml += `<div class="prop-row"><span class="prop-label">Length:</span><span class="prop-value">${intendedLengthCm} cm</span></div>`; // Display 5 or 30 cm
        propertiesHtml += `<div class="prop-row"><span class="prop-label">Resistance:</span><span class="prop-value">${formatScientificNotation(resistance)} Pa·s/m³</span></div>`; // Display resistance from visual length
        propertiesHtml += `<div class="prop-row"><span class="prop-label">Material:</span><span class="prop-value">Silicone</span></div>`;
        propertiesHtml += `<div class="prop-row"><span class="prop-label">Dimensions:</span><span class="prop-value">1/16 inch OD, ${innerDiameterInches} inch ID</span></div>`;
        propertiesHtml += '</div>'; // End grid

        propertiesContainer.innerHTML = propertiesHtml;
        selectedBox.style.display = 'flex'; // Ensure the box is visible

    // --- Handle Component Selection ---
    } else if (component) { // Use the passed 'component' parameter
        selectedBoxTitle.textContent = 'Selected Component'; // Reset title
        // --- Determine if selection is from palette or canvas ---
        const isPalette = component.isPaletteItem === true;
        const componentType = (typeof component.getAttr === 'function') ? component.getAttr('chipType') : component.chipType;
        const componentId = isPalette ? null : component.id(); // No ID for palette items

        // Check if componentType is valid
        if (!componentType) {
            console.error("Selected component is invalid or missing chipType", component);
            propertiesContainer.innerHTML = '<p>Error: Invalid component selected.</p>';
            selectedBox.style.display = 'flex';
            return;
        }

        const simulationRan = !isPalette && simulationResults && Object.keys(simulationResults.pressures).length > 0 && Object.keys(simulationResults.flows).length > 0;

        // --- MODIFIED: Set heading to just the component display name --- //
        let propertiesHtml = `<h3>${getComponentDisplayName(componentType)}</h3>`;

        // Display ID only for canvas components
        if (!isPalette && componentId) {
            propertiesHtml += `<p style="font-size: 0.8em; color: #666; margin-top: -8px; margin-bottom: 10px;">ID: ${componentId}</p>`;
        }

        // --- Add Component Description and Details ---
        propertiesHtml += '<div class="component-details" style="margin-bottom: 15px;">'; // Container for details
        let purpose = '';
        let material = 'Glass'; // Default for chips
        let dimensions = '';
        let resistanceText = 'N/A';
        let channelDimensionsText = ''; // <<< NEW: Initialize channel dimensions text

        // Get resistance: from object if palette, from attribute if canvas
        const resistanceValue = isPalette ? component.resistance : ((component && typeof component.getAttr === 'function') ? component.getAttr('resistance') : null);

        // Calculate dimensions in mm
        const chipDimMm = `${(chipWidth * (typeof PIXEL_TO_METER_SCALE !== 'undefined' ? PIXEL_TO_METER_SCALE : 0.0001) * 1000).toFixed(1)}mm x ${(chipHeight * (typeof PIXEL_TO_METER_SCALE !== 'undefined' ? PIXEL_TO_METER_SCALE : 0.0001) * 1000).toFixed(1)}mm`;
        const pumpDimMm = `${(itemWidth * (typeof PIXEL_TO_METER_SCALE !== 'undefined' ? PIXEL_TO_METER_SCALE : 0.0001) * 1000).toFixed(1)}mm x ${(itemHeight * (typeof PIXEL_TO_METER_SCALE !== 'undefined' ? PIXEL_TO_METER_SCALE : 0.0001) * 1000).toFixed(1)}mm`;
        const outletDimMm = `${(outletWidth * (typeof PIXEL_TO_METER_SCALE !== 'undefined' ? PIXEL_TO_METER_SCALE : 0.0001) * 1000).toFixed(1)}mm x ${(outletHeight * (typeof PIXEL_TO_METER_SCALE !== 'undefined' ? PIXEL_TO_METER_SCALE : 0.0001) * 1000).toFixed(1)}mm`;

        switch (componentType) {
            case 'straight':
                purpose = 'Provides a simple, straight path for fluid transport between two points.';
                dimensions = chipDimMm;
                resistanceText = resistanceValue ? `${formatScientificNotation(resistanceValue)} Pa·s/m³` : 'Error';
                channelDimensionsText = `${CHANNEL_WIDTH_MICRONS}µm W x ${CHANNEL_DEPTH_MICRONS}µm D x ${LENGTH_STRAIGHT_MM}mm L`;
                break;
            case 't-type':
                purpose = 'Used to split one fluid stream into two, or merge two streams into one.';
                dimensions = chipDimMm;
                resistanceText = resistanceValue ? `${formatScientificNotation(resistanceValue)} Pa·s/m³ (per segment)` : 'Error';
                channelDimensionsText = `${CHANNEL_WIDTH_MICRONS}µm W x ${CHANNEL_DEPTH_MICRONS}µm D x ${LENGTH_T_X_SEGMENT_MM}mm L (per segment)`;
                break;
            case 'x-type':
                purpose = 'Allows for complex flow manipulation, such as mixing four streams or forming droplets.';
                dimensions = chipDimMm;
                resistanceText = resistanceValue ? `${formatScientificNotation(resistanceValue)} Pa·s/m³ (per segment)` : 'Error';
                channelDimensionsText = `${CHANNEL_WIDTH_MICRONS}µm W x ${CHANNEL_DEPTH_MICRONS}µm D x ${LENGTH_T_X_SEGMENT_MM}mm L (per segment)`;
                break;
            case 'meander':
                purpose = 'Increases the path length within a small area, useful for mixing, heat exchange, or increasing reaction time.';
                dimensions = chipDimMm;
                resistanceText = resistanceValue ? `${formatScientificNotation(resistanceValue)} Pa·s/m³` : 'Error';
                channelDimensionsText = `${CHANNEL_WIDTH_MICRONS}µm W x ${CHANNEL_DEPTH_MICRONS}µm D x ${LENGTH_MEANDER_MM}mm L (total)`;
                break;
            case 'pump':
                purpose = 'Acts as the fluid source, providing adjustable pressure to drive flow through the connected network via its four output ports.';
                material = 'N/A'; // Pumps aren't typically glass microfluidic chips
                dimensions = pumpDimMm;
                resistanceText = 'N/A (Source)';
                break;
            case 'outlet':
                purpose = 'Represents the exit point of the fluidic system, typically assumed to be at atmospheric pressure (0 Pa relative).';
                material = 'N/A'; // Outlets aren't typically glass microfluidic chips
                dimensions = outletDimMm;
                resistanceText = 'N/A (Sink)';
                break;
            default:
                purpose = 'Unknown component type.';
                material = 'N/A';
                dimensions = 'N/A';
                resistanceText = 'N/A';
        }

        propertiesHtml += `<p class="component-purpose">${purpose}</p>`;

        propertiesHtml += '<div class="properties-grid">'; // Start grid container

        if (material !== 'N/A') {
            propertiesHtml += `<div class="prop-row"><span class="prop-label">Material:</span><span class="prop-value">${material}</span></div>`;
        }
        if (componentType !== 'pump' && componentType !== 'outlet') {
            propertiesHtml += `<div class="prop-row"><span class="prop-label">Chip Dim.:</span><span class="prop-value">${dimensions}</span></div>`;

            if (channelDimensionsText) {
                let valueHtml = channelDimensionsText;
                let subValueHtml = '';
                if (valueHtml.includes('(per segment)')) {
                    valueHtml = valueHtml.replace('(per segment)', '').trim();
                    subValueHtml = '<span class="prop-sub-value">(per segment)</span>';
                } else if (valueHtml.includes('(total)')) {
                     valueHtml = valueHtml.replace('(total)', '').trim();
                     subValueHtml = '<span class="prop-sub-value">(total)</span>';
                }
                propertiesHtml += `<div class="prop-row"><span class="prop-label">Channel Dim.:</span><span class="prop-value">${valueHtml}${subValueHtml}</span></div>`;
            }
        }
        if (resistanceText !== 'N/A (Source)' && resistanceText !== 'N/A (Sink)') {
             let valueHtml = resistanceText;
             let subValueHtml = '';
             if (valueHtml.includes('(per segment)')) {
                 valueHtml = valueHtml.replace('(per segment)', '').trim();
                 subValueHtml = '<span class="prop-sub-value">(per segment)</span>';
             }
             propertiesHtml += `<div class="prop-row"><span class="prop-label">Resistance:</span><span class="prop-value">${valueHtml}${subValueHtml}</span></div>`;
        }

        propertiesHtml += '</div>'; // End grid container

        propertiesHtml += '</div>'; // End component-details

        if (!isPalette && componentType === 'pump') {
            propertiesHtml += '<hr style="margin: 15px 0;">';
            propertiesHtml += '<h4 class="subheading">Port Pressures (mbar)</h4>';
            const portPressuresPa = component.getAttr('portPressures') || {};
            const ports = component.find('.connectionPort');

            if (ports.length === 0) {
                propertiesHtml += '<p>No ports found.</p>';
            } else {
                ports.forEach((port, index) => {
                    const portId = port.id();
                    const currentPressurePa = portPressuresPa[portId] || 0;
                    const currentPressureMbar = Math.round(currentPressurePa / MBAR_TO_PASCAL).toString(); // Convert to rounded integer mbar string

                    propertiesHtml += `
                        <div class="property-item">
                            <label for="pressure_${portId}">Port ${index + 1}:</label>
                            <input type="number" id="pressure_${portId}" data-port-id="${portId}" value="${currentPressureMbar}" step="1">
                        </div>
                    `;
                });
            }
            // --- NEW: Create the Konva panel for the pump ---
            // Ensure this happens *after* the sidebar HTML is potentially updated by handlePressureInputChange if needed
            // Use a small timeout to ensure DOM/Konva state is stable after potential sidebar updates
             setTimeout(() => createOrUpdatePumpPanel(component), 0);
        }

        if (simulationRan && (componentType === 't-type' || componentType === 'x-type')) {
            propertiesHtml += '<hr style="margin: 15px 0;">';
            propertiesHtml += '<h4 class="subheading">Internal Junction Simulation</h4>';

            // Ensure getInternalNodeId exists and is accessible
            const internalNodeId = typeof getInternalNodeId === 'function' ? getInternalNodeId(componentId) : `internal_${componentId}`; // Fallback if function not found
            const internalPressurePa = simulationResults.pressures[internalNodeId];

            if (internalPressurePa !== undefined && isFinite(internalPressurePa)) {
                const internalPressureMbar = internalPressurePa / MBAR_TO_PASCAL;
                propertiesHtml += `<div class="property-item"><span>Junction Pressure: ${internalPressureMbar.toFixed(1)} mbar</span></div>`;
            } else {
                propertiesHtml += `<div class="property-item"><span>Junction Pressure: N/A</span></div>`;
            }

            propertiesHtml += '<h5 class="subheading-small">Segment Flows (to/from Junction):</h5>';
            const ports = component.find('.connectionPort');
            if (ports.length > 0) {
                propertiesHtml += '<ul class="simulation-list">';
                ports.forEach(port => {
                    const portId = port.id();
                    const portGenericId = port.getAttr('portId');
                    // Ensure getSegmentId exists and is accessible
                     const segmentId = typeof getSegmentId === 'function' ? getSegmentId(portId, internalNodeId) : `${portId}_${internalNodeId}`; // Fallback

                    const flowData = simulationResults.flows[segmentId];
                    let flowText = "N/A";

                    if (flowData && isFinite(flowData.flow)) {
                        const flowRateM3ps = flowData.flow;
                        const flowRateUlMin = flowRateM3ps * MICRO_LITERS_PER_MINUTE_FACTOR;
                        let directionIndicator = "";
                        if (Math.abs(flowRateM3ps) > 1e-15) {
                            if (flowData.to === internalNodeId) {
                                directionIndicator = "+"; // Flow INTO junction
                            } else if (flowData.from === internalNodeId) {
                                directionIndicator = "-"; // Flow OUT OF junction
                            }
                        }
                        flowText = `${directionIndicator}${Math.abs(flowRateUlMin).toFixed(2)} µL/min`;
                    }
                    propertiesHtml += `<li>${portGenericId}: ${flowText}</li>`;
                });
                propertiesHtml += '</ul>';
            } else {
                 propertiesHtml += '<p class="simulation-list-empty">No ports found for flow details.</p>';
            }
        }

        propertiesContainer.innerHTML = propertiesHtml;
        selectedBox.style.display = 'flex'; // Ensure box is visible

    // --- Handle No Selection ---
    } else {
        selectedBoxTitle.textContent = 'Selected Component'; // Reset title
        propertiesContainer.innerHTML = '<p>Select a component or connection for details.</p>'; // Default message
        selectedBox.style.display = 'none'; // Hide the box if nothing is selected
    }
}

function handlePressureInputChange(event) {
    if (!selectedComponent || selectedComponent.getAttr('chipType') !== 'pump') {
        return;
    }

    const input = event.target;
    const portId = input.dataset.portId;
    const newPressureMbar = parseFloat(input.value);

    if (!isNaN(newPressureMbar) && portId) {
        const newPressurePa = newPressureMbar * MBAR_TO_PASCAL;
        const currentPressures = selectedComponent.getAttr('portPressures') || {};
        currentPressures[portId] = newPressurePa;
        selectedComponent.setAttr('portPressures', currentPressures);
        console.log(`Updated pressure for ${selectedComponent.id()} port ${portId} to ${newPressureMbar} mbar`);
        // No need to redraw the pump itself, but might trigger simulation update later
        // Optionally, immediately re-run simulation if desired:
        // if (autoSimulationEnabled) { // Assuming a toggle exists
        //     runSimulation();
        // }
    } else {
        console.warn("Invalid pressure input or port ID:", input.value, portId);
        // Optionally reset the input to the previous value
        // input.value = (selectedComponent.getAttr('portPressures')[portId] || 0) / MBAR_TO_PASCAL;
    }
}


function calculateAndDisplayTubing() {
    let totalTubingLength = 0;

    connections.forEach(conn => {
        const group1 = stage.findOne('#' + conn.fromChip);
        const group2 = stage.findOne('#' + conn.toChip);

        if (group1 && group2) {
            const type1 = group1.getAttr('chipType');
            const type2 = group2.getAttr('chipType');

            // Apply rules: 30cm if connected to pump, 10cm otherwise
            if (type1 === 'pump' || type2 === 'pump') {
                totalTubingLength += 30;
            } else {
                totalTubingLength += 10;
            }
        } else {
            console.warn("Could not find connected groups for tubing calculation:", conn);
        }
    });

    if (tubingInfoContainer) {
        // Find the tubing length div element inside the container
        const tubingLengthElement = tubingInfoContainer.querySelector('.tubing-length');
        if (tubingLengthElement) {
            tubingLengthElement.textContent = `${totalTubingLength} cm`;
        } else {
            console.error("Tubing length element not found within #tubing-info!");
        }
    } else {
        console.error("Tubing info container not found!");
    }
}

function updateComponentList() {
    const componentCounts = {};
    let totalComponents = 0;

    layer.find('Group').forEach(group => {
        if (group.draggable()) { // Only count draggable components on the canvas
            const chipType = group.getAttr('chipType');
            if (chipType) {
                componentCounts[chipType] = (componentCounts[chipType] || 0) + 1;
                totalComponents++;
            }
        }
    });

    if (!componentListContainer) {
        console.error("Component list container not found!");
        return;
    }

    if (totalComponents === 0) {
        componentListContainer.innerHTML = '<p class="empty-state">No components added yet.</p>';
    } else {
        let listHtml = '';
        const sortedTypes = Object.keys(componentCounts).sort((a, b) => {
            // Ensure getComponentDisplayName is accessible
            const nameA = typeof getComponentDisplayName === 'function' ? getComponentDisplayName(a) : a;
            const nameB = typeof getComponentDisplayName === 'function' ? getComponentDisplayName(b) : b;
            return nameA.localeCompare(nameB);
        });

        sortedTypes.forEach(chipType => {
             // Ensure getComponentDisplayName is accessible
            const displayName = typeof getComponentDisplayName === 'function' ? getComponentDisplayName(chipType) : chipType;
            const count = componentCounts[chipType];
            listHtml += `<div class="component-row">
                <span class="component-name">${displayName}</span>
                <span class="component-quantity">${count}</span>
            </div>`;
        });
        componentListContainer.innerHTML = listHtml;
    }
}

function handlePaletteSelection(chipType) {
    console.log(`Palette item selected: ${chipType}`);

    // Find the corresponding preview object in the paletteItems map
    const previewObject = paletteItems[chipType];

    if (!previewObject) {
        console.error(`Preview object for ${chipType} not found in paletteItems.`);
        selectedComponent = null; // Clear selection if object not found
        updatePropertiesPanel(); // Update panel to show nothing selected
        return;
    }

    // Set the selected component to the palette preview object
    // Add a flag to distinguish it from canvas components
    selectedComponent = { ...previewObject, isPaletteItem: true, chipType: chipType };

    // De-select any canvas components visually (optional, but good practice)
    transformer.nodes([]);
    layer.batchDraw(); // Update the layer to remove transformer visuals

    // Update the properties panel to show info for the selected palette item
    updatePropertiesPanel();
}

// Add event listener for pump pressure changes
// Make sure this listener is added only once, maybe outside the function or checked
if (!propertiesContainer.dataset.listenerAttached) {
    propertiesContainer.addEventListener('change', (event) => {
        if (event.target.type === 'number' && event.target.id.startsWith('pressure_')) {
            handlePressureInputChange(event);
        }
    });
    propertiesContainer.dataset.listenerAttached = 'true';
}

// --- NEW: Pump Panel Functions ---

/**
 * Removes the currently displayed Konva pump pressure panel from the stage.
 */
function removePumpPanel() {
    if (currentPumpPanel) {
        // Optional: Add fade-out animation later
        currentPumpPanel.destroy(); // Remove the group and its children
        currentPumpPanel = null;
        // Ensure the layer redraws to reflect the removal
        if (typeof layer !== 'undefined' && layer) { // Check if layer is defined
             layer.batchDraw(); // Use batchDraw for efficiency
        } else {
            console.warn("Cannot redraw layer; 'layer' is not accessible in removePumpPanel.");
        }
    }
}


/**
 * Creates or updates the Konva panel displaying pressure inputs near the selected pump.
 * @param {Konva.Group} pumpGroup The selected pump group.
 */
function createOrUpdatePumpPanel(pumpGroup) {
    // Check required globals exist
    if (typeof layer === 'undefined' || !layer || typeof stage === 'undefined' || !stage) {
        console.error("Konva layer or stage not available for pump panel.");
        return;
    }
     // Check pumpGroup validity
    if (!pumpGroup || typeof pumpGroup.getAttr !== 'function' || pumpGroup.getAttr('chipType') !== 'pump') {
        console.warn("createOrUpdatePumpPanel called with invalid target:", pumpGroup);
        return;
    }


    // --- Remove existing panel first (safety check) ---
    removePumpPanel(); // Should be redundant if called correctly, but good practice

    // --- Panel Configuration (More Minimal) ---
    const panelPadding = 3; // Reduced
    const labelHeight = 15; // Reduced
    const valueWidth = 30; // Reduced (for ~4 digits)
    const labelWidth = 15; // Reduced significantly ("X:")
    const rowSpacing = 1;

    // --- Get Pump Info ---
    // Use getClientRect relative to the stage for reliable positioning
    const pumpRect = pumpGroup.getClientRect({ relativeTo: stage });
    const portPressuresPa = pumpGroup.getAttr('portPressures') || {};
    const ports = pumpGroup.find('.connectionPort'); // Assumes ports have this class/name

    if (ports.length === 0) return; // No ports, no panel needed

    // --- Create Panel Group ---
    const panelGroup = new Konva.Group({
        // x: pumpRect.x + pumpRect.width + panelPadding, // Default Position to the right - Set later
        // y: pumpRect.y + panelOffsetY,                  // Default Position slightly above - Set later
        opacity: 0, // Start invisible for fade-in
    });
    panelGroup.name('pumpPressurePanel'); // Identify the panel

    // --- Calculate Width First ---
    const totalPanelWidth = labelWidth + valueWidth + (3 * panelPadding);

    // --- Create Title Text (to get actual height) ---
    const titleText = new Konva.Text({
        x: panelPadding,
        y: panelPadding,
        text: "Pressures (mbar)",
        fontSize: 9, // Smaller than values
        fontFamily: 'Arial',
        fontStyle: 'italic',
        fill: '#000000', // Black
        width: totalPanelWidth - 2 * panelPadding,
        align: 'center'
    });
    const titleHeight = titleText.height() + panelPadding; // Actual height needed for the title + spacing below it

    // --- Calculate Total Height based on Actual Title Height ---
    const rowsHeight = ports.length * (labelHeight + rowSpacing) - rowSpacing;
    const totalPanelHeight = titleHeight + rowsHeight + (2 * panelPadding);

    // --- Create and Add Background FIRST ---
    panelGroup.add(new Konva.Rect({
        width: totalPanelWidth,
        height: totalPanelHeight,
        fill: 'rgba(255, 255, 255, 0.85)',
        stroke: '#cccccc',
        strokeWidth: 1,
        cornerRadius: 3,
        shadowColor: 'black',
        shadowBlur: 5,
        shadowOffset: { x: 2, y: 2 },
        shadowOpacity: 0.3
    }));

    // --- Add Title NOW ---
    panelGroup.add(titleText);

    // --- Create Labels and Value Texts (Adjust Y positions for title) ---
    ports.forEach((port, index) => {
        const portId = port.id();
        const currentPressurePa = portPressuresPa[portId] || 0;
        const currentPressureMbar = Math.round(currentPressurePa / MBAR_TO_PASCAL).toString();

        const yPos = titleHeight + panelPadding + index * (labelHeight + rowSpacing);

        // Label Text (Simplified "X:")
        const label = new Konva.Text({
            x: panelPadding,
            y: yPos + 2,
            text: `${index + 1}:`, // Simplified Label
            fontSize: 10, // Reduced font size
            fontFamily: 'Arial',
            fill: '#333',
            width: labelWidth,
            height: labelHeight
        });
        panelGroup.add(label);

        // --- Create Background Highlight for Value (initially hidden) ---
        const valueBgHighlight = new Konva.Rect({
            x: panelPadding + labelWidth + panelPadding - 2, // Start slightly before text
            y: yPos,
            width: valueWidth + 4, // Slightly wider than text
            height: labelHeight,
            fill: 'rgba(0, 0, 0, 0.05)', // Very light grey highlight
            cornerRadius: 2,
            visible: false,
            name: 'valueBgHighlight' // Name for finding later
        });
        panelGroup.add(valueBgHighlight); // Add BEHIND text

        // Pressure Value Text (editable)
        const valueText = new Konva.Text({
            x: panelPadding + labelWidth + panelPadding,
            y: yPos + 2,
            text: currentPressureMbar, // Already rounded integer string
            portId: portId,
            fontSize: 10, // Reduced font size
            fontFamily: 'Arial',
            fill: '#0056b3', // Original blue color
            width: valueWidth,
            align: 'right',
            height: labelHeight,
            name: 'pressureValueText', // Name to find these elements
            hitStrokeWidth: 6 // Make it easier to tap/click
        });
        panelGroup.add(valueText);

        // --- NEW: Add Event Listener for Editing ---
        valueText.on('click tap', (e) => {
             // Prevent click from propagating to stage if needed (e.g., deselecting)
            e.cancelBubble = true;

            // Prevent creating multiple inputs if already editing
            if (document.getElementById('konva-pump-pressure-input')) {
                return;
            }

            createPumpPressureInput(valueText, pumpGroup);
        });

        // --- NEW: Add Hover Effects for Interactivity ---
        const originalFill = valueText.fill(); // Store original color
        const hoverFill = '#007bff'; // Brighter blue for hover

        valueText.on('mouseenter', () => {
            if (stage && !document.getElementById('konva-pump-pressure-input')) { // Only hover if not editing
                stage.container().style.cursor = 'text';
                valueText.fill(hoverFill);
                valueBgHighlight.visible(true); // Show background highlight
                if (layer) layer.batchDraw();
            }
        });

        valueText.on('mouseleave', () => {
            if (stage && !document.getElementById('konva-pump-pressure-input')) { // Only reset if not editing
                stage.container().style.cursor = 'default';
                valueText.fill(originalFill);
                valueBgHighlight.visible(false); // Hide background highlight
                 if (layer) layer.batchDraw();
            }
        });

    });

     // --- Adjust Position if Off-Screen (Default Top-Left) ---
    const stageWidth = stage.width();
    const stageHeight = stage.height(); // Needed for bottom check

    // --- Adjust Position if Off-Screen (Default Top-Left) ---
    let finalX = pumpRect.x - totalPanelWidth - panelPadding; // Default LEFT
    let finalY = pumpRect.y; // Default TOP alignment

    // Check left boundary
    if (finalX < 0) {
        finalX = pumpRect.x + pumpRect.width + panelPadding; // Move to RIGHT as fallback
    }
    // Check right boundary (if moved to right)
    if (finalX + totalPanelWidth > stageWidth) {
         // If right is also off-screen, try sticking to left edge first
         if (pumpRect.x - totalPanelWidth - panelPadding >=0) {
             finalX = pumpRect.x - totalPanelWidth - panelPadding;
         } else {
             finalX = panelPadding; // Stick to left edge as last resort if left fails
         }
         // Or stick to right edge? Let's stick to left for now.
         // finalX = stageWidth - totalPanelWidth - panelPadding;
    }

    // Check top boundary
    if (finalY < 0) {
        finalY = pumpRect.y + pumpRect.height + panelPadding; // Move below
    }
     // Check bottom boundary (if moved below or initially placed)
    if (finalY + totalPanelHeight > stageHeight) {
        finalY = stageHeight - totalPanelHeight - panelPadding; // Stick near bottom edge
        // Potentially re-check top boundary if stage is very short
        if (finalY < 0) finalY = panelPadding;
    }

    panelGroup.x(finalX);
    panelGroup.y(finalY);

    // --- Add to Layer and Animate ---
    layer.add(panelGroup);
    currentPumpPanel = panelGroup; // Store reference

    panelGroup.to({
        opacity: 1,
        duration: 0.2, // Short fade-in
        onFinish: () => {
             if (typeof layer !== 'undefined' && layer) layer.batchDraw(); // Draw after animation completes
        }
    });
    // Initial draw might be needed if animation is very short or not perceived
    if (typeof layer !== 'undefined' && layer) layer.batchDraw();
}


/**
 * NEW: Creates and manages a temporary HTML input overlay for editing pump pressure on canvas.
 * @param {Konva.Text} textNode The Konva.Text node that was clicked.
 * @param {Konva.Group} pumpGroup The parent pump group.
 */
function createPumpPressureInput(textNode, pumpGroup) {
    if (!stage || !layer) {
        console.error("Stage or Layer not available for input creation.");
        return;
    }

    const textPosition = textNode.getAbsolutePosition();
    const stageBox = stage.container().getBoundingClientRect();
    const areaPosition = {
        x: stageBox.left + textPosition.x,
        y: stageBox.top + textPosition.y,
    };

    // --- Create Input Element ---
    const input = document.createElement('input');
    input.type = 'number';
    input.step = '1'; // Only whole numbers
    input.min = '0'; // Assume pressure can't be negative? Adjust if needed.
    input.id = 'konva-pump-pressure-input'; // Unique ID for easy removal
    input.value = textNode.text(); // Initial value from Konva text
    input.style.position = 'absolute';
    input.style.left = areaPosition.x + 'px';
    input.style.top = areaPosition.y + 'px';
    input.style.width = textNode.width() + 'px'; // Match Konva text width
    input.style.height = textNode.height() + 'px'; // Match Konva text height
    input.style.fontSize = textNode.fontSize() + 'px';
    input.style.fontFamily = textNode.fontFamily();
    input.style.border = '1px solid #666';
    input.style.padding = '0px'; // Adjust as needed
    input.style.margin = '0px';
    input.style.textAlign = textNode.align();
    input.style.boxSizing = 'border-box'; // Include border in width/height

    // --- NEW: Add CSS to hide number input spinners ---
    input.style.setProperty('-moz-appearance', 'textfield'); // Firefox
    input.style.setProperty('appearance', 'textfield'); // Standard
    const style = document.createElement('style');
    style.id = 'konva-input-spinner-style'; // ID to prevent duplicates
    style.textContent = `
        #konva-pump-pressure-input::-webkit-outer-spin-button,
        #konva-pump-pressure-input::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }
    `;
    if (!document.getElementById(style.id)) {
        document.head.appendChild(style);
    }
    // --- End spinner hiding styles ---

    document.body.appendChild(input);

    // --- Visual Changes During Edit ---
    // Ensure hover highlight is visible during edit
    const bgHighlight = textNode.parent.findOne('.valueBgHighlight', (node) => node.y() === textNode.y()); // Find highlight by Y pos
    if (bgHighlight) bgHighlight.visible(true);
    textNode.hide();
    if(stage) stage.container().style.cursor = 'text'; // Keep text cursor
    layer.draw(); // Use simple draw as batchDraw might wait

    input.focus();
    input.select();

    // --- Event Handlers for Input ---
    const finishEdit = (saveChanges) => {
        if (!document.body.contains(input)) return; // Already removed

        if (saveChanges) {
            const newValueMbar = parseInt(input.value, 10);

            // Basic Validation
            if (!isNaN(newValueMbar) && newValueMbar >= 0) { // Check if it's a non-negative integer
                const portId = textNode.getAttr('portId');
                const currentPressures = pumpGroup.getAttr('portPressures') || {};
                const newPressurePa = newValueMbar * MBAR_TO_PASCAL;

                // Update if value actually changed
                if (currentPressures[portId] !== newPressurePa) {
                    currentPressures[portId] = newPressurePa;
                    pumpGroup.setAttr('portPressures', currentPressures);

                    // Update Konva Text
                    textNode.text(newValueMbar.toString());

                    // Update Sidebar Input (if it exists)
                    // Ensure propertiesContainer is accessible (might need to pass it or query DOM)
                    const sidebarInput = document.getElementById(`pressure_${portId}`);
                    if (sidebarInput) {
                        sidebarInput.value = newValueMbar;
                    }

                    console.log(`Updated pressure (canvas) for ${pumpGroup.id()} port ${portId} to ${newValueMbar} mbar`);

                    // Optional: Trigger simulation update here if needed
                    // runSimulation();
                }
            } else {
                console.warn("Invalid pressure input:", input.value);
                // Revert Konva text (value didn't change)
                 textNode.text(textNode.text()); // No change needed technically
            }
        } else {
            // Cancelled (Escape key) - no changes needed
            // Revert Konva text visual state only
             textNode.text(textNode.text());
        }

        // Cleanup
        document.body.removeChild(input);
        // Remove the spinner style if no other inputs are active (optional, maybe keep it)
        // if (!document.querySelector('input[id^="konva-pump-pressure-input"]')) {
        //     const styleToRemove = document.getElementById('konva-input-spinner-style');
        //     if (styleToRemove) styleToRemove.remove();
        // }
        textNode.show();
        // Reset hover state explicitly
        const bgHighlight = textNode.parent.findOne('.valueBgHighlight', (node) => node.y() === textNode.y());
        if (bgHighlight) bgHighlight.visible(false);
        textNode.fill(originalFill); // Use originalFill associated with this specific text node if needed
        if (stage) stage.container().style.cursor = 'default';

        layer.batchDraw(); // Redraw layer to show text again
    };

    input.addEventListener('blur', () => {
        // Delay slightly to allow click on another valueText before blur finishes
        setTimeout(() => finishEdit(true), 100);
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevent form submission if applicable
            finishEdit(true);
        } else if (e.key === 'Escape') {
            finishEdit(false);
        }
    });
}


// --- End NEW Pump Panel Functions --- 