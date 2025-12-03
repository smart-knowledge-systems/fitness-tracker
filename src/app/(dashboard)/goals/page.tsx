"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useMemo } from "react";
import { type WeightUnit, type LengthUnit } from "@/lib/unitConversion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Target } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";
import { GoalCard, WiggleChart, getGoalColor } from "@/components/goals";
import {
  getLatestValue,
  type GoalDirection,
} from "@/lib/calculations/goalProjections";
import { useGoalProjections } from "@/hooks/useGoalProjections";
import {
  buildMetricOptions,
  BIDIRECTIONAL_METRICS,
  isBidirectionalMetric,
  convertGoalValueForStorage,
  getDefaultDirection,
} from "@/lib/goals/metricConfig";

export default function GoalsPage() {
  const goals = useQuery(api.goals.list, { includeCompleted: true });
  const userProfile = useQuery(api.userProfile.get);
  const measurements = useQuery(api.measurements.list, { limit: 100 });
  const createGoal = useMutation(api.goals.create);
  const completeGoal = useMutation(api.goals.complete);
  const deleteGoal = useMutation(api.goals.remove);
  const setChartVisibility = useMutation(api.goals.setChartVisibility);

  // Unit preferences
  const weightUnit: WeightUnit = userProfile?.weightUnit ?? "kg";
  const lengthUnit: LengthUnit = userProfile?.lengthUnit ?? "cm";

  // Dynamic metric options based on unit preferences
  const metricOptions = useMemo(
    () => buildMetricOptions(weightUnit, lengthUnit),
    [weightUnit, lengthUnit],
  );

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [metric, setMetric] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [direction, setDirection] = useState<GoalDirection | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get default direction for selected metric
  const defaultDirection = getDefaultDirection(metricOptions, metric);
  const isBidirectional = isBidirectionalMetric(metric);
  const effectiveDirection = direction ?? defaultDirection;

  // Use the goal projections hook
  const { goalProjections, activeGoals, completedGoals } = useGoalProjections(
    goals,
    measurements,
    userProfile,
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Get current value as start value
      const startValue = measurements
        ? getLatestValue(measurements, metric, userProfile)
        : undefined;

      await createGoal({
        metric,
        targetValue: convertGoalValueForStorage(
          parseFloat(targetValue),
          metric,
          weightUnit,
          lengthUnit,
        ),
        targetDate: targetDate ? new Date(targetDate).getTime() : undefined,
        direction: effectiveDirection,
        startValue: startValue ?? undefined,
      });
      toast.success("Goal created!");
      setShowAddDialog(false);
      setMetric("");
      setTargetValue("");
      setTargetDate("");
      setDirection(null);
    } catch (error) {
      toast.error("Failed to create goal");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = async (id: Id<"goals">) => {
    try {
      await completeGoal({ id });
      toast.success("Goal completed!");
    } catch (error) {
      toast.error("Failed to complete goal");
      console.error(error);
    }
  };

  const handleDelete = async (id: Id<"goals">) => {
    try {
      await deleteGoal({ id });
      toast.success("Goal deleted");
    } catch (error) {
      toast.error("Failed to delete goal");
      console.error(error);
    }
  };

  const toggleGoalVisibility = async (
    id: Id<"goals">,
    currentlyVisible: boolean,
  ) => {
    try {
      await setChartVisibility({ id, isVisible: !currentlyVisible });
    } catch (error) {
      toast.error("Failed to update visibility");
      console.error(error);
    }
  };

  const isLoading =
    goals === undefined ||
    measurements === undefined ||
    userProfile === undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Goals</h1>
          <p className="text-muted-foreground">
            Set and track your fitness goals
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Goal
        </Button>
      </div>

      {/* Wiggle Chart */}
      {!isLoading && activeGoals.length > 0 && (
        <WiggleChart
          goals={goals ?? []}
          measurements={measurements ?? []}
          profile={userProfile}
        />
      )}

      {/* Active Goals */}
      <div>
        <h2 className="mb-4 text-xl font-semibold">Active Goals</h2>
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <div className="p-6">
                  <Skeleton className="h-6 w-32 mb-4" />
                  <Skeleton className="h-10 w-full mb-4" />
                  <Skeleton className="h-2 w-full mb-4" />
                  <Skeleton className="h-8 w-24" />
                </div>
              </Card>
            ))}
          </div>
        ) : activeGoals.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center text-center">
                <Target className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No active goals. Create one to start tracking!
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeGoals.map((goal, index) => {
              const isVisible = goal.isVisibleOnChart !== false;
              return (
                <GoalCard
                  key={goal._id}
                  goal={goal}
                  projection={goalProjections.get(goal._id) ?? null}
                  weightUnit={weightUnit}
                  lengthUnit={lengthUnit}
                  onComplete={handleComplete}
                  onDelete={handleDelete}
                  chartColor={getGoalColor(index)}
                  isVisibleOnChart={isVisible}
                  onToggleChartVisibility={() =>
                    toggleGoalVisibility(goal._id, isVisible)
                  }
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div>
          <h2 className="mb-4 text-xl font-semibold">Completed Goals</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {completedGoals.map((goal) => (
              <GoalCard
                key={goal._id}
                goal={goal}
                projection={null}
                weightUnit={weightUnit}
                lengthUnit={lengthUnit}
                onComplete={handleComplete}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      )}

      {/* Add Goal Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Goal</DialogTitle>
            <DialogDescription>
              Set a target for one of your fitness metrics
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="metric">Metric</Label>
              <Select value={metric} onValueChange={setMetric} required>
                <SelectTrigger id="metric">
                  <SelectValue placeholder="Select a metric" />
                </SelectTrigger>
                <SelectContent>
                  {metricOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {metric && isBidirectional && (
                <div className="flex items-center gap-3 pt-2">
                  <span
                    className={`text-sm ${effectiveDirection === "decrease" ? "font-medium" : "text-muted-foreground"}`}
                  >
                    {BIDIRECTIONAL_METRICS[metric].decrease}
                  </span>
                  <Switch
                    checked={effectiveDirection === "increase"}
                    onCheckedChange={(checked) =>
                      setDirection(checked ? "increase" : "decrease")
                    }
                  />
                  <span
                    className={`text-sm ${effectiveDirection === "increase" ? "font-medium" : "text-muted-foreground"}`}
                  >
                    {BIDIRECTIONAL_METRICS[metric].increase}
                  </span>
                </div>
              )}
              {metric && !isBidirectional && (
                <p className="text-xs text-muted-foreground">
                  Goal:{" "}
                  {defaultDirection === "increase" ? "Increase" : "Decrease"}{" "}
                  this metric
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetValue">Target Value</Label>
              <Input
                id="targetValue"
                type="number"
                step="0.1"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetDate">Target Date (optional)</Label>
              <Input
                id="targetDate"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !metric}>
                Create Goal
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
