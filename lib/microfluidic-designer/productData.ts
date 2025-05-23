import { PaletteItemData, CanvasItemData } from './types';
import { CHIP_WIDTH, CHIP_HEIGHT, PUMP_CANVAS_WIDTH, PUMP_CANVAS_HEIGHT } from './constants';
import productVariantsData from '../../data/productVariants.json';

// Define parent product types that can be dragged to canvas
export interface ParentProduct {
  id: string;
  name: string;
  chipType: string;
  category: 'Microfluidic Chips' | 'Other';
  title: string;
  previewImage: string;
  variants: ProductVariant[];
  defaultPorts: Array<{
    id: string;
    name: string;
    x: number;
    y: number;
    type: 'universal';
    orientation: 'left' | 'right' | 'top' | 'bottom';
    simulationRole?: 'inlet' | 'outlet' | 'inout';
  }>;
  defaultWidth: number;
  defaultHeight: number;
  internalConnections?: string[][];
  defaultPortPressures?: Record<string, number>;
}

// Product variant interface matching the JSON structure
export interface ProductVariant {
  id: string;
  productId: string;
  variantName: string;
  sku: string;
  price: number;
  imageUrl?: string;
  stockStatus: string;
  attributes: Array<{
    name: string;
    value: number | string;
    unit?: string;
  }>;
  canvasComponentId?: string;
}

// Extract variants from the JSON data
const { productVariants } = productVariantsData;

// Filter variants specifically for syringe pumps and pressure pumps
const syringePumpVariants = productVariants.filter(
  variant => variant.productId === 'syringe-pump'
);
const pressurePumpVariants = productVariants.filter(
  variant => variant.productId === 'pressure-pump'
);

// Helper function to get attribute value
function getAttributeValue(variant: ProductVariant, attributeName: string): number | string | undefined {
  const attr = variant.attributes.find(a => a.name === attributeName);
  return attr?.value;
}

// Helper function to get numeric attribute value
function getNumericAttribute(variant: ProductVariant, attributeName: string): number {
  const value = getAttributeValue(variant, attributeName);
  return typeof value === 'number' ? value : 0;
}

// Group variants by parent product
const variantsByProduct = productVariants.reduce((acc, variant) => {
  if (!acc[variant.productId]) {
    acc[variant.productId] = [];
  }
  acc[variant.productId].push(variant);
  return acc;
}, {} as Record<string, ProductVariant[]>);

