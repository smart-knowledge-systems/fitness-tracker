"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface SkinfoldValues {
  chest: string;
  axilla: string;
  tricep: string;
  bicep: string;
  subscapular: string;
  abdominal: string;
  suprailiac: string;
  thigh: string;
}

type SkinfoldField = keyof SkinfoldValues;

interface SkinfoldsSectionProps {
  values: SkinfoldValues;
  onChange: (field: SkinfoldField, value: string) => void;
  /** Show description text about mm units */
  showDescription?: boolean;
}

const fieldLabels: Record<SkinfoldField, string> = {
  chest: "Chest",
  axilla: "Axilla",
  tricep: "Tricep",
  bicep: "Bicep",
  subscapular: "Subscapular",
  abdominal: "Abdominal",
  suprailiac: "Suprailiac",
  thigh: "Thigh",
};

const allFields: SkinfoldField[] = [
  "chest",
  "axilla",
  "tricep",
  "bicep",
  "subscapular",
  "abdominal",
  "suprailiac",
  "thigh",
];

export function SkinfoldsSection({
  values,
  onChange,
  showDescription = true,
}: SkinfoldsSectionProps) {
  return (
    <div className="space-y-4">
      {showDescription && (
        <p className="text-sm text-muted-foreground">
          All measurements in millimeters (mm)
        </p>
      )}
      <div className="grid grid-cols-2 gap-4">
        {allFields.map((field) => (
          <div key={field} className="space-y-2">
            <Label htmlFor={`skinfold${fieldLabels[field]}`}>
              {fieldLabels[field]}
            </Label>
            <Input
              id={`skinfold${fieldLabels[field]}`}
              type="number"
              step="0.5"
              value={values[field]}
              onChange={(e) => onChange(field, e.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
