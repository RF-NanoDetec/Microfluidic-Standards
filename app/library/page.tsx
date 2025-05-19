"use client";
import { Metadata } from 'next';
import { Product, ProductCategory, ProductVariant } from '@/lib/types';
import LibraryClientContent from './components/LibraryClientContent';
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Table } from '@/components/ui/table';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Info, FlaskConical, MoveHorizontal, MoveVertical, Droplet, Ruler, Square, Repeat, Gauge, Layers, Download, Layout, ShoppingCart, FileText } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { toast } from 'sonner';

// Define an extended variant type for the library page
export interface ExtendedProductVariant extends ProductVariant {
  productName?: string;
  categoryName?: string;
  categoryId?: string;
}

// ShadCN UI Components that we'll likely need:
// import { Input } from '@/components/ui/input';
// import { Button } from '@/components/ui/button';
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // For category filter
// import { Checkbox } from '@/components/ui/checkbox'; // For multi-select attribute filters
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Optional for layout

// Helper function to fetch all product variants (and potentially their parent products/categories)
async function getAllProductVariants(categories: ProductCategory[]): Promise<ExtendedProductVariant[]> {
  try {
    const productsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products`);
    if (!productsResponse.ok) {
      console.error("Failed to fetch products:", productsResponse.statusText);
      return [];
    }
    const products: Product[] = await productsResponse.json();

    let allVariants: ExtendedProductVariant[] = [];
    const categoryMap = new Map(categories.map(cat => [cat.id, cat.name]));

    for (const product of products) {
      const variantsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/${product.id}/variants`);
      if (variantsResponse.ok) {
        const variants: ProductVariant[] = await variantsResponse.json();
        const variantsWithContext = variants.map(v => ({
          ...v,
          productName: product.name,
          categoryId: product.categoryId, // Ensure product objects have categoryId
          categoryName: product.categoryId ? categoryMap.get(product.categoryId) : 'Uncategorized',
        }));
        allVariants = [...allVariants, ...variantsWithContext];
      } else {
        console.error(`Failed to fetch variants for product ${product.id}:`, variantsResponse.statusText);
      }
    }
    return allVariants;
  } catch (error) {
    console.error("Error fetching all product variants:", error);
    return [];
  }
}

