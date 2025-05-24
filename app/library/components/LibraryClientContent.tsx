'use client';

import { useState, useMemo, useId, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  ColumnDef,
  ColumnFiltersState,
  FilterFn,
  PaginationState,
  Row,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Search,
  Filter,
  Grid,
  List,
  ChevronDown,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleAlert,
  CircleX,
  Columns3,
  Ellipsis,
  ListFilter,
  Plus,
  Trash,
  ShoppingCart,
  FileText,
  Thermometer,
  Droplets,
  Zap,
  Shield,
  FlaskConical,
  Gauge,
  Ruler,
  Layers,
  Mountain
} from 'lucide-react';
import type { PaletteItemData } from '@/lib/microfluidic-designer/types';
import { PARENT_PRODUCTS, getVariantsForProduct, getDefaultVariant } from '@/lib/microfluidic-designer/productData';
import type { ParentProduct, ProductVariant } from '@/lib/microfluidic-designer/productData';

// Enhanced product item for the table
interface ProductTableItem {
  id: string;
  parentName: string;
  variantName: string;
  sku: string;
  price: number;
  chipType: string;
  category: string;
  stockStatus: string;
  // Designated use attributes
  biocompatible: boolean;
  chemicalResistant: boolean;
  highTemperature: boolean;
  lowFluorescence: boolean;
  // Technical attributes
  material: string;
  channelWidth?: number;
  channelDepth?: number;
  maxPressure?: number;
  channelLength?: number;
  // Derived data
  parentProduct: ParentProduct;
  variant: ProductVariant;
}

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

