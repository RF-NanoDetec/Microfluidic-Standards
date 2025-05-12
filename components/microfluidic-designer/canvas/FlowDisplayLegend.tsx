import React from 'react';

interface FlowDisplayLegendProps { 
  minDisplayValue: number; 
  maxDisplayValue: number; 
  displayMode: 'velocity' | 'rate'; 
  getDynamicFlowColor: (
    value: number | undefined,
    minInRange: number,
    maxInRange: number,
    mode?: 'velocity' | 'rate'
  ) => string;
  formatValueForDisplay: (value: number, mode: 'velocity' | 'rate') => string;
}

const FlowDisplayLegend: React.FC<FlowDisplayLegendProps> = ({ 
  minDisplayValue,
  maxDisplayValue,
  displayMode,
  getDynamicFlowColor,
  formatValueForDisplay,
}) => {
  const numberOfSteps = 10; 
  const gradientSegments = [];

  const nearZeroThreshold = displayMode === 'velocity' ? 1e-9 : 1e-13; 

  const isEffectivelyNoFlow = maxDisplayValue < nearZeroThreshold;
  const isRangeTooSmall = Math.abs(maxDisplayValue - minDisplayValue) < nearZeroThreshold && !isEffectivelyNoFlow;

  if (isEffectivelyNoFlow) {
    gradientSegments.push(
      <div
        key="no-flow-segment"
        style={{
          width: '100%',
          height: '20px',
          backgroundColor: getDynamicFlowColor(0, 0, 0, displayMode), 
        }}
      />
    );
  } else {
    const actualMinForLegendScale = 0;
    const actualMaxForLegendScale = maxDisplayValue;

    for (let i = 0; i < numberOfSteps; i++) {
      const fraction = i / (numberOfSteps - 1); 
      const currentValue = actualMinForLegendScale + fraction * (actualMaxForLegendScale - actualMinForLegendScale);
      const color = getDynamicFlowColor(
        currentValue,
        actualMinForLegendScale,
        actualMaxForLegendScale,
        displayMode
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

  const title = displayMode === 'velocity' ? 'Flow Velocity (adaptive units)' : 'Flow Rate (adaptive units)';
  const minLabel = isEffectivelyNoFlow ? formatValueForDisplay(minDisplayValue, displayMode) : formatValueForDisplay(0, displayMode);
  const maxLabel = maxDisplayValue > nearZeroThreshold ? formatValueForDisplay(maxDisplayValue, displayMode) : "";


  return (
    <div
      style={{
        position: 'absolute',
        bottom: '70px',
        left: '20px',
        padding: '8px',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: '4px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        width: '220px', 
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