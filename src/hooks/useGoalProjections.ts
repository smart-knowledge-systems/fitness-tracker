"use client";

import { useMemo } from "react";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import {
  calculateProjection,
  type ProjectionResult,
} from "@/lib/calculations/goalProjections";

type Goal = Doc<"goals">;
type Measurement = Doc<"measurements">;
type UserProfile = Doc<"userProfiles">;

export interface UseGoalProjectionsReturn {
  /** Map of goal ID to projection result */
  goalProjections: Map<Id<"goals">, ProjectionResult>;
  /** Active (non-completed) goals */
  activeGoals: Goal[];
  /** Completed goals */
  completedGoals: Goal[];
}

/**
 * Hook for calculating goal projections.
 * Extracted from Goals page for reusability.
 */
export function useGoalProjections(
  goals: Goal[] | undefined,
  measurements: Measurement[] | undefined,
  profile: UserProfile | null | undefined,
): UseGoalProjectionsReturn {
  const goalProjections = useMemo(() => {
    if (!goals || !measurements)
      return new Map<Id<"goals">, ProjectionResult>();

    const projections = new Map<Id<"goals">, ProjectionResult>();
    for (const goal of goals) {
      if (!goal.completed) {
        const projection = calculateProjection(
          measurements,
          goal.metric,
          goal.targetValue,
          goal.startValue,
          profile,
          goal.direction,
        );
        if (projection) {
          projections.set(goal._id, projection);
        }
      }
    }
    return projections;
  }, [goals, measurements, profile]);

  // Single pass to partition goals into active and completed
  const { activeGoals, completedGoals } = useMemo(() => {
    const active: Goal[] = [];
    const completed: Goal[] = [];
    for (const g of goals ?? []) {
      (g.completed ? completed : active).push(g);
    }
    return { activeGoals: active, completedGoals: completed };
  }, [goals]);

  return {
    goalProjections,
    activeGoals,
    completedGoals,
  };
}
