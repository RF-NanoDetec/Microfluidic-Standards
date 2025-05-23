'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';
import { ProductVariant, ParentProduct } from '@/lib/microfluidic-designer/productData';

interface VariantSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  parentProduct: ParentProduct;
  onVariantSelect: (variant: ProductVariant) => void;
}

export function VariantSelector({
  isOpen,
  onClose,
  parentProduct,
  onVariantSelect,
}: VariantSelectorProps) {
  const chipTypesWithSingleAttributeSelection = ['straight', 'x-type', 't-type', 'meander'];
  const primaryAttributeForChips = 'channelWidth'; // As confirmed from productVariants.json

  // Extract unique attribute values for dropdown options
  const attributeOptions = useMemo(() => {
    const options: Record<string, Set<string | number>> = {};
    const isChipWithSimplifiedSelection = chipTypesWithSingleAttributeSelection.includes(parentProduct.chipType);

    parentProduct.variants.forEach(variant => {
      variant.attributes.forEach(attr => {
        if (isChipWithSimplifiedSelection) {
          // If it's a chip with simplified selection, only consider the primary attribute
          if (attr.name === primaryAttributeForChips) {
            if (!options[attr.name]) {
              options[attr.name] = new Set();
            }
            options[attr.name].add(attr.value);
          }
        } else {
          // For other product types (if any use this selector in the future), include all attributes
          if (!options[attr.name]) {
            options[attr.name] = new Set();
          }
          options[attr.name].add(attr.value);
        }
      });
    });
    
    // Convert to sorted arrays
    const sortedOptions: Record<string, (string | number)[]> = {};
    Object.keys(options).forEach(key => {
      sortedOptions[key] = Array.from(options[key]).sort((a, b) => {
        if (typeof a === 'number' && typeof b === 'number') {
          return a - b;
        }
        // Ensure consistent sorting for mixed types (numbers first, then strings)
        if (typeof a === 'number' && typeof b === 'string') return -1;
        if (typeof a === 'string' && typeof b === 'number') return 1;
        return String(a).localeCompare(String(b));
      });
    });
    
    return sortedOptions;
  }, [parentProduct.variants, parentProduct.chipType]);

  // State for selected attributes
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string | number>>({});
  
  // Effect to clear selected attributes when the parent product changes (e.g., dialog reopens for a different product)
  useEffect(() => {
    setSelectedAttributes({});
  }, [parentProduct.id]);

  // Find matching variant based on selected attributes
  const matchingVariant = useMemo(() => {
    return parentProduct.variants.find(variant => {
      return Object.keys(selectedAttributes).every(attrName => {
        const variantAttr = variant.attributes.find(attr => attr.name === attrName);
        return variantAttr && variantAttr.value === selectedAttributes[attrName];
      });
    });
  }, [selectedAttributes, parentProduct.variants]);

  // Check if all required attributes are selected
  const allAttributesSelected = useMemo(() => {
    return Object.keys(attributeOptions).every(attrName => 
      selectedAttributes[attrName] !== undefined
    );
  }, [attributeOptions, selectedAttributes]);

  const handleAttributeChange = (attributeName: string, value: string | number) => {
    setSelectedAttributes(prev => ({
      ...prev,
      [attributeName]: value
    }));
  };

  const handleVariantSelect = () => {
    if (matchingVariant) {
      onVariantSelect(matchingVariant);
      onClose();
    }
  };

  const formatAttributeValue = (value: number | string, unit?: string) => {
    if (typeof value === 'number') {
      return unit ? `${value} ${unit}` : value.toString();
    }
    return value;
  };

  const getAttributeUnit = (attributeName: string, value: string | number) => {
    // Find a variant that has this attribute to get the unit
    const variantWithAttr = parentProduct.variants.find(variant =>
      variant.attributes.some(attr => attr.name === attributeName && attr.value === value)
    );
    const attr = variantWithAttr?.attributes.find(attr => attr.name === attributeName && attr.value === value);
    return attr?.unit;
  };

  const formatAttributeDisplayName = (attrName: string) => {
    return attrName.replace(/([A-Z])/g, ' $1').trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <Card className="relative z-10 w-full max-w-2xl max-h-[80vh] mx-4 overflow-hidden">
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-xl font-semibold">
              Configure {parentProduct.name}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Select the specifications for your {parentProduct.name}
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="overflow-y-auto space-y-6">
          {/* Parent Product Information */}
          <div className="space-y-3">
            <h3 className="font-medium text-lg">Product Information</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{parentProduct.category}</Badge>
                <Badge variant="outline">{parentProduct.chipType}</Badge>
              </div>
              <p className="text-sm text-gray-700">{parentProduct.title}</p>
            </div>
          </div>

          <Separator />

          {/* Variant Selection */}
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Select Specifications</h3>
            
            <div className="grid gap-4">
              {Object.entries(attributeOptions).map(([attributeName, values]) => (
                <div key={attributeName} className="space-y-2">
                  <Label htmlFor={attributeName} className="text-sm font-medium">
                    {formatAttributeDisplayName(attributeName)}
                  </Label>
                  <Select
                    value={selectedAttributes[attributeName]?.toString() || ''}
                    onValueChange={(value) => {
                      // Try to parse as number if it looks like a number
                      const numValue = parseFloat(value);
                      const finalValue = !isNaN(numValue) && isFinite(numValue) ? numValue : value;
                      handleAttributeChange(attributeName, finalValue);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={`Select ${formatAttributeDisplayName(attributeName).toLowerCase()}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {values.map((value) => {
                        const unit = getAttributeUnit(attributeName, value);
                        return (
                          <SelectItem key={value.toString()} value={value.toString()}>
                            {formatAttributeValue(value, unit)}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Variant Preview */}
          {matchingVariant && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-medium text-lg">Selected Variant</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{matchingVariant.variantName}</h4>
                      <p className="text-sm text-gray-600">SKU: {matchingVariant.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-blue-600">
                        ${matchingVariant.price.toFixed(2)}
                      </p>
                      <Badge 
                        variant={matchingVariant.stockStatus === 'in_stock' ? 'default' : 'destructive'}
                      >
                        {matchingVariant.stockStatus === 'in_stock' ? 'In Stock' : 'Out of Stock'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    {matchingVariant.attributes.map((attr) => (
                      <div key={attr.name} className="space-y-1">
                        <p className="font-medium text-gray-700">
                          {formatAttributeDisplayName(attr.name)}
                        </p>
                        <p className="text-gray-600">
                          {formatAttributeValue(attr.value, attr.unit)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleVariantSelect}
              disabled={!allAttributesSelected || !matchingVariant || matchingVariant.stockStatus !== 'in_stock'}
              className="flex-1"
            >
              {!allAttributesSelected 
                ? 'Select All Options' 
                : !matchingVariant 
                ? 'No Matching Variant' 
                : matchingVariant.stockStatus !== 'in_stock'
                ? 'Out of Stock'
                : 'Add to Canvas'
              }
            </Button>
          </div>

          {parentProduct.variants.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No variants available for this product.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 