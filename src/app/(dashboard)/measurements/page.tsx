"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { MeasurementForm } from "@/components/measurements/MeasurementForm";
import { averageBodyFat } from "@/lib/calculations";
import {
  convertWeightForDisplay,
  convertLengthForDisplay,
  type WeightUnit,
  type LengthUnit,
} from "@/lib/unitConversion";
import type { Id } from "@/convex/_generated/dataModel";

export default function MeasurementsPage() {
  const measurements = useQuery(api.measurements.list, { limit: 100 });
  const userProfile = useQuery(api.userProfile.get);
  const deleteMeasurement = useMutation(api.measurements.remove);

  // Unit preferences
  const weightUnit: WeightUnit = userProfile?.weightUnit ?? "kg";
  const lengthUnit: LengthUnit = userProfile?.lengthUnit ?? "cm";

  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteId, setDeleteId] = useState<Id<"measurements"> | null>(null);
  const [viewMeasurement, setViewMeasurement] = useState<
    NonNullable<typeof measurements>[number] | null
  >(null);

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteMeasurement({ id: deleteId });
      toast.success("Measurement deleted");
      setDeleteId(null);
    } catch (error) {
      toast.error("Failed to delete measurement");
      console.error(error);
    }
  };

  // Capture current time once on mount for age calculation
  const [now] = useState(() => Date.now());

  // Calculate age from birth date
  const age = useMemo(() => {
    if (!userProfile?.birthDate) return 30;
    return Math.floor(
      (now - userProfile.birthDate) / (365.25 * 24 * 60 * 60 * 1000),
    );
  }, [userProfile?.birthDate, now]);

  const calculateBodyFat = useCallback(
    (measurement: NonNullable<typeof measurements>[0]) => {
      if (!userProfile) return null;

      const result = averageBodyFat(
        {
          chest: measurement.skinfoldChest,
          axilla: measurement.skinfoldAxilla,
          tricep: measurement.skinfoldTricep,
          subscapular: measurement.skinfoldSubscapular,
          abdominal: measurement.skinfoldAbdominal,
          suprailiac: measurement.skinfoldSuprailiac,
          thigh: measurement.skinfoldThigh,
          bicep: measurement.skinfoldBicep,
        },
        {
          waist: measurement.waistCirc,
          neck: measurement.neckCirc,
          hip: measurement.hipCirc,
          height: measurement.height ?? userProfile.height,
        },
        age,
        userProfile.sex,
      );

      return result.average;
    },
    [userProfile, age],
  );

  const formatTime = (seconds: number | undefined) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Measurements</h1>
          <p className="text-muted-foreground">
            View and manage your fitness measurements
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Measurement
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Measurement History</CardTitle>
          <CardDescription>All your recorded measurements</CardDescription>
        </CardHeader>
        <CardContent>
          {measurements === undefined ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : measurements.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">
                No measurements yet. Click &quot;Add Measurement&quot; to get
                started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Body Fat</TableHead>
                    <TableHead>5k Time</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {measurements.map((m) => {
                    const bodyFat = calculateBodyFat(m);
                    const hasSkinfolds = m.skinfoldChest || m.skinfoldTricep;
                    const hasCircumferences = m.upperArmCirc || m.chestCirc;

                    return (
                      <TableRow key={m._id}>
                        <TableCell className="font-medium">
                          {new Date(m.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {m.weight
                            ? `${convertWeightForDisplay(m.weight, weightUnit)} ${weightUnit}`
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {bodyFat ? `${bodyFat.toFixed(1)}%` : "-"}
                        </TableCell>
                        <TableCell>{formatTime(m.time5k) ?? "-"}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {hasSkinfolds && (
                              <Badge variant="outline" className="text-xs">
                                Skinfolds
                              </Badge>
                            )}
                            {hasCircumferences && (
                              <Badge variant="outline" className="text-xs">
                                Circ
                              </Badge>
                            )}
                            {m.vo2max && (
                              <Badge variant="outline" className="text-xs">
                                VO2
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setViewMeasurement(m)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteId(m._id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Measurement Dialog */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Measurement</DialogTitle>
            <DialogDescription>
              Enter your measurement data below
            </DialogDescription>
          </DialogHeader>
          <MeasurementForm onSuccess={() => setShowAddForm(false)} />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Measurement</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this measurement? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Measurement Dialog */}
      <Dialog
        open={!!viewMeasurement}
        onOpenChange={() => setViewMeasurement(null)}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Measurement Details -{" "}
              {viewMeasurement &&
                new Date(viewMeasurement.date).toLocaleDateString()}
            </DialogTitle>
          </DialogHeader>
          {viewMeasurement && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <h4 className="mb-2 font-semibold">Core Metrics</h4>
                <dl className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Weight</dt>
                    <dd>
                      {viewMeasurement.weight
                        ? `${convertWeightForDisplay(viewMeasurement.weight, weightUnit)} ${weightUnit}`
                        : "-"}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Waist</dt>
                    <dd>
                      {viewMeasurement.waistCirc
                        ? `${convertLengthForDisplay(viewMeasurement.waistCirc, lengthUnit)} ${lengthUnit}`
                        : "-"}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Neck</dt>
                    <dd>
                      {viewMeasurement.neckCirc
                        ? `${convertLengthForDisplay(viewMeasurement.neckCirc, lengthUnit)} ${lengthUnit}`
                        : "-"}
                    </dd>
                  </div>
                </dl>
              </div>
              <div>
                <h4 className="mb-2 font-semibold">Skinfolds (mm)</h4>
                <dl className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Chest</dt>
                    <dd>{viewMeasurement.skinfoldChest ?? "-"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Tricep</dt>
                    <dd>{viewMeasurement.skinfoldTricep ?? "-"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Abdominal</dt>
                    <dd>{viewMeasurement.skinfoldAbdominal ?? "-"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Thigh</dt>
                    <dd>{viewMeasurement.skinfoldThigh ?? "-"}</dd>
                  </div>
                </dl>
              </div>
              <div>
                <h4 className="mb-2 font-semibold">Performance</h4>
                <dl className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">5k Time</dt>
                    <dd>{formatTime(viewMeasurement.time5k) ?? "-"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">VO2max</dt>
                    <dd>{viewMeasurement.vo2max ?? "-"}</dd>
                  </div>
                </dl>
              </div>
              <div>
                <h4 className="mb-2 font-semibold">Calculated</h4>
                <dl className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Body Fat</dt>
                    <dd>
                      {calculateBodyFat(viewMeasurement)?.toFixed(1) ?? "-"}%
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
