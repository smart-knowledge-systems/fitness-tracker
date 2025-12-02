/**
 * Fitness Calculation Library
 *
 * Includes:
 * - FFMI (Fat-Free Mass Index)
 * - Cooper Test (VO2max from 12-min run)
 * - VO2max estimations from race times
 * - Lean mass calculations
 */

/**
 * Calculate Fat-Free Mass Index (FFMI)
 *
 * @param weightKg - Body weight in kilograms
 * @param heightCm - Height in centimeters
 * @param bodyFatPercent - Body fat percentage (0-100)
 * @returns FFMI value and normalized FFMI
 */
export function calculateFFMI(
  weightKg: number,
  heightCm: number,
  bodyFatPercent: number,
): { ffmi: number; normalizedFFMI: number; leanMassKg: number } {
  const heightM = heightCm / 100;
  const leanMassKg = weightKg * (1 - bodyFatPercent / 100);
  const ffmi = leanMassKg / (heightM * heightM);

  // Normalized FFMI adjusts for height differences
  // Reference height is 1.8m
  const normalizedFFMI = ffmi + 6.1 * (1.8 - heightM);

  return {
    ffmi: Math.round(ffmi * 10) / 10,
    normalizedFFMI: Math.round(normalizedFFMI * 10) / 10,
    leanMassKg: Math.round(leanMassKg * 10) / 10,
  };
}

/**
 * FFMI Classification
 * Based on natural bodybuilding research
 */
export function classifyFFMI(
  normalizedFFMI: number,
  sex: "male" | "female",
): string {
  if (sex === "male") {
    if (normalizedFFMI < 18) return "Below average";
    if (normalizedFFMI < 20) return "Average";
    if (normalizedFFMI < 22) return "Above average";
    if (normalizedFFMI < 23) return "Excellent";
    if (normalizedFFMI < 25) return "Superior";
    if (normalizedFFMI < 26) return "Near genetic limit";
    return "Likely enhanced";
  } else {
    // Female ranges are approximately 3-4 points lower
    if (normalizedFFMI < 14) return "Below average";
    if (normalizedFFMI < 16) return "Average";
    if (normalizedFFMI < 18) return "Above average";
    if (normalizedFFMI < 19) return "Excellent";
    if (normalizedFFMI < 21) return "Superior";
    if (normalizedFFMI < 22) return "Near genetic limit";
    return "Likely enhanced";
  }
}

/**
 * Cooper Test - Calculate VO2max from 12-minute run distance
 *
 * @param distanceMeters - Distance covered in 12 minutes (meters)
 * @returns Estimated VO2max in mL/kg/min
 */
export function cooperTestVO2max(distanceMeters: number): number {
  const vo2max = (distanceMeters - 504.9) / 44.73;
  return Math.round(vo2max * 10) / 10;
}

/**
 * Reverse Cooper Test - Calculate required distance for target VO2max
 *
 * @param targetVO2max - Target VO2max in mL/kg/min
 * @returns Required distance in meters for 12-minute run
 */
export function cooperTestDistance(targetVO2max: number): number {
  const distance = targetVO2max * 44.73 + 504.9;
  return Math.round(distance);
}

/**
 * Cooper Test Fitness Classification
 */
