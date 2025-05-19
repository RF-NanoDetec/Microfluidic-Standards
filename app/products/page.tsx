import { Product, ProductCategory, ProductVariant } from '@/lib/types';
import ProductsList from '@/components/products/ProductsList';

async function getCategories(): Promise<ProductCategory[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/categories`);
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
}

async function getProductsByCategory(categoryId: string): Promise<Product[]> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || ''}/api/products?category=${categoryId}`
  );
  if (!res.ok) throw new Error(`Failed to fetch products for category ${categoryId}`);
  return res.json();
}

async function getProductVariants(productId: string): Promise<ProductVariant[]> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || ''}/api/products/${productId}/variants`
  );
  if (!res.ok) {
    console.warn(`No variants found for product ${productId}, or error fetching. Status: ${res.status}`);
    return [];
  }
  return res.json();
}

export default async function ProductsPage() {
  // Explicitly type categoriesWithProducts for clarity
  type CategoryWithProductsType = ProductCategory & {
    products: Array<{ product: Product; variants: ProductVariant[] }>;
  };
  let categoriesWithProducts: CategoryWithProductsType[] = [];

  try {
    const categories = await getCategories();
    categoriesWithProducts = await Promise.all(
      categories.map(async (category) => {
        const productsInCategory = await getProductsByCategory(category.id);
        const productsWithVariants = await Promise.all(
          productsInCategory.map(async (product) => {
            const variants = await getProductVariants(product.id);
            return { product, variants };
          })
        );
        return {
          ...category,
          products: productsWithVariants,
        };
      })
    );
  } catch (error) {
    console.error("Failed to load product page data:", error);
    // In a real app, you might set an error state to render a user-friendly message
  }

  return <ProductsList categoriesWithProducts={categoriesWithProducts} />;
} 