import { Chip, Tubing, AnyProduct } from './types';

export const sampleProducts: AnyProduct[] = [
  // 1. Straight Channel Microfluidic Chip
  {
    id: 'chip-sc-g-001',
    name: 'Straight Channel Chip - Glass',
    description: 'High-quality glass microfluidic chip with a single straight channel. Dimensions: 5mm x 5mm x 2mm. Channel dimensions: 100µm width x 100µm depth.',
    price: 75.00,
    imageUrl: '', // Use fallback placeholder
    category: 'chip',
    stockQuantity: 50,
    sku: 'SCG-W5H5T2-CWD100',
    dimensions: { length: 5, width: 5, height: 2, unit: 'mm' },
    material: 'Glass (Borosilicate)',
    isBiocompatible: true,
    isAutoclavable: true,
    chemicalResistance: ['Most Solvents', 'Acids (Weak & Strong)', 'Bases (Weak)'],
    temperatureRange: { min: -50, max: 450, unit: '°C' },
    pressureRating: { maxPressure: 5, unit: 'bar' }, // Example pressure
    chipType: 'Straight Channel',
    channelDimensions: { width: 100, depth: 100, unit: 'µm' },
    numberOfChannels: 1,
    compatibleWith: ['holder-std-001', 'tubing-fep-116-030'] // Example compatibility
  } as Chip,

  // 2. Meander Microfluidic Chip
  {
    id: 'chip-mndr-g-001',
    name: 'Meander Channel Chip - Glass',
    description: 'High-quality glass microfluidic chip with a meandering channel providing an effective channel length of 20cm. Chip Dimensions: 5mm x 5mm x 2mm. Microchannel dimensions: 100µm width x 100µm depth.',
    price: 95.00,
    imageUrl: '', // Use fallback placeholder
    category: 'chip',
    stockQuantity: 30,
    sku: 'MNDRG-W5H5T2-CWD100-L20CM',
    dimensions: { length: 5, width: 5, height: 2, unit: 'mm' },
    material: 'Glass (Borosilicate)',
    isBiocompatible: true,
    isAutoclavable: true,
    chemicalResistance: ['Most Solvents', 'Acids (Weak & Strong)', 'Bases (Weak)'],
    temperatureRange: { min: -50, max: 450, unit: '°C' },
    pressureRating: { maxPressure: 5, unit: 'bar' }, // Example pressure
    chipType: 'Meander Mixer', // Or just 'Meander'
    channelDimensions: { width: 100, depth: 100, unit: 'µm' },
    numberOfChannels: 1, // Still one continuous channel
    compatibleWith: ['holder-std-001', 'tubing-fep-116-030']
  } as Chip,

  // 3. T-Type Mixer Chip
  {
    id: 'chip-tmix-g-001',
    name: 'T-Mixer Chip - Glass',
    description: 'Glass microfluidic chip for T-junction mixing. Three inlet/outlet ports. Chip Dimensions: 5mm x 5mm x 2mm. Microchannel dimensions: 100µm width x 100µm depth.',
    price: 85.00,
    imageUrl: '', // Use fallback placeholder
    category: 'chip',
    stockQuantity: 40,
    sku: 'TMIXG-W5H5T2-CWD100',
    dimensions: { length: 5, width: 5, height: 2, unit: 'mm' },
    material: 'Glass (Borosilicate)',
    isBiocompatible: true,
    isAutoclavable: true,
    chemicalResistance: ['Most Solvents', 'Acids (Weak & Strong)', 'Bases (Weak)'],
    temperatureRange: { min: -50, max: 450, unit: '°C' },
    pressureRating: { maxPressure: 5, unit: 'bar' },
    chipType: 'T-Mixer',
    channelDimensions: { width: 100, depth: 100, unit: 'µm' },
    numberOfChannels: 3, // Representing the three arms of the T-junction
    compatibleWith: ['holder-std-001', 'tubing-fep-116-030']
  } as Chip,

  // 4. X-Type Mixer Chip
  {
    id: 'chip-xmix-g-001',
    name: 'X-Mixer Chip - Glass',
    description: 'Glass microfluidic chip for X-junction (cross-flow) mixing or droplet generation. Four inlet/outlet ports. Chip Dimensions: 5mm x 5mm x 2mm. Microchannel dimensions: 100µm width x 100µm depth.',
    price: 90.00,
    imageUrl: '', // Use fallback placeholder
    category: 'chip',
    stockQuantity: 35,
    sku: 'XMIXG-W5H5T2-CWD100',
    dimensions: { length: 5, width: 5, height: 2, unit: 'mm' },
    material: 'Glass (Borosilicate)',
    isBiocompatible: true,
    isAutoclavable: true,
    chemicalResistance: ['Most Solvents', 'Acids (Weak & Strong)', 'Bases (Weak)'],
    temperatureRange: { min: -50, max: 450, unit: '°C' },
    pressureRating: { maxPressure: 5, unit: 'bar' },
    chipType: 'X-Mixer / Droplet Generator',
    channelDimensions: { width: 100, depth: 100, unit: 'µm' },
    numberOfChannels: 4, // Representing the four arms of the X-junction
    compatibleWith: ['holder-std-001', 'tubing-fep-116-030']
  } as Chip,

  // 5. FEP Tubing 1/16" OD, 0.030" ID
  {
    id: 'tubing-fep-116-030',
    name: 'FEP Tubing, 1/16" OD, 0.030" ID',
    description: 'High-quality FEP tubing, excellent chemical resistance and biocompatibility. Ideal for microfluidic connections.',
    price: 15.00, // Price for the first length option (e.g., 1m)
    imageUrl: '/images/tubing-fep.webp', // Placeholder
    category: 'tubing',
    stockQuantity: 200, // e.g., in meters or number of standard packs
    sku: 'TUB-FEP-116OD-030ID',
    material: 'FEP (Fluorinated Ethylene Propylene)',
    isBiocompatible: true,
    isAutoclavable: true, // FEP is autoclavable
    chemicalResistance: ['Most Solvents', 'Acids', 'Bases', 'Alcohols'],
    temperatureRange: { min: -200, max: 200, unit: '°C' },
    pressureRating: { maxPressure: 10, unit: 'bar' }, // Example, depends on wall thickness and temperature
    innerDiameter: { value: 0.030, unit: 'inch' }, // Approx 762 µm
    outerDiameter: { value: 0.0625, unit: 'inch' }, // 1/16 inch
    lengthOptions: [
      { length: 1, unit: 'm', price: 15.00 },
      { length: 5, unit: 'm', price: 65.00 },
      { length: 10, unit: 'm', price: 120.00 },
    ],
    compatibleWith: ['chip-sc-g-001', 'chip-mndr-g-001', 'chip-tmix-g-001', 'chip-xmix-g-001', 'holder-std-001'] // Compatible with chips and a standard holder
  } as Tubing
]; 