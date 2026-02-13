"use client";

import { useEffect, useRef } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Theme = "light" | "dark" | "system";

export function ModeToggle() {
  const { setTheme } = useTheme();
  const { isAuthenticated } = useConvexAuth();
  const userProfile = useQuery(
    api.userProfile.get,
    isAuthenticated ? {} : "skip",
  );
  const updateTheme = useMutation(api.userProfile.updateTheme);
  const hasSyncedRef = useRef(false);

  // Sync theme from database once when profile first loads
  useEffect(() => {
    if (userProfile?.theme && !hasSyncedRef.current) {
      hasSyncedRef.current = true;
      setTheme(userProfile.theme);
    }
  }, [userProfile?.theme, setTheme]);

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    if (isAuthenticated && userProfile) {
      // Fire-and-forget: don't block UI for persistence
      updateTheme({ theme: newTheme }).catch(() => {
        // Revert on failure to keep client/server in sync
        if (userProfile.theme) {
          setTheme(userProfile.theme);
        }
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleThemeChange("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
