"use client";

import { motion } from 'framer-motion';
import { Product, ProductCategory, ProductVariant } from '@/lib/types';
import ProductCard from '@/components/products/ProductCard';

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemFadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

interface ProductsListProps {
  categoriesWithProducts: Array<ProductCategory & {
    products: Array<{ product: Product; variants: ProductVariant[] }>;
  }>;
}

export default function ProductsList({ categoriesWithProducts }: ProductsListProps) {
  return (
    <motion.div
      className="container mx-auto px-4 py-12 md:py-16 lg:py-20"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      <motion.div
        className="flex flex-col items-center justify-center space-y-4 text-center mb-12 md:mb-16"
        variants={fadeIn}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-block rounded-3xl bg-muted px-3 py-1 text-sm"
        >
          Products
        </motion.div>
        <motion.h1
          className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl"
          variants={itemFadeIn}
        >
          Our Product Catalog
        </motion.h1>
        <motion.p
          className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed"
          variants={itemFadeIn}
        >
          Explore our wide range of high-quality microfluidic components and systems.
        </motion.p>
      </motion.div>

      {categoriesWithProducts.length > 0 ? (
        categoriesWithProducts.map((category) => (
          <motion.div
            key={category.id}
            className="mb-12 md:mb-16"
            variants={itemFadeIn}
          >
            <div className="flex flex-col items-start mb-6 md:mb-8">
              <motion.h2
                className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl text-primary mb-1"
                variants={itemFadeIn}
              >
                {category.name}
              </motion.h2>
              {category.description && (
                <motion.p
                  className="text-muted-foreground md:text-lg"
                  variants={itemFadeIn}
                >
                  {category.description}
                </motion.p>
              )}
            </div>

            {category.products.length > 0 ? (
              <motion.div
                className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6 md:gap-8 justify-items-center"
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
              >
                {category.products.map(({ product, variants }) => (
                  <motion.div key={product.id} variants={itemFadeIn}>
                    <ProductCard product={product} variants={variants} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.p
                className="text-center text-muted-foreground py-4"
                variants={itemFadeIn}
              >
                No products available in this category at the moment.
              </motion.p>
            )}
          </motion.div>
        ))
      ) : (
        <motion.div 
          variants={fadeIn}
          className="text-center text-muted-foreground py-8 text-lg"
        >
          No product categories available at the moment. Please check back later.
        </motion.div>
      )}
    </motion.div>
  );
} 