// Define parent products for canvas palette
export const PARENT_PRODUCTS: ParentProduct[] = [
  {
    id: 'straight-channel-chip',
    name: 'Straight Channel',
    chipType: 'straight',
    category: 'Microfluidic Chips',
    title: 'Straight Channel: Simple fluid path with various channel sizes.',
    previewImage: '/images/products/straight-channel-chip-parent.svg',
    variants: variantsByProduct['straight-channel-chip'] || [],
    defaultPorts: [
      { id: 'port_left', name: 'Left', x: 0, y: CHIP_HEIGHT / 2, type: 'universal', orientation: 'left', simulationRole: 'inlet' },
      { id: 'port_right', name: 'Right', x: CHIP_WIDTH, y: CHIP_HEIGHT / 2, type: 'universal', orientation: 'right', simulationRole: 'outlet' },
    ],
    defaultWidth: CHIP_WIDTH,
    defaultHeight: CHIP_HEIGHT,
  },
  {
    id: 'x-junction-chip',
    name: 'X-Junction',
    chipType: 'x-type',
    category: 'Microfluidic Chips',
    title: 'X-Junction: 4-way intersection with various channel sizes.',
    previewImage: '/images/products/x-junction-chip-parent.svg',
    variants: variantsByProduct['x-junction-chip'] || [],
    defaultPorts: [
      { id: 'port_left', name: 'Left', x: 0, y: CHIP_HEIGHT / 2, type: 'universal', orientation: 'left', simulationRole: 'inout' },
      { id: 'port_right', name: 'Right', x: CHIP_WIDTH, y: CHIP_HEIGHT / 2, type: 'universal', orientation: 'right', simulationRole: 'inout' },
      { id: 'port_top', name: 'Top', x: CHIP_WIDTH / 2, y: 0, type: 'universal', orientation: 'top', simulationRole: 'inout' },
      { id: 'port_bottom', name: 'Bottom', x: CHIP_WIDTH / 2, y: CHIP_HEIGHT, type: 'universal', orientation: 'bottom', simulationRole: 'inout' },
    ],
    defaultWidth: CHIP_WIDTH,
    defaultHeight: CHIP_HEIGHT,
  },
  {
    id: 't-junction-chip',
    name: 'T-Junction',
    chipType: 't-type',
    category: 'Microfluidic Chips',
    title: 'T-Junction: Split or merge streams with various channel sizes.',
    previewImage: '/images/products/t-junction-chip-parent.svg',
    variants: variantsByProduct['t-junction-chip'] || [],
    defaultPorts: [
      { id: 'port_top', name: 'Top', x: CHIP_WIDTH / 2, y: 0, type: 'universal', orientation: 'top', simulationRole: 'inout' },
      { id: 'port_right', name: 'Right', x: CHIP_WIDTH, y: CHIP_HEIGHT / 2, type: 'universal', orientation: 'right', simulationRole: 'inout' },
      { id: 'port_bottom', name: 'Bottom', x: CHIP_WIDTH / 2, y: CHIP_HEIGHT, type: 'universal', orientation: 'bottom', simulationRole: 'inout' },
    ],
    defaultWidth: CHIP_WIDTH,
    defaultHeight: CHIP_HEIGHT,
  },
  {
    id: 'meander-chip',
    name: 'Meander Structure',
    chipType: 'meander',
    category: 'Microfluidic Chips',
    title: 'Meander Structure: Increases path length with various channel sizes.',
    previewImage: '/images/products/meander-chip-parent.svg',
    variants: variantsByProduct['meander-chip'] || [],
    defaultPorts: [
      { id: 'port_left', name: 'Left', x: 0, y: CHIP_HEIGHT / 2, type: 'universal', orientation: 'left', simulationRole: 'inlet' },
      { id: 'port_right', name: 'Right', x: CHIP_WIDTH, y: CHIP_HEIGHT / 2, type: 'universal', orientation: 'right', simulationRole: 'outlet' },
    ],
    defaultWidth: CHIP_WIDTH,
    defaultHeight: CHIP_HEIGHT,
  },
  {
    id: 'syringe-pump',
    name: 'Syringe Pump',
    chipType: 'pump',
    category: 'Other',
    title: 'Precision Syringe Pump: Provides controlled pressure source.',
    previewImage: '/images/products/syringe-pump-parent.svg',
    variants: syringePumpVariants,
    defaultPorts: [
      { id: 'out1', name: 'Outlet', x: PUMP_CANVAS_WIDTH, y: PUMP_CANVAS_HEIGHT / 2, type: 'universal', orientation: 'right', simulationRole: 'outlet' },
    ],
    defaultWidth: PUMP_CANVAS_WIDTH,
    defaultHeight: PUMP_CANVAS_HEIGHT,
    defaultPortPressures: { 'out1': 1000 },
  },
  {
    id: 'pressure-pump',
    name: 'Pressure Pump',
    chipType: 'pump',
    category: 'Other',
    title: 'Precision Pressure Pump: Provides multi-channel pressure source.',
    previewImage: '/images/products/pressure-pump-parent.svg',
    variants: pressurePumpVariants,
    defaultPorts: [
      { id: 'out1', name: 'Port 1', x: PUMP_CANVAS_WIDTH, y: PUMP_CANVAS_HEIGHT * 1/5, type: 'universal', orientation: 'right', simulationRole: 'outlet' },
      { id: 'out2', name: 'Port 2', x: PUMP_CANVAS_WIDTH, y: PUMP_CANVAS_HEIGHT * 2/5, type: 'universal', orientation: 'right', simulationRole: 'outlet' },
      { id: 'out3', name: 'Port 3', x: PUMP_CANVAS_WIDTH, y: PUMP_CANVAS_HEIGHT * 3/5, type: 'universal', orientation: 'right', simulationRole: 'outlet' },
      { id: 'out4', name: 'Port 4', x: PUMP_CANVAS_WIDTH, y: PUMP_CANVAS_HEIGHT * 4/5, type: 'universal', orientation: 'right', simulationRole: 'outlet' },
    ],
    defaultWidth: PUMP_CANVAS_WIDTH,
    defaultHeight: PUMP_CANVAS_HEIGHT,
    defaultPortPressures: { 'out1': 100, 'out2': 100, 'out3': 100, 'out4': 100 },
  },
  {
    id: 'standard-holder',
    name: 'Chip Holder',
    chipType: 'holder',
    category: 'Other',
    title: 'Standard Chip Holder: Secure mounting for microfluidic chips.',
    previewImage: '/images/products/standard-holder-parent.svg',
    variants: variantsByProduct['standard-holder'] || [],
    defaultPorts: [],
    defaultWidth: CHIP_WIDTH,
    defaultHeight: CHIP_HEIGHT,
  },
  // Canvas Tools - Not sellable products but useful for design
  {
    id: 'outlet-tool',
    name: 'Outlet',
    chipType: 'outlet',
    category: 'Other',
    title: 'Flow Outlet: Exit point at atmospheric pressure for simulation.',
    previewImage: '/images/products/outlet-parent.svg',
    variants: [], // No variants - this is a canvas tool
    defaultPorts: [
      { id: 'in1', name: 'Inlet', x: CHIP_WIDTH / 2, y: 18, type: 'universal', orientation: 'top', simulationRole: 'inlet' },
    ],
    defaultWidth: CHIP_WIDTH,
    defaultHeight: CHIP_HEIGHT,
  },
];

