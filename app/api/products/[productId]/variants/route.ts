import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { ProductVariant } from '@/lib/types';

export async function GET(
  request: Request,
  context: { params: { productId: string } }
) {
  // Optional: Log the received context for debugging
  // console.log(`[variants/route.ts] Context: ${JSON.stringify(context)}`);

  try {
    // Defensive check for params and productId
    if (!context || !context.params || typeof context.params.productId !== 'string') {
      console.error('[variants/route.ts] Invalid or missing productId in context.params:', context);
      return NextResponse.json(
        { error: 'productId parameter is missing or invalid' },
        { status: 400 }
      );
    }
    const productId = context.params.productId;

    // Read the productVariants.json file
    const filePath = path.join(process.cwd(), 'data', 'productVariants.json');
    const fileContents = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(fileContents);

    // Filter variants for the specific product
    const variants = data.productVariants.filter(
      (variant: ProductVariant) => variant.productId === productId
    );

    if (variants.length === 0) {
      // This is a valid case, product might not have variants
      return NextResponse.json(
        [], // Return empty array for no variants, or a specific message
        // { error: 'No variants found for this product' }, // Or this
        { status: 200 } // Or 404 if you prefer to indicate "resource for variants not found"
      );
    }

    return NextResponse.json(variants);
  } catch (error: any) {
    console.error('Error reading product variants:', error);
    // Ensure error.message is passed if available, otherwise a generic message
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch product variants';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 