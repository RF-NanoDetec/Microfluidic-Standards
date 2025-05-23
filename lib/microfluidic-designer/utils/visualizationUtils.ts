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
  if (flowValue === undefined || !isFinite(flowValue)) return FLOW_COLOR_NO_DATA;
  
  const absValue = Math.abs(flowValue);
  
  // Use appropriate zero threshold based on display mode
  const zeroThreshold = mode === 'velocity' ? 1e-9 : 1e-13; // Thresholds for near-zero
  
  if (absValue < zeroThreshold) return FLOW_COLOR_ZERO; // Effectively zero value

  // Handle invalid range cases first
  if (minValue > maxValue) {
      console.warn(`[getDynamicFlowColor] Invalid range: minValue (${minValue}) > maxValue (${maxValue}). Returning grey.`);
      return FLOW_COLOR_NO_DATA; // Indicate an error state
  }
  if (maxValue < zeroThreshold) {
      // If the maximum value itself is near zero, all values are near zero
      return FLOW_COLOR_ZERO; 
  }

  // *** NEW CHECK: Handle effectively zero range ***
  // Avoid division by zero or near-zero which exaggerates tiny differences
  const range = maxValue - minValue;

  // Check if range is negligible compared to the max value 
  // (ensure maxValue is positive to avoid division by zero)
  if (maxValue > 0 && range / maxValue < RELATIVE_EPSILON) {
    // Range is negligible, treat all values as the same "mid-point" color
    // This handles cases where min === max due to floating point, or very close values
    // console.log(`[getDynamicFlowColor] Negligible range detected (min=${minValue}, max=${maxValue}). Using mid-gradient color.`);
    // const midNormalizedValue = 0.5; 
    // const r = Math.round(100 + (211 - 100) * midNormalizedValue);
    // const g = Math.round(181 + (47 - 181) * midNormalizedValue);
    // const b = Math.round(246 + (47 - 246) * midNormalizedValue);
    // return `rgb(${r},${g},${b})`; // Return mid-gradient color (purple-ish)
    
    // *** NEW LOGIC: Return the LOW color for negligible range ***
    console.log(`[getDynamicFlowColor] Negligible range detected (min=${minValue}, max=${maxValue}). Using FLOW_COLOR_LOW.`);
    return FLOW_COLOR_LOW; // Return blue for uniform flow
  }
  // *** END NEW CHECK ***

  // If we reach here, the range is valid and significant enough.

  // Normalize the value: 0 for minValue, 1 for maxValue
  // Clamp normalized value between 0 and 1
  // Ensure denominator 'range' is not zero before dividing (though the check above should handle near-zero)
  const normalizedValue = range > 0 ? Math.max(0, Math.min((absValue - minValue) / range, 1)) : 0; // Default to 0 if range is exactly zero

  // Simple linear interpolation between FLOW_COLOR_LOW (blue) and FLOW_COLOR_HIGH (red)
  // FLOW_COLOR_LOW: rgb(100, 181, 246) -> #64b5f6
  // FLOW_COLOR_HIGH: rgb(211, 47, 47) -> #d32f2f
  const r = Math.round(100 + (211 - 100) * normalizedValue);
  const g = Math.round(181 + (47 - 181) * normalizedValue);
  const b = Math.round(246 + (47 - 246) * normalizedValue);
  
  return `rgb(${r},${g},${b})`;
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
   { color: '#440154', stop: 0.0 },    // Purple
   { color: '#3B528B', stop: 0.25 },   // Blue
   { color: '#21908C', stop: 0.5 },    // Teal
   { color: '#5DC863', stop: 0.75 },   // Green
   { color: '#FDE725', stop: 1.0 }     // Yellow
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
  // plasma: [
  //   { color: '#0D0887', stop: 0.0 },    // Dark Purple
  //   { color: '#CC4778', stop: 0.5 },    // Pink/Red
  //   { color: '#F0F921', stop: 1.0 }     // Orange
  // ],
};

const CURRENT_PALETTE_NAME = 'viridis_like'; // Change this string to switch palettes

export const getPressureIndicatorColor = (
  pressurePa: number | undefined,
  minOverallPressurePa?: number,
  maxOverallPressurePa?: number
): string => {
  const COLOR_ZERO = 'rgb(138, 146, 155)'; // #8A929B Mid Grey for undefined/fallback
  const selectedPalette = palettes[CURRENT_PALETTE_NAME];

  if (!selectedPalette || selectedPalette.length < 2) {
    console.error(`[getPressureIndicatorColor] Palette "${CURRENT_PALETTE_NAME}" is not defined or has fewer than 2 stops. Falling back to grey.`);
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
function interpolateColor(hex1: string, hex2: string, t: number): string {
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

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
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