// Convert parent products to palette items for compatibility with existing palette
export const PALETTE_ITEMS_FROM_PRODUCTS: PaletteItemData[] = PARENT_PRODUCTS.map(product => ({
  id: product.id,
  name: product.name,
  chipType: product.chipType,
  konvaPreviewId: `palette-${product.id}-konva`,
  title: product.title,
  category: product.category,
  previewImage: product.previewImage,
  defaultPorts: product.defaultPorts,
  defaultWidth: product.defaultWidth,
  defaultHeight: product.defaultHeight,
  internalConnections: product.internalConnections,
  // Set default properties that will be overridden by variant selection
  channelWidthMicrons: 100,
  channelDepthMicrons: 100,
  channelLengthMm: 20,
  material: 'Glass',
  isBiocompatible: true,
  isAutoclavable: true,
  temperatureRange: { min: 0, max: 100, unit: '°C' },
  pressureRating: { maxPressure: 5, unit: 'bar' },
  chemicalResistance: ['Water', 'Ethanol'],
  defaultPortPressures: product.defaultPortPressures,
}));

// Helper function to get a specific variant by ID
export function getVariantById(variantId: string): ProductVariant | undefined {
  return productVariants.find(variant => variant.id === variantId);
}

// Helper function to get all variants for a parent product
export function getVariantsForProduct(productId: string): ProductVariant[] {
  return variantsByProduct[productId] || [];
}

// Helper function to get the default variant for a parent product (first available variant)
export function getDefaultVariant(productId: string): ProductVariant | undefined {
  const variants = getVariantsForProduct(productId);
  return variants.find(v => v.stockStatus === 'in_stock') || variants[0];
}

