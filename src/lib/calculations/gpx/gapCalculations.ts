/**
 * Grade-Adjusted Pace (GAP) Calculations
 *
 * Based on:
 * - Black et al. 2018: Flat running economy data
 * - Minetti et al. 2002: Quintic polynomial for grade energy cost
 */

import { BLACK_GAM_DATA } from "@/lib/data/black-gam";

/**
 * Minetti 2002 quintic polynomial for change in energy cost due to grade
 * @param grade - Grade as decimal (0.10 = 10% grade, negative for downhill)
 * @returns Delta Cr - added cost of running above level ground in J/kg/m
 */
export function calcDeltaEC(grade: number): number {
  const g = grade;
  return (
    155.4 * Math.pow(g, 5) -
    30.4 * Math.pow(g, 4) -
    43.3 * Math.pow(g, 3) +
    46.3 * Math.pow(g, 2) +
    19.5 * g
  );
}

/**
 * Lookup energy cost or metabolic power at a given speed using Black et al. data
 * Uses linear interpolation between data points
 *
 * @param speedMs - Running speed in m/s
 * @param column - Which column to look up: 'energy_j_kg_m' or 'energy_j_kg_s'
 * @returns Interpolated value, or NaN if outside data range
 */
export function lookupSpeed(
  speedMs: number,
  column: "energy_j_kg_m" | "energy_j_kg_s",
): number {
  const speed = BLACK_GAM_DATA.speed_m_s;
  const energy = BLACK_GAM_DATA[column];

  // Check bounds
  if (speedMs < speed[0] || speedMs > speed[speed.length - 1]) {
    return NaN;
  }

  // Find the indices that speedMs falls between
  let i = 0;
  for (; i < speed.length - 1; i++) {
    if (speedMs >= speed[i] && speedMs <= speed[i + 1]) {
      break;
    }
  }

  // Linear interpolation: y = y0 + (y1 - y0) * ((x - x0) / (x1 - x0))
  const result =
    energy[i] +
    (energy[i + 1] - energy[i]) *
      ((speedMs - speed[i]) / (speed[i + 1] - speed[i]));

  return result;
}

/**
 * Find the flat-ground speed that produces a given metabolic power
 * Inverse lookup in Black data using metabolic power (W/kg)
 *
 * @param wKg - Target metabolic power in W/kg (J/kg/s)
 * @returns Speed in m/s that produces this power, or NaN if outside range
 */
export function getEquivFlatSpeed(wKg: number): number {
  const speed = BLACK_GAM_DATA.speed_m_s;
  const metPower = BLACK_GAM_DATA.energy_j_kg_s;

  // Check bounds
  if (wKg < metPower[0] || wKg > metPower[metPower.length - 1]) {
    return NaN;
  }

  // Metabolic power is monotonically increasing with speed, so we can search linearly
  let i = 0;
  for (; i < metPower.length - 1; i++) {
    if (wKg >= metPower[i] && wKg <= metPower[i + 1]) {
      break;
    }
  }

  // Linear interpolation to find speed
  const eqSpeed =
    speed[i] +
    (speed[i + 1] - speed[i]) *
      ((wKg - metPower[i]) / (metPower[i + 1] - metPower[i]));

  return eqSpeed;
}

/**
 * Calculate the actual running speed on a grade for a given flat-ground effort
 *
 * @param basePaceMs - Base flat-ground pace in m/s (the effort level)
 * @param grade - Grade as decimal (0.05 = 5% uphill, -0.05 = 5% downhill)
 * @returns Actual speed in m/s on this grade at the same metabolic effort
 */
export function calculateSpeedOnGrade(
  basePaceMs: number,
  grade: number,
): number {
  // Get flat running cost at base speed
  let flatCr = lookupSpeed(basePaceMs, "energy_j_kg_m");
  if (isNaN(flatCr)) {
    // If outside lookup range, use reasonable default
    flatCr = 4.0; // J/kg/m
  }

  // Calculate added cost due to grade
  const deltaCr = calcDeltaEC(grade);
  const totalCr = flatCr + deltaCr;

  // Get target metabolic power (what we want to maintain)
  let targetWkg = lookupSpeed(basePaceMs, "energy_j_kg_s");
  if (isNaN(targetWkg)) {
    targetWkg = flatCr * basePaceMs;
  }

  // Find speed that gives target metabolic power on this grade
  // Power = Cost * Speed, so Speed = Power / Cost
  const actualSpeed = targetWkg / totalCr;

  if (!Number.isFinite(actualSpeed) || actualSpeed <= 0) {
    // Fallback to simple grade penalty
    const gradePenalty = Math.max(-0.5, Math.min(0.8, grade * 10));
    return basePaceMs * (1 - gradePenalty);
  }

  return actualSpeed;
}

/**
 * Convert pace (min/km) to speed (m/s)
 */
export function paceToSpeed(paceMinPerKm: number): number {
  return 1000 / (paceMinPerKm * 60);
}

/**
 * Convert speed (m/s) to pace (min/km)
 */
export function speedToPace(speedMs: number): number {
  return 1000 / (speedMs * 60);
}

/**
 * Convert pace (min/mi) to speed (m/s)
 */
export function pacePerMileToSpeed(paceMinPerMile: number): number {
  return 1609.344 / (paceMinPerMile * 60);
}

/**
 * Convert speed (m/s) to pace (min/mi)
 */
export function speedToPacePerMile(speedMs: number): number {
  return 1609.344 / (speedMs * 60);
}

/**
 * Format seconds as MM:SS string
 */
export function formatPace(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Format time in seconds to MM:SS or HH:MM:SS
 */
export function formatTime(timeSeconds: number): string {
  const hours = Math.floor(timeSeconds / 3600);
  const minutes = Math.floor((timeSeconds % 3600) / 60);
  const seconds = Math.floor(timeSeconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Parse time string (MM:SS or HH:MM:SS) to seconds
 */
export function parseTime(timeString: string): number {
  const parts = timeString.split(":").map((p) => parseInt(p, 10));

  if (parts.some(isNaN)) {
    throw new Error("Invalid time format");
  }

  if (parts.length === 2) {
    // MM:SS
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    // HH:MM:SS
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else {
    throw new Error("Invalid time format. Use MM:SS or HH:MM:SS");
  }
}
