"use client"; // Mark as a Client Component

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Product, ProductVariant } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { PlusSquare, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { useCartStore } from '@/store/cartStore';
import { motion } from 'framer-motion';

interface ProductCardProps {
  product: Product;
  variants?: ProductVariant[];
}

// Add this near your other console logs or at the top level
const debugImageLoading = (productName: string, imagePath: string) => {
  console.log(`Loading image for ${productName}:`, imagePath);
};

const ProductCard: React.FC<ProductCardProps> = ({ product, variants }) => {
  const { addToCart } = useCartStore();
  const [useImageFallback, setUseImageFallback] = useState(false);

  // Get the default/first variant's price if variants are available
  const getDisplayPrice = () => {
    if (!variants || variants.length === 0) return null;
    const lowestPrice = Math.min(...variants.map(v => v.price));
    return lowestPrice;
  };

  const formatPrice = (price: number | null) => {
    if (price === null) return 'Price varies';
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  const truncateDescription = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, text.lastIndexOf(' ', maxLength)) + '...';
  };

  const handleAddToCart = () => {
    // If there's only one variant, add it directly
    if (variants && variants.length === 1) {
      addToCart({
        id: variants[0].id,
        name: product.name,
        description: product.baseDescription,
        price: variants[0].price,
        imageUrl: variants[0].imageUrl || product.baseImage,
        sku: variants[0].sku,
      });
      toast.success(`${product.name} added to cart!`);
    } else {
      // If there are multiple variants, redirect to product page
      window.location.href = `/products/${product.slug}`;
    }
  };

  // Add this before the return statement
  const imageSrc = product.baseImage || '/images/product_placeholder.png';
  debugImageLoading(product.name, imageSrc);

  return (
    <Card className="w-full max-w-sm flex flex-col overflow-hidden h-full bg-card hover:shadow-xl transition-transform duration-200 ease-in-out hover:-translate-y-1 rounded-3xl">
      <CardHeader className="p-0">
        <Link href={`/products/${product.slug}`} className="block group">
          <div className="relative w-full aspect-square overflow-hidden">
            <Image
              src={useImageFallback ? '/images/product_placeholder.png' : (product.baseImage || '/images/product_placeholder.png')}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              style={{ objectFit: 'cover' }}
              className="group-hover:scale-105 transition-transform duration-200 ease-in-out"
              loading="lazy"
              onError={() => {
                if (!useImageFallback) {
                  setUseImageFallback(true);
                }
              }}
            />
          </div>
        </Link>
      </CardHeader>
      <CardContent className="flex-grow p-4 flex flex-col">
        <Link href={`/products/${product.slug}`} className="block group mb-1">
          <CardTitle className="text-lg font-semibold text-primary group-hover:text-accent transition-colors">
            {product.name}
          </CardTitle>
        </Link>
        <CardDescription className="text-sm text-muted-foreground h-12 overflow-hidden mt-1">
          {truncateDescription(product.baseDescription, 80)}
        </CardDescription>
        
        <div className="flex justify-between items-center mt-2 mb-2">
          <p className="text-lg font-bold text-primary">
            {formatPrice(getDisplayPrice())}
            {variants && variants.length > 1 && (
              <span className="text-sm font-normal text-muted-foreground ml-1">from</span>
            )}
          </p>
          {product.tags && product.tags.length > 0 && (
            <div className="flex gap-1">
              {product.tags.slice(0, 2).map(tag => (
                <Badge key={tag} variant="outline" className="text-muted-foreground border-muted-foreground/50">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-0 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center w-full p-4 mt-auto">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:flex-1">
          <Button 
            onClick={() => window.location.href = `/canvas?product=${product.id}`}
            className="w-full sm:min-w-0 sm:px-4 sm:py-2 rounded-3xl"
          >
            <PlusSquare className="h-4 w-4 sm:mr-1" /> To Canvas
          </Button>
        </motion.div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:flex-1">
          <Button 
            variant="outline"
            onClick={handleAddToCart}
            className="w-full sm:min-w-0 sm:px-3 sm:py-2 rounded-3xl"
          >
            <ShoppingCart className="h-4 w-4 sm:mr-1" /> 
            {variants && variants.length > 1 ? 'View Options' : 'Add to Cart'}
          </Button>
        </motion.div>
      </CardFooter>
    </Card>
  );
};

export default ProductCard; 