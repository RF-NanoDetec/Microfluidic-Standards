'use client';

import React from 'react';
import type { SimulationResults, CanvasItemData, Connection } from '@/lib/microfluidic-designer/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getDynamicFlowColor, getPressureIndicatorColor, formatFlowVelocityForDisplay, formatFlowRateForDisplay } from '@/lib/microfluidic-designer/utils/visualizationUtils';
import { AVAILABLE_TUBING_TYPES } from '@/lib/microfluidic-designer/types';
import { Separator } from "@/components/ui/separator";

// Conversion factor
const PA_TO_MBAR = 0.01;
const MBAR_TO_BAR = 0.001;

interface SimulationSummaryPanelProps {
  results: SimulationResults | null;
  inspectionMode: 'none' | 'pressure' | 'flow';
  flowDisplayMode: 'rate' | 'velocity';
  droppedItems: CanvasItemData[];
  connections: Connection[];
}

const formatNumber = (num: number | undefined, unit: 'mbar' | 'Pa' | 'bar' = 'Pa'): string => {
  if (num === undefined || !isFinite(num)) return 'N/A';

  let displayVal = num;
  let displayUnit: 'mbar' | 'Pa' | 'bar' = unit;

  if (unit === 'Pa') {
    displayVal = num * PA_TO_MBAR;
    displayUnit = 'mbar';
  }

  // Now displayVal is in mbar
  if (Math.abs(displayVal) >= 1000) {
    displayVal = displayVal * MBAR_TO_BAR;
    displayUnit = 'bar';
  }

  if (Math.abs(displayVal) < 1e-9 && Math.abs(displayVal) > 0) return displayVal.toExponential(2) + ' ' + displayUnit;
  if (Math.abs(displayVal) > 1e6) return displayVal.toExponential(2) + ' ' + displayUnit; // Should be less likely after bar conversion
  if (Math.abs(displayVal) < 1e-3 && Math.abs(displayVal) > 0) return displayVal.toExponential(2) + ' ' + displayUnit;
  return displayVal.toFixed(3) + ' ' + displayUnit;
};

const SimulationSummaryPanel: React.FC<SimulationSummaryPanelProps> = ({ results, inspectionMode, flowDisplayMode, droppedItems, connections }) => {
  if (!results) {
    return (
      <aside className="w-full font-inter">
        <h3 className="font-roboto-condensed text-lg font-semibold text-primary tracking-tight mb-1">
          Simulation Summary
        </h3>
        <p className="font-inter text-xs text-muted-foreground">
          No simulation has been run yet.
        </p>
      </aside>
    );
  }

  const hasErrors = results.errors && results.errors.length > 0;
  const hasWarnings = results.warnings && results.warnings.length > 0;
  const hasResultsData = Object.keys(results.nodePressures || {}).length > 0 || Object.keys(results.segmentFlows || {}).length > 0;

  const nodePressures = Object.values(results.nodePressures || {});
  const segmentFlows = Object.values(results.segmentFlows || {});
  const minPressure = nodePressures.length > 0 ? Math.min(...nodePressures) : undefined;
  const maxPressure = nodePressures.length > 0 ? Math.max(...nodePressures) : undefined;

  const componentCounts: { [key: string]: number } = {};
  droppedItems.forEach(item => {
    const typeName = item.chipType.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    componentCounts[typeName] = (componentCounts[typeName] || 0) + 1;
  });
  componentCounts['Connections'] = connections.length;

  return (
    <aside className="w-full font-inter">
      <h3 className="font-roboto-condensed text-lg font-semibold text-primary tracking-tight mb-2">
        Simulation Summary
      </h3>
      <div className="space-y-2 text-xs">
        {hasResultsData && (
          <>
            { !Object.values(componentCounts).every(val => val === 0) && <Separator className="my-1.5" /> }
            <div className="flex justify-between">
              <span className="font-medium text-foreground/90">Min Pressure:</span>
              <span className="text-muted-foreground">{formatNumber(minPressure, 'Pa')}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-foreground/90">Max Pressure:</span>
              <span className="text-muted-foreground">{formatNumber(maxPressure, 'Pa')}</span>
            </div>
            <Separator className="my-1.5" />
            <div>
              <span className="font-medium text-foreground/90">Components Used:</span>
              <ul className="list-disc list-inside pl-2 text-muted-foreground">
                {Object.entries(componentCounts).map(([name, count]) => (
                  <li key={name}>{name}: {count}</li>
                ))}
              </ul>
            </div>
          </>
        )}
        
        {(inspectionMode === 'flow' && flowDisplayMode === 'velocity' && true) || 
         (inspectionMode === 'flow' && flowDisplayMode === 'rate' && true) || 
         hasWarnings || hasErrors ? <Separator className="my-2" /> : null}

        <div className="space-y-2">
          {hasWarnings && (
            <div>
              <p className="text-xs font-medium text-orange-600 dark:text-orange-500">Warnings:</p>
              <ScrollArea className="h-auto max-h-20">
                <ul className="list-disc list-inside text-muted-foreground space-y-0.5 pr-2 text-xs">
                  {results.warnings?.map((warn, index) => <li key={`warn-${index}`}>{warn}</li>)}
                </ul>
              </ScrollArea>
            </div>
          )}
          {hasErrors && (
            <div>
              <p className="text-xs font-medium text-red-600 dark:text-red-500">Errors:</p>
              <ScrollArea className="h-auto max-h-20">
                <ul className="list-disc list-inside text-muted-foreground space-y-0.5 pr-2 text-xs">
                  {results.errors?.map((err, index) => <li key={`err-${index}`}>{err}</li>)}
                </ul>
              </ScrollArea>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default SimulationSummaryPanel; 