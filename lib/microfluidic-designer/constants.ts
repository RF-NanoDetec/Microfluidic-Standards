// Canvas and Chip Dimensions
export const CHIP_WIDTH = 50;
export const CHIP_HEIGHT = 50;
export const ITEM_WIDTH = 50;
export const ITEM_HEIGHT = 50;
export const PUMP_CANVAS_WIDTH = 50;
export const PUMP_CANVAS_HEIGHT = 50;


// Shadow Style for Glass-like Effect
// Default, less prominent shadow
export const SHADOW_STYLE_DEFAULT = {
  shadowColor: 'black',
  shadowBlur: 3,      // Reduced from 7
  shadowOffsetX: 1,   // Reduced from 2
  shadowOffsetY: 1,   // Reduced from 2
  shadowOpacity: 0.15, // Reduced from 0.35
  shadowEnabled: true
};

// Stronger shadow style for hover/selected states or specific items like Outlet
export const SHADOW_STYLE_STRONG = {
  shadowColor: 'black',
  shadowBlur: 8,      // Slightly increased for more emphasis
  shadowOffsetX: 3,   // Slightly increased
  shadowOffsetY: 3,   // Slightly increased
  shadowOpacity: 0.45, // Slightly increased
  shadowEnabled: true
};

// Chip Styling
export const CHIP_RECT_STYLE = {
  fill: '#d9e2ec',    // Darker blue-grey for better contrast
  opacity: 0.85,      // Semi-transparent
  stroke: 'black',
  strokeWidth: 0.75,
  name: 'component-border' // Common name
};

// Preview Styling (same as chip in original)
export const PREVIEW_RECT_STYLE = {
  fill: '#d9e2ec',
  opacity: 0.85,
  stroke: 'black',
  strokeWidth: 0.75,
  name: 'component-border'
};

// Channel Styling
export const CHANNEL_FILL_COLOR = '#e3f2fd';    // Light blue fill
export const CHANNEL_OUTLINE_COLOR = '#555555'; // Dark grey
export const CHANNEL_FILL_WIDTH = 3.5;
export const CHANNEL_OUTLINE_WIDTH = 5;
export const CHANNEL_CAP = 'butt';  // Straight edges
export const CHANNEL_JOIN = 'miter'; // Sharp corners

// Port Styling
export const PORT_RADIUS = 3;
export const PORT_COLOR = '#007bff'; // Blue
export const PORT_SELECTED_COLOR = '#33CC33'; // Bright Green for selection
export const PORT_STROKE_COLOR = '#2c3e50'; // Dark blue-grey outline
export const PORT_STROKE_WIDTH = 1;
export const PORT_HIT_RADIUS = 32; // Larger invisible touch target

// Flow Highlighting
export const FLOW_HIGHLIGHT_COLOR = '#007bff'; // Brighter/Stronger Blue

// Connection Styling
export const CONNECTION_STUB_LENGTH = 10; // How far the line goes straight from the port 

