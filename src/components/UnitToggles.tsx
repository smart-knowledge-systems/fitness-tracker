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

const STYLE_CONFIG = {
  default: {
    label: "text-muted-foreground",
    button: "px-2 py-1 text-xs",
    gap: "gap-2",
    wrapperGap: "gap-4",
  },
  compact: {
    label: "text-muted-foreground text-xs",
    button: "px-2 py-0.5 text-xs",
    gap: "gap-1",
    wrapperGap: "gap-3",
  },
} as const;

export function UnitToggles({
  weightUnit,
  lengthUnit,
  onWeightChange,
  onLengthChange,
  size = "default",
}: UnitTogglesProps) {
  const styles = STYLE_CONFIG[size];

  return (
    <div className={`flex flex-wrap ${styles.wrapperGap} text-sm`}>
      <div className={`flex items-center ${styles.gap}`}>
        <span className={styles.label}>Weight:</span>
        <div className="inline-flex rounded-md border">
          <button
            type="button"
            className={`${styles.button} ${weightUnit === "kg" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            onClick={() => onWeightChange("kg")}
          >
            kg
          </button>
          <button
            type="button"
            className={`${styles.button} ${weightUnit === "lbs" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            onClick={() => onWeightChange("lbs")}
          >
            lbs
          </button>
        </div>
      </div>
      <div className={`flex items-center ${styles.gap}`}>
        <span className={styles.label}>Length:</span>
        <div className="inline-flex rounded-md border">
          <button
            type="button"
            className={`${styles.button} ${lengthUnit === "cm" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            onClick={() => onLengthChange("cm")}
          >
            cm
          </button>
          <button
            type="button"
            className={`${styles.button} ${lengthUnit === "in" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            onClick={() => onLengthChange("in")}
          >
            in
          </button>
        </div>
      </div>
    </div>
  );
}
