"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Upload, FileText, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  WeightUnit,
  LengthUnit,
  convertWeightForStorage,
  convertLengthForStorage,
} from "@/lib/unitConversion";

// Expected CSV columns mapping
const COLUMN_MAP: Record<string, string> = {
  date: "date",
  weight: "weight",
  waist: "waistCirc",
  waist_circ: "waistCirc",
  waistcirc: "waistCirc",
  neck: "neckCirc",
  neck_circ: "neckCirc",
  neckcirc: "neckCirc",
  hip: "hipCirc",
  hip_circ: "hipCirc",
  hipcirc: "hipCirc",
  height: "height",
  chest: "skinfoldChest",
  skinfold_chest: "skinfoldChest",
  axilla: "skinfoldAxilla",
  skinfold_axilla: "skinfoldAxilla",
  tricep: "skinfoldTricep",
  skinfold_tricep: "skinfoldTricep",
  bicep: "skinfoldBicep",
  skinfold_bicep: "skinfoldBicep",
  subscapular: "skinfoldSubscapular",
  skinfold_subscapular: "skinfoldSubscapular",
  abdominal: "skinfoldAbdominal",
  skinfold_abdominal: "skinfoldAbdominal",
  suprailiac: "skinfoldSuprailiac",
  skinfold_suprailiac: "skinfoldSuprailiac",
  thigh: "skinfoldThigh",
  skinfold_thigh: "skinfoldThigh",
  upper_arm: "upperArmCirc",
  upperarm: "upperArmCirc",
  upper_arm_circ: "upperArmCirc",
  lower_arm: "lowerArmCirc",
  lowerarm: "lowerArmCirc",
  lower_arm_circ: "lowerArmCirc",
  thigh_circ: "thighCirc",
  thighcirc: "thighCirc",
  calf: "calfCirc",
  calf_circ: "calfCirc",
  calfcirc: "calfCirc",
  chest_circ: "chestCirc",
  chestcirc: "chestCirc",
  shoulder: "shoulderCirc",
  shoulder_circ: "shoulderCirc",
  shouldercirc: "shoulderCirc",
  time_5k: "time5k",
  time5k: "time5k",
  "5k_time": "time5k",
  time_1k: "time1k",
  time1k: "time1k",
  "1k_time": "time1k",
  l_min_o2: "lMinO2",
  lmino2: "lMinO2",
  vo2max: "vo2max",
  s_km_129bpm: "sKmAt129Bpm",
};

interface ParsedRow {
  date: number;
  [key: string]: number | undefined;
}

// Core metric fields that need unit conversion
const WEIGHT_FIELDS = ["weight"];
const LENGTH_FIELDS = ["waistCirc", "neckCirc", "hipCirc", "height"];

