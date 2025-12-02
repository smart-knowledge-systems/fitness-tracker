/**
 * Altitude Adjustment for Running Performance
 *
 * Based on running-performance-calculator formula:
 * Performance degrades by approximately 1% per 1000 feet (304.8m) of altitude
 * above the runner's baseline training elevation.
 *
 * Reference: http://maximumperformancerunning.blogspot.com/2013/05/training-in-summer-heathumidity.html
 */

// 1000 feet in meters - the altitude increment for 1% performance loss
const ALTITUDE_INCREMENT_METERS = 304.8;

// Performance degradation per altitude increment (1%)
const DEGRADATION_PER_INCREMENT = 0.01;

/**
 * Calculate altitude penalty factor for a given elevation relative to baseline
 *
 * @param segmentElevation - Elevation of the segment in meters
 * @param baselineElevation - Runner's training elevation in meters
 * @returns Penalty factor (> 1 means slower, < 1 means faster)
 *
 * Example:
 * - Running at 2000m when you train at sea level (0m):
 *   penalty = 1 + (2000 / 304.8) * 0.01 = 1.0656 (6.56% slower)
 * - Running at sea level when you train at 2000m:
 *   penalty = 1 + (-2000 / 304.8) * 0.01 = 0.9344 (6.56% faster)
 */
export function calculateAltitudePenalty(
  segmentElevation: number,
  baselineElevation: number,
): number {
  const altitudeDiff = segmentElevation - baselineElevation;
  return (
    1 + (altitudeDiff / ALTITUDE_INCREMENT_METERS) * DEGRADATION_PER_INCREMENT
  );
}

/**
 * Apply altitude adjustment to a running speed
 *
 * @param speedMs - Speed in m/s
 * @param segmentElevation - Elevation of the segment in meters
 * @param baselineElevation - Runner's training elevation in meters
 * @returns Adjusted speed in m/s (slower at higher altitudes)
 */
export function applyAltitudeToSpeed(
  speedMs: number,
  segmentElevation: number,
  baselineElevation: number,
): number {
  const penalty = calculateAltitudePenalty(segmentElevation, baselineElevation);
  return speedMs / penalty;
}

/**
 * Calculate the time penalty for running at altitude
 *
 * @param timeSeconds - Base time in seconds
 * @param segmentElevation - Elevation in meters
 * @param baselineElevation - Baseline training elevation in meters
 * @returns Additional time in seconds due to altitude
 */
export function calculateAltitudeTimePenalty(
  timeSeconds: number,
  segmentElevation: number,
  baselineElevation: number,
): number {
  const altitudeDiff = segmentElevation - baselineElevation;
  return (
    (timeSeconds * altitudeDiff * DEGRADATION_PER_INCREMENT) /
    ALTITUDE_INCREMENT_METERS
  );
}

/**
 * Convert feet to meters
 */
export function feetToMeters(feet: number): number {
  return feet * 0.3048;
}

/**
 * Convert meters to feet
 */
export function metersToFeet(meters: number): number {
  return meters / 0.3048;
}

/**
 * Describe the altitude impact as a percentage
 *
 * @param segmentElevation - Elevation of the segment in meters
 * @param baselineElevation - Runner's training elevation in meters
 * @returns String describing the impact (e.g., "+3.2% slower" or "-2.1% faster")
 */
export function describeAltitudeImpact(
  segmentElevation: number,
  baselineElevation: number,
): string {
  const penalty = calculateAltitudePenalty(segmentElevation, baselineElevation);
  const percentChange = (penalty - 1) * 100;

  if (Math.abs(percentChange) < 0.1) {
    return "No significant altitude impact";
  }

  if (percentChange > 0) {
    return `+${percentChange.toFixed(1)}% slower due to altitude`;
  } else {
    return `${Math.abs(percentChange).toFixed(1)}% faster due to lower altitude`;
  }
}
