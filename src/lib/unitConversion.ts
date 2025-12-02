// Unit conversion utilities
// Storage uses metric (kg, cm), display can use imperial (lbs, inches)

const LBS_PER_KG = 2.20462;
const INCHES_PER_CM = 0.393701;
const CM_PER_INCH = 2.54;
const KG_PER_LB = 0.453592;

// --- Conversion to metric (for storage) ---

/**
 * Convert lbs to kg, rounded to decagrams (0.01 kg / 10g precision)
 */
export function lbsToKg(lbs: number): number {
  return Math.round(lbs * KG_PER_LB * 100) / 100;
}

/**
 * Convert inches to cm, rounded to millimeters (0.1 cm precision)
 */
export function inchesToCm(inches: number): number {
  return Math.round(inches * CM_PER_INCH * 10) / 10;
}

// --- Conversion to imperial (for display) ---

/**
 * Convert kg to lbs, rounded to 0.1 lbs
 */
export function kgToLbs(kg: number): number {
  return Math.round(kg * LBS_PER_KG * 10) / 10;
}

/**
 * Convert cm to inches, rounded to nearest 1/4 inch (0.25)
 */
export function cmToInches(cm: number): number {
  const inches = cm * INCHES_PER_CM;
  return Math.round(inches * 4) / 4;
}

/**
 * Format inches as fractional string (e.g., "32 1/4", "32 1/2", "32 3/4", "33")
 */
export function formatFractionalInches(inches: number): string {
  const rounded = Math.round(inches * 4) / 4;
  const whole = Math.floor(rounded);
  const fraction = rounded - whole;

  if (fraction === 0) {
    return whole.toString();
  } else if (fraction === 0.25) {
    return `${whole} 1/4`;
  } else if (fraction === 0.5) {
    return `${whole} 1/2`;
  } else if (fraction === 0.75) {
    return `${whole} 3/4`;
  }
  return rounded.toString();
}

/**
 * Parse fractional inches string back to decimal (e.g., "32 1/4" -> 32.25)
 */
export function parseFractionalInches(str: string): number | undefined {
  const trimmed = str.trim();

  // Try parsing as plain number first
  const plain = parseFloat(trimmed);
  if (!isNaN(plain) && !trimmed.includes(" ") && !trimmed.includes("/")) {
    return plain;
  }

  // Parse fractional format like "32 1/4"
  const match = trimmed.match(/^(\d+(?:\.\d+)?)\s+(\d+)\/(\d+)$/);
  if (match) {
    const whole = parseFloat(match[1]);
    const numerator = parseInt(match[2], 10);
    const denominator = parseInt(match[3], 10);
    if (
      !isNaN(whole) &&
      !isNaN(numerator) &&
      !isNaN(denominator) &&
      denominator !== 0
    ) {
      return whole + numerator / denominator;
    }
  }

  // Try parsing just a fraction like "1/4"
  const fractionMatch = trimmed.match(/^(\d+)\/(\d+)$/);
  if (fractionMatch) {
    const numerator = parseInt(fractionMatch[1], 10);
    const denominator = parseInt(fractionMatch[2], 10);
    if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
      return numerator / denominator;
    }
  }

  return undefined;
}

// --- Type definitions ---

export type WeightUnit = "kg" | "lbs";
export type LengthUnit = "cm" | "in";

// --- Helper functions for form handling ---

/**
 * Convert weight value based on unit selection for storage (always returns kg)
 */
export function convertWeightForStorage(
  value: number,
  unit: WeightUnit,
): number {
  return unit === "lbs" ? lbsToKg(value) : Math.round(value * 100) / 100;
}

/**
 * Convert length value based on unit selection for storage (always returns cm)
 */
export function convertLengthForStorage(
  value: number,
  unit: LengthUnit,
): number {
  return unit === "in" ? inchesToCm(value) : Math.round(value * 10) / 10;
}

/**
 * Convert weight from storage (kg) to display unit
 */
export function convertWeightForDisplay(kg: number, unit: WeightUnit): number {
  return unit === "lbs" ? kgToLbs(kg) : kg;
}

/**
 * Convert length from storage (cm) to display unit
 */
export function convertLengthForDisplay(cm: number, unit: LengthUnit): number {
  return unit === "in" ? cmToInches(cm) : cm;
}
