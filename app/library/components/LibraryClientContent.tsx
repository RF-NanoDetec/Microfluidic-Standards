'use client';

import { useState, useEffect, useMemo } from 'react';
import { ExtendedProductVariant } from '../page'; // Adjust path as necessary
import { ProductCategory, ProductAttribute } from '@/lib/types'; // Corrected import for ProductCategory and ProductAttribute
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

interface LibraryClientContentProps {
  initialVariants: ExtendedProductVariant[];
  categories: ProductCategory[];
}

const FILTERABLE_ATTRIBUTES: string[] = ['material', 'channelWidth', 'channelDepth'];

export default function LibraryClientContent({
  initialVariants,
  categories,
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

  const handleAddToCart = (variant: ExtendedProductVariant) => {
    // TODO: Implement add to cart logic (likely using Zustand store)
    console.log('Add to cart:', variant.sku);
    alert(`Placeholder: Add ${variant.variantName || variant.productName} to cart.`);
  };

  const handleAddToCanvas = (variant: ExtendedProductVariant) => {
    // TODO: Implement add to canvas logic (Phase 4)
    console.log('Add to canvas:', variant.sku);
    alert(`Placeholder: Add ${variant.variantName || variant.productName} to canvas.`);
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
                  const checkboxId = `attr-${attrName}-${stringValue.replace(/\s+/g, '-')}`;
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
      <div>
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
          Product Variants ({displayedVariants.length} of {initialVariants.length} found)
        </h2>
        {displayedVariants.length === 0 && initialVariants.length > 0 ? (
           <p className="text-gray-500 dark:text-gray-400">
            No product variants match your current filter criteria.
          </p>
        ) : initialVariants.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">
            No product variants available. Check data sources.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Variant Name</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Key Attributes</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedVariants.map((variant) => (
                  <TableRow key={variant.id}>
                    <TableCell className="font-medium">{variant.variantName || 'N/A'}</TableCell>
                    <TableCell>{variant.productName || 'N/A'}</TableCell>
                    <TableCell>{variant.categoryName || 'N/A'}</TableCell>
                    <TableCell className="text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate" title={variant.attributes.map(attr => `${attr.name}: ${String(attr.value)}${attr.unit || ''}`).join('; ') || 'N/A'}>
                      {variant.attributes.map(attr => `${attr.name}: ${String(attr.value)}${attr.unit || ''}`).join('; ') || 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">{variant.price ? `${variant.price.toFixed(2)} EUR` : 'N/A'}</TableCell>
                    <TableCell>{variant.sku}</TableCell>
                    <TableCell className="text-center space-x-1">
                      <Button variant="outline" size="sm" onClick={() => handleAddToCanvas(variant)}>
                        To Canvas
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/products/${variant.productId}?variant=${variant.id}`}>Details</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
} 