import { M3S_TO_ULMIN, PASCAL_TO_MBAR, M3S_TO_NLMIN } from '@/lib/microfluidic-designer/constants';
import type { FlowDisplayMode } from '@/components/microfluidic-designer/CanvasArea'; // Import type if needed

// Flow visualization constants
const FLOW_COLOR_NO_DATA = '#d0d0d0'; // Grey for no data / NaN
const FLOW_COLOR_ZERO = '#a0a0a0'; // Slightly different grey for zero flow
const FLOW_COLOR_LOW = '#64b5f6'; // Light Blue
const FLOW_COLOR_HIGH = '#d32f2f'; // Red

// *** NEW: Define a relative epsilon for comparing min/max ***
export const RELATIVE_EPSILON = 1e-9; // Threshold for considering min/max effectively equal

// Restore the original gradient logic
export const getDynamicFlowColor = (
  flowValue: number | undefined,
  minValue: number,
  maxValue: number,
  mode: FlowDisplayMode = 'velocity'
): string => {
  if (flowValue === undefined || !isFinite(flowValue)) {
    return FLOW_COLOR_NO_DATA;
  }

  // Handle invalid range: minValue > maxValue.
  if (minValue > maxValue) {
    console.warn(`[getDynamicFlowColor] Invalid range: minValue (${minValue}) > maxValue (${maxValue}). Returning FLOW_COLOR_NO_DATA.`);
    return FLOW_COLOR_NO_DATA;
  }

  const range = maxValue - minValue;

  // Check for uniform flow: If min and max are effectively the same.
  // If the range is negligibly small (compared to maxValue or just absolutely small), consider it uniform flow.
  // Use RELATIVE_EPSILON for comparison if maxValue is significantly larger than zero,
  // otherwise use an absolute epsilon for cases where maxValue itself is very small or zero.
  const absoluteEpsilon = 1e-12; // A small absolute threshold for range when maxValue is tiny
  const isUniformFlow = range < absoluteEpsilon || (maxValue !== 0 && Math.abs(range / maxValue) < RELATIVE_EPSILON);

  if (isUniformFlow) {
    // For uniform flow, always return FLOW_COLOR_LOW (blue), regardless of the actual flow value.
    // This ensures that even if the uniform flow is zero or very small, it's shown as blue.
    console.log(`[getDynamicFlowColor] Uniform flow detected (range ~ ${range.toExponential()}, min=${minValue}, max=${maxValue}). Using FLOW_COLOR_LOW.`);
    return FLOW_COLOR_LOW;
  }

  // If not uniform flow, proceed with palette-based coloring.
  const absValue = Math.abs(flowValue);

  // The old conditions for `absValue < zeroThreshold` returning FLOW_COLOR_ZERO and
  // `maxValue < zeroThreshold` returning FLOW_COLOR_ZERO are intentionally removed.
  // Low non-uniform flow values will now be colored by the start of the palette.
  // If minValue and maxValue are both zero (or very close), it's handled by the uniform flow check above.

  const normalizedValue = range > 0 ? Math.max(0, Math.min((absValue - minValue) / range, 1)) : 0;

  // *** Use the current global palette ***
  const selectedPalette = palettes[CURRENT_PALETTE_NAME];

  if (!selectedPalette || selectedPalette.length < 2) {
    console.warn(`[getDynamicFlowColor] Palette "${CURRENT_PALETTE_NAME}" is not defined or has fewer than 2 stops. Falling back to default blue-red gradient.`);
    // Fallback to simple linear interpolation between FLOW_COLOR_LOW (blue) and FLOW_COLOR_HIGH (red)
    const r = Math.round(100 + (211 - 100) * normalizedValue);
    const g = Math.round(181 + (47 - 181) * normalizedValue);
    const b = Math.round(246 + (47 - 246) * normalizedValue);
    return `rgb(${r},${g},${b})`;
  }

  // Find the two stops the normalizedValue falls between
  let lowerStop = selectedPalette[0];
  let upperStop = selectedPalette[selectedPalette.length - 1];

  for (let i = 0; i < selectedPalette.length - 1; i++) {
    if (normalizedValue >= selectedPalette[i].stop && normalizedValue <= selectedPalette[i+1].stop) {
      lowerStop = selectedPalette[i];
      upperStop = selectedPalette[i+1];
      break;
    }
  }
  
  // Adjust normalizedValue to be relative to the current segment (lowerStop to upperStop)
  const segmentRange = upperStop.stop - lowerStop.stop;
  let t = 0;
  if (segmentRange > 1e-9) { // Avoid division by zero for segment
      t = (normalizedValue - lowerStop.stop) / segmentRange;
  } else { // If segment range is zero (e.g. duplicate stops or at the very end), use 0 or 1
      t = normalizedValue >= upperStop.stop ? 1 : 0;
  }
  
  return interpolateColor(lowerStop.color, upperStop.color, t);
  // *** END NEW PALETTE LOGIC ***
};

