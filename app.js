// Get the container dimensions from CSS
// Note: These might be 0 if the script runs before the CSS is fully applied
// or the element is rendered. Consider moving size calculation inside DOMContentLoaded.
const containerElement = document.getElementById('konva-stage');
const initialStageWidth = containerElement ? containerElement.offsetWidth : 600; // Fallback size
const initialStageHeight = containerElement ? containerElement.offsetHeight : 400; // Fallback size

// 1. Create the Konva Stage
const stage = new Konva.Stage({
    container: 'konva-stage', // ID of the container div
    width: initialStageWidth,
    height: initialStageHeight,
});

// 2. Create a Layer
const layer = new Konva.Layer();

// 3. Add the layer to the stage
stage.add(layer);

// 4. Initial Draw (optional, stage might resize later)
layer.draw();
console.log('Konva stage and layer initialized.');

// --- Global Constants ---
const chipWidth = 50; // 5mm * 10px/mm
const chipHeight = 50; // 5mm * 10px/mm
// Add constants for pump/outlet size if different, otherwise use chipWidth/Height
const itemWidth = 50; // Generic width
const itemHeight = 50; // Generic height
const outletWidth = 28; // Specific width for outlet icon (Matching new SVG aspect ratio 35:52)
const outletHeight = 42; // Specific height for outlet icon (Matching new SVG aspect ratio 35:52)
// Define the Pump SVG as a Data URI
const pumpSvgDataUri = 'data:image/svg+xml;charset=utf-8,%3Csvg%20width%3D%2252%22%20height%3D%2250%22%20viewBox%3D%220%200%2052%2050%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3C!--%20Pump%20Base%20(Bottom%20Layer)%20--%3E%3Cpath%20d%3D%22M11%2038%20L35%2038%20C37%2038%2038%2039%2038%2041%20L38%2048%20C38%2049%2037%2050%2035%2050%20L11%2050%20C9%2050%208%2049%208%2048%20L8%2041%20C8%2039%209%2038%2011%2038%22%20fill%3D%22%23d9e2ec%22%20stroke%3D%22%232c3e50%22%20stroke-width%3D%221%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2240%22%20width%3D%2226%22%20height%3D%228%22%20fill%3D%22%23e3f2fd%22%2F%3E%3C!--%20First%20Connection%20(Top)%20--%3E%3Crect%20x%3D%2236%22%20y%3D%228%22%20width%3D%2215%22%20height%3D%224%22%20fill%3D%22%23d9e2ec%22%20stroke%3D%22%232c3e50%22%20stroke-width%3D%221%22%2F%3E%3Crect%20x%3D%2237%22%20y%3D%229%22%20width%3D%2213%22%20height%3D%222%22%20fill%3D%22%23e3f2fd%22%2F%3E%3C!--%20Second%20Connection%20--%3E%3Crect%20x%3D%2236%22%20y%3D%2218%22%20width%3D%2215%22%20height%3D%224%22%20fill%3D%22%23d9e2ec%22%20stroke%3D%22%232c3e50%22%20stroke-width%3D%221%22%2F%3E%3Crect%20x%3D%2237%22%20y%3D%2219%22%20width%3D%2213%22%20height%3D%222%22%20fill%3D%22%23e3f2fd%22%2F%3E%3C!--%20Third%20Connection%20--%3E%3Crect%20x%3D%2236%22%20y%3D%2228%22%20width%3D%2215%22%20height%3D%224%22%20fill%3D%22%23d9e2ec%22%20stroke%3D%22%232c3e50%22%20stroke-width%3D%221%22%2F%3E%3Crect%20x%3D%2237%22%20y%3D%2229%22%20width%3D%2213%22%20height%3D%222%22%20fill%3D%22%23e3f2fd%22%2F%3E%3C!--%20Fourth%20Connection%20--%3E%3Crect%20x%3D%2236%22%20y%3D%2238%22%20width%3D%2215%22%20height%3D%224%22%20fill%3D%22%23d9e2ec%22%20stroke%3D%22%232c3e50%22%20stroke-width%3D%221%22%2F%3E%3Crect%20x%3D%2237%22%20y%3D%2239%22%20width%3D%2213%22%20height%3D%222%22%20fill%3D%22%23e3f2fd%22%2F%3E%3C!--%20Pump%20Circles%20(Middle%20Layer)%20--%3E%3Ccircle%20cx%3D%2223%22%20cy%3D%2225%22%20r%3D%2222%22%20fill%3D%22%23d9e2ec%22%20stroke%3D%22%232c3e50%22%20stroke-width%3D%221%22%20opacity%3D%220.95%22%2F%3E%3Ccircle%20cx%3D%2223%22%20cy%3D%2225%22%20r%3D%2218%22%20fill%3D%22%23007bff%22%20opacity%3D%220.95%22%20stroke%3D%22%232c3e50%22%20stroke-width%3D%221%22%2F%3E%3Ccircle%20cx%3D%2223%22%20cy%3D%2225%22%20r%3D%224%22%20fill%3D%22%23e3f2fd%22%20stroke%3D%22%232c3e50%22%20stroke-width%3D%221%22%20opacity%3D%220.95%22%2F%3E%3C!--%20Flange%20Boxes%20(Top%20Layer)%20--%3E%3Crect%20x%3D%2248%22%20y%3D%227%22%20width%3D%223%22%20height%3D%226%22%20fill%3D%22%23d9e2ec%22%20stroke%3D%22%232c3e50%22%20stroke-width%3D%221%22%2F%3E%3Crect%20x%3D%2248%22%20y%3D%2217%22%20width%3D%223%22%20height%3D%226%22%20fill%3D%22%23d9e2ec%22%20stroke%3D%22%232c3e50%22%20stroke-width%3D%221%22%2F%3E%3Crect%20x%3D%2248%22%20y%3D%2227%22%20width%3D%223%22%20height%3D%226%22%20fill%3D%22%23d9e2ec%22%20stroke%3D%22%232c3e50%22%20stroke-width%3D%221%22%2F%3E%3Crect%20x%3D%2248%22%20y%3D%2237%22%20width%3D%223%22%20height%3D%226%22%20fill%3D%22%23d9e2ec%22%20stroke%3D%22%232c3e50%22%20stroke-width%3D%221%22%2F%3E%3C%2Fsvg%3E';
// Define the Outlet SVG with Gradient Fill (NOW RED)
// const outletSvgDataUri = 'data:image/svg+xml;charset=utf-8,%3Csvg%20width%3D%2235%22%20height%3D%2250%22%20viewBox%3D%220%200%2035%2050%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20x%3D%222.5%22%20y%3D%220%22%20width%3D%2230%22%20height%3D%225%22%20fill%3D%22%23c8a97e%22%20stroke%3D%22black%22%20stroke-width%3D%222%22%20vector-effect%3D%22non-scaling-stroke%22%20%2F%3E%3Cpath%20d%3D%22M6%205%20L6%2031%20Q6%2045%2017.5%2050%20Q29%2045%2029%2031%20L29%205%22%20fill%3D%22%23c8a97e%22%20stroke%3D%22black%22%20stroke-width%3D%222%22%20vector-effect%3D%22non-scaling-stroke%22%2F%3E%3C%2Fsvg%3E'; // Solid Light Brown
const outletSvgDataUri = 'data:image/svg+xml;charset=utf-8,%3Csvg%20width%3D%2235%22%20height%3D%2252%22%20viewBox%3D%220%200%2035%2052%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20x%3D%222.5%22%20y%3D%220%22%20width%3D%2230%22%20height%3D%225%22%20fill%3D%22%23CD853F%22%20stroke%3D%22black%22%20stroke-width%3D%222%22%20vector-effect%3D%22non-scaling-stroke%22%20opacity%3D%220.85%22%20%2F%3E%3Cpath%20d%3D%22M6%205%20L6%2031%20Q6%2045%2017.5%2050%20Q29%2045%2029%2031%20L29%205%22%20fill%3D%22%23CD853F%22%20stroke%3D%22black%22%20stroke-width%3D%222%22%20vector-effect%3D%22non-scaling-stroke%22%20opacity%3D%220.85%22%2F%3E%3C%2Fsvg%3E'; // Orangey Brown + Opacity + Height 52
const portRadius = 3;
// const portColor = '#888888'; // Old color: Medium Grey
const portColor = '#007bff'; // New color: Flow highlight blue
const portSelectedColor = '#33CC33'; // Bright Green for selection
const chipColor = 'lightgrey';
const chipStroke = 'black';
const connectionStubLength = 10; // How far the line goes straight from the port

// Updated Channel Style Constants for consistency with tubing
// const channelFillColor = 'lightgrey';    // Match tubing fill
const channelFillColor = '#e3f2fd';    // Light blue fill
const channelOutlineColor = '#555555';   // Match tubing outline
const channelFillWidth = 3; // Increased to match meander channel
const channelOutlineWidth = 5; // Increased to match meander channel
const channelCap = 'butt';  // Changed from 'round' to 'butt' for straight edges
const channelJoin = 'miter';  // Changed from 'round' to 'miter' for sharp corners
const flowHighlightColor = '#007bff'; // Brighter/Stronger Blue

// --- Physical/Simulation Constants ---
const PIXEL_TO_METER_SCALE = 0.0001; // 50px = 5mm => 1px = 0.1mm = 0.0001m
const FLUID_VISCOSITY = 0.001;      // Dynamic viscosity of water (Pa·s)
const TUBE_INNER_RADIUS_M = 0.000254; // Inner radius for 0.02" ID tubing (m)
// Pre-calculate constant part of Poiseuille's Law for tubing: 8 * mu / (pi * r^4)
const POISEUILLE_CONSTANT = (8 * FLUID_VISCOSITY) / (Math.PI * Math.pow(TUBE_INNER_RADIUS_M, 4));
console.log("Poiseuille Constant (for tubing resistance):", POISEUILLE_CONSTANT);

// Hydrodynamic Resistances for Chips (Units: Pa·s/m³) - Calculated for 100x100 micron channels
const RESISTANCE_STRAIGHT = 1.42e12; // L = 5mm
const RESISTANCE_T_TYPE = 7.11e11;  // Resistance per segment, L = 2.5mm
const RESISTANCE_X_TYPE = 7.11e11;  // Resistance per segment, L = 2.5mm
const RESISTANCE_MEANDER = 4.27e13; // L = 150mm

// NEW: Channel Dimension Constants
const CHANNEL_WIDTH_MICRONS = 100;
const CHANNEL_DEPTH_MICRONS = 100;
const LENGTH_STRAIGHT_MM = 5;
const LENGTH_T_X_SEGMENT_MM = 2.5; // Length per segment from port to center
const LENGTH_MEANDER_MM = 150;

// --- State Variables for Connections ---
let startPort = null; // Keep track of the first selected port
let selectedComponent = null; // Keep track of the selected component for properties
let tempConnectionLine = null; // <<< NEW: Line following cursor during connection
let dropIndicatorShape = null; // <<< NEW: Shape indicating drop location

// --- Storage for permanent connections ---
const connections = []; // Array of { fromChip, fromPort, toChip, toPort, lineId }

// --- Utility function to find Konva node by ID (useful later) ---
function findNodeById(id) {
    return stage.findOne('#' + id);
}

// --- Path Calculation Helper Functions ---

function getPortOrientation(port) {
    const portId = port.attrs.portId;
    if (!portId) return null;
    if (portId.includes('left')) return 'left';
    if (portId.includes('right')) return 'right';
    if (portId.includes('top')) return 'top';
    if (portId.includes('bottom')) return 'bottom';
    return null;
}

function calculatePathData(port1, port2) {
    if (!port1 || !port2) return ''; // Safety check

    const pos1 = port1.getAbsolutePosition();
    const pos2 = port2.getAbsolutePosition();
    const orient1 = getPortOrientation(port1);
    const orient2 = getPortOrientation(port2);

    if (!orient1 || !orient2) {
        console.error("Could not determine port orientation.");
        return ''; // Cannot calculate path without orientation
    }

    let stub1End = { ...pos1 };
    let stub2End = { ...pos2 };

    // Calculate end point of the first stub
    if (orient1 === 'left') stub1End.x -= connectionStubLength;
    else if (orient1 === 'right') stub1End.x += connectionStubLength;
    else if (orient1 === 'top') stub1End.y -= connectionStubLength;
    else if (orient1 === 'bottom') stub1End.y += connectionStubLength;

    // Calculate start point of the second stub (end point coming from port2)
    if (orient2 === 'left') stub2End.x -= connectionStubLength;
    else if (orient2 === 'right') stub2End.x += connectionStubLength;
    else if (orient2 === 'top') stub2End.y -= connectionStubLength;
    else if (orient2 === 'bottom') stub2End.y += connectionStubLength;

    // Calculate Control Points: Extend the stub lines symmetrically
    let cp1 = { ...stub1End };
    let cp2 = { ...stub2End };

    // Calculate distance between stub ends
    const dx = Math.abs(stub1End.x - stub2End.x);
    const dy = Math.abs(stub1End.y - stub2End.y);

    // Adjust control point extension based on distance for smoother curves
    // Use a fraction of the larger distance, but ensure a minimum extension
    const minExtension = connectionStubLength * 0.5; // Minimum curve even for short dist
    const dynamicExtension = Math.max(dx, dy) * 0.3; // Fraction of distance (tweak 0.3)
    const controlExtension = Math.max(minExtension, dynamicExtension);

    // cp1 extends from stub1End along orient1
    if (orient1 === 'left') cp1.x -= controlExtension;
    else if (orient1 === 'right') cp1.x += controlExtension;
    else if (orient1 === 'top') cp1.y -= controlExtension;
    else if (orient1 === 'bottom') cp1.y += controlExtension;

    // cp2 extends from stub2End along orient2 (towards the curve)
    if (orient2 === 'left') cp2.x -= controlExtension; // Extend left
    else if (orient2 === 'right') cp2.x += controlExtension; // Extend right
    else if (orient2 === 'top') cp2.y -= controlExtension; // Extend up
    else if (orient2 === 'bottom') cp2.y += controlExtension; // Extend down

    // Construct the SVG path data string
    return `M ${pos1.x} ${pos1.y} L ${stub1End.x} ${stub1End.y} C ${cp1.x} ${cp1.y} ${cp2.x} ${cp2.y} ${stub2End.x} ${stub2End.y} L ${pos2.x} ${pos2.y}`;
}

// --- Channel Drawing Helper Functions ---

// Updated to use a single Path with fill and stroke
function addStraightChannel(group) {
    const startX = 0;
    const endX = chipWidth;
    const y = chipHeight / 2;
    const points = [startX, y, endX, y];
    const chipId = group.id(); // Get the chip ID

    // Draw the outline FIRST (will be at bottom)
    const outline = new Konva.Line({
        points: points,
        stroke: channelOutlineColor,
        strokeWidth: channelOutlineWidth, // Use constant 5
        lineCap: channelCap,
        name: 'channelOutline', // Keep consistent naming
        listening: false
    });
    group.add(outline);

    // Draw the fill line ON TOP
    const fill = new Konva.Line({
        points: points,
        stroke: channelFillColor,
        strokeWidth: channelFillWidth, // Use constant 3
        lineCap: channelCap,
        // Assign ID based on chip ID for highlighting/simulation lookup
        id: chipId ? `${chipId}_internalChannelFill` : `preview_${Konva.Util.getRandomColor()}_internalFill`, // Use chip ID if available, otherwise unique preview ID
        name: 'internalChannelFill', // Keep consistent naming
        listening: false
    });
    group.add(fill);
}

// Updated to draw individual segments with IDs
function addXChannel(group, chipId) { // <<< Added chipId parameter
    const cx = chipWidth / 2;
    const cy = chipHeight / 2;
    const internalNodeId = getInternalNodeId(chipId); // Get the internal node ID
    const fillExtension = 1; // <<< Extend fill lines by 1 pixel past center

    // --- Define Port Coordinates and IDs ---
    const ports = [
        { x: cx, y: 0, id: chipId + '_port_top' },          // Top
        { x: cx, y: chipHeight, id: chipId + '_port_bottom' }, // Bottom
        { x: 0, y: cy, id: chipId + '_port_left' },         // Left
        { x: chipWidth, y: cy, id: chipId + '_port_right' }   // Right
    ];

    // --- Draw OUTLINES first ---
    ports.forEach(port => {
        const points = [port.x, port.y, cx, cy];
        group.add(new Konva.Line({
            points: points,
            stroke: channelOutlineColor,
            strokeWidth: channelOutlineWidth,
            lineCap: channelCap,
            listening: false
        }));
    });

    // --- Draw outline circle at the center junction ---
    group.add(new Konva.Circle({
        x: cx,
        y: cy,
        radius: channelOutlineWidth / 2,
        fill: channelOutlineColor,
        listening: false
    }));

    // --- Draw FILLS second (on top of outlines) ---
    ports.forEach(port => {
        // Calculate direction vector from port to center
        const dx = cx - port.x;
        const dy = cy - port.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        let endX = cx;
        let endY = cy;
        // Extend endpoint slightly past center if distance is not zero
        if (dist > 1e-6) {
            endX += (dx / dist) * fillExtension;
            endY += (dy / dist) * fillExtension;
        }

        const points = [port.x, port.y, endX, endY]; // Use extended endpoint
        const segmentId = chipId ? getSegmentId(port.id, internalNodeId) : `preview_segment_${Konva.Util.getRandomColor()}`;

        group.add(new Konva.Line({
            points: points,
            stroke: channelFillColor,
            strokeWidth: channelFillWidth,
            lineCap: 'butt', // Use butt cap for precise end at extended point
            listening: false,
            id: segmentId,
            name: 'internalSegmentFill'
        }));
    });
}

