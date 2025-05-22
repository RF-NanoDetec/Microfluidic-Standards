'use client';

import React from 'react';
import type { SimulationResults, CanvasItemData, Connection } from '@/lib/microfluidic-designer/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import FlowDisplayLegend from './canvas/FlowVelocityLegend';
import { getDynamicFlowColor, getPressureIndicatorColor, formatFlowVelocityForDisplay, formatFlowRateForDisplay } from '@/lib/microfluidic-designer/utils/visualizationUtils';
import { AVAILABLE_TUBING_TYPES } from '@/lib/microfluidic-designer/types';
import { Separator } from "@/components/ui/separator";

// Conversion factor
const PA_TO_MBAR = 0.01;

interface SimulationSummaryPanelProps {
  results: SimulationResults | null;
  inspectionMode: 'none' | 'pressure' | 'flow';
  flowDisplayMode: 'rate' | 'velocity';
  droppedItems: CanvasItemData[];
  connections: Connection[];
}

const formatNumber = (num: number | undefined): string => {
  if (num === undefined || !isFinite(num)) return 'N/A';
  if (Math.abs(num) < 1e-9 && Math.abs(num) > 0) return num.toExponential(2);
  if (Math.abs(num) > 1e6) return num.toExponential(2);
  if (Math.abs(num) < 1e-3 && Math.abs(num) > 0) return num.toExponential(2);
  return num.toFixed(3);
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

  let minVelocity = undefined, maxVelocity = undefined;
  let minRate = undefined, maxRate = undefined;
  if (results && results.segmentFlows && connections && droppedItems) {
    const allVelocities: number[] = [];
    const allRates: number[] = [];
    connections.forEach(conn => {
      const port1BaseId = conn.fromPortId.startsWith(conn.fromItemId + '_') ? conn.fromPortId.substring(conn.fromItemId.length + 1) : conn.fromPortId;
      const port2BaseId = conn.toPortId.startsWith(conn.toItemId + '_') ? conn.toPortId.substring(conn.toItemId.length + 1) : conn.toPortId;
      const node1Id = `${conn.fromItemId}_${port1BaseId}`;
      const node2Id = `${conn.toItemId}_${port2BaseId}`;
      const segmentIdKey = [node1Id, node2Id].sort().join('--');
      const flowRateM3s = results.segmentFlows![segmentIdKey];
      if (flowRateM3s !== undefined && isFinite(flowRateM3s)) {
        allRates.push(Math.abs(flowRateM3s));
        const tubingType = AVAILABLE_TUBING_TYPES.find(t => t.id === conn.tubingTypeId);
        if (tubingType && tubingType.innerRadiusMeters > 0) {
          const areaM2 = Math.PI * Math.pow(tubingType.innerRadiusMeters, 2);
          const velocity = flowRateM3s / areaM2;
          allVelocities.push(Math.abs(velocity));
        }
      }
    });
    droppedItems.forEach(item => {
      if ((item.chipType === 'straight' || item.chipType === 'meander') && item.ports.length === 2) {
        const node1Id = item.ports[0]!.id;
        const node2Id = item.ports[1]!.id;
        const segmentIdKey = [node1Id, node2Id].sort().join('--');
        const flowRateM3s = results.segmentFlows![segmentIdKey];
        if (flowRateM3s !== undefined && isFinite(flowRateM3s)) {
          allRates.push(Math.abs(flowRateM3s));
          if (item.currentChannelWidthMicrons > 0 && item.currentChannelDepthMicrons > 0) {
            const widthM = item.currentChannelWidthMicrons * 1e-6;
            const heightM = item.currentChannelDepthMicrons * 1e-6;
            const areaM2 = widthM * heightM;
            const velocity = flowRateM3s / areaM2;
            allVelocities.push(Math.abs(velocity));
          }
        }
      }
    });
    if (allVelocities.length > 0) {
      minVelocity = Math.min(...allVelocities);
      maxVelocity = Math.max(...allVelocities);
    }
    if (allRates.length > 0) {
      minRate = Math.min(...allRates);
      maxRate = Math.max(...allRates);
    }
  }

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
              <span className="font-medium text-foreground/90">Min Pressure (mbar):</span>
              <span className="text-muted-foreground">{formatNumber(minPressure !== undefined ? minPressure * PA_TO_MBAR : undefined)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-foreground/90">Max Pressure (mbar):</span>
              <span className="text-muted-foreground">{formatNumber(maxPressure !== undefined ? maxPressure * PA_TO_MBAR : undefined)}</span>
            </div>
            {flowDisplayMode === 'rate' && (minRate !== undefined || maxRate !== undefined) && (
              <>
                <div className="flex justify-between">
                  <span className="font-medium text-foreground/90">Min Flow Rate (m³/s):</span>
                  <span className="text-muted-foreground">{formatNumber(minRate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-foreground/90">Max Flow Rate (m³/s):</span>
                  <span className="text-muted-foreground">{formatNumber(maxRate)}</span>
                </div>
              </>
            )}
            {flowDisplayMode === 'velocity' && (minVelocity !== undefined || maxVelocity !== undefined) && (
              <>
                <div className="flex justify-between">
                  <span className="font-medium text-foreground/90">Min Flow Velocity (m/s):</span>
                  <span className="text-muted-foreground">{formatNumber(minVelocity)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-foreground/90">Max Flow Velocity (m/s):</span>
                  <span className="text-muted-foreground">{formatNumber(maxVelocity)}</span>
                </div>
              </>
            )}
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
        
        {(inspectionMode === 'flow' && flowDisplayMode === 'velocity' && (minVelocity !== undefined || maxVelocity !== undefined)) || 
         (inspectionMode === 'flow' && flowDisplayMode === 'rate' && (minRate !== undefined || maxRate !== undefined)) || 
         hasWarnings || hasErrors ? <Separator className="my-2" /> : null}

        <div className="space-y-2">
          {inspectionMode === 'flow' && flowDisplayMode === 'velocity' && (minVelocity !== undefined || maxVelocity !== undefined) && (
            <FlowDisplayLegend
              minDisplayValue={minVelocity ?? 0}
              maxDisplayValue={maxVelocity ?? 0.001}
              displayMode="velocity"
              getDynamicFlowColor={getDynamicFlowColor}
              formatValueForDisplay={formatFlowVelocityForDisplay}
              className="w-full text-xs"
            />
          )}
          {inspectionMode === 'flow' && flowDisplayMode === 'rate' && (minRate !== undefined || maxRate !== undefined) && (
            <FlowDisplayLegend
              minDisplayValue={minRate ?? 0}
              maxDisplayValue={maxRate ?? 0.000001}
              displayMode="rate"
              getDynamicFlowColor={getDynamicFlowColor}
              formatValueForDisplay={formatFlowRateForDisplay}
              className="w-full text-xs"
            />
          )}

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