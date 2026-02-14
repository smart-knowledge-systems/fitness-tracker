/**
 * Goal formatting utilities.
 * Extracted from GoalCard component for reusability.
 */

import { formatTime } from "@/lib/calculations/fitness";
import {
  convertWeightForDisplay,
  convertLengthForDisplay,
  type WeightUnit,
  type LengthUnit,
} from "@/lib/unitConversion";
import type { ProjectionResult } from "@/lib/calculations/goalProjections";

export interface FormatContext {
  metric: string;
  weightUnit: WeightUnit;
  lengthUnit: LengthUnit;
}

/** Metrics whose values are time durations in seconds. */
const TIME_METRICS = new Set(["time5k", "time1k"]);
/** Metrics whose values are stored in kg. */
const WEIGHT_METRICS = new Set(["weight", "leanMass"]);
/** Metrics whose values are stored in cm. */
const LENGTH_METRICS = new Set(["waistCirc", "upperArmCirc", "chestCirc"]);

/**
 * Convert a daily rate to a weekly rate, applying unit conversion when needed.
 */
function toWeeklyRate(
  dailyRate: number,
  metric: string,
  context: FormatContext,
): { value: number; unit: string } {
  if (TIME_METRICS.has(metric)) {
    return { value: dailyRate * 7, unit: "s/week" };
  }
  if (WEIGHT_METRICS.has(metric)) {
    const converted = convertWeightForDisplay(
      dailyRate * 7,
      context.weightUnit,
    );
    return { value: converted, unit: `${context.weightUnit}/week` };
  }
  if (LENGTH_METRICS.has(metric)) {
    const converted = convertLengthForDisplay(
      dailyRate * 7,
      context.lengthUnit,
    );
    return { value: converted, unit: `${context.lengthUnit}/week` };
  }
  if (metric === "bodyFat") {
    return { value: dailyRate * 7, unit: "%/week" };
  }
  if (metric === "vo2max") {
    return { value: dailyRate * 7, unit: "mL/kg/min per week" };
  }
  if (metric === "ffmi") {
    return { value: dailyRate * 7, unit: "/week" };
  }
  return { value: dailyRate, unit: "/day" };
}

/**
 * Format a goal value based on metric type.
 */
export function formatGoalValue(value: number, context: FormatContext): string {
  const { metric, weightUnit, lengthUnit } = context;

  if (TIME_METRICS.has(metric)) {
    return formatTime(value);
  }
  if (WEIGHT_METRICS.has(metric)) {
    const converted = convertWeightForDisplay(value, weightUnit);
    return `${converted.toFixed(1)} ${weightUnit}`;
  }
  if (LENGTH_METRICS.has(metric)) {
    const converted = convertLengthForDisplay(value, lengthUnit);
    return `${converted.toFixed(1)} ${lengthUnit}`;
  }
  if (metric === "bodyFat") {
    return `${value.toFixed(1)}%`;
  }
  if (metric === "vo2max" || metric === "ffmi") {
    return `${value.toFixed(1)}`;
  }
  return `${value}`;
}

/**
 * Format rate (change per day) based on metric type.
 */
export function formatGoalRate(rate: number, context: FormatContext): string {
  const absRate = Math.abs(rate);
  const sign = rate >= 0 ? "+" : "-";

  const weekly = toWeeklyRate(absRate, context.metric, context);

  if (TIME_METRICS.has(context.metric)) {
    return `${sign}${weekly.value.toFixed(0)}${weekly.unit}`;
  }
  return `${sign}${weekly.value.toFixed(2)} ${weekly.unit}`;
}

/**
 * Format projected date for goal completion.
 */
export function formatProjectedDate(
  daysRemaining: number,
  projectedDate: Date,
): string {
  if (daysRemaining === Infinity) {
    return "N/A";
  }
  if (daysRemaining <= 0) {
    return "Now";
  }
  if (daysRemaining > 365) {
    const years = Math.round(daysRemaining / 365);
    return `~${years} year${years > 1 ? "s" : ""}`;
  }
  return projectedDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year:
      projectedDate.getFullYear() !== new Date().getFullYear()
        ? "numeric"
        : undefined,
  });
}

export type StatusVariant = "secondary" | "outline" | "default";
export type StatusColor = "green" | "yellow" | "red" | null;

export interface StatusConfig {
  variant: StatusVariant;
  label: string;
  colorClass?: string;
}

/**
 * Determine goal status badge configuration.
 */
export function getGoalStatus(
  goal: { completed: boolean; targetDate?: number },
  projection: ProjectionResult | null,
): StatusConfig {
  if (goal.completed) {
    return { variant: "secondary", label: "Completed" };
  }
  if (!projection) {
    return { variant: "outline", label: "Insufficient data" };
  }
  if (projection.progressPercent >= 100) {
    return {
      variant: "default",
      label: "Goal reached!",
      colorClass: "bg-green-500",
    };
  }
  switch (projection.rateDirection) {
    case "improving": {
      // goal.targetDate is a timestamp (number), so compare directly
      const projectedTimestamp = projection.projectedDate.getTime();
      if (goal.targetDate && projectedTimestamp > goal.targetDate) {
        return { variant: "outline", label: "Improving" };
      }
      return {
        variant: "default",
        label: "On track",
        colorClass: "bg-green-500",
      };
    }
    case "stalled":
      return {
        variant: "default",
        label: "Stalled",
        colorClass: "bg-yellow-500",
      };
    case "worsening":
      return {
        variant: "default",
        label: "Off track",
        colorClass: "bg-red-500",
      };
  }
}

export type TrendDirection = "up" | "down" | "flat";

export interface TrendConfig {
  direction: TrendDirection;
  colorClass: string;
}

/**
 * Determine trend icon configuration.
 * Direction based on rate sign, color based on progress.
 */
export function getTrendConfig(
  projection: ProjectionResult | null,
): TrendConfig {
  if (!projection || projection.rateDirection === "stalled") {
    return { direction: "flat", colorClass: "text-muted-foreground" };
  }

  const colorClass =
    projection.rateDirection === "improving"
      ? "text-green-500"
      : "text-yellow-500";
  const direction: TrendDirection = projection.rate > 0 ? "up" : "down";

  return { direction, colorClass };
}
