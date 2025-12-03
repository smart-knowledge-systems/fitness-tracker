"use client";

import { useConvexAuth } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import {
  Activity,
  Target,
  Calculator,
  BarChart3,
  Scale,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ModeToggle } from "@/components/mode-toggle";

const features = [
  {
    icon: Scale,
    title: "Body Composition",
    description:
      "Track body fat with multiple calculation methods including Navy, Jackson-Pollock, and more.",
  },
  {
    icon: Target,
    title: "Goal Tracking",
    description:
      "Set fitness goals and monitor your progress with visual charts and insights.",
  },
  {
    icon: BarChart3,
    title: "Progress Analytics",
    description:
      "View trends over time with detailed charts showing your fitness journey.",
  },
  {
    icon: Calculator,
    title: "Fitness Calculators",
    description:
      "GPX race pace, Cooper test, and race time prediction tools at your fingertips.",
  },
  {
    icon: Timer,
    title: "Measurement History",
    description:
      "Keep a complete log of all your measurements with easy data entry.",
  },
  {
    icon: Activity,
    title: "Metric & Imperial",
    description: "Switch between kg/lbs and cm/in based on your preference.",
  },
];

export default function WelcomePage() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b px-4 md:px-6">
        <div className="flex items-center gap-2 font-semibold">
          <Activity className="h-6 w-6" />
          <span>Fitness Tracker</span>
        </div>
        <div className="flex items-center gap-2">
          <ModeToggle />
          <Button variant="ghost" asChild>
            <Link href="/sign-in">Sign In</Link>
          </Button>
          <Button asChild>
            <Link href="/sign-up">Get Started</Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center md:py-24">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="flex justify-center">
            <Activity className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            Track Your Fitness Journey
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground md:text-xl">
            Monitor your body composition, set goals, and track progress with
            powerful calculators and analytics. Your complete fitness companion.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" asChild>
              <Link href="/sign-up">Get Started Free</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/sign-in">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t bg-muted/50 px-4 py-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-3xl font-bold">
            Everything you need to track your fitness
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title}>
                <CardHeader>
                  <feature.icon className="mb-2 h-8 w-8 text-primary" />
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-4 py-6 text-center text-sm text-muted-foreground">
        <p>Fitness Tracker - Track your progress, achieve your goals.</p>
      </footer>
    </div>
  );
}