export default function ImportPage() {
  const importMeasurements = useMutation(api.import.importMeasurements);
  const updateUnitPreferences = useMutation(
    api.userProfile.updateUnitPreferences,
  );
  const userProfile = useQuery(api.userProfile.get);

  const [csvContent, setCsvContent] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [preview, setPreview] = useState<ParsedRow[]>([]);
  const [error, setError] = useState<string | null>(null);

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

  const parseCSV = (content: string): ParsedRow[] => {
    const lines = content.trim().split("\n");
    if (lines.length < 2)
      throw new Error("CSV must have a header and at least one data row");

    const headers = lines[0]
      .toLowerCase()
      .split(",")
      .map((h) => h.trim());
    const dateIndex = headers.findIndex((h) => h === "date");

    if (dateIndex === -1) {
      throw new Error("CSV must have a 'date' column");
    }

    const mappedHeaders = headers.map((h) => COLUMN_MAP[h] || h);
    const results: ParsedRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(",").map((v) => v.trim());
      const row: Record<string, number | undefined> = {};

      mappedHeaders.forEach((header, index) => {
        if (index < values.length && values[index]) {
          if (header === "date") {
            // Parse date
            const dateValue = Date.parse(values[index]);
            if (!isNaN(dateValue)) {
              row.date = dateValue;
            }
          } else if (header === "time5k" || header === "time1k") {
            // Parse time format MM:SS or HH:MM:SS
            const parts = values[index].split(":").map(Number);
            if (!parts.some(isNaN)) {
              if (parts.length === 2) {
                row[header] = parts[0] * 60 + parts[1];
              } else if (parts.length === 3) {
                row[header] = parts[0] * 3600 + parts[1] * 60 + parts[2];
              }
            }
          } else {
            // Parse number
            const num = parseFloat(values[index]);
            if (!isNaN(num)) {
              // Apply unit conversion for core metrics
              if (WEIGHT_FIELDS.includes(header)) {
                row[header] = convertWeightForStorage(num, weightUnit);
              } else if (LENGTH_FIELDS.includes(header)) {
                row[header] = convertLengthForStorage(num, lengthUnit);
              } else {
                row[header] = num;
              }
            }
          }
        }
      });

      if (row.date) {
        results.push(row as ParsedRow);
      }
    }

    return results;
  };

  const handlePreview = () => {
    setError(null);
    try {
      const parsed = parseCSV(csvContent);
      setPreview(parsed);
      toast.success(`Parsed ${parsed.length} rows`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to parse CSV");
      setPreview([]);
    }
  };

  const handleImport = async () => {
    if (preview.length === 0) {
      toast.error("No data to import");
      return;
    }

    setIsImporting(true);
    try {
      const result = await importMeasurements({
        measurements: preview,
      });

      // Save unit preferences if requested
      if (saveUnitsAsDefault && unitsChanged) {
        await updateUnitPreferences({ weightUnit, lengthUnit });
        toast.success(
          `Imported ${result.imported} measurements and updated unit preferences`,
        );
      } else {
        toast.success(`Imported ${result.imported} measurements`);
      }

      setSaveUnitsAsDefault(false);
      setCsvContent("");
      setPreview([]);
    } catch (e) {
      toast.error("Failed to import measurements");
      console.error(e);
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvContent(content);
      setPreview([]);
      setError(null);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Import Data</h1>
        <p className="text-muted-foreground">
          Import measurements from a CSV file
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>CSV Input</CardTitle>
            <CardDescription>
              Paste your CSV data or upload a file
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Unit toggles */}
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Weight:</span>
                <div className="inline-flex rounded-md border">
                  <button
                    type="button"
                    className={`px-2 py-1 text-xs ${weightUnit === "kg" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                    onClick={() => {
                      setWeightUnit("kg");
                      setPreview([]);
                    }}
                  >
                    kg
                  </button>
                  <button
                    type="button"
                    className={`px-2 py-1 text-xs ${weightUnit === "lbs" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                    onClick={() => {
                      setWeightUnit("lbs");
                      setPreview([]);
                    }}
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
                    onClick={() => {
                      setLengthUnit("cm");
                      setPreview([]);
                    }}
                  >
                    cm
                  </button>
                  <button
                    type="button"
                    className={`px-2 py-1 text-xs ${lengthUnit === "in" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                    onClick={() => {
                      setLengthUnit("in");
                      setPreview([]);
                    }}
                  >
                    in
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                className="relative"
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload File
              </Button>
              <input
                id="file-upload"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="csv">CSV Data</Label>
              <Textarea
                id="csv"
                placeholder="date,weight,waist,neck,chest,tricep,abdominal,thigh&#10;2024-01-15,75.5,82,38,8,10,15,12"
                value={csvContent}
                onChange={(e) => {
                  setCsvContent(e.target.value);
                  setPreview([]);
                  setError(null);
                }}
                className="min-h-[200px] font-mono text-sm"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            {/* Save unit preferences checkbox - only visible when units differ from profile */}
            {unitsChanged && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="saveUnitsImport"
                  checked={saveUnitsAsDefault}
                  onCheckedChange={(checked) =>
                    setSaveUnitsAsDefault(checked === true)
                  }
                />
                <Label
                  htmlFor="saveUnitsImport"
                  className="text-sm font-normal"
                >
                  Save unit preferences as default
                </Label>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handlePreview}
                disabled={!csvContent}
              >
                <FileText className="mr-2 h-4 w-4" />
                Preview
              </Button>
              <Button
                onClick={handleImport}
                disabled={preview.length === 0 || isImporting}
              >
                {isImporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Import {preview.length > 0 && `(${preview.length} rows)`}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expected Format</CardTitle>
            <CardDescription>
              Column names that will be recognized
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-medium">Required</h4>
                <p className="text-muted-foreground">date (YYYY-MM-DD)</p>
              </div>
              <div>
                <h4 className="font-medium">Core Metrics</h4>
                <p className="text-muted-foreground">
                  weight ({weightUnit}), waist ({lengthUnit}), neck (
                  {lengthUnit}), hip ({lengthUnit}), height ({lengthUnit})
                </p>
              </div>
              <div>
                <h4 className="font-medium">Skinfolds (mm)</h4>
                <p className="text-muted-foreground">
                  chest, axilla, tricep, bicep, subscapular, abdominal,
                  suprailiac, thigh
                </p>
              </div>
              <div>
                <h4 className="font-medium">Circumferences (cm)</h4>
                <p className="text-muted-foreground">
                  upper_arm, lower_arm, thigh_circ, calf, chest_circ, shoulder
                </p>
              </div>
              <div>
                <h4 className="font-medium">Performance</h4>
                <p className="text-muted-foreground">
                  time_5k (MM:SS), time_1k (MM:SS), vo2max (ml/kg/min)
                </p>
              </div>
              <div className="rounded-md bg-muted p-3">
                <p className="font-medium">Example CSV:</p>
                <pre className="mt-2 overflow-x-auto text-xs">
                  {weightUnit === "kg" && lengthUnit === "cm"
                    ? `date,weight,waist,neck,chest,tricep
2024-01-15,75.5,82,38,8,10
2024-01-22,75.0,81,38,7,9`
                    : weightUnit === "lbs" && lengthUnit === "in"
                      ? `date,weight,waist,neck,chest,tricep
2024-01-15,166.5,32.25,15,8,10
2024-01-22,165.3,31.9,15,7,9`
                      : weightUnit === "lbs"
                        ? `date,weight,waist,neck,chest,tricep
2024-01-15,166.5,82,38,8,10
2024-01-22,165.3,81,38,7,9`
                        : `date,weight,waist,neck,chest,tricep
2024-01-15,75.5,32.25,15,8,10
2024-01-22,75.0,31.9,15,7,9`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview Table */}
      {preview.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Preview ({preview.length} rows)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left font-medium">Date</th>
                    <th className="py-2 text-right font-medium">Weight</th>
                    <th className="py-2 text-right font-medium">Waist</th>
                    <th className="py-2 text-right font-medium">Neck</th>
                    <th className="py-2 text-right font-medium">Fields</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 10).map((row, i) => (
                    <tr key={i} className="border-b">
                      <td className="py-2">
                        {new Date(row.date).toLocaleDateString()}
                      </td>
                      <td className="py-2 text-right">{row.weight ?? "-"}</td>
                      <td className="py-2 text-right">
                        {row.waistCirc ?? "-"}
                      </td>
                      <td className="py-2 text-right">{row.neckCirc ?? "-"}</td>
                      <td className="py-2 text-right">
                        {
                          Object.keys(row).filter(
                            (k) => k !== "date" && row[k] !== undefined,
                          ).length
                        }
                      </td>
                    </tr>
                  ))}
                  {preview.length > 10 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-2 text-center text-muted-foreground"
                      >
                        ... and {preview.length - 10} more rows
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
