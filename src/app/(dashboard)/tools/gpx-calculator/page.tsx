"use client";

import { useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  GpxUploader,
  RaceSettingsForm,
  RaceSettings,
  RouteSummary,
  LapSplitsTable,
  ElevationChart,
} from "@/components/gpx-calculator";
import {
  GPXParser,
  GoalPaceSolver,
  LapCalculator,
  LapCalculatorResult,
  RouteStats,
  metersToFeet,
} from "@/lib/calculations/gpx";

export default function GpxCalculatorPage() {
  // GPX file state
  const [gpxParser, setGpxParser] = useState<GPXParser | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [gpxError, setGpxError] = useState<string>("");
  const [routeStats, setRouteStats] = useState<RouteStats | null>(null);

  // Calculation state
  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState<LapCalculatorResult | null>(null);

  // Display preferences
  const [elevationUnit, setElevationUnit] = useState<"ft" | "m">("ft");
  const [paceUnit, setPaceUnit] = useState<"km" | "mi">("mi");

  const handleFileUpload = useCallback(
    async (content: string, name: string) => {
      setGpxError("");
      setResult(null);

      try {
        const parser = new GPXParser();
        await parser.parseGPX(content);

        setGpxParser(parser);
        setFileName(name);
        setRouteStats(parser.getRouteStats());
      } catch (error) {
        setGpxError(
          error instanceof Error ? error.message : "Failed to parse GPX file",
        );
        setGpxParser(null);
        setFileName("");
        setRouteStats(null);
      }
    },
    [],
  );

  const handleClearFile = useCallback(() => {
    setGpxParser(null);
    setFileName("");
    setRouteStats(null);
    setResult(null);
    setGpxError("");
  }, []);

  const handleCalculate = useCallback(
    async (settings: RaceSettings) => {
      if (!gpxParser) return;

      setIsCalculating(true);
      setResult(null);

      try {
        // Create solver with baseline elevation
        const solver = new GoalPaceSolver(settings.baselineElevationMeters);

        // Create lap calculator
        const lapCalculator = new LapCalculator(solver);

        // Calculate splits
        const calculatorResult = lapCalculator.calculateLapSplits(
          gpxParser,
          settings.goalTimeSeconds,
          settings.lapInterval,
        );

        setResult(calculatorResult);
      } catch (error) {
        console.error("Calculation error:", error);
        setGpxError(
          error instanceof Error ? error.message : "Failed to calculate splits",
        );
      } finally {
        setIsCalculating(false);
      }
    },
    [gpxParser],
  );

  const handleDownloadCSV = useCallback(() => {
    if (!result) return;

    const lapCalculator = new LapCalculator(new GoalPaceSolver(0));
    const csv = lapCalculator.generateCSV(result.lapSplits);

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName.replace(".gpx", "")}-splits.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [result, fileName]);

  const formatDistance = (meters: number) => {
    const km = meters / 1000;
    const miles = meters / 1609.344;
    return paceUnit === "mi" ? `${miles.toFixed(2)} mi` : `${km.toFixed(2)} km`;
  };

  const formatElevation = (meters: number) => {
    const value = elevationUnit === "ft" ? metersToFeet(meters) : meters;
    return `${value.toFixed(0)} ${elevationUnit}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">GPX Race Pacing Calculator</h1>
        <p className="text-muted-foreground">
          Calculate pace splits for a GPX route with grade and altitude
          adjustments
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Inputs */}
        <div className="space-y-6 lg:col-span-1">
          {/* GPX Upload Card */}
          <Card>
            <CardHeader>
              <CardTitle>Route</CardTitle>
              <CardDescription>
                Upload your race course GPX file
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GpxUploader
                onFileUpload={handleFileUpload}
                fileName={fileName}
                onClear={handleClearFile}
                error={gpxError}
              />

              {routeStats && (
                <div className="mt-4 space-y-2 rounded-md bg-muted p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Distance:</span>
                    <span className="font-medium">
                      {formatDistance(routeStats.totalDistance)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Elevation Gain:
                    </span>
                    <span className="font-medium text-red-500">
                      +{formatElevation(routeStats.totalElevationGain)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Elevation Loss:
                    </span>
                    <span className="font-medium text-green-500">
                      -{formatElevation(routeStats.totalElevationLoss)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max Grade:</span>
                    <span className="font-medium">
                      {(routeStats.smoothedMaxGrade * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Min Grade:</span>
                    <span className="font-medium">
                      {(routeStats.smoothedMinGrade * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Race Settings Card */}
          <Card>
            <CardHeader>
              <CardTitle>Race Settings</CardTitle>
              <CardDescription>
                Enter your goal time and training elevation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RaceSettingsForm
                onCalculate={handleCalculate}
                isCalculating={isCalculating}
                hasGpxFile={!!gpxParser}
              />
            </CardContent>
          </Card>

          {/* Display Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Display Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Distance/Pace</span>
                <div className="inline-flex rounded-md border">
                  <button
                    className={`px-3 py-1.5 text-sm ${
                      paceUnit === "mi"
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => setPaceUnit("mi")}
                  >
                    Miles
                  </button>
                  <button
                    className={`px-3 py-1.5 text-sm ${
                      paceUnit === "km"
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => setPaceUnit("km")}
                  >
                    Kilometers
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Elevation</span>
                <div className="inline-flex rounded-md border">
                  <button
                    className={`px-3 py-1.5 text-sm ${
                      elevationUnit === "ft"
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => setElevationUnit("ft")}
                  >
                    Feet
                  </button>
                  <button
                    className={`px-3 py-1.5 text-sm ${
                      elevationUnit === "m"
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => setElevationUnit("m")}
                  >
                    Meters
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-2">
          {result ? (
            <Card>
              <CardHeader>
                <CardTitle>Race Analysis</CardTitle>
                <CardDescription>
                  Predicted splits for {fileName}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="summary" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="summary">Summary</TabsTrigger>
                    <TabsTrigger value="chart">Elevation Chart</TabsTrigger>
                    <TabsTrigger value="splits">Lap Splits</TabsTrigger>
                  </TabsList>

                  <TabsContent value="summary" className="mt-4">
                    <RouteSummary
                      result={result}
                      elevationUnit={elevationUnit}
                      onDownloadCSV={handleDownloadCSV}
                    />
                  </TabsContent>

                  <TabsContent value="chart" className="mt-4">
                    <ElevationChart
                      lapSplits={result.lapSplits}
                      elevationUnit={elevationUnit}
                      paceUnit={paceUnit}
                    />
                  </TabsContent>

                  <TabsContent value="splits" className="mt-4">
                    <LapSplitsTable
                      lapSplits={result.lapSplits}
                      lapInterval={result.lapInterval}
                      elevationUnit={elevationUnit}
                      paceUnit={paceUnit}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex min-h-[400px] items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <p className="text-lg font-medium">No analysis yet</p>
                  <p className="mt-1 text-sm">
                    Upload a GPX file and enter your goal time to calculate
                    splits
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Info Section */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none text-muted-foreground">
          <p>
            This calculator combines two scientific models to predict your race
            splits:
          </p>
          <ul className="list-disc space-y-1 pl-4">
            <li>
              <strong>Grade Adjustment (GAP)</strong>: Based on Minetti et al.
              2002, adjusts pace for uphills and downhills using metabolic cost
              data. Steep downhills (&gt;8% grade) are capped for realistic
              pacing.
            </li>
            <li>
              <strong>Altitude Adjustment</strong>: Performance degrades
              approximately 1% for every 1000 feet (304.8m) above your training
              elevation due to reduced oxygen availability.
            </li>
          </ul>
          <p className="mt-2">
            Enter your goal time and baseline training elevation. The calculator
            will find the equivalent flat-ground pace and predict your splits
            for each segment of the course.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
