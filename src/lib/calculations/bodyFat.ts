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

export interface SkinfoldMeasurements {
  chest?: number; // mm
  axilla?: number; // mm
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
 * Calculate average body fat from all available methods
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
