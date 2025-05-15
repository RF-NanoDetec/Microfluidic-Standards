'use client';

import { useState, useEffect, useMemo } from 'react';
import { ExtendedProductVariant } from '../page'; // Adjust path as necessary
import { ProductCategory, ProductAttribute } from '@/lib/types'; // Corrected import for ProductCategory and ProductAttribute
import { QuoteItem as QuoteStoreItem } from '@/store/quoteStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { FileText, ShoppingCart, ExternalLink } from 'lucide-react'; // Added FileText, ShoppingCart
import { toast } from 'sonner';

interface LibraryClientContentProps {
  initialVariants: ExtendedProductVariant[];
  categories: ProductCategory[];
  addToQuote: (item: Omit<QuoteStoreItem, 'quantity' | 'notes'>, quantity?: number, notes?: string) => void;
}

const FILTERABLE_ATTRIBUTES: string[] = ['material', 'channelWidth', 'channelDepth'];

// Helper to format attributes for display or for quote item
const formatVariantAttributesForQuote = (attributes: ProductAttribute[]): Record<string, string | number> => {
  const formatted: Record<string, string | number> = {};
  if (attributes) {
    attributes.forEach(attr => {
      if (typeof attr.value === 'boolean') {
        formatted[attr.name] = attr.value ? 'Yes' : 'No';
      } else if (attr.value !== undefined && attr.value !== null) { // Ensure value is not undefined or null
        formatted[attr.name] = attr.unit ? `${attr.value} ${attr.unit}` : attr.value;
      }
    });
  }
  return formatted;
};

