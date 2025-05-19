"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import {
  Search, Filter, ChevronDown, ChevronUp, Plus, Eye, ShoppingCart, Layers, Info, Droplet, Ruler, Thermometer, FlaskConical, ShieldCheck, CheckCircle, ArrowUpDown, ArrowDown, ArrowUp, ArrowLeftRight, Download
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious
} from "@/components/ui/pagination";

// Key attribute color and tooltip map
const KEY_ATTRIBUTE_META: Record<string, { color: string; tooltip: string; icon?: React.ReactNode }> = {
  "High Pressure": {
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    tooltip: "Supports operation up to 100 bar pressure",
    icon: <Thermometer className="inline h-3 w-3 mr-1" />,
  },
  "Chemical Resistant": {
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    tooltip: "Compatible with organic solvents and harsh chemicals",
    icon: <FlaskConical className="inline h-3 w-3 mr-1" />,
  },
  "Optical Clarity": {
    color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
    tooltip: "Superior transparency for microscopy and imaging",
    icon: <Eye className="inline h-3 w-3 mr-1" />,
  },
  "Thermal Resistant": {
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    tooltip: "Withstands temperatures from -20°C to 200°C",
    icon: <Thermometer className="inline h-3 w-3 mr-1" />,
  },
  "Low Autofluorescence": {
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    tooltip: "Minimal background signal for fluorescence applications",
    icon: <Droplet className="inline h-3 w-3 mr-1" />,
  },
  "Modular": {
    color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
    tooltip: "Compatible with our standardized connection system",
    icon: <Layers className="inline h-3 w-3 mr-1" />,
  },
  "Reusable": {
    color: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300",
    tooltip: "Designed for multiple experiments and long-term use",
    icon: <CheckCircle className="inline h-3 w-3 mr-1" />,
  },
  "Biocompatible": {
    color: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
    tooltip: "Safe for biological samples and cell culture",
    icon: <ShieldCheck className="inline h-3 w-3 mr-1" />,
  },
};

interface Variant {
  id: string;
  name: string;
  productName: string;
  productSlug: string;
  categoryId: string;
  categoryName: string;
  price: number;
  sku: string;
  imageUrl?: string;
  stockStatus?: string;
  material?: string;
  chipSize?: string;
  channelWidth?: string;
  channelDepth?: string;
  totalChannelLength?: string;
  maxPressure?: string;
  keyAttributes: string[];
  canvasComponentId?: string;
}

interface Category {
  id: string;
  name: string;
}

interface LibraryClientContentProps {
  initialVariants: Variant[];
  categories: Category[];
}

// Helper to count active filters
const countActiveFilters = (selectedAttributes: Record<string, string[]>, selectedCategoryId: string, searchTerm: string) => {
  let count = 0;
  if (selectedCategoryId) count++;
  Object.values(selectedAttributes).forEach((arr: string[]) => count += arr.length);
  if (searchTerm) count++;
  return count;
};

// Helper function to convert array of objects to CSV string
function convertToCSV(data: Variant[], headers: Record<keyof Variant | string, string>): string {
  const headerRow = Object.values(headers).join(",") + "\n";
  const dataRows = data.map(row => {
    return (Object.keys(headers) as Array<keyof Variant | string>).map(key => {
      let cellValue = "";
      if (key === 'keyAttributes' && Array.isArray(row[key])) {
        cellValue = `"${(row[key] as string[]).join("; ")}"`; // Join array with semicolon, quote
      } else if (key in row) {
        cellValue = String(row[key as keyof Variant] ?? "");
        if (cellValue.includes(',')) {
          cellValue = `"${cellValue}"`; // Quote if contains comma
        }
      }
      return cellValue;
    }).join(",");
  }).join("\n");
  return headerRow + dataRows;
}