// SVG Data URIs for components (exact replicas from the original)
export const PUMP_SVG_DATA_URI = 'data:image/svg+xml;charset=utf-8,%3Csvg%20width%3D%2252%22%20height%3D%2250%22%20viewBox%3D%220%200%2052%2050%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3C!--%20Pump%20Base%20(Bottom%20Layer)%20--%3E%3Cpath%20d%3D%22M11%2038%20L35%2038%20C37%2038%2038%2039%2038%2041%20L38%2048%20C38%2049%2037%2050%2035%2050%20L11%2050%20C9%2050%208%2049%208%2048%20L8%2041%20C8%2039%209%2038%2011%2038%22%20fill%3D%22%23d9e2ec%22%20stroke%3D%22%232c3e50%22%20stroke-width%3D%221%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2240%22%20width%3D%2226%22%20height%3D%228%22%20fill%3D%22%23e3f2fd%22%2F%3E%3C!--%20First%20Connection%20(Top)%20--%3E%3Crect%20x%3D%2236%22%20y%3D%228%22%20width%3D%2215%22%20height%3D%224%22%20fill%3D%22%23d9e2ec%22%20stroke%3D%22%232c3e50%22%20stroke-width%3D%221%22%2F%3E%3Crect%20x%3D%2237%22%20y%3D%229%22%20width%3D%2213%22%20height%3D%222%22%20fill%3D%22%23e3f2fd%22%2F%3E%3C!--%20Second%20Connection%20--%3E%3Crect%20x%3D%2236%22%20y%3D%2218%22%20width%3D%2215%22%20height%3D%224%22%20fill%3D%22%23d9e2ec%22%20stroke%3D%22%232c3e50%22%20stroke-width%3D%221%22%2F%3E%3Crect%20x%3D%2237%22%20y%3D%2219%22%20width%3D%2213%22%20height%3D%222%22%20fill%3D%22%23e3f2fd%22%2F%3E%3C!--%20Third%20Connection%20--%3E%3Crect%20x%3D%2236%22%20y%3D%2228%22%20width%3D%2215%22%20height%3D%224%22%20fill%3D%22%23d9e2ec%22%20stroke%3D%22%232c3e50%22%20stroke-width%3D%221%22%2F%3E%3Crect%20x%3D%2237%22%20y%3D%2229%22%20width%3D%2213%22%20height%3D%222%22%20fill%3D%22%23e3f2fd%22%2F%3E%3C!--%20Fourth%20Connection%20--%3E%3Crect%20x%3D%2236%22%20y%3D%2238%22%20width%3D%2215%22%20height%3D%224%22%20fill%3D%22%23d9e2ec%22%20stroke%3D%22%232c3e50%22%20stroke-width%3D%221%22%2F%3E%3Crect%20x%3D%2237%22%20y%3D%2239%22%20width%3D%2213%22%20height%3D%222%22%20fill%3D%22%23e3f2fd%22%2F%3E%3C!--%20Pump%20Circles%20(Middle%20Layer)%20--%3E%3Ccircle%20cx%3D%2223%22%20cy%3D%2225%22%20r%3D%2222%22%20fill%3D%22%23d9e2ec%22%20stroke%3D%22%232c3e50%22%20stroke-width%3D%221%22%20opacity%3D%220.95%22%2F%3E%3Ccircle%20cx%3D%2223%22%20cy%3D%2225%22%20r%3D%2218%22%20fill%3D%22%23007bff%22%20opacity%3D%220.95%22%20stroke%3D%22%232c3e50%22%20stroke-width%3D%221%22%2F%3E%3Ccircle%20cx%3D%2223%22%20cy%3D%2225%22%20r%3D%224%22%20fill%3D%22%23e3f2fd%22%20stroke%3D%22%232c3e50%22%20stroke-width%3D%221%22%20opacity%3D%220.95%22%2F%3E%3C!--%20Flange%20Boxes%20(Top%20Layer)%20--%3E%3Crect%20x%3D%2248%22%20y%3D%227%22%20width%3D%223%22%20height%3D%226%22%20fill%3D%22%23d9e2ec%22%20stroke%3D%22%232c3e50%22%20stroke-width%3D%221%22%2F%3E%3Crect%20x%3D%2248%22%20y%3D%2217%22%20width%3D%223%22%20height%3D%226%22%20fill%3D%22%23d9e2ec%22%20stroke%3D%22%232c3e50%22%20stroke-width%3D%221%22%2F%3E%3Crect%20x%3D%2248%22%20y%3D%2227%22%20width%3D%223%22%20height%3D%226%22%20fill%3D%22%23d9e2ec%22%20stroke%3D%22%232c3e50%22%20stroke-width%3D%221%22%2F%3E%3Crect%20x%3D%2248%22%20y%3D%2237%22%20width%3D%223%22%20height%3D%226%22%20fill%3D%22%23d9e2ec%22%20stroke%3D%22%232c3e50%22%20stroke-width%3D%221%22%2F%3E%3C%2Fsvg%3E';

