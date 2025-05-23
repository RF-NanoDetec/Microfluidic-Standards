import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { Product } from '@/lib/types';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  // Optional: Log the received context for debugging
  // console.log(`[productId/route.ts] Context: ${JSON.stringify(context)}`);

  try {
    // Await params in Next.js 15
    const { productId } = await params;

    // Defensive check for productId
    if (typeof productId !== 'string') {
      console.error('[productId/route.ts] Invalid productId:', productId);
      return NextResponse.json(
        { error: 'productId parameter is missing or invalid' },
        { status: 400 }
      );
    }

    // Read the products.json file
    const filePath = path.join(process.cwd(), 'data', 'products.json');
    const fileContents = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(fileContents);

    // Find the specific product
    const product = data.products.find((p: Product) => p.id === productId);

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error: unknown) {
    console.error('Error reading product:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch product';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 