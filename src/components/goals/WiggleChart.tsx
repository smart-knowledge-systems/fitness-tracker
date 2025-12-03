"use client";

import { useState } from "react";
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
import { METRIC_CONFIG } from "@/lib/calculations/goalProjections";
import { formatShortDate, formatDateWithYear } from "@/lib/dateUtils";
import { useWiggleChartData } from "@/hooks/useWiggleChartData";
import type { Doc } from "@/convex/_generated/dataModel";

// Chart colors for different goals - exported for use by GoalCard and hook
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

export function WiggleChart({
  goals,
  measurements,
  profile,
  weeks,
}: WiggleChartProps) {
  const [selectedWeeks, setSelectedWeeks] = useState<number>(4);
  const activeWeeks = weeks ?? selectedWeeks;

  const {
    chartData,
    goalColorMap,
    chartConfig,
    hiddenGoalIds,
    yDomain,
    availableWeekOptions,
    activeGoals,
  } = useWiggleChartData({
    goals,
    measurements,
    profile,
    weeks: activeWeeks,
  });

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
              tickFormatter={formatShortDate}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              type="number"
              scale="time"
              domain={yDomain}
              tickFormatter={formatDateWithYear}
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
                      `Est. ${formatDateWithYear(value as number)}`,
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