export function classifyCooperTest(
  vo2max: number,
  age: number,
  sex: "male" | "female",
): string {
  // Simplified classification based on age groups
  // Using general fitness standards

  if (sex === "male") {
    if (age < 30) {
      if (vo2max < 25) return "Very Poor";
      if (vo2max < 34) return "Poor";
      if (vo2max < 43) return "Fair";
      if (vo2max < 53) return "Good";
      if (vo2max < 60) return "Excellent";
      return "Superior";
    } else if (age < 40) {
      if (vo2max < 23) return "Very Poor";
      if (vo2max < 31) return "Poor";
      if (vo2max < 39) return "Fair";
      if (vo2max < 48) return "Good";
      if (vo2max < 56) return "Excellent";
      return "Superior";
    } else if (age < 50) {
      if (vo2max < 21) return "Very Poor";
      if (vo2max < 28) return "Poor";
      if (vo2max < 36) return "Fair";
      if (vo2max < 45) return "Good";
      if (vo2max < 52) return "Excellent";
      return "Superior";
    } else {
      if (vo2max < 19) return "Very Poor";
      if (vo2max < 25) return "Poor";
      if (vo2max < 33) return "Fair";
      if (vo2max < 41) return "Good";
      if (vo2max < 48) return "Excellent";
      return "Superior";
    }
  } else {
    // Female ranges
    if (age < 30) {
      if (vo2max < 24) return "Very Poor";
      if (vo2max < 31) return "Poor";
      if (vo2max < 37) return "Fair";
      if (vo2max < 43) return "Good";
      if (vo2max < 49) return "Excellent";
      return "Superior";
    } else if (age < 40) {
      if (vo2max < 22) return "Very Poor";
      if (vo2max < 28) return "Poor";
      if (vo2max < 34) return "Fair";
      if (vo2max < 40) return "Good";
      if (vo2max < 46) return "Excellent";
      return "Superior";
    } else if (age < 50) {
      if (vo2max < 20) return "Very Poor";
      if (vo2max < 25) return "Poor";
      if (vo2max < 31) return "Fair";
      if (vo2max < 37) return "Good";
      if (vo2max < 43) return "Excellent";
      return "Superior";
    } else {
      if (vo2max < 18) return "Very Poor";
      if (vo2max < 23) return "Poor";
      if (vo2max < 28) return "Fair";
      if (vo2max < 34) return "Good";
      if (vo2max < 40) return "Excellent";
      return "Superior";
    }
  }
}

/**
 * Estimate VO2max from 5k race time
 * Using Jack Daniels' VDOT formula approximation
 *
 * @param timeSeconds - 5k time in seconds
 * @returns Estimated VO2max in mL/kg/min
 */
export function vo2maxFrom5k(timeSeconds: number): number {
  // Simplified formula based on Jack Daniels' research
  // VO2max ≈ (-4.6 + 0.182258 * velocity + 0.000104 * velocity²)
  // / (0.8 + 0.1894393 * e^(-0.012778 * time) + 0.2989558 * e^(-0.1932605 * time))

  const distanceMeters = 5000;
  const velocity = distanceMeters / timeSeconds; // m/s
  const velocityMpm = velocity * 60; // m/min

  // Oxygen cost of running (mL/kg/min)
  const oxygenCost =
    -4.6 + 0.182258 * velocityMpm + 0.000104 * velocityMpm * velocityMpm;

  const timeMinutes = timeSeconds / 60;

  // Percent VO2max (fraction of max used during race)
  const percentVO2max =
    0.8 +
    0.1894393 * Math.exp(-0.012778 * timeMinutes) +
    0.2989558 * Math.exp(-0.1932605 * timeMinutes);

  const vo2max = oxygenCost / percentVO2max;
  return Math.round(vo2max * 10) / 10;
}

/**
 * Estimate VO2max from 1k race time
 *
 * @param timeSeconds - 1k time in seconds
 * @returns Estimated VO2max in mL/kg/min
 */
export function vo2maxFrom1k(timeSeconds: number): number {
  const distanceMeters = 1000;
  const velocity = distanceMeters / timeSeconds;
  const velocityMpm = velocity * 60;

  const oxygenCost =
    -4.6 + 0.182258 * velocityMpm + 0.000104 * velocityMpm * velocityMpm;

  const timeMinutes = timeSeconds / 60;

  // 1k is run at a higher %VO2max than 5k
  const percentVO2max =
    0.8 +
    0.1894393 * Math.exp(-0.012778 * timeMinutes) +
    0.2989558 * Math.exp(-0.1932605 * timeMinutes);

  const vo2max = oxygenCost / percentVO2max;
  return Math.round(vo2max * 10) / 10;
}

/**
 * Estimate VO2max from 10k race time
 *
 * @param timeSeconds - 10k time in seconds
 * @returns Estimated VO2max in mL/kg/min
 */
