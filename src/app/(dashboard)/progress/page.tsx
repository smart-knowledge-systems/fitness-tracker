"use client";

import { useMemo, useCallback, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
  ChartConfig,
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
import {
  averageBodyFat,
  calculateFFMI,
  calculateLeanMass,
} from "@/lib/calculations";
import { convertWeightForDisplay, type WeightUnit } from "@/lib/unitConversion";

type DateRangeType = "30d" | "60d" | "90d" | "1y" | "all" | "custom";

const DATE_RANGES: Record<string, number> = {
  "30d": 30,
  "60d": 60,
  "90d": 90,
  "1y": 365,
};

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

export default function ProgressPage() {
  const measurements = useQuery(api.measurements.list, { limit: 100 });
  const userProfile = useQuery(api.userProfile.get);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Unit preferences
  const weightUnit: WeightUnit = userProfile?.weightUnit ?? "kg";

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

  // Read state from URL query params (default to 60d)
  const dateRange = (searchParams.get("range") as DateRangeType) || "60d";
  const customStartParam = searchParams.get("start");
  const customEndParam = searchParams.get("end");
  const customStart = useMemo(
    () => (customStartParam ? new Date(customStartParam) : undefined),
    [customStartParam],
  );
  const customEnd = useMemo(
    () => (customEndParam ? new Date(customEndParam) : undefined),
    [customEndParam],
  );

  // Update URL when changing date range
  const setDateRange = useCallback(
    (range: DateRangeType) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("range", range);
      if (range !== "custom") {
        params.delete("start");
        params.delete("end");
      }
      router.replace(`?${params.toString()}`);
    },
    [searchParams, router],
  );

  const setCustomStart = useCallback(
    (date: Date | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("range", "custom");
      if (date) {
        params.set("start", date.toISOString().split("T")[0]);
      } else {
        params.delete("start");
      }
      router.replace(`?${params.toString()}`);
    },
    [searchParams, router],
  );

  const setCustomEnd = useCallback(
    (date: Date | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("range", "custom");
      if (date) {
        params.set("end", date.toISOString().split("T")[0]);
      } else {
        params.delete("end");
      }
      router.replace(`?${params.toString()}`);
    },
    [searchParams, router],
  );

  const isLoading = measurements === undefined || userProfile === undefined;

  // Stable reference time for date calculations (doesn't change on re-renders)
  const [now] = useState(() => Date.now());

  // Calculate domain bounds based on selected range
  const { domainStart, domainEnd } = useMemo(() => {
    if (dateRange === "all" && measurements?.length) {
      const dates = measurements.map((m) => m.date);
      return { domainStart: Math.min(...dates), domainEnd: Math.max(...dates) };
    }
    if (dateRange === "custom") {
      return {
        domainStart: customStart?.getTime() ?? now - 60 * 24 * 60 * 60 * 1000,
        domainEnd: customEnd?.getTime() ?? now,
      };
    }
    return {
      domainStart: now - (DATE_RANGES[dateRange] ?? 60) * 24 * 60 * 60 * 1000,
      domainEnd: now,
    };
  }, [dateRange, customStart, customEnd, measurements, now]);

  // Filter measurements by date range
  const filteredMeasurements = useMemo(() => {
    if (!measurements) return [];

    if (dateRange === "all") return measurements;
    if (dateRange === "custom") {
      return measurements.filter(
        (m) =>
          (!customStart || m.date >= customStart.getTime()) &&
          (!customEnd || m.date <= customEnd.getTime() + 24 * 60 * 60 * 1000),
      );
    }
    const cutoff = now - (DATE_RANGES[dateRange] ?? 60) * 24 * 60 * 60 * 1000;
    return measurements.filter((m) => m.date >= cutoff);
  }, [measurements, dateRange, customStart, customEnd, now]);

  // Process data for charts
  const chartData = filteredMeasurements
    ?.slice()
    .reverse()
    .map((m) => {
      let bodyFatValue = null;
      let ffmiValue = null;

      if (userProfile) {
        const age = userProfile.birthDate
          ? Math.floor(
              (m.date - userProfile.birthDate) / (365.25 * 24 * 60 * 60 * 1000),
            )
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
            height: m.height ?? userProfile.height,
          },
          age,
          userProfile.sex,
        );

        bodyFatValue = bf.average;

        if (m.weight && bodyFatValue) {
          const ffmiResult = calculateFFMI(
            m.weight,
            m.height ?? userProfile.height,
            bodyFatValue,
          );
          ffmiValue = ffmiResult.ffmi;
        }
      }

      return {
        date: m.date, // Keep as timestamp for time-scaled axis
        weight: m.weight ? convertWeightForDisplay(m.weight, weightUnit) : null,
        bodyFat: bodyFatValue ? Math.round(bodyFatValue * 10) / 10 : null,
        ffmi: ffmiValue,
        vo2max: m.vo2max,
      };
    });

  // Calculate smart Y-axis minimum for weight chart
  const weightYMin = useMemo(() => {
    if (!userProfile?.height) return undefined;

    const heightM = userProfile.height / 100;
    const healthyBMIMinKg = 18.5 * heightM * heightM; // kg at BMI 18.5

    // Get most recent lean mass estimate (if body fat data available)
    const latestWithBF = chartData?.find((d) => d.bodyFat !== null);
    const latestWeight = chartData?.[chartData.length - 1]?.weight;
    // Note: latestWeight is already in display units, convert back to kg for calculation
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
    return Math.floor(floorDisplay - 2); // Small buffer below
  }, [userProfile, chartData, weightUnit]);

  if (isLoading) {
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
        {/* Weight Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Weight</CardTitle>
            <CardDescription>Body weight over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-64 w-full">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  type="number"
                  scale="time"
                  domain={[domainStart, domainEnd]}
                  tickFormatter={formatDate}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  domain={[weightYMin ?? "dataMin - 2", "dataMax + 2"]}
                  tickFormatter={(value) => String(Math.round(value))}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(_, payload) =>
                        payload?.[0]?.payload?.date
                          ? formatDateFull(payload[0].payload.date)
                          : ""
                      }
                    />
                  }
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="var(--color-weight)"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  connectNulls
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Body Fat Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Body Fat %</CardTitle>
            <CardDescription>Estimated body fat percentage</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-64 w-full">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  type="number"
                  scale="time"
                  domain={[domainStart, domainEnd]}
                  tickFormatter={formatDate}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  domain={["dataMin - 2", "dataMax + 2"]}
                  tickFormatter={(value) => String(Math.round(value))}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(_, payload) =>
                        payload?.[0]?.payload?.date
                          ? formatDateFull(payload[0].payload.date)
                          : ""
                      }
                    />
                  }
                />
                <Line
                  type="monotone"
                  dataKey="bodyFat"
                  stroke="var(--color-bodyFat)"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  connectNulls
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* FFMI Chart */}
        <Card>
          <CardHeader>
            <CardTitle>FFMI</CardTitle>
            <CardDescription>Fat-Free Mass Index</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-64 w-full">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  type="number"
                  scale="time"
                  domain={[domainStart, domainEnd]}
                  tickFormatter={formatDate}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  domain={["dataMin - 1", "dataMax + 1"]}
                  tickFormatter={(value) => String(Math.round(value))}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(_, payload) =>
                        payload?.[0]?.payload?.date
                          ? formatDateFull(payload[0].payload.date)
                          : ""
                      }
                    />
                  }
                />
                <Line
                  type="monotone"
                  dataKey="ffmi"
                  stroke="var(--color-ffmi)"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  connectNulls
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* VO2max Chart */}
        <Card>
          <CardHeader>
            <CardTitle>VO2max</CardTitle>
            <CardDescription>Cardiovascular fitness</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-64 w-full">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  type="number"
                  scale="time"
                  domain={[domainStart, domainEnd]}
                  tickFormatter={formatDate}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  domain={["dataMin - 5", "dataMax + 5"]}
                  tickFormatter={(value) => String(Math.round(value))}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(_, payload) =>
                        payload?.[0]?.payload?.date
                          ? formatDateFull(payload[0].payload.date)
                          : ""
                      }
                    />
                  }
                />
                <Line
                  type="monotone"
                  dataKey="vo2max"
                  stroke="var(--color-vo2max)"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  connectNulls
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