// Helper function to create CanvasItemData with variant specifications
export function createCanvasItemFromVariant(
  parentProduct: ParentProduct,
  variant: ProductVariant,
  itemId: string,
  x: number,
  y: number
): CanvasItemData {
  // Extract channel dimensions from variant attributes or use defaults
  const channelWidth = getNumericAttribute(variant, 'channelWidth') || 
                     (parentProduct.chipType.includes('chip') ? 100 : 0); 
  const channelDepth = getNumericAttribute(variant, 'channelDepth') || 
                     (parentProduct.chipType.includes('chip') ? 100 : 0); 
  const channelLength = getNumericAttribute(variant, 'totalChannelLength') || 
                       getNumericAttribute(variant, 'chipLength') || 
                       (parentProduct.chipType.includes('chip') ? 20 : 0); 
  
  const material = getAttributeValue(variant, 'material') as string || 'N/A';
  const maxPressure = getNumericAttribute(variant, 'maxPressure') || 0;

  return {
    id: itemId,
    productId: parentProduct.id,
    name: variant.variantName, 
    chipType: parentProduct.chipType,
    x,
    y,
    width: parentProduct.defaultWidth,
    height: parentProduct.defaultHeight,
    ports: parentProduct.defaultPorts.map(p => ({...p, id: `${itemId}_${p.id}`})),
    
    currentChannelWidthMicrons: channelWidth,
    currentChannelDepthMicrons: channelDepth,
    currentChannelLengthMm: channelLength,
    
    currentJunctionSegmentLengthMm: parentProduct.chipType.includes('junction') || parentProduct.chipType.includes('t-type') || parentProduct.chipType.includes('x-type') ? 2.5 : undefined,
    currentJunctionWidthMicrons: parentProduct.chipType.includes('junction') || parentProduct.chipType.includes('t-type') || parentProduct.chipType.includes('x-type') ? channelWidth : undefined,
    currentJunctionDepthMicrons: parentProduct.chipType.includes('junction') || parentProduct.chipType.includes('t-type') || parentProduct.chipType.includes('x-type') ? channelDepth : undefined,
    
    material,
    resistance: 1e12, // Placeholder: Will be calculated properly in handleDrop or handleVariantSelect
    
    selectedVariantId: variant.id, 
    sku: variant.sku,                        
    price: variant.price,                    
    imageUrl: variant.imageUrl,              
    // stockStatus: variant.stockStatus, // if added to CanvasItemData

    temperatureRange: { min: 0, max: 100, unit: '°C' }, 
    pressureRating: { maxPressure, unit: 'bar' }, 
    chemicalResistance: ['Water', 'Ethanol'], 
    isBiocompatible: true, 
    isAutoclavable: true, 
    
    portPressures: parentProduct.defaultPortPressures, 
    internalConnections: parentProduct.internalConnections, 
  };
}

// Export the main data for use in components
export { productVariants, variantsByProduct };

// Helper functions for tubing management
export function getTubingTypeByMaterial(material: 'silicone' | 'ptfe' | 'peek') {
  const tubingTypes = {
    silicone: { id: 'silicone_standard', innerDiameterMm: 1.0, innerRadiusMeters: 0.0005 },
    ptfe: { id: 'ptfe_standard', innerDiameterMm: 0.8, innerRadiusMeters: 0.0004 },
    peek: { id: 'peek_standard', innerDiameterMm: 0.6, innerRadiusMeters: 0.0003 },
  };
  return tubingTypes[material];
}

export function calculateTubingResistanceByMaterial(
  lengthMeters: number,
  material: 'silicone' | 'ptfe' | 'peek'
): number {
  const tubingType = getTubingTypeByMaterial(material);
  // Using Poiseuille's law: R = (8 * μ * L) / (π * r^4)
  const viscosity = 0.001; // Pa·s for water at room temperature
  const resistance = (8 * viscosity * lengthMeters) / (Math.PI * Math.pow(tubingType.innerRadiusMeters, 4));
  return resistance;
}

export function getConnectionLength(isPumpConnection: boolean): number {
  // First connection from pump to first chip: 50 cm
  // Connections between chips: 5 cm
  return isPumpConnection ? 0.5 : 0.05;
} 