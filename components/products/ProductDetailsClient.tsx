'use client';

import Image from 'next/image';
import { Product, ProductVariant } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlusSquare, ShoppingCart } from 'lucide-react';
import { toast } from "sonner";
import { useCartStore } from '@/store/cartStore';
import ProductVariantSelector from '@/components/products/ProductVariantSelector';
import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';

interface ProductDetailsClientProps {
  product: Product;
  variants: ProductVariant[];
}

// Animation variants from landing page (or a shared animation utils file)
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 },
  },
};

const itemFadeIn = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 },
  },
};

export default function ProductDetailsClient({ product, variants }: ProductDetailsClientProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [useImageFallback, setUseImageFallback] = useState(false);
  const { addToCart } = useCartStore();

  useEffect(() => {
    // Pre-select the first variant if available and not already selected
    if (variants && variants.length > 0 && !selectedVariant) {
      setSelectedVariant(variants[0]);
    }
  }, [variants, selectedVariant]);

  useEffect(() => {
    // Reset image fallback when selected variant or product changes
    setUseImageFallback(false);
  }, [selectedVariant, product]);

  const handleAddToCart = () => {
    if (!selectedVariant || !product) {
      toast.error('Please select a product variant');
      return;
    }

    addToCart({
      id: selectedVariant.id,
      name: product.name, // Use base product name
      description: selectedVariant.variantName || product.baseDescription, // More specific description
      price: selectedVariant.price,
      imageUrl: selectedVariant.imageUrl || product.baseImage,
      sku: selectedVariant.sku,
    }, 1);
    
    toast.success(`${selectedVariant.variantName || product.name} added to cart!`);
  };

  const imageSrc = useMemo(() => {
    if (useImageFallback) return '/images/product_placeholder.png';
    return selectedVariant?.imageUrl || product.baseImage || '/images/product_placeholder.png';
  }, [useImageFallback, selectedVariant, product.baseImage]);

  const attributeOptions = useMemo(() => {
    const attributes: Record<string, Set<any>> = {};
    variants.forEach(variant => {
      variant.attributes.forEach(attr => {
        if (!attributes[attr.name]) {
          attributes[attr.name] = new Set();
        }
        attributes[attr.name].add(attr.value);
      });
    });
    return Object.entries(attributes).map(([name, values]) => ({
      name,
      values: Array.from(values),
    }));
  }, [variants]);

  if (!product) {
    // This should ideally be handled by the parent Server Component with notFound()
    return <p>Product data is not available.</p>;
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={fadeIn} className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <motion.div variants={itemFadeIn} className="relative aspect-square rounded-3xl overflow-hidden bg-muted/20 shadow-lg">
        <Image
          key={imageSrc} // Force re-render on image change
          src={imageSrc}
          alt={selectedVariant?.variantName || product.name}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          style={{ objectFit: 'contain' }}
          priority
          onError={() => {
            if (!useImageFallback) {
              console.warn(`Image failed for ${imageSrc}, falling back.`);
              setUseImageFallback(true);
            }
          }}
        />
      </motion.div>

      <motion.div variants={itemFadeIn} className="flex flex-col space-y-6">
        <div>
          <motion.h1 variants={itemFadeIn} className="text-4xl font-bold tracking-tight text-primary mb-2 sm:text-5xl">
            {product.name}
          </motion.h1>
          {selectedVariant && (
            <motion.p variants={itemFadeIn} className="text-xl text-muted-foreground">
              {selectedVariant.variantName}
            </motion.p>
          )}
        </div>
        
        {product.tags && product.tags.length > 0 && (
          <motion.div variants={itemFadeIn} className="flex flex-wrap gap-2">
            {product.tags.map(tag => (
              <Badge key={tag} variant="secondary" className="rounded-full px-3 py-1 text-sm">
                {tag}
              </Badge>
            ))}
          </motion.div>
        )}

        <motion.p variants={itemFadeIn} className="text-muted-foreground text-lg leading-relaxed">
          {product.baseDescription}
        </motion.p>

        {selectedVariant && (
          <motion.div 
            variants={itemFadeIn} 
            className="p-6 border rounded-3xl bg-card shadow-sm space-y-3"
          >
            <h3 className="text-2xl font-semibold mb-3 text-foreground">Variant Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-md">
              <div className="flex justify-between">
                <span className="font-medium text-muted-foreground">Price:</span>
                <span className="text-primary font-bold text-xl">
                  {new Intl.NumberFormat('de-DE', {
                    style: 'currency',
                    currency: 'EUR'
                  }).format(selectedVariant.price)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-muted-foreground">SKU:</span>
                <span>{selectedVariant.sku}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-muted-foreground">Status:</span>
                <span className={
                  selectedVariant.stockStatus === 'in_stock' ? 'text-green-500 font-semibold' :
                  selectedVariant.stockStatus === 'out_of_stock' ? 'text-red-500 font-semibold' :
                  'text-orange-500 font-semibold'
                }>
                  {selectedVariant.stockStatus === 'in_stock' ? 'In Stock' :
                   selectedVariant.stockStatus === 'out_of_stock' ? 'Out of Stock' :
                   'On Backorder'}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        <motion.div variants={itemFadeIn} className="flex-grow">
          <ProductVariantSelector
            variants={variants}
            attributeOptions={attributeOptions}
            onVariantChange={setSelectedVariant}
            // selectedVariant={selectedVariant} // Temporarily commented out
          />
        </motion.div>

        <motion.div variants={itemFadeIn} className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button 
            size="lg" 
            className="flex-1 rounded-3xl py-6 text-base group"
            onClick={() => window.location.href = `/canvas?product=${product.id}&variant=${selectedVariant?.id || ''}`}
            disabled={!selectedVariant}
          >
            <PlusSquare className="mr-2 h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
            Add to Canvas
          </Button>
          <Button 
            size="lg"
            variant="outline"
            className="flex-1 rounded-3xl py-6 text-base group"
            onClick={handleAddToCart}
            disabled={!selectedVariant || selectedVariant.stockStatus === 'out_of_stock'}
          >
            <ShoppingCart className="mr-2 h-5 w-5 group-hover:animate-pulse" />
            {selectedVariant?.stockStatus === 'out_of_stock' ? 'Out of Stock' : 'Add to Cart'}
          </Button>
        </motion.div>

        {selectedVariant && selectedVariant.attributes && selectedVariant.attributes.length > 0 && (
          <motion.div variants={itemFadeIn} className="mt-10 pt-6 border-t">
            <h2 className="text-3xl font-bold tracking-tight text-foreground mb-6">Technical Specifications</h2>
            <div className="space-y-3">
              {selectedVariant.attributes.map(attr => (
                <div key={attr.name} className="flex justify-between items-center p-4 bg-muted/40 rounded-xl text-md">
                  <span className="font-medium text-foreground">{attr.name}</span>
                  <span className="text-muted-foreground">
                    {attr.value} {attr.unit || ''}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
} 