// Selected version of the pump SVG
export const PUMP_SVG_DATA_URI_SELECTED = 'data:image/svg+xml;charset=utf-8,%3Csvg%20width%3D%2252%22%20height%3D%2250%22%20viewBox%3D%220%200%2052%2050%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3C!--%20Pump%20Base%20(Bottom%20Layer)%20--%3E%3Cpath%20d%3D%22M11%2038%20L35%2038%20C37%2038%2038%2039%2038%2041%20L38%2048%20C38%2049%2037%2050%2035%2050%20L11%2050%20C9%2050%208%2049%208%2048%20L8%2041%20C8%2039%209%2038%2011%2038%22%20fill%3D%22%23b0bec5%22%20stroke%3D%22%232c3e50%22%20stroke-width%3D%221%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2240%22%20width%3D%2226%22%20height%3D%228%22%20fill%3D%22%23bbdefb%22%2F%3E%3C!--%20First%20Connection%20(Top)%20--%3E%3Crect%20x%3D%2236%22%20y%3D%228%22%20width%3D%2215%22%20height%3D%224%22%20fill%3D%22%23b0bec5%22%20stroke%3D%22%232c3e50%22%20stroke-width%3D%221%22%2F%3E%3Crect%20x%3D%2237%22%20y%3D%229%22%20width%3D%2213%22%20height%3D%222%22%20fill%3D%22%23bbdefb%22%2F%3E%3C!--%20Second%20Connection%20--%3E%3Crect%20x%3D%2236%22%20y%3D%2218%22%20width%3D%2215%22%20height%3D%224%22%20fill%3D%22%23b0bec5%22%20stroke%3D%22%232c3e50%22%20stroke-width%3D%221%22%2F%3E%3Crect%20x%3D%2237%22%20y%3D%2219%22%20width%3D%2213%22%20height%3D%222%22%20fill%3D%22%23bbdefb%22%2F%3E%3C!--%20Third%20Connection%20--%3E%3Crect%20x%3D%2236%22%20y%3D%2228%22%20width%3D%2215%22%20height%3D%224%22%20fill%3D%22%23b0bec5%22%20stroke%3D%22%232c3e50%22%20stroke-width%3D%221%22%2F%3E%3Crect%20x%3D%2237%22%20y%3D%2229%22%20width%3D%2213%22%20height%3D%222%22%20fill%3D%22%23bbdefb%22%2F%3E%3C!--%20Fourth%20Connection%20--%3E%3Crect%20x%3D%2236%22%20y%3D%2238%22%20width%3D%2215%22%20height%3D%224%22%20fill%3D%22%23b0bec5%22%20stroke%3D%22%232c3e50%22%20stroke-width%3D%221%22%2F%3E%3Crect%20x%3D%2237%22%20y%3D%2239%22%20width%3D%2213%22%20height%3D%222%22%20fill%3D%22%23bbdefb%22%2F%3E%3C!--%20Pump%20Circles%20(Middle%20Layer)%20--%3E%3Ccircle%20cx%3D%2223%22%20cy%3D%2225%22%20r%3D%2222%22%20fill%3D%22%23b0bec5%22%20stroke%3D%22%232c3e50%22%20stroke-width%3D%221%22%20opacity%3D%220.95%22%2F%3E%3Ccircle%20cx%3D%2223%22%20cy%3D%2225%22%20r%3D%2218%22%20fill%3D%22%230056b3%22%20opacity%3D%220.95%22%20stroke%3D%22%232c3e50%22%20stroke-width%3D%221%22%2F%3E%3Ccircle%20cx%3D%2223%22%20cy%3D%2225%22%20r%3D%224%22%20fill%3D%22%23bbdefb%22%20stroke%3D%22%232c3e50%22%20stroke-width%3D%221%22%20opacity%3D%220.95%22%2F%3E%3C!--%20Flange%20Boxes%20(Top%20Layer)%20--%3E%3Crect%20x%3D%2248%22%20y%3D%227%22%20width%3D%223%22%20height%3D%226%22%20fill%3D%22%23b0bec5%22%20stroke%3D%22%232c3e50%22%20stroke-width%3D%221%22%2F%3E%3Crect%20x%3D%2248%22%20y%3D%2217%22%20width%3D%223%22%20height%3D%226%22%20fill%3D%22%23b0bec5%22%20stroke%3D%22%232c3e50%22%20stroke-width%3D%221%22%2F%3E%3Crect%20x%3D%2248%22%20y%3D%2227%22%20width%3D%223%22%20height%3D%226%22%20fill%3D%22%23b0bec5%22%20stroke%3D%22%232c3e50%22%20stroke-width%3D%221%22%2F%3E%3Crect%20x%3D%2248%22%20y%3D%2237%22%20width%3D%223%22%20height%3D%226%22%20fill%3D%22%23b0bec5%22%20stroke%3D%22%232c3e50%22%20stroke-width%3D%221%22%2F%3E%3C%2Fsvg%3E';

