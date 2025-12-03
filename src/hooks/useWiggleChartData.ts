"use client";

import { useMemo, useState } from "react";
import { ChartConfig } from "@/components/ui/chart";
import {
  buildWiggleChartData,
  METRIC_CONFIG,
  type WiggleDataPoint,
} from "@/lib/calculations/goalProjections";
import type { Doc } from "@/convex/_generated/dataModel";
import { GOAL_COLORS } from "@/components/goals/WiggleChart";

const WEEK_OPTIONS = [4, 8, 16] as const;

export interface ChartDataPoint {
  snapshotDate: number;
  [goalId: string]: number;
}

export interface UseWiggleChartDataOptions {
  goals: Doc<"goals">[];
  measurements: Doc<"measurements">[];
  profile?: Doc<"userProfiles"> | null;
  weeks: number;
}

export interface UseWiggleChartDataResult {
  chartData: ChartDataPoint[];
  goalColorMap: Record<string, string>;
  chartConfig: ChartConfig;
  hiddenGoalIds: Set<string>;
  yDomain: [number, number];
  availableWeekOptions: number[];
  activeGoals: Doc<"goals">[];
}

export function useWiggleChartData({
  goals,
  measurements,
  profile,
  weeks,
}: UseWiggleChartDataOptions): UseWiggleChartDataResult {
  // Stable reference time for calculations (doesn't change on re-renders)
  const [now] = useState(() => Date.now());

  // Filter to active (non-completed) goals
  const activeGoals = useMemo(() => goals.filter((g) => !g.completed), [goals]);

  // Build wiggle data for each goal
  const { chartData, goalColorMap, chartConfig } = useMemo(() => {
    const goalColorMap: Record<string, string> = {};
    const chartConfig: ChartConfig = {};
    const wiggleDataByGoal: Record<string, WiggleDataPoint[]> = {};

    // Generate data for each active goal
    activeGoals.forEach((goal, index) => {
      const color = GOAL_COLORS[index % GOAL_COLORS.length];
      goalColorMap[goal._id] = color;

      const label = METRIC_CONFIG[goal.metric]?.label ?? goal.metric;
      chartConfig[goal._id] = {
        label,
        color,
      };

      const wiggleData = buildWiggleChartData(
        measurements,
        goal.metric,
        goal.targetValue,
        profile,
        weeks,
        goal.direction,
      );
      wiggleDataByGoal[goal._id] = wiggleData;
    });

    // Merge all wiggle data into chart data points
    // Each point has snapshotDate and projected dates for each goal
    const allSnapshotDates = new Set<number>();
    Object.values(wiggleDataByGoal).forEach((data) => {
      data.forEach((point) => allSnapshotDates.add(point.snapshotDate));
    });

    const sortedDates = Array.from(allSnapshotDates).sort((a, b) => a - b);

    const chartData: ChartDataPoint[] = sortedDates.map((snapshotDate) => {
      const point: ChartDataPoint = { snapshotDate };

      Object.entries(wiggleDataByGoal).forEach(([goalId, data]) => {
        const match = data.find((d) => d.snapshotDate === snapshotDate);
        if (match) {
          point[goalId] = match.projectedDate;
        }
      });

      return point;
    });

    return { chartData, goalColorMap, chartConfig };
  }, [activeGoals, measurements, profile, weeks]);

  // Build set of hidden goal IDs from goal data
  const hiddenGoalIds = useMemo(() => {
    const hidden = new Set<string>();
    goals.forEach((goal) => {
      if (goal.isVisibleOnChart === false) {
        hidden.add(goal._id);
      }
    });
    return hidden;
  }, [goals]);

  // Calculate Y-axis domain (only for visible goals)
  const yDomain = useMemo((): [number, number] => {
    const allProjectedDates: number[] = [];
    chartData.forEach((point) => {
      Object.entries(point).forEach(([key, value]) => {
        if (
          key !== "snapshotDate" &&
          typeof value === "number" &&
          !hiddenGoalIds.has(key)
        ) {
          allProjectedDates.push(value);
        }
      });
    });

    // Also include target dates (only for visible goals)
    activeGoals
      .filter((g) => g.targetDate && !hiddenGoalIds.has(g._id))
      .forEach((g) => {
        if (g.targetDate) allProjectedDates.push(g.targetDate);
      });

    if (allProjectedDates.length === 0) {
      return [now, now + 90 * 24 * 60 * 60 * 1000]; // 90 days from now
    }

    const minDate = Math.min(...allProjectedDates);
    const maxDate = Math.max(...allProjectedDates);
    const padding = (maxDate - minDate) * 0.1 || 30 * 24 * 60 * 60 * 1000;

    return [minDate - padding, maxDate + padding];
  }, [chartData, activeGoals, now, hiddenGoalIds]);

  // Calculate which week options have enough data
  const availableWeekOptions = useMemo(() => {
    if (measurements.length === 0) return [4];

    const measurementDates = measurements.map((m) => m.date);
    const oldestDate = Math.min(...measurementDates);
    const dataSpanWeeks = (now - oldestDate) / (7 * 24 * 60 * 60 * 1000);

    return WEEK_OPTIONS.filter((w) => dataSpanWeeks >= w - 1);
  }, [measurements, now]);

  return {
    chartData,
    goalColorMap,
    chartConfig,
    hiddenGoalIds,
    yDomain,
    availableWeekOptions,
    activeGoals,
  };
}
