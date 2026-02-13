"use client";

import { useMemo } from "react";
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
import { useGpxDisplay } from "./GpxDisplayContext";

interface ElevationChartProps {
  lapSplits: LapSplit[];
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

export function ElevationChart({ lapSplits }: ElevationChartProps) {
  const { elevationUnit, paceUnit } = useGpxDisplay();

  // Build chart data and calculate axis domains
  const { chartData, elevationDomain, paceDomain } = useMemo(() => {
    const data: ChartDataPoint[] = [];

    // Add starting point
    if (lapSplits.length > 0) {
      const firstLap = lapSplits[0];
      const elevation =
        elevationUnit === "ft"
          ? metersToFeet(firstLap.startElevation)
          : firstLap.startElevation;

      data.push({
        distance: 0,
        distanceLabel: "0",
        elevation,
        pace: 0,
        paceLabel: "",
        lapNumber: 0,
      });
    }

    // Add each lap end point
    let minElev = Infinity;
    let maxElev = -Infinity;
    let minPace = Infinity;
    let maxPace = -Infinity;
    let hasPace = false;

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

      data.push({
        distance: paceUnit === "mi" ? distanceMi : distanceKm,
        distanceLabel:
          paceUnit === "mi" ? distanceMi.toFixed(1) : distanceKm.toFixed(1),
        elevation,
        pace,
        paceLabel: `${paceMinutes}:${paceSeconds.toString().padStart(2, "0")}`,
        lapNumber: lap.lapNumber,
      });

      if (pace > 0) {
        hasPace = true;
        if (pace < minPace) minPace = pace;
        if (pace > maxPace) maxPace = pace;
      }
    }

    // Calculate elevation domain from all data points
    for (const d of data) {
      if (d.elevation < minElev) minElev = d.elevation;
      if (d.elevation > maxElev) maxElev = d.elevation;
    }

    const elevPadding = (maxElev - minElev) * 0.1;
    const pPadding = hasPace ? (maxPace - minPace) * 0.1 : 0;

    return {
      chartData: data,
      elevationDomain: [minElev - elevPadding, maxElev + elevPadding] as [
        number,
        number,
      ],
      paceDomain: [
        (hasPace ? minPace : 0) - pPadding,
        (hasPace ? maxPace : 10) + pPadding,
      ] as [number, number],
    };
  }, [lapSplits, elevationUnit, paceUnit]);

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
            domain={elevationDomain}
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
            domain={paceDomain}
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