// Outlet SVG representation - exactly matching the original
export const OUTLET_SVG_DATA_URI = 'data:image/svg+xml;charset=utf-8,%3Csvg%20width%3D%2217.26193mm%22%20height%3D%2223.289mm%22%20viewBox%3D%220%200%2017.261931%2023.289%22%20version%3D%221.1%22%20id%3D%22svg11986%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20xmlns%3Asvg%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cdefs%20id%3D%22defs11983%22%20%2F%3E%3Cg%20id%3D%22layer1%22%20transform%3D%22translate(-29.567728%2C-15.137723)%22%3E%3Cg%20id%3D%22g14515%22%3E%3Cpath%20style%3D%22fill%3Anone%3Bstroke%3A%23000000%3Bstroke-width%3A0.018em%3Bstroke-linecap%3Abutt%3Bstroke-linejoin%3Around%3Bstroke-miterlimit%3A4%3Bstroke-dasharray%3Anone%3Bstroke-opacity%3A1%22%20d%3D%22m%2035.301677%2C23.394983%20v%207.3364%20l%201.7598%2C6.37873%20c%200.29905%2C0.84856%201.93933%2C0.90494%202.26363%2C0%20l%201.73296%2C-6.37873%200.0316%2C-7.3364%20z%22%20id%3D%22path66%22%20%2F%3E%3Cpath%20style%3D%22fill%3A%230000ff%3Bfill-opacity%3A0.681055%3Bstroke%3A%23000000%3Bstroke-width%3A0.018em%3Bstroke-linecap%3Abutt%3Bstroke-linejoin%3Around%3Bstroke-miterlimit%3A4%3Bstroke-dasharray%3Anone%3Bstroke-opacity%3A1%22%20d%3D%22m%2035.817367%2C30.731383%201.69273%2C6.0544%20c%200.22602%2C0.64131%201.11891%2C0.68392%201.364%2C0%20l%201.74046%2C-6.06644%20v%20-1.30707%20c%20-0.66211%2C0.36298%20-3.92927%2C0.49115%20-4.78894%2C-0.0675%20l%20-0.008%2C1.38659%20z%22%20id%3D%22path66-1%22%20%2F%3E%3Crect%20style%3D%22fill%3Anone%3Bstroke%3A%23000000%3Bstroke-width%3A0.018em%3Bstroke-linecap%3Around%3Bstroke-linejoin%3Around%3Bstroke-miterlimit%3A4%3Bstroke-dasharray%3Anone%3Bstroke-opacity%3A1%3Bpaint-order%3Afill%20markers%20stroke%22%20id%3D%22rect2771%22%20width%3D%226.6995201%22%20height%3D%220.77329332%22%20x%3D%2234.838673%22%20y%3D%2222.590122%22%20ry%3D%220.1341131%22%20%2F%3E%3Crect%20style%3D%22fill%3Anone%3Bstroke%3A%23000000%3Bstroke-width%3A0.018em%3Bstroke-linecap%3Around%3Bstroke-linejoin%3Around%3Bstroke-miterlimit%3A4%3Bstroke-dasharray%3Anone%3Bstroke-opacity%3A1%3Bpaint-order%3Afill%20markers%20stroke%22%20id%3D%22rect2771-2-0%22%20width%3D%226.7683578%22%20height%3D%220.77329332%22%20x%3D%221.1890531%22%20y%3D%2247.515343%22%20ry%3D%220.1341131%22%20transform%3D%22matrix(0.47349272%2C-0.88079773%2C0.88082706%2C0.47343816%2C0%2C0)%22%20%2F%3E%3Crect%20style%3D%22fill%3Anone%3Bstroke%3A%23000000%3Bstroke-width%3A0.018em%3Bstroke-linecap%3Around%3Bstroke-linejoin%3Around%3Bstroke-miterlimit%3A4%3Bstroke-dasharray%3Anone%3Bstroke-opacity%3A1%3Bpaint-order%3Afill%20markers%20stroke%22%20id%3D%22rect2771-2-6-4%22%20width%3D%225.2450724%22%20height%3D%220.77329332%22%20x%3D%221.9512283%22%20y%3D%2246.72649%22%20ry%3D%220.1341131%22%20transform%3D%22matrix(0.47348169%2C-0.88080366%2C0.88082191%2C0.47344773%2C0%2C0)%22%20%2F%3E%3Cpath%20style%3D%22fill%3Anone%3Bstroke%3A%23000000%3Bstroke-width%3A0.018em%3Bstroke-linecap%3Around%3Bstroke-linejoin%3Amiter%3Bstroke-miterlimit%3A4%3Bstroke-dasharray%3Anone%3Bstroke-opacity%3A1%22%20d%3D%22m%2037.005067%2C25.951533%20h%202.36673%22%20id%3D%22path3284%22%20%2F%3E%3Cpath%20style%3D%22fill%3Anone%3Bstroke%3A%23000000%3Bstroke-width%3A0.018em%3Bstroke-linecap%3Around%3Bstroke-linejoin%3Amiter%3Bstroke-miterlimit%3A4%3Bstroke-dasharray%3Anone%3Bstroke-opacity%3A1%22%20d%3D%22m%2037.005067%2C29.044043%20h%202.36673%22%20id%3D%22path3284-1%22%20%2F%3E%3Cpath%20style%3D%22fill%3Anone%3Bstroke%3A%23000000%3Bstroke-width%3A0.018em%3Bstroke-linecap%3Around%3Bstroke-linejoin%3Amiter%3Bstroke-miterlimit%3A4%3Bstroke-dasharray%3Anone%3Bstroke-opacity%3A1%22%20d%3D%22m%2037.005067%2C32.515233%20h%202.36673%22%20id%3D%22path3284-7%22%20%2F%3E%3Cpath%20style%3D%22fill%3Anone%3Bstroke%3A%23000000%3Bstroke-width%3A0.018em%3Bstroke-linecap%3Abutt%3Bstroke-linejoin%3Amiter%3Bstroke-miterlimit%3A4%3Bstroke-dasharray%3Anone%3Bstroke-opacity%3A1%22%20d%3D%22m%2041.526155%2C22.95126%20c%200.931309%2C-0.103741%201.139979%2C-0.471509%201.25206%2C-1.353677%22%20id%3D%22path3942%22%20%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E';

