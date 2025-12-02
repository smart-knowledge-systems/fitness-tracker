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

export default function SettingsPage() {
  const userProfile = useQuery(api.userProfile.get);
  const upsertProfile = useMutation(api.userProfile.upsert);

  const [sex, setSex] = useState<"male" | "female">("male");
  const [birthDate, setBirthDate] = useState("");
  const [height, setHeight] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load existing profile data
  useEffect(() => {
    if (userProfile) {
      setSex(userProfile.sex);
      setBirthDate(new Date(userProfile.birthDate).toISOString().split("T")[0]);
      setHeight(userProfile.height.toString());
    }
  }, [userProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const heightNum = parseFloat(height);
    const birthDateTimestamp = new Date(birthDate).getTime();

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
        (Date.now() - new Date(birthDate).getTime()) /
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
            This app calculates body fat percentage using four different methods
            and averages the results:
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>
              <strong>Navy Method:</strong> Uses waist, neck, and height
              measurements (+ hip for women)
            </li>
            <li>
              <strong>Jackson-Pollock 7-site:</strong> Uses 7 skinfold
              measurements (chest, axilla, tricep, subscapular, abdominal,
              suprailiac, thigh)
            </li>
            <li>
              <strong>Jackson-Pollock 3-site:</strong> Uses 3 skinfold
              measurements (different sites for men and women)
            </li>
            <li>
              <strong>Durnin-Womersley:</strong> Uses 4 skinfold measurements
              (bicep, tricep, subscapular, suprailiac)
            </li>
          </ul>
          <p>
            The more measurements you provide, the more methods can be used and
            the more accurate the average will be.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
