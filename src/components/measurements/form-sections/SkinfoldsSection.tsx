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

interface SkinfoldsSectionProps {
  values: SkinfoldValues;
  onChange: (field: keyof SkinfoldValues, value: string) => void;
  /** Show description text about mm units */
  showDescription?: boolean;
}

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
        <div className="space-y-2">
          <Label htmlFor="skinfoldChest">Chest</Label>
          <Input
            id="skinfoldChest"
            type="number"
            step="0.5"
            value={values.chest}
            onChange={(e) => onChange("chest", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="skinfoldAxilla">Axilla</Label>
          <Input
            id="skinfoldAxilla"
            type="number"
            step="0.5"
            value={values.axilla}
            onChange={(e) => onChange("axilla", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="skinfoldTricep">Tricep</Label>
          <Input
            id="skinfoldTricep"
            type="number"
            step="0.5"
            value={values.tricep}
            onChange={(e) => onChange("tricep", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="skinfoldBicep">Bicep</Label>
          <Input
            id="skinfoldBicep"
            type="number"
            step="0.5"
            value={values.bicep}
            onChange={(e) => onChange("bicep", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="skinfoldSubscapular">Subscapular</Label>
          <Input
            id="skinfoldSubscapular"
            type="number"
            step="0.5"
            value={values.subscapular}
            onChange={(e) => onChange("subscapular", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="skinfoldAbdominal">Abdominal</Label>
          <Input
            id="skinfoldAbdominal"
            type="number"
            step="0.5"
            value={values.abdominal}
            onChange={(e) => onChange("abdominal", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="skinfoldSuprailiac">Suprailiac</Label>
          <Input
            id="skinfoldSuprailiac"
            type="number"
            step="0.5"
            value={values.suprailiac}
            onChange={(e) => onChange("suprailiac", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="skinfoldThigh">Thigh</Label>
          <Input
            id="skinfoldThigh"
            type="number"
            step="0.5"
            value={values.thigh}
            onChange={(e) => onChange("thigh", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