// Updated to draw individual segments with IDs
function addTChannel(group, chipId) { // <<< Added chipId parameter
    const cx = chipWidth / 2;
    const cy = chipHeight / 2;
    const internalNodeId = getInternalNodeId(chipId); // Get the internal node ID
    const fillExtension = 1; // <<< Extend fill lines by 1 pixel past center

    // --- Define Port Coordinates and IDs ---
    const ports = [
        { x: cx, y: 0, id: chipId + '_port_top' },          // Top
        { x: cx, y: chipHeight, id: chipId + '_port_bottom' }, // Bottom
        { x: chipWidth, y: cy, id: chipId + '_port_right' }   // Right
    ];

    // --- Draw OUTLINES first ---
    ports.forEach(port => {
        const points = [port.x, port.y, cx, cy];
        group.add(new Konva.Line({
            points: points,
            stroke: channelOutlineColor,
            strokeWidth: channelOutlineWidth,
            lineCap: channelCap,
            listening: false
        }));
    });

    // --- Draw outline circle at the center junction ---
    group.add(new Konva.Circle({
        x: cx,
        y: cy,
        radius: channelOutlineWidth / 2,
        fill: channelOutlineColor,
        listening: false
    }));

    // --- Draw FILLS second (on top of outlines) ---
    ports.forEach(port => {
        // Calculate direction vector from port to center
        const dx = cx - port.x;
        const dy = cy - port.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        let endX = cx;
        let endY = cy;
        // Extend endpoint slightly past center if distance is not zero
        if (dist > 1e-6) {
            endX += (dx / dist) * fillExtension;
            endY += (dy / dist) * fillExtension;
        }

        const points = [port.x, port.y, endX, endY]; // Use extended endpoint
        const segmentId = getSegmentId(port.id, internalNodeId);

        group.add(new Konva.Line({
            points: points,
            stroke: channelFillColor,
            strokeWidth: channelFillWidth,
            lineCap: 'butt', // Use butt cap for precise end at extended point
            listening: false,
            id: segmentId,
            name: 'internalSegmentFill'
        }));
    });

    // --- Draw fill circle LAST at the center junction ---
    // REMOVED - Fill lines now overlap slightly due to extension
    /*
     group.add(new Konva.Circle({
         x: cx,
         y: cy,
         radius: channelFillWidth / 2,
         fill: channelFillColor,
         listening: false
     }));
     */
}

// --- Preview Chip Creation Functions --- Use Channel Helpers ---

function createStraightChipPreview(x, y) {
    const group = new Konva.Group({ x: x, y: y, draggable: false, chipType: 'straight' });
    // Apply the same glass style + shadow to the preview rectangle
    group.add(new Konva.Rect({
        width: chipWidth,
        height: chipHeight,
        fill: '#d9e2ec',    // Darker blue-grey for better contrast
        opacity: 0.85,      // Semi-transparent
        stroke: chipStroke,
        strokeWidth: 1,
        // NEW: Add subtle drop shadow to preview
        shadowColor: 'black',
        shadowBlur: 5,
        shadowOffsetX: 1,
        shadowOffsetY: 1,
        shadowOpacity: 0.15,
        shadowEnabled: true
    }));
    addStraightChannel(group); // Use helper
    return group;
}

function createXChipPreview(x, y) {
    const group = new Konva.Group({ x: x, y: y, draggable: false, chipType: 'x-type' });
    // Apply glass style + shadow
    group.add(new Konva.Rect({
        width: chipWidth,
        height: chipHeight,
        fill: '#d9e2ec',    // Darker blue-grey for better contrast
        opacity: 0.85,      // Semi-transparent
        stroke: chipStroke,
        strokeWidth: 1,
        // NEW: Add subtle drop shadow to preview
        shadowColor: 'black',
        shadowBlur: 5,
        shadowOffsetX: 1,
        shadowOffsetY: 1,
        shadowOpacity: 0.15,
        shadowEnabled: true
    }));
    addXChannel(group); // Use helper
    return group;
}

function createTChipPreview(x, y) {
    const group = new Konva.Group({ x: x, y: y, draggable: false, chipType: 't-type' });
    // Apply glass style + shadow
    group.add(new Konva.Rect({
        width: chipWidth,
        height: chipHeight,
        fill: '#d9e2ec',    // Darker blue-grey for better contrast
        opacity: 0.85,      // Semi-transparent
        stroke: chipStroke,
        strokeWidth: 1,
        // NEW: Add subtle drop shadow to preview
        shadowColor: 'black',
        shadowBlur: 5,
        shadowOffsetX: 1,
        shadowOffsetY: 1,
        shadowOpacity: 0.15,
        shadowEnabled: true
    }));
    addTChannel(group); // Use helper
    return group;
}

// Updated to use SVG image
function createPumpPreview(x, y, width, height) {
    const group = new Konva.Group({
        x: x,
        y: y,
        draggable: false,
        chipType: 'pump'
    });

    // Load the SVG image
    Konva.Image.fromURL(pumpSvgDataUri, (imageNode) => {
        imageNode.setAttrs({
            width: width,
            height: height,
            name: 'pumpImage component-border',
            // NEW: Add shadow properties like the chips
            shadowColor: 'black',
            shadowBlur: 5,
            shadowOffsetX: 1,
            shadowOffsetY: 1,
            shadowOpacity: 0.15,
            shadowEnabled: true
        });
        group.add(imageNode);
        group.getLayer()?.batchDraw();
    });

    return group;
}

// Added createOutletPreview using SVG Data URI
function createOutletPreview(x, y, width, height, svgDataUri) {
    const group = new Konva.Group({
        x: x,
        y: y,
        draggable: false,
        chipType: 'outlet'
    });
    Konva.Image.fromURL(svgDataUri, (imageNode) => { // Use svgDataUri
        imageNode.setAttrs({
            width: width,
            height: height,
            // NEW: Add shadow properties consistent with createOutlet
            shadowColor: 'black',
            shadowBlur: 5,
            shadowOffsetX: 1,
            shadowOffsetY: 1,
            shadowOpacity: 0.15,
            shadowEnabled: true
        });
        group.add(imageNode);
        group.getLayer()?.batchDraw();
    });
    return group;
}

// NEW: Helper to draw the meander path
function addMeanderChannel(group) {
    const w = chipWidth;
    const h = chipHeight;
    const r = 5; // Turn radius
    const w_seg = w / 6; // Width of horizontal segments (6 segments total)
    const y_top = h / 4; // Top extent of the meander
    const y_bottom = h * 3 / 4; // Bottom extent of the meander
    const y_mid = h / 2; // Start and end y-coordinate

    // Create a points array for the meander path - each pair is an x,y coordinate
    const points = [
        0, y_mid, // Start at left edge
        w_seg - r, y_mid, // Horizontal segment to first corner

        // We'll directly draw the rounded corners with line segments
        // Corner 1 (Up) - approximate curve with line segments
        w_seg - r/2, y_mid,
        w_seg, y_mid - r/2,
        w_seg, y_mid - r,

        // Vertical segment to second corner
        w_seg, y_top + r,

        // Corner 2 (Right) - approximate curve with line segments
        w_seg, y_top + r/2,
        w_seg + r/2, y_top,
        w_seg + r, y_top,

        // Horizontal segment to third corner
        w_seg * 2 - r, y_top,

        // Corner 3 (Down) - approximate curve with line segments
        w_seg * 2 - r/2, y_top,
        w_seg * 2, y_top + r/2,
        w_seg * 2, y_top + r,

        // Vertical segment to fourth corner
        w_seg * 2, y_bottom - r,

        // Corner 4 (Right) - approximate curve with line segments
        w_seg * 2, y_bottom - r/2,
        w_seg * 2 + r/2, y_bottom,
        w_seg * 2 + r, y_bottom,

        // Horizontal segment to fifth corner
        w_seg * 3 - r, y_bottom,

        // Corner 5 (Up) - approximate curve with line segments
        w_seg * 3 - r/2, y_bottom,
        w_seg * 3, y_bottom - r/2,
        w_seg * 3, y_bottom - r,

        // Vertical segment to sixth corner
        w_seg * 3, y_top + r,

        // Corner 6 (Right) - approximate curve with line segments
        w_seg * 3, y_top + r/2,
        w_seg * 3 + r/2, y_top,
        w_seg * 3 + r, y_top,

        // Horizontal segment to seventh corner
        w_seg * 4 - r, y_top,

        // Corner 7 (Down) - approximate curve with line segments
        w_seg * 4 - r/2, y_top,
        w_seg * 4, y_top + r/2,
        w_seg * 4, y_top + r,

        // Vertical segment to eighth corner
        w_seg * 4, y_bottom - r,

        // Corner 8 (Right) - approximate curve with line segments
        w_seg * 4, y_bottom - r/2,
        w_seg * 4 + r/2, y_bottom,
        w_seg * 4 + r, y_bottom,

        // Horizontal segment to ninth corner
        w_seg * 5 - r, y_bottom,

        // Corner 9 (Up to Middle) - approximate curve with line segments
        w_seg * 5 - r/2, y_bottom,
        w_seg * 5, y_bottom - r/2,
        w_seg * 5, y_bottom - r,

        // Vertical segment to final section
        w_seg * 5, y_mid + r,

        // Corner 10 (Right) - approximate curve with line segments
        w_seg * 5, y_mid + r/2,
        w_seg * 5 + r/2, y_mid,
        w_seg * 5 + r, y_mid,

        // Final horizontal segment to right edge
        w, y_mid
    ];

    // Draw the outline FIRST (will be at bottom)
    const outline = new Konva.Line({
        points: points,
        stroke: channelOutlineColor,
        strokeWidth: channelOutlineWidth,
        lineCap: channelCap,  // Changed from 'butt' to channelCap (which is 'round')
        lineJoin: channelJoin,  // Using channelJoin constant for consistency
        name: 'channelOutline',
        listening: false
    });
    group.add(outline);

    // Draw the fill line ON TOP
    const chipId = group.id(); // Get the chip ID if it exists
    const fill = new Konva.Line({
        points: points,
        stroke: channelFillColor,
        strokeWidth: channelFillWidth,
        lineCap: channelCap,  // Already using channelCap
        lineJoin: channelJoin,  // Using channelJoin constant for consistency
        name: 'internalChannelFill',
        id: chipId ? `${chipId}_internalChannelFill` : `preview_${Konva.Util.getRandomColor()}_internalFill`,
        listening: false
    });
    group.add(fill);
}

// NEW: Meander Chip Preview Function
function createMeanderChipPreview(x, y) {
    const group = new Konva.Group({ x: x, y: y, draggable: false, chipType: 'meander' });
    // Apply glass style + shadow
    group.add(new Konva.Rect({
        width: chipWidth,
        height: chipHeight,
        fill: '#d9e2ec',    // Darker blue-grey for better contrast
        opacity: 0.85,      // Semi-transparent
        stroke: chipStroke,
        strokeWidth: 1,
        // NEW: Add subtle drop shadow to preview
        shadowColor: 'black',
        shadowBlur: 5,
        shadowOffsetX: 1,
        shadowOffsetY: 1,
        shadowOpacity: 0.15,
        shadowEnabled: true
    }));

    // Draw meander channel FIRST
    addMeanderChannel(group);
    return group;
}

// NEW: Meander Chip Creation Function
function createMeanderChip(x, y) {
    const chipId = 'chip_' + Konva.Util.getRandomColor().replace('#','');
    const group = new Konva.Group({ x: x, y: y, draggable: true, chipType: 'meander', id: chipId });
    // Apply glass style + shadow
    group.add(new Konva.Rect({
        width: chipWidth,
        height: chipHeight,
        fill: '#d9e2ec',    // Darker blue-grey for better contrast
        opacity: 0.85,      // Semi-transparent
        stroke: chipStroke,
        strokeWidth: 1,
        name: 'component-border',
        // NEW: Add subtle drop shadow
        shadowColor: 'black',
        shadowBlur: 5,
        shadowOffsetX: 1,
        shadowOffsetY: 1,
        shadowOpacity: 0.15,
        shadowEnabled: true
    }));

    // Set resistance attribute
    group.setAttr('resistance', RESISTANCE_MEANDER); // <<< ADDED

    // Draw meander channel FIRST
    addMeanderChannel(group);

    // Define internal connections for the meander chip
    const leftPortUniqueId = chipId + '_port_left';
    const rightPortUniqueId = chipId + '_port_right';
    group.setAttr('internalConnections', [
        [leftPortUniqueId, rightPortUniqueId]
    ]);

    // Add Ports LAST so they appear on top
    const leftPortGroup = setupPortVisualsAndLogic({ x: 0, y: chipHeight / 2, portId: 'meander_left', uniqueId: leftPortUniqueId, mainDraggableGroup: group });
    group.add(leftPortGroup);
    const rightPortGroup = setupPortVisualsAndLogic({ x: chipWidth, y: chipHeight / 2, portId: 'meander_right', uniqueId: rightPortUniqueId, mainDraggableGroup: group });
    group.add(rightPortGroup);

    group.on('dragmove', () => { updateConnectionLines(group); });
    return group;
}

// --- Helper Function to Delete Connection ---
function deleteConnection(clickedTubePath) {
    if (!clickedTubePath || !clickedTubePath.id()?.endsWith('_tube')) {
        console.warn("deleteConnection called with invalid path:", clickedTubePath);
        return;
    };

    const tubePathId = clickedTubePath.id();
    const baseConnectionId = tubePathId.replace('_tube', '');
    const outlinePathId = baseConnectionId + '_outline';

    console.log("Attempting to delete connection:", baseConnectionId);

    const indexToRemove = connections.findIndex(conn => conn.lineId === baseConnectionId);

    if (indexToRemove !== -1) {
        // Get connection data BEFORE removing it
        const connData = connections[indexToRemove];

        // Find the outline path shape
        const outlinePath = layer.findOne('#' + outlinePathId);

        // Remove data from array
        connections.splice(indexToRemove, 1);

        // --- Make ports visible again (if not outlet) ---
        const port1 = stage.findOne('#' + connData.fromPort);
        const port2 = stage.findOne('#' + connData.toPort);

        if (port1) {
            // Make connection port visible ONLY if no other connections exist for it
            if (!isPortConnected(connData.fromPort)) {
                port1.visible(true);
            }
        }
        if (port2) {
            // Make connection port visible ONLY if no other connections exist for it
            if (!isPortConnected(connData.toPort)) {
                port2.visible(true);
            }
        }
        // --- End port visibility update ---

        // Remove shapes from layer
        clickedTubePath.destroy();
        if (outlinePath) {
            outlinePath.destroy();
        }

        // Trigger flow update AFTER removing connection and showing ports
        findFlowPathAndHighlight();

        layer.draw(); // Redraw needed to show/hide ports & update flow
        console.log("Connection deleted successfully:", baseConnectionId);
    } else {
        console.warn("Could not find connection data for path:", baseConnectionId);
    }
}

// --- Helper Function to Check if Port is Connected ---
function isPortConnected(portId) {
    return connections.some(conn => conn.fromPort === portId || conn.toPort === portId);
}

// NEW: Creates the visual group for a port and sets up its interactions
function setupPortVisualsAndLogic(config) {
    // config: { x, y, portId, uniqueId, mainDraggableGroup }
    const portVisualGroup = new Konva.Group({ x: config.x, y: config.y });

    // Determine the visual offset direction for the blue dot based on the port ID
    let visualOffsetX = 0, visualOffsetY = 0;
    const portId = config.portId;
    if (portId.includes('left')) {
        visualOffsetX = -6;  // Move left
    } else if (portId.includes('right')) {
        visualOffsetX = 6;   // Move right
    } else if (portId.includes('top')) {
        visualOffsetY = -6;  // Move up
    } else if (portId.includes('bottom')) {
        visualOffsetY = 6;   // Move down
    }

    // Add the center connection point (the actual interactive port)
    // Keep the hit detection and connection point at (0,0)
    const connectionPort = new Konva.Circle({
        x: 0, y: 0,  // Keep the actual port at center for connections
        radius: portRadius,
        fill: portColor,
        stroke: '#2c3e50', // Dark blue-grey outline
        strokeWidth: 1,
        portId: config.portId,
        id: config.uniqueId,
        hitRadius: 15,
        mainGroupId: config.mainDraggableGroup.id(),
        name: 'connectionPort', // <<< Add name for reliable finding
        offsetX: -visualOffsetX,  // Offset the visual appearance only
        offsetY: -visualOffsetY   // Offset the visual appearance only
    });
    portVisualGroup.add(connectionPort);

    // --- Attach Listeners to the INNER connectionPort ---

    connectionPort.on('contextmenu', (e) => {
        e.evt.preventDefault();
        const clickedPort = e.target; // This is the inner connectionPort circle
        const clickedPortId = clickedPort.id(); // uniqueId
        const clickedPortMainGroupId = clickedPort.getAttr('mainGroupId');
        const clickedPortGroup = stage.findOne('#' + clickedPortMainGroupId);
        const clickedPortType = clickedPortGroup?.getAttr('chipType');

        if (startPort === null) {
            // --- Select first port ---
            if (clickedPortType !== 'outlet' && isPortConnected(clickedPortId)) {
                console.log("Port", clickedPortId, "is already connected (and not an outlet).");
                alert("This port is already connected.");
                return;
            }
            startPort = clickedPort;
            startPort.setAttr('originalFill', startPort.fill());
            startPort.fill(portSelectedColor); // Use selected color
            console.log("Selected start port:", startPort.id());

            // <<< NEW: Set cursor and create temporary line >>>
            stage.container().style.cursor = 'crosshair';
            const startPos = startPort.getAbsolutePosition();
            tempConnectionLine = new Konva.Line({
                points: [startPos.x, startPos.y, startPos.x, startPos.y],
                stroke: portSelectedColor, // Use same green as port
                strokeWidth: 2,
                dash: [4, 2], // Dashed line
                listening: false, // Prevent interaction with the line
            });
            layer.add(tempConnectionLine);
            // <<< END NEW >>>

            layer.draw();
        } else {
            // --- Select second port ---
            if (clickedPort !== startPort && clickedPort.attrs.portId) {
                if (clickedPortType !== 'outlet' && isPortConnected(clickedPortId)) {
                    console.log("Target port", clickedPortId, "is already connected (and not an outlet). Cancelling selection.");
                    alert("The target port is already connected.");
                    startPort.fill(startPort.getAttr('originalFill')); // Reset to original grey
                    startPort = null;

                    // <<< NEW: Reset cursor and remove temporary line >>>
                    stage.container().style.cursor = 'default';
                    if (tempConnectionLine) {
                        tempConnectionLine.destroy();
                        tempConnectionLine = null;
                    }
                    // <<< END NEW >>>

                    layer.draw();
                    return;
                }

                const endPort = clickedPort;
                const startMainGroupId = startPort.getAttr('mainGroupId');
                const endMainGroupId = endPort.getAttr('mainGroupId');

                if (!startMainGroupId || !endMainGroupId) {
                    console.error("Could not retrieve main group IDs from port attributes!", startPort, endPort);
                    startPort.fill(startPort.getAttr('originalFill')); // Reset to original grey
                    startPort = null;

                    // <<< NEW: Reset cursor and remove temporary line >>>
                    stage.container().style.cursor = 'default';
                    if (tempConnectionLine) {
                        tempConnectionLine.destroy();
                        tempConnectionLine = null;
                    }
                    // <<< END NEW >>>

                    layer.draw();
                    return;
                }

                // Get component types
                const startGroup = stage.findOne('#' + startMainGroupId);
                const endGroup = stage.findOne('#' + endMainGroupId);
                const startType = startGroup?.getAttr('chipType');
                const endType = endGroup?.getAttr('chipType');

                const pathData = calculatePathData(startPort, endPort);

                if (pathData) {
                    const baseConnectionId = 'conn_' + startPort.id() + '_' + endPort.id();
                    const outlinePath = new Konva.Path({ 
                        data: pathData, 
                        stroke: channelOutlineColor, 
                        strokeWidth: channelOutlineWidth, 
                        id: baseConnectionId + '_outline', 
                        listening: false 
                    });
                    const tubePath = new Konva.Path({ 
                        data: pathData, 
                        stroke: channelFillColor, // Use the same light blue as channels
                        strokeWidth: channelFillWidth, 
                        id: baseConnectionId + '_tube' 
                    });
                    tubePath.on('contextmenu', (evt) => { evt.evt.preventDefault(); deleteConnection(evt.target); });
                    layer.add(outlinePath);
                    layer.add(tubePath);
                    connections.push({
                        fromChip: startMainGroupId,
                        fromPort: startPort.id(),
                        toChip: endMainGroupId,
                        toPort: endPort.id(),
                        lineId: baseConnectionId,
                        resistance: calculateTubingResistance(tubePath.getLength()) // <<< ADDED RESISTANCE
                    });
                    console.log(`Connection successful: ${startPort.id()} -> ${endPort.id()} (Resistance: ${calculateTubingResistance(tubePath.getLength()).toExponential(2)})`);

                    // --- Hide port visuals on successful connection ---
                    // Hide inner port circles
                    if (startType !== 'outlet') {
                        startPort.visible(false);
                    }
                    endPort.visible(false);
                    // --- End port hiding ---

                    // --- Trigger flow update AFTER connection registered & ports hidden ---
                    findFlowPathAndHighlight(); // <<< Call it here

                    // <<< UPDATE TUBING LENGTH ON SUCCESSFUL CONNECTION >>>
                    calculateAndDisplayTubing();

                } else {
                    console.error("Could not calculate path data for connection.");
                }

                startPort.fill(startPort.getAttr('originalFill'));
                startPort = null;

                // <<< NEW: Reset cursor and remove temporary line (after successful connection) >>>
                stage.container().style.cursor = 'default';
                if (tempConnectionLine) {
                    tempConnectionLine.destroy();
                    tempConnectionLine = null;
                }
                // <<< END NEW >>>

                // Final draw renders port changes AND flow highlights
                layer.draw();
            } else {
                console.log("Connection cancelled (clicked same port or invalid target).");
                startPort.fill(startPort.getAttr('originalFill')); // Reset to original grey
                startPort = null;

                // <<< NEW: Reset cursor and remove temporary line >>>
                stage.container().style.cursor = 'default';
                if (tempConnectionLine) {
                    tempConnectionLine.destroy();
                    tempConnectionLine = null;
                }
                // <<< END NEW >>>

                layer.draw();
            }
        }
    });

    connectionPort.on('mouseenter', () => {
        stage.container().style.cursor = 'pointer';
        connectionPort.radius(portRadius * 1.5); // Enlarge inner circle
        layer.batchDraw(); // Redraw layer
        showNodeDetails(connectionPort.id()); // <<< FIX: Use the connectionPort's unique ID
    });
    connectionPort.on('mouseleave', () => {
        stage.container().style.cursor = 'default';
        connectionPort.radius(portRadius); // Reset inner circle radius
        layer.batchDraw(); // Redraw layer
        hideNodeDetails();
    });
    // --- END MODIFICATION ---

    return portVisualGroup; // Return the group containing the inner circle
}

