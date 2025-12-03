"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface CircumferenceValues {
  upperArm: string;
  lowerArm: string;
  thigh: string;
  calf: string;
  chest: string;
  shoulder: string;
}

type CircumferenceField = keyof CircumferenceValues;

interface CircumferencesSectionProps {
  values: CircumferenceValues;
  onChange: (field: CircumferenceField, value: string) => void;
  /** Which fields to show. Defaults to all fields. */
  fields?: CircumferenceField[];
  /** Show description text about cm units */
  showDescription?: boolean;
}

const fieldLabels: Record<CircumferenceField, string> = {
  upperArm: "Upper Arm",
  lowerArm: "Lower Arm",
  thigh: "Thigh",
  calf: "Calf",
  chest: "Chest",
  shoulder: "Shoulder",
};

const allFields: CircumferenceField[] = [
  "upperArm",
  "lowerArm",
  "chest",
  "shoulder",
  "thigh",
  "calf",
];

export function CircumferencesSection({
  values,
  onChange,
  fields = allFields,
  showDescription = true,
}: CircumferencesSectionProps) {
  return (
    <div className="space-y-4">
      {showDescription && (
        <p className="text-sm text-muted-foreground">
          All measurements in centimeters (cm)
        </p>
      )}
      <div className="grid grid-cols-2 gap-4">
        {fields.map((field) => (
          <div key={field} className="space-y-2">
            <Label htmlFor={`${field}Circ`}>{fieldLabels[field]}</Label>
            <Input
              id={`${field}Circ`}
              type="number"
              step="0.1"
              value={values[field]}
              onChange={(e) => onChange(field, e.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
