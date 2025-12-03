"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery, useMutation } from "convex/react";
import {
  Activity,
  BarChart3,
  Calculator,
  Home,
  LogOut,
  Map,
  Settings,
  Target,
  Timer,
  Upload,
  User,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { api } from "@/convex/_generated/api";
import type { WeightUnit, LengthUnit } from "@/lib/unitConversion";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ModeToggle } from "@/components/mode-toggle";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const navigationItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: Home,
  },
  {
    title: "Measurements",
    href: "/measurements",
    icon: Activity,
  },
  {
    title: "Progress",
    href: "/progress",
    icon: BarChart3,
  },
  {
    title: "Goals",
    href: "/goals",
    icon: Target,
  },
];

const toolsItems = [
  {
    title: "GPX Pace Calculator",
    href: "/tools/gpx-calculator",
    icon: Map,
  },
  {
    title: "VO2max Test",
    href: "/tools/vo2max",
    icon: Calculator,
  },
  {
    title: "Race Time Calculator",
    href: "/tools/race-time-calculator",
    icon: Timer,
  },
  {
    title: "Import Data",
    href: "/tools/import",
    icon: Upload,
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut } = useAuthActions();
  const router = useRouter();
  const pathname = usePathname();

  const userProfile = useQuery(api.userProfile.get);
  const updateUnitPreferences = useMutation(
    api.userProfile.updateUnitPreferences,
  );

  const currentWeightUnit: WeightUnit = userProfile?.weightUnit ?? "kg";
  const currentLengthUnit: LengthUnit = userProfile?.lengthUnit ?? "cm";

  const handleWeightUnitChange = async (unit: WeightUnit) => {
    if (unit !== currentWeightUnit) {
      await updateUnitPreferences({ weightUnit: unit });
    }
  };

  const handleLengthUnitChange = async (unit: LengthUnit) => {
    if (unit !== currentLengthUnit) {
      await updateUnitPreferences({ lengthUnit: unit });
    }
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/welcome");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar>
          <SidebarHeader className="border-b px-6 py-4">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <Activity className="h-6 w-6" />
              <span>Fitness Tracker</span>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.href}
                      >
                        <Link href={item.href}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>Tools</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {toolsItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.href}
                      >
                        <Link href={item.href}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Display Units</SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="space-y-3 px-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Weight
                    </span>
                    <div className="flex rounded border overflow-hidden">
                      <button
                        type="button"
                        className={`px-2 py-1 text-xs transition-colors ${currentWeightUnit === "kg" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                        onClick={() => handleWeightUnitChange("kg")}
                      >
                        kg
                      </button>
                      <button
                        type="button"
                        className={`px-2 py-1 text-xs transition-colors ${currentWeightUnit === "lbs" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                        onClick={() => handleWeightUnitChange("lbs")}
                      >
                        lbs
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Length
                    </span>
                    <div className="flex rounded border overflow-hidden">
                      <button
                        type="button"
                        className={`px-2 py-1 text-xs transition-colors ${currentLengthUnit === "cm" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                        onClick={() => handleLengthUnitChange("cm")}
                      >
                        cm
                      </button>
                      <button
                        type="button"
                        className={`px-2 py-1 text-xs transition-colors ${currentLengthUnit === "in" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                        onClick={() => handleLengthUnitChange("in")}
                      >
                        in
                      </button>
                    </div>
                  </div>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="border-t p-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <span>Account</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <main className="flex-1">
          <header className="flex h-14 items-center gap-4 border-b bg-background px-6">
            <SidebarTrigger />
            <div className="ml-auto">
              <ModeToggle />
            </div>
          </header>
          <div className="p-6">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}