// --- Main Component Creation Functions --- Use Channel Helpers ---

function createStraightChip(x, y) {
    const chipId = 'chip_' + Konva.Util.getRandomColor().replace('#','');
    const group = new Konva.Group({ x: x, y: y, draggable: true, chipType: 'straight', id: chipId });
    group.add(new Konva.Rect({
        width: chipWidth,
        height: chipHeight,
        fill: '#d9e2ec',    // Darker blue-grey for better contrast
        opacity: 0.85,      // Semi-transparent
        stroke: chipStroke,
        strokeWidth: 1,
        name: 'component-border',
        shadowColor: 'black',
        shadowBlur: 5,
        shadowOffsetX: 1,
        shadowOffsetY: 1,
        shadowOpacity: 0.15,
        shadowEnabled: true
    }));
    // ... rest of the function remains the same ...

    // Set resistance attribute
    group.setAttr('resistance', RESISTANCE_STRAIGHT);

    addStraightChannel(group); // Use helper

    // <<< Add internal connection data using UNIQUE IDs >>>
    const leftPortUniqueId = chipId + '_port_left';
    const rightPortUniqueId = chipId + '_port_right';
    group.setAttr('internalConnections', [
        [leftPortUniqueId, rightPortUniqueId]
    ]);

    // Ports using setupPortVisualsAndLogic
    const leftPortGroup = setupPortVisualsAndLogic({ x: 0, y: chipHeight / 2, portId: 'straight_left', uniqueId: leftPortUniqueId, mainDraggableGroup: group });
    group.add(leftPortGroup);
    const rightPortGroup = setupPortVisualsAndLogic({ x: chipWidth, y: chipHeight / 2, portId: 'straight_right', uniqueId: rightPortUniqueId, mainDraggableGroup: group });
    group.add(rightPortGroup);

    group.on('dragmove', () => { updateConnectionLines(group); });
    return group;
}

function createXChip(x, y) {
    const chipId = 'chip_' + Konva.Util.getRandomColor().replace('#','');
    const group = new Konva.Group({ x: x, y: y, draggable: true, chipType: 'x-type', id: chipId });
    // Apply glass style + shadow
    group.add(new Konva.Rect({
        width: chipWidth,
        height: chipHeight,
        fill: '#d9e2ec',    // Darker blue-grey for better contrast
        opacity: 0.85,      // Semi-transparent
        stroke: chipStroke,
        strokeWidth: 1,
        name: 'component-border',
        shadowColor: 'black',
        shadowBlur: 5,
        shadowOffsetX: 1,
        shadowOffsetY: 1,
        shadowOpacity: 0.15,
        shadowEnabled: true
    }));

    // Set resistance attribute
    group.setAttr('resistance', RESISTANCE_X_TYPE); // <<< ADDED

    addXChannel(group, chipId); // Use helper

    // Define internal connections for the X-chip (FULL connectivity)
    const leftPortId = chipId + '_port_left';
    const rightPortId = chipId + '_port_right';
    const topPortId = chipId + '_port_top';
    const bottomPortId = chipId + '_port_bottom';
    group.setAttr('internalConnections', [
        [leftPortId, rightPortId],
        [leftPortId, topPortId],
        [leftPortId, bottomPortId],
        [rightPortId, topPortId],
        [rightPortId, bottomPortId],
        [topPortId, bottomPortId]
    ]);

    // Ports using setupPortVisualsAndLogic
    const leftPortGroup = setupPortVisualsAndLogic({ x: 0, y: chipHeight / 2, portId: 'x_left', uniqueId: leftPortId, mainDraggableGroup: group });
    group.add(leftPortGroup);
    const rightPortGroup = setupPortVisualsAndLogic({ x: chipWidth, y: chipHeight / 2, portId: 'x_right', uniqueId: rightPortId, mainDraggableGroup: group });
    group.add(rightPortGroup);
    const topPortGroup = setupPortVisualsAndLogic({ x: chipWidth / 2, y: 0, portId: 'x_top', uniqueId: topPortId, mainDraggableGroup: group });
    group.add(topPortGroup);
    const bottomPortGroup = setupPortVisualsAndLogic({ x: chipWidth / 2, y: chipHeight, portId: 'x_bottom', uniqueId: bottomPortId, mainDraggableGroup: group });
    group.add(bottomPortGroup);

    group.on('dragmove', () => { updateConnectionLines(group); });
    return group;
}

function createTChip(x, y) {
    const chipId = 'chip_' + Konva.Util.getRandomColor().replace('#','');
    const group = new Konva.Group({ x: x, y: y, draggable: true, chipType: 't-type', id: chipId });
    // Apply glass style + shadow
    group.add(new Konva.Rect({
        width: chipWidth,
        height: chipHeight,
        fill: '#d9e2ec',    // Darker blue-grey for better contrast
        opacity: 0.85,      // Semi-transparent
        stroke: chipStroke,
        strokeWidth: 1,
        name: 'component-border',
        shadowColor: 'black',
        shadowBlur: 5,
        shadowOffsetX: 1,
        shadowOffsetY: 1,
        shadowOpacity: 0.15,
        shadowEnabled: true
    }));

    // Set resistance attribute
    group.setAttr('resistance', RESISTANCE_T_TYPE);

    addTChannel(group, chipId); // Use helper

    // Define internal connections for the T-chip
    const topPortUniqueId = chipId + '_port_top';
    const bottomPortUniqueId = chipId + '_port_bottom';
    const rightPortUniqueId = chipId + '_port_right';
    group.setAttr('internalConnections', [
        [topPortUniqueId, bottomPortUniqueId],
        [topPortUniqueId, rightPortUniqueId],
        [bottomPortUniqueId, rightPortUniqueId]
    ]);

    // Ports using setupPortVisualsAndLogic
    const cx = chipWidth / 2, cy = chipHeight / 2;
    const topPortGroup = setupPortVisualsAndLogic({ x: cx, y: 0, portId: 't_top', uniqueId: topPortUniqueId, mainDraggableGroup: group });
    group.add(topPortGroup);
    const bottomPortGroup = setupPortVisualsAndLogic({ x: cx, y: chipHeight, portId: 't_bottom', uniqueId: bottomPortUniqueId, mainDraggableGroup: group });
    group.add(bottomPortGroup);
    const rightPortGroup = setupPortVisualsAndLogic({ x: chipWidth, y: cy, portId: 't_right', uniqueId: rightPortUniqueId, mainDraggableGroup: group });
    group.add(rightPortGroup);

    group.on('dragmove', () => { updateConnectionLines(group); });
    return group;
}

// Updated to use SVG image
function createPump(x, y) {
    const itemId = 'pump_' + Konva.Util.getRandomColor().replace('#','');
    const group = new Konva.Group({ 
        x: x, 
        y: y, 
        draggable: true, 
        chipType: 'pump', 
        id: itemId, 
        width: itemWidth, 
        height: itemHeight 
    });

    // Initialize port pressures attribute
    group.setAttr('portPressures', {});

    // Load the SVG image
    Konva.Image.fromURL(pumpSvgDataUri, (imageNode) => {
        imageNode.setAttrs({
            width: itemWidth,
            height: itemHeight,
            name: 'pumpImage component-border',
            // NEW: Add shadow properties like the chips
            shadowColor: 'black',
            shadowBlur: 5,
            shadowOffsetX: 1,
            shadowOffsetY: 1,
            shadowOpacity: 0.15,
            shadowEnabled: true
        });
        group.add(imageNode);

        // Add ports AFTER the image is loaded
        const portPositions = [
            { x: itemWidth, y: itemHeight * 1 / 5, portId: 'pump_right1', id: itemId + '_port_right1' },
            { x: itemWidth, y: itemHeight * 2 / 5, portId: 'pump_right2', id: itemId + '_port_right2' },
            { x: itemWidth, y: itemHeight * 3 / 5, portId: 'pump_right3', id: itemId + '_port_right3' },
            { x: itemWidth, y: itemHeight * 4 / 5, portId: 'pump_right4', id: itemId + '_port_right4' }
        ];

        // Create and add Ports
        portPositions.forEach(pos => {
            const portGroup = setupPortVisualsAndLogic({
                x: pos.x, y: pos.y,
                portId: pos.portId, uniqueId: pos.id,
                mainDraggableGroup: group
            });
            group.add(portGroup);
        });

        group.getLayer()?.batchDraw();
    });

    group.on('dragmove', () => { updateConnectionLines(group); });
    return group;
}

// Updated to use setupPortVisualsAndLogic
function createOutlet(x, y) {
    const itemId = 'outlet_' + Konva.Util.getRandomColor().replace('#','');
    const group = new Konva.Group({ x: x, y: y, draggable: true, chipType: 'outlet', id: itemId, width: outletWidth, height: outletHeight });

    Konva.Image.fromURL(outletSvgDataUri, (imageNode) => {
        imageNode.setAttrs({
            width: outletWidth,
            height: outletHeight,
            name: 'outletImage component-border',
            // NEW: Add shadow properties like the chips
            shadowColor: 'black',
            shadowBlur: 5,
            shadowOffsetX: 1,
            shadowOffsetY: 1,
            shadowOpacity: 0.15,
            shadowEnabled: true
        });
        group.add(imageNode);

        // Create and add Port (Top Center)
        const portX = outletWidth / 2;
        const portY = 0;
        const portGroup = setupPortVisualsAndLogic({
            x: portX, y: portY,
            portId: 'outlet_top_in', uniqueId: itemId + '_port_in',
            mainDraggableGroup: group
        });
        group.add(portGroup);

        group.getLayer()?.batchDraw();

        // --- Trigger flow update AFTER outlet is fully initialized ---
        findFlowPathAndHighlight();
        // --- End Trigger ---
    });

    group.on('dragmove', () => { updateConnectionLines(group); });
    return group;
}

// --- Function to Update Connection Lines (now Paths) ---
function updateConnectionLines(movedChipGroup) {
    const movedChipId = movedChipGroup.id();

    connections.forEach(conn => {
        if (conn.fromChip === movedChipId || conn.toChip === movedChipId) {
            // Find the port shapes
            const port1 = stage.findOne('#' + conn.fromPort);
            const port2 = stage.findOne('#' + conn.toPort);

            // Find BOTH path shapes using base ID + suffixes
            const tubePath = layer.findOne('#' + conn.lineId + '_tube');
            const outlinePath = layer.findOne('#' + conn.lineId + '_outline');

            // Ensure all elements exist before proceeding
            if (tubePath && outlinePath && port1 && port2) {
                const newPathData = calculatePathData(port1, port2);
                if (newPathData) {
                    // Update the data for BOTH paths
                    tubePath.data(newPathData);
                    outlinePath.data(newPathData);

                    // --- Recalculate and update resistance ---
                    const newLengthPx = tubePath.getLength();
                    const newResistance = calculateTubingResistance(newLengthPx);
                    const connIndex = connections.findIndex(c => c.lineId === conn.lineId);
                    if (connIndex !== -1) {
                        connections[connIndex].resistance = newResistance;
                         console.log(`Updated resistance for ${conn.lineId}: ${newResistance.toExponential(2)} (Length: ${newLengthPx.toFixed(1)}px)`); // Debug log
                    } else {
                        console.warn("Could not find connection in array to update resistance:", conn.lineId);
                    }
                    // --- End resistance update ---

                } else {
                    console.warn("Could not recalculate path data for connection:", conn.lineId);
                }
            } else {
                console.warn("Could not find all required elements for connection update:", conn.lineId, {
                    tubeExists: !!tubePath,
                    outlineExists: !!outlinePath,
                    port1Exists: !!port1,
                    port2Exists: !!port2
                });
            }
        }
    });

    layer.batchDraw(); // Update the layer once all paths are adjusted
}

