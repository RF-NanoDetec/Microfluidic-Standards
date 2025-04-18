// --- State Variables for Connections ---
let startPort = null; // Keep track of the first selected port
let selectedComponent = null; // Keep track of the selected component for properties
let tempConnectionLine = null; // <<< NEW: Line following cursor during connection
let dropIndicatorShape = null; // <<< NEW: Shape indicating drop location
const connections = []; // Array of { fromChip, fromPort, toChip, toPort, lineId }

// --- Event Listener Modifications ---
window.addEventListener('DOMContentLoaded', (event) => {
    // console.log('>>> DOMContentLoaded event fired.'); // <<< REMOVED LOG 1
    // --- Wrap DOMContentLoaded logic in setTimeout to ensure definitions are parsed --- 
    setTimeout(() => {
        // console.log('DOM fully loaded and parsed (deferred)'); // <<< REMOVED LOG

        // Setup the visual previews in the palette first
        setupPalette();

        // Initialize Drag and Drop Listeners (moved from here to core/dragAndDrop.js)
        setupDragAndDropListeners(); // <<< ADDED: Call the setup function
        
        // console.log('>>> About to call setupUIEventListeners...'); // <<< REMOVED LOG 2
        setupUIEventListeners(); // <<< ADDED: Call the UI setup function
        
        setupCanvasEventListeners()

        // console.log('Drag and Drop listeners attached.'); // <<< REMOVED LOG


        // Initial updates on load
        updateComponentList();
        calculateAndDisplayTubing(); // <<< INITIAL TUBING CALCULATION >>>



        // --- REMOVED: Collapsible How-to-Use Section Logic ---
        // const howToUseSection = document.getElementById('how-to-use-guide');
        // const howToUseHeading = howToUseSection?.querySelector('.collapsible-heading');

        // if (howToUseSection && howToUseHeading) { ... }
        // --- END REMOVED SECTION ---
    }, 0); // End of setTimeout wrapper
});