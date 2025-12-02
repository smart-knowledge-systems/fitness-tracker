"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LapSplit, formatTime, metersToFeet } from "@/lib/calculations/gpx";
import { AlertTriangle } from "lucide-react";

interface LapSplitsTableProps {
  lapSplits: LapSplit[];
  lapInterval: string;
  elevationUnit: "ft" | "m";
  paceUnit: "km" | "mi";
}

export function LapSplitsTable({
  lapSplits,
  elevationUnit,
  paceUnit,
}: LapSplitsTableProps) {
  const formatElevation = (meters: number) => {
    const value = elevationUnit === "ft" ? metersToFeet(meters) : meters;
    return `${value >= 0 ? "+" : ""}${value.toFixed(0)}`;
  };

  const formatPace = (minPerKm: number) => {
    const pace = paceUnit === "mi" ? minPerKm * 1.60934 : minPerKm;
    const minutes = Math.floor(pace);
    const seconds = Math.floor((pace % 1) * 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const formatDistance = (meters: number) => {
    if (paceUnit === "mi") {
      return `${(meters / 1609.344).toFixed(2)} mi`;
    }
    return `${(meters / 1000).toFixed(2)} km`;
  };

  const getGradeColor = (grade: number) => {
    const gradePercent = grade * 100;
    if (gradePercent > 5) return "text-red-600";
    if (gradePercent > 2) return "text-orange-500";
    if (gradePercent > 0) return "text-yellow-600";
    if (gradePercent > -2) return "text-muted-foreground";
    if (gradePercent > -5) return "text-green-500";
    return "text-green-600";
  };

  const getEffortBadgeVariant = (
    effort: string,
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (effort) {
      case "Very Hard":
        return "destructive";
      case "Hard":
        return "destructive";
      case "Moderate":
        return "default";
      case "Easy":
        return "secondary";
      case "Fast":
        return "outline";
      case "Very Fast":
        return "outline";
      default:
        return "secondary";
    }
  };

  return (
    <div className="max-h-[500px] overflow-y-auto rounded-md border">
      <Table>
        <TableHeader className="sticky top-0 bg-background">
          <TableRow>
            <TableHead className="w-16">Lap</TableHead>
            <TableHead className="text-right">Distance</TableHead>
            <TableHead className="text-right">Split</TableHead>
            <TableHead className="text-right">Cumulative</TableHead>
            <TableHead className="text-right">Pace</TableHead>
            <TableHead className="text-right">Elev Δ</TableHead>
            <TableHead className="text-right">Grade</TableHead>
            <TableHead>Effort</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lapSplits.map((split) => (
            <TableRow
              key={split.lapNumber}
              className={split.hasDownhillSpeedCap ? "bg-yellow-50" : ""}
            >
              <TableCell className="font-medium">
                <div className="flex items-center gap-1">
                  {split.lapNumber}
                  {split.hasDownhillSpeedCap && (
                    <span title="Downhill speed limited for safety">
                      <AlertTriangle className="h-3 w-3 text-yellow-500" />
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right font-mono text-sm">
                {formatDistance(split.endDistance)}
              </TableCell>
              <TableCell className="text-right font-mono">
                {formatTime(split.lapTime)}
              </TableCell>
              <TableCell className="text-right font-mono text-muted-foreground">
                {formatTime(split.cumulativeTime)}
              </TableCell>
              <TableCell className="text-right font-mono font-medium">
                {formatPace(split.averagePace)}/{paceUnit}
              </TableCell>
              <TableCell
                className={`text-right font-mono ${
                  split.elevationChange > 0 ? "text-red-500" : "text-green-500"
                }`}
              >
                {formatElevation(split.elevationChange)} {elevationUnit}
              </TableCell>
              <TableCell
                className={`text-right font-mono ${getGradeColor(split.averageGrade)}`}
              >
                {(split.averageGrade * 100).toFixed(1)}%
              </TableCell>
              <TableCell>
                <Badge variant={getEffortBadgeVariant(split.effortLevel)}>
                  {split.effortLevel}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