// --- Palette Setup (Use Preview functions) ---
function setupPalette() {
    // --- NEW: Define fixed size for palette chip Konva stages --- //
    const chipPreviewSize = 64; // Match the CSS width/height for .palette-chip

    // Straight Chip Preview
    // --- MODIFIED: Target the new inner div --- //
    const straightPaletteContainer = document.getElementById('palette-straight-chip-konva'); // Target inner div
    if (!straightPaletteContainer) { console.error("Palette container 'palette-straight-chip-konva' not found!"); } // Updated error message
    else {
        const straightPaletteStage = new Konva.Stage({
            container: 'palette-straight-chip-konva', // Use inner div ID
            width: chipPreviewSize, // Use fixed size
            height: chipPreviewSize, // Use fixed size
        });
        const straightPaletteLayer = new Konva.Layer();
        straightPaletteStage.add(straightPaletteLayer);
        const straightChipPreview = createStraightChipPreview(5, 3); // ADJUSTED Y
        straightPaletteLayer.add(straightChipPreview);

        straightPaletteLayer.draw();
        // Add listener to the outer .palette-chip div for selection
        const outerStraightDiv = document.getElementById('palette-straight-chip');
        if (outerStraightDiv) {
            outerStraightDiv.addEventListener('click', () => handlePaletteSelection('straight'));
        }
    }

    // X-Chip Preview
    // --- MODIFIED: Target the new inner div --- //
    const xPaletteContainer = document.getElementById('palette-x-chip-konva'); // Target inner div
    if (!xPaletteContainer) { console.error("Palette container 'palette-x-chip-konva' not found!"); } // Updated error message
     else {
        const xPaletteStage = new Konva.Stage({
            container: 'palette-x-chip-konva', // Use inner div ID
            width: chipPreviewSize, // Use fixed size
            height: chipPreviewSize, // Use fixed size
        });
        const xPaletteLayer = new Konva.Layer();
        xPaletteStage.add(xPaletteLayer);
        const xChipPreview = createXChipPreview(5, 3); // ADJUSTED Y
        xPaletteLayer.add(xChipPreview);

        xPaletteLayer.draw();
        // Add listener to the outer .palette-chip div for selection
        const outerXDiv = document.getElementById('palette-x-chip');
        if (outerXDiv) {
            outerXDiv.addEventListener('click', () => handlePaletteSelection('x-type'));
        }
    }

    // T-Chip Preview
    // --- MODIFIED: Target the new inner div --- //
    const tPaletteContainer = document.getElementById('palette-t-chip-konva'); // Target inner div
    if (!tPaletteContainer) { console.error("Palette container 'palette-t-chip-konva' not found!"); } // Updated error message
    else {
        const tPaletteStage = new Konva.Stage({
            container: 'palette-t-chip-konva', // Use inner div ID
            width: chipPreviewSize, // Use fixed size
            height: chipPreviewSize, // Use fixed size
        });
        const tPaletteLayer = new Konva.Layer();
        tPaletteStage.add(tPaletteLayer);
        const tChipPreview = createTChipPreview(5, 3); // ADJUSTED Y
        tPaletteLayer.add(tChipPreview);

        tPaletteLayer.draw();
        // Add listener to the outer .palette-chip div for selection
        const outerTDiv = document.getElementById('palette-t-chip');
        if (outerTDiv) {
            outerTDiv.addEventListener('click', () => handlePaletteSelection('t-type'));
        }
    }

    // NEW: Meander Chip Preview
    // --- MODIFIED: Target the new inner div --- //
    const meanderPaletteContainer = document.getElementById('palette-meander-chip-konva'); // Target inner div
    if (!meanderPaletteContainer) { console.error("Palette container 'palette-meander-chip-konva' not found!"); } // Updated error message
    else {
        const meanderPaletteStage = new Konva.Stage({
            container: 'palette-meander-chip-konva', // Use inner div ID
            width: chipPreviewSize, // Use fixed size
            height: chipPreviewSize, // Use fixed size
        });
        const meanderPaletteLayer = new Konva.Layer();
        meanderPaletteStage.add(meanderPaletteLayer);
        const meanderChipPreview = createMeanderChipPreview(5, 3); // ADJUSTED Y
        meanderPaletteLayer.add(meanderChipPreview);

        meanderPaletteLayer.draw();
        // Add listener to the outer .palette-chip div for selection
        const outerMeanderDiv = document.getElementById('palette-meander-chip');
        if (outerMeanderDiv) {
            outerMeanderDiv.addEventListener('click', () => handlePaletteSelection('meander'));
        }
    }

    // Pump Preview - Setup using simple rectangle preview
    // --- MODIFIED: Target the new inner div --- //
    const pumpPaletteContainer = document.getElementById('palette-pump-konva'); // Target inner div
    if (!pumpPaletteContainer) { console.error("Palette container 'palette-pump-konva' not found!"); } // Updated error message
    else { // Only setup if container exists
        const pumpPaletteStage = new Konva.Stage({
            container: 'palette-pump-konva', // Use inner div ID
            width: chipPreviewSize, // Use fixed size
            height: chipPreviewSize, // Use fixed size
        });
        const pumpPaletteLayer = new Konva.Layer();
        pumpPaletteStage.add(pumpPaletteLayer);
        // Use the updated preview function (no SVG URI needed)
        const pumpPreview = createPumpPreview(5, 3, itemWidth, itemHeight); // ADJUSTED Y
        pumpPaletteLayer.add(pumpPreview);

        pumpPaletteLayer.draw(); // Draw the preview layer
        // Add listener to the outer .palette-chip div for selection
        const outerPumpDiv = document.getElementById('palette-pump');
        if (outerPumpDiv) {
            outerPumpDiv.addEventListener('click', () => handlePaletteSelection('pump'));
        }
    }

    // Outlet Preview - Setup using SVG Data URI
    // --- MODIFIED: Target the new inner div --- //
    const outletPaletteContainer = document.getElementById('palette-outlet-konva'); // Target inner div
    if (!outletPaletteContainer) { console.error("Palette container 'palette-outlet-konva' not found!"); } // Updated error message
    else { // Only setup if container exists
        const outletPaletteStage = new Konva.Stage({
            container: 'palette-outlet-konva', // Use inner div ID
            width: chipPreviewSize, // Use fixed size
            height: chipPreviewSize, // Use fixed size
        });
        const outletPaletteLayer = new Konva.Layer();
        outletPaletteStage.add(outletPaletteLayer);
        // Use the SVG data URI, scale to fit palette dimensions
        // Adjust scaling factor as needed to look good
        // const previewScale = Math.min((outletPaletteContainer.offsetWidth - 10) / outletWidth, (outletPaletteContainer.offsetHeight - 10) / outletHeight) * 0.8;
        // Use chipPreviewSize for calculations now
        const padding = 10; // Padding inside the chip preview area
        const availableWidth = chipPreviewSize - padding;
        const availableHeight = chipPreviewSize - padding; // Use full height within padding

        // Calculate the initial scale to fit
        let previewScale = Math.min(availableWidth / outletWidth, availableHeight / outletHeight);

        // Apply an additional reduction factor to make it slightly smaller
        previewScale *= 0.85;

        const previewWidth = outletWidth * previewScale;
        const previewHeight = outletHeight * previewScale;
        // Center the preview within the chipPreviewSize area
        const previewX = (chipPreviewSize - previewWidth) / 2;
        // Center vertically and shift up more to prevent bottom cutoff
        const previewY = (chipPreviewSize - previewHeight) / 2; // <<< NEW: Just center

        const outletPreview = createOutletPreview(previewX, previewY, previewWidth, previewHeight, outletSvgDataUri);
        outletPaletteLayer.add(outletPreview);
        // Drawing handled by image load callback

        // REMOVED: Konva text label - we are using HTML <p> tags now
        /*
        const outletLabel = new Konva.Text({
            x: 0,
            // Position label at the bottom of the 64px area
            y: chipPreviewSize - 15, // Adjusted Y for bottom positioning
            text: getComponentDisplayName('outlet'),
            fontSize: 10,
            fontFamily: 'Arial',
            fill: 'black',
            width: outletPaletteStage.width(),
            align: 'center'
        });
        outletPaletteLayer.add(outletLabel);
        // Redraw happens in the image load callback within createOutletPreview OR explicitly here if needed
        // Let's ensure it redraws after adding label
         outletPaletteLayer.batchDraw(); // Add redraw after adding label
         */

        // Add listener to the outer .palette-chip div for selection
        const outerOutletDiv = document.getElementById('palette-outlet');
        if (outerOutletDiv) {
            outerOutletDiv.addEventListener('click', () => handlePaletteSelection('outlet'));
        }
    }

    console.log('Palette initialized (including Pump and Outlet). Targeting inner divs.'); // Updated log message
}

// --- Add Stage Context Menu Listener for Cancellation ---
stage.on('contextmenu', (e) => {
    e.evt.preventDefault(); // Prevent context menu on stage too
    // If we right-click on the stage itself (not a shape handled above) and a port is selected,
    // cancel the selection.
    if (e.target === stage && startPort !== null) {
        console.log("Connection cancelled (clicked stage).");
        startPort.fill(startPort.getAttr('originalFill')); // Reset color
        startPort = null; // Reset selection

        // <<< NEW: Reset cursor and remove temporary line >>>
        stage.container().style.cursor = 'default';
        if (tempConnectionLine) {
            tempConnectionLine.destroy();
            tempConnectionLine = null;
        }
        // <<< END NEW >>>

        layer.draw();
    }
});

// --- Component List Logic ---

const componentListContainer = document.getElementById('component-list-content');

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

// --- Helper Function for Scientific Notation Formatting ---
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

// --- NEW: Update Properties Panel --- //
const propertiesContainer = document.getElementById('selected-component-properties');
const mbarToPascal = 100;

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
    const microLitersPerMinuteFactor = 6e+7; // For flow conversion

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
            // resistanceText = resistanceValue ? `${resistanceValue.toExponential(2)} Pa·s/m³` : 'Error'; // <<< OLD
            resistanceText = resistanceValue ? `${formatScientificNotation(resistanceValue)} Pa·s/m³` : 'Error'; // <<< NEW
            channelDimensionsText = `${CHANNEL_WIDTH_MICRONS}µm W x ${CHANNEL_DEPTH_MICRONS}µm D x ${LENGTH_STRAIGHT_MM}mm L`;
            break;
        case 't-type':
            purpose = 'Used to split one fluid stream into two, or merge two streams into one.';
            dimensions = chipDimMm;
            // resistanceText = resistanceValue ? `${resistanceValue.toExponential(2)} Pa·s/m³ (per segment)` : 'Error'; // <<< OLD
            resistanceText = resistanceValue ? `${formatScientificNotation(resistanceValue)} Pa·s/m³ (per segment)` : 'Error'; // <<< NEW
            channelDimensionsText = `${CHANNEL_WIDTH_MICRONS}µm W x ${CHANNEL_DEPTH_MICRONS}µm D x ${LENGTH_T_X_SEGMENT_MM}mm L (per segment)`;
            break;
        case 'x-type':
            purpose = 'Allows for complex flow manipulation, such as mixing four streams or forming droplets.';
            dimensions = chipDimMm;
            // resistanceText = resistanceValue ? `${resistanceValue.toExponential(2)} Pa·s/m³ (per segment)` : 'Error'; // <<< OLD
            resistanceText = resistanceValue ? `${formatScientificNotation(resistanceValue)} Pa·s/m³ (per segment)` : 'Error'; // <<< NEW
            channelDimensionsText = `${CHANNEL_WIDTH_MICRONS}µm W x ${CHANNEL_DEPTH_MICRONS}µm D x ${LENGTH_T_X_SEGMENT_MM}mm L (per segment)`;
            break;
        case 'meander':
            purpose = 'Increases the path length within a small area, useful for mixing, heat exchange, or increasing reaction time.';
            dimensions = chipDimMm;
            // resistanceText = resistanceValue ? `${resistanceValue.toExponential(2)} Pa·s/m³` : 'Error'; // <<< OLD
            resistanceText = resistanceValue ? `${formatScientificNotation(resistanceValue)} Pa·s/m³` : 'Error'; // <<< NEW
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

    // propertiesHtml += `<p><strong>Purpose:</strong> ${purpose}</p>`; // REMOVED Strong tag
    propertiesHtml += `<p class="component-purpose">${purpose}</p>`; // ADDED class for styling

    // --- NEW: Use structured divs for properties --- //
    propertiesHtml += '<div class="properties-grid">'; // Start grid container

    if (material !== 'N/A') {
        // propertiesHtml += `<p><strong>Material:</strong> ${material}</p>`; // OLD
        propertiesHtml += `<div class="prop-row"><span class="prop-label">Material:</span><span class="prop-value">${material}</span></div>`; // NEW
    }
    // --- MODIFICATION: Only show dimensions if not pump or outlet ---
    if (componentType !== 'pump' && componentType !== 'outlet') {
        // propertiesHtml += `<p><strong>Chip Dimensions:</strong><br>${dimensions}</p>`; // OLD
        propertiesHtml += `<div class="prop-row"><span class="prop-label">Chip Dim.:</span><span class="prop-value">${dimensions}</span></div>`; // NEW, shorter label

        // <<< NEW: Display Channel Dimensions if available >>>
        if (channelDimensionsText) {
            let valueHtml = channelDimensionsText;
            let subValueHtml = '';
            if (valueHtml.includes('(per segment)')) {
                valueHtml = valueHtml.replace('(per segment)', '').trim();
                subValueHtml = '<span class="prop-sub-value">(per segment)</span>';
            }
            // propertiesHtml += `<p><strong>Channel Dimensions:</strong><br>${formattedChannelDim}</p>`; // OLD
            propertiesHtml += `<div class="prop-row"><span class="prop-label">Channel Dim.:</span><span class="prop-value">${valueHtml}${subValueHtml}</span></div>`; // NEW, shorter label
        }
    }
    // --- END MODIFICATION ---
    if (resistanceText !== 'N/A (Source)' && resistanceText !== 'N/A (Sink)') {
         let valueHtml = resistanceText;
         let subValueHtml = '';
         if (valueHtml.includes('(per segment)')) {
             valueHtml = valueHtml.replace('(per segment)', '').trim();
             subValueHtml = '<span class="prop-sub-value">(per segment)</span>';
         }
         // propertiesHtml += `<p><strong>Hydrodynamic Resistance:</strong><br>${formattedResistance}</p>`; // OLD
         propertiesHtml += `<div class="prop-row"><span class="prop-label">Resistance:</span><span class="prop-value">${valueHtml}${subValueHtml}</span></div>`; // NEW, shorter label
    }

    propertiesHtml += '</div>'; // End grid container
    // --- END NEW --- //

    propertiesHtml += '</div>'; // End component-details
    // propertiesHtml += '<hr style="margin: 15px 0;">'; // Separator before specific controls/data

    // --- END NEW SECTION ---


    // --- Display Pump Properties ---
    // --- MODIFIED: Guard this block with !isPalette --- //
    if (!isPalette && componentType === 'pump') {
        propertiesHtml += '<hr style="margin: 15px 0;">'; // Add separator here for pumps
        // propertiesHtml += '<h4>Port Pressures (mbar):</h4>'; // OLD heading
        propertiesHtml += '<h4 class="subheading">Port Pressures (mbar)</h4>'; // ADDED class for styling
        const portPressuresPa = selectedComponent.getAttr('portPressures') || {}; // Get pressures in Pascals
        const ports = selectedComponent.find('.connectionPort');

        if (ports.length === 0) {
            propertiesHtml += '<p>No ports found.</p>';
        } else {
            ports.forEach((port, index) => {
                const portId = port.id();
                const currentPressurePa = portPressuresPa[portId] || 0; // Default to 0 Pa if not set
                const currentPressureMbar = currentPressurePa / mbarToPascal;

                propertiesHtml += `
                    <div class="property-item">
                        <label for="pressure_${portId}">Port ${index + 1}:</label>
                        <input type="number" id="pressure_${portId}" data-port-id="${portId}" value="${currentPressureMbar}" step="1">
                        <!-- <span class="unit-label">(mbar)</span> --> <!-- REMOVED UNIT -->
                    </div>
                `;
            });
        }
    }

    // --- NEW: Display Internal Junction Simulation Data for T/X Chips ---
    // --- Guarded by simulationRan which implies !isPalette
    if (simulationRan && (componentType === 't-type' || componentType === 'x-type')) {
        propertiesHtml += '<hr style="margin: 15px 0;">'; // Separator
        propertiesHtml += '<h4>Internal Junction Simulation</h4>';

        const internalNodeId = getInternalNodeId(componentId);
        const internalPressurePa = simulationResults.pressures[internalNodeId];

        if (internalPressurePa !== undefined && isFinite(internalPressurePa)) {
            const internalPressureMbar = internalPressurePa / mbarToPascal;
            propertiesHtml += `<div class="property-item"><span>Junction Pressure: ${internalPressureMbar.toFixed(1)} mbar</span></div>`;
        } else {
            propertiesHtml += `<div class="property-item"><span>Junction Pressure: N/A</span></div>`;
        }

        propertiesHtml += '<h5>Segment Flows (to/from Junction):</h5>';
        const ports = selectedComponent.find('.connectionPort');
        if (ports.length > 0) {
            propertiesHtml += '<ul>';
            ports.forEach(port => {
                const portId = port.id();
                const portGenericId = port.getAttr('portId');
                const segmentId = getSegmentId(portId, internalNodeId);
                const flowData = simulationResults.flows[segmentId];
                let flowText = "N/A";

                if (flowData && isFinite(flowData.flow)) {
                    const flowRateM3ps = flowData.flow;
                    const flowRateUlMin = flowRateM3ps * microLitersPerMinuteFactor;
                    let directionIndicator = "";
                    // Determine flow direction relative to internal node
                    if (Math.abs(flowRateM3ps) > 1e-15) { // Add tolerance
                        if (flowData.to === internalNodeId) {
                            directionIndicator = "+"; // Flow INTO junction
                        } else if (flowData.from === internalNodeId) {
                            directionIndicator = "-"; // Flow OUT OF junction
                        }
                    }
                    flowText = `${directionIndicator}${Math.abs(flowRateUlMin).toFixed(2)} µL/min`;
                }
                propertiesHtml += `<li style="font-size: 0.9em; margin-left: 10px;">${portGenericId}: ${flowText}</li>`;
            });
            propertiesHtml += '</ul>';
        } else {
             propertiesHtml += '<p style="font-size: 0.9em; margin-left: 10px;">No ports found for flow details.</p>';
        }

    } else if (!isPalette && componentType !== 'pump' && !(typeof selectedComponent.getAttr === 'function' && selectedComponent.getAttr('resistance'))) {
        // If it's not a pump, has no resistance, and no simulation data to show
        // Maybe add a note that it's a canvas selection with no specific properties?
        // propertiesHtml += '<p>No specific properties to display for this instance.</p>';
    }
    // --- END NEW SECTION ---

    propertiesContainer.innerHTML = propertiesHtml;

    // Add event listeners for pump pressure inputs *after* adding them to the DOM
    // --- MODIFIED: Confirm this check is correct --- //
    if (!isPalette && componentType === 'pump') { // This guard should remain
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
    const pressureMbar = parseFloat(input.value) || 0;
    const pressurePa = pressureMbar * mbarToPascal;

    // Update the Konva node's attribute
    const currentPressures = selectedComponent.getAttr('portPressures') || {};
    currentPressures[portId] = pressurePa;
    selectedComponent.setAttr('portPressures', currentPressures);

    console.log(`Updated pressure for ${portId} on ${selectedComponent.id()}: ${pressureMbar} mbar (${pressurePa} Pa)`);

    // Optional: Immediately trigger simulation update if desired
    // findFlowPathAndHighlight(); // Or a new simulation function
}

// --- Tubing Calculation Logic ---

const tubingInfoContainer = document.getElementById('tubing-info');

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

// Modify updateComponentList to ONLY update components
function updateComponentList() {
    const componentCounts = {};
    let totalComponents = 0;

    layer.find('Group').forEach(group => {
        if (group.draggable()) {
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
            return getComponentDisplayName(a).localeCompare(getComponentDisplayName(b));
        });

        sortedTypes.forEach(chipType => {
            const displayName = getComponentDisplayName(chipType);
            const count = componentCounts[chipType];
            listHtml += `<div class="component-row">
                <div class="component-name">${displayName}</div>
                <div class="component-quantity">${count}</div>
            </div>`;
        });
        componentListContainer.innerHTML = listHtml;
    }
}

