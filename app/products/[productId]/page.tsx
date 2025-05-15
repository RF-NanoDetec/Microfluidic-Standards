"use client";

import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Product, ProductVariant } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlusSquare, ShoppingCart } from 'lucide-react';
import { toast } from "sonner";
import { useCartStore } from '@/store/cartStore';
import ProductVariantSelector from '@/components/products/ProductVariantSelector';
import { useState, useEffect } from 'react';

async function getProduct(productId: string): Promise<Product> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || ''}/api/products/${productId}`
  );
  if (!res.ok) {
    if (res.status === 404) notFound();
    throw new Error('Failed to fetch product');
  }
  return res.json();
}

async function getProductVariants(productId: string): Promise<ProductVariant[]> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || ''}/api/products/${productId}/variants`
  );
  if (!res.ok) return [];
  return res.json();
}

interface ProductPageProps {
  params: {
    productId: string;
  };
}

export default function ProductPage({ params }: ProductPageProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const { addToCart } = useCartStore();

  // Fetch product and variants
  useEffect(() => {
    const fetchData = async () => {
      try {
        const productData = await getProduct(params.productId);
        const variantsData = await getProductVariants(params.productId);
        setProduct(productData);
        setVariants(variantsData);
      } catch (error) {
        console.error('Error fetching product:', error);
      }
    };
    fetchData();
  }, [params.productId]);

  const handleAddToCart = () => {
    if (!selectedVariant || !product) {
      toast.error('Please select a product variant');
      return;
    }

    addToCart({
      id: selectedVariant.id,
      name: product.name,
      description: product.baseDescription,
      price: selectedVariant.price,
      imageUrl: selectedVariant.imageUrl || product.baseImage,
      sku: selectedVariant.sku,
    }, 1);
    
    toast.success(`${selectedVariant.variantName} added to cart!`);
  };

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-semibold">Loading...</h1>
      </div>
    );
  }

  // Group variants by their attributes for the selector
  const variantAttributes = variants.reduce((acc, variant) => {
    variant.attributes.forEach(attr => {
      if (!acc[attr.name]) {
        acc[attr.name] = new Set();
      }
      acc[attr.name].add(attr.value);
    });
    return acc;
  }, {} as Record<string, Set<any>>);

  // Convert Sets to Arrays for rendering
  const attributeOptions = Object.entries(variantAttributes).map(([name, values]) => ({
    name,
    values: Array.from(values),
  }));

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product Image */}
        <div className="relative aspect-square rounded-lg overflow-hidden bg-background">
          <Image
            src={selectedVariant?.imageUrl || product.baseImage || '/product.png'}
            alt={product.name}
            fill
            className="object-contain"
            priority
          />
        </div>

        {/* Product Info */}
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold text-primary mb-2">{product.name}</h1>
          
          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex gap-2 mb-4">
              {product.tags.map(tag => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Description */}
          <p className="text-muted-foreground mb-6">
            {product.baseDescription}
          </p>

          {/* Selected Variant Details */}
          {selectedVariant && (
            <div className="mb-6 p-4 border rounded-lg bg-muted/30">
              <h3 className="text-lg font-semibold mb-3">Selected Variant: {selectedVariant.variantName}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div>
                  <span className="font-medium">Price: </span>
                  <span className="text-primary font-semibold">
                    {new Intl.NumberFormat('de-DE', {
                      style: 'currency',
                      currency: 'EUR'
                    }).format(selectedVariant.price)}
                  </span>
                </div>
                <div>
                  <span className="font-medium">SKU: </span>
                  <span>{selectedVariant.sku}</span>
                </div>
                <div>
                  <span className="font-medium">Status: </span>
                  <span className={
                    selectedVariant.stockStatus === 'in_stock' ? 'text-green-600' :
                    selectedVariant.stockStatus === 'out_of_stock' ? 'text-red-600' :
                    'text-orange-500' // for backorder
                  }>
                    {selectedVariant.stockStatus === 'in_stock' ? 'In Stock' :
                     selectedVariant.stockStatus === 'out_of_stock' ? 'Out of Stock' :
                     'On Backorder'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Variant Selector */}
          <div className="flex-grow">
            <ProductVariantSelector
              variants={variants}
              attributeOptions={attributeOptions}
              onVariantChange={setSelectedVariant}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Button 
              size="lg" 
              className="flex-1"
              onClick={() => window.location.href = `/canvas?product=${product.id}&variant=${selectedVariant?.id || ''}`}
              disabled={!selectedVariant}
            >
              <PlusSquare className="mr-2 h-5 w-5" />
              Add to Canvas
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="flex-1"
              onClick={handleAddToCart}
              disabled={!selectedVariant}
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Add to Cart
            </Button>
          </div>
        </div>
      </div>

      {/* Technical Specifications */}
      <div className="mt-12">
        <h2 className="text-2xl font-semibold mb-4">Technical Specifications</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {selectedVariant?.attributes.map(attr => (
            <div key={attr.name} className="flex justify-between p-4 bg-muted rounded-lg">
              <span className="font-medium">{attr.name}</span>
              <span className="text-muted-foreground">
                {attr.value} {attr.unit || ''}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 