"use client";

import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import { useShooAuth } from "@/lib/shoo";
import { ReactNode } from "react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProviderWithAuth client={convex} useAuth={useShooAuth}>
      {children}
    </ConvexProviderWithAuth>
  );
}