// --- Event Listener Modifications ---
window.addEventListener('DOMContentLoaded', (event) => {
    console.log('DOM fully loaded and parsed');

    // Setup the visual previews in the palette first
    setupPalette();

    // --- Setup Drag and Drop Logic --- (Keep existing D&D logic)
    let dragChipType = null;
    // Select the inner konva divs which are now draggable
    document.querySelectorAll('[id$="-konva"][draggable="true"]').forEach(konvaDiv => {
        if (!konvaDiv) return;
        konvaDiv.addEventListener('dragstart', (e) => {
            // Get the type from the konva div's data attribute
            dragChipType = konvaDiv.getAttribute('data-chip-type');
            console.log('Dragging:', dragChipType);

            // <<< NEW: Change cursor >>>
            if(e.target.style) e.target.style.cursor = 'grabbing';

            // Optional: You might want to customize the drag image here
            // e.dataTransfer.setData('text/plain', dragChipType);
            // if (e.dataTransfer.setDragImage) {
            //     const preview = konvaDiv.closest('.palette-chip'); // Or a custom drag image
            //     e.dataTransfer.setDragImage(preview, 0, 0);
            // }
        });
        konvaDiv.addEventListener('dragend', (e) => {
            console.log('Drag ended');

            // <<< NEW: Reset cursor and remove indicator >>>
            if(e.target.style) e.target.style.cursor = 'grab';
            if (dropIndicatorShape) {
                dropIndicatorShape.destroy();
                dropIndicatorShape = null;
                layer.batchDraw();
            }

            // Important: Reset dragChipType in a timeout to avoid race conditions
            setTimeout(() => { dragChipType = null; }, 0);
        });
    });

    const stageContainer = stage.container();
    if (!stageContainer) {
        console.error("Stage container not found for D&D listeners!");
        return;
    }

    stageContainer.addEventListener('dragover', (e) => {
        e.preventDefault();

        // <<< NEW: Show/Update drop indicator >>>
        if (dragChipType) {
            stage.setPointersPositions(e);
            const pos = stage.getPointerPosition();
            let indicatorWidth, indicatorHeight;

            // Determine size based on the type being dragged
            if (dragChipType === 'pump') {
                indicatorWidth = itemWidth;
                indicatorHeight = itemHeight;
            } else if (dragChipType === 'outlet') {
                indicatorWidth = outletWidth;
                indicatorHeight = outletHeight;
        } else {
                indicatorWidth = chipWidth;
                indicatorHeight = chipHeight;
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
                });
                layer.add(dropIndicatorShape);
            }

            // Update size and position
            dropIndicatorShape.setAttrs({
                x: dropX,
                y: dropY,
                width: indicatorWidth,
                height: indicatorHeight
            });

            layer.batchDraw();
        }
        // <<< END NEW >>>
    });

    // <<< NEW: Remove indicator if dragging leaves the stage >>>
    stageContainer.addEventListener('dragleave', (e) => {
        if (dropIndicatorShape) {
            dropIndicatorShape.destroy();
            dropIndicatorShape = null;
            layer.batchDraw();
        }
    });
    // <<< END NEW >>>

    stageContainer.addEventListener('drop', (e) => {
        e.preventDefault();

        // <<< NEW: Destroy indicator before dropping >>>
        if (dropIndicatorShape) {
            dropIndicatorShape.destroy();
            dropIndicatorShape = null;
        }
        // <<< END NEW >>>

        if (dragChipType) {
            stage.setPointersPositions(e);
            const pos = stage.getPointerPosition();
            let dropX, dropY;
            if (dragChipType === 'pump') {
                dropX = pos.x - itemWidth / 2;
                dropY = pos.y - itemHeight / 2;
            } else if (dragChipType === 'outlet') {
                dropX = pos.x - outletWidth / 2;
                dropY = pos.y - outletHeight / 2;
        } else {
                dropX = pos.x - chipWidth / 2;
                dropY = pos.y - chipHeight / 2;
            }
            let newItem;
            let isAsyncItem = false;
            if (dragChipType === 'straight') {
                newItem = createStraightChip(dropX, dropY);
            } else if (dragChipType === 'x-type') {
                newItem = createXChip(dropX, dropY);
            } else if (dragChipType === 't-type') {
                newItem = createTChip(dropX, dropY);
            } else if (dragChipType === 'pump') {
                newItem = createPump(dropX, dropY);
            } else if (dragChipType === 'outlet') {
                newItem = createOutlet(dropX, dropY);
                isAsyncItem = true;
            } else if (dragChipType === 'meander') {
                newItem = createMeanderChip(dropX, dropY);
            }
            if (newItem) {
                layer.add(newItem);
                console.log('Dropped', dragChipType, 'at', dropX, dropY);

                // --- NEW: Hide getting started overlay --- //
                const overlay = document.getElementById('getting-started-overlay');
                if (overlay) overlay.classList.add('hidden');
                // --- END NEW --- //

                if (!isAsyncItem) {
                    findFlowPathAndHighlight();
                    updateComponentList(); // Update component list only
                } else {
                     setTimeout(updateComponentList, 100); // Update component list only
                }
                layer.draw();
            }
            dragChipType = null;
        } else {
             console.log("Drop event occurred but no dragChipType was set.");
        }
    });
    console.log('Drag and Drop listeners attached.');

    // --- Clear Canvas Button Listener ---
    const clearButton = document.getElementById('clear-canvas-btn');
    if (clearButton) {
        clearButton.addEventListener('click', () => {
            console.log('Clear Canvas button clicked');

            // Clear all simulation visuals first
            clearSimulationVisuals();

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

            // Clear remaining connections
            connections.length = 0;

            // Reset port selection if active
            if (startPort) {
                startPort.fill(startPort.getAttr('originalFill'));
                startPort = null;
            }

            // Reset simulation results
            simulationResults = {
                pressures: {},
                flows: {}
            };

            // Reset selected component and properties panel
            selectedComponent = null;
            updatePropertiesPanel();

            // Redraw the layer
            layer.draw();
            updateComponentList();
            calculateAndDisplayTubing();
            console.log('Canvas cleared.');
        });
    } else {
        console.error('Clear Canvas button not found!');
    }

    // Initial updates on load
    updateComponentList();
    calculateAndDisplayTubing(); // <<< INITIAL TUBING CALCULATION >>>

    // --- Simulation Button Listener ---
    const simButton = document.getElementById('run-simulation-btn');
    if (simButton) {
        simButton.addEventListener('click', runFluidSimulation);
    } else {
        console.error("Run Simulation button not found!");
    }

    // --- NEW: Reset Simulation Button Listener ---
    const resetButton = document.getElementById('reset-simulation-btn');
    if (resetButton) {
        resetButton.addEventListener('click', resetSimulationState);
    } else {
        console.error("Reset Simulation button not found!");
    }

    // --- NEW: How-to Modal Logic ---
    const howtoIcon = document.getElementById('howto-icon');
    const howtoModal = document.getElementById('how-to-use-guide'); // Content div
    const howtoOverlay = document.getElementById('howto-modal-overlay'); // Overlay div
    const closeHowtoBtn = document.getElementById('close-howto-modal');

    // --- DEBUG: Log element references ---
    console.log("Howto Elements Check:", {
        icon: howtoIcon,
        modal: howtoModal,
        overlay: howtoOverlay,
        closeBtn: closeHowtoBtn
    });
    // --- END DEBUG ---

    function openHowtoModal() {
        console.log("openHowtoModal called"); // DEBUG
        if(howtoModal && howtoOverlay) {
            console.log("Adding modal-visible class TO OVERLAY ONLY"); // DEBUG
            howtoOverlay.classList.add('modal-visible');
            // howtoModal.classList.add('modal-visible'); // REMOVED - Let overlay handle visibility
        } else {
            console.error("Cannot open modal: Modal or overlay element not found inside openHowtoModal."); // DEBUG
        }
    }

    function closeHowtoModal() {
        console.log("closeHowtoModal called"); // DEBUG
         if(howtoModal && howtoOverlay) {
            console.log("Removing modal-visible class FROM OVERLAY ONLY"); // DEBUG
            howtoOverlay.classList.remove('modal-visible');
            // howtoModal.classList.remove('modal-visible'); // REMOVED
        } else {
            console.error("Cannot close modal: Modal or overlay element not found inside closeHowtoModal."); // DEBUG
        }
    }

    if (howtoIcon && howtoModal && howtoOverlay && closeHowtoBtn) {
        console.log("Attaching Howto modal event listeners..."); // DEBUG
        howtoIcon.addEventListener('click', () => {
            console.log("Howto icon clicked!"); // DEBUG
            // Restore original function call
            // alert("Howto Icon Clicked! Test Successful."); // REMOVED
            openHowtoModal();
        });
        closeHowtoBtn.addEventListener('click', closeHowtoModal);
        howtoOverlay.addEventListener('click', closeHowtoModal); // Close on overlay click
        console.log("Howto modal event listeners attached."); // DEBUG
    } else {
        console.error("Could not find all elements for How-to-Use modal functionality.", {
            howtoIcon: !!howtoIcon,
            howtoModal: !!howtoModal,
            howtoOverlay: !!howtoOverlay,
            closeHowtoBtn: !!closeHowtoBtn
        });
    }
    // --- END NEW SECTION ---

    // --- NEW: Sidebar Toggle Logic --- //
    const palette = document.getElementById('palette');
    const componentList = document.getElementById('component-list');
    const togglePaletteBtn = document.getElementById('toggle-palette-btn');
    const toggleComponentListBtn = document.getElementById('toggle-component-list-btn');

    if (palette && togglePaletteBtn) {
        togglePaletteBtn.addEventListener('click', () => {
            palette.classList.toggle('sidebar-visible');
            // Optional: Hide component list if palette is shown
            if (componentList && palette.classList.contains('sidebar-visible')) {
                componentList.classList.remove('sidebar-visible');
            }
        });
    }

    if (componentList && toggleComponentListBtn) {
        toggleComponentListBtn.addEventListener('click', () => {
            componentList.classList.toggle('sidebar-visible');
            // Optional: Hide palette if component list is shown
            if (palette && componentList.classList.contains('sidebar-visible')) {
                palette.classList.remove('sidebar-visible');
            }
        });
    }
    // --- END Sidebar Toggle Logic --- //

    // --- NEW: Dynamic Height Adjustment for Small Screens --- //
    const header = document.querySelector('header');
    const introText = document.querySelector('.introduction-text');
    // const palette = document.getElementById('palette'); // Already defined above
    // const componentList = document.getElementById('component-list'); // Already defined above
    const mainContent = document.getElementById('main-content');
    const appContainerPaddingSmall = 20; // 10px top + 10px bottom in @media

    function adjustLayoutHeights() {
        // Check if elements exist before proceeding
        if (!header || !introText || !palette || !componentList || !mainContent) {
            console.error("Height Adjust: Missing one or more layout elements.");
            return;
        }

        // Check if we are in the small screen view based on CSS media query
        if (window.matchMedia('(max-width: 992px)').matches) {
            const headerHeight = header.offsetHeight;
            const introTextHeight = introText.offsetHeight;
            const viewportHeight = window.innerHeight;
            const correctTop = headerHeight + introTextHeight; // Calculate correct top position

            // Calculate available height below header and intro text, minus app padding
            const availableHeight = viewportHeight - correctTop - appContainerPaddingSmall;

            // Apply calculated height AND TOP POSITION as inline style
            if (availableHeight > 0) {
                palette.style.top = `${correctTop}px`; // Set dynamic top
                componentList.style.top = `${correctTop}px`; // Set dynamic top
                palette.style.height = `${availableHeight}px`;
                componentList.style.height = `${availableHeight}px`;
                mainContent.style.maxHeight = `${availableHeight}px`;
                const canvasContainer = document.getElementById('canvas-container');
                if(canvasContainer) canvasContainer.style.height = `${availableHeight}px`;
            } else {
                 // Fallback or reset if calculation is invalid
                 palette.style.top = ''; // Reset top
                 componentList.style.top = ''; // Reset top
                 palette.style.height = '';
                 componentList.style.height = '';
                 mainContent.style.maxHeight = '';
                 const canvasContainer = document.getElementById('canvas-container');
                 if(canvasContainer) canvasContainer.style.height = '';
            }
        } else {
            // Reset styles if screen is large (let CSS handle it)
            palette.style.top = ''; // Reset top
            componentList.style.top = ''; // Reset top
            palette.style.height = '';
            componentList.style.height = '';
            mainContent.style.maxHeight = '';
            const canvasContainer = document.getElementById('canvas-container');
            if(canvasContainer) canvasContainer.style.height = ''; // Reset canvas container height
        }
    }

    // Initial adjustment on load
    adjustLayoutHeights();

    // Adjust heights on window resize
    window.addEventListener('resize', adjustLayoutHeights);
    // --- END Dynamic Height Adjustment --- //


    // --- REMOVED: Collapsible How-to-Use Section Logic ---
    // const howToUseSection = document.getElementById('how-to-use-guide');
    // const howToUseHeading = howToUseSection?.querySelector('.collapsible-heading');

    // if (howToUseSection && howToUseHeading) { ... }
    // --- END REMOVED SECTION ---
});

// --- Flow Pathfinding and Highlighting ---

function findFlowPathAndHighlight() {
    console.log("Updating flow visualization (Pump Reachability)...");

    // 1. Reset existing highlights
    layer.find('._tube').forEach(tube => {
        tube.stroke(channelFillColor); // Use the same light blue as channels
    });
    layer.find('.internalChannelFill').forEach(channel => {
        const chipGroup = channel.findAncestor('Group');
        if (chipGroup && chipGroup.getAttr('chipType') === 'meander') {
            channel.stroke(channelFillColor);
        } else if (channel instanceof Konva.Path) {
            channel.fill(channelFillColor);
        }
    });
    layer.find('.internalSegmentFill').forEach(segment => {
        segment.stroke(channelFillColor);
    });
    // Remove old highlight junction dots
    layer.find('.highlight-junction-dot').forEach(dot => {
        dot.destroy();
    });

    // 2. Identify Start (Pump) Ports
    const pumpPorts = new Set();
    console.log("[Port Check] Starting port identification...");
    stage.find('.connectionPort').forEach(port => {
        const mainGroupId = port.getAttr('mainGroupId');
        if (!mainGroupId) { return; }
        const mainGroup = stage.findOne('#' + mainGroupId);
        if (!mainGroup) { return; }
        const groupType = mainGroup.getAttr('chipType');
        if (groupType === 'pump') {
            console.log(`[Port Check] -> ADDING Pump Port: ${port.id()}`);
            pumpPorts.add(port.id());
        }
    });
    console.log(`[Port Check] Finished identification. Final pumpPorts size: ${pumpPorts.size}`);
    if (pumpPorts.size === 0) {
        console.log("No initialized pump ports found.");
        layer.draw();
        return;
    }

    // 3. Build Adjacency List (adj) from connections
    // ... (adjacency list build remains the same) ...
    const adj = {};
    const addInternalEdge = (u, v) => {
        if (!adj[u]) adj[u] = [];
        if (!adj[v]) adj[v] = [];
        if (!adj[u].includes(v)) adj[u].push(v);
        if (!adj[v].includes(u)) adj[v].push(u);
    };
    connections.forEach(conn => {
        const port1Id = conn.fromPort;
        const port2Id = conn.toPort;
        const group1 = stage.findOne('#' + conn.fromChip);
        const group2 = stage.findOne('#' + conn.toChip);
        if (!group1 || !group2) { return; }
        const type1 = group1.getAttr('chipType');
        const type2 = group2.getAttr('chipType');
        let addForward = true;
        let addReverse = true;
        if (type2 === 'outlet') { addReverse = false; }
        if (type1 === 'outlet') { addForward = false; }
        if (addForward) {
            if (!adj[port1Id]) adj[port1Id] = [];
            if (!adj[port1Id].includes(port2Id)) adj[port1Id].push(port2Id);
        }
        if (addReverse) {
            if (!adj[port2Id]) adj[port2Id] = [];
            if (!adj[port2Id].includes(port1Id)) adj[port2Id].push(port1Id);
        }
    });
    layer.getChildren().forEach(group => {
        if (group instanceof Konva.Group && group.draggable()) {
            const groupType = group.getAttr('chipType');
            const chip = group;
            const internalConns = chip.getAttr('internalConnections') || [];
            if (groupType === 'straight' || groupType === 'meander') {
                internalConns.forEach(pair => { if (pair.length === 2 && pair[0] && pair[1]) { addInternalEdge(pair[0], pair[1]); } });
            } else if (groupType === 't-type' || groupType === 'x-type') {
                const internalNodeId = getInternalNodeId(chip.id());
                if (!adj[internalNodeId]) adj[internalNodeId] = [];
                const portIds = chip.find('.connectionPort').map(p => p.id());
                portIds.forEach(portId => { if (portId) { addInternalEdge(portId, internalNodeId); } });
            }
        }
    });
    console.log("[Adj Build] Finished. Final Adjacency List:", adj);

    // 4. Perform BFS from all Pump Ports to find reachable elements
    const queue = [];
    const visitedPorts = new Set();
    const elementsToHighlight = new Set(); // IDs of segments/tubes
    const highlightedChipJunctions = new Set(); // <<< NEW: Store chip IDs of highlighted T/X junctions

    pumpPorts.forEach(startPortId => {
        if (!visitedPorts.has(startPortId)) {
            queue.push(startPortId);
            visitedPorts.add(startPortId);
        }
    });

    // --- REVISED BFS LOGIC ---
    while (queue.length > 0) {
        const currentId = queue.shift();
        const neighbors = adj[currentId] || [];

        neighbors.forEach(neighborId => {
            // --- Determine the connecting element ID first ---
            let elementIdToHighlight = null;
            const conn = connections.find(c => (c.fromPort === currentId && c.toPort === neighborId) || (c.toPort === currentId && c.fromPort === neighborId));

            if (conn) { // External tube connection
                elementIdToHighlight = conn.lineId + '_tube';
            } else { // Internal chip connection
                // Need to figure out if current or neighbor is the internal node ID
                const isCurrentInternal = currentId.includes('_internal');
                const isNeighborInternal = neighborId.includes('_internal');
                let externalPortId;
                let internalNodeId;

                if (isCurrentInternal && !isNeighborInternal) {
                    externalPortId = neighborId;
                    internalNodeId = currentId;
                } else if (!isCurrentInternal && isNeighborInternal) {
                    externalPortId = currentId;
                    internalNodeId = neighborId;
                } else if (!isCurrentInternal && !isNeighborInternal) {
                    // This case handles straight/meander internal connections
                    externalPortId = currentId; // Or neighborId, doesn't matter for finding the chip
                    internalNodeId = null; // Signifies not T/X type for segment ID calc below
                } else {
                    // This case should ideally not happen if adj list is correct
                    console.warn(`[FlowViz BFS - Revised] Unexpected internal node pairing: ${currentId} <-> ${neighborId}`);
                    externalPortId = currentId; // Fallback
                    internalNodeId = null;
                }

                // Find the chip group via the external port ID
                const portShape = stage.findOne('#' + externalPortId);
                const chipGroupId = portShape?.getAttr('mainGroupId');
                const chipGroup = chipGroupId ? stage.findOne('#' + chipGroupId) : null;
                const chipType = chipGroup?.getAttr('chipType');

                if (chipType === 'straight' || chipType === 'meander') {
                    // Highlight the single internal channel fill line using the chip's ID
                    if (chipGroupId) {
                        elementIdToHighlight = chipGroupId + '_internalChannelFill';
                    } else {
                        console.warn(`[FlowViz BFS - Revised] Could not find chip group ID for ${chipType} segment: ${currentId} <-> ${neighborId}`);
                    }
                } else if (chipType === 't-type' || chipType === 'x-type') {
                    // Must have identified an internal node ID for T/X types
                    if (internalNodeId && externalPortId && chipGroupId) {
                        elementIdToHighlight = getSegmentId(externalPortId, internalNodeId);
                        highlightedChipJunctions.add(chipGroupId); // Keep track of highlighted junctions
                    } else {
                        console.warn(`[FlowViz BFS - Revised] Could not identify parts for T/X segment: ${currentId} <-> ${neighborId} (Internal: ${internalNodeId}, External: ${externalPortId}, Chip: ${chipGroupId})`);
                    }
                }
                // Ignore other chip types (pump, outlet) as they have no internal segments to highlight here
            }

            // --- Add the determined element to the highlight set ---
            if (elementIdToHighlight) {
                elementsToHighlight.add(elementIdToHighlight);
            } else {
                // Only log warning if it wasn't an expected non-highlightable connection (e.g., pump port to nothing external)
                // Avoid logging for the expected case where an internal node connects back to an already-processed external port, as the segment is handled when traversing *to* the internal node.
                // Only truly warn if no element could be determined when one was expected.
                if (!conn && !currentId.includes('_internal') && !neighborId.includes('_internal') && !(chipGroup?.getAttr('chipType') === 'pump' || chipGroup?.getAttr('chipType') === 'outlet')) {
                    // This condition is complex, might need refinement. Aims to catch unexpected misses.
                    console.warn(`[FlowViz BFS - Revised] Could not determine element ID between ${currentId} and ${neighborId}`);
                }
            }

            // --- Now, handle queueing and visited status ---
            if (!visitedPorts.has(neighborId)) {
                // Check if the neighbor is an outlet port - do not add outlets to queue
                const neighborPortShape = stage.findOne('#' + neighborId);
                const neighborMainGroupId = neighborPortShape?.getAttr('mainGroupId');
                const neighborGroup = neighborMainGroupId ? stage.findOne('#' + neighborMainGroupId) : null;
                const neighborChipType = neighborGroup?.getAttr('chipType');

                if (neighborChipType !== 'outlet') {
                    visitedPorts.add(neighborId);
                    queue.push(neighborId);
                } else {
                    visitedPorts.add(neighborId); // Mark outlet as visited so we don't try to process it again
                    console.log(`[FlowViz BFS - Revised] Reached outlet ${neighborId}. Stopping path here.`);
                }
            }
        });
    }
    // --- END REVISED BFS LOGIC ---

    // 5. Apply Highlights
    if (elementsToHighlight.size > 0) {
        console.log("Highlighting elements:", elementsToHighlight);

        elementsToHighlight.forEach(elementId => {
            if (elementId.endsWith('_tube')) {
                const tube = layer.findOne('#' + elementId);
                if (tube) tube.stroke(flowHighlightColor);
            } else if (elementId.endsWith('_internalChannelFill')) {
                const chipGroupId = elementId.replace('_internalChannelFill', '');
                const chipGroup = layer.findOne('#' + chipGroupId);
                if (chipGroup) {
                    const channelFillElement = chipGroup.findOne('.internalChannelFill'); // Found by name
                    if (channelFillElement) {
                        const chipType = chipGroup.getAttr('chipType');
                        // Apply stroke highlight to both meander and straight (which are now lines)
                        if (chipType === 'meander' || chipType === 'straight') {
                             channelFillElement.stroke(flowHighlightColor);
                        } else {
                            // If other types ever use this naming, handle here (currently none do)
                            console.warn(`[Highlight] Unexpected chip type '${chipType}' using '_internalChannelFill' ID: ${elementId}`);
                        }
                    } else {
                        console.warn(`[Highlight] Could not find '.internalChannelFill' element in group ${chipGroupId}`);
                    }
                } else {
                    console.warn(`[Highlight] Could not find group ${chipGroupId} for element ${elementId}`);
                }
            } else {
                const segmentLine = layer.findOne('#' + elementId);
                if (segmentLine && segmentLine.name() === 'internalSegmentFill') {
                    segmentLine.stroke(flowHighlightColor);
                }
            }
        });
    } else {
        console.log("Nothing reachable from pump ports to highlight.");
    }

    layer.draw(); // Draw changes
}

