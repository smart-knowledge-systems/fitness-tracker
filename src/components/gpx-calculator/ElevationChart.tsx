"use client";

import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { LapSplit, metersToFeet } from "@/lib/calculations/gpx";

interface ElevationChartProps {
  lapSplits: LapSplit[];
  elevationUnit: "ft" | "m";
  paceUnit: "km" | "mi";
}

interface ChartDataPoint {
  distance: number;
  distanceLabel: string;
  elevation: number;
  pace: number;
  paceLabel: string;
  lapNumber: number;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ChartDataPoint }>;
  label?: string;
  elevationUnit: "ft" | "m";
  paceUnit: "km" | "mi";
}

function CustomTooltip({
  active,
  payload,
  label,
  elevationUnit,
  paceUnit,
}: TooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-md border bg-background p-2 shadow-lg">
        <p className="text-sm font-medium">
          {paceUnit === "mi" ? `${label} mi` : `${label} km`}
        </p>
        <p className="text-sm text-muted-foreground">
          Elevation: {data.elevation.toFixed(0)} {elevationUnit}
        </p>
        {data.pace > 0 && (
          <p className="text-sm text-muted-foreground">
            Pace: {data.paceLabel}/{paceUnit}
          </p>
        )}
        {data.lapNumber > 0 && (
          <p className="text-sm text-muted-foreground">Lap {data.lapNumber}</p>
        )}
      </div>
    );
  }
  return null;
}

export function ElevationChart({
  lapSplits,
  elevationUnit,
  paceUnit,
}: ElevationChartProps) {
  // Build chart data from lap splits
  const chartData: ChartDataPoint[] = [];

  // Add starting point
  if (lapSplits.length > 0) {
    const firstLap = lapSplits[0];
    const elevation =
      elevationUnit === "ft"
        ? metersToFeet(firstLap.startElevation)
        : firstLap.startElevation;

    chartData.push({
      distance: 0,
      distanceLabel: "0",
      elevation,
      pace: 0,
      paceLabel: "",
      lapNumber: 0,
    });
  }

  // Add each lap end point
  for (const lap of lapSplits) {
    const distanceKm = lap.endDistance / 1000;
    const distanceMi = lap.endDistance / 1609.344;
    const elevation =
      elevationUnit === "ft"
        ? metersToFeet(lap.endElevation)
        : lap.endElevation;
    const pace =
      paceUnit === "mi" ? lap.averagePace * 1.60934 : lap.averagePace;
    const paceMinutes = Math.floor(pace);
    const paceSeconds = Math.floor((pace % 1) * 60);

    chartData.push({
      distance: paceUnit === "mi" ? distanceMi : distanceKm,
      distanceLabel:
        paceUnit === "mi" ? distanceMi.toFixed(1) : distanceKm.toFixed(1),
      elevation,
      pace: pace,
      paceLabel: `${paceMinutes}:${paceSeconds.toString().padStart(2, "0")}`,
      lapNumber: lap.lapNumber,
    });
  }

  // Calculate domain for y-axes
  const elevations = chartData.map((d) => d.elevation);
  const paces = chartData.filter((d) => d.pace > 0).map((d) => d.pace);

  const minElevation = Math.min(...elevations);
  const maxElevation = Math.max(...elevations);
  const elevationPadding = (maxElevation - minElevation) * 0.1;

  const minPace = paces.length > 0 ? Math.min(...paces) : 0;
  const maxPace = paces.length > 0 ? Math.max(...paces) : 10;
  const pacePadding = (maxPace - minPace) * 0.1;

  const formatPaceAxis = (value: number) => {
    const minutes = Math.floor(value);
    const seconds = Math.floor((value % 1) * 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 20, right: 60, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="distanceLabel"
            label={{
              value: paceUnit === "mi" ? "Distance (mi)" : "Distance (km)",
              position: "bottom",
              offset: 0,
            }}
            className="text-xs"
          />
          <YAxis
            yAxisId="elevation"
            orientation="left"
            domain={[
              minElevation - elevationPadding,
              maxElevation + elevationPadding,
            ]}
            label={{
              value: `Elevation (${elevationUnit})`,
              angle: -90,
              position: "insideLeft",
            }}
            className="text-xs"
          />
          <YAxis
            yAxisId="pace"
            orientation="right"
            domain={[minPace - pacePadding, maxPace + pacePadding]}
            tickFormatter={formatPaceAxis}
            label={{
              value: `Pace (/${paceUnit})`,
              angle: 90,
              position: "insideRight",
            }}
            className="text-xs"
            reversed
          />
          <Tooltip
            content={
              <CustomTooltip
                elevationUnit={elevationUnit}
                paceUnit={paceUnit}
              />
            }
          />
          <Area
            yAxisId="elevation"
            type="monotone"
            dataKey="elevation"
            fill="hsl(var(--chart-1))"
            fillOpacity={0.3}
            stroke="hsl(var(--chart-1))"
            strokeWidth={2}
          />
          <Line
            yAxisId="pace"
            type="monotone"
            dataKey="pace"
            stroke="hsl(var(--chart-2))"
            strokeWidth={2}
            dot={{ fill: "hsl(var(--chart-2))", r: 3 }}
            activeDot={{ r: 5 }}
          />
          {/* Lap boundary reference lines */}
          {lapSplits.map((lap) => (
            <ReferenceLine
              key={lap.lapNumber}
              x={
                paceUnit === "mi"
                  ? (lap.endDistance / 1609.344).toFixed(1)
                  : (lap.endDistance / 1000).toFixed(1)
              }
              yAxisId="elevation"
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="3 3"
              strokeOpacity={0.3}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
      <div className="mt-2 flex justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded"
            style={{ backgroundColor: "hsl(var(--chart-1))" }}
          />
          <span className="text-muted-foreground">Elevation</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded"
            style={{ backgroundColor: "hsl(var(--chart-2))" }}
          />
          <span className="text-muted-foreground">Pace</span>
        </div>
      </div>
    </div>
  );
}
