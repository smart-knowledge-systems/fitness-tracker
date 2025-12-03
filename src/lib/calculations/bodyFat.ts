/**
 * Body Fat Calculation Library
 *
 * Implements four methods for estimating body fat percentage:
 * 1. Navy Method (circumference-based)
 * 2. Jackson-Pollock 7-site (skinfold)
 * 3. Jackson-Pollock 3-site (skinfold)
 * 4. Durnin-Womersley (skinfold)
 */

export type Sex = "male" | "female";
export type Race = "caucasian" | "black";

export interface SkinfoldMeasurements {
  chest?: number; // mm
  axilla?: number; // mm (alias for midaxillary)
  midaxillary?: number; // mm (canonical name)
  tricep?: number; // mm
  subscapular?: number; // mm
  abdominal?: number; // mm
  suprailiac?: number; // mm
  thigh?: number; // mm
  bicep?: number; // mm
}

export interface CircumferenceMeasurements {
  waist: number; // cm
  neck: number; // cm
  hip?: number; // cm - required for females
  height: number; // cm
}

/**
 * Navy Method Body Fat Calculation
 * Uses circumference measurements (waist, neck, hip for women, height)
 */
export function navyBodyFat(
  measurements: CircumferenceMeasurements,
  sex: Sex,
): number | null {
  const { waist, neck, hip, height } = measurements;

  if (sex === "male") {
    if (waist <= neck) return null; // Invalid measurements
    const bodyFat =
      495 /
        (1.0324 -
          0.19077 * Math.log10(waist - neck) +
          0.15456 * Math.log10(height)) -
      450;
    return Math.max(0, Math.min(100, bodyFat));
  } else {
    if (!hip) return null; // Hip required for females
    if (waist + hip <= neck) return null;
    const bodyFat =
      495 /
        (1.29579 -
          0.35004 * Math.log10(waist + hip - neck) +
          0.221 * Math.log10(height)) -
      450;
    return Math.max(0, Math.min(100, bodyFat));
  }
}

/**
 * Jackson-Pollock 7-Site Body Fat Calculation
 * Uses: chest, axilla, tricep, subscapular, abdominal, suprailiac, thigh
 */
export function jacksonPollock7(
  skinfolds: SkinfoldMeasurements,
  age: number,
  sex: Sex,
): number | null {
  const { chest, axilla, tricep, subscapular, abdominal, suprailiac, thigh } =
    skinfolds;

  // All 7 sites required
  if (
    chest === undefined ||
    axilla === undefined ||
    tricep === undefined ||
    subscapular === undefined ||
    abdominal === undefined ||
    suprailiac === undefined ||
    thigh === undefined
  ) {
    return null;
  }

  const sum =
    chest + axilla + tricep + subscapular + abdominal + suprailiac + thigh;
  const sumSquared = sum * sum;

  let bodyDensity: number;

  if (sex === "male") {
    // Male formula
    bodyDensity =
      1.112 - 0.00043499 * sum + 0.00000055 * sumSquared - 0.00028826 * age;
  } else {
    // Female formula
    bodyDensity =
      1.097 - 0.00046971 * sum + 0.00000056 * sumSquared - 0.00012828 * age;
  }

  // Siri equation to convert density to body fat %
  const bodyFat = 495 / bodyDensity - 450;
  return Math.max(0, Math.min(100, bodyFat));
}

/**
 * Jackson-Pollock 3-Site Body Fat Calculation
 * Men: chest, abdominal, thigh
 * Women: tricep, suprailiac, thigh
 */
export function jacksonPollock3(
  skinfolds: SkinfoldMeasurements,
  age: number,
  sex: Sex,
): number | null {
  let sum: number;

  if (sex === "male") {
    const { chest, abdominal, thigh } = skinfolds;
    if (chest === undefined || abdominal === undefined || thigh === undefined) {
      return null;
    }
    sum = chest + abdominal + thigh;
  } else {
    const { tricep, suprailiac, thigh } = skinfolds;
    if (
      tricep === undefined ||
      suprailiac === undefined ||
      thigh === undefined
    ) {
      return null;
    }
    sum = tricep + suprailiac + thigh;
  }

  const sumSquared = sum * sum;

  let bodyDensity: number;

  if (sex === "male") {
    bodyDensity =
      1.10938 - 0.0008267 * sum + 0.0000016 * sumSquared - 0.0002574 * age;
  } else {
    bodyDensity =
      1.0994921 - 0.0009929 * sum + 0.0000023 * sumSquared - 0.0001392 * age;
  }

  // Siri equation
  const bodyFat = 495 / bodyDensity - 450;
  return Math.max(0, Math.min(100, bodyFat));
}

