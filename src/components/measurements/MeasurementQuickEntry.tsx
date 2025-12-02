"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  WeightUnit,
  LengthUnit,
  convertWeightForStorage,
  convertLengthForStorage,
} from "@/lib/unitConversion";

export function MeasurementQuickEntry() {
  const createMeasurement = useMutation(api.measurements.create);
  const updateUnitPreferences = useMutation(
    api.userProfile.updateUnitPreferences,
  );
  const userProfile = useQuery(api.userProfile.get);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(["core"]);

  // Unit preferences
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("kg");
  const [lengthUnit, setLengthUnit] = useState<LengthUnit>("cm");
  const [saveUnitsAsDefault, setSaveUnitsAsDefault] = useState(false);

  // Initialize units from user profile
  useEffect(() => {
    if (userProfile) {
      setWeightUnit(userProfile.weightUnit ?? "kg");
      setLengthUnit(userProfile.lengthUnit ?? "cm");
    }
  }, [userProfile]);

  // Check if units differ from profile defaults
  const unitsChanged =
    (userProfile?.weightUnit ?? "kg") !== weightUnit ||
    (userProfile?.lengthUnit ?? "cm") !== lengthUnit;

  // Form state
  const [weight, setWeight] = useState("");
  const [waistCirc, setWaistCirc] = useState("");
  const [neckCirc, setNeckCirc] = useState("");
  const [hipCirc, setHipCirc] = useState("");

  // Skinfolds
  const [skinfoldChest, setSkinfoldChest] = useState("");
  const [skinfoldAxilla, setSkinfoldAxilla] = useState("");
  const [skinfoldTricep, setSkinfoldTricep] = useState("");
  const [skinfoldSubscapular, setSkinfoldSubscapular] = useState("");
  const [skinfoldAbdominal, setSkinfoldAbdominal] = useState("");
  const [skinfoldSuprailiac, setSkinfoldSuprailiac] = useState("");
  const [skinfoldThigh, setSkinfoldThigh] = useState("");
  const [skinfoldBicep, setSkinfoldBicep] = useState("");

  // Muscle circumferences
  const [upperArmCirc, setUpperArmCirc] = useState("");
  const [chestCirc, setChestCirc] = useState("");

  // Performance
  const [time5k, setTime5k] = useState("");
  const [vo2max, setVo2max] = useState("");

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section],
    );
  };

  const parseNumber = (value: string): number | undefined => {
    const num = parseFloat(value);
    return isNaN(num) ? undefined : num;
  };

  // Convert and parse weight
  const parseWeight = (value: string): number | undefined => {
    const num = parseFloat(value);
    if (isNaN(num)) return undefined;
    return convertWeightForStorage(num, weightUnit);
  };

  // Convert and parse length
  const parseLength = (value: string): number | undefined => {
    const num = parseFloat(value);
    if (isNaN(num)) return undefined;
    return convertLengthForStorage(num, lengthUnit);
  };

  const parseTime = (timeStr: string): number | undefined => {
    if (!timeStr) return undefined;
    const parts = timeStr.split(":").map(Number);
    if (parts.some(isNaN)) return undefined;
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return undefined;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await createMeasurement({
        date: Date.now(),
        weight: parseWeight(weight),
        waistCirc: parseLength(waistCirc),
        neckCirc: parseLength(neckCirc),
        hipCirc: parseLength(hipCirc),
        skinfoldChest: parseNumber(skinfoldChest),
        skinfoldAxilla: parseNumber(skinfoldAxilla),
        skinfoldTricep: parseNumber(skinfoldTricep),
        skinfoldSubscapular: parseNumber(skinfoldSubscapular),
        skinfoldAbdominal: parseNumber(skinfoldAbdominal),
        skinfoldSuprailiac: parseNumber(skinfoldSuprailiac),
        skinfoldThigh: parseNumber(skinfoldThigh),
        skinfoldBicep: parseNumber(skinfoldBicep),
        upperArmCirc: parseNumber(upperArmCirc),
        chestCirc: parseNumber(chestCirc),
        time5k: parseTime(time5k),
        vo2max: parseNumber(vo2max),
      });

      // Save unit preferences if requested
      if (saveUnitsAsDefault && unitsChanged) {
        await updateUnitPreferences({ weightUnit, lengthUnit });
        toast.success("Measurement saved and unit preferences updated!");
      } else {
        toast.success("Measurement saved!");
      }

      setSaveUnitsAsDefault(false);

      // Clear form
      setWeight("");
      setWaistCirc("");
      setNeckCirc("");
      setHipCirc("");
      setSkinfoldChest("");
      setSkinfoldAxilla("");
      setSkinfoldTricep("");
      setSkinfoldSubscapular("");
      setSkinfoldAbdominal("");
      setSkinfoldSuprailiac("");
      setSkinfoldThigh("");
      setSkinfoldBicep("");
      setUpperArmCirc("");
      setChestCirc("");
      setTime5k("");
      setVo2max("");
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
              {/* Unit toggles */}
              <div className="flex flex-wrap gap-3 text-sm">
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground text-xs">Weight:</span>
                  <div className="inline-flex rounded-md border">
                    <button
                      type="button"
                      className={`px-2 py-0.5 text-xs ${weightUnit === "kg" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                      onClick={() => setWeightUnit("kg")}
                    >
                      kg
                    </button>
                    <button
                      type="button"
                      className={`px-2 py-0.5 text-xs ${weightUnit === "lbs" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                      onClick={() => setWeightUnit("lbs")}
                    >
                      lbs
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground text-xs">Length:</span>
                  <div className="inline-flex rounded-md border">
                    <button
                      type="button"
                      className={`px-2 py-0.5 text-xs ${lengthUnit === "cm" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                      onClick={() => setLengthUnit("cm")}
                    >
                      cm
                    </button>
                    <button
                      type="button"
                      className={`px-2 py-0.5 text-xs ${lengthUnit === "in" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                      onClick={() => setLengthUnit("in")}
                    >
                      in
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="weight">Weight ({weightUnit})</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    placeholder={weightUnit === "kg" ? "75.5" : "166.5"}
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="waistCirc">Waist ({lengthUnit})</Label>
                  <Input
                    id="waistCirc"
                    type="number"
                    step="0.1"
                    placeholder={lengthUnit === "cm" ? "80" : "31.5"}
                    value={waistCirc}
                    onChange={(e) => setWaistCirc(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="neckCirc">Neck ({lengthUnit})</Label>
                  <Input
                    id="neckCirc"
                    type="number"
                    step="0.1"
                    placeholder={lengthUnit === "cm" ? "38" : "15"}
                    value={neckCirc}
                    onChange={(e) => setNeckCirc(e.target.value)}
                  />
                </div>
                {userProfile?.sex === "female" && (
                  <div className="space-y-1">
                    <Label htmlFor="hipCirc">Hip ({lengthUnit})</Label>
                    <Input
                      id="hipCirc"
                      type="number"
                      step="0.1"
                      placeholder={lengthUnit === "cm" ? "95" : "37.5"}
                      value={hipCirc}
                      onChange={(e) => setHipCirc(e.target.value)}
                    />
                  </div>
                )}
              </div>
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
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="skinfoldChest">Chest</Label>
                  <Input
                    id="skinfoldChest"
                    type="number"
                    step="0.5"
                    value={skinfoldChest}
                    onChange={(e) => setSkinfoldChest(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="skinfoldAxilla">Axilla</Label>
                  <Input
                    id="skinfoldAxilla"
                    type="number"
                    step="0.5"
                    value={skinfoldAxilla}
                    onChange={(e) => setSkinfoldAxilla(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="skinfoldTricep">Tricep</Label>
                  <Input
                    id="skinfoldTricep"
                    type="number"
                    step="0.5"
                    value={skinfoldTricep}
                    onChange={(e) => setSkinfoldTricep(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="skinfoldBicep">Bicep</Label>
                  <Input
                    id="skinfoldBicep"
                    type="number"
                    step="0.5"
                    value={skinfoldBicep}
                    onChange={(e) => setSkinfoldBicep(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="skinfoldSubscapular">Subscapular</Label>
                  <Input
                    id="skinfoldSubscapular"
                    type="number"
                    step="0.5"
                    value={skinfoldSubscapular}
                    onChange={(e) => setSkinfoldSubscapular(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="skinfoldAbdominal">Abdominal</Label>
                  <Input
                    id="skinfoldAbdominal"
                    type="number"
                    step="0.5"
                    value={skinfoldAbdominal}
                    onChange={(e) => setSkinfoldAbdominal(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="skinfoldSuprailiac">Suprailiac</Label>
                  <Input
                    id="skinfoldSuprailiac"
                    type="number"
                    step="0.5"
                    value={skinfoldSuprailiac}
                    onChange={(e) => setSkinfoldSuprailiac(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="skinfoldThigh">Thigh</Label>
                  <Input
                    id="skinfoldThigh"
                    type="number"
                    step="0.5"
                    value={skinfoldThigh}
                    onChange={(e) => setSkinfoldThigh(e.target.value)}
                  />
                </div>
              </div>
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
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="upperArmCirc">Upper Arm</Label>
                  <Input
                    id="upperArmCirc"
                    type="number"
                    step="0.1"
                    value={upperArmCirc}
                    onChange={(e) => setUpperArmCirc(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="chestCirc">Chest</Label>
                  <Input
                    id="chestCirc"
                    type="number"
                    step="0.1"
                    value={chestCirc}
                    onChange={(e) => setChestCirc(e.target.value)}
                  />
                </div>
              </div>
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
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="time5k">5k Time (MM:SS)</Label>
                  <Input
                    id="time5k"
                    type="text"
                    placeholder="25:00"
                    value={time5k}
                    onChange={(e) => setTime5k(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="vo2max">VO2max</Label>
                  <Input
                    id="vo2max"
                    type="number"
                    step="0.1"
                    placeholder="45"
                    value={vo2max}
                    onChange={(e) => setVo2max(e.target.value)}
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Save unit preferences checkbox - only visible when units differ from profile */}
          {unitsChanged && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="saveUnitsQuick"
                checked={saveUnitsAsDefault}
                onCheckedChange={(checked) =>
                  setSaveUnitsAsDefault(checked === true)
                }
              />
              <Label htmlFor="saveUnitsQuick" className="text-sm font-normal">
                Save unit preferences as default
              </Label>
            </div>
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
