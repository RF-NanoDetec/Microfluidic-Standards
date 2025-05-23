'use client';

import React from 'react';

interface PressureDisplayLegendProps {
  minPressurePa: number;
  maxPressurePa: number;
  getPressureIndicatorColor: (pressurePa: number, minPa?: number, maxPa?: number) => string;
  className?: string;
}

const PASCAL_TO_MBAR = 0.01;
const MBAR_TO_BAR = 0.001;

// Threshold for considering a pressure value effectively zero (in Pascals)
const PRESSURE_NEAR_ZERO_THRESHOLD_PA = 0.1; // e.g., 0.001 mbar
// Threshold for considering the range of pressures too small to show a gradient (in Pascals)
const PRESSURE_RANGE_NEGLIGIBLE_THRESHOLD_PA = 1; // e.g., 0.01 mbar difference

const formatPressureForDisplay = (pressurePa: number): string => {
  const pressureMbar = pressurePa * PASCAL_TO_MBAR;
  if (Math.abs(pressureMbar) >= 1000) {
    const pressureBar = pressureMbar * MBAR_TO_BAR;
    // For bar, decide on precision, e.g., to 2 or 3 decimal places if not an integer
    if (Math.abs(pressureBar) < 0.01 && pressureBar !== 0) return pressureBar.toExponential(1) + ' bar';
    return pressureBar.toFixed(2) + ' bar';
  }
  if (Math.abs(pressureMbar) < 0.001 && pressureMbar !== 0) return pressureMbar.toExponential(1) + ' mbar';
  return pressureMbar.toFixed(2) + ' mbar';
};

const PressureDisplayLegend: React.FC<PressureDisplayLegendProps> = ({
  minPressurePa,
  maxPressurePa,
  getPressureIndicatorColor,
  className = '',
}) => {
  const numberOfSteps = 20; // Keep 20 steps for a smoother gradient
  const gradientSegments: React.ReactNode[] = [];

  const isMinPressureValid = isFinite(minPressurePa);
  const isMaxPressureValid = isFinite(maxPressurePa);

  let displayMinPressurePa = isMinPressureValid ? minPressurePa : 0;
  let displayMaxPressurePa = isMaxPressureValid ? maxPressurePa : 0;

  if (!isMinPressureValid && isMaxPressureValid) displayMinPressurePa = displayMaxPressurePa;
  if (isMinPressureValid && !isMaxPressureValid) displayMaxPressurePa = displayMinPressurePa;
  if (displayMinPressurePa > displayMaxPressurePa) {
    [displayMinPressurePa, displayMaxPressurePa] = [displayMaxPressurePa, displayMinPressurePa];
  }
  
  const isEffectivelyNoPressure = displayMaxPressurePa < PRESSURE_NEAR_ZERO_THRESHOLD_PA;
  const isRangeTooSmall = Math.abs(displayMaxPressurePa - displayMinPressurePa) < PRESSURE_RANGE_NEGLIGIBLE_THRESHOLD_PA && !isEffectivelyNoPressure;

  const segmentHeight = '12px'; // Consistent with previous PressureLegend, FlowLegend uses 20px, can adjust later if needed.

  if (isEffectivelyNoPressure) {
    gradientSegments.push(
      <div
        key="no-pressure-segment"
        style={{
          width: '100%',
          height: segmentHeight,
          backgroundColor: getPressureIndicatorColor(0, displayMinPressurePa, displayMaxPressurePa),
        }}
      />
    );
  } else if (isRangeTooSmall) {
    gradientSegments.push(
      <div
        key="uniform-pressure-segment"
        style={{
          width: '100%',
          height: segmentHeight,
          backgroundColor: getPressureIndicatorColor(displayMinPressurePa, displayMinPressurePa, displayMaxPressurePa),
        }}
      />
    );
  } else {
    for (let i = 0; i < numberOfSteps; i++) {
      const fraction = (numberOfSteps > 1) ? (i / (numberOfSteps - 1)) : 0.5;
      const currentValue = displayMinPressurePa + fraction * (displayMaxPressurePa - displayMinPressurePa);
      const color = getPressureIndicatorColor(currentValue, displayMinPressurePa, displayMaxPressurePa);
      gradientSegments.push(
        <div
          key={`pressure-segment-${i}`}
          style={{
            flex: 1,
            height: segmentHeight,
            backgroundColor: color,
          }}
        />
      );
    }
  }

  const minLabel = formatPressureForDisplay(displayMinPressurePa);
  const maxLabel = (!isEffectivelyNoPressure || !isRangeTooSmall) ? formatPressureForDisplay(displayMaxPressurePa) : "";

  return (
    <div className={className}> {/* External classes take precedence for layout */}
      {/* Title styling from FlowVelocityLegend */}
      <div className="mb-1 font-semibold text-center text-xs">Pressure</div>
      {/* Gradient bar container styling from FlowVelocityLegend (border-zinc-100) */}
      <div className="flex flex-row mb-1 border border-zinc-100 overflow-hidden" style={{ height: segmentHeight }}>
        {gradientSegments}
      </div>
      {/* Min/max label container styling from FlowVelocityLegend */}
      <div className="flex justify-between text-[9px]">
        <span>{minLabel}</span>
        {maxLabel && <span>{maxLabel}</span>}
      </div>
      {/* Edge case message styling from FlowVelocityLegend */}
      {isEffectivelyNoPressure && (
         <div className="text-center mt-1 text-[9px]">(No significant pressure)</div>
      )}
       {isRangeTooSmall && !isEffectivelyNoPressure && (
         <div className="text-center mt-1 text-[9px]">(Uniform pressure)</div>
      )}
    </div>
  );
};

export default PressureDisplayLegend; 