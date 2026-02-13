"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  buildCompositeMeasurement,
  type Measurement,
} from "@/lib/calculations/measurementHelpers";
import {
  weightedAverageBodyFat,
  type BodyFatResults,
  type SkinfoldMeasurements,
  type CircumferenceMeasurements,
} from "@/lib/calculations";
import { calculateAge } from "@/lib/calculations/ageUtils";

export interface UseDashboardStatsOptions {
  /** Number of days to look back for measurements (default: 60) */
  lookbackDays?: number;
  /** Window for current composite calculation (default: 14) */
  currentWindowDays?: number;
}

export interface DashboardStats {
  currentComposite: Partial<Measurement> | null;
  previousComposite: Partial<Measurement> | null;
  bodyFatResult: BodyFatResults | null;
  weightChange: number | null;
  bodyFatChange: number | null;
  vo2maxChange: number | null;
  time5kChange: number | null;
  age: number;
  isLoading: boolean;
}

/** Build skinfold data from a composite measurement */
function buildSkinfoldData(
  composite: Partial<Measurement>,
): SkinfoldMeasurements {
  return {
    chest: composite.skinfoldChest,
    axilla: composite.skinfoldAxilla,
    tricep: composite.skinfoldTricep,
    subscapular: composite.skinfoldSubscapular,
    abdominal: composite.skinfoldAbdominal,
    suprailiac: composite.skinfoldSuprailiac,
    thigh: composite.skinfoldThigh,
    bicep: composite.skinfoldBicep,
  };
}

/** Build circumference data from a composite measurement */
function buildCircumferenceData(
  composite: Partial<Measurement>,
  fallbackHeight: number | undefined,
): Partial<CircumferenceMeasurements> {
  return {
    waist: composite.waistCirc,
    neck: composite.neckCirc,
    hip: composite.hipCirc,
    height: composite.height ?? fallbackHeight,
  };
}

/**
 * Hook for computing dashboard statistics.
 * Extracted from Dashboard page for reusability.
 */
export function useDashboardStats(
  options: UseDashboardStatsOptions = {},
): DashboardStats {
  const { lookbackDays = 60, currentWindowDays = 14 } = options;

  const userProfile = useQuery(api.userProfile.get);

  // Capture current time once on mount for age calculation
  const [now] = useState(() => Date.now());

  // Derive date bounds directly — simple arithmetic, no memoization needed
  const startDate = now - lookbackDays * 24 * 60 * 60 * 1000;
  const cutoffDate = now - currentWindowDays * 24 * 60 * 60 * 1000;

  const recentMeasurements = useQuery(api.measurements.getByDateRange, {
    startDate,
    endDate: now,
  });

  const isLoading =
    recentMeasurements === undefined || userProfile === undefined;

  // Calculate age from birth date
  const age = useMemo(
    () => calculateAge(userProfile?.birthDate, now),
    [userProfile?.birthDate, now],
  );

  // Compute current and previous composites
  const { currentComposite, previousComposite } = useMemo(() => {
    if (!recentMeasurements?.length) {
      return { currentComposite: null, previousComposite: null };
    }

    const result = buildCompositeMeasurement(recentMeasurements, cutoffDate);
    if (!result) {
      return { currentComposite: null, previousComposite: null };
    }

    return {
      currentComposite: result.current,
      previousComposite: result.previous,
    };
  }, [recentMeasurements, cutoffDate]);

  // Calculate weighted body fat from current composite
  const bodyFatResult = useMemo(() => {
    if (!currentComposite || !userProfile) return null;

    return weightedAverageBodyFat(
      buildSkinfoldData(currentComposite),
      buildCircumferenceData(currentComposite, userProfile.height),
      age,
      userProfile.sex,
      userProfile.race,
    );
  }, [currentComposite, userProfile, age]);

  // Calculate changes from previous composite
  const changes = useMemo(() => {
    if (!currentComposite || !previousComposite || !userProfile) {
      return {
        weightChange: null,
        bodyFatChange: null,
        vo2maxChange: null,
        time5kChange: null,
      };
    }

    const weightChange =
      currentComposite.weight != null && previousComposite.weight != null
        ? currentComposite.weight - previousComposite.weight
        : null;

    const previousBodyFat = weightedAverageBodyFat(
      buildSkinfoldData(previousComposite),
      buildCircumferenceData(previousComposite, userProfile.height),
      age,
      userProfile.sex,
      userProfile.race,
    );

    const bodyFatChange =
      bodyFatResult?.weighted != null && previousBodyFat.weighted != null
        ? bodyFatResult.weighted - previousBodyFat.weighted
        : null;

    const vo2maxChange =
      currentComposite.vo2max != null && previousComposite.vo2max != null
        ? currentComposite.vo2max - previousComposite.vo2max
        : null;

    const time5kChange =
      currentComposite.time5k != null && previousComposite.time5k != null
        ? currentComposite.time5k - previousComposite.time5k
        : null;

    return { weightChange, bodyFatChange, vo2maxChange, time5kChange };
  }, [currentComposite, previousComposite, userProfile, age, bodyFatResult]);

  return {
    currentComposite,
    previousComposite,
    bodyFatResult,
    ...changes,
    age,
    isLoading,
  };
}
