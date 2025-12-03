/**
 * Measurement aggregation and filtering utilities.
 * Extracted from Dashboard page for reusability.
 */

import type { Doc } from "@/convex/_generated/dataModel";

export type Measurement = Doc<"measurements">;

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
 */
export function averageMeasurements(
  measurements: Measurement[],
): Partial<Measurement> {
  if (measurements.length === 0) {
    return {};
  }

  const avg = (values: (number | undefined | null)[]): number | undefined => {
    const valid = values.filter((v): v is number => v != null);
    if (valid.length === 0) return undefined;
    return valid.reduce((a, b) => a + b, 0) / valid.length;
  };

  return {
    // Core metrics
    weight: avg(measurements.map((m) => m.weight)),
    height: avg(measurements.map((m) => m.height)),

    // Body fat circumferences
    waistCirc: avg(measurements.map((m) => m.waistCirc)),
    neckCirc: avg(measurements.map((m) => m.neckCirc)),
    hipCirc: avg(measurements.map((m) => m.hipCirc)),

    // Skinfolds
    skinfoldChest: avg(measurements.map((m) => m.skinfoldChest)),
    skinfoldAxilla: avg(measurements.map((m) => m.skinfoldAxilla)),
    skinfoldTricep: avg(measurements.map((m) => m.skinfoldTricep)),
    skinfoldSubscapular: avg(measurements.map((m) => m.skinfoldSubscapular)),
    skinfoldAbdominal: avg(measurements.map((m) => m.skinfoldAbdominal)),
    skinfoldSuprailiac: avg(measurements.map((m) => m.skinfoldSuprailiac)),
    skinfoldThigh: avg(measurements.map((m) => m.skinfoldThigh)),
    skinfoldBicep: avg(measurements.map((m) => m.skinfoldBicep)),

    // Muscle circumferences
    upperArmCirc: avg(measurements.map((m) => m.upperArmCirc)),
    lowerArmCirc: avg(measurements.map((m) => m.lowerArmCirc)),
    thighCirc: avg(measurements.map((m) => m.thighCirc)),
    calfCirc: avg(measurements.map((m) => m.calfCirc)),
    chestCirc: avg(measurements.map((m) => m.chestCirc)),
    shoulderCirc: avg(measurements.map((m) => m.shoulderCirc)),

    // Performance metrics
    time5k: avg(measurements.map((m) => m.time5k)),
    time1k: avg(measurements.map((m) => m.time1k)),
    lMinO2: avg(measurements.map((m) => m.lMinO2)),
    sKmAt129Bpm: avg(measurements.map((m) => m.sKmAt129Bpm)),
    vo2max: avg(measurements.map((m) => m.vo2max)),
  };
}

/**
 * Get ultimate (latest) non-null value for each measurement column.
 */
export function getUltimateMeasurement(
  measurements: Measurement[],
): Partial<Measurement> {
  const sorted = [...measurements].sort((a, b) => b.date - a.date);

  const ultimate = <T>(
    getter: (m: Measurement) => T | undefined | null,
  ): T | undefined => {
    for (const m of sorted) {
      const val = getter(m);
      if (val != null) return val;
    }
    return undefined;
  };

  return {
    // Core metrics
    weight: ultimate((m) => m.weight),
    height: ultimate((m) => m.height),

    // Body fat circumferences
    waistCirc: ultimate((m) => m.waistCirc),
    neckCirc: ultimate((m) => m.neckCirc),
    hipCirc: ultimate((m) => m.hipCirc),

    // Skinfolds
    skinfoldChest: ultimate((m) => m.skinfoldChest),
    skinfoldAxilla: ultimate((m) => m.skinfoldAxilla),
    skinfoldTricep: ultimate((m) => m.skinfoldTricep),
    skinfoldSubscapular: ultimate((m) => m.skinfoldSubscapular),
    skinfoldAbdominal: ultimate((m) => m.skinfoldAbdominal),
    skinfoldSuprailiac: ultimate((m) => m.skinfoldSuprailiac),
    skinfoldThigh: ultimate((m) => m.skinfoldThigh),
    skinfoldBicep: ultimate((m) => m.skinfoldBicep),

    // Muscle circumferences
    upperArmCirc: ultimate((m) => m.upperArmCirc),
    lowerArmCirc: ultimate((m) => m.lowerArmCirc),
    thighCirc: ultimate((m) => m.thighCirc),
    calfCirc: ultimate((m) => m.calfCirc),
    chestCirc: ultimate((m) => m.chestCirc),
    shoulderCirc: ultimate((m) => m.shoulderCirc),

    // Performance metrics
    time5k: ultimate((m) => m.time5k),
    time1k: ultimate((m) => m.time1k),
    lMinO2: ultimate((m) => m.lMinO2),
    sKmAt129Bpm: ultimate((m) => m.sKmAt129Bpm),
    vo2max: ultimate((m) => m.vo2max),
  };
}

/**
 * Get penultimate (second-to-last) non-null value for each measurement column.
 */
export function getPenultimateMeasurement(
  measurements: Measurement[],
): Partial<Measurement> {
  const sorted = [...measurements].sort((a, b) => b.date - a.date);

  const penultimate = <T>(
    getter: (m: Measurement) => T | undefined | null,
  ): T | undefined => {
    const values = sorted.map(getter).filter((v): v is T => v != null);
    return values.length >= 2 ? values[1] : undefined;
  };

  return {
    // Core metrics
    weight: penultimate((m) => m.weight),
    height: penultimate((m) => m.height),

    // Body fat circumferences
    waistCirc: penultimate((m) => m.waistCirc),
    neckCirc: penultimate((m) => m.neckCirc),
    hipCirc: penultimate((m) => m.hipCirc),

    // Skinfolds
    skinfoldChest: penultimate((m) => m.skinfoldChest),
    skinfoldAxilla: penultimate((m) => m.skinfoldAxilla),
    skinfoldTricep: penultimate((m) => m.skinfoldTricep),
    skinfoldSubscapular: penultimate((m) => m.skinfoldSubscapular),
    skinfoldAbdominal: penultimate((m) => m.skinfoldAbdominal),
    skinfoldSuprailiac: penultimate((m) => m.skinfoldSuprailiac),
    skinfoldThigh: penultimate((m) => m.skinfoldThigh),
    skinfoldBicep: penultimate((m) => m.skinfoldBicep),

    // Muscle circumferences
    upperArmCirc: penultimate((m) => m.upperArmCirc),
    lowerArmCirc: penultimate((m) => m.lowerArmCirc),
    thighCirc: penultimate((m) => m.thighCirc),
    calfCirc: penultimate((m) => m.calfCirc),
    chestCirc: penultimate((m) => m.chestCirc),
    shoulderCirc: penultimate((m) => m.shoulderCirc),

    // Performance metrics
    time5k: penultimate((m) => m.time5k),
    time1k: penultimate((m) => m.time1k),
    lMinO2: penultimate((m) => m.lMinO2),
    sKmAt129Bpm: penultimate((m) => m.sKmAt129Bpm),
    vo2max: penultimate((m) => m.vo2max),
  };
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
