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

  // Fetch measurements for the lookback period
  const startDate = useMemo(
    () => now - lookbackDays * 24 * 60 * 60 * 1000,
    [now, lookbackDays],
  );
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
  const cutoffDate = useMemo(
    () => now - currentWindowDays * 24 * 60 * 60 * 1000,
    [now, currentWindowDays],
  );

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
      {
        chest: currentComposite.skinfoldChest,
        axilla: currentComposite.skinfoldAxilla,
        tricep: currentComposite.skinfoldTricep,
        subscapular: currentComposite.skinfoldSubscapular,
        abdominal: currentComposite.skinfoldAbdominal,
        suprailiac: currentComposite.skinfoldSuprailiac,
        thigh: currentComposite.skinfoldThigh,
        bicep: currentComposite.skinfoldBicep,
      },
      {
        waist: currentComposite.waistCirc,
        neck: currentComposite.neckCirc,
        hip: currentComposite.hipCirc,
        height: currentComposite.height ?? userProfile.height,
      },
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

    // Weight change
    const weightChange =
      currentComposite.weight != null && previousComposite.weight != null
        ? currentComposite.weight - previousComposite.weight
        : null;

    // Body fat change: compute previous weighted BF from penultimate composite
    const previousBodyFat = weightedAverageBodyFat(
      {
        chest: previousComposite.skinfoldChest,
        axilla: previousComposite.skinfoldAxilla,
        tricep: previousComposite.skinfoldTricep,
        subscapular: previousComposite.skinfoldSubscapular,
        abdominal: previousComposite.skinfoldAbdominal,
        suprailiac: previousComposite.skinfoldSuprailiac,
        thigh: previousComposite.skinfoldThigh,
        bicep: previousComposite.skinfoldBicep,
      },
      {
        waist: previousComposite.waistCirc,
        neck: previousComposite.neckCirc,
        hip: previousComposite.hipCirc,
        height: previousComposite.height ?? userProfile.height,
      },
      age,
      userProfile.sex,
      userProfile.race,
    );

    const bodyFatChange =
      bodyFatResult?.weighted != null && previousBodyFat.weighted != null
        ? bodyFatResult.weighted - previousBodyFat.weighted
        : null;

    // VO2max change
    const vo2maxChange =
      currentComposite.vo2max != null && previousComposite.vo2max != null
        ? currentComposite.vo2max - previousComposite.vo2max
        : null;

    // 5k time change
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
