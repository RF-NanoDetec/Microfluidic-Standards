import { FLUID_VISCOSITY_PAS } from './constants';

/**
 * Calculates the hydrodynamic resistance of a cylindrical tube (tubing).
 * R = (8 * mu * L) / (pi * r^4)
 *
 * @param lengthMeters The length of the tube in meters.
 * @param tubeInnerRadiusMeters The inner radius of the tube in meters.
 * @param fluidViscosity The dynamic viscosity of the fluid in Pascal-seconds (Pa·s).
 * @returns The calculated resistance in Pa·s/m³.
 */
export function calculateTubingResistance(
  lengthMeters: number,
  tubeInnerRadiusMeters: number,
  // fluidViscosity: number = FLUID_VISCOSITY_PAS // Defaulting here, or pass explicitly
): number {
  if (lengthMeters <= 0 || tubeInnerRadiusMeters <= 0) {
    // console.warn("[Resistance] Invalid dimensions for tubing resistance calculation.");
    return Infinity; // Or a very large number, or throw error
  }
  return (8 * FLUID_VISCOSITY_PAS * lengthMeters) / (Math.PI * Math.pow(tubeInnerRadiusMeters, 4));
}

/**
 * Calculates the hydrodynamic resistance of a rectangular microfluidic channel.
 * This is a placeholder and may need a more complex formula based on aspect ratio.
 * For now, it might return a pre-calculated value or a simplified estimation.
 *
 * @param type The type of the chip (e.g., 'straight', 'meander') - for potential lookup of pre-calculated values.
 * @param lengthMeters Channel length in meters.
 * @param widthMeters Channel width in meters.
 * @param depthMeters Channel depth in meters.
 * @param fluidViscosity Dynamic viscosity in Pa·s.
 * @returns Calculated or estimated resistance in Pa·s/m³.
 */
export function calculateChipResistance(
  type: string,
  lengthMeters: number,
  widthMeters: number,
  depthMeters: number,
  // fluidViscosity: number = FLUID_VISCOSITY_PAS
): number {
  console.warn(`[Resistance] calculateChipResistance for type '${type}' is using a placeholder/default logic.`);
  // Placeholder logic: This should be replaced with accurate formulas or lookup
  // For example, for a straight channel, you might have a base resistance per unit length
  // or use a formula for rectangular channels.
  // R_rect = (12 * mu * L) / (W * D^3 * (1 - (192 * D / (pi^5 * W)) * tanh(pi * W / (2 * D)))) for W/D > 1
  // A simpler approach for now if specific formulas are not ready:
  if (type === 'straight' && lengthMeters > 0 && widthMeters > 0 && depthMeters > 0) {
    // Extremely simplified placeholder - replace with actual formula for rectangular channel
    // This is NOT physically accurate, just to return a number.
    const aspectRatioFactor = widthMeters / depthMeters;
    const hydraulicDiameter = (2 * widthMeters * depthMeters) / (widthMeters + depthMeters);
    // Using a circular pipe approximation with hydraulic diameter for placeholder
    const approxResistance = (8 * FLUID_VISCOSITY_PAS * lengthMeters) / (Math.PI * Math.pow(hydraulicDiameter / 2, 4));
    // console.log(`[Resistance] Approx. for straight: L=${lengthMeters}, W=${widthMeters}, D=${depthMeters}, Rh=${hydraulicDiameter}, R=${approxResistance}`);
    return approxResistance;
  }
  // For other types or if dimensions are invalid, return a very high resistance or throw error
  return 1e18; // Default high resistance for unhandled types / errors
} 