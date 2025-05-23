'use client';

import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ShoppingCart, Package } from 'lucide-react';
import type { CanvasItemData } from '@/lib/microfluidic-designer/types';
import { useCartStore } from '@/store/cartStore';
import { getVariantById, PARENT_PRODUCTS } from '@/lib/microfluidic-designer/productData';

interface ComponentsSummaryProps {
  droppedItems: CanvasItemData[];
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

export function ComponentsSummary({ droppedItems }: ComponentsSummaryProps) {
  const addToCart = useCartStore((state) => state.addToCart);

  // Calculate component summary from canvas items
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
        // This is a specific product variant
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
          // Fallback if variant not found
          key = item.productId;
          componentData = {
            id: item.productId,
            name: item.name,
            quantity: summary[key]?.quantity + 1 || 1,
            chipType: item.chipType,
          };
        }
      } else {
        // Generic component (not yet specified)
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

  // Calculate totals
  const totals = useMemo(() => {
    const totalComponents = componentSummary.reduce((sum, comp) => sum + comp.quantity, 0);
    const totalPrice = componentSummary.reduce((sum, comp) => sum + (comp.price || 0) * comp.quantity, 0);
    const specificiedComponents = componentSummary.filter(comp => comp.variantId).length;
    const unspecifiedComponents = componentSummary.filter(comp => !comp.variantId).length;

    return {
      totalComponents,
      totalPrice,
      specificiedComponents,
      unspecifiedComponents,
    };
  }, [componentSummary]);

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

  const canAddToCart = componentSummary.some(comp => comp.variantId && comp.price);

  if (componentSummary.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Package className="h-4 w-4" />
            Components Used
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-500">
            <Package className="mx-auto mb-2 h-8 w-8 text-gray-400" />
            <p className="text-sm">No components on canvas yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Drag components from the left panel to start your design
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Package className="h-4 w-4" />
          Components Used
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <div className="text-lg font-semibold text-gray-900">{totals.totalComponents}</div>
            <div className="text-xs text-gray-600">Total Items</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <div className="text-lg font-semibold text-green-600">
              ${totals.totalPrice.toFixed(2)}
            </div>
            <div className="text-xs text-gray-600">Estimated Cost</div>
          </div>
        </div>

        {totals.unspecifiedComponents > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-800 font-medium">
              {totals.unspecifiedComponents} component{totals.unspecifiedComponents > 1 ? 's' : ''} need specification
            </p>
            <p className="text-xs text-amber-600 mt-1">
              Select components on the canvas to specify variants for accurate pricing
            </p>
          </div>
        )}

        <Separator />

        {/* Components List */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide">Component List</h4>
          <ScrollArea className="max-h-48">
            <div className="space-y-2">
              {componentSummary.map((comp) => (
                <div
                  key={comp.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {comp.variantName || comp.name}
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        {comp.quantity}x
                      </Badge>
                    </div>
                    {comp.sku && (
                      <p className="text-xs text-gray-500">SKU: {comp.sku}</p>
                    )}
                    {!comp.variantId && (
                      <Badge variant="outline" className="text-xs mt-1">
                        Needs Specification
                      </Badge>
                    )}
                  </div>
                  <div className="text-right">
                    {comp.price ? (
                      <p className="text-sm font-medium text-gray-900">
                        ${(comp.price * comp.quantity).toFixed(2)}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500">No price</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <Separator />

        {/* Add to Cart Button */}
        <Button
          onClick={handleAddAllToCart}
          disabled={!canAddToCart}
          className="w-full"
          size="sm"
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          {canAddToCart 
            ? `Add ${totals.specificiedComponents} item${totals.specificiedComponents > 1 ? 's' : ''} to Cart`
            : 'Specify components to add to cart'
          }
        </Button>

        {totals.unspecifiedComponents > 0 && canAddToCart && (
          <p className="text-xs text-gray-500 text-center">
            Only specified components will be added to cart
          </p>
        )}
      </CardContent>
    </Card>
  );
} 