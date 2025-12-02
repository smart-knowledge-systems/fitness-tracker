"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  WeightUnit,
  LengthUnit,
  convertWeightForStorage,
  convertLengthForStorage,
} from "@/lib/unitConversion";

interface MeasurementFormProps {
  onSuccess?: () => void;
}

export function MeasurementForm({ onSuccess }: MeasurementFormProps) {
  const createMeasurement = useMutation(api.measurements.create);
  const updateUnitPreferences = useMutation(
    api.userProfile.updateUnitPreferences,
  );
  const userProfile = useQuery(api.userProfile.get);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

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

  // Core metrics
  const [weight, setWeight] = useState("");
  const [waistCirc, setWaistCirc] = useState("");
  const [neckCirc, setNeckCirc] = useState("");
  const [hipCirc, setHipCirc] = useState("");
  const [height, setHeight] = useState("");

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
  const [lowerArmCirc, setLowerArmCirc] = useState("");
  const [thighCirc, setThighCirc] = useState("");
  const [calfCirc, setCalfCirc] = useState("");
  const [chestCirc, setChestCirc] = useState("");
  const [shoulderCirc, setShoulderCirc] = useState("");

  // Performance
  const [time5k, setTime5k] = useState("");
  const [time1k, setTime1k] = useState("");
  const [sKmAt129Bpm, setSKmAt129Bpm] = useState("");
  const [vo2max, setVo2max] = useState("");

  const parseNumber = (value: string): number | undefined => {
    const num = parseFloat(value);
    return isNaN(num) ? undefined : num;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Calculate L/min O2 from VO2max and weight
    const weightKg = parseWeight(weight);
    const vo2maxValue = parseNumber(vo2max);
    const calculatedLMinO2 =
      weightKg && vo2maxValue ? (vo2maxValue * weightKg) / 1000 : undefined;

    try {
      await createMeasurement({
        date: new Date(date).getTime(),
        weight: weightKg,
        waistCirc: parseLength(waistCirc),
        neckCirc: parseLength(neckCirc),
        hipCirc: parseLength(hipCirc),
        height: parseLength(height),
        skinfoldChest: parseNumber(skinfoldChest),
        skinfoldAxilla: parseNumber(skinfoldAxilla),
        skinfoldTricep: parseNumber(skinfoldTricep),
        skinfoldSubscapular: parseNumber(skinfoldSubscapular),
        skinfoldAbdominal: parseNumber(skinfoldAbdominal),
        skinfoldSuprailiac: parseNumber(skinfoldSuprailiac),
        skinfoldThigh: parseNumber(skinfoldThigh),
        skinfoldBicep: parseNumber(skinfoldBicep),
        upperArmCirc: parseNumber(upperArmCirc),
        lowerArmCirc: parseNumber(lowerArmCirc),
        thighCirc: parseNumber(thighCirc),
        calfCirc: parseNumber(calfCirc),
        chestCirc: parseNumber(chestCirc),
        shoulderCirc: parseNumber(shoulderCirc),
        time5k: parseTime(time5k),
        time1k: parseTime(time1k),
        lMinO2: calculatedLMinO2,
        sKmAt129Bpm: parseNumber(sKmAt129Bpm),
        vo2max: vo2maxValue,
      });

      // Save unit preferences if requested
      if (saveUnitsAsDefault && unitsChanged) {
        await updateUnitPreferences({ weightUnit, lengthUnit });
        toast.success("Measurement saved and unit preferences updated!");
      } else {
        toast.success("Measurement saved!");
      }

      setSaveUnitsAsDefault(false);
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
          {/* Unit toggles */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Weight:</span>
              <div className="inline-flex rounded-md border">
                <button
                  type="button"
                  className={`px-2 py-1 text-xs ${weightUnit === "kg" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                  onClick={() => setWeightUnit("kg")}
                >
                  kg
                </button>
                <button
                  type="button"
                  className={`px-2 py-1 text-xs ${weightUnit === "lbs" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                  onClick={() => setWeightUnit("lbs")}
                >
                  lbs
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Length:</span>
              <div className="inline-flex rounded-md border">
                <button
                  type="button"
                  className={`px-2 py-1 text-xs ${lengthUnit === "cm" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                  onClick={() => setLengthUnit("cm")}
                >
                  cm
                </button>
                <button
                  type="button"
                  className={`px-2 py-1 text-xs ${lengthUnit === "in" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                  onClick={() => setLengthUnit("in")}
                >
                  in
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
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
            <div className="space-y-2">
              <Label htmlFor="height">Height ({lengthUnit})</Label>
              <Input
                id="height"
                type="number"
                step="0.1"
                placeholder={
                  lengthUnit === "cm"
                    ? (userProfile?.height.toString() ?? "175")
                    : "69"
                }
                value={height}
                onChange={(e) => setHeight(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Leave blank to use profile height
              </p>
            </div>
            <div className="space-y-2">
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
            <div className="space-y-2">
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
              <div className="space-y-2">
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
        </TabsContent>

        <TabsContent value="skinfolds" className="space-y-4 pt-4">
          <p className="text-sm text-muted-foreground">
            All measurements in millimeters (mm)
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="skinfoldChest">Chest</Label>
              <Input
                id="skinfoldChest"
                type="number"
                step="0.5"
                value={skinfoldChest}
                onChange={(e) => setSkinfoldChest(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="skinfoldAxilla">Axilla</Label>
              <Input
                id="skinfoldAxilla"
                type="number"
                step="0.5"
                value={skinfoldAxilla}
                onChange={(e) => setSkinfoldAxilla(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="skinfoldTricep">Tricep</Label>
              <Input
                id="skinfoldTricep"
                type="number"
                step="0.5"
                value={skinfoldTricep}
                onChange={(e) => setSkinfoldTricep(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="skinfoldBicep">Bicep</Label>
              <Input
                id="skinfoldBicep"
                type="number"
                step="0.5"
                value={skinfoldBicep}
                onChange={(e) => setSkinfoldBicep(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="skinfoldSubscapular">Subscapular</Label>
              <Input
                id="skinfoldSubscapular"
                type="number"
                step="0.5"
                value={skinfoldSubscapular}
                onChange={(e) => setSkinfoldSubscapular(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="skinfoldAbdominal">Abdominal</Label>
              <Input
                id="skinfoldAbdominal"
                type="number"
                step="0.5"
                value={skinfoldAbdominal}
                onChange={(e) => setSkinfoldAbdominal(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="skinfoldSuprailiac">Suprailiac</Label>
              <Input
                id="skinfoldSuprailiac"
                type="number"
                step="0.5"
                value={skinfoldSuprailiac}
                onChange={(e) => setSkinfoldSuprailiac(e.target.value)}
              />
            </div>
            <div className="space-y-2">
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
        </TabsContent>

        <TabsContent value="circumferences" className="space-y-4 pt-4">
          <p className="text-sm text-muted-foreground">
            All measurements in centimeters (cm)
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="upperArmCirc">Upper Arm</Label>
              <Input
                id="upperArmCirc"
                type="number"
                step="0.1"
                value={upperArmCirc}
                onChange={(e) => setUpperArmCirc(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lowerArmCirc">Lower Arm</Label>
              <Input
                id="lowerArmCirc"
                type="number"
                step="0.1"
                value={lowerArmCirc}
                onChange={(e) => setLowerArmCirc(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chestCirc">Chest</Label>
              <Input
                id="chestCirc"
                type="number"
                step="0.1"
                value={chestCirc}
                onChange={(e) => setChestCirc(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shoulderCirc">Shoulder</Label>
              <Input
                id="shoulderCirc"
                type="number"
                step="0.1"
                value={shoulderCirc}
                onChange={(e) => setShoulderCirc(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="thighCirc">Thigh</Label>
              <Input
                id="thighCirc"
                type="number"
                step="0.1"
                value={thighCirc}
                onChange={(e) => setThighCirc(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="calfCirc">Calf</Label>
              <Input
                id="calfCirc"
                type="number"
                step="0.1"
                value={calfCirc}
                onChange={(e) => setCalfCirc(e.target.value)}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="time5k">5k Time (MM:SS)</Label>
              <Input
                id="time5k"
                type="text"
                placeholder="25:00"
                value={time5k}
                onChange={(e) => setTime5k(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time1k">1k Time (MM:SS)</Label>
              <Input
                id="time1k"
                type="text"
                placeholder="4:30"
                value={time1k}
                onChange={(e) => setTime1k(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vo2max">VO2max (mL/kg/min)</Label>
              <Input
                id="vo2max"
                type="number"
                step="0.1"
                placeholder="45"
                value={vo2max}
                onChange={(e) => setVo2max(e.target.value)}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="sKmAt129Bpm">s/km @ 129 bpm</Label>
              <Input
                id="sKmAt129Bpm"
                type="number"
                step="1"
                placeholder="360"
                value={sKmAt129Bpm}
                onChange={(e) => setSKmAt129Bpm(e.target.value)}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Save unit preferences checkbox - only visible when units differ from profile */}
      {unitsChanged && (
        <div className="flex items-center space-x-2">
          <Checkbox
            id="saveUnits"
            checked={saveUnitsAsDefault}
            onCheckedChange={(checked) =>
              setSaveUnitsAsDefault(checked === true)
            }
          />
          <Label htmlFor="saveUnits" className="text-sm font-normal">
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
  );
}
