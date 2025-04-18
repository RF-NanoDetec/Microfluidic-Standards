// Sidebar UI Management Functions
// Originally from app.js
// Dependencies:
// - Global variables: selectedComponent, propertiesContainer, tubingInfoContainer, componentListContainer, stage, layer, connections, simulationResults
// - Constants: MBAR_TO_PASCAL, PASCAL_TO_MBAR, PIXEL_TO_METER_SCALE, MICRO_LITERS_PER_MINUTE_FACTOR, chipWidth, chipHeight, itemWidth, itemHeight, outletWidth, outletHeight, CHANNEL_WIDTH_MICRONS, CHANNEL_DEPTH_MICRONS, LENGTH_STRAIGHT_MM, LENGTH_T_X_SEGMENT_MM, LENGTH_MEANDER_MM
// - Utility functions (from core/utils.js): getComponentDisplayName, formatScientificNotation
// - Helper functions (from core/simulationHelpers.js or app.js if not moved): getInternalNodeId, getSegmentId
// - Konva objects: stage, layer

// --- DOM Element References ---
const componentListContainer = document.getElementById('component-list-content');
const propertiesContainer = document.getElementById('selected-component-properties');
const tubingInfoContainer = document.getElementById('tubing-info');

function updatePropertiesPanel() {
    if (!propertiesContainer) {
        console.error("Properties container not found!");
            return;
        }

    propertiesContainer.innerHTML = ''; // Clear previous content

    if (!selectedComponent) {
        // Optional: Display a message if nothing is selected
        // propertiesContainer.innerHTML = '<p>Select a component to see properties.</p>';
        return;
    }

    // --- Determine if selection is from palette or canvas ---
    const isPalette = selectedComponent && selectedComponent.isPaletteItem === true;
    const componentType = (selectedComponent && typeof selectedComponent.getAttr === 'function') ? selectedComponent.getAttr('chipType') : selectedComponent.chipType;
    const componentId = isPalette ? null : selectedComponent.id(); // No ID for palette items

    // Check if componentType is valid
    if (!componentType) {
        console.error("Selected component is invalid or missing chipType", selectedComponent);
        propertiesContainer.innerHTML = '<p>Error: Invalid component selected.</p>';
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
    const resistanceValue = isPalette ? selectedComponent.resistance : ((selectedComponent && typeof selectedComponent.getAttr === 'function') ? selectedComponent.getAttr('resistance') : null);

    // Calculate dimensions in mm
    const chipDimMm = `${(chipWidth * PIXEL_TO_METER_SCALE * 1000).toFixed(1)}mm x ${(chipHeight * PIXEL_TO_METER_SCALE * 1000).toFixed(1)}mm`;
    const pumpDimMm = `${(itemWidth * PIXEL_TO_METER_SCALE * 1000).toFixed(1)}mm x ${(itemHeight * PIXEL_TO_METER_SCALE * 1000).toFixed(1)}mm`;
    const outletDimMm = `${(outletWidth * PIXEL_TO_METER_SCALE * 1000).toFixed(1)}mm x ${(outletHeight * PIXEL_TO_METER_SCALE * 1000).toFixed(1)}mm`;

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
        const portPressuresPa = selectedComponent.getAttr('portPressures') || {};
        const ports = selectedComponent.find('.connectionPort');

        if (ports.length === 0) {
            propertiesHtml += '<p>No ports found.</p>';
        } else {
            ports.forEach((port, index) => {
                const portId = port.id();
                const currentPressurePa = portPressuresPa[portId] || 0;
                const currentPressureMbar = currentPressurePa / MBAR_TO_PASCAL;

                propertiesHtml += `
                    <div class="property-item">
                        <label for="pressure_${portId}">Port ${index + 1}:</label>
                        <input type="number" id="pressure_${portId}" data-port-id="${portId}" value="${currentPressureMbar}" step="1">
                    </div>
                `;
            });
        }
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
        const ports = selectedComponent.find('.connectionPort');
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

    if (!isPalette && componentType === 'pump') {
        propertiesContainer.querySelectorAll('input[type="number"]').forEach(input => {
            input.addEventListener('change', handlePressureInputChange);
        });
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