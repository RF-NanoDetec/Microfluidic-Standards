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
}

const FlowDisplayLegend: React.FC<FlowDisplayLegendProps> = ({ // Renamed component
  minDisplayValue,
  maxDisplayValue,
  displayMode,
  getDynamicFlowColor,
  formatValueForDisplay,
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

  const title = displayMode === 'velocity' ? 'Flow Velocity (m/s)' : 'Flow Rate (µL/min)';
  // Note: formatValueForDisplay should handle the conversion to µL/min for 'rate' mode if necessary
  const minLabel = formatValueForDisplay(minDisplayValue, displayMode);
  const maxLabel = maxDisplayValue > nearZeroThreshold ? formatValueForDisplay(maxDisplayValue, displayMode) : "";

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '70px', // Position above canvas control buttons
        left: '20px',
        padding: '8px',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: '4px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        width: '220px', // Slightly wider for potentially longer µL/min text
        fontSize: '10px',
        fontFamily: 'sans-serif',
        color: '#333',
        zIndex: 100, 
      }}
    >
      <div style={{ marginBottom: '4px', fontWeight: '600', textAlign: 'center' }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'row', marginBottom: '4px', border: '1px solid #eee' }}>
        {gradientSegments}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px' }}>
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
      {isEffectivelyNoFlow && (
         <div style={{textAlign: 'center', marginTop: '3px', fontSize: '9px'}}> (No significant flow)</div>
      )}
       {isRangeTooSmall && (
         <div style={{textAlign: 'center', marginTop: '3px', fontSize: '9px'}}> (Uniform low flow)</div>
      )}
    </div>
  );
};

export default FlowDisplayLegend; 