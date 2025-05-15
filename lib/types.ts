// website/lib/types.ts

/**
 * Defines the unit for dimensional measurements.
 */
export type DimensionUnit = "mm" | "cm" | "µm" | "inch";

/**
 * Defines the unit for temperature measurements.
 */
export type TemperatureUnit = "°C";

/**
 * Defines the unit for pressure measurements.
 */
export type PressureUnit = "bar" | "psi";

/**
 * Defines the unit for flow rate measurements.
 */
export type FlowRateUnit = "µL/min" | "mL/min" | "mL/hr";

/**
 * Defines the unit for length measurements (e.g., for tubing).
 */
export type LengthUnit = "m" | "ft";

/**
 * Represents physical dimensions of a product.
 * All properties are optional as not all dimensions apply to all product shapes.
 */
export interface ProductDimensions {
  length?: number;
  width?: number;
  height?: number;
  diameter?: number; // For circular items like tubing OD/ID or ports
  unit: DimensionUnit;
}

/**
 * Represents a temperature range.
 */
export interface TemperatureRange {
  min: number;
  max: number;
  unit: TemperatureUnit;
}

/**
 * Represents the pressure rating of a component.
 */
export interface PressureRating {
  maxPressure: number;
  unit: PressureUnit;
}

/**
 * Base interface for all product types.
 */
export interface BaseProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: "chip" | "holder" | "tubing" | "pump" | "accessory";
  stockQuantity: number;
  sku: string;
  dimensions?: ProductDimensions; // Optional as some products might define dimensions differently or not at all
  material: string;
  compatibleWith?: string[]; // Array of product IDs it's designed to connect with
  isBiocompatible: boolean;
  isAutoclavable: boolean;
  chemicalResistance?: string[]; // Optional, as not all materials might have this explicitly listed
  temperatureRange?: TemperatureRange; // Optional, some components might not have a specific range
  pressureRating?: PressureRating; // Optional, as above
}

/**
 * Represents a Microfluidic Chip.
 */
export interface Chip extends BaseProduct {
  category: "chip";
  chipType: string; // e.g., "Straight Channel", "Mixer", "Meander"
  channelDimensions: {
    width: number;
    depth: number;
    unit: "µm" | "mm";
  };
  numberOfChannels: number;
}

/**
 * Represents a Microfluidic Holder.
 */
export interface Holder extends BaseProduct {
  category: "holder";
  compatibleChipFormat: string; // e.g., "Standard 25x75mm slides"
  numberOfConnections: number;
  tubingSizeCompatibility: { // Specifies the OD of tubing
    od: number;
    unit: "inch" | "mm";
  };
}

/**
 * Represents an option for tubing length and its price.
 */
export interface TubingLengthOption {
  length: number;
  unit: LengthUnit;
  price: number;
}

/**
 * Represents Microfluidic Tubing.
 */
export interface Tubing extends BaseProduct {
  category: "tubing";
  innerDiameter: {
    value: number;
    unit: "mm" | "inch";
  };
  outerDiameter: {
    value: number;
    unit: "mm" | "inch";
  };
  lengthOptions: TubingLengthOption[];
}

/**
 * Represents a Microfluidic Pump.
 */
export interface Pump extends BaseProduct {
  category: "pump";
  pumpType: string; // e.g., "Peristaltic", "Syringe", "Pressure Controller"
  flowRateRange: {
    min: number;
    max: number;
    unit: FlowRateUnit;
  };
  // `pressureRating` from BaseProduct indicates pump's own tolerance.
  // If it's a pressure source, `outputPressureRange` could be added if distinct.
}

/**
 * Represents a Microfluidic Accessory.
 */
export interface Accessory extends BaseProduct {
  category: "accessory";
  accessoryType: string; // e.g., "Connector", "Fitting", "Valve", "Sensor"
  specificDetails?: Record<string, any>; // For any other relevant details
}

/**
 * A union type representing any of the defined product types.
 * Useful for arrays of mixed products or functions that can handle any product.
 */
export type AnyProduct = Chip | Holder | Tubing | Pump | Accessory;

// --- Product Catalog System Types (for new architecture) ---
export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  baseDescription: string;
  baseImage: string;
  tags?: string[];
}

export interface ProductAttribute {
  name: string;
  value: string | number | boolean;
  unit?: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  variantName: string;
  sku: string;
  price: number;
  imageUrl?: string;
  stockStatus: 'in_stock' | 'out_of_stock' | 'backorder';
  attributes: ProductAttribute[];
  canvasComponentId?: string;
}
// --- End Product Catalog System Types --- 