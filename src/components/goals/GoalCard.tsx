"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GoalProgressBar } from "./GoalProgressBar";
import {
  METRIC_CONFIG,
  type ProjectionResult,
} from "@/lib/calculations/goalProjections";
import { formatTime } from "@/lib/calculations/fitness";
import {
  convertWeightForDisplay,
  convertLengthForDisplay,
  type WeightUnit,
  type LengthUnit,
} from "@/lib/unitConversion";
import { Check, Trash2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { Doc, Id } from "@/convex/_generated/dataModel";

interface GoalCardProps {
  goal: Doc<"goals">;
  projection: ProjectionResult | null;
  weightUnit: WeightUnit;
  lengthUnit: LengthUnit;
  onComplete: (id: Id<"goals">) => void;
  onDelete: (id: Id<"goals">) => void;
  chartColor?: string;
  isVisibleOnChart?: boolean;
  onToggleChartVisibility?: () => void;
}

export function GoalCard({
  goal,
  projection,
  weightUnit,
  lengthUnit,
  onComplete,
  onDelete,
  chartColor,
  isVisibleOnChart = true,
  onToggleChartVisibility,
}: GoalCardProps) {
  const config = METRIC_CONFIG[goal.metric];
  const metricLabel = config?.label ?? goal.metric;

  // Format values based on metric type
  const formatValue = (value: number): string => {
    if (goal.metric === "time5k" || goal.metric === "time1k") {
      return formatTime(value);
    }
    if (goal.metric === "weight" || goal.metric === "leanMass") {
      const converted = convertWeightForDisplay(value, weightUnit);
      return `${converted.toFixed(1)} ${weightUnit}`;
    }
    if (
      goal.metric === "waistCirc" ||
      goal.metric === "upperArmCirc" ||
      goal.metric === "chestCirc"
    ) {
      const converted = convertLengthForDisplay(value, lengthUnit);
      return `${converted.toFixed(1)} ${lengthUnit}`;
    }
    if (goal.metric === "bodyFat") {
      return `${value.toFixed(1)}%`;
    }
    if (goal.metric === "vo2max") {
      return `${value.toFixed(1)}`;
    }
    if (goal.metric === "ffmi") {
      return `${value.toFixed(1)}`;
    }
    return `${value}`;
  };

  // Format rate (change per day)
  const formatRate = (rate: number): string => {
    const absRate = Math.abs(rate);
    const sign = rate >= 0 ? "+" : "-"; // Always show sign for clarity

    if (goal.metric === "time5k" || goal.metric === "time1k") {
      const secsPerWeek = absRate * 7;
      return `${sign}${secsPerWeek.toFixed(0)}s/week`;
    }
    if (goal.metric === "weight" || goal.metric === "leanMass") {
      const weeklyRate = absRate * 7;
      const converted =
        weightUnit === "lbs" ? weeklyRate * 2.20462 : weeklyRate;
      return `${sign}${converted.toFixed(2)} ${weightUnit}/week`;
    }
    if (goal.metric === "bodyFat") {
      const weeklyRate = absRate * 7;
      return `${sign}${weeklyRate.toFixed(2)}%/week`;
    }
    // Default: show daily rate
    return `${sign}${absRate.toFixed(2)}/day`;
  };

  // Determine status badge
  const getStatusBadge = () => {
    if (goal.completed) {
      return <Badge variant="secondary">Completed</Badge>;
    }
    if (!projection) {
      return <Badge variant="outline">Insufficient data</Badge>;
    }
    if (projection.progressPercent >= 100) {
      return <Badge className="bg-green-500">Goal reached!</Badge>;
    }
    switch (projection.rateDirection) {
      case "improving":
        return goal.targetDate &&
          projection.projectedDate.getTime() > goal.targetDate ? (
          <Badge variant="outline">Improving</Badge>
        ) : (
          <Badge className="bg-green-500">On track</Badge>
        );
      case "stalled":
        return <Badge className="bg-yellow-500">Stalled</Badge>;
      case "worsening":
        return <Badge className="bg-red-500">Off track</Badge>;
    }
  };

  // Get trend icon - direction based on rate sign, color based on progress
  const getTrendIcon = () => {
    if (!projection || projection.rateDirection === "stalled") {
      return <Minus className="h-4 w-4 text-muted-foreground" />;
    }

    const colorClass =
      projection.rateDirection === "improving"
        ? "text-green-500"
        : "text-yellow-500";

    // Icon based on numerical direction (rate > 0 means value increasing)
    if (projection.rate > 0) {
      return <TrendingUp className={`h-4 w-4 ${colorClass}`} />;
    }
    return <TrendingDown className={`h-4 w-4 ${colorClass}`} />;
  };

  // Format projected date
  const formatProjectedDate = () => {
    if (!projection || projection.daysRemaining === Infinity) {
      return "N/A";
    }
    if (projection.daysRemaining <= 0) {
      return "Now";
    }
    if (projection.daysRemaining > 365) {
      const years = Math.round(projection.daysRemaining / 365);
      return `~${years} year${years > 1 ? "s" : ""}`;
    }
    return projection.projectedDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year:
        projection.projectedDate.getFullYear() !== new Date().getFullYear()
          ? "numeric"
          : undefined,
    });
  };

  return (
    <Card className={goal.completed ? "opacity-60" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {chartColor && onToggleChartVisibility && !goal.completed && (
              <button
                type="button"
                onClick={onToggleChartVisibility}
                className="h-3 w-3 rounded-full border-2 transition-colors"
                style={{
                  borderColor: chartColor,
                  backgroundColor: isVisibleOnChart
                    ? chartColor
                    : "transparent",
                }}
                aria-label={
                  isVisibleOnChart ? "Hide on chart" : "Show on chart"
                }
              />
            )}
            <CardTitle className="text-lg">{metricLabel}</CardTitle>
          </div>
          {getStatusBadge()}
        </div>
        {goal.targetDate && (
          <p className="text-sm text-muted-foreground">
            Target: {new Date(goal.targetDate).toLocaleDateString()}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current vs Target */}
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Current</p>
            <p className="text-2xl font-bold">
              {projection ? formatValue(projection.currentValue) : "No data"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Target</p>
            <p
              className={`text-2xl font-bold ${goal.completed ? "line-through" : ""}`}
            >
              {formatValue(goal.targetValue)}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        {projection && !goal.completed && (
          <GoalProgressBar
            progress={projection.progressPercent}
            isOnTrack={projection.isOnTrack}
            showLabel
          />
        )}

        {/* Rate and Projection */}
        {projection && !goal.completed && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1">
              {getTrendIcon()}
              <span className="text-muted-foreground">
                {formatRate(projection.rate)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-muted-foreground">Est. </span>
              <span className="font-medium">{formatProjectedDate()}</span>
            </div>
          </div>
        )}

        {/* Data points info */}
        {projection && projection.dataPoints < 5 && !goal.completed && (
          <p className="text-xs text-muted-foreground">
            Based on {projection.dataPoints} data points (more data = better
            accuracy)
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {!goal.completed && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onComplete(goal._id)}
            >
              <Check className="mr-1 h-4 w-4" />
              Complete
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => onDelete(goal._id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
