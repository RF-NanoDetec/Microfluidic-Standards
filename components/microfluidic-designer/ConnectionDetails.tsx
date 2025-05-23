'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Connection } from '@/lib/microfluidic-designer/types';
import { getTubingTypeByMaterial, calculateTubingResistanceByMaterial } from '@/lib/microfluidic-designer/productData';

interface ConnectionDetailsProps {
  connection: Connection;
  onConnectionPropertyChange: (connectionId: string, property: keyof Connection, value: unknown) => void;
}

export function ConnectionDetails({ connection, onConnectionPropertyChange }: ConnectionDetailsProps) {
  const handleMaterialChange = (newMaterial: 'silicone' | 'ptfe' | 'peek') => {
    const tubingType = getTubingTypeByMaterial(newMaterial);
    const newResistance = calculateTubingResistanceByMaterial(connection.lengthMeters, newMaterial);
    
    // Update multiple properties at once
    onConnectionPropertyChange(connection.id, 'tubingMaterial', newMaterial);
    onConnectionPropertyChange(connection.id, 'innerDiameterMm', tubingType.innerDiameterMm);
    onConnectionPropertyChange(connection.id, 'tubingTypeId', tubingType.id);
    onConnectionPropertyChange(connection.id, 'resistance', newResistance);
  };

  const handleLengthChange = (newLengthCm: number) => {
    const newLengthMeters = newLengthCm / 100; // Convert cm to meters
    const newResistance = calculateTubingResistanceByMaterial(newLengthMeters, connection.tubingMaterial);
    
    onConnectionPropertyChange(connection.id, 'lengthMeters', newLengthMeters);
    onConnectionPropertyChange(connection.id, 'resistance', newResistance);
  };

  const formatResistance = (resistance: number) => {
    if (resistance >= 1e12) {
      return `${(resistance / 1e12).toFixed(1)} TPa·s/m³`;
    } else if (resistance >= 1e9) {
      return `${(resistance / 1e9).toFixed(1)} GPa·s/m³`;
    } else if (resistance >= 1e6) {
      return `${(resistance / 1e6).toFixed(1)} MPa·s/m³`;
    } else {
      return `${resistance.toExponential(1)} Pa·s/m³`;
    }
  };

  return (
    <div className="space-y-3">
      {/* Material Selection */}
      <div className="space-y-2">
        <Label className="text-xs font-medium">Material</Label>
        <Select
          value={connection.tubingMaterial}
          onValueChange={handleMaterialChange}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="silicone">Silicone</SelectItem>
            <SelectItem value="ptfe">PTFE</SelectItem>
            <SelectItem value="peek">PEEK</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Length Input */}
      <div className="space-y-2">
        <Label className="text-xs font-medium">Length (cm)</Label>
        <Input
          type="number"
          step="1"
          min="1"
          max="1000"
          value={Math.round(connection.lengthMeters * 100)}
          onChange={(e) => handleLengthChange(parseFloat(e.target.value) || 5)}
          className="h-8 text-xs"
        />
      </div>

      {/* Additional Properties */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <span className="font-medium">Inner Diameter:</span>
          <p className="text-muted-foreground">{connection.innerDiameterMm.toFixed(1)}mm</p>
        </div>
        <div>
          <span className="font-medium">Resistance:</span>
          <p className="text-muted-foreground">{formatResistance(connection.resistance)}</p>
        </div>
      </div>

      {/* Material Properties (compact) */}
      <div className="text-[10px] text-muted-foreground">
        {connection.tubingMaterial === 'silicone' && 'Flexible, -50°C to 200°C'}
        {connection.tubingMaterial === 'ptfe' && 'Chemical resistant, -200°C to 260°C'}
        {connection.tubingMaterial === 'peek' && 'High temp stability, -50°C to 250°C'}
      </div>
    </div>
  );
} 