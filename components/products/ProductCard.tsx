"use client"; // Mark as a Client Component

import Image from 'next/image';
import Link from 'next/link';
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

interface ProductCardProps {
  product: Product;
  variants?: ProductVariant[];
}

const ProductCard: React.FC<ProductCardProps> = ({ product, variants }) => {
  const { addToCart } = useCartStore();

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

  return (
    <Card className="w-80 flex flex-col overflow-hidden h-full bg-card hover:shadow-xl transition-transform duration-200 ease-in-out hover:-translate-y-1">
      <CardHeader className="pb-2">
        <Link href={`/products/${product.slug}`} className="block group">
          <div className="relative w-full h-48 mb-4 overflow-hidden rounded-t-lg">
            <Image
              src={product.baseImage || '/product.png'}
              alt={product.name}
              layout="fill"
              objectFit="contain"
              className="group-hover:scale-105 transition-transform duration-200 ease-in-out"
              loading="lazy"
            />
          </div>
          <CardTitle className="text-lg font-semibold text-primary group-hover:text-accent transition-colors">
            {product.name}
          </CardTitle>
        </Link>
        <CardDescription className="text-sm text-muted-foreground h-12 overflow-hidden mt-1">
          {truncateDescription(product.baseDescription, 80)}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow pt-0">
        <div className="flex justify-between items-center mb-2">
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
      <CardFooter className="pt-0 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center w-full">
        <Button 
          onClick={() => window.location.href = `/canvas?product=${product.id}`}
          className="w-full sm:flex-1 sm:min-w-0 sm:px-4 sm:py-2"
        >
          <PlusSquare className="h-4 w-4 sm:mr-1" /> To Canvas
        </Button>
        <Button 
          variant="ghost"
          onClick={handleAddToCart}
          className="w-full sm:flex-1 sm:min-w-0 sm:px-3 sm:py-2"
        >
          <ShoppingCart className="h-4 w-4 sm:mr-1" /> 
          {variants && variants.length > 1 ? 'View Options' : 'Add to Cart'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductCard; 