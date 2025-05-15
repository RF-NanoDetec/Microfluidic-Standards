import ProductCard from '@/components/products/ProductCard';
import { Product, ProductCategory, ProductVariant } from '@/lib/types';

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
  if (!res.ok) return []; // Return empty array if no variants found
  return res.json();
}

export default async function ProductsPage() {
  const categories = await getCategories();

  // Fetch products and variants for each category
  const categoriesWithProducts = await Promise.all(
    categories.map(async (category) => {
      const products = await getProductsByCategory(category.id);
      
      // Fetch variants for each product
      const productsWithVariants = await Promise.all(
        products.map(async (product) => {
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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Our Products</h1>
      
      {categoriesWithProducts.map((category) => (
        <div key={category.id} className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-primary">{category.name}</h2>
            <p className="text-muted-foreground">{category.description}</p>
          </div>

          {category.products.length > 0 ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-6 justify-items-center">
              {category.products.map(({ product, variants }) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  variants={variants}
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              No products available in this category at the moment.
            </p>
          )}
        </div>
      ))}

      {categoriesWithProducts.length === 0 && (
        <p className="text-center text-muted-foreground">
          No product categories available at the moment. Please check back later.
        </p>
      )}
    </div>
  );
} 