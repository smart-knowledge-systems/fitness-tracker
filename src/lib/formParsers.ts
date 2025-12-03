import {
  WeightUnit,
  LengthUnit,
  convertWeightForStorage,
  convertLengthForStorage,
} from "@/lib/unitConversion";

/**
 * Parse a string to a number, returning undefined if invalid.
 */
export function parseNumber(value: string): number | undefined {
  const num = parseFloat(value);
  return isNaN(num) ? undefined : num;
}

/**
 * Parse a time string in MM:SS or HH:MM:SS format to total seconds.
 * Returns undefined if the format is invalid.
 */
export function parseTime(timeStr: string): number | undefined {
  if (!timeStr) return undefined;
  const parts = timeStr.split(":").map(Number);
  if (parts.some(isNaN)) return undefined;
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return undefined;
}

/**
 * Parse a weight value and convert to kg for storage.
 */
export function parseWeight(
  value: string,
  weightUnit: WeightUnit,
): number | undefined {
  const num = parseFloat(value);
  if (isNaN(num)) return undefined;
  return convertWeightForStorage(num, weightUnit);
}

/**
 * Parse a length value and convert to cm for storage.
 */
export function parseLength(
  value: string,
  lengthUnit: LengthUnit,
): number | undefined {
  const num = parseFloat(value);
  if (isNaN(num)) return undefined;
  return convertLengthForStorage(num, lengthUnit);
}
