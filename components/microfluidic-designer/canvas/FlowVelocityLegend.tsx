import React from 'react';
// FLOW_COLOR_ZERO will be sourced via the getDynamicFlowColor function

// NEW: Import FlowDisplayMode type if needed for prop typing, or rely on string
// import type { FlowDisplayMode } from '../CanvasArea'; // Adjust path if needed

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

  const isEffectivelyNoFlow = maxDisplayValue < nearZeroThreshold;
  const isRangeTooSmall = Math.abs(maxDisplayValue - minDisplayValue) < nearZeroThreshold && !isEffectivelyNoFlow;

  if (isEffectivelyNoFlow) {
    // If there's no significant flow, show a single color bar (e.g., zero flow color)
    gradientSegments.push(
      <div
        key="no-flow-segment"
        style={{
          width: '100%',
          height: '20px',
          backgroundColor: getDynamicFlowColor(0, 0, 0), // Use the color for zero flow
        }}
      />
    );
  } else {
    for (let i = 0; i < numberOfSteps; i++) {
      // fraction calculation, simplified as numberOfSteps is fixed > 1
      const fraction = i / (numberOfSteps - 1); // from 0 to 1
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
            height: '20px',
            backgroundColor: color,
          }}
        />
      );
    }
  }

  const title = displayMode === 'velocity' ? 'Flow Velocity' : 'Flow Rate';
  // Note: formatValueForDisplay should handle the conversion to µL/min for 'rate' mode if necessary
  const minLabel = formatValueForDisplay(minDisplayValue, displayMode);
  const maxLabel = maxDisplayValue > nearZeroThreshold ? formatValueForDisplay(maxDisplayValue, displayMode) : "";

  return (
    <div
      className={className}
    >
      <div className="mb-1 font-semibold text-center text-xs">{title}</div>
      <div className="flex flex-row mb-1 border border-zinc-100">
        {gradientSegments}
      </div>
      <div className="flex justify-between text-[9px]">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
      {isEffectivelyNoFlow && (
         <div className="text-center mt-1 text-[9px]"> (No significant flow)</div>
      )}
       {isRangeTooSmall && (
         <div className="text-center mt-1 text-[9px]"> (Uniform low flow)</div>
      )}
    </div>
  );
};

export default FlowDisplayLegend; 