// --- Utility function to calculate tubing resistance ---
function calculateTubingResistance(lengthInPixels) {
    if (lengthInPixels <= 0) return 0;
    const lengthInMeters = lengthInPixels * PIXEL_TO_METER_SCALE;
    // R = (8 * mu * L) / (pi * r^4) = POISEUILLE_CONSTANT * L
    return POISEUILLE_CONSTANT * lengthInMeters;
}

// --- Stage Click Listener for Component Selection --- //
stage.on('click tap', function (e) {
    // If click is on the stage background, deselect
    if (e.target === stage) {
        // Deselect previously selected canvas component visually
        if (selectedComponent && selectedComponent instanceof Konva.Group) {
            const border = selectedComponent.findOne('.component-border');
            if (border) {
                // --- MODIFICATION: Treat pump like outlet on deselection ---
                const type = selectedComponent.getAttr('chipType');
                if (type === 'outlet' || type === 'pump') { // Check for pump OR outlet
                    border.stroke(null); border.strokeWidth(0);
                } else {
                    border.stroke(chipStroke); border.strokeWidth(1);
                }
                // --- END MODIFICATION ---
            }
        }
        // Logically deselect (whether it was canvas or palette)
        selectedComponent = null;
        updatePropertiesPanel(); // Clear the properties panel

        // --- NEW: Hide the selected component box --- //
        const selectedBox = document.querySelector('.selected-component-box');
        if (selectedBox) selectedBox.style.display = 'none';
        // --- END NEW --- //

        layer.draw(); // Redraw the layer to show the visual deselection
        return; // Stop processing further
    }

    // Find the parent group that is draggable (our main component)
    let componentGroup = e.target.findAncestor('Group', true);
    // If clicked directly on group, target is the group
    if (e.target instanceof Konva.Group && e.target.draggable()) {
        componentGroup = e.target;
    }

    // If we found a draggable group (chip/pump/outlet)
    if (componentGroup && componentGroup.draggable()) {
        if (componentGroup !== selectedComponent) {
             // --- Deselect previous --- //
             if (selectedComponent && selectedComponent instanceof Konva.Group) {
                 const oldBorder = selectedComponent.findOne('.component-border');
                 if (oldBorder) {
                     // --- MODIFICATION: Treat pump like outlet on deselection ---
                     const oldType = selectedComponent.getAttr('chipType');
                     if (oldType === 'outlet' || oldType === 'pump') { // Check for pump OR outlet
                         oldBorder.stroke(null); oldBorder.strokeWidth(0);
                     } else {
                         oldBorder.stroke(chipStroke); oldBorder.strokeWidth(1);
                     }
                     // --- END MODIFICATION ---
                 }
             }
             // No visual deselection needed if previous was a palette item

             // --- Select new (Canvas Component) --- //
             selectedComponent = componentGroup;
             updatePropertiesPanel();

             // --- NEW: Show the selected component box --- //
             const selectedBox = document.querySelector('.selected-component-box');
             if (selectedBox) selectedBox.style.display = 'flex'; // Use flex as defined for .sidebar-box
             // --- END NEW --- //

             const newBorder = selectedComponent.findOne('.component-border');
             if (newBorder) {
                 newBorder.stroke('blue'); // Highlight selected
                 newBorder.strokeWidth(2); // Make highlight slightly thicker
             }

            layer.draw();
        }
        // If clicked the same component again, do nothing (it's already selected)
    }
    // If clicked something non-selectable inside the stage, do nothing
});

// --- Component List Logic ---

// --- Fluid Simulation Engine --- //

// Structure to hold the calculated simulation results
let simulationResults = {
    pressures: {}, // { nodeId: pressureInPascals }
    flows: {}      // { segmentId: { flow: flowRateInM3ps, from: nodeId, to: nodeId } }
};

// Helper to generate a unique ID for internal chip nodes
function getInternalNodeId(chipId) {
    return `${chipId}_internal`;
}

// Helper to generate a unique ID for segments (tubes or internal chip paths)
function getSegmentId(nodeId1, nodeId2) {
    // Ensure consistent order for the segment ID
    return [nodeId1, nodeId2].sort().join('--');
}

function buildNetworkGraph() {
    console.log("Building network graph...");
    const graph = {
        nodes: {},      // { nodeId: { type: 'pump'/'outlet'/'internal'/'junction', pressure?: knownPressurePa } }
        segments: {},   // { segmentId: { resistance: R, node1: id1, node2: id2 } }
        adj: {}         // Adjacency list { nodeId: [neighborId1, ...] }
    };

    const addSegment = (id1, id2, resistance) => {
        const segmentId = getSegmentId(id1, id2);
        // Ensure resistance is positive and finite
        if (!resistance || resistance <= 0 || !isFinite(resistance)) {
             console.warn(`Skipping segment ${segmentId} due to invalid resistance: ${resistance}`);
             // Still add nodes to adjacency list even if segment is invalid, helps find isolated parts
             graph.adj[id1] = graph.adj[id1] || [];
             graph.adj[id2] = graph.adj[id2] || [];
             if (!graph.adj[id1].includes(id2)) graph.adj[id1].push(id2);
             if (!graph.adj[id2].includes(id1)) graph.adj[id2].push(id1);
             return;
        }
        graph.segments[segmentId] = { resistance: resistance, node1: id1, node2: id2 };

        // Update adjacency list (undirected for resistance network)
        graph.adj[id1] = graph.adj[id1] || [];
        graph.adj[id2] = graph.adj[id2] || [];
        if (!graph.adj[id1].includes(id2)) graph.adj[id1].push(id2);
        if (!graph.adj[id2].includes(id1)) graph.adj[id2].push(id1);
    };

    // 1. Process all draggable components (Chips, Pumps, Outlets)
    layer.find('Group').forEach(group => {
        if (!group.draggable() || !group.id()) return; // Skip non-components or previews

        const chipId = group.id();
        const chipType = group.getAttr('chipType');
        const chipResistance = group.getAttr('resistance'); // For simple chips

        // Process each connection port on the component
        group.find('.connectionPort').forEach(port => {
            const portId = port.id();
            if (!portId) return;

            // Add node to graph
            if (!graph.nodes[portId]) {
                graph.nodes[portId] = { type: 'port' }; // Default type
            }
            graph.adj[portId] = graph.adj[portId] || []; // Ensure adj entry exists

            // Set known pressures for pumps and outlets
    if (chipType === 'pump') {
                graph.nodes[portId].type = 'pump';
                const pressuresPa = group.getAttr('portPressures') || {};
                // Default 0 Pa if explicitly undefined OR not present
                graph.nodes[portId].pressure = pressuresPa[portId] === undefined ? 0 : pressuresPa[portId];
                 console.log(`[GraphBuild] Pump Port ${portId} Pressure: ${graph.nodes[portId].pressure} Pa`); // Debug
    } else if (chipType === 'outlet') {
                graph.nodes[portId].type = 'outlet';
                graph.nodes[portId].pressure = 0; // Outlets are at 0 Pa relative pressure
                 console.log(`[GraphBuild] Outlet Port ${portId} Pressure: 0 Pa`); // Debug
            }
        });

        // 2. Add Internal Segments based on Chip Type
        const internalConns = group.getAttr('internalConnections');
        if (internalConns) {
            if (chipType === 'straight' || chipType === 'meander') {
                // Simple connection between the two ports with chip resistance
                if (internalConns.length === 1 && internalConns[0].length === 2 && chipResistance) {
                     console.log(`[GraphBuild] Adding internal segment for ${chipId}: ${internalConns[0][0]} <-> ${internalConns[0][1]} (R=${chipResistance})`);
                    addSegment(internalConns[0][0], internalConns[0][1], chipResistance);
    } else {
                    console.warn(`Invalid internal connection/resistance for ${chipType} chip ${chipId}`);
                }
            } else if (chipType === 't-type' || chipType === 'x-type') {
                // These require an internal junction node
                const internalNodeId = getInternalNodeId(chipId);
                 console.log(`[GraphBuild] Creating internal node ${internalNodeId} for ${chipType} chip ${chipId}`);
                graph.nodes[internalNodeId] = { type: 'junction' };
                graph.adj[internalNodeId] = []; // Initialize adjacency for internal node

                // Assume chipResistance is PER SEGMENT for T/X types (simplification)
                // Use a large default if resistance attribute is missing
                const segmentResistance = chipResistance || 1e12; // High default resistance
                if (!chipResistance) {
                     console.warn(`Resistance attribute missing for ${chipType} chip ${chipId}, using default ${segmentResistance}`);
                }

                const portIds = group.find('.connectionPort').map(p => p.id());
                portIds.forEach(portId => {
                    if (portId && graph.nodes[portId]) { // Ensure port exists
                         console.log(`[GraphBuild] Adding internal segment for ${chipId}: ${portId} <-> ${internalNodeId} (R=${segmentResistance})`);
                        addSegment(portId, internalNodeId, segmentResistance);
                    } else {
                         console.warn(`[GraphBuild] Skipping internal segment for ${chipId}: Invalid portId ${portId}`);
                    }
                });
            } // Pumps/Outlets don't have internal connections in this model
        }
    });

    // 3. Add External Tubing Segments
    connections.forEach(conn => {
        // Ensure ports exist in the graph nodes list before adding segment
        if (!graph.nodes[conn.fromPort] || !graph.nodes[conn.toPort]) {
             console.warn(`[GraphBuild] Skipping connection ${conn.lineId} - port node missing: From=${!!graph.nodes[conn.fromPort]}, To=${!!graph.nodes[conn.toPort]}`);
             return;
        }
         console.log(`[GraphBuild] Adding external tube segment ${conn.lineId}: ${conn.fromPort} <-> ${conn.toPort} (R=${conn.resistance})`);
        addSegment(conn.fromPort, conn.toPort, conn.resistance);
    });

    console.log("Network graph built:", graph);
    return graph;
}

function solvePressures(graph) {
    console.log("Solving for pressures...");
    const nodeIds = Object.keys(graph.nodes);
    const unknownNodeIds = nodeIds.filter(id => graph.nodes[id].pressure === undefined);
    // const knownNodeIds = nodeIds.filter(id => graph.nodes[id].pressure !== undefined);

    if (unknownNodeIds.length === 0) {
        console.log("No unknown pressures to solve. All nodes have known pressures.");
        // Create a pressure map directly from graph.nodes
        const pressures = {};
        nodeIds.forEach(id => { pressures[id] = { ...graph.nodes[id] }; }); // Return node objects with pressure
        return pressures;
    }
    if (Object.keys(graph.segments).length === 0 && unknownNodeIds.length > 0) {
        console.warn("Cannot solve: No segments defined in the graph, but unknown nodes exist.");
        alert("Cannot solve: No connections found.")
        return null;
    }

    const n = unknownNodeIds.length;
    const nodeIndexMap = new Map(unknownNodeIds.map((id, i) => [id, i]));
    console.log("Unknown nodes:", unknownNodeIds);
    console.log("Node index map:", nodeIndexMap);

    // Initialize matrices A (conductance) and B (current sources)
    const A = math.zeros(n, n);
    const B = math.zeros(n);

    // Build the matrices based on KCL for each unknown node
    unknownNodeIds.forEach((nodeId, i) => {
        let diagSum = 0;
        const neighbors = graph.adj[nodeId] || [];
        if (neighbors.length === 0 && !graph.nodes[nodeId].pressure) { // Check if it truly is isolated and unknown
             console.warn(`Node ${nodeId} has no neighbors and unknown pressure. System might be ill-conditioned.`);
             // Setting diag to 1 and B to 0 forces pressure to 0 for this isolated node
             // This prevents NaN/Infinity issues later but might hide modeling errors.
             A.set([i, i], 1);
             B.set([i], 0);
             return; // Skip KCL for this isolated node
        }
        neighbors.forEach(neighborId => {
            const segmentId = getSegmentId(nodeId, neighborId);
            const segment = graph.segments[segmentId];
            // Check if the segment exists (it might have been skipped due to bad resistance)
            if (!segment) {
                return; // Skip if segment doesn't exist
            }
            const conductance = 1.0 / segment.resistance;
            diagSum += conductance;

            if (graph.nodes[neighborId]?.pressure !== undefined) {
                // Known pressure neighbor - contributes to B vector
                const knownPressure = graph.nodes[neighborId].pressure;
                B.set([i], B.get([i]) + conductance * knownPressure);
        } else {
                // Unknown pressure neighbor - contributes to A matrix (off-diagonal)
                const j = nodeIndexMap.get(neighborId);
                if (j !== undefined) {
                    A.set([i, j], A.get([i, j]) - conductance);
                } else {
                     console.warn(` Neighbor ${neighborId} of ${nodeId} is unknown but not in index map.`);
                }
            }
        });
        // Set diagonal element of A matrix only if it wasn't set for isolation
         if (neighbors.length > 0 || graph.nodes[nodeId].pressure !== undefined) {
             A.set([i, i], diagSum);
         }
    });

    console.log("Matrix A:", A.toArray ? A.toArray() : A);
    console.log("Vector B:", B.toArray ? B.toArray() : B);

    // --- Check for zero rows/columns or zero diagonal elements in A --- //
    let matrixOk = true;
    for (let i = 0; i < n; i++) {
        if (math.abs(A.get([i, i])) < 1e-15) { // Check diagonal element
             console.error(`Matrix A has near-zero diagonal at index ${i} (Node: ${unknownNodeIds[i]}). System may be singular (check for isolated nodes/networks).`);
             matrixOk = false;
             break;
        }
    }

    if (!matrixOk) {
         alert("Failed to solve: Network appears to have isolated parts or errors (zero diagonal in matrix). Please check connections.");
         return null;
    }
    // --- End Matrix Check --- //

    // Solve Ax = B for x (the unknown pressures)
    let solvedPressuresVector;
    try {
        const lu = math.lup(A);
        solvedPressuresVector = math.lusolve(lu, B);
        console.log("Solved pressures vector:", solvedPressuresVector.toArray ? solvedPressuresVector.toArray() : solvedPressuresVector);
    } catch (error) {
        console.error("Error solving linear system with math.lusolve:", error);
        if (error.message && error.message.includes("singular")) {
            alert("Failed to solve: The network configuration seems unstable or disconnected (singular matrix). Please check connections, especially to outlets.");
        } else {
            alert("An error occurred during the simulation calculation. Check console for details.");
        }
        return null; // Indicate failure
    }

    // Update the graph nodes with solved pressures
    const allPressures = {};
    nodeIds.forEach(id => { // Initialize with all nodes
        allPressures[id] = { ...graph.nodes[id] }; // Copy node info
    });
    unknownNodeIds.forEach((nodeId, i) => {
        let pressureValue = solvedPressuresVector.get([i, 0]);
        if (typeof pressureValue === 'object' && pressureValue.isComplex) {
             console.warn(`Node ${nodeId} solved pressure is complex: ${pressureValue}. Using real part.`);
             pressureValue = pressureValue.re;
        }
        if (!isFinite(pressureValue)) {
             console.error(`Node ${nodeId} solved pressure is not finite: ${pressureValue}. Setting to NaN.`);
             pressureValue = NaN;
        }
        allPressures[nodeId].pressure = pressureValue;
    });

    console.log("All node pressures calculated:", allPressures);
    return allPressures;
}


