import React from 'react';
import type { FlowDisplayMode } from '../CanvasArea';
import { formatFlowRateForDisplay, formatFlowVelocityForDisplay } from '@/lib/microfluidic-designer/utils/visualizationUtils';

// Import the epsilon value for consistency
import { RELATIVE_EPSILON } from '@/lib/microfluidic-designer/utils/visualizationUtils';

interface FlowDisplayLegendProps {
  minDisplayValue: number;
  maxDisplayValue: number;
  displayMode: FlowDisplayMode;
  getDynamicFlowColor: (
    flowValue: number | undefined,
    minValue: number,
    maxValue: number,
    mode?: FlowDisplayMode
  ) => string;
  formatValueForDisplay: (
    value: number,
    mode: FlowDisplayMode
  ) => string;
}

const FlowDisplayLegend: React.FC<FlowDisplayLegendProps> = ({
  minDisplayValue,
  maxDisplayValue,
  displayMode,
  getDynamicFlowColor,
  formatValueForDisplay,
}) => {
  // Determine if the range is negligible (uniform flow)
  const range = maxDisplayValue - minDisplayValue;
  const isUniform = maxDisplayValue > 0 && range / maxDisplayValue < RELATIVE_EPSILON;
  // Also consider the case where max is effectively zero
  const zeroThreshold = displayMode === 'velocity' ? 1e-9 : 1e-13;
  const isZeroFlow = maxDisplayValue < zeroThreshold;

  const legendTitle = displayMode === 'velocity' ? 'Flow Velocity (adaptive units)' : 'Flow Rate (adaptive units)';
  const numberOfSteps = 10; // Number of segments in the gradient bar

  return (
    <div
      className="absolute bottom-4 left-4 bg-white bg-opacity-90 p-3 rounded shadow-md border border-gray-200 text-xs text-gray-700 pointer-events-auto"
    >
      <div className="font-semibold mb-2 text-center">{legendTitle}</div>

      {isZeroFlow ? (
        // Special case: Max value is essentially zero
        <div className="text-center">
          <div
            className="h-3 w-full mb-1 rounded-sm"
            style={{ backgroundColor: getDynamicFlowColor(0, 0, 0, displayMode) }} // Use zero flow color
          ></div>
          <span>Zero Flow</span>
        </div>
      ) : isUniform ? (
        // Uniform Flow Case
        <div className="text-center">
          <div
            className="h-3 w-full mb-1 rounded-sm"
            style={{ backgroundColor: getDynamicFlowColor(maxDisplayValue, minDisplayValue, maxDisplayValue, displayMode) }} // Should return FLOW_COLOR_LOW
          ></div>
          <span>Uniform: {formatValueForDisplay(maxDisplayValue, displayMode)}</span>
        </div>
      ) : (
        // Gradient Flow Case
        <>
          <div className="flex h-3 mb-1">
            {Array.from({ length: numberOfSteps }).map((_, i) => {
              const value = minDisplayValue + (range / numberOfSteps) * (i + 0.5); // Midpoint of segment
              const color = getDynamicFlowColor(
                value,
                minDisplayValue,
                maxDisplayValue,
                displayMode
              );
              return (
                <div
                  key={i}
                  className="flex-1"
                  style={{ backgroundColor: color }}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-gray-600">
            <span>{formatValueForDisplay(minDisplayValue, displayMode)}</span>
            <span>{formatValueForDisplay(maxDisplayValue, displayMode)}</span>
          </div>
          {/* Optional: Add text if min is effectively zero but max is not */}
          {minDisplayValue < zeroThreshold && maxDisplayValue >= zeroThreshold && (
            <div className="text-center text-gray-500 mt-1">(Zero flow shown as grey)</div>
          )}
        </>
      )}
    </div>
  );
};

export default FlowDisplayLegend; 