// Color coding for designated use
const getDesignatedUseColor = (type: string): string => {
  switch (type) {
    case 'biocompatible':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'chemicalResistant':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'highTemperature':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'lowFluorescence':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

// Icon mapping for attributes
const getAttributeIcon = (attribute: string) => {
  switch (attribute) {
    case 'biocompatible':
      return <Shield className="w-3 h-3" />;
    case 'chemicalResistant':
      return <FlaskConical className="w-3 h-3" />;
    case 'highTemperature':
      return <Thermometer className="w-3 h-3" />;
    case 'lowFluorescence':
      return <Zap className="w-3 h-3" />;
    case 'material':
      return <Layers className="w-3 h-3" />;
    case 'channelWidth':
      return <Ruler className="w-3 h-3" />;
    case 'channelDepth':
      return <Mountain className="w-3 h-3" />;
    case 'maxPressure':
      return <Gauge className="w-3 h-3" />;
    case 'channelLength':
      return <Ruler className="w-3 h-3" />;
    default:
      return <CircleAlert className="w-3 h-3" />;
  }
};

// Transform parent products and variants into table items
const createTableItems = (): ProductTableItem[] => {
  const items: ProductTableItem[] = [];
  
  PARENT_PRODUCTS.forEach(parentProduct => {
    const variants = getVariantsForProduct(parentProduct.id);
    
    variants.forEach(variant => {
      const getAttrValue = (name: string) => {
        const attr = variant.attributes.find(a => a.name === name);
        return attr?.value;
      };
      
      const getNumericAttr = (name: string): number => {
        const value = getAttrValue(name);
        return typeof value === 'number' ? value : 0;
      };
      
      items.push({
        id: variant.id,
        parentName: parentProduct.name,
        variantName: variant.variantName,
        sku: variant.sku,
        price: variant.price,
        chipType: parentProduct.chipType,
        category: parentProduct.category,
        stockStatus: variant.stockStatus,
        // Designated use attributes (simulated based on material and properties)
        biocompatible: getAttrValue('material') === 'glass',
        chemicalResistant: getAttrValue('material') === 'glass' || getAttrValue('material') === 'PTFE',
        highTemperature: getNumericAttr('maxPressure') >= 10,
        lowFluorescence: getAttrValue('material') === 'glass',
        // Technical attributes
        material: getAttrValue('material') as string || 'N/A',
        channelWidth: getNumericAttr('channelWidth'),
        channelDepth: getNumericAttr('channelDepth'),
        maxPressure: getNumericAttr('maxPressure'),
        channelLength: getNumericAttr('totalChannelLength') || getNumericAttr('chipLength'),
        parentProduct,
        variant,
      });
    });
  });
  
  return items;
};

// Custom filter functions
const multiColumnFilterFn: FilterFn<ProductTableItem> = (row, columnId, filterValue) => {
  const searchableContent = `${row.original.parentName} ${row.original.variantName} ${row.original.sku}`.toLowerCase();
  const searchTerm = (filterValue ?? "").toLowerCase();
  return searchableContent.includes(searchTerm);
};

const statusFilterFn: FilterFn<ProductTableItem> = (row, columnId, filterValue: string[]) => {
  if (!filterValue?.length) return true;
  const status = row.getValue(columnId) as string;
  return filterValue.includes(status);
};

export default function LibraryClientContent({ items, searchParams = {} }: LibraryClientContentProps) {
  const router = useRouter();
  const id = useId();
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20, // Set to 20 as requested
  });
  
  const [sorting, setSorting] = useState<SortingState>([
    { id: "parentName", desc: false }
  ]);

  const data = useMemo(() => createTableItems(), []);

  // Action handlers
  const handleAddToCart = (item: ProductTableItem) => {
    // TODO: Implement cart functionality
    console.log('Add to cart:', item);
  };

  const handleAddToQuote = (item: ProductTableItem) => {
    // TODO: Implement quote functionality
    console.log('Add to quote:', item);
  };

  const handleViewProduct = (item: ProductTableItem) => {
    router.push(`/products/${item.parentProduct.id}?variant=${item.variant.id}`);
  };

  // Column definitions
  const columns: ColumnDef<ProductTableItem>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      size: 40,
      enableSorting: false,
      enableHiding: false,
    },
    {
      header: "Product",
      accessorKey: "parentName",
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="font-semibold text-primary text-sm">{row.getValue("parentName")}</div>
          <div className="text-xs text-muted-foreground">{row.original.variantName}</div>
          <div className="text-xs font-mono text-blue-600">{row.original.sku}</div>
        </div>
      ),
      size: 220,
      filterFn: multiColumnFilterFn,
      enableHiding: false,
    },
    {
      header: "Price",
      accessorKey: "price",
      cell: ({ row }) => {
        const amount = row.getValue("price") as number;
        const formatted = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(amount);
        return <div className="font-semibold text-primary">{formatted}</div>;
      },
      size: 100,
    },
    {
      header: "Designated Use",
      id: "designatedUse",
      cell: ({ row }) => {
        const item = row.original;
        const attributes = [];
        
        if (item.biocompatible) attributes.push({ key: 'biocompatible', label: 'Bio-Compatible' });
        if (item.chemicalResistant) attributes.push({ key: 'chemicalResistant', label: 'Chemical Resistant' });
        if (item.highTemperature) attributes.push({ key: 'highTemperature', label: 'High Temp' });
        if (item.lowFluorescence) attributes.push({ key: 'lowFluorescence', label: 'Low Fluorescence' });
        
        return (
          <div className="flex flex-wrap gap-1">
            {attributes.map(attr => (
              <Badge
                key={attr.key}
                variant="outline"
                className={`text-xs ${getDesignatedUseColor(attr.key)}`}
              >
                <span className="mr-1">{getAttributeIcon(attr.key)}</span>
                {attr.label}
              </Badge>
            ))}
          </div>
        );
      },
      size: 280,
    },
    {
      header: "Technical Specs",
      id: "technicalSpecs",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs">
              {getAttributeIcon('material')}
              <span className="text-muted-foreground">Material:</span>
              <Badge variant="secondary" className="text-xs">{item.material}</Badge>
            </div>
            {item.channelWidth && item.channelWidth > 0 && (
              <div className="flex items-center gap-1 text-xs">
                {getAttributeIcon('channelWidth')}
                <span className="text-muted-foreground">Width:</span>
                <span className="font-mono">{item.channelWidth}µm</span>
              </div>
            )}
            {item.channelDepth && item.channelDepth > 0 && (
              <div className="flex items-center gap-1 text-xs">
                {getAttributeIcon('channelDepth')}
                <span className="text-muted-foreground">Depth:</span>
                <span className="font-mono">{item.channelDepth}µm</span>
              </div>
            )}
            {item.maxPressure && item.maxPressure > 0 && (
              <div className="flex items-center gap-1 text-xs">
                {getAttributeIcon('maxPressure')}
                <span className="text-muted-foreground">Max Pressure:</span>
                <span className="font-mono">{item.maxPressure} bar</span>
              </div>
            )}
            {item.channelLength && item.channelLength > 0 && (
              <div className="flex items-center gap-1 text-xs">
                {getAttributeIcon('channelLength')}
                <span className="text-muted-foreground">Length:</span>
                <span className="font-mono">{item.channelLength}mm</span>
              </div>
            )}
          </div>
        );
      },
      size: 200,
    },
    {
      header: "Stock",
      accessorKey: "stockStatus",
      cell: ({ row }) => {
        const status = row.getValue("stockStatus") as string;
        return (
          <Badge
            variant={status === "in_stock" ? "default" : "secondary"}
            className="text-xs"
          >
            {status === "in_stock" ? "In Stock" : "Out of Stock"}
          </Badge>
        );
      },
      size: 100,
      filterFn: statusFilterFn,
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleViewProduct(item)}
              className="text-xs"
            >
              View
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="default">
                  <Plus className="w-3 h-3 mr-1" />
                  Add
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleAddToCart(item)}>
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add to Cart
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAddToQuote(item)}>
                  <FileText className="w-4 h-4 mr-2" />
                  Add to Quote
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
      size: 140,
      enableHiding: false,
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    enableSortingRemoval: false,
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    state: {
      sorting,
      pagination,
      columnFilters,
      columnVisibility,
    },
  });

  // Get unique status values for filter
  const uniqueStatusValues = useMemo(() => {
    const statusColumn = table.getColumn("stockStatus");
    if (!statusColumn) return [];
    return Array.from(statusColumn.getFacetedUniqueValues().keys()).sort();
  }, [table.getColumn("stockStatus")?.getFacetedUniqueValues()]);

  const statusCounts = useMemo(() => {
    const statusColumn = table.getColumn("stockStatus");
    if (!statusColumn) return new Map();
    return statusColumn.getFacetedUniqueValues();
  }, [table.getColumn("stockStatus")?.getFacetedUniqueValues()]);

  const selectedStatuses = useMemo(() => {
    const filterValue = table.getColumn("stockStatus")?.getFilterValue() as string[];
    return filterValue ?? [];
  }, [table.getColumn("stockStatus")?.getFilterValue()]);

  const handleStatusChange = (checked: boolean, value: string) => {
    const filterValue = table.getColumn("stockStatus")?.getFilterValue() as string[];
    const newFilterValue = filterValue ? [...filterValue] : [];

    if (checked) {
      newFilterValue.push(value);
    } else {
      const index = newFilterValue.indexOf(value);
      if (index > -1) {
        newFilterValue.splice(index, 1);
      }
    }

    table.getColumn("stockStatus")?.setFilterValue(newFilterValue.length ? newFilterValue : undefined);
  };

  return (
    <div className="space-y-4 bg-gray-50 min-h-screen p-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            {/* Search by product name */}
            <div className="relative">
              <Input
                className="min-w-60 pl-10"
                value={(table.getColumn("parentName")?.getFilterValue() ?? "") as string}
                onChange={(e) => table.getColumn("parentName")?.setFilterValue(e.target.value)}
                placeholder="Search products..."
                type="text"
              />
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center pl-3 text-muted-foreground">
                <ListFilter size={16} strokeWidth={2} />
              </div>
            </div>

            {/* Filter by stock status */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" />
                  Stock Status
                  {selectedStatuses.length > 0 && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {selectedStatuses.length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48" align="start">
                <div className="space-y-3">
                  <div className="text-sm font-medium">Filter by Status</div>
                  {uniqueStatusValues.map((value, i) => (
                    <div key={value} className="flex items-center gap-2">
                      <Checkbox
                        id={`${id}-${i}`}
                        checked={selectedStatuses.includes(value)}
                        onCheckedChange={(checked: boolean) => handleStatusChange(checked, value)}
                      />
                      <Label htmlFor={`${id}-${i}`} className="flex-1 text-sm">
                        {value === "in_stock" ? "In Stock" : "Out of Stock"}
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({statusCounts.get(value)})
                        </span>
                      </Label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Column visibility */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Columns3 className="mr-2 h-4 w-4" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                        onSelect={(event) => event.preventDefault()}
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-lg border bg-white">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent bg-gray-50/50">
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead
                        key={header.id}
                        className="font-semibold text-gray-900"
                      >
                        {header.isPlaceholder ? null : header.column.getCanSort() ? (
                          <div
                            className="flex cursor-pointer select-none items-center gap-2"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {{
                              asc: <ChevronUp className="h-4 w-4" />,
                              desc: <ChevronDown className="h-4 w-4" />,
                            }[header.column.getIsSorted() as string] ?? null}
                          </div>
                        ) : (
                          flexRender(header.column.columnDef.header, header.getContext())
                        )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow 
                    key={row.id} 
                    data-state={row.getIsSelected() && "selected"}
                    className="hover:bg-blue-50/50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No products found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-2">
            <Label htmlFor={`${id}-pageSize`} className="text-sm">
              Rows per page
            </Label>
            <Select
              value={table.getState().pagination.pageSize.toString()}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              <SelectTrigger id={`${id}-pageSize`} className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 30, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={pageSize.toString()}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-sm text-muted-foreground">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()} ({table.getRowCount()} total)
            </div>
            
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => table.firstPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <ChevronFirst className="h-4 w-4" />
                  </Button>
                </PaginationItem>
                <PaginationItem>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </PaginationItem>
                <PaginationItem>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </PaginationItem>
                <PaginationItem>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => table.lastPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    <ChevronLast className="h-4 w-4" />
                  </Button>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      </div>
    </div>
  );
}