'use client';

import React, { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Info, Trash2, ShoppingCart, Package, Ruler, Circle } from 'lucide-react';

import type { CanvasItemData, Connection } from '@/lib/microfluidic-designer/types';
import { ConnectionDetails } from './ConnectionDetails';
import { calculateRectangularChannelResistance } from "@/lib/microfluidic-designer/resistanceUtils";
import { FLUID_VISCOSITY_PAS } from "@/lib/microfluidic-designer/constants";
import { useCartStore } from '@/store/cartStore';
import { getVariantById, PARENT_PRODUCTS, getVariantsForProduct } from '@/lib/microfluidic-designer/productData';


interface DetailsSidebarProps {
  selectedItem?: CanvasItemData;
  selectedConnection?: Connection;
  droppedItems: CanvasItemData[];
  connections: Connection[];
  onItemPropertyChange?: (itemId: string, propertyName: keyof CanvasItemData, value: unknown) => void;
  onConnectionPropertyChange?: (connectionId: string, property: keyof Connection, value: unknown) => void;
  onDeleteItem?: (itemId: string) => void;
  onDeleteConnection?: (connectionId: string) => void;
}

interface ComponentSummary {
  id: string;
  name: string;
  variantName?: string;
  sku?: string;
  price?: number;
  quantity: number;
  chipType: string;
  imageUrl?: string;
  variantId?: string;
}

interface TubingSummary {
  material: string;
  diameter: string;
  totalLength: number;
  estimatedPrice: number;
}