export function vo2maxFrom10k(timeSeconds: number): number {
  const distanceMeters = 10000;
  const velocity = distanceMeters / timeSeconds;
  const velocityMpm = velocity * 60;

  const oxygenCost =
    -4.6 + 0.182258 * velocityMpm + 0.000104 * velocityMpm * velocityMpm;

  const timeMinutes = timeSeconds / 60;

  const percentVO2max =
    0.8 +
    0.1894393 * Math.exp(-0.012778 * timeMinutes) +
    0.2989558 * Math.exp(-0.1932605 * timeMinutes);

  const vo2max = oxygenCost / percentVO2max;
  return Math.round(vo2max * 10) / 10;
}

/**
 * Calculate predicted 5k race time from VO2max
 * Uses binary search since the Jack Daniels formula isn't analytically invertible
 *
 * @param targetVO2max - Target VO2max in mL/kg/min
 * @returns Predicted 5k time in seconds
 */
export function raceTime5kFromVO2max(targetVO2max: number): number {
  // Binary search bounds: 10:00 (elite) to 60:00 (recreational)
  let low = 600;
  let high = 3600;
  const tolerance = 0.01;

  while (high - low > 1) {
    const mid = Math.floor((low + high) / 2);
    const vo2max = vo2maxFrom5k(mid);

    if (Math.abs(vo2max - targetVO2max) < tolerance) {
      return mid;
    }

    // Higher VO2max means faster time (lower seconds)
    if (vo2max > targetVO2max) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return Math.round((low + high) / 2);
}

/**
 * Calculate predicted 10k race time from VO2max
 * Uses binary search since the Jack Daniels formula isn't analytically invertible
 *
 * @param targetVO2max - Target VO2max in mL/kg/min
 * @returns Predicted 10k time in seconds
 */
export function raceTime10kFromVO2max(targetVO2max: number): number {
  // Binary search bounds: 20:00 (elite) to 120:00 (recreational)
  let low = 1200;
  let high = 7200;
  const tolerance = 0.01;

  while (high - low > 1) {
    const mid = Math.floor((low + high) / 2);
    const vo2max = vo2maxFrom10k(mid);

    if (Math.abs(vo2max - targetVO2max) < tolerance) {
      return mid;
    }

    // Higher VO2max means faster time (lower seconds)
    if (vo2max > targetVO2max) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return Math.round((low + high) / 2);
}

/**
 * Calculate predicted 1k race time from VO2max
 * Uses binary search since the Jack Daniels formula isn't analytically invertible
 *
 * @param targetVO2max - Target VO2max in mL/kg/min
 * @returns Predicted 1k time in seconds
 */
export function raceTime1kFromVO2max(targetVO2max: number): number {
  // Binary search bounds: 2:00 (elite) to 10:00 (recreational)
  let low = 120;
  let high = 600;
  const tolerance = 0.01;

  while (high - low > 1) {
    const mid = Math.floor((low + high) / 2);
    const vo2max = vo2maxFrom1k(mid);

    if (Math.abs(vo2max - targetVO2max) < tolerance) {
      return mid;
    }

    // Higher VO2max means faster time (lower seconds)
    if (vo2max > targetVO2max) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return Math.round((low + high) / 2);
}

/**
 * Calculate estimated lean mass from weight and body fat
 */
export function calculateLeanMass(
  weightKg: number,
  bodyFatPercent: number,
): number {
  return Math.round(weightKg * (1 - bodyFatPercent / 100) * 10) / 10;
}

/**
 * Format time in seconds to MM:SS or HH:MM:SS
 */
export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Parse time string (MM:SS or HH:MM:SS) to seconds
 */
export function parseTime(timeString: string): number | null {
  const parts = timeString.split(":").map(Number);

  if (parts.some(isNaN)) return null;

  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return minutes * 60 + seconds;
  } else if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    return hours * 3600 + minutes * 60 + seconds;
  }

  return null;
}

/**
 * Calculate pace (seconds per km) from time and distance
 */
export function calculatePace(timeSeconds: number, distanceKm: number): number {
  return Math.round(timeSeconds / distanceKm);
}

/**
 * Format pace as MM:SS per km
 */
export function formatPace(secondsPerKm: number): string {
  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = Math.floor(secondsPerKm % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}/km`;
}
