/**
 * Goal Projections Calculation Library
 *
 * Provides:
 * - Rate calculation using linear regression
 * - Goal completion date projection
 * - Progress percentage calculation
 * - Wiggle chart data generation (historical projections derived from measurements)
 */

import { subWeeks } from "date-fns";
import type { Doc } from "@/convex/_generated/dataModel";
import {
  weightedAverageBodyFat,
  type SkinfoldMeasurements,
  type CircumferenceMeasurements,
} from "./bodyFat";
import { calculateFFMI, calculateLeanMass } from "./fitness";
import { calculateAge } from "./ageUtils";

// Types
export type GoalDirection = "increase" | "decrease";

export interface MetricConfig {
  direction: GoalDirection;
  label: string;
  unit: string;
  /** Extract the value from a measurement. Returns null if insufficient data. */
  getValue: (
    measurement: Doc<"measurements">,
    profile?: Doc<"userProfiles"> | null,
  ) => number | null;
}

export interface RateResult {
  /** Rate of change per day (positive for increase, negative for decrease) */
  rate: number;
  /** Number of data points used */
  dataPoints: number;
  /** R-squared value indicating fit quality (0-1) */
  rSquared: number;
}

export interface ProjectionResult {
  /** Current value of the metric */
  currentValue: number;
  /** Target value */
  targetValue: number;
  /** Rate of change per day */
  rate: number;
  /** Days remaining to reach goal (can be negative if goal passed) */
  daysRemaining: number;
  /** Projected completion date */
  projectedDate: Date;
  /** Progress percentage (0-100) */
  progressPercent: number;
  /** Whether currently on track (moving in right direction) */
  isOnTrack: boolean;
  /** Direction of rate relative to goal */
  rateDirection: "improving" | "worsening" | "stalled";
  /** Data points used for rate calculation */
  dataPoints: number;
}

export interface WiggleDataPoint {
  /** Snapshot date (when this projection was calculated) */
  snapshotDate: number;
  /** Projected goal completion date */
  projectedDate: number;
  /** Rate at this snapshot */
  rate: number;
  /** Current value at this snapshot */
  currentValue: number;
}

// --- Shared helpers for body-fat-derived metrics ---

/** Build skinfold measurement object from a raw measurement record. */
function buildSkinfolds(m: Doc<"measurements">): SkinfoldMeasurements {
  return {
    chest: m.skinfoldChest,
    axilla: m.skinfoldAxilla,
    tricep: m.skinfoldTricep,
    subscapular: m.skinfoldSubscapular,
    abdominal: m.skinfoldAbdominal,
    suprailiac: m.skinfoldSuprailiac,
    thigh: m.skinfoldThigh,
    bicep: m.skinfoldBicep,
  };
}

/** Build circumference measurement object from a raw measurement + profile height fallback. */
function buildCircumferences(
  m: Doc<"measurements">,
  profileHeight: number,
): Partial<CircumferenceMeasurements> {
  return {
    waist: m.waistCirc,
    neck: m.neckCirc,
    hip: m.hipCirc,
    height: m.height ?? profileHeight,
  };
}

/** Calculate weighted body fat % for a measurement, or null if insufficient data. */
function getBodyFatPercent(
  m: Doc<"measurements">,
  profile: Doc<"userProfiles">,
): number | null {
  const age = calculateAge(profile.birthDate, m.date);
  const result = weightedAverageBodyFat(
    buildSkinfolds(m),
    buildCircumferences(m, profile.height),
    age,
    profile.sex,
  );
  return result.weighted;
}

