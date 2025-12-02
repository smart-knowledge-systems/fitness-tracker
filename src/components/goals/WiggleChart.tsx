"use client";

import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  Legend,
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  buildWiggleChartData,
  METRIC_CONFIG,
  type WiggleDataPoint,
} from "@/lib/calculations/goalProjections";
import type { Doc } from "@/convex/_generated/dataModel";

// Chart colors for different goals - exported for use by GoalCard
export const GOAL_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
] as const;

export function getGoalColor(index: number): string {
  return GOAL_COLORS[index % GOAL_COLORS.length];
}

interface WiggleChartProps {
  goals: Doc<"goals">[];
  measurements: Doc<"measurements">[];
  profile?: Doc<"userProfiles"> | null;
  weeks?: number;
}

interface ChartDataPoint {
  snapshotDate: number;
  [goalId: string]: number;
}

const WEEK_OPTIONS = [4, 8, 16] as const;

export function WiggleChart({
  goals,
  measurements,
  profile,
  weeks,
}: WiggleChartProps) {
  // Stable reference time for calculations (doesn't change on re-renders)
  const [now] = useState(() => Date.now());
  const [selectedWeeks, setSelectedWeeks] = useState<number>(4);
  const activeWeeks = weeks ?? selectedWeeks;

  // Build wiggle data for each goal
  const { chartData, goalColorMap, chartConfig } = useMemo(() => {
    const goalColorMap: Record<string, string> = {};
    const chartConfig: ChartConfig = {};
    const wiggleDataByGoal: Record<string, WiggleDataPoint[]> = {};

    // Generate data for each active goal
    goals
      .filter((g) => !g.completed)
      .forEach((goal, index) => {
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
          activeWeeks,
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
  }, [goals, measurements, profile, activeWeeks]);

  // Format dates for display
  const formatSnapshotDate = (timestamp: number) =>
    new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

  const formatProjectedDate = (timestamp: number) =>
    new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "2-digit",
    });

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
  const yDomain = useMemo(() => {
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
    goals
      .filter((g) => !g.completed && g.targetDate && !hiddenGoalIds.has(g._id))
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
  }, [chartData, goals, now, hiddenGoalIds]);

  const activeGoals = goals.filter((g) => !g.completed);

  // Calculate which week options have enough data
  const availableWeekOptions = useMemo(() => {
    if (measurements.length === 0) return [4];

    const measurementDates = measurements.map((m) => m.date);
    const oldestDate = Math.min(...measurementDates);
    const dataSpanWeeks = (now - oldestDate) / (7 * 24 * 60 * 60 * 1000);

    return WEEK_OPTIONS.filter((w) => dataSpanWeeks >= w - 1);
  }, [measurements, now]);

  if (activeGoals.length === 0) {
    return null;
  }

  if (chartData.length < 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Goal Projections Over Time</CardTitle>
          <CardDescription>
            How your estimated completion dates change based on progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Not enough historical data yet. Keep logging measurements to see how
            your projections change over time.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Goal Projections Over Time</CardTitle>
          {!weeks && availableWeekOptions.length > 1 && (
            <div className="flex gap-1">
              {availableWeekOptions.map((w) => (
                <Badge
                  key={w}
                  variant={activeWeeks === w ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setSelectedWeeks(w)}
                >
                  {w}w
                </Badge>
              ))}
            </div>
          )}
        </div>
        <CardDescription>
          Shows how your estimated completion dates shift based on your progress
          rate. Downward trends mean you&apos;re ahead of schedule.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-72 w-full">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="snapshotDate"
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
              tickFormatter={formatSnapshotDate}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              type="number"
              scale="time"
              domain={yDomain}
              tickFormatter={formatProjectedDate}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={60}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(_, payload) => {
                    const date = payload?.[0]?.payload?.snapshotDate;
                    return date
                      ? `As of ${new Date(date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}`
                      : "";
                  }}
                  formatter={(value, name) => {
                    const goal = goals.find((g) => g._id === name);
                    const label = goal
                      ? (METRIC_CONFIG[goal.metric]?.label ?? goal.metric)
                      : name;
                    return [
                      `Est. ${formatProjectedDate(value as number)}`,
                      label,
                    ];
                  }}
                />
              }
            />
            <Legend
              formatter={(value) => {
                const goal = goals.find((g) => g._id === value);
                return goal
                  ? (METRIC_CONFIG[goal.metric]?.label ?? goal.metric)
                  : value;
              }}
            />

            {/* Reference lines for target dates */}
            {activeGoals
              .filter((goal) => !hiddenGoalIds.has(goal._id))
              .map((goal) =>
                goal.targetDate ? (
                  <ReferenceLine
                    key={`ref-${goal._id}`}
                    y={goal.targetDate}
                    stroke={goalColorMap[goal._id]}
                    strokeDasharray="5 5"
                    strokeOpacity={0.5}
                  />
                ) : null,
              )}

            {/* Lines for each goal */}
            {activeGoals
              .filter((goal) => !hiddenGoalIds.has(goal._id))
              .map((goal) => (
                <Line
                  key={goal._id}
                  type="monotone"
                  dataKey={goal._id}
                  stroke={goalColorMap[goal._id]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls
                />
              ))}
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
