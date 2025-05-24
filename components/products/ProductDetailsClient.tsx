'use client';

import Image from 'next/image';
import { Product, ProductVariant } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlusSquare, ShoppingCart, Thermometer, Droplets, Zap, Shield, FlaskConical, Layers, Ruler, Mountain, CheckCircle, Info } from 'lucide-react';
import { toast } from "sonner";
import { useCartStore } from '@/store/cartStore';
import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

// Helper function to get unique values for a specific attribute
const getUniqueAttributeValues = (variants: ProductVariant[], attributeName: string): (string | number)[] => {
  const values = new Set<string | number>();
  variants.forEach(variant => {
    const attr = variant.attributes.find(a => a.name.toLowerCase() === attributeName.toLowerCase());
    if (attr && typeof attr.value !== 'boolean' && attr.value !== undefined && attr.value !== null) {
      values.add(attr.value);
    }
  });
  return Array.from(values).sort((a, b) => {
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    if (typeof a === 'string' && typeof b === 'string') return a.localeCompare(b);
    return 0;
  });
};

export default function ProductDetailsClient({ product, variants }: ProductDetailsClientProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [useImageFallback, setUseImageFallback] = useState(false);
  const { addToCart } = useCartStore();

  // State for selectable attributes: channel width and depth
  const [selectedChannelWidth, setSelectedChannelWidth] = useState<string | number | undefined>(undefined);
  const [selectedChannelDepth, setSelectedChannelDepth] = useState<string | number | undefined>(undefined);

  const channelWidthOptions = useMemo(() => getUniqueAttributeValues(variants, 'channelWidth'), [variants]);
  const channelDepthOptions = useMemo(() => getUniqueAttributeValues(variants, 'channelDepth'), [variants]);

  useEffect(() => {
    // Pre-select the first available variant or a default based on initial selections
    if (variants && variants.length > 0) {
      let initialVariant = variants[0]; // Default to the first one

      // If some options are pre-selected (e.g. from URL params in future), find a matching variant
      // For now, we can try to find one if channelWidthOptions/DepthOptions have a single value
      let bestMatch: ProductVariant | null = null;

      if (channelWidthOptions.length > 0 && selectedChannelWidth === undefined) {
        // setSelectedChannelWidth(channelWidthOptions[0]); // Optionally pre-select first width
      }
      if (channelDepthOptions.length > 0 && selectedChannelDepth === undefined) {
        // setSelectedChannelDepth(channelDepthOptions[0]); // Optionally pre-select first depth
      }
      
      // Find a variant that matches the selected width and depth
      bestMatch = variants.find(v => {
        const widthAttr = v.attributes.find(a => a.name.toLowerCase() === 'channelwidth');
        const depthAttr = v.attributes.find(a => a.name.toLowerCase() === 'channeldepth');
        
        const widthMatch = selectedChannelWidth === undefined || (widthAttr && widthAttr.value == selectedChannelWidth);
        const depthMatch = selectedChannelDepth === undefined || (depthAttr && depthAttr.value == selectedChannelDepth);
        
        return widthMatch && depthMatch;
      }) || variants[0]; // Fallback to first variant if no exact match

      setSelectedVariant(bestMatch);
      // Ensure selected attributes are set based on the bestMatch
      const sw = bestMatch?.attributes.find(a => a.name.toLowerCase() === 'channelwidth')?.value;
      const sd = bestMatch?.attributes.find(a => a.name.toLowerCase() === 'channeldepth')?.value;
      if (sw !== undefined && typeof sw !== 'boolean') setSelectedChannelWidth(sw);
      if (sd !== undefined && typeof sd !== 'boolean') setSelectedChannelDepth(sd);

    } else {
      setSelectedVariant(null);
      setSelectedChannelWidth(undefined);
      setSelectedChannelDepth(undefined);
    }
  }, [variants]); // Removed selectedVariant from dependencies to avoid loops with internal updates

  useEffect(() => {
    // Update selectedVariant when channel width or depth changes
    if (!selectedChannelWidth && !selectedChannelDepth && variants.length > 0) {
      // If nothing is selected, default to the first variant and update selections
      const firstVariant = variants[0];
      setSelectedVariant(firstVariant);
      const firstWidth = firstVariant.attributes.find(a => a.name.toLowerCase() === 'channelwidth')?.value;
      const firstDepth = firstVariant.attributes.find(a => a.name.toLowerCase() === 'channeldepth')?.value;
      if (firstWidth !== undefined && typeof firstWidth !== 'boolean') setSelectedChannelWidth(firstWidth);
      if (firstDepth !== undefined && typeof firstDepth !== 'boolean') setSelectedChannelDepth(firstDepth);
      return;
    }

    const matchedVariant = variants.find(variant => {
      const widthAttr = variant.attributes.find(a => a.name.toLowerCase() === 'channelwidth');
      const depthAttr = variant.attributes.find(a => a.name.toLowerCase() === 'channeldepth');

      const widthMatch = selectedChannelWidth === undefined || (widthAttr && widthAttr.value == selectedChannelWidth);
      const depthMatch = selectedChannelDepth === undefined || (depthAttr && depthAttr.value == selectedChannelDepth);
      
      return widthMatch && depthMatch;
    });
    setSelectedVariant(matchedVariant || null);
    setUseImageFallback(false); // Reset image fallback on variant change
  }, [selectedChannelWidth, selectedChannelDepth, variants]);

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
    
    toast.success(`${selectedVariant.variantName || product.name} added to cart`);
  };

  const imageSrc = useMemo(() => {
    if (useImageFallback) return '/images/product_placeholder.png';
    return selectedVariant?.imageUrl || product.baseImage || '/images/product_placeholder.png';
  }, [useImageFallback, selectedVariant, product.baseImage]);

  const getAttributeValue = (variant: ProductVariant | null, attributeName: string): string | number | undefined => {
    const attr = variant?.attributes.find(attr => attr.name.toLowerCase() === attributeName.toLowerCase());
    return (typeof attr?.value === 'boolean' ? undefined : attr?.value);
  };

  const getAttributeUnit = (variant: ProductVariant | null, attributeName: string): string | undefined => {
    return variant?.attributes.find(attr => attr.name.toLowerCase() === attributeName.toLowerCase())?.unit;
  };
  
  const renderChipProperties = () => (
    <Card className="mt-8 rounded-2xl">
      <CardHeader className="p-6">
        <CardTitle className="text-xl font-semibold flex items-center">
          <Info className="mr-3 h-7 w-7 text-primary" />
          Chip Information & Properties
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 text-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-lg mb-2 text-primary">Material: Glass</h4>
            <ul className="list-none space-y-2 pl-0">
              <li className="flex items-start">
                <Shield className="h-5 w-5 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                <span>
                  <span className="font-medium text-foreground">Superior Chemical Resistance:</span>
                  <span className="text-muted-foreground"> Ideal for a wide range of solvents and reagents.</span>
                </span>
              </li>
              <li className="flex items-start">
                <Thermometer className="h-5 w-5 mr-2 mt-0.5 text-red-500 flex-shrink-0" />
                <span>
                  <span className="font-medium text-foreground">Wide Temperature Range:</span>
                  <span className="text-muted-foreground"> Stable across significant temperature variations.</span>
                </span>
              </li>
              <li className="flex items-start">
                <Zap className="h-5 w-5 mr-2 mt-0.5 text-purple-500 flex-shrink-0" />
                <span>
                  <span className="font-medium text-foreground">Excellent Optical Properties:</span>
                  <span className="text-muted-foreground"> Low auto-fluorescence, high transparency for imaging and detection.</span>
                </span>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-lg mb-2 text-primary">Compatibility & Use</h4>
            <ul className="list-none space-y-2 pl-0">
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                <span>
                  <span className="font-medium text-foreground">Perfect Fit:</span>
                  <span className="text-muted-foreground"> Designed for seamless integration with standard chip holders.</span>
                </span>
              </li>
              <li className="flex items-start">
                <Layers className="h-5 w-5 mr-2 mt-0.5 text-blue-500 flex-shrink-0" />
                <span>
                  <span className="font-medium text-foreground">Reliable Sealing:</span>
                  <span className="text-muted-foreground"> Achieves a robust seal when used with chip ferrules and nuts in corresponding ports.</span>
                </span>
              </li>
              <li className="flex items-start">
                <FlaskConical className="h-5 w-5 mr-2 mt-0.5 text-teal-500 flex-shrink-0" />
                <span>
                  <span className="font-medium text-foreground">Reusable:</span>
                  <span className="text-muted-foreground"> Can be cleaned and reused multiple times if not contaminated, offering cost-effectiveness.</span>
                </span>
              </li>
            </ul>
          </div>
        </div>
        <div className="pt-4 border-t">
          <h4 className="font-semibold text-lg mb-2 text-primary">Chip Type: {product.name || 'Microfluidic Chip'}</h4>
          <p className="text-muted-foreground">
            {/* Placeholder for dynamic chip type description - this should come from product data */}
            {product.name.toLowerCase().includes('straight channel') && "Straight channel chips are fundamental for various microfluidic applications, including laminar flow studies, particle/cell focusing, and simple reactions. Their defined geometry allows for predictable flow profiles and easy observation."}
            {product.name.toLowerCase().includes('droplet generator') && "Droplet generator chips are designed for producing monodisperse droplets, crucial for applications like digital PCR, single-cell analysis, and micro-reactors. They typically feature a T-junction or flow-focusing geometry."}
            {/* Add more descriptions based on product.name or category */}
            {!product.name.toLowerCase().includes('straight channel') && !product.name.toLowerCase().includes('droplet generator') && "This versatile microfluidic chip enables precise fluid control for a variety of research and development applications. Please refer to its specific geometry for detailed use cases."}
          </p>
        </div>
      </CardContent>
    </Card>
  );

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

        {/* Simplified Variant Selection for Channel Width & Depth */}
        <motion.div variants={itemFadeIn} className="space-y-4 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {channelWidthOptions.length > 0 && (
              <div>
                <label htmlFor="channelWidth" className="block text-sm font-medium text-muted-foreground mb-1">Channel Width ({getAttributeUnit(selectedVariant, 'channelWidth') || 'µm'})</label>
                <Select
                  value={selectedChannelWidth?.toString()}
                  onValueChange={(value) => setSelectedChannelWidth(value === 'none' ? undefined : Number(value))}
                >
                  <SelectTrigger id="channelWidth" className="w-full rounded-xl py-3 text-md">
                    <SelectValue placeholder="Select width..." />
                  </SelectTrigger>
                  <SelectContent>
                    {channelWidthOptions.map(width => (
                      <SelectItem key={width.toString()} value={width.toString()}>
                        {width} {getAttributeUnit(selectedVariant, 'channelWidth') || 'µm'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {channelDepthOptions.length > 0 && (
              <div>
                <label htmlFor="channelDepth" className="block text-sm font-medium text-muted-foreground mb-1">Channel Depth ({getAttributeUnit(selectedVariant, 'channelDepth') || 'µm'})</label>
                <Select
                  value={selectedChannelDepth?.toString()}
                  onValueChange={(value) => setSelectedChannelDepth(value === 'none' ? undefined : Number(value))}
                >
                  <SelectTrigger id="channelDepth" className="w-full rounded-xl py-3 text-md">
                    <SelectValue placeholder="Select depth..." />
                  </SelectTrigger>
                  <SelectContent>
                    {channelDepthOptions.map(depth => (
                      <SelectItem key={depth.toString()} value={depth.toString()}>
                        {depth} {getAttributeUnit(selectedVariant, 'channelDepth') || 'µm'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </motion.div>

        {selectedVariant && (
          <motion.div 
            variants={itemFadeIn} 
            className="p-6 border rounded-2xl bg-card shadow-sm space-y-3 mt-6"
          >
            <h3 className="text-xl font-semibold mb-3 text-foreground">Variant Details</h3>
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

        {/* Display other attributes of the selected variant if they exist */}
        {selectedVariant && selectedVariant.attributes.filter(attr => !['channelwidth', 'channeldepth'].includes(attr.name.toLowerCase()) && attr.value !== null && attr.value !== undefined).length > 0 && (
          <motion.div variants={itemFadeIn} className="mt-10 pt-6 border-t">
            <h2 className="text-3xl font-bold tracking-tight text-foreground mb-6">Additional Specifications</h2>
            <div className="space-y-3">
              {selectedVariant.attributes
                .filter(attr => !['channelwidth', 'channeldepth'].includes(attr.name.toLowerCase()) && attr.value !== null && attr.value !== undefined) // Filter out width/depth and null/undefined values
                .map(attr => (
                <div key={attr.name} className="flex justify-between items-center p-4 bg-muted/40 rounded-xl text-md">
                  <span className="font-medium text-foreground capitalize">{attr.name.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <span className="text-muted-foreground">
                    {attr.value} {attr.unit || ''}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
        
        {/* Render the new chip properties section */}
        {renderChipProperties()}
      </motion.div>
    </motion.div>
  );
} 