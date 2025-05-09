import ProductCard from '@/components/products/ProductCard';
import { sampleProducts } from '@/lib/sample-products';
import { AnyProduct } from '@/lib/types';

export default function ProductsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Our Products</h1>
      {sampleProducts && sampleProducts.length > 0 ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-6 justify-items-center">
          {sampleProducts.map((product: AnyProduct) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground">
          No products available at the moment. Please check back later.
        </p>
      )}
    </div>
  );
} 