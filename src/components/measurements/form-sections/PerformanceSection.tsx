"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface PerformanceValues {
  time5k: string;
  time1k: string;
  vo2max: string;
  sKmAt129Bpm: string;
}

type PerformanceField = keyof PerformanceValues;

interface PerformanceSectionProps {
  values: PerformanceValues;
  onChange: (field: PerformanceField, value: string) => void;
  /** Which fields to show. Defaults to all fields. */
  fields?: PerformanceField[];
}

const fieldConfig: Record<
  PerformanceField,
  { label: string; type: string; step?: string; placeholder: string }
> = {
  time5k: { label: "5k Time (MM:SS)", type: "text", placeholder: "25:00" },
  time1k: { label: "1k Time (MM:SS)", type: "text", placeholder: "4:30" },
  vo2max: {
    label: "VO2max (mL/kg/min)",
    type: "number",
    step: "0.1",
    placeholder: "45",
  },
  sKmAt129Bpm: {
    label: "s/km @ 129 bpm",
    type: "number",
    step: "1",
    placeholder: "360",
  },
};

const allFields: PerformanceField[] = [
  "time5k",
  "time1k",
  "vo2max",
  "sKmAt129Bpm",
];

export function PerformanceSection({
  values,
  onChange,
  fields = allFields,
}: PerformanceSectionProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {fields.map((field) => {
        const config = fieldConfig[field];
        // sKmAt129Bpm spans 2 columns in full form
        const isFullWidth = field === "sKmAt129Bpm" && fields.length > 2;
        return (
          <div
            key={field}
            className={`space-y-2 ${isFullWidth ? "col-span-2" : ""}`}
          >
            <Label htmlFor={field}>{config.label}</Label>
            <Input
              id={field}
              type={config.type}
              step={config.step}
              placeholder={config.placeholder}
              value={values[field]}
              onChange={(e) => onChange(field, e.target.value)}
            />
          </div>
        );
      })}
    </div>
  );
}
