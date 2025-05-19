"use client";
import { Metadata } from 'next';
import { Product, ProductCategory, ProductVariant } from '@/lib/types';
import LibraryClientContent from './components/LibraryClientContent';
import React, { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Table } from '@/components/ui/table';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { Info, FlaskConical, MoveHorizontal, MoveVertical, Droplet, Ruler, Square, Repeat, Gauge, Layers, Download, Layout, ShoppingCart, FileText } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import Link from 'next/link';

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
function variantsToCSV(variants: ExtendedProductVariant[]): string {
  const header = ['Product Name', 'Category', 'Key Attributes', 'Price', 'SKU'];
  const rows = variants.map(variant => {
    const attrMap = Object.fromEntries((variant.attributes || []).map((attr) => [attr.name, attr]));
    const isTubing = (() => {
      const material = (variant.attributes || []).find((a) => a.name === 'material')?.value?.toString().toLowerCase();
      return variant.categoryName?.toLowerCase() === 'tubing' || material === 'ptfe' || material === 'peek';
    })();
    const attrOrder = isTubing ? TUBING_ATTRIBUTE_ORDER : KEY_ATTRIBUTE_ORDER;
    const keyAttrs = attrOrder
      .map(key => {
        const attr = attrMap[key];
        if (!attr) return null;
        const display = isTubing ? TUBING_ATTRIBUTE_DISPLAY[key] : ATTRIBUTE_DISPLAY[key];
        return display
          ? `${display.label === 'Material' ? (String(attr.value).charAt(0).toUpperCase() + String(attr.value).slice(1)) : (attr.value + (attr.unit ? ` ${attr.unit}` : ''))}`
          : (attr.value + (attr.unit ? ` ${attr.unit}` : ''));
      })
      .filter(Boolean)
      .join(' | ');
    return [
      variant.productName,
      variant.categoryName,
      keyAttrs,
      typeof variant.price === 'number' ? `${variant.price.toFixed(2)} EUR` : variant.price,
      variant.sku,
    ];
  });
  return [header, ...rows].map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
}

// Animation variants (can be moved to a shared file)
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

