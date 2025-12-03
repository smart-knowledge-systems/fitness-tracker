"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UnitToggles } from "@/components/UnitToggles";
import { WeightUnit, LengthUnit } from "@/lib/unitConversion";

export interface CoreMetricsValues {
  weight: string;
  height: string;
  waistCirc: string;
  neckCirc: string;
  hipCirc: string;
}

interface CoreMetricsSectionProps {
  values: CoreMetricsValues;
  onChange: (field: keyof CoreMetricsValues, value: string) => void;
  weightUnit: WeightUnit;
  lengthUnit: LengthUnit;
  onWeightUnitChange: (unit: WeightUnit) => void;
  onLengthUnitChange: (unit: LengthUnit) => void;
  /** Show height field (true for full form, false for quick entry) */
  showHeight?: boolean;
  /** Show hip field for female users */
  showHip?: boolean;
  /** Profile height for placeholder (in cm) */
  profileHeight?: number;
  /** Compact sizing for quick entry form */
  compact?: boolean;
}

export function CoreMetricsSection({
  values,
  onChange,
  weightUnit,
  lengthUnit,
  onWeightUnitChange,
  onLengthUnitChange,
  showHeight = true,
  showHip = false,
  profileHeight,
  compact = false,
}: CoreMetricsSectionProps) {
  const spacing = compact ? "space-y-1" : "space-y-2";
  const gridGap = compact ? "gap-3" : "gap-4";

  return (
    <div className="space-y-4">
      <UnitToggles
        weightUnit={weightUnit}
        lengthUnit={lengthUnit}
        onWeightChange={onWeightUnitChange}
        onLengthChange={onLengthUnitChange}
        size={compact ? "compact" : "default"}
      />

      <div className={`grid grid-cols-2 ${gridGap}`}>
        <div className={spacing}>
          <Label htmlFor="weight">Weight ({weightUnit})</Label>
          <Input
            id="weight"
            type="number"
            step="0.1"
            placeholder={weightUnit === "kg" ? "75.5" : "166.5"}
            value={values.weight}
            onChange={(e) => onChange("weight", e.target.value)}
          />
        </div>

        {showHeight && (
          <div className={spacing}>
            <Label htmlFor="height">Height ({lengthUnit})</Label>
            <Input
              id="height"
              type="number"
              step="0.1"
              placeholder={
                lengthUnit === "cm"
                  ? (profileHeight?.toString() ?? "175")
                  : "69"
              }
              value={values.height}
              onChange={(e) => onChange("height", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Leave blank to use profile height
            </p>
          </div>
        )}

        <div className={spacing}>
          <Label htmlFor="waistCirc">Waist ({lengthUnit})</Label>
          <Input
            id="waistCirc"
            type="number"
            step="0.1"
            placeholder={lengthUnit === "cm" ? "80" : "31.5"}
            value={values.waistCirc}
            onChange={(e) => onChange("waistCirc", e.target.value)}
          />
        </div>

        <div className={spacing}>
          <Label htmlFor="neckCirc">Neck ({lengthUnit})</Label>
          <Input
            id="neckCirc"
            type="number"
            step="0.1"
            placeholder={lengthUnit === "cm" ? "38" : "15"}
            value={values.neckCirc}
            onChange={(e) => onChange("neckCirc", e.target.value)}
          />
        </div>

        {showHip && (
          <div className={spacing}>
            <Label htmlFor="hipCirc">Hip ({lengthUnit})</Label>
            <Input
              id="hipCirc"
              type="number"
              step="0.1"
              placeholder={lengthUnit === "cm" ? "95" : "37.5"}
              value={values.hipCirc}
              onChange={(e) => onChange("hipCirc", e.target.value)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
