/**
 * Goal metric configuration.
 * Extracted from goals page for reusability.
 */

import {
  convertWeightForStorage,
  convertLengthForStorage,
  type WeightUnit,
  type LengthUnit,
} from "@/lib/unitConversion";
import type { GoalDirection } from "@/lib/calculations/goalProjections";

export interface MetricOption {
  value: string;
  label: string;
  unit: string;
  direction: GoalDirection;
}

/**
 * Build dynamic metric options based on unit preferences.
 */
export function buildMetricOptions(
  weightUnit: WeightUnit,
  lengthUnit: LengthUnit,
): MetricOption[] {
  return [
    {
      value: "weight",
      label: `Weight (${weightUnit})`,
      unit: weightUnit,
      direction: "decrease",
    },
    {
      value: "bodyFat",
      label: "Body Fat (%)",
      unit: "%",
      direction: "decrease",
    },
    {
      value: "vo2max",
      label: "VO2max",
      unit: "mL/kg/min",
      direction: "increase",
    },
    {
      value: "time5k",
      label: "5k Time (seconds)",
      unit: "s",
      direction: "decrease",
    },
    {
      value: "time1k",
      label: "1k Time (seconds)",
      unit: "s",
      direction: "decrease",
    },
    {
      value: "leanMass",
      label: `Lean Mass (${weightUnit})`,
      unit: weightUnit,
      direction: "increase",
    },
    {
      value: "upperArmCirc",
      label: `Upper Arm (${lengthUnit})`,
      unit: lengthUnit,
      direction: "increase",
    },
    {
      value: "chestCirc",
      label: `Chest (${lengthUnit})`,
      unit: lengthUnit,
      direction: "increase",
    },
    {
      value: "waistCirc",
      label: `Waist (${lengthUnit})`,
      unit: lengthUnit,
      direction: "decrease",
    },
  ];
}

export interface BidirectionalConfig {
  increase: string;
  decrease: string;
}

/**
 * Configuration for metrics that support bidirectional goals.
 */
export const BIDIRECTIONAL_METRICS: Record<string, BidirectionalConfig> = {
  weight: { increase: "Gain weight", decrease: "Lose weight" },
  bodyFat: { increase: "Increase body fat", decrease: "Reduce body fat" },
  leanMass: { increase: "Gain lean mass", decrease: "Reduce lean mass" },
  upperArmCirc: { increase: "Increase size", decrease: "Decrease size" },
  chestCirc: { increase: "Increase size", decrease: "Decrease size" },
};

/**
 * Check if a metric supports bidirectional goals.
 */
export function isBidirectionalMetric(metric: string): boolean {
  return metric in BIDIRECTIONAL_METRICS;
}

/**
 * Get default direction for a metric.
 */
export function getDefaultDirection(
  metricOptions: MetricOption[],
  metric: string,
): GoalDirection {
  const option = metricOptions.find((m) => m.value === metric);
  return option?.direction ?? "decrease";
}

const WEIGHT_METRICS = ["weight", "leanMass"];
const LENGTH_METRICS = ["upperArmCirc", "chestCirc", "waistCirc"];

/**
 * Convert goal value to metric units for storage.
 */
export function convertGoalValueForStorage(
  value: number,
  metricType: string,
  weightUnit: WeightUnit,
  lengthUnit: LengthUnit,
): number {
  if (WEIGHT_METRICS.includes(metricType)) {
    return convertWeightForStorage(value, weightUnit);
  }
  if (LENGTH_METRICS.includes(metricType)) {
    return convertLengthForStorage(value, lengthUnit);
  }
  return value; // No conversion needed for %, seconds, VO2max, FFMI
}