interface ColorStop {
  color: string; // Hex string e.g., "#FF0000"
  stop: number;  // Normalized value (0.0 to 1.0)
}

type Palette = ColorStop[];

const palettes: Record<string, Palette> = {
  active_blue_yellow_red: [
    { color: '#003C7E', stop: 0.0 }, // Brand Blue
    { color: '#FFFACD', stop: 0.5 }, // Lemon Chiffon (Light Yellow)
    { color: '#B91C1C', stop: 1.0 }  // Scientific Deep Red
  ],
  /* OPTION 1: Viridis-like (Simplified) */
  viridis_like: [
   { color: '#003C7E', stop: 0.0 },    // Deep Blue
   { color: '#5BC0DE', stop: 0.25 },   // Cyan / Light Blue
   { color: '#FFFACD', stop: 0.5 },    // Lemon Yellow
   { color: '#FFA500', stop: 0.75 },   // Orange
   { color: '#B91C1C', stop: 1.0 }     // Scientific Deep Red
   ],
  /* NEW FLOW PALETTE */
  green_company_blue_company_red: [
    { color: '#37B45C', stop: 0.0 },    // Medium Green
    { color: '#4A81BE', stop: 0.5 },    // Medium Blue
    { color: '#DB6161', stop: 1.0 }     // Medium Red
  ],
  /* NEW PRESSURE PALETTE */
  company_blue_company_red_pressure: [
    { color: '#4A81BE', stop: 0.0 },    // Medium Blue
    { color: '#DB6161', stop: 1.0 }     // Medium Red
  ],
  /* OPTION 2: Classic Rainbow (Blue-Green-Red) */
  // rainbow: [
  //   { color: '#0000FF', stop: 0.0 },    // Blue
  //   { color: '#00FFFF', stop: 0.25 },   // Cyan
  //   { color: '#00FF00', stop: 0.5 },    // Green
  //   { color: '#FFFF00', stop: 0.75 },   // Yellow
  //   { color: '#FF0000', stop: 1.0 }     // Red
  // ],
  /* OPTION 3: Grayscale */
  // grayscale: [
  //   { color: '#000000', stop: 0.0 },    // Black
  //   { color: '#FFFFFF', stop: 1.0 }     // White
  // ],
  /* OPTION 4: Plasma (Purple-Red-Yellow) */
  plasma: [
    { color: '#0D0887', stop: 0.0 },    // Dark Purple
    { color: '#F0F921', stop: 0.5 },    // Pink/Red
    { color: '#CC4778', stop: 1.0 }     // Orange
    ],
};

const CURRENT_PALETTE_NAME = 'green_company_blue_company_red'; // Change this string to switch palettes
const PRESSURE_PALETTE_NAME = 'company_blue_company_red_pressure'; // Palette for pressure visualization