// Metric configurations
export const METRIC_CONFIG: Record<string, MetricConfig> = {
  weight: {
    direction: "decrease",
    label: "Weight",
    unit: "kg",
    getValue: (m) => m.weight ?? null,
  },
  bodyFat: {
    direction: "decrease",
    label: "Body Fat",
    unit: "%",
    getValue: (m, profile) => {
      if (!profile) return null;
      return getBodyFatPercent(m, profile);
    },
  },
  vo2max: {
    direction: "increase",
    label: "VO2max",
    unit: "mL/kg/min",
    getValue: (m) => m.vo2max ?? null,
  },
  time5k: {
    direction: "decrease",
    label: "5k Time",
    unit: "s",
    getValue: (m) => m.time5k ?? null,
  },
  time1k: {
    direction: "decrease",
    label: "1k Time",
    unit: "s",
    getValue: (m) => m.time1k ?? null,
  },
  leanMass: {
    direction: "increase",
    label: "Lean Mass",
    unit: "kg",
    getValue: (m, profile) => {
      if (!m.weight || !profile) return null;
      const bf = getBodyFatPercent(m, profile);
      if (bf === null) return null;
      return calculateLeanMass(m.weight, bf);
    },
  },
  ffmi: {
    direction: "increase",
    label: "FFMI",
    unit: "",
    getValue: (m, profile) => {
      if (!m.weight || !profile) return null;
      const bf = getBodyFatPercent(m, profile);
      if (bf === null) return null;
      const result = calculateFFMI(m.weight, m.height ?? profile.height, bf);
      return result.ffmi;
    },
  },
  waistCirc: {
    direction: "decrease",
    label: "Waist",
    unit: "cm",
    getValue: (m) => m.waistCirc ?? null,
  },
  upperArmCirc: {
    direction: "increase",
    label: "Upper Arm",
    unit: "cm",
    getValue: (m) => m.upperArmCirc ?? null,
  },
  chestCirc: {
    direction: "increase",
    label: "Chest",
    unit: "cm",
    getValue: (m) => m.chestCirc ?? null,
  },
};

/**
 * Calculate rate of change using linear regression (least squares method)
 *
 * @param dataPoints - Array of {date (timestamp), value} pairs
 * @returns Rate per day, data points count, and R-squared fit quality
 */
export function calculateRate(
  dataPoints: Array<{ date: number; value: number }>,
): RateResult | null {
  if (dataPoints.length < 3) {
    return null; // Need at least 3 points for meaningful regression
  }

  const n = dataPoints.length;

  // Convert timestamps to days (relative to first point for numerical stability)
  const firstDate = dataPoints[0].date;
  const points = dataPoints.map((p) => ({
    x: (p.date - firstDate) / (24 * 60 * 60 * 1000), // days
    y: p.value,
  }));

  // Calculate means
  let sumX = 0;
  let sumY = 0;
  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
  }
  const meanX = sumX / n;
  const meanY = sumY / n;

  // Calculate slope (rate) using least squares
  let numerator = 0;
  let denominator = 0;

  for (const p of points) {
    numerator += (p.x - meanX) * (p.y - meanY);
    denominator += (p.x - meanX) * (p.x - meanX);
  }

  if (denominator === 0) {
    return null; // All x values are the same (shouldn't happen with timestamps)
  }

  const slope = numerator / denominator;

  // Calculate R-squared
  const yIntercept = meanY - slope * meanX;
  let ssRes = 0; // Sum of squares of residuals
  let ssTot = 0; // Total sum of squares

  for (const p of points) {
    const predicted = slope * p.x + yIntercept;
    ssRes += (p.y - predicted) ** 2;
    ssTot += (p.y - meanY) ** 2;
  }

  const rSquared = ssTot === 0 ? 0 : 1 - ssRes / ssTot;

  return {
    rate: slope, // change per day
    dataPoints: n,
    rSquared: Math.max(0, Math.min(1, rSquared)),
  };
}

/**
 * Project when a goal will be reached based on current rate
 *
 * @param currentValue - Current value of the metric
 * @param targetValue - Target goal value
 * @param rate - Rate of change per day
 * @param direction - Whether the goal requires increase or decrease
 * @returns Projected date and days remaining, or null if projection is invalid
 */
