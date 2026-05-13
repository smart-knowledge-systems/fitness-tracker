"use client";

import { useMemo, type ReactNode } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { type WeightUnit } from "@/lib/unitConversion";
import {
  useDateRangeFilter,
  calculateAllRangeDomain,
} from "@/hooks/useDateRangeFilter";
import { useProgressChartData } from "@/hooks/useProgressChartData";
import type { ChartConfig } from "@/components/ui/chart";
import type { ChartDataPoint } from "@/lib/calculations/chartData";

const formatDate = (timestamp: number) =>
  new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

const formatDateFull = (timestamp: number) =>
  new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

function tooltipLabelFormatter(
  _label: ReactNode,
  payload: readonly { payload?: { date?: number } }[],
) {
  return payload?.[0]?.payload?.date
    ? formatDateFull(payload[0].payload.date)
    : "";
}

const roundTick = (value: number) => String(Math.round(value));

/** Reusable chart card — eliminates the 4x duplication of chart boilerplate. */
function ProgressChart({
  title,
  description,
  dataKey,
  chartData,
  chartConfig,
  domain,
  yDomain,
}: {
  title: string;
  description: string;
  dataKey: string;
  chartData: ChartDataPoint[];
  chartConfig: ChartConfig;
  domain: [number, number];
  yDomain: [string | number, string | number];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              type="number"
              scale="time"
              domain={domain}
              tickFormatter={formatDate}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              domain={yDomain}
              tickFormatter={roundTick}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent labelFormatter={tooltipLabelFormatter} />
              }
            />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={`var(--color-${dataKey})`}
              strokeWidth={2}
              dot={{ r: 4 }}
              connectNulls
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export default function ProgressPage() {
  const measurements = useQuery(api.measurements.list, { limit: 100 });
  const userProfile = useQuery(api.userProfile.get);

  // Unit preferences
  const weightUnit: WeightUnit = userProfile?.weightUnit ?? "kg";

  // Date range filtering (URL-synced)
  const {
    dateRange,
    customStart,
    customEnd,
    setDateRange,
    setCustomStart,
    setCustomEnd,
    domainStart: hookDomainStart,
    domainEnd: hookDomainEnd,
    filterMeasurements,
  } = useDateRangeFilter();

  // Filter measurements
  const filteredMeasurements = measurements
    ? filterMeasurements(measurements)
    : [];

  // Calculate domain - use measurements-based domain for "all" range
  const { domainStart, domainEnd } = useMemo(() => {
    if (dateRange === "all" && measurements?.length) {
      return calculateAllRangeDomain(measurements);
    }
    return { domainStart: hookDomainStart, domainEnd: hookDomainEnd };
  }, [dateRange, measurements, hookDomainStart, hookDomainEnd]);

  // Stable domain tuple for chart XAxis
  const domain = useMemo(
    () => [domainStart, domainEnd] as [number, number],
    [domainStart, domainEnd],
  );

  // Chart data transformation
  const { chartData, chartConfig, weightYMin, isLoading } =
    useProgressChartData(filteredMeasurements, userProfile, weightUnit);

  if (isLoading || measurements === undefined) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Progress</h1>
          <p className="text-muted-foreground">Track your fitness trends</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Progress</h1>
          <p className="text-muted-foreground">Track your fitness trends</p>
        </div>
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              No measurements yet. Add some measurements to see your progress
              charts.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Progress</h1>
        <p className="text-muted-foreground">
          Track your fitness trends over time
        </p>
      </div>

      {/* Date Range Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {(["30d", "60d", "90d", "1y", "all"] as const).map((range) => (
          <Badge
            key={range}
            variant={dateRange === range ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setDateRange(range)}
          >
            {range === "all" ? "All" : range}
          </Badge>
        ))}
        <Popover>
          <PopoverTrigger asChild>
            <Badge
              variant={dateRange === "custom" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setDateRange("custom")}
            >
              {dateRange === "custom" && customStart && customEnd
                ? `${formatDate(customStart.getTime())} - ${formatDate(customEnd.getTime())}`
                : "Custom"}
            </Badge>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-4" align="start">
            <div className="flex gap-4">
              <div>
                <p className="mb-2 text-sm font-medium">Start Date</p>
                <Calendar
                  mode="single"
                  selected={customStart}
                  onSelect={setCustomStart}
                  disabled={(date) => (customEnd ? date > customEnd : false)}
                />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">End Date</p>
                <Calendar
                  mode="single"
                  selected={customEnd}
                  onSelect={setCustomEnd}
                  disabled={(date) =>
                    customStart ? date < customStart : false
                  }
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ProgressChart
          title="Weight"
          description="Body weight over time"
          dataKey="weight"
          chartData={chartData}
          chartConfig={chartConfig}
          domain={domain}
          yDomain={[weightYMin ?? "dataMin - 2", "dataMax + 2"]}
        />
        <ProgressChart
          title="Body Fat %"
          description="Estimated body fat percentage"
          dataKey="bodyFat"
          chartData={chartData}
          chartConfig={chartConfig}
          domain={domain}
          yDomain={["dataMin - 2", "dataMax + 2"]}
        />
        <ProgressChart
          title="FFMI"
          description="Fat-Free Mass Index"
          dataKey="ffmi"
          chartData={chartData}
          chartConfig={chartConfig}
          domain={domain}
          yDomain={["dataMin - 1", "dataMax + 1"]}
        />
        <ProgressChart
          title="VO2max"
          description="Cardiovascular fitness"
          dataKey="vo2max"
          chartData={chartData}
          chartConfig={chartConfig}
          domain={domain}
          yDomain={["dataMin - 5", "dataMax + 5"]}
        />
      </div>
    </div>
  );
}