export const getPressureIndicatorColor = (
  pressurePa: number | undefined,
  minOverallPressurePa?: number,
  maxOverallPressurePa?: number
): string => {
  const COLOR_ZERO = 'rgb(138, 146, 155)'; // #8A929B Mid Grey for undefined/fallback
  const selectedPalette = palettes[PRESSURE_PALETTE_NAME]; // Use the dedicated pressure palette

  if (!selectedPalette || selectedPalette.length < 2) {
    console.error(`[getPressureIndicatorColor] Palette "${PRESSURE_PALETTE_NAME}" is not defined or has fewer than 2 stops. Falling back to grey.`);
    return COLOR_ZERO;
  }

  if (pressurePa === undefined || !isFinite(pressurePa)) {
    return COLOR_ZERO;
  }

  if (
    minOverallPressurePa !== undefined &&
    maxOverallPressurePa !== undefined &&
    isFinite(minOverallPressurePa) &&
    isFinite(maxOverallPressurePa) &&
    maxOverallPressurePa > minOverallPressurePa
  ) {
    const range = maxOverallPressurePa - minOverallPressurePa;
    let normalizedPressure = 0;
    if (range > 1e-9) { // Avoid division by zero if range is negligible
        normalizedPressure = Math.max(0, Math.min((pressurePa - minOverallPressurePa) / range, 1));
    } else { // If range is zero or negligible, all pressures effectively map to the first color or an average
        normalizedPressure = 0; // Or 0.5 if you prefer mid-color of a 2-stop palette
    }

    // Find the two stops the normalizedPressure falls between
    let lowerStop = selectedPalette[0];
    let upperStop = selectedPalette[selectedPalette.length - 1];

    for (let i = 0; i < selectedPalette.length - 1; i++) {
      if (normalizedPressure >= selectedPalette[i].stop && normalizedPressure <= selectedPalette[i+1].stop) {
        lowerStop = selectedPalette[i];
        upperStop = selectedPalette[i+1];
        break;
      }
    }
    
    // Adjust normalizedPressure to be relative to the current segment (lowerStop to upperStop)
    const segmentRange = upperStop.stop - lowerStop.stop;
    let t = 0;
    if (segmentRange > 1e-9) { // Avoid division by zero for segment
        t = (normalizedPressure - lowerStop.stop) / segmentRange;
    } else { // If segment range is zero (e.g. duplicate stops or at the very end), use 0 or 1
        t = normalizedPressure >= upperStop.stop ? 1 : 0;
    }
    
    return interpolateColor(lowerStop.color, upperStop.color, t);

  } else {
    // Fallback if dynamic range is not available/valid - this uses the first and last color of the selected palette for a simple distinction
    console.warn("[getPressureIndicatorColor] Dynamic range not provided or invalid. Using fallback with selected palette endpoints.");
    const pressureMbar = pressurePa * PASCAL_TO_MBAR;
    // Simple fallback: if above an arbitrary mbar threshold, use the last color of the palette, else the first.
    if (pressureMbar > 500) { 
      return selectedPalette[selectedPalette.length - 1].color;
    }
    return selectedPalette[0].color;
  }
};

/**
 * Linearly interpolate between two hex colors.
 */
export function interpolateColor(hex1: string, hex2: string, t: number): string {
  // Clamp t
  t = Math.max(0, Math.min(1, t));
  // Convert hex to RGB
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return hex1;
  const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * t);
  const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * t);
  const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * t);
  return `rgb(${r},${g},${b})`;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  // Remove # if present
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map(x => x + x).join('');
  }
  if (hex.length !== 6) return null;
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return { r, g, b };
}

export const formatFlowRateForDisplay = (flowRateM3s: number): string => {
  const absFlowRate = Math.abs(flowRateM3s);
  const plPerMin = absFlowRate * M3S_TO_NLMIN * 1000;
  const nlPerMin = absFlowRate * M3S_TO_NLMIN;
  const ulPerMin = absFlowRate * M3S_TO_ULMIN;
  const mlPerMin = ulPerMin / 1000;
  const lPerMin = mlPerMin / 1000;
  if (plPerMin < 1) {
    return `${(plPerMin).toExponential(2)} pL/min`;
  } else if (plPerMin < 1000) {
    return `${plPerMin.toFixed(2)} pL/min`;
  } else if (nlPerMin < 1000) {
    return `${nlPerMin.toFixed(2)} nL/min`;
  } else if (ulPerMin < 1000) {
    return `${ulPerMin.toFixed(2)} µL/min`;
  } else if (mlPerMin < 1000) {
    return `${mlPerMin.toFixed(2)} mL/min`;
  } else {
    return `${lPerMin.toFixed(2)} L/min`;
  }
};

export const formatFlowVelocityForDisplay = (flowVelocityMps: number): string => {
  const absVelocity = Math.abs(flowVelocityMps);
  const mPerS = absVelocity;
  const cmPerS = mPerS * 100;
  const mmPerS = mPerS * 1000;
  const umPerS = mmPerS * 1000;
  const nmPerS = umPerS * 1000;
  if (nmPerS < 1) {
    return `${(nmPerS).toExponential(2)} nm/s`;
  } else if (nmPerS < 1000) {
    return `${nmPerS.toFixed(2)} nm/s`;
  } else if (umPerS < 1000) {
    return `${umPerS.toFixed(2)} µm/s`;
  } else if (mmPerS < 1000) {
    return `${mmPerS.toFixed(2)} mm/s`;
  } else if (cmPerS < 1000) {
    return `${cmPerS.toFixed(2)} cm/s`;
  } else {
    return `${mPerS.toFixed(2)} m/s`;
  }
};

export {}; // Placeholder to make it a module