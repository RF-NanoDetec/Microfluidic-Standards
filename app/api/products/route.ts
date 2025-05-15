import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { Product } from '@/lib/types';

export async function GET(request: Request) {
  try {
    // Get the URL and search params
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('category');

    // Read the products.json file
    const filePath = path.join(process.cwd(), 'data', 'products.json');
    const fileContents = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(fileContents);

    let products = data.products;

    // Filter by category if specified
    if (categoryId) {
      products = products.filter((product: Product) => product.categoryId === categoryId);
    }

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error reading products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
} 