/**
 * Durnin-Womersley Body Fat Calculation
 * Uses: bicep, tricep, subscapular, suprailiac
 * Coefficients vary by age and sex
 */
export function durninWomersley(
  skinfolds: SkinfoldMeasurements,
  age: number,
  sex: Sex,
): number | null {
  const { bicep, tricep, subscapular, suprailiac } = skinfolds;

  if (
    bicep === undefined ||
    tricep === undefined ||
    subscapular === undefined ||
    suprailiac === undefined
  ) {
    return null;
  }

  const sum = bicep + tricep + subscapular + suprailiac;
  const logSum = Math.log10(sum);

  // Age-specific coefficients
  let c: number, m: number;

  if (sex === "male") {
    if (age < 17) {
      c = 1.1533;
      m = 0.0643;
    } else if (age < 20) {
      c = 1.162;
      m = 0.063;
    } else if (age < 30) {
      c = 1.1631;
      m = 0.0632;
    } else if (age < 40) {
      c = 1.1422;
      m = 0.0544;
    } else if (age < 50) {
      c = 1.162;
      m = 0.07;
    } else {
      c = 1.1715;
      m = 0.0779;
    }
  } else {
    if (age < 17) {
      c = 1.1369;
      m = 0.0598;
    } else if (age < 20) {
      c = 1.1549;
      m = 0.0678;
    } else if (age < 30) {
      c = 1.1599;
      m = 0.0717;
    } else if (age < 40) {
      c = 1.1423;
      m = 0.0632;
    } else if (age < 50) {
      c = 1.1333;
      m = 0.0612;
    } else {
      c = 1.1339;
      m = 0.0645;
    }
  }

  const bodyDensity = c - m * logSum;

  // Siri equation
  const bodyFat = 495 / bodyDensity - 450;
  return Math.max(0, Math.min(100, bodyFat));
}

/**
 * Helper to get midaxillary measurement (prefers midaxillary over axilla)
 */
function getMidaxillary(skinfolds: SkinfoldMeasurements): number | undefined {
  return skinfolds.midaxillary ?? skinfolds.axilla;
}

/**
 * Evans 3-Site Body Fat Calculation
 * Best for males (CCC=0.93), good for females (CCC=0.77)
 * Uses: tricep, thigh, abdominal
 * Returns BF% directly (not body density)
 */
export function evans3Site(
  skinfolds: SkinfoldMeasurements,
  sex: Sex,
  race?: Race,
): number | null {
  if (!race) return null; // Race required for Evans formulas

  const { tricep, thigh, abdominal } = skinfolds;

  if (tricep === undefined || thigh === undefined || abdominal === undefined) {
    return null;
  }

  const sum = tricep + thigh + abdominal;
  const sexCoef = sex === "male" ? 1 : 0;
  const raceCoef = race === "black" ? 1 : 0;

  // BF% = 8.997 + 0.24658(sum) - 6.343(sex) - 1.998(race)
  const bodyFat = 8.997 + 0.24658 * sum - 6.343 * sexCoef - 1.998 * raceCoef;
  return Math.max(0, Math.min(100, bodyFat));
}

/**
 * Evans 7-Site Body Fat Calculation
 * Best for females (CCC=0.82, SEE=2.01kg)
 * Uses: all 7 skinfold sites
 * Returns BF% directly (not body density)
 */
export function evans7Site(
  skinfolds: SkinfoldMeasurements,
  sex: Sex,
  race?: Race,
): number | null {
  if (!race) return null; // Race required for Evans formulas

  const { chest, tricep, subscapular, abdominal, suprailiac, thigh } =
    skinfolds;
  const midaxillary = getMidaxillary(skinfolds);

  if (
    chest === undefined ||
    midaxillary === undefined ||
    tricep === undefined ||
    subscapular === undefined ||
    abdominal === undefined ||
    suprailiac === undefined ||
    thigh === undefined
  ) {
    return null;
  }

  const sum =
    chest + midaxillary + tricep + subscapular + abdominal + suprailiac + thigh;
  const sexCoef = sex === "male" ? 1 : 0;
  const raceCoef = race === "black" ? 1 : 0;

  // BF% = 10.566 + 0.12077(SS7) - 8.057(sex) - 2.545(race)
  const bodyFat = 10.566 + 0.12077 * sum - 8.057 * sexCoef - 2.545 * raceCoef;
  return Math.max(0, Math.min(100, bodyFat));
}

