"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LAP_DISTANCES } from "@/lib/calculations/gpx";
import { feetToMeters, metersToFeet } from "@/lib/calculations/gpx";

interface RaceSettingsFormProps {
  onCalculate: (settings: RaceSettings) => void;
  isCalculating?: boolean;
  hasGpxFile: boolean;
}

export interface RaceSettings {
  goalTimeSeconds: number;
  baselineElevationMeters: number;
  lapInterval: string;
}

export function RaceSettingsForm({
  onCalculate,
  isCalculating = false,
  hasGpxFile,
}: RaceSettingsFormProps) {
  const [hours, setHours] = useState<string>("0");
  const [minutes, setMinutes] = useState<string>("30");
  const [seconds, setSeconds] = useState<string>("0");
  const [elevation, setElevation] = useState<string>("0");
  const [elevationUnit, setElevationUnit] = useState<"ft" | "m">("ft");
  const [lapInterval, setLapInterval] = useState<string>("1mile");
  const [error, setError] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Parse time
    const h = parseInt(hours) || 0;
    const m = parseInt(minutes) || 0;
    const s = parseInt(seconds) || 0;

    if (h === 0 && m === 0 && s === 0) {
      setError("Please enter a goal time");
      return;
    }

    if (m > 59 || s > 59) {
      setError("Minutes and seconds must be less than 60");
      return;
    }

    const goalTimeSeconds = h * 3600 + m * 60 + s;

    // Parse elevation
    const elevValue = parseFloat(elevation) || 0;
    const baselineElevationMeters =
      elevationUnit === "ft" ? feetToMeters(elevValue) : elevValue;

    onCalculate({
      goalTimeSeconds,
      baselineElevationMeters,
      lapInterval,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Goal Time */}
      <div className="space-y-2">
        <Label>Goal Time</Label>
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              type="number"
              min="0"
              max="23"
              placeholder="HH"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className="text-center"
            />
            <p className="mt-1 text-center text-xs text-muted-foreground">
              Hours
            </p>
          </div>
          <span className="flex items-center text-lg font-bold">:</span>
          <div className="flex-1">
            <Input
              type="number"
              min="0"
              max="59"
              placeholder="MM"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              className="text-center"
            />
            <p className="mt-1 text-center text-xs text-muted-foreground">
              Min
            </p>
          </div>
          <span className="flex items-center text-lg font-bold">:</span>
          <div className="flex-1">
            <Input
              type="number"
              min="0"
              max="59"
              placeholder="SS"
              value={seconds}
              onChange={(e) => setSeconds(e.target.value)}
              className="text-center"
            />
            <p className="mt-1 text-center text-xs text-muted-foreground">
              Sec
            </p>
          </div>
        </div>
      </div>

      {/* Baseline Elevation */}
      <div className="space-y-2">
        <Label>Baseline Training Elevation</Label>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="0"
            value={elevation}
            onChange={(e) => setElevation(e.target.value)}
            className="flex-1"
          />
          <div className="inline-flex rounded-md border">
            <button
              type="button"
              className={`px-3 py-2 text-sm ${
                elevationUnit === "ft"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
              onClick={() => {
                if (elevationUnit === "m") {
                  const currentMeters = parseFloat(elevation) || 0;
                  setElevation(metersToFeet(currentMeters).toFixed(0));
                }
                setElevationUnit("ft");
              }}
            >
              ft
            </button>
            <button
              type="button"
              className={`px-3 py-2 text-sm ${
                elevationUnit === "m"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
              onClick={() => {
                if (elevationUnit === "ft") {
                  const currentFeet = parseFloat(elevation) || 0;
                  setElevation(feetToMeters(currentFeet).toFixed(0));
                }
                setElevationUnit("m");
              }}
            >
              m
            </button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Your normal training elevation. Performance degrades ~1% per 1000 ft
          above this.
        </p>
      </div>

      {/* Lap Interval */}
      <div className="space-y-2">
        <Label>Split Interval</Label>
        <Select value={lapInterval} onValueChange={setLapInterval}>
          <SelectTrigger>
            <SelectValue placeholder="Select interval" />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(LAP_DISTANCES).map((key) => (
              <SelectItem key={key} value={key}>
                {key}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button
        type="submit"
        className="w-full"
        disabled={!hasGpxFile || isCalculating}
      >
        {isCalculating ? "Calculating..." : "Calculate Splits"}
      </Button>
    </form>
  );
}
