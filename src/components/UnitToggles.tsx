"use client";

import { WeightUnit, LengthUnit } from "@/lib/unitConversion";

interface UnitTogglesProps {
  weightUnit: WeightUnit;
  lengthUnit: LengthUnit;
  onWeightChange: (unit: WeightUnit) => void;
  onLengthChange: (unit: LengthUnit) => void;
  /** Compact size for smaller forms */
  size?: "default" | "compact";
}

export function UnitToggles({
  weightUnit,
  lengthUnit,
  onWeightChange,
  onLengthChange,
  size = "default",
}: UnitTogglesProps) {
  const isCompact = size === "compact";
  const labelClass = isCompact
    ? "text-muted-foreground text-xs"
    : "text-muted-foreground";
  const buttonClass = isCompact ? "px-2 py-0.5 text-xs" : "px-2 py-1 text-xs";
  const gapClass = isCompact ? "gap-1" : "gap-2";
  const wrapperGap = isCompact ? "gap-3" : "gap-4";

  return (
    <div className={`flex flex-wrap ${wrapperGap} text-sm`}>
      <div className={`flex items-center ${gapClass}`}>
        <span className={labelClass}>Weight:</span>
        <div className="inline-flex rounded-md border">
          <button
            type="button"
            className={`${buttonClass} ${weightUnit === "kg" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            onClick={() => onWeightChange("kg")}
          >
            kg
          </button>
          <button
            type="button"
            className={`${buttonClass} ${weightUnit === "lbs" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            onClick={() => onWeightChange("lbs")}
          >
            lbs
          </button>
        </div>
      </div>
      <div className={`flex items-center ${gapClass}`}>
        <span className={labelClass}>Length:</span>
        <div className="inline-flex rounded-md border">
          <button
            type="button"
            className={`${buttonClass} ${lengthUnit === "cm" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            onClick={() => onLengthChange("cm")}
          >
            cm
          </button>
          <button
            type="button"
            className={`${buttonClass} ${lengthUnit === "in" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            onClick={() => onLengthChange("in")}
          >
            in
          </button>
        </div>
      </div>
    </div>
  );
}
