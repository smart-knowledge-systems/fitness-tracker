"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, TrendingDown, Clock, Route } from "lucide-react";
import {
  LapCalculatorResult,
  formatTime,
  metersToFeet,
} from "@/lib/calculations/gpx";

interface RouteSummaryProps {
  result: LapCalculatorResult;
  elevationUnit: "ft" | "m";
  onDownloadCSV: () => void;
}

export function RouteSummary({
  result,
  elevationUnit,
  onDownloadCSV,
}: RouteSummaryProps) {
  const formatElevation = (meters: number) => {
    const value = elevationUnit === "ft" ? metersToFeet(meters) : meters;
    return `${value.toFixed(0)} ${elevationUnit}`;
  };

  const formatPace = (minPerKm: number) => {
    const minutes = Math.floor(minPerKm);
    const seconds = Math.floor((minPerKm % 1) * 60);
    const minPerMile = minPerKm * 1.60934;
    const minMile = Math.floor(minPerMile);
    const secMile = Math.floor((minPerMile % 1) * 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}/km (${minMile}:${secMile.toString().padStart(2, "0")}/mi)`;
  };

  return (
    <div className="space-y-4">
      {/* Primary Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Route className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Distance</p>
            <p className="text-lg font-bold">
              {(result.routeStats.totalDistance / 1000).toFixed(2)} km
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Goal Time</p>
            <p className="text-lg font-bold">{formatTime(result.goalTime)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="mx-auto mb-2 h-5 w-5 text-red-500" />
            <p className="text-xs text-muted-foreground">Elevation Gain</p>
            <p className="text-lg font-bold text-red-500">
              +{formatElevation(result.routeStats.totalElevationGain)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <TrendingDown className="mx-auto mb-2 h-5 w-5 text-green-500" />
            <p className="text-xs text-muted-foreground">Elevation Loss</p>
            <p className="text-lg font-bold text-green-500">
              -{formatElevation(result.routeStats.totalElevationLoss)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pace Info */}
      <Card>
        <CardContent className="p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">
                Base Pace (flat ground equivalent)
              </p>
              <p className="text-xl font-bold">
                {formatPace(result.solverResult.basePaceMinPerKm)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Average Pace</p>
              <p className="text-xl font-bold">
                {formatPace(result.routeAnalysis.averagePace)}
              </p>
            </div>
          </div>
          {!result.solverResult.converged && (
            <p className="mt-2 text-sm text-yellow-600">
              Note: Solver did not fully converge. Error:{" "}
              {result.solverResult.finalError.toFixed(1)}s
            </p>
          )}
        </CardContent>
      </Card>

      {/* Route Highlights */}
      <Card>
        <CardContent className="p-4">
          <h4 className="mb-3 font-medium">Route Highlights</h4>
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Hardest Lap</span>
              <span>
                #{result.routeAnalysis.hardestLap.lapNumber} (
                {(result.routeAnalysis.hardestLap.averageGrade * 100).toFixed(
                  1,
                )}
                % grade)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Easiest Lap</span>
              <span>
                #{result.routeAnalysis.easiestLap.lapNumber} (
                {(result.routeAnalysis.easiestLap.averageGrade * 100).toFixed(
                  1,
                )}
                % grade)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Slowest Lap</span>
              <span>
                #{result.routeAnalysis.slowestLap.lapNumber} (
                {
                  formatPace(result.routeAnalysis.slowestLap.averagePace).split(
                    " ",
                  )[0]
                }
                )
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fastest Lap</span>
              <span>
                #{result.routeAnalysis.fastestLap.lapNumber} (
                {
                  formatPace(result.routeAnalysis.fastestLap.averagePace).split(
                    " ",
                  )[0]
                }
                )
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pace Variation</span>
              <span>
                ±{result.routeAnalysis.paceVariation.toFixed(2)} min/km
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Download Button */}
      <Button variant="outline" className="w-full" onClick={onDownloadCSV}>
        <Download className="mr-2 h-4 w-4" />
        Download Splits (CSV)
      </Button>
    </div>
  );
}
