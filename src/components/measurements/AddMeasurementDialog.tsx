"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MeasurementForm } from "./MeasurementForm";

interface AddMeasurementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddMeasurementDialog({
  open,
  onOpenChange,
}: AddMeasurementDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Measurement</DialogTitle>
          <DialogDescription>
            Enter your measurement data below
          </DialogDescription>
        </DialogHeader>
        <MeasurementForm onSuccess={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