// Selected version of the outlet SVG
export const OUTLET_SVG_DATA_URI_SELECTED = 'data:image/svg+xml;charset=utf-8,%3Csvg%20width%3D%2217.26193mm%22%20height%3D%2223.289mm%22%20viewBox%3D%220%200%2017.261931%2023.289%22%20version%3D%221.1%22%20id%3D%22svg11986%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20xmlns%3Asvg%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cdefs%20id%3D%22defs11983%22%20%2F%3E%3Cg%20id%3D%22layer1%22%20transform%3D%22translate(-29.567728%2C-15.137723)%22%3E%3Cg%20id%3D%22g14515%22%3E%3Cpath%20style%3D%22fill%3Anone%3Bstroke%3A%23000000%3Bstroke-width%3A0.018em%3Bstroke-linecap%3Abutt%3Bstroke-linejoin%3Around%3Bstroke-miterlimit%3A4%3Bstroke-dasharray%3Anone%3Bstroke-opacity%3A1%22%20d%3D%22m%2035.301677%2C23.394983%20v%207.3364%20l%201.7598%2C6.37873%20c%200.29905%2C0.84856%201.93933%2C0.90494%202.26363%2C0%20l%201.73296%2C-6.37873%200.0316%2C-7.3364%20z%22%20id%3D%22path66%22%20%2F%3E%3Cpath%20style%3D%22fill%3A%230000b3%3Bfill-opacity%3A0.681055%3Bstroke%3A%23000000%3Bstroke-width%3A0.018em%3Bstroke-linecap%3Abutt%3Bstroke-linejoin%3Around%3Bstroke-miterlimit%3A4%3Bstroke-dasharray%3Anone%3Bstroke-opacity%3A1%22%20d%3D%22m%2035.817367%2C30.731383%201.69273%2C6.0544%20c%200.22602%2C0.64131%201.11891%2C0.68392%201.364%2C0%20l%201.74046%2C-6.06644%20v%20-1.30707%20c%20-0.66211%2C0.36298%20-3.92927%2C0.49115%20-4.78894%2C-0.0675%20l%20-0.008%2C1.38659%20z%22%20id%3D%22path66-1%22%20%2F%3E%3Crect%20style%3D%22fill%3Anone%3Bstroke%3A%23000000%3Bstroke-width%3A0.018em%3Bstroke-linecap%3Around%3Bstroke-linejoin%3Around%3Bstroke-miterlimit%3A4%3Bstroke-dasharray%3Anone%3Bstroke-opacity%3A1%3Bpaint-order%3Afill%20markers%20stroke%22%20id%3D%22rect2771%22%20width%3D%226.6995201%22%20height%3D%220.77329332%22%20x%3D%2234.838673%22%20y%3D%2222.590122%22%20ry%3D%220.1341131%22%20%2F%3E%3Crect%20style%3D%22fill%3Anone%3Bstroke%3A%23000000%3Bstroke-width%3A0.018em%3Bstroke-linecap%3Around%3Bstroke-linejoin%3Around%3Bstroke-miterlimit%3A4%3Bstroke-dasharray%3Anone%3Bstroke-opacity%3A1%3Bpaint-order%3Afill%20markers%20stroke%22%20id%3D%22rect2771-2-0%22%20width%3D%226.7683578%22%20height%3D%220.77329332%22%20x%3D%221.1890531%22%20y%3D%2247.515343%22%20ry%3D%220.1341131%22%20transform%3D%22matrix(0.47349272%2C-0.88079773%2C0.88082706%2C0.47343816%2C0%2C0)%22%20%2F%3E%3Crect%20style%3D%22fill%3Anone%3Bstroke%3A%23000000%3Bstroke-width%3A0.018em%3Bstroke-linecap%3Around%3Bstroke-linejoin%3Around%3Bstroke-miterlimit%3A4%3Bstroke-dasharray%3Anone%3Bstroke-opacity%3A1%3Bpaint-order%3Afill%20markers%20stroke%22%20id%3D%22rect2771-2-6-4%22%20width%3D%225.2450724%22%20height%3D%220.77329332%22%20x%3D%221.9512283%22%20y%3D%2246.72649%22%20ry%3D%220.1341131%22%20transform%3D%22matrix(0.47348169%2C-0.88080366%2C0.88082191%2C0.47344773%2C0%2C0)%22%20%2F%3E%3Cpath%20style%3D%22fill%3Anone%3Bstroke%3A%23000000%3Bstroke-width%3A0.018em%3Bstroke-linecap%3Around%3Bstroke-linejoin%3Amiter%3Bstroke-miterlimit%3A4%3Bstroke-dasharray%3Anone%3Bstroke-opacity%3A1%22%20d%3D%22m%2037.005067%2C25.951533%20h%202.36673%22%20id%3D%22path3284%22%20%2F%3E%3Cpath%20style%3D%22fill%3Anone%3Bstroke%3A%23000000%3Bstroke-width%3A0.018em%3Bstroke-linecap%3Around%3Bstroke-linejoin%3Amiter%3Bstroke-miterlimit%3A4%3Bstroke-dasharray%3Anone%3Bstroke-opacity%3A1%22%20d%3D%22m%2037.005067%2C29.044043%20h%202.36673%22%20id%3D%22path3284-1%22%20%2F%3E%3Cpath%20style%3D%22fill%3Anone%3Bstroke%3A%23000000%3Bstroke-width%3A0.018em%3Bstroke-linecap%3Around%3Bstroke-linejoin%3Amiter%3Bstroke-miterlimit%3A4%3Bstroke-dasharray%3Anone%3Bstroke-opacity%3A1%22%20d%3D%22m%2037.005067%2C32.515233%20h%202.36673%22%20id%3D%22path3284-7%22%20%2F%3E%3Cpath%20style%3D%22fill%3Anone%3Bstroke%3A%23000000%3Bstroke-width%3A0.018em%3Bstroke-linecap%3Abutt%3Bstroke-linejoin%3Amiter%3Bstroke-miterlimit%3A4%3Bstroke-dasharray%3Anone%3Bstroke-opacity%3A1%22%20d%3D%22m%2041.526155%2C22.95126%20c%200.931309%2C-0.103741%201.139979%2C-0.471509%201.25206%2C-1.353677%22%20id%3D%22path3942%22%20%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E';