// Helper function to fetch categories for filtering
async function getCategories(): Promise<ProductCategory[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories`);
    if (!res.ok) {
      console.error("Failed to fetch categories:", res.statusText);
      return [];
    }
    return res.json();
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

// Order of key attributes to display
const KEY_ATTRIBUTE_ORDER = [
  'material',
  'channelWidth',
  'channelDepth',
  'maxPressure',
  // 'chipLength', // All chipLength is standardized to 5 mm and not shown
  'totalChannelLength',
];

// Tubing-specific attribute order
const TUBING_ATTRIBUTE_ORDER = [
  'material',
  'innerDiameter',
  'outerDiameter',
  'length',
];

// Attribute display mapping with Lucide icons (brand blue for table badges)
const ATTRIBUTE_DISPLAY: Record<string, { label: string; icon?: React.ReactNode; legendIcon?: React.ReactNode; tooltip: string }> = {
  material: {
    label: 'Material',
    icon: <Layers className="inline size-4 mr-1 text-[#003C7E]" />, // Lucide layers, brand blue for table
    legendIcon: <Layers className="inline size-4 mr-1 text-white" />, // White for legend
    tooltip: 'Material: The main material of the component.',
  },
  channelWidth: {
    label: 'Channel Width',
    icon: <MoveHorizontal className="inline size-4 mr-1 text-[#003C7E]" />, // Lucide horizontal arrows, brand blue for table
    legendIcon: <MoveHorizontal className="inline size-4 mr-1 text-white" />, // White for legend
    tooltip: 'Channel Width: The width of the main microfluidic channel (µm).',
  },
  channelDepth: {
    label: 'Channel Depth',
    icon: <MoveVertical className="inline size-4 mr-1 text-[#003C7E]" />, // Lucide vertical arrows, brand blue for table
    legendIcon: <MoveVertical className="inline size-4 mr-1 text-white" />, // White for legend
    tooltip: 'Channel Depth: The depth of the main microfluidic channel (µm).',
  },
  maxPressure: {
    label: 'Max Pressure',
    icon: <Gauge className="inline size-4 mr-1 text-[#003C7E]" />, // Lucide gauge, brand blue for table
    legendIcon: <Gauge className="inline size-4 mr-1 text-white" />, // White for legend
    tooltip: 'Max Pressure: Maximum safe operating pressure (bar).',
  },
  // chipLength is not shown: all chips are standardized to 5 mm
  totalChannelLength: {
    label: 'Total Channel Length',
    icon: <Ruler className="inline size-4 mr-1 text-[#003C7E]" />, // Lucide ruler, brand blue for table
    legendIcon: <Ruler className="inline size-4 mr-1 text-white" />, // White for legend
    tooltip: 'Total Channel Length: The total length of all channels (mm).',
  },
  // Add more mappings as needed
};

// Add tubing-specific display mapping if needed
const TUBING_ATTRIBUTE_DISPLAY: Record<string, { label: string; icon?: React.ReactNode; legendIcon?: React.ReactNode; tooltip: string }> = {
  material: ATTRIBUTE_DISPLAY.material,
  innerDiameter: {
    label: 'Inner Diameter',
    icon: <span className="inline-block font-medium text-xs mr-1 text-[#003C7E]">ID</span>, // Use 'ID' text, lighter
    legendIcon: <span className="inline-block font-medium text-xs mr-1 text-white">ID</span>, // White for legend, lighter
    tooltip: 'Inner Diameter: The inside diameter of the tubing (mm).',
  },
  outerDiameter: {
    label: 'Outer Diameter',
    icon: <span className="inline-block font-medium text-xs mr-1 text-[#003C7E]">OD</span>, // Use 'OD' text, lighter
    legendIcon: <span className="inline-block font-medium text-xs mr-1 text-white">OD</span>, // White for legend, lighter
    tooltip: 'Outer Diameter: The outside diameter of the tubing (mm).',
  },
  length: {
    label: 'Length',
    icon: <Ruler className="inline size-4 mr-1 text-[#003C7E]" />, // ruler icon
    legendIcon: <Ruler className="inline size-4 mr-1 text-white" />, // white for legend
    tooltip: 'Length: The length of the tubing (m).',
  },
};

// Helper to convert filteredVariants to CSV
function variantsToCSV(variants: any[]): string {
  const header = ['Product Name', 'Category', 'Key Attributes', 'Price', 'SKU'];
  const rows = variants.map(variant => {
    const attrMap = Object.fromEntries((variant.attributes || []).map((attr: any) => [attr.name, attr]));
    // Determine which attribute order to use
    const isTubing = (() => {
      const material = (variant.attributes || []).find((a: any) => a.name === 'material')?.value?.toLowerCase();
      return variant.category === 'tubing' || material === 'ptfe' || material === 'peek';
    })();
    const attrOrder = isTubing ? TUBING_ATTRIBUTE_ORDER : KEY_ATTRIBUTE_ORDER;
    const keyAttrs = attrOrder
      .map(key => {
        const attr = attrMap[key];
        if (!attr) return null;
        const display = isTubing ? TUBING_ATTRIBUTE_DISPLAY[key] : ATTRIBUTE_DISPLAY[key];
        return display
          ? `${display.label === 'Material' ? attr.value.charAt(0).toUpperCase() + attr.value.slice(1) : attr.value + (attr.unit ? ` ${attr.unit}` : '')}`
          : attr.value + (attr.unit ? ` ${attr.unit}` : '');
      })
      .filter(Boolean)
      .join(' | ');
    return [
      variant.productName,
      variant.category,
      keyAttrs,
      typeof variant.price === 'number' ? `${variant.price.toFixed(2)} EUR` : variant.price,
      variant.sku,
    ];
  });
  return [header, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
}

export default function LibraryPage() {
  // Step 1: Minimal state for search input and active filters
  const [search, setSearch] = useState('');
  // Example active filters (replace with real logic later)
  const activeFilters = [
    { label: 'Glass', key: 'material-glass' },
    { label: 'Chip', key: 'category-chip' },
  ];

  // Step 2: Minimal state for filter checkboxes (replace with real logic later)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [selectedWidths, setSelectedWidths] = useState<string[]>([]);
  const [selectedDepths, setSelectedDepths] = useState<string[]>([]);

  // Step 3: Fetch all product variants with product and category info
  const [variants, setVariants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cartStore = useCartStore();

  useEffect(() => {
    async function fetchVariants() {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch all products
        const productsRes = await fetch('/api/products');
        if (!productsRes.ok) throw new Error('Failed to fetch products');
        const products = await productsRes.json();

        // For each product, fetch its variants
        const allVariants = await Promise.all(
          products.map(async (product: any) => {
            const variantsRes = await fetch(`/api/products/${product.id}/variants`);
            if (!variantsRes.ok) return [];
            const variants = await variantsRes.json();
            // Attach product and category info to each variant
            return variants.map((variant: any) => ({
              ...variant,
              productName: product.name,
              category: product.categoryId, // Optionally join with category name if needed
            }));
          })
        );
        // Flatten the array
        setVariants(allVariants.flat());
      } catch (err: any) {
        setError(err.message || 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    }
    fetchVariants();
  }, []);

  // Remove hardcoded filter options
  // Dynamically extract unique filter options from variants
  const uniqueValues = (key: string) => {
    const values = new Set<string>();
    variants.forEach(variant => {
      if (key === 'category') {
        if (variant.category) values.add(variant.category);
      } else {
        (variant.attributes || []).forEach((attr: any) => {
          if (attr.name === key && attr.value) values.add(String(attr.value));
        });
      }
    });
    return Array.from(values).sort();
  };

  const categoryOptions = uniqueValues('category').map(value => ({ label: value.charAt(0).toUpperCase() + value.slice(1), value }));
  const materialOptions = uniqueValues('material').map(value => ({ label: value.charAt(0).toUpperCase() + value.slice(1), value }));
  const widthOptions = uniqueValues('channelWidth').map(value => ({ label: value + ' µm', value }));
  const depthOptions = uniqueValues('channelDepth').map(value => ({ label: value + ' µm', value }));

  // Handlers for toggling checkboxes
  const handleToggle = (value: string, selected: string[], setSelected: (v: string[]) => void) => {
    setSelected(selected.includes(value) ? selected.filter(v => v !== value) : [...selected, value]);
  };
  const handleClearFilters = () => {
    setSelectedCategories([]);
    setSelectedMaterials([]);
    setSelectedWidths([]);
    setSelectedDepths([]);
  };

  // Filtering logic
  const filteredVariants = variants.filter(variant => {
    // Category filter
    if (selectedCategories.length > 0 && !selectedCategories.includes(variant.category)) {
      return false;
    }
    // Material filter
    if (selectedMaterials.length > 0) {
      const materialAttr = (variant.attributes || []).find((a: any) => a.name === 'material');
      if (!materialAttr || !selectedMaterials.includes(String(materialAttr.value).toLowerCase())) {
        return false;
      }
    }
    // Channel Width filter
    if (selectedWidths.length > 0) {
      const widthAttr = (variant.attributes || []).find((a: any) => a.name === 'channelWidth');
      if (!widthAttr || !selectedWidths.includes(String(widthAttr.value))) {
        return false;
      }
    }
    // Channel Depth filter
    if (selectedDepths.length > 0) {
      const depthAttr = (variant.attributes || []).find((a: any) => a.name === 'channelDepth');
      if (!depthAttr || !selectedDepths.includes(String(depthAttr.value))) {
        return false;
      }
    }
    // Search filter (case-insensitive, matches product name, SKU, or any attribute value)
    if (search.trim()) {
      const searchLower = search.trim().toLowerCase();
      const matches =
        (variant.productName && variant.productName.toLowerCase().includes(searchLower)) ||
        (variant.sku && variant.sku.toLowerCase().includes(searchLower)) ||
        (variant.attributes || []).some((a: any) => String(a.value).toLowerCase().includes(searchLower));
      if (!matches) return false;
    }
    return true;
  });

  // Pagination state
  const PAGE_SIZE = 25;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filteredVariants.length / PAGE_SIZE));
  const paginatedVariants = filteredVariants.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset to first page when filters/search change
  useEffect(() => {
    setPage(1);
  }, [search, selectedCategories, selectedMaterials, selectedWidths, selectedDepths]);

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* Header is assumed global; if not, add here */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Title & Description */}
        <h1 className="text-2xl font-heading text-[#003C7E] mb-2">Component Library</h1>
        <p className="text-[#8A929B] mb-6">Browse, search, and filter all available microfluidic components.</p>

        {/* Step 1: Search Bar & Active Filters */}
        <div className="mb-4 flex flex-col md:flex-row md:items-center gap-2">
          <Input
            placeholder="Search products, SKU, attribute..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="max-w-md"
          />
          <div className="flex flex-wrap gap-2">
            {/* Example active filter badges; replace with dynamic logic */}
            {activeFilters.map(f => (
              <Badge key={f.key} variant="outline">{f.label}</Badge>
            ))}
          </div>
        </div>

        {/* Main Grid: Filters (left) + Table (right) */}
        <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-6">
          {/* Step 2: Filters Panel */}
          <aside className="md:sticky md:top-24">
            <Accordion type="multiple" className="w-full" defaultValue={["category", "material"]}>
              <AccordionItem value="category">
                <AccordionTrigger>Category</AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-col gap-2">
                    {categoryOptions.map(opt => (
                      <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={selectedCategories.includes(opt.value)}
                          onCheckedChange={() => handleToggle(opt.value, selectedCategories, setSelectedCategories)}
                        />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="material">
                <AccordionTrigger>Material</AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-col gap-2">
                    {materialOptions.map(opt => (
                      <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={selectedMaterials.includes(opt.value)}
                          onCheckedChange={() => handleToggle(opt.value, selectedMaterials, setSelectedMaterials)}
                        />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="width">
                <AccordionTrigger>Channel Width</AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-col gap-2">
                    {widthOptions.map(opt => (
                      <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={selectedWidths.includes(opt.value)}
                          onCheckedChange={() => handleToggle(opt.value, selectedWidths, setSelectedWidths)}
                        />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="depth">
                <AccordionTrigger>Channel Depth</AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-col gap-2">
                    {depthOptions.map(opt => (
                      <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={selectedDepths.includes(opt.value)}
                          onCheckedChange={() => handleToggle(opt.value, selectedDepths, setSelectedDepths)}
                        />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            <Button variant="outline" className="mt-4 w-full" onClick={handleClearFilters}>
              Clear All Filters
            </Button>
          </aside>

          {/* Product Variants Table Section */}
          <section>
            {/* Key Attribute Legend & CSV Export */}
            <div className="flex items-center gap-4 mb-2">
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center cursor-pointer text-mid-grey">
                      <Info className="size-4 mr-1" />
                      <span className="underline text-xs">Key Attribute Legend</span>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent sideOffset={8}>
                    <div className="flex flex-col gap-1 text-xs">
                      {KEY_ATTRIBUTE_ORDER.map(key => (
                        <div key={key} className="flex items-center gap-2">
                          {ATTRIBUTE_DISPLAY[key]?.legendIcon}
                          <span className="font-semibold">{ATTRIBUTE_DISPLAY[key]?.label}:</span>
                          <span>{ATTRIBUTE_DISPLAY[key]?.tooltip}</span>
                        </div>
                      ))}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="ml-auto flex items-center gap-1"
                onClick={() => {
                  const csv = variantsToCSV(filteredVariants);
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'component-library.csv';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                <Download className="size-4" />
                Export CSV
              </Button>
            </div>
            {/* Step 3: Product Variants Table (real data) */}
            {isLoading ? (
              <div className="py-8 text-center text-mid-grey">Loading product variants...</div>
            ) : error ? (
              <div className="py-8 text-center text-red-600">{error}</div>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <th className="text-left font-semibold text-sm text-[#003C7E]">Product Name</th>
                    <th className="text-left font-semibold text-sm text-[#003C7E]">Category</th>
                    <th className="text-left font-semibold text-sm text-[#003C7E]">Key Attributes</th>
                    <th className="text-left font-semibold text-sm text-[#003C7E]">Price</th>
                    <th className="text-left font-semibold text-sm text-[#003C7E]">SKU</th>
                    <th className="text-left font-semibold text-sm text-[#003C7E]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedVariants.map(variant => {
                    // Build a map of attributes for easy lookup
                    const attrMap = Object.fromEntries(
                      (variant.attributes || []).map((attr: any) => [attr.name, attr])
                    );
                    // Determine if the product is tubing
                    const isTubing = (variant: any) => {
                      const material = (variant.attributes || []).find((a: any) => a.name === 'material')?.value?.toLowerCase();
                      return variant.category === 'tubing' || material === 'ptfe' || material === 'peek';
                    };
                    return (
                      <tr key={variant.id} className="border-b last:border-b-0 hover:bg-[#E1E4E8]/40 transition-colors">
                        <td className="py-2 pr-2">{variant.productName}</td>
                        <td className="py-2 pr-2">{variant.category}</td>
                        <td className="py-2 pr-2">
                          <div className="flex flex-wrap gap-1">
                            {(isTubing(variant) ? TUBING_ATTRIBUTE_ORDER : KEY_ATTRIBUTE_ORDER).map(key => {
                              const attr = attrMap[key];
                              if (!attr) return null;
                              const display = isTubing(variant) ? TUBING_ATTRIBUTE_DISPLAY[key] : ATTRIBUTE_DISPLAY[key];
                              const badgeText = display
                                ? `${display.label === 'Material' ? attr.value.charAt(0).toUpperCase() + attr.value.slice(1) : attr.value + (attr.unit ? ` ${attr.unit}` : '')}`
                                : attr.value + (attr.unit ? ` ${attr.unit}` : '');
                              return (
                                <Tooltip key={key}>
                                  <TooltipTrigger asChild>
                                    <span>
                                      <Badge variant="secondary">
                                        {display?.icon} {badgeText}
                                      </Badge>
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent sideOffset={8}>{display?.tooltip || key}</TooltipContent>
                                </Tooltip>
                              );
                            })}
                          </div>
                        </td>
                        <td className="py-2 pr-2">{typeof variant.price === 'number' ? `${variant.price.toFixed(2)} EUR` : variant.price}</td>
                        <td className="py-2 pr-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="font-mono cursor-help">{variant.sku}</span>
                            </TooltipTrigger>
                            <TooltipContent sideOffset={8}>{variant.variantName}</TooltipContent>
                          </Tooltip>
                        </td>
                        <td className="py-2 pr-2">
                          <div className="flex flex-wrap md:flex-nowrap gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="sm" variant="secondary" onClick={() => {/* TODO: Add to Canvas logic */}}>
                                  <Layout className="size-4 mr-1" />
                                  <span className="hidden sm:inline">To Canvas</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Add to Canvas</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    cartStore.addToCart({
                                      id: variant.id,
                                      name: variant.variantName || variant.productName || '',
                                      description: variant.productName || '',
                                      price: typeof variant.price === 'number' ? variant.price : 0,
                                      imageUrl: variant.imageUrl || '',
                                      sku: variant.sku || '',
                                    });
                                    toast.success(`${variant.variantName || variant.productName} added to cart!`);
                                  }}
                                >
                                  <ShoppingCart className="size-4 mr-1" />
                                  <span className="hidden sm:inline">To Cart</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Add to Cart</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="sm" variant="ghost" onClick={() => {/* TODO: Add to Quote logic */}}>
                                  <FileText className="size-4 mr-1" />
                                  <span className="hidden sm:inline">To Quote</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Add to Quote</TooltipContent>
                            </Tooltip>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            )}
            {/* <div className="mt-4 flex justify-between items-center">[Pagination] [Download CSV Button]</div> */}
            {totalPages > 1 && (
              <div className="mt-4 flex justify-center items-center gap-2">
                <Button size="sm" variant="ghost" disabled={page === 1} onClick={() => setPage(page - 1)}>
                  Previous
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <Button
                    key={p}
                    size="sm"
                    variant={p === page ? 'default' : 'ghost'}
                    onClick={() => setPage(p)}
                    className="w-8 h-8 px-0"
                  >
                    {p}
                  </Button>
                ))}
                <Button size="sm" variant="ghost" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
                  Next
                </Button>
              </div>
            )}
          </section>
        </div>
      </main>
      {/* Optional Footer */}
      {/* <footer className="py-4 text-center text-xs text-[#8A929B]">&copy; {new Date().getFullYear()} Microfluidic Standards</footer> */}
    </div>
  );
}

// Potentially move helper functions to separate files if they grow large or are reused
// For now, keeping them here but also adding import placeholders if we decide to move them
// website/app/library/getCategories.ts
// export default async function getCategories(): Promise<ProductCategory[]> { ... }

// website/app/library/getAllProductVariants.ts
// import { ProductCategory, Product, ProductVariant } from '@/lib/types';
// import { ExtendedProductVariant } from './page'; // Or move definition to lib/types
// export default async function getAllProductVariants(categories: ProductCategory[]): Promise<ExtendedProductVariant[]> { ... } 