"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useUnitPreferences } from "@/hooks/useUnitPreferences";
import { useMeasurementFormState } from "@/hooks/useMeasurementFormState";
import { SaveUnitsCheckbox } from "./SaveUnitsCheckbox";
import { CoreMetricsSection } from "./form-sections/CoreMetricsSection";
import { SkinfoldsSection } from "./form-sections/SkinfoldsSection";
import { CircumferencesSection } from "./form-sections/CircumferencesSection";
import { PerformanceSection } from "./form-sections/PerformanceSection";

export function MeasurementQuickEntry() {
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
    clearForm,
    getParsedValues,
  } = useMeasurementFormState();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(["core"]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const parsed = getParsedValues(weightUnit, lengthUnit);

      // Quick entry only submits a subset of fields
      await createMeasurement({
        date: Date.now(),
        weight: parsed.weight,
        waistCirc: parsed.waistCirc,
        neckCirc: parsed.neckCirc,
        hipCirc: parsed.hipCirc,
        skinfoldChest: parsed.skinfoldChest,
        skinfoldAxilla: parsed.skinfoldAxilla,
        skinfoldTricep: parsed.skinfoldTricep,
        skinfoldSubscapular: parsed.skinfoldSubscapular,
        skinfoldAbdominal: parsed.skinfoldAbdominal,
        skinfoldSuprailiac: parsed.skinfoldSuprailiac,
        skinfoldThigh: parsed.skinfoldThigh,
        skinfoldBicep: parsed.skinfoldBicep,
        upperArmCirc: parsed.upperArmCirc,
        chestCirc: parsed.chestCirc,
        time5k: parsed.time5k,
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
      clearForm();
    } catch (error) {
      toast.error("Failed to save measurement");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Entry</CardTitle>
        <CardDescription>Add today&apos;s measurements</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Core Metrics */}
          <Collapsible
            open={expandedSections.includes("core")}
            onOpenChange={() => toggleSection("core")}
          >
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between"
                type="button"
              >
                Core Metrics
                {expandedSections.includes("core") ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-2">
              <CoreMetricsSection
                values={coreMetrics}
                onChange={handleCoreChange}
                weightUnit={weightUnit}
                lengthUnit={lengthUnit}
                onWeightUnitChange={setWeightUnit}
                onLengthUnitChange={setLengthUnit}
                showHeight={false}
                showHip={userProfile?.sex === "female"}
                compact={true}
              />
            </CollapsibleContent>
          </Collapsible>

          {/* Skinfolds */}
          <Collapsible
            open={expandedSections.includes("skinfolds")}
            onOpenChange={() => toggleSection("skinfolds")}
          >
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between"
                type="button"
              >
                Skinfold Measurements (mm)
                {expandedSections.includes("skinfolds") ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-2">
              <SkinfoldsSection
                values={skinfolds}
                onChange={handleSkinfoldChange}
                showDescription={false}
              />
            </CollapsibleContent>
          </Collapsible>

          {/* Muscle Circumferences */}
          <Collapsible
            open={expandedSections.includes("circumferences")}
            onOpenChange={() => toggleSection("circumferences")}
          >
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between"
                type="button"
              >
                Muscle Circumferences (cm)
                {expandedSections.includes("circumferences") ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-2">
              <CircumferencesSection
                values={circumferences}
                onChange={handleCircumferenceChange}
                fields={["upperArm", "chest"]}
                showDescription={false}
              />
            </CollapsibleContent>
          </Collapsible>

          {/* Performance */}
          <Collapsible
            open={expandedSections.includes("performance")}
            onOpenChange={() => toggleSection("performance")}
          >
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between"
                type="button"
              >
                Performance Metrics
                {expandedSections.includes("performance") ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-2">
              <PerformanceSection
                values={performance}
                onChange={handlePerformanceChange}
                fields={["time5k", "vo2max"]}
              />
            </CollapsibleContent>
          </Collapsible>

          {/* Save unit preferences checkbox - only visible when units differ from profile */}
          {unitsChanged && (
            <SaveUnitsCheckbox
              id="saveUnitsQuick"
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
      </CardContent>
    </Card>
  );
}
