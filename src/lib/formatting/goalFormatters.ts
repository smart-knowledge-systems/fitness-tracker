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

/**
 * Format a goal value based on metric type.
 */
export function formatGoalValue(value: number, context: FormatContext): string {
  const { metric, weightUnit, lengthUnit } = context;

  if (metric === "time5k" || metric === "time1k") {
    return formatTime(value);
  }
  if (metric === "weight" || metric === "leanMass") {
    const converted = convertWeightForDisplay(value, weightUnit);
    return `${converted.toFixed(1)} ${weightUnit}`;
  }
  if (
    metric === "waistCirc" ||
    metric === "upperArmCirc" ||
    metric === "chestCirc"
  ) {
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
  const { metric, weightUnit } = context;
  const absRate = Math.abs(rate);
  const sign = rate >= 0 ? "+" : "-";

  if (metric === "time5k" || metric === "time1k") {
    const secsPerWeek = absRate * 7;
    return `${sign}${secsPerWeek.toFixed(0)}s/week`;
  }
  if (metric === "weight" || metric === "leanMass") {
    const weeklyRate = absRate * 7;
    const converted = weightUnit === "lbs" ? weeklyRate * 2.20462 : weeklyRate;
    return `${sign}${converted.toFixed(2)} ${weightUnit}/week`;
  }
  if (metric === "bodyFat") {
    const weeklyRate = absRate * 7;
    return `${sign}${weeklyRate.toFixed(2)}%/week`;
  }
  // Default: show daily rate
  return `${sign}${absRate.toFixed(2)}/day`;
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
    case "improving":
      if (
        goal.targetDate &&
        projection.projectedDate.getTime() > goal.targetDate
      ) {
        return { variant: "outline", label: "Improving" };
      }
      return {
        variant: "default",
        label: "On track",
        colorClass: "bg-green-500",
      };
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

  // Icon based on numerical direction (rate > 0 means value increasing)
  if (projection.rate > 0) {
    return { direction: "up", colorClass };
  }
  return { direction: "down", colorClass };
}
