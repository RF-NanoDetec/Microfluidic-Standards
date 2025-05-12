import { M3S_TO_ULMIN, PASCAL_TO_MBAR, M3S_TO_NLMIN } from '@/lib/microfluidic-designer/constants';
import type { FlowDisplayMode } from '@/components/microfluidic-designer/CanvasArea'; // Import type if needed

// Flow visualization constants
const FLOW_COLOR_NO_DATA = '#d0d0d0'; // Grey for no data / NaN
const FLOW_COLOR_ZERO = '#a0a0a0'; // Slightly different grey for zero flow
const FLOW_COLOR_LOW = '#64b5f6'; // Light Blue
const FLOW_COLOR_HIGH = '#d32f2f'; // Red

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

  // If range is invalid or max is near zero, return low color
  if (maxValue <= minValue || maxValue < zeroThreshold) { 
    return FLOW_COLOR_LOW; 
  }

  // Normalize the value: 0 for minValue, 1 for maxValue
  // Clamp normalized value between 0 and 1
  const normalizedValue = Math.max(0, Math.min((absValue - minValue) / (maxValue - minValue), 1));

  // Simple linear interpolation between FLOW_COLOR_LOW (blue) and FLOW_COLOR_HIGH (red)
  // FLOW_COLOR_LOW: rgb(100, 181, 246) -> #64b5f6
  // FLOW_COLOR_HIGH: rgb(211, 47, 47) -> #d32f2f
  const r = Math.round(100 + (211 - 100) * normalizedValue);
  const g = Math.round(181 + (47 - 181) * normalizedValue);
  const b = Math.round(246 + (47 - 246) * normalizedValue);
  
  return `rgb(${r},${g},${b})`;
};

export const getPressureIndicatorColor = (pressurePa: number | undefined): string => {
  if (pressurePa === undefined || !isFinite(pressurePa)) return '#888888';
  const pressureMbar = pressurePa * PASCAL_TO_MBAR;
  if (Math.abs(pressureMbar) < 1) return '#a0a0a0';
  if (pressureMbar > 0) {
    const normalizedPressure = Math.min(pressureMbar / 1000, 1);
    if (normalizedPressure < 0.33) return '#90caf9';
    if (normalizedPressure < 0.66) return '#2196f3';
    return '#1565c0';
  } else {
    const normalizedPressure = Math.min(Math.abs(pressureMbar) / 1000, 1);
    if (normalizedPressure < 0.33) return '#ffcc80';
    if (normalizedPressure < 0.66) return '#ff9800';
    return '#e65100';
  }
};

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