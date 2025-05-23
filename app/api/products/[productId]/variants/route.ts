import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { ProductVariant } from '@/lib/types';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    // Await the params object in Next.js 15
    const { productId } = await params;

    // Defensive check for productId
    if (typeof productId !== 'string') {
      console.error('[variants/route.ts] Invalid productId:', productId);
      return NextResponse.json(
        { error: 'productId parameter is invalid' },
        { status: 400 }
      );
    }

    // Read the productVariants.json file
    const filePath = path.join(process.cwd(), 'data', 'productVariants.json');
    const fileContents = await fs.readFile(filePath, 'utf8');
    
    // Ensure productVariants is correctly accessed from the parsed JSON
    const jsonData = JSON.parse(fileContents);
    const allProductVariants: ProductVariant[] = jsonData.productVariants || jsonData;

    // Filter variants for the specific product
    const variants = allProductVariants.filter(
      (variant: ProductVariant) => variant.productId === productId
    );

    if (variants.length === 0) {
      // This is a valid case, product might not have variants
      return NextResponse.json(
        [], // Return empty array for no variants
        { status: 200 } 
      );
    }

    return NextResponse.json(variants);
  } catch (error: unknown) {
    console.error('[API/products/[productId]/variants] Error processing request:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch product variants due to an internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}