export default function DetailsSidebar({ 
  selectedItem, 
  selectedConnection, 
  droppedItems, 
  connections, 
  onItemPropertyChange, 
  onConnectionPropertyChange, 
  onDeleteItem, 
  onDeleteConnection 
}: DetailsSidebarProps) {
  const addToCart = useCartStore((state) => state.addToCart);


  const handleVariantChange = (variantId: string) => {
    if (!selectedItem || !onItemPropertyChange) return;
    const variant = getVariantById(variantId);
    if (!variant) return;

    // Extract channel width from variant
    const channelWidthAttr = variant.attributes.find(attr => attr.name === 'channelWidth');
    const channelDepthAttr = variant.attributes.find(attr => attr.name === 'channelDepth');
    
    if (channelWidthAttr && typeof channelWidthAttr.value === 'number') {
      onItemPropertyChange(selectedItem.id, 'currentChannelWidthMicrons', channelWidthAttr.value);
    }
    if (channelDepthAttr && typeof channelDepthAttr.value === 'number') {
      onItemPropertyChange(selectedItem.id, 'currentChannelDepthMicrons', channelDepthAttr.value);
    }
    
    // Update selected variant
    onItemPropertyChange(selectedItem.id, 'selectedVariantId', variantId);
    onItemPropertyChange(selectedItem.id, 'name', variant.variantName);
  };

  const handlePortPressureChange = (portIdToUpdate: string, newPressureString: string) => {
    if (!selectedItem || !onItemPropertyChange || selectedItem.chipType !== 'pump' || !selectedItem.portPressures) return;
    const newPressure = parseFloat(newPressureString);
    if (isNaN(newPressure)) return;

    const updatedPortPressures = {
      ...selectedItem.portPressures,
      [portIdToUpdate]: newPressure,
    };
    onItemPropertyChange(selectedItem.id, 'portPressures', updatedPortPressures);
  };

  const handlePortFlowRateChange = (portIdToUpdate: string, newFlowRateString: string) => {
    if (!selectedItem || !onItemPropertyChange || selectedItem.chipType !== 'pump' || !selectedItem.portFlowRates) return;
    const newFlowRate = parseFloat(newFlowRateString);
    if (isNaN(newFlowRate)) return;

    const updatedPortFlowRates = {
      ...selectedItem.portFlowRates,
      [portIdToUpdate]: newFlowRate,
    };
    onItemPropertyChange(selectedItem.id, 'portFlowRates', updatedPortFlowRates);
  };

  // Calculate component summary with categories
  const componentSummary = useMemo(() => {
    const summary: Record<string, ComponentSummary> = {};

    droppedItems.forEach((item) => {
      // Skip canvas tools that don't have real products (like outlets)
      if (item.chipType === 'outlet' || !item.productId) {
        return;
      }

      let key: string;
      let componentData: ComponentSummary;

      if (item.selectedVariantId) {
        const variant = getVariantById(item.selectedVariantId);
        if (variant) {
          key = item.selectedVariantId;
          componentData = {
            id: variant.id,
            name: item.name,
            variantName: variant.variantName,
            sku: variant.sku,
            price: variant.price,
            quantity: summary[key]?.quantity + 1 || 1,
            chipType: item.chipType,
            imageUrl: variant.imageUrl,
            variantId: variant.id,
          };
        } else {
          key = item.productId;
          componentData = {
            id: item.productId,
            name: item.name,
            quantity: summary[key]?.quantity + 1 || 1,
            chipType: item.chipType,
          };
        }
      } else {
        key = item.productId;
        const parentProduct = PARENT_PRODUCTS.find(p => p.id === item.productId);
        componentData = {
          id: item.productId,
          name: parentProduct?.name || item.name,
          quantity: summary[key]?.quantity + 1 || 1,
          chipType: item.chipType,
        };
      }

      summary[key] = componentData;
    });

    return Object.values(summary);
  }, [droppedItems]);

  // Categorize components
  const categorizedComponents = useMemo(() => {
    const categories = {
      chips: componentSummary.filter(comp => ['straight', 'meander', 't-type', 'x-type'].includes(comp.chipType)),
      holders: componentSummary.filter(comp => comp.chipType === 'holder'),
      pumps: componentSummary.filter(comp => comp.chipType === 'pump'),
      other: componentSummary.filter(comp => !['straight', 'meander', 't-type', 'x-type', 'holder', 'pump'].includes(comp.chipType))
    };
    return categories;
  }, [componentSummary]);

  // Calculate tubing summary
  const tubingSummary = useMemo(() => {
    const summary: Record<string, TubingSummary> = {};

    connections.forEach((conn) => {
      const key = `${conn.tubingMaterial}-${conn.innerDiameterMm}`;
      
      if (!summary[key]) {
        summary[key] = {
          material: conn.tubingMaterial.toUpperCase(),
          diameter: `${conn.innerDiameterMm}mm ID`,
          totalLength: 0,
          estimatedPrice: 0
        };
      }
      
      summary[key].totalLength += conn.lengthMeters;
      
      // Rough pricing estimation (you can adjust these prices)
      const pricePerMeter = conn.tubingMaterial === 'silicone' ? 5 : 
                          conn.tubingMaterial === 'ptfe' ? 8 : 12;
      summary[key].estimatedPrice += conn.lengthMeters * pricePerMeter;
    });

    return Object.values(summary);
  }, [connections]);

  // Calculate totals
  const totals = useMemo(() => {
    const totalComponents = componentSummary.reduce((sum, comp) => sum + comp.quantity, 0);
    const totalComponentPrice = componentSummary.reduce((sum, comp) => sum + (comp.price || 0) * comp.quantity, 0);
    const totalTubingPrice = tubingSummary.reduce((sum, tubing) => sum + tubing.estimatedPrice, 0);
    const totalTubingLength = tubingSummary.reduce((sum, tubing) => sum + tubing.totalLength, 0);
    const specifiedComponents = componentSummary.filter(comp => comp.variantId).length;
    const unspecifiedComponents = componentSummary.filter(comp => !comp.variantId).length;

    return {
      totalComponents,
      totalComponentPrice,
      totalTubingPrice,
      totalPrice: totalComponentPrice + totalTubingPrice,
      totalTubingLength,
      specifiedComponents,
      unspecifiedComponents,
    };
  }, [componentSummary, tubingSummary]);

  const handleAddAllToCart = () => {
    const addableItems = componentSummary.filter(comp => comp.variantId && comp.price);
    
    if (addableItems.length === 0) {
      return;
    }

    addableItems.forEach((comp) => {
      addToCart({
        id: comp.id,
        name: comp.variantName || comp.name,
        description: `${comp.name} - ${comp.variantName || 'Standard variant'}`,
        price: comp.price!,
        imageUrl: comp.imageUrl || '/images/productplaceholder.png',
        sku: comp.sku || comp.id,
      }, comp.quantity);
    });
  };

  const getParentProductName = (productId: string): string => {
    const parentProduct = PARENT_PRODUCTS.find(p => p.id === productId);
    return parentProduct?.name || 'Unknown Component';
  };

  const getSelectedVariant = () => {
    if (!selectedItem?.selectedVariantId) return null;
    return getVariantById(selectedItem.selectedVariantId);
  };

  const getAvailableVariants = () => {
    if (!selectedItem?.productId) return [];
    return getVariantsForProduct(selectedItem.productId);
  };

  const getChannelWidthOptions = () => {
    const variants = getAvailableVariants();
    const widths = new Set<number>();
    
    variants.forEach(variant => {
      const widthAttr = variant.attributes.find(attr => attr.name === 'channelWidth');
      if (widthAttr && typeof widthAttr.value === 'number') {
        widths.add(widthAttr.value);
      }
    });
    
    return Array.from(widths).sort((a, b) => a - b);
  };

  let displayedResistance = 0;
  if (selectedItem && (selectedItem.chipType === 'straight' || selectedItem.chipType === 'meander')) {
    displayedResistance = calculateRectangularChannelResistance(
      selectedItem.currentChannelLengthMm * 1e-3,
      selectedItem.currentChannelWidthMicrons * 1e-6,
      selectedItem.currentChannelDepthMicrons * 1e-6,
      FLUID_VISCOSITY_PAS
    );
  } else if (selectedItem && selectedItem.chipType !== 'pump') {
    displayedResistance = selectedItem.resistance || 0;
  }

  // If no items are on the canvas at all, show the initial prompt
  if (droppedItems.length === 0) {
    return (
      <div className="h-full w-full flex flex-col font-inter items-center justify-center px-4">
        <div className="text-center text-gray-500">
          <Info className="mx-auto mb-3 h-8 w-8 text-gray-400" />
          <p className="text-sm">Drag components onto the canvas to begin.</p>
          <p className="text-xs mt-1 text-gray-400">Details will appear here when a component is selected.</p>
        </div>
      </div>
    );
  }

  const canAddToCart = componentSummary.some(comp => comp.variantId && comp.price);
  const selectedVariant = getSelectedVariant();
  const isChipComponent = selectedItem && ['straight', 'meander', 't-type', 'x-type'].includes(selectedItem.chipType);
  const isPumpComponent = selectedItem && selectedItem.chipType === 'pump';

  return (
    <div className="h-full w-full flex flex-col font-inter">
      {/* Selected Item/Connection Details */}
      {(selectedItem || selectedConnection) && (
        <div className="px-4 py-4 border-b">
          {selectedConnection && onConnectionPropertyChange ? (
            <>
              <h2 className="text-sm font-semibold text-primary tracking-tight mb-3">
                Tubing
              </h2>
              <ConnectionDetails 
                connection={selectedConnection}
                onConnectionPropertyChange={onConnectionPropertyChange}
              />
              {onDeleteConnection && (
                <Button
                  variant="destructive"
                  onClick={() => onDeleteConnection(selectedConnection.id)}
                  className="w-full mt-3"
                  size="sm"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Connection
                </Button>
              )}
            </>
          ) : selectedItem ? (
            <div className="space-y-3">
              {/* Component Type and Name */}
              <div>
                <h2 className="text-sm font-semibold text-primary tracking-tight">
                  {getParentProductName(selectedItem.productId)}
                </h2>
                {selectedVariant?.sku && (
                  <p className="text-xs text-muted-foreground">SKU: {selectedVariant.sku}</p>
                )}
              </div>

              {/* Resistance (only for chips, not pumps) */}
              {isChipComponent && (
                <div>
                  <p className="text-xs text-muted-foreground">
                    Hydrodynamic Resistance: {displayedResistance.toExponential(2)} Pa·s/m³
                    {(selectedItem.chipType === 't-type' || selectedItem.chipType === 'x-type') && (
                      <span className="italic"> (composite)</span>
                    )}
                  </p>
                </div>
              )}

              {/* Channel Width Selector for Chips */}
              {isChipComponent && onItemPropertyChange && (
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Channel Width</Label>
                  <Select
                    value={selectedItem.currentChannelWidthMicrons?.toString() || ''}
                    onValueChange={(value) => {
                      const variants = getAvailableVariants();
                      const targetVariant = variants.find(v => {
                        const widthAttr = v.attributes.find(attr => attr.name === 'channelWidth');
                        return widthAttr && widthAttr.value.toString() === value;
                      });
                      if (targetVariant) {
                        handleVariantChange(targetVariant.id);
                      }
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select width" />
                    </SelectTrigger>
                    <SelectContent>
                      {getChannelWidthOptions().map((width) => (
                        <SelectItem key={width} value={width.toString()}>
                          {width}µm
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Material and Max Pressure for Chips */}
              {isChipComponent && selectedVariant && (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="font-medium">Material:</span>
                    <p className="text-muted-foreground capitalize">
                      {selectedVariant.attributes.find(attr => attr.name === 'material')?.value || 'Glass'}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Max Pressure:</span>
                    <p className="text-muted-foreground">
                      {selectedVariant.attributes.find(attr => attr.name === 'maxPressure')?.value || '10'} bar
                    </p>
                  </div>
                </div>
              )}

              {/* Pump Controls - Different based on pump type */}
              {isPumpComponent && onItemPropertyChange && (
                <>
                  {/* Pressure Pump Controls */}
                  {selectedItem.pumpType === 'pressure' && selectedItem.portPressures && (
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Port Pressures (mbar)</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(selectedItem.portPressures).map(([portId, pressureInPa], index) => {
                          const pressureInMbar = pressureInPa / 100;
                          return (
                            <div key={portId} className="space-y-1">
                              <Label htmlFor={`pressure-${portId}`} className="text-xs">
                                Port {index + 1}
                              </Label>
                              <Input
                                id={`pressure-${portId}`}
                                type="number"
                                value={pressureInMbar}
                                onChange={(e) => {
                                  const pressureMbar = parseFloat(e.target.value);
                                  if (!isNaN(pressureMbar)) {
                                    handlePortPressureChange(portId, (pressureMbar * 100).toString());
                                  } else {
                                    handlePortPressureChange(portId, "0");
                                  }
                                }}
                                className="h-8 text-xs"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Syringe Pump Controls */}
                  {selectedItem.pumpType === 'syringe' && selectedItem.portFlowRates && (
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Flow Rate (µL/min)</Label>
                      <div className="grid grid-cols-1 gap-2">
                        {Object.entries(selectedItem.portFlowRates).map(([portId, flowRate]) => {
                          return (
                            <div key={portId} className="space-y-1">
                              <Label htmlFor={`flowrate-${portId}`} className="text-xs">
                                Flow Rate
                              </Label>
                              <Input
                                id={`flowrate-${portId}`}
                                type="number"
                                value={flowRate}
                                onChange={(e) => {
                                  const flowRateValue = parseFloat(e.target.value);
                                  if (!isNaN(flowRateValue)) {
                                    handlePortFlowRateChange(portId, flowRateValue.toString());
                                  } else {
                                    handlePortFlowRateChange(portId, "0");
                                  }
                                }}
                                className="h-8 text-xs"
                                min="0"
                                step="0.1"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Delete Button */}
              {onDeleteItem && (
                <Button
                  variant="destructive"
                  onClick={() => onDeleteItem(selectedItem.id)}
                  className="w-full"
                  size="sm"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Component
                </Button>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* Used Components List */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="px-4 py-4">
            <div className="flex items-center gap-2 mb-3">
              <Package className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-primary tracking-tight">
                Used Components
              </h2>
            </div>

            {/* Microfluidic Chips */}
            {categorizedComponents.chips.length > 0 && (
              <div className="mb-3">
                <div className="space-y-1.5">
                  {categorizedComponents.chips.map((comp) => {
                    const selectedVariant = comp.variantId ? getVariantById(comp.variantId) : null;
                    const productId = selectedVariant?.productId || comp.id;
                    const parentProduct = PARENT_PRODUCTS.find(p => p.id === productId);
                    const parentName = parentProduct?.name || comp.name.split(' - ')[0] || comp.name;
                    const channelWidth = selectedVariant?.attributes.find(attr => attr.name === 'channelWidth')?.value;
                    const material = selectedVariant?.attributes.find(attr => attr.name === 'material')?.value || 'Glass';
                    
                    return (
                      <div key={comp.id} className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-medium truncate">
                              {parentName}
                            </p>
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                              {comp.quantity}x
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {channelWidth && (
                              <div className="flex items-center gap-1">
                                <Ruler className="h-2.5 w-2.5 text-muted-foreground" />
                                <span className="text-[10px] text-muted-foreground">{channelWidth}µm</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Circle className="h-2.5 w-2.5 text-muted-foreground" />
                              <span className="text-[10px] text-muted-foreground capitalize">{material}</span>
                            </div>
                          </div>
                          {comp.sku && (
                            <p className="text-[10px] text-muted-foreground">SKU: {comp.sku}</p>
                          )}
                          {!comp.variantId && (
                            <Badge variant="outline" className="text-[10px] mt-1">
                              Needs Specification
                            </Badge>
                          )}
                        </div>
                        <div className="text-right">
                          {comp.price ? (
                            <p className="text-xs font-medium">
                              €{(comp.price * comp.quantity).toFixed(2)}
                            </p>
                          ) : (
                            <p className="text-[10px] text-muted-foreground">No price</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Chip Holders */}
            {categorizedComponents.holders.length > 0 && (
              <div className="mb-3">
                <div className="space-y-1.5">
                  {categorizedComponents.holders.map((comp) => {
                    const selectedVariant = comp.variantId ? getVariantById(comp.variantId) : null;
                    const productId = selectedVariant?.productId || comp.id;
                    const parentProduct = PARENT_PRODUCTS.find(p => p.id === productId);
                    const parentName = parentProduct?.name || comp.name.split(' - ')[0] || comp.name;
                    const material = selectedVariant?.attributes.find(attr => attr.name === 'material')?.value || 'Aluminum';
                    
                    return (
                      <div key={comp.id} className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-medium truncate">
                              {parentName}
                            </p>
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                              {comp.quantity}x
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Circle className="h-2.5 w-2.5 text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground capitalize">{material}</span>
                          </div>
                          {comp.sku && (
                            <p className="text-[10px] text-muted-foreground">SKU: {comp.sku}</p>
                          )}
                          {!comp.variantId && (
                            <Badge variant="outline" className="text-[10px] mt-1">
                              Needs Specification
                            </Badge>
                          )}
                        </div>
                        <div className="text-right">
                          {comp.price ? (
                            <p className="text-xs font-medium">
                              €{(comp.price * comp.quantity).toFixed(2)}
                            </p>
                          ) : (
                            <p className="text-[10px] text-muted-foreground">No price</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tubing */}
            {tubingSummary.length > 0 && (
              <div className="mb-3">
                <div className="space-y-1.5">
                  {tubingSummary.map((tubing, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-medium truncate">
                            {tubing.material} {tubing.diameter}
                          </p>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {(tubing.totalLength * 100).toFixed(0)}cm
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium">
                          €{tubing.estimatedPrice.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pumps */}
            {categorizedComponents.pumps.length > 0 && (
              <div className="mb-3">
                <div className="space-y-1.5">
                  {categorizedComponents.pumps.map((comp) => {
                    const selectedVariant = comp.variantId ? getVariantById(comp.variantId) : null;
                    const productId = selectedVariant?.productId || comp.id;
                    const parentProduct = PARENT_PRODUCTS.find(p => p.id === productId);
                    const parentName = parentProduct?.name || comp.name.split(' - ')[0] || comp.name;
                    
                    return (
                      <div key={comp.id} className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-medium truncate">
                              {parentName}
                            </p>
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                              {comp.quantity}x
                            </Badge>
                          </div>
                          {comp.sku && (
                            <p className="text-[10px] text-muted-foreground">SKU: {comp.sku}</p>
                          )}
                          {!comp.variantId && (
                            <Badge variant="outline" className="text-[10px] mt-1">
                              Needs Specification
                            </Badge>
                          )}
                        </div>
                        <div className="text-right">
                          {comp.price ? (
                            <p className="text-xs font-medium">
                              €{(comp.price * comp.quantity).toFixed(2)}
                            </p>
                          ) : (
                            <p className="text-[10px] text-muted-foreground">No price</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Other Components */}
            {categorizedComponents.other.length > 0 && (
              <div className="mb-3">
                <div className="space-y-1.5">
                  {categorizedComponents.other.map((comp) => {
                    const selectedVariant = comp.variantId ? getVariantById(comp.variantId) : null;
                    const productId = selectedVariant?.productId || comp.id;
                    const parentProduct = PARENT_PRODUCTS.find(p => p.id === productId);
                    const parentName = parentProduct?.name || comp.name.split(' - ')[0] || comp.name;
                    
                    return (
                      <div key={comp.id} className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-medium truncate">
                              {parentName}
                            </p>
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                              {comp.quantity}x
                            </Badge>
                          </div>
                          {comp.sku && (
                            <p className="text-[10px] text-muted-foreground">SKU: {comp.sku}</p>
                          )}
                          {!comp.variantId && (
                            <Badge variant="outline" className="text-[10px] mt-1">
                              Needs Specification
                            </Badge>
                          )}
                        </div>
                        <div className="text-right">
                          {comp.price ? (
                            <p className="text-xs font-medium">
                              €{(comp.price * comp.quantity).toFixed(2)}
                            </p>
                          ) : (
                            <p className="text-[10px] text-muted-foreground">No price</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Warnings */}
            {totals.unspecifiedComponents > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-amber-800 font-medium">
                  {totals.unspecifiedComponents} component{totals.unspecifiedComponents > 1 ? 's' : ''} need specification
                </p>
                <p className="text-[10px] text-amber-600 mt-1">
                  Select components on the canvas to specify variants for accurate pricing
                </p>
              </div>
            )}

            {/* Summary Stats - moved to bottom */}
            <div className="border-t pt-3 mb-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-center">
                  <div className="text-lg font-semibold text-foreground">{totals.totalComponents}</div>
                  <div className="text-[11px] leading-tight text-muted-foreground">Components</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-600">
                    €{totals.totalPrice.toFixed(2)}
                  </div>
                  <div className="text-[11px] leading-tight text-muted-foreground">
                    Est. Total
                  </div>
                </div>
              </div>
            </div>

            {/* Add to Cart Button */}
            <Button
              onClick={handleAddAllToCart}
              disabled={!canAddToCart}
              className="w-full"
              size="sm"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              {canAddToCart 
                ? `Add ${totals.specifiedComponents} item${totals.specifiedComponents > 1 ? 's' : ''} to Cart`
                : 'Specify components to add to cart'
              }
            </Button>

            {totals.unspecifiedComponents > 0 && canAddToCart && (
              <p className="text-[10px] text-muted-foreground text-center mt-2">
                Only specified components will be added to cart
              </p>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
} 