import React from 'react';
import clsx from 'clsx';

interface TooltipBoxProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * TooltipBox — Unified tooltip container for pressure, rate, and velocity tooltips.
 * Uses the same style as FlowDisplayLegend for visual consistency.
 */
export const TooltipBox: React.FC<TooltipBoxProps> = ({ children, className, style }) => (
  <div
    className={clsx(
      'bg-white bg-opacity-90 p-3 rounded shadow-md border border-gray-200 text-xs text-gray-700 pointer-events-auto inline-block w-auto max-w-xs',
      className
    )}
    style={style}
  >
    {children}
  </div>
);

export default TooltipBox; 