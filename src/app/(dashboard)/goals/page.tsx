"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useMemo } from "react";
import {
  convertWeightForStorage,
  convertLengthForStorage,
  type WeightUnit,
  type LengthUnit,
} from "@/lib/unitConversion";
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
  calculateProjection,
  getLatestValue,
  type GoalDirection,
} from "@/lib/calculations/goalProjections";

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
    () => [
      {
        value: "weight",
        label: `Weight (${weightUnit})`,
        unit: weightUnit,
        direction: "decrease" as GoalDirection,
      },
      {
        value: "bodyFat",
        label: "Body Fat (%)",
        unit: "%",
        direction: "decrease" as GoalDirection,
      },
      {
        value: "vo2max",
        label: "VO2max",
        unit: "mL/kg/min",
        direction: "increase" as GoalDirection,
      },
      {
        value: "time5k",
        label: "5k Time (seconds)",
        unit: "s",
        direction: "decrease" as GoalDirection,
      },
      {
        value: "time1k",
        label: "1k Time (seconds)",
        unit: "s",
        direction: "decrease" as GoalDirection,
      },
      {
        value: "leanMass",
        label: `Lean Mass (${weightUnit})`,
        unit: weightUnit,
        direction: "increase" as GoalDirection,
      },
      {
        value: "upperArmCirc",
        label: `Upper Arm (${lengthUnit})`,
        unit: lengthUnit,
        direction: "increase" as GoalDirection,
      },
      {
        value: "chestCirc",
        label: `Chest (${lengthUnit})`,
        unit: lengthUnit,
        direction: "increase" as GoalDirection,
      },
      {
        value: "waistCirc",
        label: `Waist (${lengthUnit})`,
        unit: lengthUnit,
        direction: "decrease" as GoalDirection,
      },
    ],
    [weightUnit, lengthUnit],
  );

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [metric, setMetric] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [direction, setDirection] = useState<GoalDirection | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Metrics that support bidirectional goals
  const bidirectionalMetrics: Record<
    string,
    { increase: string; decrease: string }
  > = {
    weight: { increase: "Gain weight", decrease: "Lose weight" },
    bodyFat: { increase: "Increase body fat", decrease: "Reduce body fat" },
    leanMass: { increase: "Gain lean mass", decrease: "Reduce lean mass" },
    upperArmCirc: { increase: "Increase size", decrease: "Decrease size" },
    chestCirc: { increase: "Increase size", decrease: "Decrease size" },
  };

  // Get default direction for selected metric
  const selectedMetricOption = metricOptions.find((m) => m.value === metric);
  const defaultDirection = selectedMetricOption?.direction ?? "decrease";
  const isBidirectional = metric in bidirectionalMetrics;
  const effectiveDirection = direction ?? defaultDirection;

  // Convert goal value to metric based on metric type
  const convertGoalValueForStorage = (value: number, metricType: string) => {
    const weightMetrics = ["weight", "leanMass"];
    const lengthMetrics = ["upperArmCirc", "chestCirc", "waistCirc"];

    if (weightMetrics.includes(metricType)) {
      return convertWeightForStorage(value, weightUnit);
    }
    if (lengthMetrics.includes(metricType)) {
      return convertLengthForStorage(value, lengthUnit);
    }
    return value; // No conversion needed for %, seconds, VO2max, FFMI
  };

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

  // Calculate projections for each goal
  const goalProjections = useMemo(() => {
    if (!goals || !measurements) return new Map();

    const projections = new Map();
    for (const goal of goals) {
      if (!goal.completed) {
        const projection = calculateProjection(
          measurements,
          goal.metric,
          goal.targetValue,
          goal.startValue,
          userProfile,
          goal.direction,
        );
        projections.set(goal._id, projection);
      }
    }
    return projections;
  }, [goals, measurements, userProfile]);

  const activeGoals = goals?.filter((g) => !g.completed) ?? [];
  const completedGoals = goals?.filter((g) => g.completed) ?? [];

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
              {selectedMetricOption && isBidirectional && (
                <div className="flex items-center gap-3 pt-2">
                  <span
                    className={`text-sm ${effectiveDirection === "decrease" ? "font-medium" : "text-muted-foreground"}`}
                  >
                    {bidirectionalMetrics[metric].decrease}
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
                    {bidirectionalMetrics[metric].increase}
                  </span>
                </div>
              )}
              {selectedMetricOption && !isBidirectional && (
                <p className="text-xs text-muted-foreground">
                  Goal:{" "}
                  {selectedMetricOption.direction === "increase"
                    ? "Increase"
                    : "Decrease"}{" "}
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
