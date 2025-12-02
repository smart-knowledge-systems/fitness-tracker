"use client";

import { useState, useMemo } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  cooperTestVO2max,
  cooperTestDistance,
  classifyCooperTest,
  vo2maxFrom5k,
  vo2maxFrom1k,
} from "@/lib/calculations";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function CooperTestPage() {
  const userProfile = useQuery(api.userProfile.get);

  // Cooper Test calculator
  const [distance, setDistance] = useState("");
  const [cooperResult, setCooperResult] = useState<{
    vo2max: number;
    classification: string;
  } | null>(null);

  // Reverse calculator
  const [targetVo2max, setTargetVo2max] = useState("");
  const [requiredDistance, setRequiredDistance] = useState<number | null>(null);

  // Race time calculators
  const [time5k, setTime5k] = useState("");
  const [time1k, setTime1k] = useState("");
  const [raceVo2max5k, setRaceVo2max5k] = useState<number | null>(null);
  const [raceVo2max1k, setRaceVo2max1k] = useState<number | null>(null);

  // Log result state
  const [logDate, setLogDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [saved, setSaved] = useState(false);
  const createMeasurement = useMutation(api.measurements.create);

  // Capture current time once on mount for age calculation
  const [now] = useState(() => Date.now());

  const age = useMemo(() => {
    if (!userProfile?.birthDate) return 30;
    return Math.floor(
      (now - userProfile.birthDate) / (365.25 * 24 * 60 * 60 * 1000),
    );
  }, [userProfile?.birthDate, now]);
  const sex = userProfile?.sex ?? "male";

  const calculateCooper = () => {
    const dist = parseFloat(distance);
    if (isNaN(dist) || dist <= 0) return;

    const vo2max = cooperTestVO2max(dist);
    const classification = classifyCooperTest(vo2max, age, sex);
    setCooperResult({ vo2max, classification });
  };

  const calculateRequiredDistance = () => {
    const target = parseFloat(targetVo2max);
    if (isNaN(target) || target <= 0) return;

    const dist = cooperTestDistance(target);
    setRequiredDistance(dist);
  };

  const calculate5kVo2max = () => {
    const parts = time5k.split(":").map(Number);
    if (parts.some(isNaN)) return;

    let seconds: number;
    if (parts.length === 2) {
      seconds = parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
      seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else {
      return;
    }

    setRaceVo2max5k(vo2maxFrom5k(seconds));
  };

  const calculate1kVo2max = () => {
    const parts = time1k.split(":").map(Number);
    if (parts.some(isNaN)) return;

    let seconds: number;
    if (parts.length === 2) {
      seconds = parts[0] * 60 + parts[1];
    } else {
      return;
    }

    setRaceVo2max1k(vo2maxFrom1k(seconds));
  };

  const parseTimeToSeconds = (time: string): number | undefined => {
    const parts = time.split(":").map(Number);
    if (parts.some(isNaN)) return undefined;
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return undefined;
  };

  const logVo2max = async (
    vo2max: number,
    options?: { time5k?: string; time1k?: string },
  ) => {
    await createMeasurement({
      date: new Date(logDate).getTime(),
      vo2max,
      time5k: options?.time5k ? parseTimeToSeconds(options.time5k) : undefined,
      time1k: options?.time1k ? parseTimeToSeconds(options.time1k) : undefined,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">VO2max Test Calculator</h1>
        <p className="text-muted-foreground">
          Calculate VO2max from the Cooper Test or race times
        </p>
      </div>

      <Tabs defaultValue="cooper" className="max-w-2xl">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="cooper">Cooper Test</TabsTrigger>
          <TabsTrigger value="reverse">Target Distance</TabsTrigger>
          <TabsTrigger value="race">Race Times</TabsTrigger>
        </TabsList>

        <TabsContent value="cooper">
          <Card>
            <CardHeader>
              <CardTitle>12-Minute Run Test</CardTitle>
              <CardDescription>
                Enter the distance you ran in 12 minutes to estimate your VO2max
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="distance">Distance (meters)</Label>
                <Input
                  id="distance"
                  type="number"
                  placeholder="2400"
                  value={distance}
                  onChange={(e) => {
                    setDistance(e.target.value);
                    setCooperResult(null);
                  }}
                />
              </div>
              <Button onClick={calculateCooper} className="w-full">
                Calculate VO2max
              </Button>
              {cooperResult && (
                <div className="rounded-lg bg-muted p-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    Estimated VO2max
                  </p>
                  <p className="text-4xl font-bold">
                    {cooperResult.vo2max}{" "}
                    <span className="text-lg font-normal text-muted-foreground">
                      mL/kg/min
                    </span>
                  </p>
                  <p className="mt-2 text-lg font-medium">
                    {cooperResult.classification}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Classification for {age} year old {sex}
                  </p>
                  <div className="mt-4 flex items-end gap-2">
                    <div className="flex-1 space-y-1">
                      <Label htmlFor="cooperLogDate">Date</Label>
                      <Input
                        id="cooperLogDate"
                        type="date"
                        value={logDate}
                        onChange={(e) => setLogDate(e.target.value)}
                      />
                    </div>
                    <Button onClick={() => logVo2max(cooperResult.vo2max)}>
                      Log Result
                    </Button>
                    {saved && (
                      <span className="text-sm text-green-600">Saved!</span>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reverse">
          <Card>
            <CardHeader>
              <CardTitle>Target Distance Calculator</CardTitle>
              <CardDescription>
                Find out how far you need to run in 12 minutes for a target
                VO2max
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="targetVo2max">Target VO2max (mL/kg/min)</Label>
                <Input
                  id="targetVo2max"
                  type="number"
                  placeholder="45"
                  value={targetVo2max}
                  onChange={(e) => {
                    setTargetVo2max(e.target.value);
                    setRequiredDistance(null);
                  }}
                />
              </div>
              <Button onClick={calculateRequiredDistance} className="w-full">
                Calculate Distance
              </Button>
              {requiredDistance && (
                <div className="rounded-lg bg-muted p-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    Required Distance
                  </p>
                  <p className="text-4xl font-bold">
                    {requiredDistance}{" "}
                    <span className="text-lg font-normal text-muted-foreground">
                      meters
                    </span>
                  </p>
                  <p className="mt-2 text-muted-foreground">
                    {(requiredDistance / 1000).toFixed(2)} km in 12 minutes
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="race">
          <Card>
            <CardHeader>
              <CardTitle>Race Time to VO2max</CardTitle>
              <CardDescription>
                Estimate VO2max from your race times
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="time5k">5k Time (MM:SS or HH:MM:SS)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="time5k"
                      type="text"
                      placeholder="25:00"
                      value={time5k}
                      onChange={(e) => {
                        setTime5k(e.target.value);
                        setRaceVo2max5k(null);
                      }}
                    />
                    <Button onClick={calculate5kVo2max}>Calculate</Button>
                  </div>
                  {raceVo2max5k && (
                    <div className="space-y-2">
                      <p className="text-lg font-medium">
                        VO2max: {raceVo2max5k} mL/kg/min
                      </p>
                      <div className="flex items-end gap-2">
                        <div className="flex-1 space-y-1">
                          <Label htmlFor="race5kLogDate">Date</Label>
                          <Input
                            id="race5kLogDate"
                            type="date"
                            value={logDate}
                            onChange={(e) => setLogDate(e.target.value)}
                          />
                        </div>
                        <Button
                          onClick={() => logVo2max(raceVo2max5k, { time5k })}
                        >
                          Log Result
                        </Button>
                        {saved && (
                          <span className="text-sm text-green-600">Saved!</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time1k">1k Time (MM:SS)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="time1k"
                      type="text"
                      placeholder="4:30"
                      value={time1k}
                      onChange={(e) => {
                        setTime1k(e.target.value);
                        setRaceVo2max1k(null);
                      }}
                    />
                    <Button onClick={calculate1kVo2max}>Calculate</Button>
                  </div>
                  {raceVo2max1k && (
                    <div className="space-y-2">
                      <p className="text-lg font-medium">
                        VO2max: {raceVo2max1k} mL/kg/min
                      </p>
                      <div className="flex items-end gap-2">
                        <div className="flex-1 space-y-1">
                          <Label htmlFor="race1kLogDate">Date</Label>
                          <Input
                            id="race1kLogDate"
                            type="date"
                            value={logDate}
                            onChange={(e) => setLogDate(e.target.value)}
                          />
                        </div>
                        <Button
                          onClick={() => logVo2max(raceVo2max1k, { time1k })}
                        >
                          Log Result
                        </Button>
                        {saved && (
                          <span className="text-sm text-green-600">Saved!</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reference Table */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>VO2max Classification Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2 text-left font-medium">Classification</th>
                  <th className="py-2 text-right font-medium">Men (20-29)</th>
                  <th className="py-2 text-right font-medium">Women (20-29)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2">Superior</td>
                  <td className="py-2 text-right">&gt; 60</td>
                  <td className="py-2 text-right">&gt; 49</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Excellent</td>
                  <td className="py-2 text-right">53-60</td>
                  <td className="py-2 text-right">43-49</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Good</td>
                  <td className="py-2 text-right">43-52</td>
                  <td className="py-2 text-right">37-42</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Fair</td>
                  <td className="py-2 text-right">34-42</td>
                  <td className="py-2 text-right">31-36</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Poor</td>
                  <td className="py-2 text-right">25-33</td>
                  <td className="py-2 text-right">24-30</td>
                </tr>
                <tr>
                  <td className="py-2">Very Poor</td>
                  <td className="py-2 text-right">&lt; 25</td>
                  <td className="py-2 text-right">&lt; 24</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