export function projectGoalDate(
  currentValue: number,
  targetValue: number,
  rate: number,
  direction: GoalDirection,
): { projectedDate: Date; daysRemaining: number } | null {
  const diff = targetValue - currentValue;

  // Check if already achieved
  if (direction === "increase" && currentValue >= targetValue) {
    return { projectedDate: new Date(), daysRemaining: 0 };
  }
  if (direction === "decrease" && currentValue <= targetValue) {
    return { projectedDate: new Date(), daysRemaining: 0 };
  }

  // Check if rate is in wrong direction or zero
  if (direction === "increase" && rate <= 0) {
    return null; // Can't reach goal with zero or negative rate
  }
  if (direction === "decrease" && rate >= 0) {
    return null; // Can't reach goal with zero or positive rate
  }

  const daysRemaining = diff / rate;

  // Cap at reasonable max (10 years)
  if (Math.abs(daysRemaining) > 3650) {
    return null;
  }

  const projectedDate = new Date(
    Date.now() + daysRemaining * 24 * 60 * 60 * 1000,
  );

  return {
    projectedDate,
    daysRemaining: Math.round(daysRemaining),
  };
}

/**
 * Calculate progress percentage toward a goal
 *
 * @param startValue - Value when goal was created
 * @param currentValue - Current value
 * @param targetValue - Target value
 * @returns Progress percentage (0-100, can exceed 100 if surpassed)
 */
export function calculateProgress(
  startValue: number,
  currentValue: number,
  targetValue: number,
): number {
  const totalChange = targetValue - startValue;

  if (totalChange === 0) {
    return 100; // Already at goal
  }

  const currentChange = currentValue - startValue;
  return Math.round((currentChange / totalChange) * 100);
}

/**
 * Extract metric data points from measurements using config.getValue.
 * Returns sorted (by date ascending) non-null data points.
 */
function extractDataPoints(
  measurements: Doc<"measurements">[],
  config: MetricConfig,
  profile?: Doc<"userProfiles"> | null,
): Array<{ date: number; value: number }> {
  const dataPoints: Array<{ date: number; value: number }> = [];
  for (const m of measurements) {
    const value = config.getValue(m, profile);
    if (value !== null) {
      dataPoints.push({ date: m.date, value });
    }
  }
  dataPoints.sort((a, b) => a.date - b.date);
  return dataPoints;
}

/**
 * Calculate full projection for a goal given measurements
 *
 * @param measurements - Array of measurements (should be sorted by date ascending)
 * @param metric - The metric being tracked
 * @param targetValue - Target goal value
 * @param startValue - Optional starting value (defaults to first measurement)
 * @param profile - User profile for computed metrics
 * @param direction - Optional direction override (defaults to METRIC_CONFIG direction)
 * @returns Full projection result or null if insufficient data
 */
export function calculateProjection(
  measurements: Doc<"measurements">[],
  metric: string,
  targetValue: number,
  startValue?: number,
  profile?: Doc<"userProfiles"> | null,
  direction?: GoalDirection,
): ProjectionResult | null {
  const config = METRIC_CONFIG[metric];
  if (!config) return null;

  const effectiveDirection = direction ?? config.direction;
  const dataPoints = extractDataPoints(measurements, config, profile);

  if (dataPoints.length === 0) {
    return null;
  }

  const currentValue = dataPoints[dataPoints.length - 1].value;
  const effectiveStartValue = startValue ?? dataPoints[0].value;

  // Calculate rate
  const rateResult = calculateRate(dataPoints);
  const rate = rateResult?.rate ?? 0;

  // Calculate progress
  const progressPercent = calculateProgress(
    effectiveStartValue,
    currentValue,
    targetValue,
  );

  // Check if moving in right direction
  const isOnTrack =
    (effectiveDirection === "increase" && rate > 0) ||
    (effectiveDirection === "decrease" && rate < 0);

  // Determine rate direction relative to goal
  const rateDirection: "improving" | "worsening" | "stalled" =
    Math.abs(rate) < 0.001 ? "stalled" : isOnTrack ? "improving" : "worsening";

  // Project completion date
  const projection = projectGoalDate(
    currentValue,
    targetValue,
    rate,
    effectiveDirection,
  );

  return {
    currentValue,
    targetValue,
    rate,
    daysRemaining: projection?.daysRemaining ?? Infinity,
    projectedDate: projection?.projectedDate ?? new Date(9999, 11, 31),
    progressPercent,
    isOnTrack,
    rateDirection,
    dataPoints: dataPoints.length,
  };
}

