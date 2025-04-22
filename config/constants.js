// === SECTION: Global Constants ===
const chipWidth = 50; // 5mm * 10px/mm
const chipHeight = 50; // 5mm * 10px/mm
const itemWidth = 50; // Generic width
const itemHeight = 50; // Generic height
const outletWidth = 28; // Specific width for outlet icon (Matching new SVG aspect ratio 35:52)
const outletHeight = 42; // Specific height for outlet icon (Matching new SVG aspect ratio 35:52)

// --- Global Style Constants ---
const shadowStyle = {
    shadowColor: 'black',
    shadowBlur: 5,
    shadowOffsetX: 1,
    shadowOffsetY: 1,
    shadowOpacity: 0.15,
    shadowEnabled: true
};
const chipRectStyle = {
    fill: '#d9e2ec',    // Darker blue-grey for better contrast
    opacity: 0.85,      // Semi-transparent
    stroke: 'black',
    strokeWidth: 0.75,
    name: 'component-border' // Common name
};
const previewRectStyle = {
    fill: '#d9e2ec',
    opacity: 0.85,
    stroke: 'black',
    strokeWidth: 0.75,
    name: 'component-border' // Common name
};

// Define the Pump SVG as a Data URI
const pumpSvgDataUri = 'data:image/svg+xml;charset=utf-8,%3Csvg%20width%3D%2252%22%20height%3D%2250%22%20viewBox%3D%220%200%2052%2050%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3C!--%20Pump%20Base%20(Bottom%20Layer)%20--%3E%3Cpath%20d%3D%22M11%2038%20L35%2038%20C37%2038%2038%2039%2038%2041%20L38%2048%20C38%2049%2037%2050%2035%2050%20L11%2050%20C9%2050%208%2049%208%2048%20L8%2041%20C8%2039%209%2038%2011%2038%22%20fill%3D%22%23d9e2ec%22%20stroke%3D%22%232c3e50%22%20stroke-width%3D%221%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2240%22%20width%3D%2226%22%20height%3D%228%22%20fill%3D%22%23e3f2fd%22%2F%3E%3C!--%20First%20Connection%20(Top)%20--%3E%3Crect%20x%3D%2236%22%20y%3D%228%22%20width%3D%2215%22%20height%3D%224%22%20fill%3D%22%23d9e2ec%22%20stroke%3D%22%232c3e50%22%20stroke-width%3D%221%22%2F%3E%3Crect%20x%3D%2237%22%20y%3D%229%22%20width%3D%2213%22%20height%3D%222%22%20fill%3D%22%23e3f2fd%22%2F%3E%3C!--%20Second%20Connection%20--%3E%3Crect%20x%3D%2236%22%20y%3D%2218%22%20width%3D%2215%22%20height%3D%224%22%20fill%3D%22%23d9e2ec%22%20stroke%3D%22%232c3e50%22%20stroke-width%3D%221%22%2F%3E%3Crect%20x%3D%2237%22%20y%3D%2219%22%20width%3D%2213%22%20height%3D%222%22%20fill%3D%22%23e3f2fd%22%2F%3E%3C!--%20Third%20Connection%20--%3E%3Crect%20x%3D%2236%22%20y%3D%2228%22%20width%3D%2215%22%20height%3D%224%22%20fill%3D%22%23d9e2ec%22%20stroke%3D%22%232c3e50%22%20stroke-width%3D%221%22%2F%3E%3Crect%20x%3D%2237%22%20y%3D%2229%22%20width%3D%2213%22%20height%3D%222%22%20fill%3D%22%23e3f2fd%22%2F%3E%3C!--%20Fourth%20Connection%20--%3E%3Crect%20x%3D%2236%22%20y%3D%2238%22%20width%3D%2215%22%20height%3D%224%22%20fill%3D%22%23d9e2ec%22%20stroke%3D%22%232c3e50%22%20stroke-width%3D%221%22%2F%3E%3Crect%20x%3D%2237%22%20y%3D%2239%22%20width%3D%2213%22%20height%3D%222%22%20fill%3D%22%23e3f2fd%22%2F%3E%3C!--%20Pump%20Circles%20(Middle%20Layer)%20--%3E%3Ccircle%20cx%3D%2223%22%20cy%3D%2225%22%20r%3D%2222%22%20fill%3D%22%23d9e2ec%22%20stroke%3D%22%232c3e50%22%20stroke-width%3D%221%22%20opacity%3D%220.95%22%2F%3E%3Ccircle%20cx%3D%2223%22%20cy%3D%2225%22%20r%3D%2218%22%20fill%3D%22%23007bff%22%20opacity%3D%220.95%22%20stroke%3D%22%232c3e50%22%20stroke-width%3D%221%22%2F%3E%3Ccircle%20cx%3D%2223%22%20cy%3D%2225%22%20r%3D%224%22%20fill%3D%22%23e3f2fd%22%20stroke%3D%22%232c3e50%22%20stroke-width%3D%221%22%20opacity%3D%220.95%22%2F%3E%3C!--%20Flange%20Boxes%20(Top%20Layer)%20--%3E%3Crect%20x%3D%2248%22%20y%3D%227%22%20width%3D%223%22%20height%3D%226%22%20fill%3D%22%23d9e2ec%22%20stroke%3D%22%232c3e50%22%20stroke-width%3D%221%22%2F%3E%3Crect%20x%3D%2248%22%20y%3D%2217%22%20width%3D%223%22%20height%3D%226%22%20fill%3D%22%23d9e2ec%22%20stroke%3D%22%232c3e50%22%20stroke-width%3D%221%22%2F%3E%3Crect%20x%3D%2248%22%20y%3D%2227%22%20width%3D%223%22%20height%3D%226%22%20fill%3D%22%23d9e2ec%22%20stroke%3D%22%232c3e50%22%20stroke-width%3D%221%22%2F%3E%3Crect%20x%3D%2248%22%20y%3D%2237%22%20width%3D%223%22%20height%3D%226%22%20fill%3D%22%23d9e2ec%22%20stroke%3D%22%232c3e50%22%20stroke-width%3D%221%22%2F%3E%3C%2Fsvg%3E';
const pumpSvgDataUri_Selected = 'data:image/svg+xml;charset=utf-8,%3Csvg%20width%3D%2252%22%20height%3D%2250%22%20viewBox%3D%220%200%2052%2050%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3C!--%20Pump%20Base%20(Bottom%20Layer)%20--%3E%3Cpath%20d%3D%22M11%2038%20L35%2038%20C37%2038%2038%2039%2038%2041%20L38%2048%20C38%2049%2037%2050%2035%2050%20L11%2050%20C9%2050%208%2049%208%2048%20L8%2041%20C8%2039%209%2038%2011%2038%22%20fill%3D%22%23b0bec5%22%20stroke%3D%22%232c3e50%22%20stroke-width%3D%221%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2240%22%20width%3D%2226%22%20height%3D%228%22%20fill%3D%22%23bbdefb%22%2F%3E%3C!--%20First%20Connection%20(Top)%20--%3E%3Crect%20x%3D%2236%22%20y%3D%228%22%20width%3D%2215%22%20height%3D%224%22%20fill%3D%22%23b0bec5%22%20stroke%3D%22%232c3e50%22%20stroke-width%3D%221%22%2F%3E%3Crect%20x%3D%2237%22%20y%3D%229%22%20width%3D%2213%22%20height%3D%222%22%20fill%3D%22%23bbdefb%22%2F%3E%3C!--%20Second%20Connection%20--%3E%3Crect%20x%3D%2236%22%20y%3D%2218%22%20width%3D%2215%22%20height%3D%224%22%20fill%3D%22%23b0bec5%22%20stroke%3D%22%232c3e50%22%20stroke-width%3D%221%22%2F%3E%3Crect%20x%3D%2237%22%20y%3D%2219%22%20width%3D%2213%22%20height%3D%222%22%20fill%3D%22%23bbdefb%22%2F%3E%3C!--%20Third%20Connection%20--%3E%3Crect%20x%3D%2236%22%20y%3D%2228%22%20width%3D%2215%22%20height%3D%224%22%20fill%3D%22%23b0bec5%22%20stroke%3D%22%232c3e50%22%20stroke-width%3D%221%22%2F%3E%3Crect%20x%3D%2237%22%20y%3D%2229%22%20width%3D%2213%22%20height%3D%222%22%20fill%3D%22%23bbdefb%22%2F%3E%3C!--%20Fourth%20Connection%20--%3E%3Crect%20x%3D%2236%22%20y%3D%2238%22%20width%3D%2215%22%20height%3D%224%22%20fill%3D%22%23b0bec5%22%20stroke%3D%22%232c3e50%22%20stroke-width%3D%221%22%2F%3E%3Crect%20x%3D%2237%22%20y%3D%2239%22%20width%3D%2213%22%20height%3D%222%22%20fill%3D%22%23bbdefb%22%2F%3E%3C!--%20Pump%20Circles%20(Middle%20Layer)%20--%3E%3Ccircle%20cx%3D%2223%22%20cy%3D%2225%22%20r%3D%2222%22%20fill%3D%22%23b0bec5%22%20stroke%3D%22%232c3e50%22%20stroke-width%3D%221%22%20opacity%3D%220.95%22%2F%3E%3Ccircle%20cx%3D%2223%22%20cy%3D%2225%22%20r%3D%2218%22%20fill%3D%22%230056b3%22%20opacity%3D%220.95%22%20stroke%3D%22%232c3e50%22%20stroke-width%3D%221%22%2F%3E%3Ccircle%20cx%3D%2223%22%20cy%3D%2225%22%20r%3D%224%22%20fill%3D%22%23bbdefb%22%20stroke%3D%22%232c3e50%22%20stroke-width%3D%221%22%20opacity%3D%220.95%22%2F%3E%3C!--%20Flange%20Boxes%20(Top%20Layer)%20--%3E%3Crect%20x%3D%2248%22%20y%3D%227%22%20width%3D%223%22%20height%3D%226%22%20fill%3D%22%23b0bec5%22%20stroke%3D%22%232c3e50%22%20stroke-width%3D%221%22%2F%3E%3Crect%20x%3D%2248%22%20y%3D%2217%22%20width%3D%223%22%20height%3D%226%22%20fill%3D%22%23b0bec5%22%20stroke%3D%22%232c3e50%22%20stroke-width%3D%221%22%2F%3E%3Crect%20x%3D%2248%22%20y%3D%2227%22%20width%3D%223%22%20height%3D%226%22%20fill%3D%22%23b0bec5%22%20stroke%3D%22%232c3e50%22%20stroke-width%3D%221%22%2F%3E%3Crect%20x%3D%2248%22%20y%3D%2237%22%20width%3D%223%22%20height%3D%226%22%20fill%3D%22%23b0bec5%22%20stroke%3D%22%232c3e50%22%20stroke-width%3D%221%22%2F%3E%3C%2Fsvg%3E'; // Darker version
const outletSvgDataUri = 'data:image/svg+xml;charset=utf-8,%3Csvg%20width%3D%2235%22%20height%3D%2252%22%20viewBox%3D%220%200%2035%2052%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20x%3D%222.5%22%20y%3D%220%22%20width%3D%2230%22%20height%3D%225%22%20fill%3D%22%23CD853F%22%20stroke%3D%22black%22%20stroke-width%3D%222%22%20vector-effect%3D%22non-scaling-stroke%22%20opacity%3D%220.85%22%20%2F%3E%3Cpath%20d%3D%22M6%205%20L6%2031%20Q6%2045%2017.5%2050%20Q29%2045%2029%2031%20L29%205%22%20fill%3D%22%23CD853F%22%20stroke%3D%22black%22%20stroke-width%3D%222%22%20vector-effect%3D%22non-scaling-stroke%22%20opacity%3D%220.85%22%2F%3E%3C%2Fsvg%3E'; // Orangey Brown + Opacity + Height 52
const outletSvgDataUri_Selected = 'data:image/svg+xml;charset=utf-8,%3Csvg%20width%3D%2235%22%20height%3D%2252%22%20viewBox%3D%220%200%2035%2052%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20x%3D%222.5%22%20y%3D%220%22%20width%3D%2230%22%20height%3D%225%22%20fill%3D%22%23a0522d%22%20stroke%3D%22black%22%20stroke-width%3D%222%22%20vector-effect%3D%22non-scaling-stroke%22%20opacity%3D%220.85%22%20%2F%3E%3Cpath%20d%3D%22M6%205%20L6%2031%20Q6%2045%2017.5%2050%20Q29%2045%2029%2031%20L29%205%22%20fill%3D%22%23a0522d%22%20stroke%3D%22black%22%20stroke-width%3D%222%22%20vector-effect%3D%22non-scaling-stroke%22%20opacity%3D%220.85%22%2F%3E%3C%2Fsvg%3E'; // Darker version
const portRadius = 3;
const portColor = '#007bff'; // New color: Flow highlight blue
const portSelectedColor = '#33CC33'; // Bright Green for selection
const chipColor = 'lightgrey';
const chipStroke = 'black';
const connectionStubLength = 10; // How far the line goes straight from the port
const channelFillColor = '#e3f2fd';    // Light blue fill
const channelOutlineColor = '#555555';   // Match tubing outline
const channelFillWidth = 3.5; // Increased to match meander channel
const channelOutlineWidth = 5; // Increased to match meander channel
const channelCap = 'butt';  // Changed from 'round' to 'butt' for straight edges
const channelJoin = 'miter';  // Changed from 'round' to 'miter' for sharp corners
const flowHighlightColor = '#007bff'; // Brighter/Stronger Blue
const PIXEL_TO_METER_SCALE = 0.0001; // 50px = 5mm => 1px = 0.1mm = 0.0001m
const FLUID_VISCOSITY = 0.001;      // Dynamic viscosity of water (Pa·s)
const TUBE_INNER_RADIUS_M = 0.000254; // Inner radius for 0.02" ID tubing (m)
const POISEUILLE_CONSTANT = (8 * FLUID_VISCOSITY) / (Math.PI * Math.pow(TUBE_INNER_RADIUS_M, 4));
console.log("Poiseuille Constant (for tubing resistance):", POISEUILLE_CONSTANT);
const RESISTANCE_STRAIGHT = 1.42e12; // L = 5mm
const RESISTANCE_T_TYPE = 7.11e11;  // Resistance per segment, L = 2.5mm
const RESISTANCE_X_TYPE = 7.11e11;  // Resistance per segment, L = 2.5mm
const RESISTANCE_MEANDER = 4.27e13; // L = 150mm
const CHANNEL_WIDTH_MICRONS = 100;
const CHANNEL_DEPTH_MICRONS = 100;
const LENGTH_STRAIGHT_MM = 5;
const LENGTH_T_X_SEGMENT_MM = 2.5; // Length per segment from port to center
const LENGTH_MEANDER_MM = 150;

// === SECTION: Conversion Factors ===
const MBAR_TO_PASCAL = 100;
const PASCAL_TO_MBAR = 0.01;
const PIXEL_TO_CM = 0.01; // Assuming 1px = 0.1mm
const MICRO_LITERS_PER_MINUTE_FACTOR = 6e+7; // m³/s to µL/min 