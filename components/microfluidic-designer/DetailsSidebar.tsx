'use client';

import React, { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
  configuringItem?: CanvasItemData;
  onClearConfiguringItem?: () => void;
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
  configuringItem,
  onClearConfiguringItem,
  droppedItems, 
  connections, 
  onItemPropertyChange, 
  onConnectionPropertyChange, 
  onDeleteItem, 
  onDeleteConnection 
}: DetailsSidebarProps) {
  const addToCart = useCartStore((state) => state.addToCart);

  const itemToDisplay = configuringItem || selectedItem;

  const handleChannelWidthChange = (newValue: string) => {
    if (!configuringItem || !onItemPropertyChange) return;

    const newWidthMicrons = parseFloat(newValue);
    // Do not clear or return if newWidthMicrons is invalid yet, allow temporary states
    // if (isNaN(newWidthMicrons) || newWidthMicrons <= 0) {
    //   return;
    // }

    onItemPropertyChange(configuringItem.id, 'currentChannelWidthMicrons', isNaN(newWidthMicrons) || newWidthMicrons <=0 ? 0 : newWidthMicrons);

    const {
      currentChannelLengthMm,
      currentChannelDepthMicrons,
      chipType,
      currentJunctionSegmentLengthMm,
      resistance: oldResistance // Store old resistance for fallback
    } = configuringItem;

    if (currentChannelLengthMm && currentChannelDepthMicrons && newWidthMicrons > 0) {
        let calculatedResistance: number;
        if (chipType === 'straight' || chipType === 'meander') {
            calculatedResistance = calculateRectangularChannelResistance(
                currentChannelLengthMm * 1e-3, 
                newWidthMicrons * 1e-6,       
                currentChannelDepthMicrons * 1e-6, 
                FLUID_VISCOSITY_PAS
            );
        } else if (chipType === 't-type' || chipType === 'x-type') {
            const effectiveLengthMm = currentJunctionSegmentLengthMm || currentChannelLengthMm || 2.5;
            calculatedResistance = calculateRectangularChannelResistance(
                effectiveLengthMm * 1e-3,
                newWidthMicrons * 1e-6,
                currentChannelDepthMicrons * 1e-6,
                FLUID_VISCOSITY_PAS
            );
        } else {
            calculatedResistance = oldResistance || 0; 
        }
        onItemPropertyChange(configuringItem.id, 'resistance', calculatedResistance);
    } else if (newWidthMicrons <= 0 || isNaN(newWidthMicrons)) {
        // If width is invalid, set a very high resistance or revert to a previous valid one if possible
        onItemPropertyChange(configuringItem.id, 'resistance', 1e18); // Indicate non-functional
    }
  };

  const handleVariantChange = (variantId: string) => {
    if (!itemToDisplay || !onItemPropertyChange) return;
    const variant = getVariantById(variantId);
    if (!variant) return;

    // Extract channel width from variant
    const channelWidthAttr = variant.attributes.find(attr => attr.name === 'channelWidth');
    const channelDepthAttr = variant.attributes.find(attr => attr.name === 'channelDepth');
    
    if (channelWidthAttr && typeof channelWidthAttr.value === 'number') {
      onItemPropertyChange(itemToDisplay.id, 'currentChannelWidthMicrons', channelWidthAttr.value);
    }
    if (channelDepthAttr && typeof channelDepthAttr.value === 'number') {
      onItemPropertyChange(itemToDisplay.id, 'currentChannelDepthMicrons', channelDepthAttr.value);
    }
    
    // Update selected variant
    onItemPropertyChange(itemToDisplay.id, 'selectedVariantId', variantId);
    onItemPropertyChange(itemToDisplay.id, 'name', variant.variantName);
  };

  const handlePortPressureChange = (portIdToUpdate: string, newPressureString: string) => {
    if (!itemToDisplay || !onItemPropertyChange || itemToDisplay.chipType !== 'pump' || !itemToDisplay.portPressures) return;
    const newPressure = parseFloat(newPressureString);
    if (isNaN(newPressure)) return;

    const updatedPortPressures = {
      ...itemToDisplay.portPressures,
      [portIdToUpdate]: newPressure,
    };
    onItemPropertyChange(itemToDisplay.id, 'portPressures', updatedPortPressures);
  };

  const handlePortFlowRateChange = (portIdToUpdate: string, newFlowRateString: string) => {
    if (!itemToDisplay || !onItemPropertyChange || itemToDisplay.chipType !== 'pump' || !itemToDisplay.portFlowRates) return;
    const newFlowRate = parseFloat(newFlowRateString);
    if (isNaN(newFlowRate)) return;

    const updatedPortFlowRates = {
      ...itemToDisplay.portFlowRates,
      [portIdToUpdate]: newFlowRate,
    };
    onItemPropertyChange(itemToDisplay.id, 'portFlowRates', updatedPortFlowRates);
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
    if (!itemToDisplay?.selectedVariantId) return null;
    return getVariantById(itemToDisplay.selectedVariantId);
  };

  const getAvailableVariants = () => {
    if (!itemToDisplay?.productId) return [];
    return getVariantsForProduct(itemToDisplay.productId);
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
  if (itemToDisplay && (itemToDisplay.chipType === 'straight' || itemToDisplay.chipType === 'meander')) {
    displayedResistance = calculateRectangularChannelResistance(
      itemToDisplay.currentChannelLengthMm * 1e-3,
      itemToDisplay.currentChannelWidthMicrons * 1e-6,
      itemToDisplay.currentChannelDepthMicrons * 1e-6,
      FLUID_VISCOSITY_PAS
    );
  } else if (itemToDisplay && itemToDisplay.chipType !== 'pump') {
    displayedResistance = itemToDisplay.resistance || 0;
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
  const isChipComponent = itemToDisplay && ['straight', 'meander', 't-type', 'x-type'].includes(itemToDisplay.chipType);
  const isPumpComponent = itemToDisplay && itemToDisplay.chipType === 'pump';

  return (
    <ScrollArea className="h-full w-full">
      <div className="p-3 space-y-4">
        
        {/* Initial Configuration Section for configuringItem */}
        {configuringItem && (
          <div className="p-3 border-2 border-blue-500 rounded-lg bg-blue-50 mb-4 shadow-md animate-fadeIn">
            <h3 className="text-md font-semibold text-blue-700 mb-1">
              Configure New: <span className="font-normal">{configuringItem.name}</span>
            </h3>
             <p className="text-xs text-blue-600 mb-3">
                Please set the required properties for the new component.
            </p>
            <div className="space-y-3">
              <div>
                <Label htmlFor="channelWidthConfig" className="text-xs font-medium text-gray-700 flex items-center">
                  Channel Width (µm)
                  <TooltipProvider delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info size={12} className="inline ml-1.5 text-gray-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        <p>Set the primary internal channel width for this component in micrometers.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Input
                  id="channelWidthConfig"
                  type="number"
                  value={configuringItem.currentChannelWidthMicrons > 0 ? configuringItem.currentChannelWidthMicrons : ''} // Show empty if 0
                  onChange={(e) => handleChannelWidthChange(e.target.value)}
                  onBlur={() => {
                    if (configuringItem.currentChannelWidthMicrons && configuringItem.currentChannelWidthMicrons > 0 && onClearConfiguringItem) {
                       onClearConfiguringItem();
                    }
                  }}
                  placeholder="e.g., 100"
                  min="1" // Basic HTML5 validation
                  className={`mt-1 h-8 text-sm ${(!configuringItem.currentChannelWidthMicrons || configuringItem.currentChannelWidthMicrons <=0) ? 'border-red-500 focus:border-red-600 ring-red-500 focus:ring-red-600' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                />
                {(!configuringItem.currentChannelWidthMicrons || configuringItem.currentChannelWidthMicrons <=0) && (
                    <p className="text-xs text-red-600 mt-1">Channel width must be a positive number.</p>
                )}
              </div>
              {/* You can add a button here if onBlur feels too abrupt */}
              {/* <Button 
                size="sm" 
                className="mt-2 h-8 text-xs"
                onClick={() => {
                  if (configuringItem.currentChannelWidthMicrons && configuringItem.currentChannelWidthMicrons > 0 && onClearConfiguringItem) {
                    onClearConfiguringItem();
                  }
                }}
                disabled={!configuringItem.currentChannelWidthMicrons || configuringItem.currentChannelWidthMicrons <=0}
              >
                Set Width & Continue
              </Button> */}
            </div>
          </div>
        )}

        {/* Display Item or Connection Details (only if not configuring a new item) */}
        {!configuringItem && itemToDisplay && (
          <div className="border-b pb-4 mb-4"> {/* Item details section wrapper */}
            <div className="space-y-3">
              {/* Component Type and Name */}
              <div>
                <h2 className="text-sm font-semibold text-primary tracking-tight">
                  {getParentProductName(itemToDisplay.productId)}
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
                    {(itemToDisplay.chipType === 't-type' || itemToDisplay.chipType === 'x-type') && (
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
                    value={itemToDisplay.currentChannelWidthMicrons?.toString() || ''}
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
                  {itemToDisplay.pumpType === 'pressure' && itemToDisplay.portPressures && (
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Port Pressures (mbar)</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(itemToDisplay.portPressures).map(([portId, pressureInPa], index) => {
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
                  {itemToDisplay.pumpType === 'syringe' && itemToDisplay.portFlowRates && (
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Flow Rate (µL/min)</Label>
                      <div className="grid grid-cols-1 gap-2">
                        {Object.entries(itemToDisplay.portFlowRates).map(([portId, flowRate]) => {
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
                  onClick={() => onDeleteItem(itemToDisplay.id)}
                  className="w-full"
                  size="sm"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Component
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Used Components List */}
        <div className="flex-1 overflow-hidden">
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
        </div>
      </div>
    </ScrollArea>
  );
} 