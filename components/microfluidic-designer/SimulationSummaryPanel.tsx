'use client';

import React from 'react';
import type { SimulationResults, CanvasItemData, Connection } from '@/lib/microfluidic-designer/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import FlowDisplayLegend from './canvas/FlowVelocityLegend';
import { getDynamicFlowColor, getPressureIndicatorColor, formatFlowVelocityForDisplay, formatFlowRateForDisplay } from '@/lib/microfluidic-designer/utils/visualizationUtils';
import { AVAILABLE_TUBING_TYPES } from '@/lib/microfluidic-designer/types';

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
      <Card className="w-full mt-4">
        <CardHeader>
          <CardTitle className="text-base">Simulation Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No simulation has been run yet.</p>
        </CardContent>
      </Card>
    );
  }

  const hasErrors = results.errors && results.errors.length > 0;
  const hasWarnings = results.warnings && results.warnings.length > 0;
  const hasResults = Object.keys(results.nodePressures || {}).length > 0 || Object.keys(results.segmentFlows || {}).length > 0;

  let statusText = "No results generated.";
  let statusColor = "text-muted-foreground";
  if (hasErrors) {
    statusText = "Simulation Failed";
    statusColor = "text-red-600";
  } else if (!hasResults && !hasWarnings) {
    statusText = "Simulation Ran (No Flow/Pressure Detected)";
    statusColor = "text-orange-600";
  } else if (hasResults) {
    statusText = "Simulation Complete";
    statusColor = "text-green-600";
  }

  // Basic Stats Calculation (can be expanded)
  const nodePressures = Object.values(results.nodePressures || {});
  const segmentFlows = Object.values(results.segmentFlows || {});
  const minPressure = nodePressures.length > 0 ? Math.min(...nodePressures) : undefined;
  const maxPressure = nodePressures.length > 0 ? Math.max(...nodePressures) : undefined;
  const minFlow = segmentFlows.length > 0 ? Math.min(...segmentFlows.map(f => Math.abs(f))) : undefined;
  const maxFlow = segmentFlows.length > 0 ? Math.max(...segmentFlows.map(f => Math.abs(f))) : undefined;

  // Calculate min/max flow velocities or rates from simulation results for dynamic scaling (match CanvasArea logic)
  let minVelocity = undefined, maxVelocity = undefined;
  let minRate = undefined, maxRate = undefined;
  if (results && results.segmentFlows && connections && droppedItems) {
    const allVelocities: number[] = [];
    const allRates: number[] = [];
    // 1. Connections (tubes)
    connections.forEach(conn => {
      const port1BaseId = conn.fromPortId.startsWith(conn.fromItemId + '_') ? conn.fromPortId.substring(conn.fromItemId.length + 1) : conn.fromPortId;
      const port2BaseId = conn.toPortId.startsWith(conn.toItemId + '_') ? conn.toPortId.substring(conn.toItemId.length + 1) : conn.toPortId;
      const node1Id = `${conn.fromItemId}_${port1BaseId}`;
      const node2Id = `${conn.toItemId}_${port2BaseId}`;
      const segmentIdKey = [node1Id, node2Id].sort().join('--');
      const flowRateM3s = results.segmentFlows[segmentIdKey];
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
    // 2. Internal chip paths (straight/meander)
    droppedItems.forEach(item => {
      if ((item.chipType === 'straight' || item.chipType === 'meander') && item.ports.length === 2) {
        const node1Id = item.ports[0].id;
        const node2Id = item.ports[1].id;
        const segmentIdKey = [node1Id, node2Id].sort().join('--');
        const flowRateM3s = results.segmentFlows[segmentIdKey];
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
      // TODO: Extend to T/X junction internal segments for both modes if needed
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
    <Card className="w-full mt-4 flex-shrink-0">
      <CardHeader>
        <CardTitle className="text-base">Simulation Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[320px] pr-4"> {/* Increased height for legends */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Status:</span>
              <span className={statusColor}>{statusText}</span>
            </div>
            {hasResults && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Min Pressure (Pa):</span>
                  <span>{formatNumber(minPressure)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Max Pressure (Pa):</span>
                  <span>{formatNumber(maxPressure)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Min Flow (m³/s):</span>
                  <span>{formatNumber(minFlow)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Max Flow (m³/s):</span>
                  <span>{formatNumber(maxFlow)}</span>
                </div>
              </>
            )}
            {/* Legends Section */}
            <div className="mt-2 space-y-2">
              {inspectionMode === 'flow' && flowDisplayMode === 'velocity' && (
                <FlowDisplayLegend
                  minDisplayValue={minVelocity ?? 0}
                  maxDisplayValue={maxVelocity ?? 1}
                  displayMode="velocity"
                  getDynamicFlowColor={getDynamicFlowColor}
                  formatValueForDisplay={formatFlowVelocityForDisplay}
                  className="w-full"
                />
              )}
              {inspectionMode === 'flow' && flowDisplayMode === 'rate' && (
                <FlowDisplayLegend
                  minDisplayValue={minRate ?? 0}
                  maxDisplayValue={maxRate ?? 1}
                  displayMode="rate"
                  getDynamicFlowColor={getDynamicFlowColor}
                  formatValueForDisplay={formatFlowRateForDisplay}
                  className="w-full"
                />
              )}
            </div>
            {hasWarnings && (
              <div className="mt-2">
                <p className="text-sm font-medium text-orange-600">Warnings:</p>
                <ul className="list-disc list-inside text-xs text-orange-500">
                  {results.warnings?.map((warn, index) => <li key={`warn-${index}`}>{warn}</li>)}
                </ul>
              </div>
            )}
            {hasErrors && (
              <div className="mt-2">
                <p className="text-sm font-medium text-red-600">Errors:</p>
                <ul className="list-disc list-inside text-xs text-red-500">
                  {results.errors?.map((err, index) => <li key={`err-${index}`}>{err}</li>)}
                </ul>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default SimulationSummaryPanel; 