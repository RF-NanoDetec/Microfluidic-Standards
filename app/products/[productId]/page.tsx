"use client";

import { sampleProducts } from '@/lib/sample-products';
import { AnyProduct } from '@/lib/types';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@/components/ui/table';
import { useCartStore } from '@/store/cartStore';
import { toast } from "sonner";
import { use } from 'react';

// Helper function to find product by ID
// In a real app, this would be an API call
const getProductById = (id: string): AnyProduct | undefined => {
  return sampleProducts.find((p) => p.id === id);
};

// Function to format price
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(price);
};

interface ProductDetailPageParams {
  productId: string;
}

export default function ProductDetailPage({ params }: { params: Promise<ProductDetailPageParams> }) {
  const resolvedParams = use(params);
  const product = getProductById(resolvedParams.productId);
  const { addToCart } = useCartStore();

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, 1);
      toast.success(`${product.name} added to cart!`);
      console.log(`${product.name} added to cart`);
    }
  };

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-semibold">Product not found</h1>
        <p className="text-muted-foreground">
          Sorry, we couldn't find the product you're looking for.
        </p>
        {/* TODO: Add a link to go back to products page */}
      </div>
    );
  }

  // Helper to render a specification row
  const renderSpec = (label: string, value?: string | number | boolean | string[] | null | undefined) => {
    if (value === undefined || value === null || (Array.isArray(value) && value.length === 0)) {
      return null;
    }
    let displayValue: string;
    if (typeof value === 'boolean') {
      displayValue = value ? 'Yes' : 'No';
    } else if (Array.isArray(value)) {
      displayValue = value.join(', ');
    } else {
      displayValue = String(value);
    }
    return (
      <TableRow>
        <TableCell className="font-medium">{label}</TableCell>
        <TableCell>{displayValue}</TableCell>
      </TableRow>
    );
  };


  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-start">
        {/* Image Section */}
        <div className="relative w-full aspect-square rounded-lg overflow-hidden shadow-lg">
          <Image
            src={product.imageUrl || '/images/product-placeholder.webp'}
            alt={product.name}
            layout="fill"
            objectFit="contain" // or "cover"
          />
        </div>

        {/* Details Section */}
        <div>
          <Badge variant="outline" className="mb-2">{product.category.toUpperCase()}</Badge>
          <h1 className="text-3xl lg:text-4xl font-bold mb-3">{product.name}</h1>
          <p className="text-2xl font-semibold text-primary mb-4">
            {formatPrice(product.price)}
          </p>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            {product.description}
          </p>

          <Button size="lg" className="w-full mb-6" onClick={handleAddToCart}>
            Add to Cart
          </Button>

          <h2 className="text-xl font-semibold mb-3 border-b pb-2">Specifications</h2>
          <Table>
            <TableBody>
              {renderSpec('SKU', product.sku)}
              {renderSpec('Material', product.material)}
              {renderSpec('Stock Quantity', product.stockQuantity)}
              {product.dimensions && renderSpec('Dimensions', `${product.dimensions.length || ''}x${product.dimensions.width || ''}x${product.dimensions.height || ''}${product.dimensions.diameter || ''} ${product.dimensions.unit}`.replace(/xx+/g, 'x').replace(/^x|x$/g, ''))}
              {renderSpec('Biocompatible', product.isBiocompatible)}
              {renderSpec('Autoclavable', product.isAutoclavable)}
              {product.temperatureRange && renderSpec('Temperature Range', `${product.temperatureRange.min} to ${product.temperatureRange.max} ${product.temperatureRange.unit}`)}
              {product.pressureRating && renderSpec('Max Pressure', `${product.pressureRating.maxPressure} ${product.pressureRating.unit}`)}
              {product.chemicalResistance && product.chemicalResistance.length > 0 && renderSpec('Chemical Resistance', product.chemicalResistance)}

              {/* Category Specific Specs */}
              {product.category === 'chip' && (
                <>
                  {renderSpec('Chip Type', product.chipType)}
                  {renderSpec('Channel Dimensions', `${product.channelDimensions.width}w x ${product.channelDimensions.depth}d ${product.channelDimensions.unit}`)}
                  {renderSpec('Number of Channels', product.numberOfChannels)}
                </>
              )}
              {product.category === 'holder' && (
                <>
                  {renderSpec('Compatible Chip Format', product.compatibleChipFormat)}
                  {renderSpec('Number of Connections', product.numberOfConnections)}
                  {renderSpec('Tubing Compatibility', `${product.tubingSizeCompatibility.od} ${product.tubingSizeCompatibility.unit} OD`)}
                </>
              )}
              {product.category === 'tubing' && (
                <>
                  {renderSpec('Inner Diameter', `${product.innerDiameter.value} ${product.innerDiameter.unit}`)}
                  {renderSpec('Outer Diameter', `${product.outerDiameter.value} ${product.outerDiameter.unit}`)}
                  {/* TODO: Display length options more nicely */}
                </>
              )}
              {product.category === 'pump' && (
                <>
                  {renderSpec('Pump Type', product.pumpType)}
                  {renderSpec('Flow Rate', `${product.flowRateRange.min}-${product.flowRateRange.max} ${product.flowRateRange.unit}`)}
                </>
              )}
               {product.category === 'accessory' && renderSpec('Accessory Type', product.accessoryType)}
            </TableBody>
          </Table>

          {product.compatibleWith && product.compatibleWith.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Compatible With:</h3>
              <div className="flex flex-wrap gap-2">
                {product.compatibleWith.map(id => (
                  // TODO: Make these links to other product pages
                  (<Badge key={id} variant="secondary">{id}</Badge>)
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 