import {
  WeightUnit,
  LengthUnit,
  convertWeightForStorage,
  convertLengthForStorage,
} from "@/lib/unitConversion";

/**
 * Parse a string to a number, returning undefined if invalid.
 * Rejects empty/whitespace strings and non-finite values (NaN, Infinity).
 */
export function parseNumber(value: string): number | undefined {
  if (value.trim() === "") return undefined;
  const num = parseFloat(value);
  return isNaN(num) || !isFinite(num) ? undefined : num;
}

/**
 * Parse a time string in MM:SS or HH:MM:SS format to total seconds.
 * Returns undefined if the format is invalid or parts are out of range.
 */
export function parseTime(timeStr: string): number | undefined {
  if (!timeStr) return undefined;
  const parts = timeStr.split(":").map(Number);
  if (parts.some(isNaN) || parts.some((p) => p < 0)) return undefined;

  if (parts.length === 2) {
    if (parts[1] >= 60) return undefined;
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 3) {
    if (parts[1] >= 60 || parts[2] >= 60) return undefined;
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
  const num = parseNumber(value);
  return num !== undefined
    ? convertWeightForStorage(num, weightUnit)
    : undefined;
}

/**
 * Parse a length value and convert to cm for storage.
 */
export function parseLength(
  value: string,
  lengthUnit: LengthUnit,
): number | undefined {
  const num = parseNumber(value);
  return num !== undefined
    ? convertLengthForStorage(num, lengthUnit)
    : undefined;
}
