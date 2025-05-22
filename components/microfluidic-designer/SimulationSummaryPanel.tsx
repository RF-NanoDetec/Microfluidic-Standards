'use client';

import React from 'react';
import type { SimulationResults, CanvasItemData, Connection } from '@/lib/microfluidic-designer/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import FlowDisplayLegend from './canvas/FlowVelocityLegend';
import { getDynamicFlowColor, getPressureIndicatorColor, formatFlowVelocityForDisplay, formatFlowRateForDisplay } from '@/lib/microfluidic-designer/utils/visualizationUtils';
import { AVAILABLE_TUBING_TYPES } from '@/lib/microfluidic-designer/types';
import { Separator } from "@/components/ui/separator";

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
      <aside className="w-full">
        <h2 className="font-roboto-condensed text-xl font-bold text-primary tracking-tight mb-1">
          Simulation Summary
        </h2>
        <p className="font-inter text-xs text-muted-foreground">
          No simulation has been run yet.
        </p>
      </aside>
    );
  }

  const hasErrors = results.errors && results.errors.length > 0;
  const hasWarnings = results.warnings && results.warnings.length > 0;
  const hasResultsData = Object.keys(results.nodePressures || {}).length > 0 || Object.keys(results.segmentFlows || {}).length > 0;

  let statusText = "No results generated.";
  let statusColor = "text-muted-foreground";
  if (hasErrors) {
    statusText = "Simulation Failed";
    statusColor = "text-red-600 dark:text-red-500";
  } else if (!hasResultsData && !hasWarnings) {
    statusText = "Simulation Ran (No Flow/Pressure Detected)";
    statusColor = "text-orange-600 dark:text-orange-500";
  } else if (hasResultsData) {
    statusText = "Simulation Complete";
    statusColor = "text-green-600 dark:text-green-500";
  }

  const nodePressures = Object.values(results.nodePressures || {});
  const segmentFlows = Object.values(results.segmentFlows || {});
  const minPressure = nodePressures.length > 0 ? Math.min(...nodePressures) : undefined;
  const maxPressure = nodePressures.length > 0 ? Math.max(...nodePressures) : undefined;
  const minFlow = segmentFlows.length > 0 ? Math.min(...segmentFlows.map(f => Math.abs(f))) : undefined;
  const maxFlow = segmentFlows.length > 0 ? Math.max(...segmentFlows.map(f => Math.abs(f))) : undefined;

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

  return (
    <aside className="w-full font-inter">
      <h2 className="font-roboto-condensed text-xl font-bold text-primary tracking-tight mb-2">
        Simulation Summary
      </h2>
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="font-medium text-foreground/90">Status:</span>
          <span className={statusColor}>{statusText}</span>
        </div>
        {hasResultsData && (
          <>
            <Separator className="my-2" />
            <div className="flex justify-between text-sm">
              <span className="font-medium text-foreground/90">Min Pressure (Pa):</span>
              <span className="text-muted-foreground">{formatNumber(minPressure)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-medium text-foreground/90">Max Pressure (Pa):</span>
              <span className="text-muted-foreground">{formatNumber(maxPressure)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-medium text-foreground/90">Min Flow (m³/s):</span>
              <span className="text-muted-foreground">{formatNumber(minFlow)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-medium text-foreground/90">Max Flow (m³/s):</span>
              <span className="text-muted-foreground">{formatNumber(maxFlow)}</span>
            </div>
          </>
        )}
        
        {(inspectionMode === 'flow' && flowDisplayMode === 'velocity' && (minVelocity !== undefined || maxVelocity !== undefined)) || 
         (inspectionMode === 'flow' && flowDisplayMode === 'rate' && (minRate !== undefined || maxRate !== undefined)) || 
         hasWarnings || hasErrors ? <Separator className="my-3" /> : null}

        <div className="space-y-3">
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
              <p className="text-sm font-medium text-orange-600 dark:text-orange-500">Warnings:</p>
              <ScrollArea className="h-auto max-h-20 text-xs">
                <ul className="list-disc list-inside text-muted-foreground space-y-0.5 pr-2">
                  {results.warnings?.map((warn, index) => <li key={`warn-${index}`}>{warn}</li>)}
                </ul>
              </ScrollArea>
            </div>
          )}
          {hasErrors && (
            <div>
              <p className="text-sm font-medium text-red-600 dark:text-red-500">Errors:</p>
              <ScrollArea className="h-auto max-h-20 text-xs">
                <ul className="list-disc list-inside text-muted-foreground space-y-0.5 pr-2">
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