// Dimensions for outlet SVG
export const OUTLET_WIDTH = 50; // Converted from 17.26193mm in the SVG
export const OUTLET_HEIGHT = 50; // Converted from 23.289mm in the SVG 

// === SECTION: Fluid Properties ===
/**
 * Dynamic viscosity of the fluid (e.g., water at 20°C).
 * Unit: Pascal-seconds (Pa·s)
 */
export const FLUID_VISCOSITY_PAS: number = 0.001;

// === SECTION: Tubing Properties ===
/**
 * Default inner radius for microfluidic tubing.
 * Unit: meters (m)
 * (0.000254 m = 0.254 mm = 0.01 inches = 10 mil. Corresponds to 0.02 inch ID tubing)
 */
export const DEFAULT_TUBE_INNER_RADIUS_M: number = 0.000254;

/**
 * Poiseuille's constant for calculating tubing resistance with default properties.
 * R = (8 * mu * L) / (pi * r^4) = POISEUILLE_CONSTANT * L
 * Unit: Pa·s/m^4 (when multiplied by length in m, gives Pa·s/m^3)
 */
export const POISEUILLE_CONSTANT_DEFAULT: number = 
  (8 * FLUID_VISCOSITY_PAS) / (Math.PI * Math.pow(DEFAULT_TUBE_INNER_RADIUS_M, 4));

