"use client";

import { createContext, use, useState, type ReactNode } from "react";

export type ElevationUnit = "ft" | "m";
export type PaceUnit = "km" | "mi";

interface GpxDisplayContextValue {
  elevationUnit: ElevationUnit;
  paceUnit: PaceUnit;
  setElevationUnit: (unit: ElevationUnit) => void;
  setPaceUnit: (unit: PaceUnit) => void;
}

const GpxDisplayContext = createContext<GpxDisplayContextValue | null>(null);

export function GpxDisplayProvider({ children }: { children: ReactNode }) {
  const [elevationUnit, setElevationUnit] = useState<ElevationUnit>("m");
  const [paceUnit, setPaceUnit] = useState<PaceUnit>("km");

  return (
    <GpxDisplayContext
      value={{ elevationUnit, paceUnit, setElevationUnit, setPaceUnit }}
    >
      {children}
    </GpxDisplayContext>
  );
}

export function useGpxDisplay(): GpxDisplayContextValue {
  const context = use(GpxDisplayContext);
  if (!context) {
    throw new Error("useGpxDisplay must be used within a GpxDisplayProvider");
  }
  return context;
}
