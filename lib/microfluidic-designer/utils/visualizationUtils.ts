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

export const getPressureIndicatorColor = (
  pressurePa: number | undefined,
  minOverallPressurePa?: number, // New optional parameter
  maxOverallPressurePa?: number  // New optional parameter
): string => {
  const COLOR_ZERO = 'rgb(138, 146, 155)'; // #8A929B Mid Grey
  const COLOR_LOW_PRESSURE = 'rgb(0, 60, 126)';  // #003C7E Brand Blue
  const COLOR_HIGH_PRESSURE = 'rgb(185, 28, 28)'; // #B91C1C Scientific Deep Red

  if (pressurePa === undefined || !isFinite(pressurePa)) {
    return COLOR_ZERO; // For undefined or non-finite pressure
  }

  // If min and max overall pressures are provided and valid, use dynamic scaling
  if (
    minOverallPressurePa !== undefined &&
    maxOverallPressurePa !== undefined &&
    isFinite(minOverallPressurePa) &&
    isFinite(maxOverallPressurePa) &&
    maxOverallPressurePa > minOverallPressurePa
  ) {
    const range = maxOverallPressurePa - minOverallPressurePa;
    // Normalize pressurePa: 0 for minOverallPressurePa, 1 for maxOverallPressurePa
    // Clamp normalized value between 0 and 1
    const normalizedPressure = Math.max(0, Math.min((pressurePa - minOverallPressurePa) / range, 1));

    // Linear interpolation between COLOR_LOW_PRESSURE and COLOR_HIGH_PRESSURE
    const r = Math.round(0 + (185 - 0) * normalizedPressure);       // 0 (blue) to 185 (red)
    const g = Math.round(60 + (28 - 60) * normalizedPressure);     // 60 (blue) to 28 (red)
    const b = Math.round(126 + (28 - 126) * normalizedPressure);  // 126 (blue) to 28 (red)
    
    return `rgb(${r},${g},${b})`;
  } else {
    // Fallback to a simplified or fixed scheme if dynamic range is not available/valid
    // This part can be adjusted. For now, a simple high pressure = red, else blue.
    // This fallback is less ideal and should ideally be avoided by passing valid ranges.
    console.warn("[getPressureIndicatorColor] Dynamic range not provided or invalid. Using fallback.");
    const pressureMbar = pressurePa * PASCAL_TO_MBAR;
    if (pressureMbar > 500) { // Arbitrary threshold for fallback
      return COLOR_HIGH_PRESSURE;
    }
    if (pressureMbar < 10) { // Arbitrary threshold for fallback
        return COLOR_LOW_PRESSURE;
    }
    // For intermediate values in fallback, we can return a mid-point or one of the colors
    return 'rgb(128, 128, 128)'; // Fallback to a neutral grey for intermediate
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