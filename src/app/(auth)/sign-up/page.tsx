"use client";

import { SignUpForm } from "@/components/auth/SignUpForm";
import { useConvexAuth } from "convex/react";
import { redirect } from "next/navigation";
import { Activity } from "lucide-react";

export default function SignUpPage() {
  const { isAuthenticated, isLoading } = useConvexAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="mb-8 flex items-center gap-2 text-2xl font-bold">
          <Activity className="h-8 w-8" />
          <span>Fitness Tracker</span>
        </div>
        <div className="w-full max-w-sm animate-pulse space-y-4">
          <div className="h-10 rounded bg-muted" />
          <div className="h-10 rounded bg-muted" />
          <div className="h-10 rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="mb-8 flex items-center gap-2 text-2xl font-bold">
        <Activity className="h-8 w-8" />
        <span>Fitness Tracker</span>
      </div>
      <SignUpForm />
    </div>
  );
}
