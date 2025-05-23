import React from 'react';
// FLOW_COLOR_ZERO will be sourced via the getDynamicFlowColor function

// NEW: Import FlowDisplayMode type if needed for prop typing, or rely on string
// import type { FlowDisplayMode } from '../CanvasArea'; // Adjust path if needed
import { Slider } from '@/components/ui/slider';
import {
  formatFlowVelocityForDisplay,
  formatFlowRateForDisplay,
  RELATIVE_EPSILON,
  interpolateColor,
  hexToRgb,
} from '@/lib/microfluidic-designer/utils/visualizationUtils';
import { getDynamicFlowColor } from '@/lib/microfluidic-designer/utils/visualizationUtils';

interface FlowDisplayLegendProps { // Renamed props interface
  minDisplayValue: number; // Generic name
  maxDisplayValue: number; // Generic name
  displayMode: 'velocity' | 'rate'; // Explicitly type the mode
  /**
   * Function to get the color for a given velocity based on the current dynamic range.
   */
  getDynamicFlowColor: (
    value: number | undefined,
    minInRange: number,
    maxInRange: number
  ) => string;
  // Helper functions to format the display values based on mode
  formatValueForDisplay: (value: number, mode: 'velocity' | 'rate') => string;
  className?: string;
}

const FlowDisplayLegend: React.FC<FlowDisplayLegendProps> = ({ // Renamed component
  minDisplayValue,
  maxDisplayValue,
  displayMode,
  getDynamicFlowColor,
  formatValueForDisplay,
  className,
}) => {
  const numberOfSteps = 10; // Number of segments in the gradient bar
  const gradientSegments = [];

  // Determine thresholds based on display mode. Rates are m3/s, velocities are m/s.
  const nearZeroThreshold = displayMode === 'velocity' ? 1e-9 : 1e-12; 

  const isEffectivelyNoFlow = maxDisplayValue < nearZeroThreshold && Math.abs(minDisplayValue) < nearZeroThreshold;
  const isUniformFlowContext = Math.abs(maxDisplayValue - minDisplayValue) < nearZeroThreshold && !isEffectivelyNoFlow; // Renamed for clarity
  const segmentHeight = '12px'; // Set consistent height

  let title = displayMode === 'velocity' ? 'Flow Velocity' : 'Flow Rate';
  if (isUniformFlowContext) {
    title = displayMode === 'velocity' ? 'Uniform Flow Velocity' : 'Uniform Flow Rate';
  } else if (isEffectivelyNoFlow) {
    // If it's effectively no flow and not uniform, we can also reflect this in title if desired
    // For now, the existing logic handles this by essentially showing a zero-based legend.
    // Or, we could set title to "No Significant Flow"
  }

  if (isEffectivelyNoFlow && !isUniformFlowContext) { // Show single color bar only if truly no flow AND not uniform zero
    gradientSegments.push(
      <div
        key="no-flow-segment"
        style={{
          width: '100%',
          height: segmentHeight,
          backgroundColor: getDynamicFlowColor(0, 0, 0), 
        }}
      />
    );
  } else { // Handles uniform flow (including uniform zero) and variable flow
    for (let i = 0; i < numberOfSteps; i++) {
      const fraction = numberOfSteps > 1 ? i / (numberOfSteps - 1) : 0; // from 0 to 1
      const currentValue = minDisplayValue + fraction * (maxDisplayValue - minDisplayValue);
      const color = getDynamicFlowColor(
        currentValue,
        minDisplayValue,
        maxDisplayValue
      );
      gradientSegments.push(
        <div
          key={i}
          style={{
            flex: 1,
            height: segmentHeight,
            backgroundColor: color,
          }}
        />
      );
    }
  }

  const minLabel = formatValueForDisplay(minDisplayValue, displayMode);
  // Show maxLabel only if there's significant flow or it's a uniform flow
  const maxLabel = (maxDisplayValue > nearZeroThreshold || isUniformFlowContext) ? formatValueForDisplay(maxDisplayValue, displayMode) : "";

  return (
    <div
      className={className}
    >
      <div className="mb-1 font-semibold text-center text-xs">{title}</div>
      <div className="flex flex-row mb-1 border border-zinc-100 overflow-hidden" style={{ height: segmentHeight }}>
        {gradientSegments}
      </div>
      <div className="flex justify-between text-[9px]">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
};

export default FlowDisplayLegend; 