export default function LibraryClientContent({
  initialVariants,
  categories,
  addToQuote, // Receive addToQuote as a prop
}: LibraryClientContentProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('all'); // Default to 'all'
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, (string | number | boolean)[]>>({});
  const [displayedVariants, setDisplayedVariants] = useState<ExtendedProductVariant[]>(initialVariants);

  const availableAttributeFilters = useMemo(() => {
    const filters: Record<string, Set<string | number | boolean>> = {};
    FILTERABLE_ATTRIBUTES.forEach(attrName => filters[attrName] = new Set());

    initialVariants.forEach(variant => {
      variant.attributes.forEach(attr => {
        if (FILTERABLE_ATTRIBUTES.includes(attr.name) && attr.value !== undefined) {
          filters[attr.name].add(attr.value);
        }
      });
    });

    const sortedFilters: Record<string, (string | number | boolean)[]> = {};
    for (const key in filters) {
      sortedFilters[key] = Array.from(filters[key]).sort((a, b) => {
        const valA = typeof a === 'boolean' ? String(a) : a;
        const valB = typeof b === 'boolean' ? String(b) : b;
        if (typeof valA === 'number' && typeof valB === 'number') return valA - valB;
        if (typeof valA === 'string' && typeof valB === 'string') return valA.localeCompare(valB);
        return 0;
      });
    }
    return sortedFilters;
  }, [initialVariants]);

  useEffect(() => {
    let filtered = initialVariants;

    // Filter by search term
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(variant => 
        variant.variantName?.toLowerCase().includes(lowerSearchTerm) ||
        variant.productName?.toLowerCase().includes(lowerSearchTerm) ||
        variant.sku?.toLowerCase().includes(lowerSearchTerm) ||
        variant.attributes.some(attr => 
          attr.name.toLowerCase().includes(lowerSearchTerm) || 
          String(attr.value).toLowerCase().includes(lowerSearchTerm)
        )
      );
    }

    // Filter by category
    if (selectedCategoryId !== 'all') {
      filtered = filtered.filter(variant => variant.categoryId === selectedCategoryId);
    }

    // Filter by selected attributes
    const activeAttributeFilters = Object.keys(selectedAttributes).filter(
      key => selectedAttributes[key] && selectedAttributes[key].length > 0
    );

    if (activeAttributeFilters.length > 0) {
      filtered = filtered.filter(variant => {
        return activeAttributeFilters.every(attrName => {
          const selectedValues = selectedAttributes[attrName];
          const variantAttribute = variant.attributes.find(attr => attr.name === attrName);
          if (!variantAttribute || variantAttribute.value === undefined) return false;
          return selectedValues.includes(variantAttribute.value);
        });
      });
    }

    setDisplayedVariants(filtered);
  }, [searchTerm, selectedCategoryId, selectedAttributes, initialVariants]);

  const handleAttributeChange = (attributeName: string, value: string | number | boolean, checked: boolean) => {
    setSelectedAttributes(prev => {
      const currentSelections = prev[attributeName] ? [...prev[attributeName]] : [];
      if (checked) {
        if (!currentSelections.includes(value)) {
          currentSelections.push(value);
        }
      } else {
        const index = currentSelections.indexOf(value);
        if (index > -1) {
          currentSelections.splice(index, 1);
        }
      }
      if (currentSelections.length === 0) {
        const { [attributeName]: _, ...rest } = prev;
        return rest;
      }
      return {
        ...prev,
        [attributeName]: currentSelections,
      };
    });
  };

  const handleAddToCartPlaceholder = (variant: ExtendedProductVariant) => {
    console.log('Add to cart placeholder:', variant.sku);
    toast.info(`PLACHOLDER: ${variant.variantName || variant.productName} added to cart.`);
    // To implement fully: import useCartStore, get addToCart, and call it with appropriate CartItem structure.
  };

  const handleAddToQuoteHandler = (variant: ExtendedProductVariant) => {
    if (!variant) return;
    addToQuote({
      id: variant.id,
      name: variant.variantName || variant.productName || 'Unnamed Product',
      imageUrl: variant.imageUrl || '/images/product-placeholder.webp',
      attributes: formatVariantAttributesForQuote(variant.attributes),
    });
    // Toast is handled by the quoteStore itself upon successful add.
  };

  const handleAddToCanvasPlaceholder = (variant: ExtendedProductVariant) => {
    console.log('Add to canvas placeholder:', variant.sku);
    toast.info(`PLACEHOLDER: ${variant.variantName || variant.productName} added to canvas.`);
  };

  const renderAttributes = (attributes?: ProductAttribute[]) => {
    if (!attributes || attributes.length === 0) return 'N/A';
    return attributes
      .map(attr => `${attr.name}: ${String(attr.value)}${attr.unit ? ' ' + attr.unit : ''}`)
      .join('; ');
  };

  return (
    <div>
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <div>
          <label htmlFor="search-library" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            Search Products
          </label>
          <Input 
            type="search" 
            id="search-library" 
            placeholder="Name, SKU, attribute..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <div>
          <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            Filter by Category
          </label>
          <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
            <SelectTrigger id="category-filter" className="w-full">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Attribute Filters Section */}
        {Object.entries(availableAttributeFilters).map(([attrName, values]) => {
          if (values.length === 0) return null; // Don't render filter if no values exist for it
          // Capitalize attribute name for display
          const displayName = attrName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          return (
            <div key={attrName}>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                {displayName}
              </h3>
              <div className="mt-2 p-3 border rounded-md bg-gray-50 dark:bg-gray-800 dark:border-gray-700 space-y-2 max-h-48 overflow-y-auto">
                {values.map(value => {
                  const stringValue = String(value);
                  const checkboxId = `attr-${attrName}-${stringValue.replace(/\s+/g, '-').toLowerCase()}`;
                  return (
                    <div key={checkboxId} className="flex items-center space-x-2">
                      <Checkbox 
                        id={checkboxId} 
                        checked={selectedAttributes[attrName]?.includes(value)} 
                        onCheckedChange={(checked) => handleAttributeChange(attrName, value, !!checked)}
                      />
                      <Label htmlFor={checkboxId} className="text-sm font-normal text-gray-700 dark:text-gray-300 cursor-pointer">
                        {stringValue}{attrName.toLowerCase().includes('width') || attrName.toLowerCase().includes('depth') ? ' µm' : ''} 
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Table Section */}
      <div className="rounded-md border bg-card shadow-sm">
        <div className="p-4 flex justify-between items-center border-b">
            <h2 className="text-lg font-semibold text-primary">
            Product Variants <span className="text-sm font-normal text-muted-foreground">({displayedVariants.length} of {initialVariants.length} shown)</span>
            </h2>
            {/* Placeholder for CSV export or other table-level actions */}
        </div>
        <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap pl-4">Variant Name</TableHead>
                  <TableHead className="whitespace-nowrap">Product</TableHead>
                  <TableHead className="whitespace-nowrap">Category</TableHead>
                  <TableHead className="min-w-[250px]">Key Attributes</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Price</TableHead>
                  <TableHead className="whitespace-nowrap">SKU</TableHead>
                  <TableHead className="text-center sticky right-0 bg-card z-10 pr-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedVariants.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        {initialVariants.length > 0 ? "No variants match your current filters." : "No variants available."}
                        </TableCell>
                    </TableRow>
                )}
                {displayedVariants.map((variant) => (
                  <TableRow key={variant.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium whitespace-nowrap pl-4">
                        <Link href={`/products/${variant.productId}?variant=${variant.id}`} className="hover:underline text-primary" title={`View details for ${variant.variantName}`}>
                            {variant.variantName || 'N/A'}
                        </Link>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{variant.productName || 'N/A'}</TableCell>
                    <TableCell className="whitespace-nowrap">{variant.categoryName || 'N/A'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs whitespace-normal" title={renderAttributes(variant.attributes)}>
                      {renderAttributes(variant.attributes)}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">{variant.price ? `${variant.price.toFixed(2)} EUR` : 'N/A'}</TableCell>
                    <TableCell className="whitespace-nowrap">{variant.sku}</TableCell>
                    <TableCell className="text-center space-x-1 sticky right-0 bg-card z-10 pr-4">
                      <Button variant="outline" size="icon" onClick={() => handleAddToCartPlaceholder(variant)} title="Add to Cart">
                        <ShoppingCart className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleAddToQuoteHandler(variant)} title="Add to Quote Request">
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" asChild title="View Product Details">
                         <Link href={`/products/${variant.productId}?variant=${variant.id}`} > <ExternalLink className="h-4 w-4" /> </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
        </div>
        {displayedVariants.length > 0 && displayedVariants.length < initialVariants.length && (
           <div className="p-4 text-center text-sm text-muted-foreground border-t">
                {initialVariants.length - displayedVariants.length} more variants hidden by current filters.
            </div>
        )}
         {displayedVariants.length === 0 && initialVariants.length > 0 && (
           <div className="p-4 text-center text-sm text-muted-foreground border-t">
                Try adjusting your search or filter criteria.
            </div>
        )}
      </div>
    </div>
  );
} 