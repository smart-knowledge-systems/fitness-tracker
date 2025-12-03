"use client";

import { useState, useCallback } from "react";
import {
  parseNumber,
  parseTime,
  parseWeight,
  parseLength,
} from "@/lib/formParsers";
import type { WeightUnit, LengthUnit } from "@/lib/unitConversion";
import type { CoreMetricsValues } from "@/components/measurements/form-sections/CoreMetricsSection";
import type { SkinfoldValues } from "@/components/measurements/form-sections/SkinfoldsSection";
import type { CircumferenceValues } from "@/components/measurements/form-sections/CircumferencesSection";
import type { PerformanceValues } from "@/components/measurements/form-sections/PerformanceSection";

// Re-export types for convenience
export type {
  CoreMetricsValues,
  SkinfoldValues,
  CircumferenceValues,
  PerformanceValues,
};

const INITIAL_CORE_METRICS: CoreMetricsValues = {
  weight: "",
  height: "",
  waistCirc: "",
  neckCirc: "",
  hipCirc: "",
};

const INITIAL_SKINFOLDS: SkinfoldValues = {
  chest: "",
  axilla: "",
  tricep: "",
  bicep: "",
  subscapular: "",
  abdominal: "",
  suprailiac: "",
  thigh: "",
};

const INITIAL_CIRCUMFERENCES: CircumferenceValues = {
  upperArm: "",
  lowerArm: "",
  thigh: "",
  calf: "",
  chest: "",
  shoulder: "",
};

const INITIAL_PERFORMANCE: PerformanceValues = {
  time5k: "",
  time1k: "",
  vo2max: "",
  sKmAt129Bpm: "",
};

export interface MeasurementPayload {
  weight?: number;
  height?: number;
  waistCirc?: number;
  neckCirc?: number;
  hipCirc?: number;
  skinfoldChest?: number;
  skinfoldAxilla?: number;
  skinfoldTricep?: number;
  skinfoldSubscapular?: number;
  skinfoldAbdominal?: number;
  skinfoldSuprailiac?: number;
  skinfoldThigh?: number;
  skinfoldBicep?: number;
  upperArmCirc?: number;
  lowerArmCirc?: number;
  thighCirc?: number;
  calfCirc?: number;
  chestCirc?: number;
  shoulderCirc?: number;
  time5k?: number;
  time1k?: number;
  vo2max?: number;
  sKmAt129Bpm?: number;
  lMinO2?: number;
}

export interface UseMeasurementFormStateReturn {
  coreMetrics: CoreMetricsValues;
  skinfolds: SkinfoldValues;
  circumferences: CircumferenceValues;
  performance: PerformanceValues;
  handleCoreChange: (field: keyof CoreMetricsValues, value: string) => void;
  handleSkinfoldChange: (field: keyof SkinfoldValues, value: string) => void;
  handleCircumferenceChange: (
    field: keyof CircumferenceValues,
    value: string,
  ) => void;
  handlePerformanceChange: (
    field: keyof PerformanceValues,
    value: string,
  ) => void;
  clearForm: () => void;
  getParsedValues: (
    weightUnit: WeightUnit,
    lengthUnit: LengthUnit,
  ) => MeasurementPayload;
}

/**
 * Hook for managing measurement form state.
 * Consolidates duplicate state management from MeasurementForm and MeasurementQuickEntry.
 */
export function useMeasurementFormState(): UseMeasurementFormStateReturn {
  const [coreMetrics, setCoreMetrics] =
    useState<CoreMetricsValues>(INITIAL_CORE_METRICS);
  const [skinfolds, setSkinfolds] = useState<SkinfoldValues>(INITIAL_SKINFOLDS);
  const [circumferences, setCircumferences] = useState<CircumferenceValues>(
    INITIAL_CIRCUMFERENCES,
  );
  const [performance, setPerformance] =
    useState<PerformanceValues>(INITIAL_PERFORMANCE);

  const handleCoreChange = useCallback(
    (field: keyof CoreMetricsValues, value: string) => {
      setCoreMetrics((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handleSkinfoldChange = useCallback(
    (field: keyof SkinfoldValues, value: string) => {
      setSkinfolds((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handleCircumferenceChange = useCallback(
    (field: keyof CircumferenceValues, value: string) => {
      setCircumferences((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handlePerformanceChange = useCallback(
    (field: keyof PerformanceValues, value: string) => {
      setPerformance((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const clearForm = useCallback(() => {
    setCoreMetrics(INITIAL_CORE_METRICS);
    setSkinfolds(INITIAL_SKINFOLDS);
    setCircumferences(INITIAL_CIRCUMFERENCES);
    setPerformance(INITIAL_PERFORMANCE);
  }, []);

  const getParsedValues = useCallback(
    (weightUnit: WeightUnit, lengthUnit: LengthUnit): MeasurementPayload => {
      return {
        // Core metrics
        weight: parseWeight(coreMetrics.weight, weightUnit),
        height: parseLength(coreMetrics.height, lengthUnit),
        waistCirc: parseLength(coreMetrics.waistCirc, lengthUnit),
        neckCirc: parseLength(coreMetrics.neckCirc, lengthUnit),
        hipCirc: parseLength(coreMetrics.hipCirc, lengthUnit),
        // Skinfolds (always mm, no conversion)
        skinfoldChest: parseNumber(skinfolds.chest),
        skinfoldAxilla: parseNumber(skinfolds.axilla),
        skinfoldTricep: parseNumber(skinfolds.tricep),
        skinfoldSubscapular: parseNumber(skinfolds.subscapular),
        skinfoldAbdominal: parseNumber(skinfolds.abdominal),
        skinfoldSuprailiac: parseNumber(skinfolds.suprailiac),
        skinfoldThigh: parseNumber(skinfolds.thigh),
        skinfoldBicep: parseNumber(skinfolds.bicep),
        // Circumferences (all mm in storage)
        upperArmCirc: parseNumber(circumferences.upperArm),
        lowerArmCirc: parseNumber(circumferences.lowerArm),
        thighCirc: parseNumber(circumferences.thigh),
        calfCirc: parseNumber(circumferences.calf),
        chestCirc: parseNumber(circumferences.chest),
        shoulderCirc: parseNumber(circumferences.shoulder),
        // Performance
        time5k: parseTime(performance.time5k),
        time1k: parseTime(performance.time1k),
        vo2max: parseNumber(performance.vo2max),
        sKmAt129Bpm: parseNumber(performance.sKmAt129Bpm),
      };
    },
    [coreMetrics, skinfolds, circumferences, performance],
  );

  return {
    coreMetrics,
    skinfolds,
    circumferences,
    performance,
    handleCoreChange,
    handleSkinfoldChange,
    handleCircumferenceChange,
    handlePerformanceChange,
    clearForm,
    getParsedValues,
  };
}
