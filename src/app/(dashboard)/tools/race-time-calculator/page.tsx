"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  raceTime5kFromVO2max,
  raceTime10kFromVO2max,
  raceTime1kFromVO2max,
  formatTime,
  formatPace,
  calculatePace,
} from "@/lib/calculations";

export default function RaceTimeCalculatorPage() {
  const [userVo2max, setUserVo2max] = useState("");
  const [hasUserEdited, setHasUserEdited] = useState(false);
  // Capture mount time for stable "recent" calculation (28-day threshold)
  const [mountTime] = useState(() => Date.now());

  const latestMeasurement = useQuery(api.measurements.getLatest);

  // Derive the displayed value during render instead of using an effect
  const vo2max = useMemo(() => {
    if (hasUserEdited) {
      return userVo2max;
    }
    if (latestMeasurement?.vo2max && latestMeasurement.date) {
      const daysSince =
        (mountTime - latestMeasurement.date) / (1000 * 60 * 60 * 24);
      if (daysSince < 28) {
        return latestMeasurement.vo2max.toString();
      }
    }
    return "";
  }, [hasUserEdited, userVo2max, latestMeasurement, mountTime]);

  const results = useMemo(() => {
    const vo2 = parseFloat(vo2max);
    if (isNaN(vo2) || vo2 < 10) return null;

    const time1k = raceTime1kFromVO2max(vo2);
    const time5k = raceTime5kFromVO2max(vo2);
    const time10k = raceTime10kFromVO2max(vo2);

    return {
      time1k,
      time5k,
      time10k,
      pace1k: formatPace(calculatePace(time1k, 1)),
      pace5k: formatPace(calculatePace(time5k, 5)),
      pace10k: formatPace(calculatePace(time10k, 10)),
    };
  }, [vo2max]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Race Time Calculator</h1>
        <p className="text-muted-foreground">
          Predict race times from your VO2max
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>VO2max to Race Time</CardTitle>
          <CardDescription>
            Enter your VO2max to see predicted race times for 1k, 5k, and 10k
            distances
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vo2max">VO2max (mL/kg/min)</Label>
            <Input
              id="vo2max"
              type="number"
              placeholder="45"
              value={vo2max}
              onChange={(e) => {
                setHasUserEdited(true);
                setUserVo2max(e.target.value);
              }}
            />
          </div>
          {results && (
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg bg-muted p-4 text-center">
                <p className="text-sm text-muted-foreground">1k Time</p>
                <p className="text-3xl font-bold">
                  {formatTime(results.time1k)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {results.pace1k}
                </p>
              </div>
              <div className="rounded-lg bg-muted p-4 text-center">
                <p className="text-sm text-muted-foreground">5k Time</p>
                <p className="text-3xl font-bold">
                  {formatTime(results.time5k)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {results.pace5k}
                </p>
              </div>
              <div className="rounded-lg bg-muted p-4 text-center">
                <p className="text-sm text-muted-foreground">10k Time</p>
                <p className="text-3xl font-bold">
                  {formatTime(results.time10k)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {results.pace10k}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>About This Calculator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            This calculator uses Jack Daniels&apos; VDOT formula to predict race
            times based on your VO2max. The formula accounts for the oxygen cost
            of running and the percentage of VO2max sustainable at different
            race distances.
          </p>
          <p>
            These predictions assume you are equally trained for all distances.
            Actual race times may vary based on training specificity, pacing
            strategy, and race conditions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