/**
 * Lohman Body Fat Calculation
 * Good for males (CCC=0.88), demonstrated equivalence
 * Uses: tricep, subscapular, abdominal
 */
export function lohman(skinfolds: SkinfoldMeasurements): number | null {
  const { tricep, subscapular, abdominal } = skinfolds;

  if (
    tricep === undefined ||
    subscapular === undefined ||
    abdominal === undefined
  ) {
    return null;
  }

  const sum = tricep + subscapular + abdominal;
  const sumSquared = sum * sum;

  // Db = 1.0982 - 0.000815(sum) + 0.00000084(sum)²
  const bodyDensity = 1.0982 - 0.000815 * sum + 0.00000084 * sumSquared;

  // Siri equation
  const bodyFat = 495 / bodyDensity - 450;
  return Math.max(0, Math.min(100, bodyFat));
}

/**
 * Katch Body Fat Calculation
 * Did not differ from criterion for males
 * Uses: tricep, subscapular, abdominal
 */
export function katch(skinfolds: SkinfoldMeasurements): number | null {
  const { tricep, subscapular, abdominal } = skinfolds;

  if (
    tricep === undefined ||
    subscapular === undefined ||
    abdominal === undefined
  ) {
    return null;
  }

  // Db = 1.09665 - 0.00103(tricep) - 0.00056(subscapular) - 0.00054(abdominal)
  const bodyDensity =
    1.09665 - 0.00103 * tricep - 0.00056 * subscapular - 0.00054 * abdominal;

  // Siri equation
  const bodyFat = 495 / bodyDensity - 450;
  return Math.max(0, Math.min(100, bodyFat));
}

/**
 * Forsyth Body Fat Calculation
 * Demonstrated equivalence for females (SEE=3.28kg)
 * Uses: subscapular, abdominal, tricep, midaxillary
 */
export function forsyth(skinfolds: SkinfoldMeasurements): number | null {
  const { subscapular, abdominal, tricep } = skinfolds;
  const midaxillary = getMidaxillary(skinfolds);

  if (
    subscapular === undefined ||
    abdominal === undefined ||
    tricep === undefined ||
    midaxillary === undefined
  ) {
    return null;
  }

  // Db = 1.10647 - 0.00162(subscapular) - 0.00144(abdominal) - 0.00077(tricep) + 0.00071(midaxillary)
  const bodyDensity =
    1.10647 -
    0.00162 * subscapular -
    0.00144 * abdominal -
    0.00077 * tricep +
    0.00071 * midaxillary;

  // Siri equation
  const bodyFat = 495 / bodyDensity - 450;
  return Math.max(0, Math.min(100, bodyFat));
}

/**
 * Thorland Body Fat Calculation
 * Did not differ from criterion for males
 * Uses: tricep, subscapular, midaxillary
 */
export function thorland(skinfolds: SkinfoldMeasurements): number | null {
  const { tricep, subscapular } = skinfolds;
  const midaxillary = getMidaxillary(skinfolds);

  if (
    tricep === undefined ||
    subscapular === undefined ||
    midaxillary === undefined
  ) {
    return null;
  }

  const sum = tricep + subscapular + midaxillary;
  const sumSquared = sum * sum;

  // Db = 1.1136 - 0.00154(sum) + 0.00000516(sum)²
  const bodyDensity = 1.1136 - 0.00154 * sum + 0.00000516 * sumSquared;

  // Siri equation
  const bodyFat = 495 / bodyDensity - 450;
  return Math.max(0, Math.min(100, bodyFat));
}

/**
 * Validation study coefficients by sex
 * Based on Frontiers in Sports and Active Living (2023)
 */
export const FEMALE_COEFFICIENTS = {
  evans7: 0.35,
  evans3: 0.25,
  jp3: 0.25,
  forsyth: 0.1,
  dw: 0.05,
  jp7: 0,
  lohman: 0,
  katch: 0,
  thorland: 0,
  navy: 0.2, // Average of non-zero coefficients
} as const;