// === SECTION: Default Chip Channel Properties ===
/**
 * Default width of microfluidic channels if not specified by the product.
 * Unit: micrometers (µm)
 */
export const DEFAULT_CHANNEL_WIDTH_MICRONS: number = 100;

/**
 * Default depth of microfluidic channels if not specified by the product.
 * Unit: micrometers (µm)
 */
export const DEFAULT_CHANNEL_DEPTH_MICRONS: number = 100;

// === SECTION: Pre-calculated Resistances for Standard Chips ===
// These are initial values from the reference project.
// TODO: Replace these with dynamic calculations based on actual channel dimensions and fluid viscosity.
// Note: Ensure these values are consistent with the assumed dimensions and fluid if used directly.

/** Approx. resistance for a 5mm long, 100x100µm straight channel with water. Unit: Pa·s/m³ */
export const RESISTANCE_STRAIGHT_CHIP_PAS_M3: number = 1.42e12; 

/** Approx. resistance PER SEGMENT for a T-junction (e.g., 2.5mm long, 100x100µm channels). Unit: Pa·s/m³ */
export const RESISTANCE_T_JUNCTION_SEGMENT_PAS_M3: number = 7.11e11; 

/** Approx. resistance PER SEGMENT for an X-junction (e.g., 2.5mm long, 100x100µm channels). Unit: Pa·s/m³ */
export const RESISTANCE_X_JUNCTION_SEGMENT_PAS_M3: number = 7.11e11; 

/** Approx. resistance for a 150mm long, 100x100µm meander channel with water. Unit: Pa·s/m³ */
export const RESISTANCE_MEANDER_CHIP_PAS_M3: number = 4.27e13; 

// === SECTION: Simulation Conversion Factors ===
/** Converts millibar (mbar) to Pascals (Pa) */
export const MBAR_TO_PASCAL: number = 100;
/** Converts Pascals (Pa) to millibar (mbar) */
export const PASCAL_TO_MBAR: number = 0.01;
/** Converts cubic meters per second (m³/s) to microliters per minute (µL/min) */
export const M3S_TO_ULMIN: number = 6e10;
/** Converts cubic meters per second (m³/s) to nanoliters per minute (nL/min) */
export const M3S_TO_NLMIN: number = 6e13;

// === SECTION: Canvas Visual Defaults === 
// (Example: these might live elsewhere or be more extensive)
export const DEFAULT_CHANNEL_FILL_COLOR = '#e3f2fd';
export const DEFAULT_CHANNEL_OUTLINE_COLOR = '#555555';

// Log the calculated Poiseuille constant for verification during development
console.log("Default Poiseuille Constant (for tubing resistance, Pa·s/m^4):", POISEUILLE_CONSTANT_DEFAULT); 