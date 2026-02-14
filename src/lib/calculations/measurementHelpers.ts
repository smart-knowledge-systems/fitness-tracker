/**
 * Measurement aggregation and filtering utilities.
 * Extracted from Dashboard page for reusability.
 */

import type { Doc } from "@/convex/_generated/dataModel";

export type Measurement = Doc<"measurements">;

/**
 * All numeric measurement field names (excludes system fields, userId, date).
 * Single source of truth — update this list when measurement schema changes.
 */
const MEASUREMENT_FIELDS = [
  // Core metrics
  "weight",
  "height",
  // Body fat circumferences
  "waistCirc",
  "neckCirc",
  "hipCirc",
  // Skinfolds
  "skinfoldChest",
  "skinfoldAxilla",
  "skinfoldTricep",
  "skinfoldSubscapular",
  "skinfoldAbdominal",
  "skinfoldSuprailiac",
  "skinfoldThigh",
  "skinfoldBicep",
  // Muscle circumferences
  "upperArmCirc",
  "lowerArmCirc",
  "thighCirc",
  "calfCirc",
  "chestCirc",
  "shoulderCirc",
  // Performance metrics
  "time5k",
  "time1k",
  "lMinO2",
  "sKmAt129Bpm",
  "vo2max",
] as const satisfies readonly (keyof Measurement)[];

type MeasurementField = (typeof MEASUREMENT_FIELDS)[number];

/**
 * Find the nth non-null value for a field from date-descending sorted measurements.
 * nth=0 returns the latest (ultimate), nth=1 returns second-to-latest (penultimate).
 */
function nthNonNull(
  sortedDesc: Measurement[],
  field: MeasurementField,
  nth: number,
): number | undefined {
  let found = 0;
  for (const m of sortedDesc) {
    if (m[field] != null) {
      if (found === nth) return m[field] as number;
      found++;
    }
  }
  return undefined;
}

/**
 * Build a partial measurement by extracting the nth non-null value per field.
 */
function extractNthValues(
  measurements: Measurement[],
  nth: number,
): Partial<Measurement> {
  const sorted = [...measurements].sort((a, b) => b.date - a.date);
  const result: Partial<Measurement> = {};
  for (const field of MEASUREMENT_FIELDS) {
    const value = nthNonNull(sorted, field, nth);
    if (value !== undefined) {
      (result as Record<string, number>)[field] = value;
    }
  }
  return result;
}

/**
 * Find most recent non-null weight from measurements (sorted desc by date).
 */
export function getLatestWeight(measurements: Measurement[]): number | null {
  const sorted = [...measurements].sort((a, b) => b.date - a.date);
  for (const m of sorted) {
    if (m.weight != null) return m.weight;
  }
  return null;
}

/**
 * Filter measurements within a date range AND within weight tolerance of latest weight.
 * @param measurements - Array of measurements
 * @param latestWeight - Latest weight to compare against
 * @param cutoffDate - Include measurements at or after this timestamp
 * @param tolerancePercent - Weight tolerance (default 2%)
 */
export function filterForCurrent(
  measurements: Measurement[],
  latestWeight: number | null,
  cutoffDate: number,
  tolerancePercent: number = 0.02,
): Measurement[] {
  return measurements.filter((m) => {
    // Must be within date range
    if (m.date < cutoffDate) return false;
    // Include if weight is null or within tolerance
    if (latestWeight === null) return true;
    if (m.weight == null) return true;
    const tolerance = latestWeight * tolerancePercent;
    return Math.abs(m.weight - latestWeight) <= tolerance;
  });
}

/**
 * Average all non-null values for each measurement field.
 * Single pass: accumulates sums and counts for all fields simultaneously.
 */
export function averageMeasurements(
  measurements: Measurement[],
): Partial<Measurement> {
  if (measurements.length === 0) return {};

  const sums: Record<string, number> = {};
  const counts: Record<string, number> = {};

  for (const m of measurements) {
    for (const field of MEASUREMENT_FIELDS) {
      const value = m[field];
      if (value != null) {
        sums[field] = (sums[field] ?? 0) + value;
        counts[field] = (counts[field] ?? 0) + 1;
      }
    }
  }

  const result: Partial<Measurement> = {};
  for (const field of MEASUREMENT_FIELDS) {
    if (counts[field]) {
      (result as Record<string, number>)[field] = sums[field] / counts[field];
    }
  }
  return result;
}

/**
 * Get ultimate (latest) non-null value for each measurement column.
 */
export function getUltimateMeasurement(
  measurements: Measurement[],
): Partial<Measurement> {
  return extractNthValues(measurements, 0);
}

/**
 * Get penultimate (second-to-last) non-null value for each measurement column.
 */
export function getPenultimateMeasurement(
  measurements: Measurement[],
): Partial<Measurement> {
  return extractNthValues(measurements, 1);
}

export interface CompositeResult {
  current: Partial<Measurement>;
  previous: Partial<Measurement>;
}

/**
 * Build composite measurements for dashboard display.
 * Current: averaged skinfolds/circumferences from last 14 days, ultimate weight/performance
 * Previous: penultimate non-null values for comparison
 */
export function buildCompositeMeasurement(
  measurements: Measurement[],
  cutoffDate: number,
): CompositeResult | null {
  if (!measurements.length) {
    return null;
  }

  // Get averages of last 14 days (filtered by weight consistency) for skinfolds/circumferences
  const latestWeight = getLatestWeight(measurements);
  const filteredForCurrent = filterForCurrent(
    measurements,
    latestWeight,
    cutoffDate,
  );
  const averaged = averageMeasurements(filteredForCurrent);

  // Get ultimate (latest non-null) values for weight and performance metrics
  const ultimate = getUltimateMeasurement(measurements);

  // Merge: skinfolds/circumferences from averaged, weight/performance from ultimate
  const current: Partial<Measurement> = {
    // Skinfolds (averaged)
    skinfoldChest: averaged.skinfoldChest,
    skinfoldAxilla: averaged.skinfoldAxilla,
    skinfoldTricep: averaged.skinfoldTricep,
    skinfoldSubscapular: averaged.skinfoldSubscapular,
    skinfoldAbdominal: averaged.skinfoldAbdominal,
    skinfoldSuprailiac: averaged.skinfoldSuprailiac,
    skinfoldThigh: averaged.skinfoldThigh,
    skinfoldBicep: averaged.skinfoldBicep,

    // All circumferences (averaged)
    waistCirc: averaged.waistCirc,
    neckCirc: averaged.neckCirc,
    hipCirc: averaged.hipCirc,
    height: averaged.height,
    upperArmCirc: averaged.upperArmCirc,
    lowerArmCirc: averaged.lowerArmCirc,
    thighCirc: averaged.thighCirc,
    calfCirc: averaged.calfCirc,
    chestCirc: averaged.chestCirc,
    shoulderCirc: averaged.shoulderCirc,

    // Weight and performance (ultimate non-null)
    weight: ultimate.weight,
    vo2max: ultimate.vo2max,
    time5k: ultimate.time5k,
    time1k: ultimate.time1k,
    lMinO2: ultimate.lMinO2,
    sKmAt129Bpm: ultimate.sKmAt129Bpm,
  };

  // Previous: penultimate non-null value for each column
  const previous = getPenultimateMeasurement(measurements);

  return { current, previous };
}