export default function LibraryPage() {
  const [search, setSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [selectedWidths, setSelectedWidths] = useState<string[]>([]);
  const [selectedDepths, setSelectedDepths] = useState<string[]>([]);
  const [variants, setVariants] = useState<ExtendedProductVariant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cartStore = useCartStore();
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 25;

  useEffect(() => {
    async function fetchInitialData() {
      setIsLoading(true);
      setError(null);
      try {
        const categoriesData = await getCategories();
        const allVariantsData = await getAllProductVariants(categoriesData);
        setVariants(allVariantsData);
      } catch (err: any) {
        setError(err.message || 'Unknown error when fetching library data');
      } finally {
        setIsLoading(false);
      }
    }
    fetchInitialData();
  }, []);

  const uniqueValues = (key: string) => {
    const values = new Set<string>();
    variants.forEach((variant: ExtendedProductVariant) => {
      if (key === 'category') {
        if (variant.categoryId) values.add(variant.categoryId);
      } else {
        (variant.attributes || []).forEach((attr) => {
          if (attr.name === key && attr.value) values.add(String(attr.value));
        });
      }
    });
    return Array.from(values).sort();
  };

  const categoryOptions = useMemo(() => {
    const catMap = new Map<string, string>();
    variants.forEach(v => {
      if (v.categoryId && v.categoryName) {
        catMap.set(v.categoryId, v.categoryName);
      }
    });
    return Array.from(catMap.entries()).map(([id, name]) => ({ label: name, value: id })).sort((a,b) => a.label.localeCompare(b.label));
  }, [variants]);

  const materialOptions = uniqueValues('material').map(value => ({ label: String(value).charAt(0).toUpperCase() + String(value).slice(1), value: String(value).toLowerCase() }));
  const widthOptions = uniqueValues('channelWidth').map(value => ({ label: value + ' µm', value }));
  const depthOptions = uniqueValues('channelDepth').map(value => ({ label: value + ' µm', value }));

  const handleToggle = (value: string, selected: string[], setSelected: (v: string[]) => void) => {
    setSelected(selected.includes(value) ? selected.filter(v => v !== value) : [...selected, value]);
  };
  const handleClearFilters = () => {
    setSelectedCategories([]);
    setSelectedMaterials([]);
    setSelectedWidths([]);
    setSelectedDepths([]);
    setSearch('');
    setPage(1);
  };

  const filteredVariants = variants.filter((variant: ExtendedProductVariant) => {
    if (selectedCategories.length > 0 && !selectedCategories.includes(variant.categoryId || '')) {
      return false;
    }
    if (selectedMaterials.length > 0) {
      const materialAttr = (variant.attributes || []).find((a) => a.name === 'material');
      if (!materialAttr || !selectedMaterials.includes(String(materialAttr.value).toLowerCase())) {
        return false;
      }
    }
    if (selectedWidths.length > 0) {
      const widthAttr = (variant.attributes || []).find((a) => a.name === 'channelWidth');
      if (!widthAttr || !selectedWidths.includes(String(widthAttr.value))) {
        return false;
      }
    }
    if (selectedDepths.length > 0) {
      const depthAttr = (variant.attributes || []).find((a) => a.name === 'channelDepth');
      if (!depthAttr || !selectedDepths.includes(String(depthAttr.value))) {
        return false;
      }
    }
    if (search.trim()) {
      const searchLower = search.trim().toLowerCase();
      const matches =
        (variant.productName && variant.productName.toLowerCase().includes(searchLower)) ||
        (variant.sku && variant.sku.toLowerCase().includes(searchLower)) ||
        (variant.categoryName && variant.categoryName.toLowerCase().includes(searchLower)) ||
        (variant.attributes || []).some((a) => String(a.value).toLowerCase().includes(searchLower));
      if (!matches) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredVariants.length / PAGE_SIZE));
  const paginatedVariants = filteredVariants.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search, selectedCategories, selectedMaterials, selectedWidths, selectedDepths]);

  const activeFiltersBadges = useMemo(() => [
    ...selectedCategories.map(cId => {
      const catOption = categoryOptions.find(opt => opt.value === cId);
      return { label: catOption?.label || cId, key: `cat-${cId}`};
    }),
    ...selectedMaterials.map(m => ({ label: m.charAt(0).toUpperCase() + m.slice(1), key: `mat-${m}`})),
    ...selectedWidths.map(w => ({ label: `${w} µm Width`, key: `wid-${w}`})),
    ...selectedDepths.map(d => ({ label: `${d} µm Depth`, key: `dep-${d}`})),
  ].filter(f => f.label), [selectedCategories, selectedMaterials, selectedWidths, selectedDepths, categoryOptions]);

  return (
    <motion.div 
      className="container mx-auto px-4 py-12 md:py-16 lg:py-20 bg-background min-h-screen"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      {/* Title & Description Section */}
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
          Component Library
        </motion.div>
        <motion.h1 
          className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl"
          variants={itemFadeIn}
        >
          Explore Our Microfluidic Components
        </motion.h1>
        <motion.p 
          className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed"
          variants={itemFadeIn}
        >
          Browse, search, and filter our extensive collection of standardized and custom microfluidic parts.
        </motion.p>
      </motion.div>

      {/* Search Bar & Active Filters */}
      <motion.div 
        variants={itemFadeIn} 
        className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-center gap-4 p-6 bg-card border rounded-3xl shadow-sm"
      >
        <Input
          placeholder="Search by name, SKU, category, material..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-grow rounded-3xl text-base px-4 py-2.5 md:max-w-md lg:max-w-lg"
        />
        <div className="flex flex-wrap gap-2 items-center">
          {activeFiltersBadges.length > 0 && <span className="text-sm text-muted-foreground">Active:</span>}
          {activeFiltersBadges.map(f => (
            <Badge key={f.key} variant="secondary" className="rounded-full px-3 py-1 text-sm">
              {f.label}
            </Badge>
          ))}
        </div>
      </motion.div>

      {/* Main Grid: Filters (left) + Table (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 md:gap-8">
        {/* Filters Panel */}
        <motion.aside variants={itemFadeIn} className="lg:sticky lg:top-24 h-fit p-6 bg-card border rounded-3xl shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-foreground">Filters</h3>
            <Button variant="link" className="text-sm px-0 h-auto hover:text-primary" onClick={handleClearFilters}>
              Clear All
            </Button>
          </div>
          <Accordion type="multiple" className="w-full space-y-3" defaultValue={["category", "material"]}>
            <AccordionItem value="category" className="border-none rounded-xl bg-muted/50 p-1">
              <AccordionTrigger className="px-4 py-3 hover:no-underline text-md font-medium rounded-lg data-[state=open]:bg-muted data-[state=open]:shadow-sm">
                Category
              </AccordionTrigger>
              <AccordionContent className="pt-3 px-4 pb-2">
                <div className="space-y-2">
                  {categoryOptions.map(opt => (
                    <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        id={`cat-${opt.value}`}
                        checked={selectedCategories.includes(opt.value)}
                        onCheckedChange={() => handleToggle(opt.value, selectedCategories, setSelectedCategories)}
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="material" className="border-none rounded-xl bg-muted/50 p-1">
              <AccordionTrigger className="px-4 py-3 hover:no-underline text-md font-medium data-[state=open]:bg-muted data-[state=open]:shadow-sm">
                Material
              </AccordionTrigger>
              <AccordionContent className="pt-3 px-4 pb-2">
                <div className="space-y-2">
                  {materialOptions.map(opt => (
                    <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        id={`mat-${opt.value}`}
                        checked={selectedMaterials.includes(opt.value)}
                        onCheckedChange={() => handleToggle(opt.value, selectedMaterials, setSelectedMaterials)}
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="width" className="border-none rounded-xl bg-muted/50 p-1">
              <AccordionTrigger className="px-4 py-3 hover:no-underline text-md font-medium data-[state=open]:bg-muted data-[state=open]:shadow-sm">
                Channel Width
              </AccordionTrigger>
              <AccordionContent className="pt-3 px-4 pb-2">
                <div className="space-y-2">
                  {widthOptions.map(opt => (
                    <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        id={`wid-${opt.value}`}
                        checked={selectedWidths.includes(opt.value)}
                        onCheckedChange={() => handleToggle(opt.value, selectedWidths, setSelectedWidths)}
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="depth" className="border-none rounded-xl bg-muted/50 p-1">
              <AccordionTrigger className="px-4 py-3 hover:no-underline text-md font-medium data-[state=open]:bg-muted data-[state=open]:shadow-sm">
                Channel Depth
              </AccordionTrigger>
              <AccordionContent className="pt-3 px-4 pb-2">
                <div className="space-y-2">
                  {depthOptions.map(opt => (
                    <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        id={`dep-${opt.value}`}
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
        </motion.aside>

        <motion.section variants={itemFadeIn} className="p-6 bg-card border rounded-3xl shadow-sm min-h-[500px]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <Button
              size="lg"
              variant="outline"
              className="rounded-3xl w-full sm:w-auto group"
              onClick={() => { 
                const csv = variantsToCSV(filteredVariants);
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'component-library.csv';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
              disabled={filteredVariants.length === 0}
            >
              <Download className="mr-2 h-4 w-4 group-hover:text-primary transition-colors" />
              Export CSV
            </Button>
          </div>
          
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground text-lg">Loading components...</div>
          ) : error ? (
            <div className="py-12 text-center text-red-600 text-lg">Error: {error}</div>
          ) : paginatedVariants.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-lg">No components match your current filters.</div>
          ) : (
            <>
              <Table>
                <thead>
                  <tr className="border-b">
                    <th className="text-left font-semibold text-sm text-primary/80 uppercase tracking-wider py-3 px-4">Product Name</th>
                    <th className="text-left font-semibold text-sm text-primary/80 uppercase tracking-wider py-3 px-4">Category</th>
                    <th className="text-left font-semibold text-sm text-primary/80 uppercase tracking-wider py-3 px-4">Key Attributes</th>
                    <th className="text-left font-semibold text-sm text-primary/80 uppercase tracking-wider py-3 px-4 text-right">Price</th>
                    <th className="text-left font-semibold text-sm text-primary/80 uppercase tracking-wider py-3 px-4">SKU</th>
                    <th className="text-left font-semibold text-sm text-primary/80 uppercase tracking-wider py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedVariants.map((variant: ExtendedProductVariant) => {
                    const attrMap = Object.fromEntries(
                      (variant.attributes || []).map((attr) => [attr.name, attr])
                    );
                    const isTubing = (() => {
                      const material = (variant.attributes || []).find((a) => a.name === 'material')?.value?.toString().toLowerCase();
                      return variant.categoryName?.toLowerCase() === 'tubing' || material === 'ptfe' || material === 'peek';
                    })();
                    const currentAttrOrder = isTubing ? TUBING_ATTRIBUTE_ORDER : KEY_ATTRIBUTE_ORDER;
                    const currentAttrDisplay = isTubing ? TUBING_ATTRIBUTE_DISPLAY : ATTRIBUTE_DISPLAY;

                    return (
                      <tr key={variant.id} className="border-b last:border-b-0 hover:bg-muted/50 transition-colors duration-150">
                        <td className="py-3 px-4 align-top">
                          <Link href={`/products/${variant.productId}?variant=${variant.id}`} className="font-medium text-foreground hover:text-primary hover:underline">
                            {variant.productName}
                          </Link>
                          <p className="text-xs text-muted-foreground mt-0.5">{variant.variantName}</p>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground align-top">{variant.categoryName}</td>
                        <td className="py-3 px-4 align-top">
                          <div className="flex flex-col space-y-1">
                            {currentAttrOrder.map(key => {
                              const attr = attrMap[key];
                              if (!attr) return null;
                              const display = currentAttrDisplay[key];
                              return (
                                <TooltipProvider key={key} delayDuration={100}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Badge variant="outline" className="text-xs font-normal cursor-default group border-border hover:border-primary/50 whitespace-nowrap">
                                        {display?.icon}
                                        {display?.label === 'Material' 
                                          ? String(attr.value).charAt(0).toUpperCase() + String(attr.value).slice(1)
                                          : `${attr.value}${attr.unit ? ` ${attr.unit}` : ''}`}
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-xs">
                                      <p>{display?.tooltip}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              );
                            }).filter(Boolean)}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm font-semibold text-foreground text-right align-top">
                          {typeof variant.price === 'number' ? `${variant.price.toFixed(2)} EUR` : variant.price}
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground align-top">{variant.sku}</td>
                        <td className="py-3 px-4 align-top">
                          <div className="flex items-center justify-center space-x-2">
                            <TooltipProvider delayDuration={100}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="icon" 
                                    className="rounded-full w-8 h-8 group" 
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
                                    disabled={variant.stockStatus === 'out_of_stock'}
                                  >
                                    <ShoppingCart className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top"><p>{variant.stockStatus === 'out_of_stock' ? 'Out of Stock' : 'Add to Cart'}</p></TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            {/* Add to Canvas / View Details Buttons if needed */}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
              {totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2 pt-6 mt-6 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-3xl"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-3xl"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </motion.section>
      </div>
    </motion.div>
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