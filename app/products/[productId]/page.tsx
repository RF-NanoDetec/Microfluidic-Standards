// "use client"; // No longer a client component for the main page structure

import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Product, ProductVariant } from '@/lib/types';
import ProductDetailsClient from '@/components/products/ProductDetailsClient'; // Import the new client component
// import { Button } from '@/components/ui/button'; // Will be in client component
// import { Badge } from '@/components/ui/badge'; // Will be in client component
// import { PlusSquare, ShoppingCart } from 'lucide-react'; // Will be in client component
// import { toast } from "sonner"; // Will be in client component
// import { useCartStore } from '@/store/cartStore'; // Will be in client component
// import ProductVariantSelector from '@/components/products/ProductVariantSelector'; // Will be in client component
// import { useState, useEffect } from 'react'; // No longer needed here

// These data fetching functions can remain as they are, or be moved into lib/data.ts for better organization
async function getProduct(productId: string): Promise<Product | null> { // Updated to return null on error for easier handling
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || ''}/api/products/${productId}`
    );
    if (!res.ok) {
      if (res.status === 404) return null; // Return null if not found
      console.error('Failed to fetch product', res.status, await res.text());
      throw new Error('Failed to fetch product');
    }
    return res.json();
  } catch (error) {
    console.error('Error in getProduct:', error);
    return null; // Return null on any other error
  }
}

async function getProductVariants(productId: string): Promise<ProductVariant[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || ''}/api/products/${productId}/variants`
    );
    if (!res.ok) {
      console.warn(`No variants found for product ${productId} or error fetching. Status: ${res.status}`);
      return [];
    } 
    return res.json();
  } catch (error) {
    console.error('Error in getProductVariants:', error);
    return [];
  }
}

interface ProductPageProps {
  params: {
    productId: string;
  };
}

// This is now a Server Component
export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getProduct(params.productId);
  const variants = await getProductVariants(params.productId);

  if (!product) {
    notFound(); // Call Next.js notFound helper if product is null
  }

  // The main page layout is handled by the server component.
  // The interactive parts are delegated to ProductDetailsClient.
  return (
    <div className="container mx-auto px-4 py-12 md:py-16 lg:py-20">
      <ProductDetailsClient product={product} variants={variants} />
    </div>
  );
}
// ... existing code ...
// The rest of the original file (useEffect, useState, handlers, etc.) will be removed or moved to the new client component. 