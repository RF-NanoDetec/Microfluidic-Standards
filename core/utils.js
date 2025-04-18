// === SECTION: Utility Functions ===
// Utility function to find Konva node by ID (useful later)
function findNodeById(id) {
    return stage.findOne('#' + id);
}

// NEW: Utility to update simulation dots for a group
function updateSimulationDotsForGroup(group) {
    if (!group || typeof group.find !== 'function') return;
    // For each port in the group, update the corresponding simulation dot position
    group.find('.connectionPort').forEach(port => {
        const portId = port.id();
        // Find the simulation dot for this port by unique ID
        const dot = layer.findOne('#' + portId + '_simdot');
        if (dot) {
            const absPos = port.getAbsolutePosition();
            dot.position(absPos);
        }
    });
} 

// === NEWLY ADDED UTILITIES ===

// Helper function to reset all visual elements to base state
function resetAllVisualElements() {
    // Reset external tubes
    layer.find('._tube').forEach(tube => { // Note: Depends on Konva layer variable
        tube.stroke(channelFillColor);
        const tubeOutline = layer.findOne('#' + tube.id().replace('_tube', '_outline')); // Note: Depends on Konva layer variable
        if (tubeOutline) {
            tubeOutline.stroke(channelOutlineColor);
        }
    });

    // Reset ALL chip elements
    layer.find('Group').forEach(group => { // Note: Depends on Konva layer variable
        if (group.draggable()) {  // Only process actual components
            const chipType = group.getAttr('chipType');
            
            // Handle straight and meander channels
            if (chipType === 'straight' || chipType === 'meander') {
                const channelFill = group.findOne('.internalChannelFill');
                if (channelFill) {
                    channelFill.stroke(channelFillColor);
                }
            }
            
            // Handle T and X type internal segments
            if (chipType === 't-type' || chipType === 'x-type') {
                group.find('.internalSegmentFill').forEach(segment => {
                    segment.stroke(channelFillColor);
                });
            }
        }
    });

    // Remove any highlight dots (specific to old flow path highlighting?)
    // layer.find('.highlight-junction-dot').forEach(dot => {
    //     dot.destroy();
    // });
}

// Map chipType to a user-friendly display name
function getComponentDisplayName(chipType) {
    switch (chipType) {
        case 'straight': return 'Straight Channel';
        case 'x-type': return 'X-Type Junction';
        case 't-type': return 'T-Type Junction';
        case 'meander': return 'Meander Structure';
        case 'pump': return 'Fluid Pump';
        case 'outlet': return 'Flow Outlet';
        default: return chipType; // Fallback to technical name
    }
}

// Helper Function for Scientific Notation Formatting
function formatScientificNotation(value, precision = 2) {
    if (value === null || value === undefined || !isFinite(value)) {
        return 'N/A'; // Or handle error appropriately
    }
    const exponentialString = value.toExponential(precision); // e.g., "1.42e+12"
    const parts = exponentialString.split('e');
    const coefficient = parts[0];
    const exponent = parts[1]; // e.g., "+12"

    // Remove the plus sign from the exponent if present
    const cleanExponent = exponent.replace('+', '');

    // Use Unicode superscript characters if possible, fallback to ^
    const superscriptMap = {
        '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
        '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻'
    };

    let superscriptExponent = '';
    for (let char of cleanExponent) {
        superscriptExponent += superscriptMap[char] || `^${char}`; // Fallback if char not in map
    }

    // Handle cases where exponent is 0 or 1 elegantly
    if (cleanExponent === '0') {
        return coefficient; // No need for x 10^0
    } else if (cleanExponent === '1') {
        return `${coefficient} x 10`; // No need for ^1
    } else {
        return `${coefficient} x 10${superscriptExponent}`;
    }
}

// Notification Function
function showNotification(message, type = 'error', duration = 5000) {
    const container = document.getElementById('notification-area');
    if (!container) return;

    const notification = document.createElement('div');
    notification.classList.add('notification', type);

    // Add message content
    const messageSpan = document.createElement('span');
    messageSpan.textContent = message;
    notification.appendChild(messageSpan);

    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;'; // '×' symbol
    closeBtn.classList.add('close-btn');
    closeBtn.onclick = () => {
        notification.classList.remove('visible');
        // Wait for fade out transition before removing
        notification.addEventListener('transitionend', () => notification.remove());
    };
    notification.appendChild(closeBtn);

    container.appendChild(notification);

    // Trigger the transition to make it visible
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        notification.classList.add('visible');
      });
    });

    // Auto-dismiss after duration (if duration is provided and > 0)
    if (duration && duration > 0) {
        setTimeout(() => {
            // Check if the notification still exists (wasn't closed manually)
            if (notification.parentElement) {
                closeBtn.onclick(); // Use the same logic as manual close
            }
        }, duration);
    }
} 