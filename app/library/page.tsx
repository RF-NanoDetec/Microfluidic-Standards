import fs from 'fs/promises';
import path from 'path';
import LibraryClientContent from './components/LibraryClientContent';
import { v4 as uuidv4 } from 'uuid';

// Key attribute definitions for tooltips
const KEY_ATTRIBUTE_DEFINITIONS: Record<string, string> = {
  'High Pressure': 'Supports operation up to 100 bar pressure',
  'Chemical Resistant': 'Compatible with organic solvents and harsh chemicals',
  'Optical Clarity': 'Superior transparency for microscopy and imaging',
  'Thermal Resistant': 'Withstands temperatures from -20°C to 200°C',
  'Low Autofluorescence': 'Minimal background signal for fluorescence applications',
  'Modular': 'Compatible with our standardized connection system',
  'Reusable': 'Designed for multiple experiments and long-term use',
  'Biocompatible': 'Safe for biological samples and cell culture',
};

const ALL_KEY_ATTRIBUTES = Object.keys(KEY_ATTRIBUTE_DEFINITIONS);

function getRandomKeyAttributes(): string[] {
  // Always include 2-4 random attributes, including biocompatible sometimes
  const shuffled = [...ALL_KEY_ATTRIBUTES].sort(() => 0.5 - Math.random());
  const count = Math.floor(Math.random() * 3) + 2; // 2-4 attributes
  return shuffled.slice(0, count);
}

function getAttribute(attributes: any[], name: string): string | number | undefined {
  const attr = attributes.find((a) => a.name === name);
  return attr ? attr.value : undefined;
}

function getAttributeWithUnit(attributes: any[], name: string): string | undefined {
  const attr = attributes.find((a) => a.name === name);
  if (!attr) return undefined;
  return attr.unit ? `${attr.value} ${attr.unit}` : String(attr.value);
}

export default async function LibraryPage() {
  // Read data files
  const [variantsRaw, productsRaw, categoriesRaw] = await Promise.all([
    fs.readFile(path.join(process.cwd(), 'data/productVariants.json'), 'utf-8'),
    fs.readFile(path.join(process.cwd(), 'data/products.json'), 'utf-8'),
    fs.readFile(path.join(process.cwd(), 'data/categories.json'), 'utf-8'),
  ]);
  const productVariants = JSON.parse(variantsRaw).productVariants;
  const products = JSON.parse(productsRaw).products;
  const categories = JSON.parse(categoriesRaw).categories;

  // Prepare flat variant array
  const variants = productVariants.map((variant: any) => {
    const product = products.find((p: any) => p.id === variant.productId) || {};
    const category = categories.find((c: any) => c.id === product.categoryId) || {};
    const material = getAttribute(variant.attributes, 'material') || 'N/A';
    const chipLength = getAttributeWithUnit(variant.attributes, 'chipLength');
    const chipWidth = getAttributeWithUnit(variant.attributes, 'chipWidth');
    const channelWidth = getAttributeWithUnit(variant.attributes, 'channelWidth');
    const channelDepth = getAttributeWithUnit(variant.attributes, 'channelDepth');
    const totalChannelLength = getAttributeWithUnit(variant.attributes, 'totalChannelLength');
    const maxPressure = getAttributeWithUnit(variant.attributes, 'maxPressure');
    // Compose chip size string if both present
    const chipSize = chipLength && chipWidth ? `${chipLength} × ${chipWidth}` : undefined;
    // Randomly assign key attributes for now
    const keyAttributes = getRandomKeyAttributes();
    return {
      id: variant.id,
      name: variant.variantName,
      productName: product.name || '',
      productSlug: product.slug || '',
      categoryId: product.categoryId || '',
      categoryName: category.name || '',
      price: variant.price,
      sku: variant.sku,
      imageUrl: variant.imageUrl,
      stockStatus: variant.stockStatus,
      material,
      chipSize,
      channelWidth,
      channelDepth,
      totalChannelLength,
      maxPressure,
      keyAttributes,
      canvasComponentId: variant.canvasComponentId,
    };
  });

  // Prepare categories for filter
  const filterCategories = categories.map((c: any) => ({ id: c.id, name: c.name }));

  return (
    <LibraryClientContent
      initialVariants={variants}
      categories={filterCategories}
    />
  );
}