"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { toLocalDateString, localDateStringToTimestamp } from "@/lib/dateUtils";
import { useUnitPreferences } from "@/hooks/useUnitPreferences";
import { useMeasurementFormState } from "@/hooks/useMeasurementFormState";
import { SaveUnitsCheckbox } from "./SaveUnitsCheckbox";
import { CoreMetricsSection } from "./form-sections/CoreMetricsSection";
import { SkinfoldsSection } from "./form-sections/SkinfoldsSection";
import { CircumferencesSection } from "./form-sections/CircumferencesSection";
import { PerformanceSection } from "./form-sections/PerformanceSection";

interface MeasurementFormProps {
  onSuccess?: () => void;
}

export function MeasurementForm({ onSuccess }: MeasurementFormProps) {
  const createMeasurement = useMutation(api.measurements.create);
  const updateUnitPreferences = useMutation(
    api.userProfile.updateUnitPreferences,
  );

  const {
    weightUnit,
    lengthUnit,
    setWeightUnit,
    setLengthUnit,
    unitsChanged,
    userProfile,
    saveUnitsAsDefault,
    setSaveUnitsAsDefault,
  } = useUnitPreferences({ withSaveDefault: true });

  const {
    coreMetrics,
    skinfolds,
    circumferences,
    performance,
    handleCoreChange,
    handleSkinfoldChange,
    handleCircumferenceChange,
    handlePerformanceChange,
    getParsedValues,
  } = useMeasurementFormState();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [date, setDate] = useState(toLocalDateString(new Date()));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const parsed = getParsedValues(weightUnit, lengthUnit);

    // Calculate L/min O2 from VO2max and weight
    const calculatedLMinO2 =
      parsed.weight && parsed.vo2max
        ? (parsed.vo2max * parsed.weight) / 1000
        : undefined;

    try {
      await createMeasurement({
        date: localDateStringToTimestamp(date),
        weight: parsed.weight,
        waistCirc: parsed.waistCirc,
        neckCirc: parsed.neckCirc,
        hipCirc: parsed.hipCirc,
        height: parsed.height,
        skinfoldChest: parsed.skinfoldChest,
        skinfoldAxilla: parsed.skinfoldAxilla,
        skinfoldTricep: parsed.skinfoldTricep,
        skinfoldSubscapular: parsed.skinfoldSubscapular,
        skinfoldAbdominal: parsed.skinfoldAbdominal,
        skinfoldSuprailiac: parsed.skinfoldSuprailiac,
        skinfoldThigh: parsed.skinfoldThigh,
        skinfoldBicep: parsed.skinfoldBicep,
        upperArmCirc: parsed.upperArmCirc,
        lowerArmCirc: parsed.lowerArmCirc,
        thighCirc: parsed.thighCirc,
        calfCirc: parsed.calfCirc,
        chestCirc: parsed.chestCirc,
        shoulderCirc: parsed.shoulderCirc,
        time5k: parsed.time5k,
        time1k: parsed.time1k,
        lMinO2: calculatedLMinO2,
        sKmAt129Bpm: parsed.sKmAt129Bpm,
        vo2max: parsed.vo2max,
      });

      // Save unit preferences if requested
      if (saveUnitsAsDefault && unitsChanged) {
        await updateUnitPreferences({ weightUnit, lengthUnit });
        toast.success("Measurement saved and unit preferences updated!");
      } else {
        toast.success("Measurement saved!");
      }

      setSaveUnitsAsDefault?.(false);
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to save measurement");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>

      <Tabs defaultValue="core" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="core">Core</TabsTrigger>
          <TabsTrigger value="skinfolds">Skinfolds</TabsTrigger>
          <TabsTrigger value="circumferences">Circ.</TabsTrigger>
          <TabsTrigger value="performance">Perf.</TabsTrigger>
        </TabsList>

        <TabsContent value="core" className="space-y-4 pt-4">
          <CoreMetricsSection
            values={coreMetrics}
            onChange={handleCoreChange}
            weightUnit={weightUnit}
            lengthUnit={lengthUnit}
            onWeightUnitChange={setWeightUnit}
            onLengthUnitChange={setLengthUnit}
            showHeight={true}
            showHip={userProfile?.sex === "female"}
            profileHeight={userProfile?.height}
          />
        </TabsContent>

        <TabsContent value="skinfolds" className="space-y-4 pt-4">
          <SkinfoldsSection
            values={skinfolds}
            onChange={handleSkinfoldChange}
          />
        </TabsContent>

        <TabsContent value="circumferences" className="space-y-4 pt-4">
          <CircumferencesSection
            values={circumferences}
            onChange={handleCircumferenceChange}
          />
        </TabsContent>

        <TabsContent value="performance" className="space-y-4 pt-4">
          <PerformanceSection
            values={performance}
            onChange={handlePerformanceChange}
          />
        </TabsContent>
      </Tabs>

      {/* Save unit preferences checkbox - only visible when units differ from profile */}
      {unitsChanged && (
        <SaveUnitsCheckbox
          checked={saveUnitsAsDefault ?? false}
          onCheckedChange={setSaveUnitsAsDefault!}
        />
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Save Measurement"
        )}
      </Button>
    </form>
  );
}
