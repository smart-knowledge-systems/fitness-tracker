/**
 * Chart data transformation utilities.
 * Extracted from Progress page for reusability.
 */

import type { Doc } from "@/convex/_generated/dataModel";
import {
  averageBodyFat,
  calculateFFMI,
  calculateLeanMass,
} from "@/lib/calculations";
import { convertWeightForDisplay, type WeightUnit } from "@/lib/unitConversion";
import { calculateAgeAtDate } from "./ageUtils";

export interface ChartDataPoint {
  date: number;
  weight: number | null;
  bodyFat: number | null;
  ffmi: number | null;
  vo2max: number | null;
}

type Measurement = Doc<"measurements">;
type UserProfile = Doc<"userProfiles">;

/**
 * Transform measurements into chart-ready data points.
 * Calculates derived metrics (body fat, FFMI) for each measurement.
 */
export function transformMeasurementsToChartData(
  measurements: Measurement[],
  profile: UserProfile | null | undefined,
  weightUnit: WeightUnit,
): ChartDataPoint[] {
  return measurements
    .slice()
    .reverse()
    .map((m) => {
      let bodyFatValue: number | null = null;
      let ffmiValue: number | null = null;

      if (profile) {
        const age = profile.birthDate
          ? calculateAgeAtDate(profile.birthDate, m.date)
          : 30;

        const bf = averageBodyFat(
          {
            chest: m.skinfoldChest,
            axilla: m.skinfoldAxilla,
            tricep: m.skinfoldTricep,
            subscapular: m.skinfoldSubscapular,
            abdominal: m.skinfoldAbdominal,
            suprailiac: m.skinfoldSuprailiac,
            thigh: m.skinfoldThigh,
            bicep: m.skinfoldBicep,
          },
          {
            waist: m.waistCirc,
            neck: m.neckCirc,
            hip: m.hipCirc,
            height: m.height ?? profile.height,
          },
          age,
          profile.sex,
        );

        bodyFatValue = bf.average;

        if (m.weight && bodyFatValue) {
          const ffmiResult = calculateFFMI(
            m.weight,
            m.height ?? profile.height,
            bodyFatValue,
          );
          ffmiValue = ffmiResult.ffmi;
        }
      }

      return {
        date: m.date,
        weight: m.weight ? convertWeightForDisplay(m.weight, weightUnit) : null,
        bodyFat: bodyFatValue ? Math.round(bodyFatValue * 10) / 10 : null,
        ffmi: ffmiValue,
        vo2max: m.vo2max ?? null,
      };
    });
}

/**
 * Calculate smart Y-axis minimum for weight chart.
 * Uses BMI floor or lean mass estimate, whichever is higher.
 */
export function calculateWeightYMin(
  profile: UserProfile | null | undefined,
  chartData: ChartDataPoint[],
  weightUnit: WeightUnit,
): number | undefined {
  if (!profile?.height) return undefined;

  const heightM = profile.height / 100;
  const healthyBMIMinKg = 18.5 * heightM * heightM; // kg at BMI 18.5

  // Get most recent lean mass estimate (if body fat data available)
  const latestWithBF = chartData.find((d) => d.bodyFat !== null);
  const latestWeight = chartData[chartData.length - 1]?.weight ?? null;

  // Convert back to kg for calculation (latestWeight is in display units)
  const latestWeightKg = latestWeight
    ? weightUnit === "lbs"
      ? latestWeight / 2.20462
      : latestWeight
    : null;

  const estLeanMassKg =
    latestWithBF && latestWeightKg
      ? calculateLeanMass(latestWeightKg, latestWithBF.bodyFat!)
      : null;

  // Use max of healthy BMI floor or lean mass estimate (in kg)
  const floorKg = estLeanMassKg
    ? Math.max(healthyBMIMinKg, estLeanMassKg)
    : healthyBMIMinKg;

  // Convert to display unit and add buffer
  const floorDisplay = convertWeightForDisplay(floorKg, weightUnit);
  return Math.floor(floorDisplay - 2);
}