function calculateFlows(graph, pressures) {
    console.log("Calculating flows...");
    const flows = {};
    if (!pressures) {
        console.error("Cannot calculate flows: pressures object is null.");
        return {};
    }
    for (const segmentId in graph.segments) {
        const segment = graph.segments[segmentId];
        const node1Id = segment.node1;
        const node2Id = segment.node2;

        const p1Node = pressures[node1Id];
        const p2Node = pressures[node2Id];

        if (p1Node?.pressure === undefined || p2Node?.pressure === undefined) {
            console.warn(`Cannot calculate flow for segment ${segmentId}: Missing pressure for node ${p1Node?.pressure === undefined ? node1Id : node2Id}.`);
            continue;
        }

        const p1 = p1Node.pressure;
        const p2 = p2Node.pressure;

        if (!isFinite(p1) || !isFinite(p2)) {
            console.warn(`Cannot calculate flow for segment ${segmentId}: Non-finite pressure (P1=${p1}, P2=${p2}).`);
             flows[segmentId] = {
                 flow: NaN,
                 from: node1Id,
                 to: node2Id
             };
            continue;
        }

        const deltaP = p1 - p2;
        const resistance = segment.resistance;
        // Avoid division by zero if resistance is somehow invalid here
        if(resistance === 0) {
            console.warn(`Segment ${segmentId} has zero resistance. Flow calculation skipped.`);
             flows[segmentId] = {
                 flow: NaN, // Or Infinity? NaN seems safer.
                 from: node1Id,
                 to: node2Id
             };
             continue;
        }
        const flowRate = deltaP / resistance; // Q = (P1 - P2) / R

        flows[segmentId] = {
            flow: flowRate,
            from: flowRate >= 0 ? node1Id : node2Id,
            to: flowRate >= 0 ? node2Id : node1Id
        };
    }
    console.log("Calculated flows:", flows);
    return flows;
}

function runFluidSimulation() {
    console.log("--- Starting Fluid Simulation ---");
    clearSimulationVisuals(); // Clear previous results first

    const graph = buildNetworkGraph();
    if (!graph || Object.keys(graph.nodes).length === 0) {
        console.error("Failed to build network graph or graph is empty.");
        alert("Network graph could not be built. Add components and connections.");
        return;
    }
    const hasKnownPressure = Object.values(graph.nodes).some(node => node.pressure !== undefined);
    if (!hasKnownPressure) {
        console.error("Simulation requires at least one pump pressure set or an outlet.");
        alert("Simulation requires at least one pump pressure to be set or an outlet to be present.");
        return;
    }

    const solvedPressures = solvePressures(graph);
    if (!solvedPressures) {
        console.error("Failed to solve for pressures.");
        // Alert already shown in solvePressures if it fails
        return;
    }

    const calculatedFlows = calculateFlows(graph, solvedPressures);

    // Store results (only the pressure value)
    simulationResults.pressures = {};
    for(const nodeId in solvedPressures) {
        if (solvedPressures[nodeId]?.pressure !== undefined) {
             simulationResults.pressures[nodeId] = solvedPressures[nodeId].pressure;
        }
    }
    simulationResults.flows = calculatedFlows;

    console.log("--- Simulation Complete ---");
    console.log("Final Pressures (Pa):", simulationResults.pressures);
    console.log("Final Flows (m³/s):", simulationResults.flows);

    visualizeSimulationResults(); // Visualize the results

    // --- NEW: Button Feedback --- //
    const simButton = document.getElementById('run-simulation-btn');
    if (simButton) {
        const originalText = simButton.textContent;
        const originalBgColor = simButton.style.backgroundColor; // Get original inline style if any
        const originalCssBgColor = window.getComputedStyle(simButton).backgroundColor; // Get computed style

        simButton.textContent = '✓ Complete';
        simButton.style.backgroundColor = '#28a745'; // Success green

             setTimeout(() => {
            simButton.textContent = originalText;
            // Restore original background color more robustly
            simButton.style.backgroundColor = originalBgColor || ''; // Reset inline style or set to original inline
            // If there was no inline style, CSS rule will take over. If there was, restore it.
        }, 1500); // Revert after 1.5 seconds
    }
    // --- END NEW --- //

    // REMOVED: alert("Simulation complete! Visualization updated. Check console for detailed results.");
}

// --- Visualization Functions --- //

function clearSimulationVisuals() {
    // Clear all simulation-related visuals including dots
    layer.find('.simulation-label').forEach(label => {
        label.destroy();
    });

    // Explicitly find and remove port dots (orange simulation dots)
    layer.find('.port-dot').forEach(dot => {
        dot.destroy();
    });

    // --- NEW: Hide blue connection dots --- //
    layer.find('.connectionPort').forEach(port => {
        port.visible(false);
    });
    // --- END NEW --- //

    // Reset tube colors
    layer.find('._tube').forEach(tube => {
        tube.stroke('lightgrey');
        const outline = layer.findOne('#' + tube.id().replace('_tube', '_outline'));
        if(outline) outline.stroke('#555555');
    });

    // Reset internal channel colors
    layer.find('.internalChannelFill').forEach(channel => {
        const chipGroup = channel.findAncestor('Group');
        if (chipGroup && chipGroup.getAttr('chipType') === 'meander') {
            channel.stroke(channelFillColor);
        } else if (channel instanceof Konva.Path) {
            channel.fill(channelFillColor);
        }
    });

    // Reset internal segment colors
    layer.find('.internalSegmentFill').forEach(segmentLine => {
        segmentLine.stroke(channelFillColor);
    });

    // Hide the simulation summary box
    const summaryBox = document.getElementById('simulation-summary-box');
    if (summaryBox) {
        summaryBox.style.display = 'none';
    }

    layer.draw();
}

function getRelativeFlowColor(flowRateUlMin, maxFlowUlMin) {
    // Define the color gradient points with more stops for better visualization
    const colorStops = [
        { norm: 0, color: '#e0e0e0' },    // No flow - light gray
        { norm: 0.1, color: '#a0d8ef' },  // Very low flow - light blue
        { norm: 0.3, color: '#4dabf7' },  // Low flow - medium blue
        { norm: 0.5, color: '#1c7ed6' },  // Medium flow - blue
        { norm: 0.7, color: '#1864ab' },  // High flow - dark blue
        { norm: 0.9, color: '#0c4b8e' },  // Very high flow - darker blue
        { norm: 1.0, color: '#003366' }   // Max flow - darkest blue
    ];

    // Handle zero or near-zero max flow
    if (maxFlowUlMin <= 1e-9) {
        return colorStops[0].color; // Return 'no flow' color
    }

    // Calculate normalized flow (0 to 1) with logarithmic scaling for better visualization
    const normalizedFlow = Math.min(1, Math.max(0, Math.abs(flowRateUlMin) / maxFlowUlMin));

    // Find the two stops the normalized flow falls between
    for (let i = 0; i < colorStops.length - 1; i++) {
        if (normalizedFlow <= colorStops[i + 1].norm) {
            const lowerStop = colorStops[i];
            const upperStop = colorStops[i + 1];
            // Interpolate between the two stops
            const t = (normalizedFlow - lowerStop.norm) / (upperStop.norm - lowerStop.norm);
            // Ensure t is valid even with floating point inaccuracies near boundaries
            const factor = Math.max(0, Math.min(1, t));
            return interpolateColor(lowerStop.color, upperStop.color, factor);
        }
    }

    // If flow exceeds max (shouldn't happen with clamping), return max color
    return colorStops[colorStops.length - 1].color;
}

