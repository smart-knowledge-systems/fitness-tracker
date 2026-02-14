"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { WeightUnit, LengthUnit } from "@/lib/unitConversion";

interface UseUnitPreferencesReturn {
  weightUnit: WeightUnit;
  lengthUnit: LengthUnit;
  setWeightUnit: (unit: WeightUnit) => void;
  setLengthUnit: (unit: LengthUnit) => void;
  /** Whether current units differ from profile defaults */
  unitsChanged: boolean;
  /** User profile data (for accessing height, sex, etc.) */
  userProfile: ReturnType<typeof useQuery<typeof api.userProfile.get>>;
  saveUnitsAsDefault: boolean;
  setSaveUnitsAsDefault: (save: boolean) => void;
}

/**
 * Hook for managing weight/length unit preferences.
 * Derives defaults from user profile; local overrides track user changes.
 */
export function useUnitPreferences(): UseUnitPreferencesReturn {
  const userProfile = useQuery(api.userProfile.get);

  // Derive defaults from profile. Until profile loads, use kg/cm.
  const profileWeightUnit = userProfile?.weightUnit ?? "kg";
  const profileLengthUnit = userProfile?.lengthUnit ?? "cm";

  // Local overrides — null means "use profile default"
  const [weightOverride, setWeightOverride] = useState<WeightUnit | null>(null);
  const [lengthOverride, setLengthOverride] = useState<LengthUnit | null>(null);
  const [saveUnitsAsDefault, setSaveUnitsAsDefault] = useState(false);

  const weightUnit = weightOverride ?? profileWeightUnit;
  const lengthUnit = lengthOverride ?? profileLengthUnit;

  const unitsChanged =
    profileWeightUnit !== weightUnit || profileLengthUnit !== lengthUnit;

  return {
    weightUnit,
    lengthUnit,
    setWeightUnit: setWeightOverride,
    setLengthUnit: setLengthOverride,
    unitsChanged,
    userProfile,
    saveUnitsAsDefault,
    setSaveUnitsAsDefault,
  };
}