/**
 * Find the index of the last measurement with date <= cutoff using binary search.
 * Measurements must be sorted by date ascending.
 * Returns -1 if no measurement is at or before the cutoff.
 */
function findCutoffIndex(
  measurements: Doc<"measurements">[],
  cutoffDate: number,
): number {
  let lo = 0;
  let hi = measurements.length - 1;
  let result = -1;

  while (lo <= hi) {
    const mid = (lo + hi) >>> 1;
    if (measurements[mid].date <= cutoffDate) {
      result = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  return result;
}

/**
 * Build wiggle chart data by calculating historical projections
 *
 * This derives what the projection would have been at each past snapshot date,
 * showing how projections changed over time.
 *
 * @param measurements - All measurements (sorted by date ascending)
 * @param metric - The metric being tracked
 * @param targetValue - Target goal value
 * @param profile - User profile for computed metrics
 * @param weeks - Number of weeks of history to generate (default 12)
 * @param direction - Optional direction override (defaults to METRIC_CONFIG direction)
 * @returns Array of wiggle data points
 */
export function buildWiggleChartData(
  measurements: Doc<"measurements">[],
  metric: string,
  targetValue: number,
  profile?: Doc<"userProfiles"> | null,
  weeks = 12,
  direction?: GoalDirection,
): WiggleDataPoint[] {
  const config = METRIC_CONFIG[metric];
  if (!config) return [];

  const effectiveDirection = direction ?? config.direction;

  // Pre-sort measurements once
  const sorted = measurements.toSorted((a, b) => a.date - b.date);

  const snapshots: WiggleDataPoint[] = [];

  for (let i = weeks; i >= 0; i--) {
    const snapshotDate = subWeeks(new Date(), i);
    const snapshotTimestamp = snapshotDate.getTime();

    // Binary search for the cutoff index instead of filtering the whole array
    const cutoffIndex = findCutoffIndex(sorted, snapshotTimestamp);
    if (cutoffIndex < 2) {
      continue; // Need at least 3 measurements
    }

    // Extract values for this metric up to snapshot date
    const dataPoints = extractDataPoints(
      sorted.slice(0, cutoffIndex + 1),
      config,
      profile,
    );

    if (dataPoints.length < 3) {
      continue;
    }

    const currentValue = dataPoints[dataPoints.length - 1].value;

    // Calculate rate at this point in time
    const rateResult = calculateRate(dataPoints);
    if (!rateResult) continue;

    // Project from this point in time
    const projection = projectGoalDate(
      currentValue,
      targetValue,
      rateResult.rate,
      effectiveDirection,
    );

    if (projection) {
      snapshots.push({
        snapshotDate: snapshotTimestamp,
        projectedDate: projection.projectedDate.getTime(),
        rate: rateResult.rate,
        currentValue,
      });
    }
  }

  return snapshots;
}

/**
 * Get the most recent value for a metric from measurements
 */
export function getLatestValue(
  measurements: Doc<"measurements">[],
  metric: string,
  profile?: Doc<"userProfiles"> | null,
): number | null {
  const config = METRIC_CONFIG[metric];
  if (!config) return null;

  // Sort descending to find most recent value first
  const sorted = measurements.toSorted((a, b) => b.date - a.date);

  for (const m of sorted) {
    const value = config.getValue(m, profile);
    if (value !== null) {
      return value;
    }
  }

  return null;
}
