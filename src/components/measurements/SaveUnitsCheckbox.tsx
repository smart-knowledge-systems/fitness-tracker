"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface SaveUnitsCheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id?: string;
}

export function SaveUnitsCheckbox({
  checked,
  onCheckedChange,
  id = "saveUnits",
}: SaveUnitsCheckboxProps) {
  return (
    <div className="flex items-center space-x-2">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(checked) => onCheckedChange(checked === true)}
      />
      <Label htmlFor={id} className="text-sm font-normal">
        Save unit preferences as default
      </Label>
    </div>
  );
}