export const MALE_COEFFICIENTS = {
  evans3: 0.4,
  dw: 0.2,
  lohman: 0.2,
  evans7: 0.1,
  katch: 0.05,
  thorland: 0.05,
  jp3: 0,
  jp7: 0,
  forsyth: 0,
  navy: 0.2, // Average of non-zero coefficients
} as const;

export interface BodyFatResults {
  weighted: number | null;
  navy: number | null;
  jp7: number | null;
  jp3: number | null;
  dw: number | null;
  evans3: number | null;
  evans7: number | null;
  lohmanResult: number | null;
  katchResult: number | null;
  forsythResult: number | null;
  thorlandResult: number | null;
}

/**
 * Calculate weighted average body fat from all available methods
 * Uses validation study coefficients for sex-specific weighting
 * Calculation: Sum(result × coefficient) / Sum(coefficients for non-null results)
 */
export function weightedAverageBodyFat(
  skinfolds: SkinfoldMeasurements,
  circumferences: Partial<CircumferenceMeasurements>,
  age: number,
  sex: Sex,
  race?: Race,
): BodyFatResults {
  // Calculate all individual methods
  const navy =
    circumferences.waist !== undefined &&
    circumferences.neck !== undefined &&
    circumferences.height !== undefined
      ? navyBodyFat(circumferences as CircumferenceMeasurements, sex)
      : null;

  const jp7 = jacksonPollock7(skinfolds, age, sex);
  const jp3 = jacksonPollock3(skinfolds, age, sex);
  const dw = durninWomersley(skinfolds, age, sex);
  const evans3Result = evans3Site(skinfolds, sex, race);
  const evans7Result = evans7Site(skinfolds, sex, race);
  const lohmanResult = lohman(skinfolds);
  const katchResult = katch(skinfolds);
  const forsythResult = forsyth(skinfolds);
  const thorlandResult = thorland(skinfolds);

  // Get coefficients based on sex
  const coefficients =
    sex === "female" ? FEMALE_COEFFICIENTS : MALE_COEFFICIENTS;

  // Build results map with their coefficients
  const results: Array<{ value: number | null; coefficient: number }> = [
    { value: navy, coefficient: coefficients.navy },
    { value: jp7, coefficient: coefficients.jp7 },
    { value: jp3, coefficient: coefficients.jp3 },
    { value: dw, coefficient: coefficients.dw },
    { value: evans3Result, coefficient: coefficients.evans3 },
    { value: evans7Result, coefficient: coefficients.evans7 },
    { value: lohmanResult, coefficient: coefficients.lohman },
    { value: katchResult, coefficient: coefficients.katch },
    { value: forsythResult, coefficient: coefficients.forsyth },
    { value: thorlandResult, coefficient: coefficients.thorland },
  ];

  // Calculate weighted average: Sum(result × coefficient) / Sum(coefficients for non-null results)
  let weightedSum = 0;
  let coefficientSum = 0;

  for (const { value, coefficient } of results) {
    if (value !== null && coefficient > 0) {
      weightedSum += value * coefficient;
      coefficientSum += coefficient;
    }
  }

  const weighted = coefficientSum > 0 ? weightedSum / coefficientSum : null;

  return {
    weighted,
    navy,
    jp7,
    jp3,
    dw,
    evans3: evans3Result,
    evans7: evans7Result,
    lohmanResult,
    katchResult,
    forsythResult,
    thorlandResult,
  };
}

/**
 * @deprecated Use weightedAverageBodyFat instead
 * Calculate simple average body fat from all available methods (legacy)
 */
export function averageBodyFat(
  skinfolds: SkinfoldMeasurements,
  circumferences: Partial<CircumferenceMeasurements>,
  age: number,
  sex: Sex,
): {
  average: number | null;
  navy: number | null;
  jp7: number | null;
  jp3: number | null;
  dw: number | null;
} {
  const navy =
    circumferences.waist !== undefined &&
    circumferences.neck !== undefined &&
    circumferences.height !== undefined
      ? navyBodyFat(circumferences as CircumferenceMeasurements, sex)
      : null;

  const jp7 = jacksonPollock7(skinfolds, age, sex);
  const jp3 = jacksonPollock3(skinfolds, age, sex);
  const dw = durninWomersley(skinfolds, age, sex);

  const values = [navy, jp7, jp3, dw].filter((v): v is number => v !== null);
  const average =
    values.length > 0
      ? values.reduce((a, b) => a + b, 0) / values.length
      : null;

  return { average, navy, jp7, jp3, dw };
}