export function LibraryClientContent({
  initialVariants,
  categories,
}: LibraryClientContentProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedAttributes, setSelectedAttributes] = useState<{
    material: string[];
    channelWidth: string[];
    channelDepth: string[];
    keyAttributes: string[];
  }>({
    material: [],
    channelWidth: [],
    channelDepth: [],
    keyAttributes: [],
  });
  const [displayedVariants, setDisplayedVariants] = useState<Variant[]>(initialVariants);
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Variant | "channelWidth" | "channelDepth" | "totalChannelLength" | "price";
    direction: "asc" | "desc";
  }>({ key: "name", direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Extract unique values for filters
  const attributeValues = useMemo(() => {
    const materials = new Set<string>();
    const channelWidths = new Set<string>();
    const channelDepths = new Set<string>();
    const keyAttributes = new Set<string>();
    initialVariants.forEach((variant) => {
      if (variant.material) materials.add(variant.material);
      if (variant.channelWidth) channelWidths.add(variant.channelWidth);
      if (variant.channelDepth) channelDepths.add(variant.channelDepth);
      variant.keyAttributes.forEach((attr) => keyAttributes.add(attr));
    });
    return {
      materials: Array.from(materials).sort(),
      channelWidths: Array.from(channelWidths).sort(),
      channelDepths: Array.from(channelDepths).sort(),
      keyAttributes: Array.from(keyAttributes).sort(),
    };
  }, [initialVariants]);

  // Handle attribute filter changes
  const handleAttributeChange = (
    attributeType: keyof typeof selectedAttributes,
    value: string
  ) => {
    setSelectedAttributes((prev) => {
      const isSelected = prev[attributeType].includes(value);
      if (isSelected) {
        return {
          ...prev,
          [attributeType]: prev[attributeType].filter((item) => item !== value),
        };
      } else {
        return {
          ...prev,
          [attributeType]: [...prev[attributeType], value],
        };
      }
    });
  };

  // Handle sorting
  const handleSort = (key: typeof sortConfig.key) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig.key === key) {
      direction = sortConfig.direction === "asc" ? "desc" : "asc";
    }
    setSortConfig({ key, direction });
  };

  // Apply filters and search
  useEffect(() => {
    let filtered = [...initialVariants];
    // Search
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((variant) =>
        variant.name.toLowerCase().includes(searchLower) ||
        variant.productName.toLowerCase().includes(searchLower) ||
        variant.sku.toLowerCase().includes(searchLower) ||
        (variant.material?.toLowerCase().includes(searchLower) ?? false) ||
        (variant.chipSize?.toLowerCase().includes(searchLower) ?? false) ||
        (variant.channelWidth?.toLowerCase().includes(searchLower) ?? false) ||
        (variant.channelDepth?.toLowerCase().includes(searchLower) ?? false) ||
        (variant.totalChannelLength?.toLowerCase().includes(searchLower) ?? false) ||
        variant.keyAttributes.some((attr) => attr.toLowerCase().includes(searchLower))
      );
    }
    // Category
    if (selectedCategoryId) {
      filtered = filtered.filter((variant) => variant.categoryId === selectedCategoryId);
    }
    // Material
    if (selectedAttributes.material.length > 0) {
      filtered = filtered.filter(
        (variant) => variant.material && selectedAttributes.material.includes(variant.material)
      );
    }
    // Channel Width
    if (selectedAttributes.channelWidth.length > 0) {
      filtered = filtered.filter(
        (variant) => variant.channelWidth && selectedAttributes.channelWidth.includes(variant.channelWidth)
      );
    }
    // Channel Depth
    if (selectedAttributes.channelDepth.length > 0) {
      filtered = filtered.filter(
        (variant) => variant.channelDepth && selectedAttributes.channelDepth.includes(variant.channelDepth)
      );
    }
    // Key Attributes
    if (selectedAttributes.keyAttributes.length > 0) {
      filtered = filtered.filter((variant) =>
        selectedAttributes.keyAttributes.every((attr) => variant.keyAttributes.includes(attr))
      );
    }
    // Sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortConfig.key as keyof Variant];
      let bValue: any = b[sortConfig.key as keyof Variant];
      if (sortConfig.key === "price") {
        aValue = Number(aValue);
        bValue = Number(bValue);
      }
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortConfig.direction === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      return sortConfig.direction === "asc"
        ? aValue - bValue
        : bValue - aValue;
    });
    setDisplayedVariants(filtered);
  }, [initialVariants, searchTerm, selectedCategoryId, selectedAttributes, sortConfig]);

  // Calculate current page items and total pages AFTER filtering and sorting
  const paginatedVariants = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return displayedVariants.slice(startIndex, endIndex);
  }, [displayedVariants, currentPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(displayedVariants.length / ITEMS_PER_PAGE);
  }, [displayedVariants]);

  // Calculate stats for the current view
  const stats = useMemo(() => {
    const totalCount = initialVariants.length;
    const filteredCount = displayedVariants.length;
    const priceRange = filteredCount > 0
      ? {
          min: Math.min(...displayedVariants.map((v) => v.price)),
          max: Math.max(...displayedVariants.map((v) => v.price)),
        }
      : { min: 0, max: 0 };
    return { totalCount, filteredCount, priceRange };
  }, [initialVariants, displayedVariants]);

  // Table icons for parameters
  const paramIcon = {
    material: <FlaskConical className="inline h-4 w-4 text-muted-foreground mr-1" />,
    chipSize: <Ruler className="inline h-4 w-4 text-muted-foreground mr-1" />,
    channelWidth: <ArrowLeftRight className="inline h-4 w-4 text-muted-foreground mr-1" />,
    channelDepth: <ArrowUpDown className="inline h-4 w-4 text-muted-foreground mr-1" />,
    totalChannelLength: <Ruler className="inline h-4 w-4 text-muted-foreground mr-1" />,
    maxPressure: <Thermometer className="inline h-4 w-4 text-muted-foreground mr-1" />,
  };

  // Local event handler for Add to Quote
  const handleAddToQuote = (variantId: string) => {
    // TODO: Implement quote logic (e.g., show toast, add to state, etc.)
    // For now, just log
    console.log('Add to Quote:', variantId);
  };

  const handleExportCSV = () => {
    const csvHeaders = {
      name: "Variant Name",
      productName: "Product",
      categoryName: "Category",
      material: "Material",
      chipSize: "Chip Size",
      channelWidth: "Channel Width",
      channelDepth: "Channel Depth",
      totalChannelLength: "Total Channel Length",
      maxPressure: "Max Pressure",
      keyAttributes: "Key Attributes", // Will be joined array
      price: "Price (€)",
      sku: "SKU",
    };
    const csvData = convertToCSV(displayedVariants, csvHeaders);
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "microfluidic_components.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const activeFilterCount = countActiveFilters(selectedAttributes, selectedCategoryId, searchTerm);

  return (
    <div className="flex flex-col space-y-6">
      {/* Header with search and stats */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        {/* Search input - ensure it doesn't shrink and is aligned left */}
        <div className="relative w-full md:w-auto md:flex-grow md:max-w-md">
          <Input
            placeholder="Search by name, SKU, or attributes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        </div>
        {/* Action buttons and stats - align right */}
        <div className="flex items-center gap-2 md:gap-4 ml-auto">
          <Badge variant="outline" className="px-3 py-1">
            {stats.filteredCount} of {stats.totalCount} items
          </Badge>
          
          {stats.filteredCount > 0 && (
            <Badge variant="secondary" className="px-3 py-1">
              Price: €{stats.priceRange.min.toFixed(2)} - €{stats.priceRange.max.toFixed(2)}
            </Badge>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="hidden md:flex"
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="hidden md:flex"
          >
            <Filter className="mr-2 h-4 w-4" />
            {isFilterOpen ? "Hide Filters" : "Show Filters"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Filters sidebar - now collapsible on desktop too */}
        <Collapsible
          open={isFilterOpen}
          onOpenChange={setIsFilterOpen}
          className="md:col-span-1"
        >
          <CollapsibleTrigger asChild className="md:hidden w-full mb-4">
            <Button variant="outline" className="flex justify-between w-full">
              <div className="flex items-center">
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </div>
              {isFilterOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="sticky top-4">
            <Card className="border rounded-lg shadow-sm bg-white dark:bg-gray-800">
              {/* Header */}
              <div className="p-3 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  <h2 className="font-semibold text-base">Filters</h2>
                </div>
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="text-xs h-5 flex items-center">{activeFilterCount}</Badge>
                )}
              </div>
              {/* Accordion for filter groups */}
              <Accordion type="multiple" className="px-1 py-0">
                {/* Category Filter */}
                <AccordionItem value="category" className="border-b">
                  <AccordionTrigger className="py-2 px-1 text-sm hover:no-underline">
                    Category
                  </AccordionTrigger>
                  <AccordionContent className="px-1 pb-2">
                    <div className="space-y-1">
                      <Select
                        value={selectedCategoryId || "all"}
                        onValueChange={val => setSelectedCategoryId(val === "all" ? "" : val)}
                      >
                        <SelectTrigger id="category">
                          <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                {/* Material Filter */}
                <AccordionItem value="material" className="border-b">
                  <AccordionTrigger className="py-2 px-1 text-sm hover:no-underline">
                    Material
                  </AccordionTrigger>
                  <AccordionContent className="px-1 pb-2">
                    <div className="space-y-1">
                      {attributeValues.materials.map((material) => (
                        <div key={material} className="flex items-center gap-1">
                          <Checkbox
                            id={`material-${material}`}
                            checked={selectedAttributes.material.includes(material)}
                            onCheckedChange={() => handleAttributeChange("material", material)}
                          />
                          <Label
                            htmlFor={`material-${material}`}
                            className="text-xs cursor-pointer"
                          >
                            {material}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
                {/* Channel Width Filter */}
                <AccordionItem value="channelWidth" className="border-b">
                  <AccordionTrigger className="py-2 px-1 text-sm hover:no-underline">
                    Channel Width
                  </AccordionTrigger>
                  <AccordionContent className="px-1 pb-2">
                    <div className="space-y-1">
                      {attributeValues.channelWidths.map((width) => (
                        <div key={width} className="flex items-center gap-1">
                          <Checkbox
                            id={`width-${width}`}
                            checked={selectedAttributes.channelWidth.includes(width)}
                            onCheckedChange={() => handleAttributeChange("channelWidth", width)}
                          />
                          <Label
                            htmlFor={`width-${width}`}
                            className="text-xs cursor-pointer"
                          >
                            {width}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
                {/* Channel Depth Filter */}
                <AccordionItem value="channelDepth" className="border-b">
                  <AccordionTrigger className="py-2 px-1 text-sm hover:no-underline">
                    Channel Depth
                  </AccordionTrigger>
                  <AccordionContent className="px-1 pb-2">
                    <div className="space-y-1">
                      {attributeValues.channelDepths.map((depth) => (
                        <div key={depth} className="flex items-center gap-1">
                          <Checkbox
                            id={`depth-${depth}`}
                            checked={selectedAttributes.channelDepth.includes(depth)}
                            onCheckedChange={() => handleAttributeChange("channelDepth", depth)}
                          />
                          <Label
                            htmlFor={`depth-${depth}`}
                            className="text-xs cursor-pointer"
                          >
                            {depth}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
                {/* Key Attributes Filter */}
                <AccordionItem value="keyAttributes" className="border-b-0">
                  <AccordionTrigger className="py-2 px-1 text-sm hover:no-underline">
                    Key Attributes
                  </AccordionTrigger>
                  <AccordionContent className="px-1 pb-2">
                    <div className="space-y-1">
                      {attributeValues.keyAttributes.map((attr) => (
                        <div key={attr} className="flex items-center gap-1">
                          <Checkbox
                            id={`keyattr-${attr}`}
                            checked={selectedAttributes.keyAttributes.includes(attr)}
                            onCheckedChange={() => handleAttributeChange("keyAttributes", attr)}
                          />
                          <Label
                            htmlFor={`keyattr-${attr}`}
                            className="text-xs cursor-pointer"
                          >
                            {attr}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              {/* Reset Filters button */}
              <div className="p-3 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategoryId("");
                    setSelectedAttributes({
                      material: [],
                      channelWidth: [],
                      channelDepth: [],
                      keyAttributes: [],
                    });
                    setSortConfig({ key: "name", direction: "asc" });
                  }}
                >
                  Reset Filters
                </Button>
              </div>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Products table */}
        <div className="md:col-span-3">
          <div className="rounded-md border bg-background">
            {/* Key Attribute Legend */}
            <div className="p-4 border-b flex flex-col gap-2">
              <div className="flex items-center gap-2 mb-1">
                <Info className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium">Key Attributes Legend</h3>
              </div>
              <div className="flex flex-wrap gap-2 mt-1">
                {Object.entries(KEY_ATTRIBUTE_META).map(([attribute, meta]) => (
                  <TooltipProvider key={attribute}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge
                          variant="outline"
                          className={`${meta.color} cursor-help text-xs`}
                        >
                          {meta.icon}{attribute}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">{meta.tooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[220px] cursor-pointer" onClick={() => handleSort("name")}>Name {sortConfig.key === "name" && (sortConfig.direction === "asc" ? <ArrowUp className="inline h-3 w-3 ml-1" /> : <ArrowDown className="inline h-3 w-3 ml-1" />)}</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("productName")}>Product {sortConfig.key === "productName" && (sortConfig.direction === "asc" ? <ArrowUp className="inline h-3 w-3 ml-1" /> : <ArrowDown className="inline h-3 w-3 ml-1" />)}</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("categoryName")}>Category {sortConfig.key === "categoryName" && (sortConfig.direction === "asc" ? <ArrowUp className="inline h-3 w-3 ml-1" /> : <ArrowDown className="inline h-3 w-3 ml-1" />)}</TableHead>
                  <TableHead>Parameters</TableHead>
                  <TableHead>Key Attributes</TableHead>
                  <TableHead className="text-right cursor-pointer" onClick={() => handleSort("price")}>Price {sortConfig.key === "price" && (sortConfig.direction === "asc" ? <ArrowUp className="inline h-3 w-3 ml-1" /> : <ArrowDown className="inline h-3 w-3 ml-1" />)}</TableHead>
                  <TableHead className="font-mono text-xs">SKU</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedVariants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      No results found. Try adjusting your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedVariants.map((variant) => (
                    <TableRow key={variant.id}>
                      {/* Name + subtitle */}
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          {variant.name}
                          <span className="text-xs text-muted-foreground mt-1">
                            {variant.material && <span>{paramIcon.material}{variant.material}</span>}
                            {variant.chipSize && <span className="ml-2">{paramIcon.chipSize}{variant.chipSize}</span>}
                          </span>
                        </div>
                      </TableCell>
                      {/* Product */}
                      <TableCell>{variant.productName}</TableCell>
                      {/* Category */}
                      <TableCell><Badge variant="outline">{variant.categoryName}</Badge></TableCell>
                      {/* Parameters */}
                      <TableCell>
                        <div className="flex flex-col gap-1 text-xs">
                          {variant.channelWidth && <span>{paramIcon.channelWidth}Width: {variant.channelWidth}</span>}
                          {variant.channelDepth && <span>{paramIcon.channelDepth}Depth: {variant.channelDepth}</span>}
                          {variant.totalChannelLength && <span>{paramIcon.totalChannelLength}Length: {variant.totalChannelLength}</span>}
                          {variant.maxPressure && <span>{paramIcon.maxPressure}Pressure: {variant.maxPressure}</span>}
                        </div>
                      </TableCell>
                      {/* Key Attributes */}
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {variant.keyAttributes.map((attr) => (
                            <TooltipProvider key={attr}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge variant="outline" className={`${KEY_ATTRIBUTE_META[attr]?.color ?? ""} text-xs cursor-help`}>
                                    {KEY_ATTRIBUTE_META[attr]?.icon}{attr}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">{KEY_ATTRIBUTE_META[attr]?.tooltip}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ))}
                        </div>
                      </TableCell>
                      {/* Price */}
                      <TableCell className="text-right font-medium">
                        €{variant.price.toFixed(2)}
                      </TableCell>
                      {/* SKU */}
                      <TableCell className="font-mono text-xs">{variant.sku}</TableCell>
                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <ShoppingCart className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Add to Cart</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => handleAddToQuote(variant.id)}>
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Add to Quote</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Layers className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Add to Canvas</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Link href={`/products/${variant.productSlug}`} aria-label="View Details">
                                  <Button variant="ghost" size="icon">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </Link>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>View Details</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="py-4 border-t">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : undefined}
                        aria-disabled={currentPage === 1}
                      />
                    </PaginationItem>
                    {/* Render page numbers (simplified for brevity, can add ellipsis) */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : undefined}
                        aria-disabled={currentPage === totalPages}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LibraryClientContent;
