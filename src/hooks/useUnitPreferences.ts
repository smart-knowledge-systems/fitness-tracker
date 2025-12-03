"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { WeightUnit, LengthUnit } from "@/lib/unitConversion";

interface UseUnitPreferencesOptions {
  /** Enable save-as-default state tracking (for forms) */
  withSaveDefault?: boolean;
}

interface UseUnitPreferencesReturn {
  weightUnit: WeightUnit;
  lengthUnit: LengthUnit;
  setWeightUnit: (unit: WeightUnit) => void;
  setLengthUnit: (unit: LengthUnit) => void;
  /** Whether current units differ from profile defaults */
  unitsChanged: boolean;
  /** User profile data (for accessing height, sex, etc.) */
  userProfile: ReturnType<typeof useQuery<typeof api.userProfile.get>>;
  /** Only available when withSaveDefault is true */
  saveUnitsAsDefault?: boolean;
  setSaveUnitsAsDefault?: (save: boolean) => void;
}

/**
 * Hook for managing weight/length unit preferences.
 * Initializes from user profile and tracks changes.
 */
export function useUnitPreferences(
  options: UseUnitPreferencesOptions = {},
): UseUnitPreferencesReturn {
  const { withSaveDefault = false } = options;

  const userProfile = useQuery(api.userProfile.get);
  const hasInitialized = useRef(false);

  // Initialize with defaults, will be updated when profile loads
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("kg");
  const [lengthUnit, setLengthUnit] = useState<LengthUnit>("cm");
  const [saveUnitsAsDefault, setSaveUnitsAsDefault] = useState(false);

  // Initialize units from user profile (only once when profile first loads)
  useEffect(() => {
    if (userProfile && !hasInitialized.current) {
      hasInitialized.current = true;
      // Use requestAnimationFrame to defer state updates
      requestAnimationFrame(() => {
        setWeightUnit(userProfile.weightUnit ?? "kg");
        setLengthUnit(userProfile.lengthUnit ?? "cm");
      });
    }
  }, [userProfile]);

  // Check if units differ from profile defaults
  const unitsChanged =
    (userProfile?.weightUnit ?? "kg") !== weightUnit ||
    (userProfile?.lengthUnit ?? "cm") !== lengthUnit;

  const result: UseUnitPreferencesReturn = {
    weightUnit,
    lengthUnit,
    setWeightUnit,
    setLengthUnit,
    unitsChanged,
    userProfile,
  };

  if (withSaveDefault) {
    result.saveUnitsAsDefault = saveUnitsAsDefault;
    result.setSaveUnitsAsDefault = setSaveUnitsAsDefault;
  }

  return result;
}
