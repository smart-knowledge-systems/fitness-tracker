"use client";

import { useMemo, useCallback, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toLocalDateString } from "@/lib/dateUtils";

export type DateRangeType = "30d" | "60d" | "90d" | "1y" | "all" | "custom";

const DATE_RANGES: Record<string, number> = {
  "30d": 30,
  "60d": 60,
  "90d": 90,
  "1y": 365,
};

export interface UseDateRangeFilterOptions {
  /** Default date range if not specified in URL */
  defaultRange?: DateRangeType;
}

export interface UseDateRangeFilterReturn {
  dateRange: DateRangeType;
  customStart: Date | undefined;
  customEnd: Date | undefined;
  setDateRange: (range: DateRangeType) => void;
  setCustomStart: (date: Date | undefined) => void;
  setCustomEnd: (date: Date | undefined) => void;
  domainStart: number;
  domainEnd: number;
  /** Filter measurements by the current date range */
  filterMeasurements: <T extends { date: number }>(measurements: T[]) => T[];
}

/**
 * Hook for managing date range filtering with URL query params.
 * Extracted from Progress page for reusability.
 */
export function useDateRangeFilter(
  options: UseDateRangeFilterOptions = {},
): UseDateRangeFilterReturn {
  const { defaultRange = "60d" } = options;
  const searchParams = useSearchParams();
  const router = useRouter();

  // Stable reference time for date calculations (doesn't change on re-renders)
  const [now] = useState(() => Date.now());

  // Read state from URL query params
  const dateRange =
    (searchParams.get("range") as DateRangeType) || defaultRange;
  const customStartParam = searchParams.get("start");
  const customEndParam = searchParams.get("end");

  const customStart = useMemo(
    () => (customStartParam ? new Date(customStartParam) : undefined),
    [customStartParam],
  );

  const customEnd = useMemo(
    () => (customEndParam ? new Date(customEndParam) : undefined),
    [customEndParam],
  );

  // Update URL when changing date range
  const setDateRange = useCallback(
    (range: DateRangeType) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("range", range);
      if (range !== "custom") {
        params.delete("start");
        params.delete("end");
      }
      router.replace(`?${params.toString()}`);
    },
    [searchParams, router],
  );

  const setCustomStart = useCallback(
    (date: Date | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("range", "custom");
      if (date) {
        params.set("start", toLocalDateString(date));
      } else {
        params.delete("start");
      }
      router.replace(`?${params.toString()}`);
    },
    [searchParams, router],
  );

  const setCustomEnd = useCallback(
    (date: Date | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("range", "custom");
      if (date) {
        params.set("end", toLocalDateString(date));
      } else {
        params.delete("end");
      }
      router.replace(`?${params.toString()}`);
    },
    [searchParams, router],
  );

  // Calculate domain bounds based on selected range
  const { domainStart, domainEnd } = useMemo(() => {
    if (dateRange === "custom") {
      return {
        domainStart: customStart?.getTime() ?? now - 60 * 24 * 60 * 60 * 1000,
        domainEnd: customEnd?.getTime() ?? now,
      };
    }
    return {
      domainStart: now - (DATE_RANGES[dateRange] ?? 60) * 24 * 60 * 60 * 1000,
      domainEnd: now,
    };
  }, [dateRange, customStart, customEnd, now]);

  // Filter measurements by date range
  // Dependencies use primitive timestamps to avoid recreating on Date object identity changes
  const customStartTime = customStart?.getTime();
  const customEndTime = customEnd?.getTime();

  const filterMeasurements = useCallback(
    <T extends { date: number }>(measurements: T[]): T[] => {
      if (dateRange === "all") return measurements;
      if (dateRange === "custom") {
        return measurements.filter(
          (m) =>
            (!customStartTime || m.date >= customStartTime) &&
            (!customEndTime || m.date <= customEndTime + 24 * 60 * 60 * 1000),
        );
      }
      const cutoff = now - (DATE_RANGES[dateRange] ?? 60) * 24 * 60 * 60 * 1000;
      return measurements.filter((m) => m.date >= cutoff);
    },
    [dateRange, customStartTime, customEndTime, now],
  );

  return {
    dateRange,
    customStart,
    customEnd,
    setDateRange,
    setCustomStart,
    setCustomEnd,
    domainStart,
    domainEnd,
    filterMeasurements,
  };
}

/**
 * Calculate domain bounds for "all" range based on measurements.
 * Separate utility to be used with the hook when measurements are available.
 */
export function calculateAllRangeDomain(measurements: { date: number }[]): {
  domainStart: number;
  domainEnd: number;
} {
  if (!measurements.length) {
    const now = Date.now();
    return { domainStart: now - 60 * 24 * 60 * 60 * 1000, domainEnd: now };
  }
  // Single-pass min/max avoids spread operator stack overflow on large arrays
  let minDate = measurements[0].date;
  let maxDate = measurements[0].date;
  for (let i = 1; i < measurements.length; i++) {
    const d = measurements[i].date;
    if (d < minDate) minDate = d;
    if (d > maxDate) maxDate = d;
  }
  return { domainStart: minDate, domainEnd: maxDate };
}