// Helper function to interpolate between two hex colors
function interpolateColor(color1, color2, factor) {
    // Convert hex to RGB
    const r1 = parseInt(color1.substring(1, 3), 16);
    const g1 = parseInt(color1.substring(3, 5), 16);
    const b1 = parseInt(color1.substring(5, 7), 16);

    const r2 = parseInt(color2.substring(1, 3), 16);
    const g2 = parseInt(color2.substring(3, 5), 16);
    const b2 = parseInt(color2.substring(5, 7), 16);

    // Interpolate
    const r = Math.round(r1 + (r2 - r1) * factor);
    const g = Math.round(g1 + (g2 - g1) * factor);
    const b = Math.round(b1 + (b2 - b1) * factor);

    // Convert back to hex
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function visualizeSimulationResults() {
    console.log("Visualizing simulation results...");
    // clearSimulationVisuals() is called at the start of runFluidSimulation

    // REMOVED Redundant hiding logic - should happen in clearSimulationVisuals
    // layer.find('.connectionPort').forEach(port => {
    //     port.visible(false);  // Hide the blue connection dots
    // });

    const { pressures, flows } = simulationResults;
    const mbarToPascal = 100;
    const microLitersPerMinuteFactor = 6e+7;

    // --- Calculate Max Absolute Flow Rate ---
    let maxFlowUlMin = 0;
    for (const segmentId in flows) {
        const flowData = flows[segmentId];
        if (isFinite(flowData.flow)) {
            maxFlowUlMin = Math.max(maxFlowUlMin, Math.abs(flowData.flow * microLitersPerMinuteFactor));
        }
    }
    console.log("Maximum calculated flow rate (abs):", maxFlowUlMin, "µL/min");

    // 1. Visualize all flows (color channels and tubes using RELATIVE color)
    for (const segmentId in flows) {
        const flowData = flows[segmentId];
        const flowRateM3ps = flowData.flow;
        if (!isFinite(flowRateM3ps)) continue;

        const flowRateUlMin = flowRateM3ps * microLitersPerMinuteFactor;

        // --- Refactored Element Finding and Typing Logic ---
        let visualElement = null;
        let elementType = null; // 'tube', 'straight-channel', 'meander-channel', 'tx-segment'

        // Try finding internal T/X segment line first
        visualElement = layer.findOne('#' + segmentId);
        if (visualElement && visualElement.name() === 'internalSegmentFill') {
            elementType = 'tx-segment';
        }

        // Try finding external tube
        if (!visualElement) {
            const nodeIds = segmentId.split('--');
            if (nodeIds.length === 2) {
                const conn = connections.find(c => (c.fromPort === nodeIds[0] && c.toPort === nodeIds[1]) || (c.fromPort === nodeIds[1] && c.toPort === nodeIds[0]));
                if (conn) {
                    visualElement = layer.findOne('#' + conn.lineId + '_tube');
                    if (visualElement) elementType = 'tube';
                }
            }
        }

        // Try finding straight/meander internal channel
        if (!visualElement) {
            const nodeIds = segmentId.split('--');
            if (nodeIds.length === 2) {
                const portId = nodeIds[0]; // Use the first port ID from the segment
                const portShape = stage.findOne('#' + portId);

                if (portShape) {
                    const mainGroupId = portShape.getAttr('mainGroupId'); // Get the ID of the main chip group
                    if (mainGroupId) {
                        const chipGroup = stage.findOne('#' + mainGroupId); // Find the main chip group by its ID

                        if (chipGroup) {
                            const chipType = chipGroup.getAttr('chipType');
                            if (chipType === 'straight' || chipType === 'meander') {
                                // Find the channel fill element within the CORRECT chip group
                                visualElement = chipGroup.findOne('.internalChannelFill');
                                if (visualElement) {
                                    elementType = (chipType === 'straight') ? 'straight-channel' : 'meander-channel';

                                    // Ensure outline exists, but DO NOT change its Z-order here
                                    const outlineElement = chipGroup.findOne('.channelOutline');
                                    // if (outlineElement) {
                                    //     // No Z-order changes needed here - rely on creation order
                                    // }
                                } else {
                                    console.warn(`[Visualize] Found ${chipType} chip ${mainGroupId} but could not find .internalChannelFill`);
                                }
                            } // else: chipType is not straight or meander
                        } else {
                            console.warn(`[Visualize] Could not find chip group with ID: ${mainGroupId}`);
                        }
                    } else {
                         console.warn(`[Visualize] Port ${portId} is missing mainGroupId attribute.`);
                    }
                } else {
                     console.warn(`[Visualize] Could not find port shape with ID: ${portId}`);
                }
            }
        }
        // --- End Refactored Element Finding ---

        // --- Apply colors based on elementType and flow rate ---
        if (visualElement) {
            // Determine color based on flow (or base color if flow is negligible)
            const flowColor = (Math.abs(flowRateM3ps) > 1e-15)
                              ? getRelativeFlowColor(flowRateUlMin, maxFlowUlMin)
                              : getRelativeFlowColor(0, maxFlowUlMin); // Base color for zero/low flow

            console.log(`Applying color ${flowColor} to ${elementType} for flow ${flowRateUlMin.toFixed(2)} µL/min`);

            switch (elementType) {
                case 'tube':
                    // Apply to stroke for tubes
                    visualElement.stroke(flowColor);
                    // Keep tube outline gray
                    const outline = layer.findOne('#' + visualElement.id().replace('_tube', '_outline'));
                    if (outline) outline.stroke('#555555');
                    console.log(`[Debug Visualize] Tube ${visualElement.id()} stroke set to ${flowColor}`);
                    break;
                case 'meander-channel':
                    // For meander channels, we need to update the stroke color
                    if (visualElement instanceof Konva.Line) {
                        console.log(`[Debug Visualize] Meander ${segmentId}: Targeting element`, visualElement);
                        console.log(`[Debug Visualize] Meander ${segmentId}: Current stroke: ${visualElement.stroke()}`);
                        visualElement.stroke(flowColor);
                        console.log(`[Debug Visualize] Meander ${segmentId}: Attempted stroke set to ${flowColor}. New stroke: ${visualElement.stroke()}`);
                        // NO moveToTop() - rely on creation order
                    } else {
                        console.warn(`[Visualize] Expected Konva.Line for meander-channel ${segmentId}, got:`, visualElement);
                    }
                    break;
                case 'straight-channel':
                    // For straight channels (now lines), we update the stroke color
                    if (visualElement instanceof Konva.Line) { // Check for Line
                        console.log(`[Debug Visualize] Straight ${segmentId}: Targeting element`, visualElement);
                        console.log(`[Debug Visualize] Straight ${segmentId}: Current stroke: ${visualElement.stroke()}`); // Check stroke
                        visualElement.stroke(flowColor); // USE STROKE
                        console.log(`[Debug Visualize] Straight ${segmentId}: Attempted stroke set to ${flowColor}. New stroke: ${visualElement.stroke()}`); // Log stroke
                        // NO moveToTop() - rely on creation order
                    } else {
                        console.warn(`[Visualize] Expected Konva.Line for straight-channel ${segmentId}, got:`, visualElement); // Updated warning
                    }
                    break;
                case 'tx-segment':
                    // For T and X junction segments, update the stroke
                     console.log(`[Debug Visualize] TX Segment ${segmentId}: Targeting element`, visualElement);
                     console.log(`[Debug Visualize] TX Segment ${segmentId}: Current stroke: ${visualElement.stroke()}`);
                    visualElement.stroke(flowColor);
                     console.log(`[Debug Visualize] TX Segment ${segmentId}: Attempted stroke set to ${flowColor}. New stroke: ${visualElement.stroke()}`);
                    break;
                default:
                    console.warn(`[Visualize] Unknown element type for coloring: ${elementType}, segmentId: ${segmentId}`);
            }

            // Force a redraw of the element and its parent group
            visualElement.draw();
            const group = visualElement.getParent();
            if (group) group.draw();
        } else {
            // Only log if the flow is significant, otherwise missing elements might just be disconnected parts
            if (Math.abs(flowRateM3ps) > 1e-15) {
                console.warn(`[Visualize] Could not find visual element for segmentId: ${segmentId}`);
            }
        }
    }

    // 2. Move all external tube paths to the bottom
    connections.forEach(conn => {
        const tubePath = layer.findOne('#' + conn.lineId + '_tube');
        const outlinePath = layer.findOne('#' + conn.lineId + '_outline');
        if (tubePath) tubePath.moveToBottom();
        if (outlinePath) outlinePath.moveToBottom();
    });

    // Calculate simulation summary data
    let totalFlow = 0, simMaxFlow = 0, minPressure = Infinity, maxPressure = -Infinity, activeSegments = 0;
    Object.values(flows).forEach(flow => {
        if (isFinite(flow.flow)) {
            const absFlow = Math.abs(flow.flow);
            totalFlow += absFlow;
            simMaxFlow = Math.max(simMaxFlow, absFlow);
            activeSegments++;
        }
    });
    Object.values(pressures).forEach(pressure => {
        if (isFinite(pressure)) {
            minPressure = Math.min(minPressure, pressure);
            maxPressure = Math.max(maxPressure, pressure);
        }
    });

    // Update the simulation summary in the sidebar
    const summaryBox = document.getElementById('simulation-summary-box');
    const summaryContent = document.getElementById('simulation-summary-content');

    if (summaryBox && summaryContent) {
        // Show the summary box
        summaryBox.style.display = 'block';

        // --- MODIFIED: Update numerical summary content ---
        // Clear existing summary items first
        summaryContent.querySelectorAll('.summary-item, .simulation-description').forEach(item => item.remove()); // Also remove old description

        // Prepend the new summary items with improved structure
        const summaryHtml = `
            <div class="summary-item">
                <span class="summary-label">Active Segments:</span>
                <span class="summary-value">${activeSegments}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Max Flow:</span>
                <span class="summary-value">${(simMaxFlow * microLitersPerMinuteFactor).toFixed(2)} µL/min</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Pressure Range:</span>
                <span class="summary-value">${(minPressure / mbarToPascal).toFixed(1)} to ${(maxPressure / mbarToPascal).toFixed(1)} mbar</span>
            </div>
        `;
        summaryContent.insertAdjacentHTML('afterbegin', summaryHtml);

        // --- NEW: Add Simulation Description ---
        const descriptionHtml = `
            <div class="simulation-description">
                 <p>Steady-state pressure-driven flow simulation (laminar).</p>
            </div>
        `;
        // Append description after the legend (assuming legend is already in HTML)
        const legendElement = summaryContent.querySelector('.legend-container'); // Assuming legend has this wrapper class
        if (legendElement) {
            legendElement.insertAdjacentHTML('afterend', descriptionHtml);
        } else {
            // Fallback: Append to the end of the content if legend container not found
            summaryContent.insertAdjacentHTML('beforeend', descriptionHtml);
             console.warn("Could not find '.legend-container' to place description after. Appending to end.");
        }
        // --- END NEW ---


        // --- Update HTML Flow Legend (Assuming structure from CSS suggestion) --- //
        // Ensure your HTML for the legend looks something like this:
        /*
        <div class="legend-container">
            <div class="legend-title">Flow Rate (µL/min)</div>
            <div class="flow-legend">
                <div class="gradient-bar"></div>
                <div class="legend-labels">
                    <span class="max-label"></span> <!- Populated by JS ->
                    <span class="mid-label"></span> <!- Populated by JS ->
                    <span class="zero-label">0.00</span>
                </div>
            </div>
        </div>
        */
        const gradientBar = summaryContent.querySelector('.gradient-bar');
        const maxLabel = summaryContent.querySelector('.max-label');
        const midLabel = summaryContent.querySelector('.mid-label'); // Using mid label again

        if (gradientBar && maxLabel && midLabel) {
            // Update Gradient Bar Background
            const colorStop0 = getRelativeFlowColor(maxFlowUlMin * 1.0, maxFlowUlMin);
            const colorStop1 = getRelativeFlowColor(maxFlowUlMin * 0.9, maxFlowUlMin);
            const colorStop3 = getRelativeFlowColor(maxFlowUlMin * 0.7, maxFlowUlMin);
            const colorStop5 = getRelativeFlowColor(maxFlowUlMin * 0.5, maxFlowUlMin);
            const colorStop7 = getRelativeFlowColor(maxFlowUlMin * 0.3, maxFlowUlMin);
            const colorStop9 = getRelativeFlowColor(maxFlowUlMin * 0.1, maxFlowUlMin);
            const colorStop10 = getRelativeFlowColor(0, maxFlowUlMin);
            gradientBar.style.background = `linear-gradient(to bottom,
                ${colorStop0} 0%,
                ${colorStop1} 10%,
                ${colorStop3} 30%,
                ${colorStop5} 50%,
                ${colorStop7} 70%,
                ${colorStop9} 90%,
                ${colorStop10} 100%)`;

            // Update Labels
            const maxFlowText = maxFlowUlMin.toFixed(maxFlowUlMin >= 1 ? 1 : 2);
            const midFlowText = (maxFlowUlMin / 2).toFixed(maxFlowUlMin >= 2 ? 1 : 2);
            maxLabel.textContent = maxFlowText;
            midLabel.textContent = midFlowText; // Update mid label
            // Zero label is static HTML
        } else {
            console.error("Could not find all required HTML legend elements (.gradient-bar, .max-label, .mid-label) to update.");
        }
        // --- END Update HTML Flow Legend --- //

    } else {
        console.error("Simulation summary box or content container not found!");
    }

    // 4. Add/Update the dots
    layer.find('.connectionPort').forEach(port => {
        const portGroup = port.getParent();
        if (!portGroup) return;

        // Remove existing orange simulation dot for this port if it exists
        portGroup.find('.port-dot').forEach(dot => dot.destroy());

        // --- Check port details ---
        const portId = port.id();
        const mainGroupId = port.getAttr('mainGroupId');
        const componentGroup = stage.findOne('#' + mainGroupId);
        const componentType = componentGroup?.getAttr('chipType');
        const isPumpPort = (componentType === 'pump');
        const isOutletPort = (componentType === 'outlet');
        const isConnected = connections.some(conn => conn.fromPort === portId || conn.toPort === portId);
        const shouldAddOrangeDot = !isPumpPort || isConnected; // Add dot if it's NOT a pump OR if it IS a pump AND is connected

        if (shouldAddOrangeDot) { // Only add orange simulation dot if the condition is met
            const originalRadius = 4; // <<< Increased base radius
            const hoverRadius = 6; // <<< Increased hover radius

            const dot = new Konva.Circle({
                x: port.x(),
                y: port.y(),
                radius: originalRadius, // <<< Use original radius
                fill: '#FF5722',
                stroke: 'black', // <<< Changed stroke to black
                strokeWidth: 1, // <<< Adjusted stroke width to 1
                name: 'port-dot simulation-label',
                listening: true // Only listening for hover if the orange dot is present
            });

            // --- MODIFIED: Add hover effects ---
            dot.on('mouseover', () => {
                document.body.style.cursor = 'pointer';
                dot.radius(hoverRadius); // Enlarge dot
                layer.batchDraw(); // Redraw layer
                showNodeDetails(portId);
            });
            dot.on('mouseout', () => {
                document.body.style.cursor = 'default';
                dot.radius(originalRadius); // Reset dot size
                layer.batchDraw(); // Redraw layer
                hideNodeDetails();
            });
            // --- END MODIFICATION ---

            portGroup.add(dot);
            dot.moveToTop();
        }

        // --- NEW: Hide port visuals after simulation ---
        // Hide inner grey connection port ONLY for outlets and unconnected pump ports
        // if (isOutletPort || (isPumpPort && !isConnected)) {
        //     port.visible(false); // Hide inner connection circle
        // } else {
        //     // Ensure inner port is visible if it shouldn't be hidden
        //     port.visible(true);
        // } // REMOVED BLOCK END
        // The blue connectionPort dot should remain hidden after simulation,
        // as clearSimulationVisuals() already hid it. Only orange port-dots are shown.

    });

    // 5. Final draw (Konva layer)
    layer.draw();
    console.log("Visualization updated with relative colors. Legend updated in sidebar.");
}

// --- NEW: Function to Reset Simulation State --- //
function resetSimulationState() {
    console.log("Resetting simulation state...");

    // 1. Clear all simulation-specific visuals (colors, dots, legend, summary)
    clearSimulationVisuals();

    // 2. Reset the simulationResults object
    simulationResults = {
        pressures: {},
        flows: {}
    };

    // 3. Restore the initial connectivity highlighting (Pump Reachability)
    findFlowPathAndHighlight();

    // 4. Re-enable ports for interaction
    layer.find('.connectionPort').forEach(port => {
        const mainGroup = stage.findOne('#' + port.getAttr('mainGroupId'));
        const chipType = mainGroup?.getAttr('chipType');
        
        // Show blue connection dot only if:
        // - Not an outlet port
        // - Not connected to anything
        if (chipType !== 'outlet' && !isPortConnected(port.id())) {
            port.visible(true);
        }
    });

    // 5. Clear the properties panel if it's showing simulation data
    if (selectedComponent) {
        updatePropertiesPanel(); // Re-render properties without simulation data
    }

    // 6. Redraw the layer
    layer.draw();
    console.log("Simulation state reset.");
}

// Function to show details when a node is hovered
function showNodeDetails(nodeId) {
    // Remove any existing details panel
    hideNodeDetails();

    const { pressures, flows } = simulationResults;
    const mbarToPascal = 100;
    const microLitersPerMinuteFactor = 6e+7;

    // Get pressure at this node
    const pressurePa = pressures[nodeId];
    if (pressurePa === undefined || !isFinite(pressurePa)) {
        console.warn(`No valid pressure for node ${nodeId}`);
        return;
    }

    const pressureMbar = pressurePa / mbarToPascal;

    // Find the port shape and its parent component type
    const portShape = stage.findOne('#' + nodeId);
    if (!portShape) {
        console.warn(`Could not find port shape for node ${nodeId}`);
        return;
    }
    // --- CORRECTED LOGIC ---
    // Get the ID of the main draggable group from the port's attribute
    const mainComponentId = portShape.getAttr('mainGroupId');
    if (!mainComponentId) {
        console.error(`[showNodeDetails] Port ${nodeId} is missing the 'mainGroupId' attribute!`);
        return;
    }
    // Find the main component group using its ID
    const componentGroup = stage.findOne('#' + mainComponentId);
    if (!componentGroup) {
        console.error(`[showNodeDetails] Could not find main component group with ID: ${mainComponentId}`);
        return;
    }
    const componentType = componentGroup.getAttr('chipType'); // Get type from the correct group
    // --- END CORRECTED LOGIC ---

    // --- DEBUG LOGGING ---
    console.log(`[showNodeDetails] Hovered node: ${nodeId}`);
    console.log(`[showNodeDetails] Found main component group (ID: ${mainComponentId}):`, componentGroup); // Log the group object
    console.log(`[showNodeDetails] Determined componentType: ${componentType}`);
    // --- END DEBUG LOGGING ---


    // Calculate total absolute flow rate connected to the node
    let totalAbsoluteFlowM3ps = 0;
    for (const segmentId in flows) {
        const flowData = flows[segmentId]; // {flow, from, to}
        // Check if connected to nodeId AND flow is finite and significant
        if ((flowData.from === nodeId || flowData.to === nodeId) && isFinite(flowData.flow) && Math.abs(flowData.flow) > 1e-15) {
            totalAbsoluteFlowM3ps += Math.abs(flowData.flow);
        }
    }

    // Determine the correct flow value and label based on component type
    let displayFlowM3ps;
    let flowLabel;

    if (componentType === 'pump') {
        displayFlowM3ps = totalAbsoluteFlowM3ps; // Total flow leaving this pump port
        flowLabel = 'Pump Output:';
    } else if (componentType === 'outlet') {
        displayFlowM3ps = totalAbsoluteFlowM3ps; // Total flow entering this outlet port
        flowLabel = 'Outlet Input:';
    } else {
        // For all other nodes (junctions, connections between chips), calculate throughput
        displayFlowM3ps = totalAbsoluteFlowM3ps / 2.0;
        flowLabel = 'Throughput:';
    }

    const displayFlowULMin = displayFlowM3ps * microLitersPerMinuteFactor;

    // Get the port position
    const portPos = portShape.getAbsolutePosition();

    // Create details panel
    const detailsGroup = new Konva.Group({
        x: portPos.x + 20,
        y: portPos.y - 40, // Adjusted Y position slightly
        name: 'node-details'
    });

    // Fixed panel height
    const panelHeight = 70;
    const bg = new Konva.Rect({
        x: 0,
        y: 0,
        width: 160, // Adjusted width slightly if needed for longer labels
        height: panelHeight,
        fill: 'rgba(255, 255, 255, 0.95)',
        stroke: '#333',
        cornerRadius: 5,
        shadowColor: 'black',
        shadowBlur: 5,
        shadowOpacity: 0.2
    });
    detailsGroup.add(bg);

    // Title
    // --- MODIFIED: Dynamic Title ---
    let panelTitle = 'Port Details'; // Default
    const genericPortId = portShape.getAttr('portId'); // Get the generic ID like 'pump_right1', 't_top', 'outlet_top_in'

    if (componentType === 'pump') {
        // Find the index of this port within the pump component
        const pumpPorts = componentGroup.find('.connectionPort');
        const portIndex = pumpPorts.findIndex(p => p.id() === nodeId);
        if (portIndex !== -1) {
            panelTitle = `Pump Port ${portIndex + 1}`;
        } else {
            panelTitle = 'Pump Port (Unknown)';
        }
    } else if (componentType === 'outlet') {
        panelTitle = getComponentDisplayName('outlet'); // "Flow Outlet"
    } else if (genericPortId) {
        // Format generic chip port IDs (e.g., 'straight_left' -> 'Left Port')
        const parts = genericPortId.split('_');
        if (parts.length > 1) {
             // Capitalize the direction part and add "Port"
             panelTitle = parts.slice(1).map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ') + ' Port';
        } else {
            // Fallback if format is unexpected
            panelTitle = genericPortId.charAt(0).toUpperCase() + genericPortId.slice(1) + ' Port';
        }
    }
    // --- END MODIFICATION ---

    const title = new Konva.Text({
        x: 10,
        y: 10,
        text: panelTitle, // Use the dynamic title
        fontSize: 12,
        fontFamily: 'Arial',
        fill: '#333',
        fontWeight: 'bold'
    });
    detailsGroup.add(title);

    // Pressure
    const pressureText = new Konva.Text({
        x: 10,
        y: 30,
        text: `Pressure: ${pressureMbar.toFixed(1)} mbar`,
        fontSize: 10,
        fontFamily: 'Arial',
        fill: '#333'
    });
    detailsGroup.add(pressureText);

    // Display the calculated flow value with the appropriate label
    const flowText = new Konva.Text({
        x: 10,
        y: 48, // Adjusted Y position
        text: `${flowLabel} ${displayFlowULMin.toFixed(2)} µL/min`, // Use dynamic label
        fontSize: 10,
        fontFamily: 'Arial',
        fill: '#333'
    });
    detailsGroup.add(flowText);

    layer.add(detailsGroup);
    layer.draw();
}

// Function to hide the details panel
function hideNodeDetails() {
    layer.find('.node-details').forEach(el => el.destroy());
    layer.draw();
}

// --- Component List Logic ---

// --- NEW: Handle Palette Selection --- //
function handlePaletteSelection(chipType) {
    console.log(`Palette item selected: ${chipType}`);

    // --- 1. Deselect any currently selected CANVAS component --- //
    if (selectedComponent && selectedComponent instanceof Konva.Group) {
        const border = selectedComponent.findOne('.component-border');
        if (border) {
            if (selectedComponent.getAttr('chipType') === 'outlet') {
                border.stroke(null);
                border.strokeWidth(0);
            } else {
                border.stroke(chipStroke);
                border.strokeWidth(1);
            }
        }
    }
    // No need to visually deselect other palette items, only one can be logically selected

    // --- NEW: Ensure the selected component box is VISIBLE --- //
    const selectedBox = document.querySelector('.selected-component-box');
    if (selectedBox) selectedBox.style.display = 'flex'; // Use flex as defined for .sidebar-box

    // --- 2. Create a dummy selection object for the palette item --- //
    let resistanceValue = null;
    switch(chipType) {
        case 'straight': resistanceValue = RESISTANCE_STRAIGHT; break;
        case 't-type': resistanceValue = RESISTANCE_T_TYPE; break;
        case 'x-type': resistanceValue = RESISTANCE_X_TYPE; break;
        case 'meander': resistanceValue = RESISTANCE_MEANDER; break;
        // Pump and Outlet have no single resistance value
    }

    const paletteSelection = {
        isPaletteItem: true, // Flag to identify this type of selection
        chipType: chipType,
        // Store resistance if applicable, otherwise null
        resistance: resistanceValue
    };

    // --- 3. Set the global selection to this dummy object --- //
    selectedComponent = paletteSelection;

    // --- 4. Update the properties panel --- //
    updatePropertiesPanel();

    // --- 5. Redraw layer (optional, might be needed if deselecting a canvas item) ---
    layer.draw();
}

// --- Add Keyboard Event Listener for Delete/Backspace ---
document.addEventListener('keydown', (e) => {
    // Check if Delete or Backspace was pressed
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedComponent) {
        // Only handle canvas components (not palette items)
        if (selectedComponent instanceof Konva.Group) {
            // Get all ports of the selected component
            const groupPorts = selectedComponent.find('.connectionPort');
            
            // Store ports that need their boundary circles restored
            const portsToRestore = new Set();
            
            // Remove all connections associated with this component's ports
            groupPorts.forEach(port => {
                const portId = port.id();
                const connectionsToRemove = connections.filter(conn => 
                    conn.fromPort === portId || conn.toPort === portId
                );
                
                // Remove the visual connection lines and track connected ports
                connectionsToRemove.forEach(conn => {
                    const tubePath = layer.findOne('#' + conn.lineId + '_tube');
                    const outlinePath = layer.findOne('#' + conn.lineId + '_outline');
                    if (tubePath) tubePath.destroy();
                    if (outlinePath) outlinePath.destroy();
                    
                    // Add the other port to the set of ports to restore
                    const otherPortId = conn.fromPort === portId ? conn.toPort : conn.fromPort;
                    portsToRestore.add(otherPortId);
                    
                    // Remove from connections array
                    const index = connections.findIndex(c => c.lineId === conn.lineId);
                    if (index > -1) {
                        connections.splice(index, 1);
                    }
                });
            });
            
            // Remove the component itself
            selectedComponent.destroy();
            
            // Reset selection
            selectedComponent = null;
            updatePropertiesPanel();
            
            // Restore boundary circles and connection ports for ports that were connected to the deleted component
            portsToRestore.forEach(portId => {
                const port = stage.findOne('#' + portId);
                if (port) {
                    const group = port.getParent();
                    const mainGroup = stage.findOne('#' + port.getAttr('mainGroupId'));
                    const chipType = mainGroup?.getAttr('chipType');
                    
                    // Make the connection port visible
                    port.visible(true);
                    
                    // Make the boundary circle visible
                    const boundary = group?.findOne('.portBoundary');
                    if (boundary) {
                        boundary.visible(true);
                    }
                }
            });
            
            // Update the canvas and component list
            layer.draw();
                 updateComponentList();
                 calculateAndDisplayTubing();
        }
    }
});

// <<< NEW: Stage MouseMove Listener for Temporary Line >>>
stage.on('mousemove', (e) => {
    if (startPort !== null && tempConnectionLine !== null) {
        const startPos = startPort.getAbsolutePosition();
        const pointerPos = stage.getPointerPosition();
        tempConnectionLine.points([startPos.x, startPos.y, pointerPos.x, pointerPos.y]);
        layer.batchDraw(); // Use batchDraw for efficiency
    }
});
// <<< END NEW >>>