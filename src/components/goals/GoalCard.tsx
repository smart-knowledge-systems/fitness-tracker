"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GoalProgressBar } from "./GoalProgressBar";
import {
  METRIC_CONFIG,
  type ProjectionResult,
} from "@/lib/calculations/goalProjections";
import {
  formatGoalValue,
  formatGoalRate,
  formatProjectedDate,
  getGoalStatus,
  getTrendConfig,
} from "@/lib/formatting/goalFormatters";
import { type WeightUnit, type LengthUnit } from "@/lib/unitConversion";
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
  const formatContext = { metric: goal.metric, weightUnit, lengthUnit };

  // Get status badge configuration
  const statusConfig = getGoalStatus(goal, projection);

  // Get trend icon configuration
  const trendConfig = getTrendConfig(projection);

  // Render trend icon based on configuration
  const renderTrendIcon = () => {
    switch (trendConfig.direction) {
      case "up":
        return <TrendingUp className={`h-4 w-4 ${trendConfig.colorClass}`} />;
      case "down":
        return <TrendingDown className={`h-4 w-4 ${trendConfig.colorClass}`} />;
      default:
        return <Minus className={`h-4 w-4 ${trendConfig.colorClass}`} />;
    }
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
          <Badge
            variant={statusConfig.variant}
            className={statusConfig.colorClass}
          >
            {statusConfig.label}
          </Badge>
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
              {projection
                ? formatGoalValue(projection.currentValue, formatContext)
                : "No data"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Target</p>
            <p
              className={`text-2xl font-bold ${goal.completed ? "line-through" : ""}`}
            >
              {formatGoalValue(goal.targetValue, formatContext)}
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
              {renderTrendIcon()}
              <span className="text-muted-foreground">
                {formatGoalRate(projection.rate, formatContext)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-muted-foreground">Est. </span>
              <span className="font-medium">
                {formatProjectedDate(
                  projection.daysRemaining,
                  projection.projectedDate,
                )}
              </span>
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
