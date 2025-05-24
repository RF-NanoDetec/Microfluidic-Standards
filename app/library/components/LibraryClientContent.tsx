'use client';

import { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Search, Filter, Grid, List } from 'lucide-react';
import type { PaletteItemData } from '@/lib/microfluidic-designer/types';

interface SearchFilters {
  search: string;
  category: string;
  chipType: string;
  material: string;
}

interface LibraryClientContentProps {
  items: PaletteItemData[];
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function LibraryClientContent({ items, searchParams = {} }: LibraryClientContentProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    search: (searchParams.search as string) || '',
    category: (searchParams.category as string) || 'all',
    chipType: (searchParams.chipType as string) || 'all',
    material: (searchParams.material as string) || 'all',
  });

  const [sortBy, setSortBy] = useState<string>((searchParams.sort as string) || 'name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState<number>(
    parseInt((searchParams.page as string) || '1', 10)
  );
  const itemsPerPage = 12;

  // Extract unique values for filter options
  const filterOptions = useMemo(() => {
    const categories = [...new Set(items.map(item => item.category).filter(Boolean))];
    const chipTypes = [...new Set(items.map(item => item.chipType).filter(Boolean))];
    const materials = [...new Set(items.map(item => item.material).filter(Boolean))];
    
    return { categories, chipTypes, materials };
  }, [items]);

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    const filtered = items.filter(item => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          item.name.toLowerCase().includes(searchLower) ||
          (item.title && item.title.toLowerCase().includes(searchLower)) ||
          (item.chipType && item.chipType.toLowerCase().includes(searchLower)) ||
          (item.category && item.category.toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;
      }

      // Category filter
      if (filters.category !== 'all' && item.category !== filters.category) {
        return false;
      }

      // Chip type filter
      if (filters.chipType !== 'all' && item.chipType !== filters.chipType) {
        return false;
      }

      // Material filter
      if (filters.material !== 'all' && item.material !== filters.material) {
        return false;
      }

      return true;
    });

    // Sort
    if (sortBy === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'name-desc') {
      filtered.sort((a, b) => b.name.localeCompare(a.name));
    }

    return filtered;
  }, [items, filters, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedItems.length / itemsPerPage);
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedItems.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedItems, currentPage, itemsPerPage]);

  // Update filters
  const updateFilter = useCallback((key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  }, []);

  // Handle search input
  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    updateFilter('search', event.target.value);
  }, [updateFilter]);

  // Handle sort change
  const handleSortChange = useCallback((value: string) => {
    setSortBy(value);
  }, []);

  // Reset filters
  const resetFilters = useCallback(() => {
    setFilters({
      search: '',
      category: 'all',
      chipType: 'all',
      material: 'all',
    });
    setCurrentPage(1);
  }, []);

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search components..."
            value={filters.search}
            onChange={handleSearchChange}
            className="pl-10"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <Select value={filters.category} onValueChange={(value) => updateFilter('category', value)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {filterOptions.categories.map(category => (
                <SelectItem key={category} value={category || ''}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.chipType} onValueChange={(value) => updateFilter('chipType', value)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Chip Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {filterOptions.chipTypes.map(chipType => (
                <SelectItem key={chipType} value={chipType || ''}>
                  {chipType}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.material} onValueChange={(value) => updateFilter('material', value)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Material" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Materials</SelectItem>
              {filterOptions.materials.map(material => material ? (
                <SelectItem key={material} value={material}>
                  {material}
                </SelectItem>
              ) : null)}
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={resetFilters}>
            <Filter className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          Showing {paginatedItems.length} of {filteredAndSortedItems.length} components
        </div>
        
        <div className="flex items-center gap-4">
          {/* Sort */}
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name (A-Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z-A)</SelectItem>
            </SelectContent>
          </Select>

          {/* View Mode */}
          <div className="flex border rounded-lg">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Results */}
      {paginatedItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No components found matching your criteria.</p>
          <Button variant="outline" onClick={resetFilters} className="mt-4">
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className={`grid gap-6 ${
          viewMode === 'grid' 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
            : 'grid-cols-1'
        }`}>
          {paginatedItems.map(item => (
            <Card key={item.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium text-sm">{item.name}</h3>
                </div>
                
                {item.title && (
                  <p className="text-xs text-muted-foreground">{item.title}</p>
                )}
                
                <div className="flex flex-wrap gap-1">
                  {item.chipType && (
                    <Badge variant="outline" className="text-xs">
                      {item.chipType}
                    </Badge>
                  )}
                  {item.material && (
                    <Badge variant="outline" className="text-xs">
                      {item.material}
                    </Badge>
                  )}
                </div>
                
                <Button size="sm" className="w-full">
                  Add to Design
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                aria-disabled={currentPage === 1}
              />
            </PaginationItem>
            
            {[...Array(totalPages)].map((_, i) => (
              <PaginationItem key={i + 1}>
                <PaginationLink
                  onClick={() => setCurrentPage(i + 1)}
                  isActive={currentPage === i + 1}
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            
            <PaginationItem>
              <PaginationNext
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                aria-disabled={currentPage === totalPages}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
} 