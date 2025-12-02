"use client";

import { useQuery } from "convex/react";
import { useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, TrendingDown, TrendingUp, Minus } from "lucide-react";
import Link from "next/link";
import { MeasurementQuickEntry } from "@/components/measurements/MeasurementQuickEntry";
import { averageBodyFat } from "@/lib/calculations";
import { convertWeightForDisplay, type WeightUnit } from "@/lib/unitConversion";

function StatCard({
  title,
  value,
  unit,
  change,
  loading,
}: {
  title: string;
  value: number | null | undefined;
  unit: string;
  change?: number | null;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>{title}</CardDescription>
          <Skeleton className="h-8 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-16" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl">
          {value !== null && value !== undefined ? (
            <>
              {value.toFixed(1)}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                {unit}
              </span>
            </>
          ) : (
            <span className="text-muted-foreground">--</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {change !== null && change !== undefined ? (
          <div className="flex items-center text-sm">
            {change > 0 ? (
              <TrendingUp className="mr-1 h-4 w-4 text-green-500" />
            ) : change < 0 ? (
              <TrendingDown className="mr-1 h-4 w-4 text-red-500" />
            ) : (
              <Minus className="mr-1 h-4 w-4 text-muted-foreground" />
            )}
            <span
              className={
                change > 0
                  ? "text-green-500"
                  : change < 0
                    ? "text-red-500"
                    : "text-muted-foreground"
              }
            >
              {change > 0 ? "+" : ""}
              {change.toFixed(1)} {unit}
            </span>
            <span className="ml-1 text-muted-foreground">from last</span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">
            No previous data
          </span>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const latestMeasurement = useQuery(api.measurements.getLatest);
  const measurements = useQuery(api.measurements.list, { limit: 10 });
  const userProfile = useQuery(api.userProfile.get);

  // Unit preference
  const weightUnit: WeightUnit = userProfile?.weightUnit ?? "kg";

  const isLoading =
    latestMeasurement === undefined || userProfile === undefined;

  // Capture current time once on mount for age calculation
  const [now] = useState(() => Date.now());

  // Calculate age from birth date
  const age = useMemo(() => {
    if (!userProfile?.birthDate) return 30;
    return Math.floor(
      (now - userProfile.birthDate) / (365.25 * 24 * 60 * 60 * 1000),
    );
  }, [userProfile?.birthDate, now]);

  // Calculate body fat from latest measurement
  const bodyFatResult = useMemo(() => {
    if (!latestMeasurement || !userProfile) return null;

    return averageBodyFat(
      {
        chest: latestMeasurement.skinfoldChest,
        axilla: latestMeasurement.skinfoldAxilla,
        tricep: latestMeasurement.skinfoldTricep,
        subscapular: latestMeasurement.skinfoldSubscapular,
        abdominal: latestMeasurement.skinfoldAbdominal,
        suprailiac: latestMeasurement.skinfoldSuprailiac,
        thigh: latestMeasurement.skinfoldThigh,
        bicep: latestMeasurement.skinfoldBicep,
      },
      {
        waist: latestMeasurement.waistCirc,
        neck: latestMeasurement.neckCirc,
        hip: latestMeasurement.hipCirc,
        height: latestMeasurement.height ?? userProfile.height,
      },
      age,
      userProfile.sex,
    );
  }, [latestMeasurement, userProfile, age]);

  // Calculate changes from previous measurement
  const { weightChange, bodyFatChange } = useMemo(() => {
    if (
      !measurements ||
      measurements.length < 2 ||
      !userProfile ||
      !latestMeasurement
    ) {
      return { weightChange: null, bodyFatChange: null };
    }

    const previous = measurements[1];
    const wChange =
      latestMeasurement.weight && previous.weight
        ? latestMeasurement.weight - previous.weight
        : null;

    const previousBodyFat = averageBodyFat(
      {
        chest: previous.skinfoldChest,
        axilla: previous.skinfoldAxilla,
        tricep: previous.skinfoldTricep,
        subscapular: previous.skinfoldSubscapular,
        abdominal: previous.skinfoldAbdominal,
        suprailiac: previous.skinfoldSuprailiac,
        thigh: previous.skinfoldThigh,
        bicep: previous.skinfoldBicep,
      },
      {
        waist: previous.waistCirc,
        neck: previous.neckCirc,
        hip: previous.hipCirc,
        height: previous.height ?? userProfile.height,
      },
      age,
      userProfile.sex,
    );

    const bfChange =
      bodyFatResult?.average && previousBodyFat.average
        ? bodyFatResult.average - previousBodyFat.average
        : null;

    return { weightChange: wChange, bodyFatChange: bfChange };
  }, [measurements, userProfile, latestMeasurement, age, bodyFatResult]);

  // Check if profile is incomplete
  const profileIncomplete = !userProfile;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Track your fitness measurements and progress
          </p>
        </div>
        <Button asChild>
          <Link href="/measurements">
            <Plus className="mr-2 h-4 w-4" />
            New Measurement
          </Link>
        </Button>
      </div>

      {profileIncomplete && !isLoading && (
        <Card className="border-amber-500/50 bg-amber-500/10">
          <CardHeader>
            <CardTitle className="text-lg">Complete Your Profile</CardTitle>
            <CardDescription>
              Set up your profile to enable accurate body fat calculations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/settings">Go to Settings</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Weight"
          value={
            latestMeasurement?.weight
              ? convertWeightForDisplay(latestMeasurement.weight, weightUnit)
              : null
          }
          unit={weightUnit}
          change={
            weightChange !== null
              ? convertWeightForDisplay(weightChange, weightUnit)
              : null
          }
          loading={isLoading}
        />
        <StatCard
          title="Body Fat"
          value={bodyFatResult?.average}
          unit="%"
          change={bodyFatChange}
          loading={isLoading}
        />
        <StatCard
          title="VO2max"
          value={latestMeasurement?.vo2max}
          unit="mL/kg/min"
          loading={isLoading}
        />
        <StatCard
          title="5k Time"
          value={
            latestMeasurement?.time5k ? latestMeasurement.time5k / 60 : null
          }
          unit="min"
          loading={isLoading}
        />
      </div>

      {/* Quick Entry and Recent */}
      <div className="grid gap-6 lg:grid-cols-2">
        <MeasurementQuickEntry />

        <Card>
          <CardHeader>
            <CardTitle>Recent Measurements</CardTitle>
            <CardDescription>Your last 5 entries</CardDescription>
          </CardHeader>
          <CardContent>
            {measurements === undefined ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : measurements.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No measurements yet. Add your first one!
              </p>
            ) : (
              <div className="space-y-2">
                {measurements.slice(0, 5).map((m) => (
                  <div
                    key={m._id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">
                        {new Date(m.date).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {m.weight
                          ? `${convertWeightForDisplay(m.weight, weightUnit)} ${weightUnit}`
                          : "No weight"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {m.skinfoldChest && (
                        <Badge variant="outline">Skinfolds</Badge>
                      )}
                      {m.time5k && <Badge variant="outline">5k</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Body Fat Breakdown */}
      {bodyFatResult &&
        (bodyFatResult.navy ||
          bodyFatResult.jp7 ||
          bodyFatResult.jp3 ||
          bodyFatResult.dw) && (
          <Card>
            <CardHeader>
              <CardTitle>Body Fat Estimates</CardTitle>
              <CardDescription>
                Comparison of different calculation methods
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {bodyFatResult.navy !== null && (
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">Navy Method</p>
                    <p className="text-2xl font-bold">
                      {bodyFatResult.navy.toFixed(1)}%
                    </p>
                  </div>
                )}
                {bodyFatResult.jp7 !== null && (
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">
                      Jackson-Pollock 7
                    </p>
                    <p className="text-2xl font-bold">
                      {bodyFatResult.jp7.toFixed(1)}%
                    </p>
                  </div>
                )}
                {bodyFatResult.jp3 !== null && (
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">
                      Jackson-Pollock 3
                    </p>
                    <p className="text-2xl font-bold">
                      {bodyFatResult.jp3.toFixed(1)}%
                    </p>
                  </div>
                )}
                {bodyFatResult.dw !== null && (
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">
                      Durnin-Womersley
                    </p>
                    <p className="text-2xl font-bold">
                      {bodyFatResult.dw.toFixed(1)}%
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
