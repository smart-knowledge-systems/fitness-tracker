"use client";

import { useMemo } from "react";
import type { Doc } from "@/convex/_generated/dataModel";
import type { ChartConfig } from "@/components/ui/chart";
import type { WeightUnit } from "@/lib/unitConversion";
import {
  transformMeasurementsToChartData,
  calculateWeightYMin,
  type ChartDataPoint,
} from "@/lib/calculations/chartData";

type Measurement = Doc<"measurements">;
type UserProfile = Doc<"userProfiles">;

export interface UseProgressChartDataReturn {
  chartData: ChartDataPoint[];
  chartConfig: ChartConfig;
  weightYMin: number | undefined;
  isLoading: boolean;
}

/**
 * Hook for preparing progress chart data.
 * Combines chart data transformation with dynamic configuration.
 */
export function useProgressChartData(
  measurements: Measurement[] | undefined,
  profile: UserProfile | null | undefined,
  weightUnit: WeightUnit,
): UseProgressChartDataReturn {
  const isLoading = measurements === undefined || profile === undefined;

  // Dynamic chart config based on unit preferences
  const chartConfig: ChartConfig = useMemo(
    () => ({
      weight: {
        label: `Weight (${weightUnit})`,
        color: "var(--chart-1)",
      },
      bodyFat: {
        label: "Body Fat %",
        color: "var(--chart-2)",
      },
      ffmi: {
        label: "FFMI",
        color: "var(--chart-3)",
      },
      vo2max: {
        label: "VO2max",
        color: "var(--chart-4)",
      },
    }),
    [weightUnit],
  );

  // Transform measurements to chart data
  const chartData = useMemo(() => {
    if (!measurements) return [];
    return transformMeasurementsToChartData(measurements, profile, weightUnit);
  }, [measurements, profile, weightUnit]);

  // Calculate smart Y-axis minimum for weight chart
  const weightYMin = useMemo(() => {
    if (!profile) return undefined;
    return calculateWeightYMin(profile, chartData, weightUnit);
  }, [profile, chartData, weightUnit]);

  return {
    chartData,
    chartConfig,
    weightYMin,
    isLoading,
  };
}
