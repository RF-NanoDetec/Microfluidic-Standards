"use client";

import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductVariant } from '@/lib/types';
import { Card } from '@/components/ui/card';

interface AttributeOption {
  name: string;
  values: (string | number | boolean)[];
}

interface ProductVariantSelectorProps {
  variants: ProductVariant[];
  attributeOptions: AttributeOption[];
  onVariantChange?: (variant: ProductVariant | null) => void;
}

export default function ProductVariantSelector({
  variants,
  attributeOptions,
  onVariantChange,
}: ProductVariantSelectorProps) {
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string | number | boolean>>({});
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  // Initialize with first values
  useEffect(() => {
    if (attributeOptions.length > 0 && Object.keys(selectedAttributes).length === 0) {
      const initial = attributeOptions.reduce((acc, attr) => {
        acc[attr.name] = attr.values[0];
        return acc;
      }, {} as Record<string, string | number | boolean>);
      setSelectedAttributes(initial);
    }
  }, [attributeOptions]);

  // Update selected variant when attributes change
  useEffect(() => {
    if (Object.keys(selectedAttributes).length === 0) return;

    const matchingVariant = variants.find(variant =>
      variant.attributes.every(attr =>
        selectedAttributes[attr.name] === attr.value
      )
    );

    setSelectedVariant(matchingVariant || null);
    if (onVariantChange) {
      onVariantChange(matchingVariant || null);
    }
  }, [selectedAttributes, variants, onVariantChange]);

  const handleAttributeChange = (attributeName: string, value: string) => {
    // Convert the string value back to the correct type based on the current value type
    const currentValue = selectedAttributes[attributeName];
    let typedValue: string | number | boolean = value;
    
    if (typeof currentValue === 'number') {
      typedValue = Number(value);
    } else if (typeof currentValue === 'boolean') {
      typedValue = value === 'true';
    }

    setSelectedAttributes(prev => ({
      ...prev,
      [attributeName]: typedValue
    }));
  };

  if (!variants || variants.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Variant Selectors */}
      <div className="space-y-4">
        {attributeOptions.map(({ name, values }) => (
          <div key={name}>
            <label className="text-sm font-medium mb-2 block">
              {name}
            </label>
            <Select
              value={selectedAttributes[name]?.toString()}
              onValueChange={(value) => handleAttributeChange(name, value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {values.map((value) => (
                  <SelectItem key={value.toString()} value={value.toString()}>
                    {value} {variants.find(v => 
                      v.attributes.some(attr => 
                        attr.name === name && attr.value === value
                      ))?.attributes.find(attr => 
                        attr.name === name
                      )?.unit || ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>

      {/* Selected Variant Info */}
      {selectedVariant && (
        <Card className="p-4 bg-muted/50">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">{selectedVariant.variantName}</p>
              <p className="text-sm text-muted-foreground">SKU: {selectedVariant.sku}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold">
                {new Intl.NumberFormat('de-DE', {
                  style: 'currency',
                  currency: 'EUR'
                }).format(selectedVariant.price)}
              </p>
              <p className="text-sm text-muted-foreground">
                {selectedVariant.stockStatus === 'in_stock' ? 'In Stock' : 
                 selectedVariant.stockStatus === 'out_of_stock' ? 'Out of Stock' :
                 'Backorder'}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
} 