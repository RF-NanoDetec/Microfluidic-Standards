import { FLUID_VISCOSITY_PAS } from './constants';

/**
 * Calculates the hydrodynamic resistance of a cylindrical tube (tubing).
 * R = (8 * mu * L) / (pi * r^4)
 *
 * @param lengthMeters The length of the tube in meters.
 * @param tubeInnerRadiusMeters The inner radius of the tube in meters.
 * @param fluidViscosity Optional: The dynamic viscosity of the fluid in Pascal-seconds (Pa·s).
 * @returns The calculated resistance in Pa·s/m³.
 */
export function calculateTubingResistance(
  lengthMeters: number,
  tubeInnerRadiusMeters: number,
  fluidViscosity: number = FLUID_VISCOSITY_PAS
): number {
  if (lengthMeters <= 0 || tubeInnerRadiusMeters <= 0) {
    console.warn("[Resistance] Invalid dimensions for tubing resistance calculation:", {
      length: lengthMeters,
      radius: tubeInnerRadiusMeters
    });
    return Infinity;
  }
  return (8 * fluidViscosity * lengthMeters) / (Math.PI * Math.pow(tubeInnerRadiusMeters, 4));
}

/**
 * Calculates the hydrodynamic resistance of a rectangular microchannel.
 * Uses the Mortensen et al. (2005) formula for improved accuracy across all aspect ratios.
 * 
 * @param lengthMeters Channel length in meters
 * @param widthMeters Channel width in meters
 * @param heightMeters Channel height/depth in meters
 * @param fluidViscosity Dynamic viscosity in Pa·s
 * @returns Hydraulic resistance in Pa·s/m³
 */
export function calculateRectangularChannelResistance(
    lengthMeters: number,
    widthMeters: number,
    heightMeters: number,
    fluidViscosity: number = FLUID_VISCOSITY_PAS
): number {
    // Input validation with detailed logging
    if (lengthMeters <= 0 || widthMeters <= 0 || heightMeters <= 0 || fluidViscosity <= 0) {
        console.warn("[Resistance] Invalid dimensions or viscosity for rectangular channel:", {
            length: lengthMeters,
            width: widthMeters,
            height: heightMeters,
            viscosity: fluidViscosity
        });
        return Infinity;
    }

    // Calculate aspect ratio (α = width/height)
    const aspectRatio = widthMeters / heightMeters;

    // For very high aspect ratios (width >> height), use parallel plate approximation
    if (aspectRatio > 100) {
        const resistance = (12 * fluidViscosity * lengthMeters) / (widthMeters * Math.pow(heightMeters, 3));
        console.log("[Resistance] Using parallel plate approximation for high aspect ratio:", {
            aspectRatio,
            resistance: resistance.toExponential(3)
        });
        return resistance;
    }

    // For very low aspect ratios (height >> width), use the formula with swapped dimensions
    if (aspectRatio < 0.01) {
        console.log("[Resistance] Using swapped dimensions for low aspect ratio:", { aspectRatio });
        return calculateRectangularChannelResistance(lengthMeters, heightMeters, widthMeters, fluidViscosity);
    }

    // General case: Use Mortensen's formula
    // This accounts for both the aspect ratio and the series expansion of the solution
    let sum = 0;
    const maxN = 100; // Number of terms in series

    for (let n = 1; n <= maxN; n += 2) {
        const nPi = n * Math.PI;
        const tanh = Math.tanh(nPi * heightMeters / (2 * widthMeters));
        sum += (1 / Math.pow(n, 5)) * tanh;
    }

    const baseResistance = (12 * fluidViscosity * lengthMeters) / (widthMeters * Math.pow(heightMeters, 3));
    const correctionFactor = 1 - (192 / Math.pow(Math.PI, 5)) * (heightMeters / widthMeters) * sum;
    const finalResistance = baseResistance * correctionFactor;

    console.log("[Resistance] Calculated rectangular channel resistance:", {
        dimensions: {
            length: `${(lengthMeters * 1000).toFixed(2)}mm`,
            width: `${(widthMeters * 1e6).toFixed(1)}µm`,
            height: `${(heightMeters * 1e6).toFixed(1)}µm`
        },
        aspectRatio: aspectRatio.toFixed(3),
        resistance: finalResistance.toExponential(3)
    });

    return finalResistance;
}
