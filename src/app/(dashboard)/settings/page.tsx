"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { toLocalDateString, localDateStringToTimestamp } from "@/lib/dateUtils";

export default function SettingsPage() {
  const userProfile = useQuery(api.userProfile.get);
  const upsertProfile = useMutation(api.userProfile.upsert);

  const [sex, setSex] = useState<"male" | "female">("male");
  const [race, setRace] = useState<"caucasian" | "black" | "not-set">(
    "not-set",
  );
  const [birthDate, setBirthDate] = useState("");
  const [height, setHeight] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load existing profile data
  useEffect(() => {
    if (userProfile) {
      setSex(userProfile.sex);
      setRace(userProfile.race ?? "not-set");
      setBirthDate(toLocalDateString(new Date(userProfile.birthDate)));
      setHeight(userProfile.height.toString());
    }
  }, [userProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const heightNum = parseFloat(height);
    const birthDateTimestamp = localDateStringToTimestamp(birthDate);

    if (isNaN(heightNum) || heightNum <= 0) {
      toast.error("Please enter a valid height");
      setIsSubmitting(false);
      return;
    }

    if (isNaN(birthDateTimestamp)) {
      toast.error("Please enter a valid birth date");
      setIsSubmitting(false);
      return;
    }

    try {
      await upsertProfile({
        sex,
        birthDate: birthDateTimestamp,
        height: heightNum,
        race: race === "not-set" ? undefined : race,
      });
      toast.success("Profile saved!");
    } catch (error) {
      toast.error("Failed to save profile");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const age = birthDate
    ? Math.floor(
        (Date.now() - localDateStringToTimestamp(birthDate)) /
          (365.25 * 24 * 60 * 60 * 1000),
      )
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your profile settings</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            This information is used for accurate body fat calculations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sex">Sex</Label>
                <Select
                  value={sex}
                  onValueChange={(value: "male" | "female") => setSex(value)}
                >
                  <SelectTrigger id="sex">
                    <SelectValue placeholder="Select sex" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Required for body fat formulas
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="race">Ethnicity (for body composition)</Label>
                <Select
                  value={race}
                  onValueChange={(value: "caucasian" | "black" | "not-set") =>
                    setRace(value)
                  }
                >
                  <SelectTrigger id="race">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not-set">Other / Not Set</SelectItem>
                    <SelectItem value="caucasian">Caucasian</SelectItem>
                    <SelectItem value="black">Black</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Used in some body fat calculators (Evans equations). These
                  options don&apos;t provide universal coverage.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  step="0.1"
                  placeholder="175"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Used for FFMI and Navy body fat
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthDate">Birth Date</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  required
                />
                {age !== null && age > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Age: {age} years
                  </p>
                )}
              </div>
            </div>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Profile"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>About Body Fat Calculations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            This app calculates body fat percentage using 10 validated methods
            and produces a weighted average based on a 2023 validation study.
            Most methods use skinfold measurements unless otherwise noted.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b">
                  <th className="pb-2 font-medium">Method</th>
                  <th className="pb-2 font-medium">Measurements</th>
                  <th className="pb-2 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="py-1.5">Navy</td>
                  <td className="py-1.5">
                    waist, neck, height (+hip for women)
                  </td>
                  <td className="py-1.5">Circumference</td>
                </tr>
                <tr>
                  <td className="py-1.5">Evans 3-site</td>
                  <td className="py-1.5">tricep, thigh, abdominal</td>
                  <td className="py-1.5">Requires ethnicity</td>
                </tr>
                <tr>
                  <td className="py-1.5">Evans 7-site</td>
                  <td className="py-1.5">all 7 skinfold sites</td>
                  <td className="py-1.5">Requires ethnicity</td>
                </tr>
                <tr>
                  <td className="py-1.5">Jackson-Pollock 7</td>
                  <td className="py-1.5">7 skinfolds</td>
                  <td className="py-1.5">—</td>
                </tr>
                <tr>
                  <td className="py-1.5">Jackson-Pollock 3</td>
                  <td className="py-1.5">3 skinfolds (varies by sex)</td>
                  <td className="py-1.5">—</td>
                </tr>
                <tr>
                  <td className="py-1.5">Durnin-Womersley</td>
                  <td className="py-1.5">
                    bicep, tricep, subscapular, suprailiac
                  </td>
                  <td className="py-1.5">—</td>
                </tr>
                <tr>
                  <td className="py-1.5">Lohman</td>
                  <td className="py-1.5">tricep, subscapular, abdominal</td>
                  <td className="py-1.5">—</td>
                </tr>
                <tr>
                  <td className="py-1.5">Katch</td>
                  <td className="py-1.5">tricep, subscapular, abdominal</td>
                  <td className="py-1.5">—</td>
                </tr>
                <tr>
                  <td className="py-1.5">Forsyth</td>
                  <td className="py-1.5">
                    subscapular, abdominal, tricep, midaxillary
                  </td>
                  <td className="py-1.5">—</td>
                </tr>
                <tr>
                  <td className="py-1.5">Thorland</td>
                  <td className="py-1.5">tricep, subscapular, midaxillary</td>
                  <td className="py-1.5">—</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="font-medium text-foreground">
            Weighting by Sex (from validation study)
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b">
                  <th className="pb-2 font-medium">Method</th>
                  <th className="pb-2 font-medium text-center">Female</th>
                  <th className="pb-2 font-medium text-center">Male</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="py-1.5">Evans 7-site</td>
                  <td className="py-1.5 text-center">35%</td>
                  <td className="py-1.5 text-center">10%</td>
                </tr>
                <tr>
                  <td className="py-1.5">Evans 3-site</td>
                  <td className="py-1.5 text-center">25%</td>
                  <td className="py-1.5 text-center">40%</td>
                </tr>
                <tr>
                  <td className="py-1.5">JP 3-site</td>
                  <td className="py-1.5 text-center">25%</td>
                  <td className="py-1.5 text-center">0%</td>
                </tr>
                <tr>
                  <td className="py-1.5">Forsyth</td>
                  <td className="py-1.5 text-center">10%</td>
                  <td className="py-1.5 text-center">0%</td>
                </tr>
                <tr>
                  <td className="py-1.5">Durnin-Womersley</td>
                  <td className="py-1.5 text-center">5%</td>
                  <td className="py-1.5 text-center">20%</td>
                </tr>
                <tr>
                  <td className="py-1.5">Lohman</td>
                  <td className="py-1.5 text-center">0%</td>
                  <td className="py-1.5 text-center">20%</td>
                </tr>
                <tr>
                  <td className="py-1.5">Katch</td>
                  <td className="py-1.5 text-center">0%</td>
                  <td className="py-1.5 text-center">5%</td>
                </tr>
                <tr>
                  <td className="py-1.5">Thorland</td>
                  <td className="py-1.5 text-center">0%</td>
                  <td className="py-1.5 text-center">5%</td>
                </tr>
                <tr>
                  <td className="py-1.5">JP 7-site</td>
                  <td className="py-1.5 text-center">0%</td>
                  <td className="py-1.5 text-center">0%</td>
                </tr>
                <tr>
                  <td className="py-1.5">Navy</td>
                  <td className="py-1.5 text-center">20%</td>
                  <td className="py-1.5 text-center">20%</td>
                </tr>
              </tbody>
            </table>
          </div>

          <ul className="list-disc list-inside space-y-1">
            <li>
              Evans formulas require ethnicity setting; otherwise excluded from
              average
            </li>
            <li>
              Methods with 0% weight diverged from criterion in validation study
            </li>
            <li>
              More measurements = more methods contribute = more accurate result
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
