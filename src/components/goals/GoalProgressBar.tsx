"use client";

import { cn } from "@/lib/utils";

interface GoalProgressBarProps {
  /** Progress percentage (0-100) */
  progress: number;
  /** Whether the goal is on track (affects color) */
  isOnTrack?: boolean;
  /** Optional class name */
  className?: string;
  /** Show percentage label */
  showLabel?: boolean;
}

export function GoalProgressBar({
  progress,
  isOnTrack = true,
  className,
  showLabel = false,
}: GoalProgressBarProps) {
  // Clamp progress to 0-100 for display
  const displayProgress = Math.min(100, Math.max(0, progress));

  // Determine color based on progress and on-track status
  const getProgressColor = () => {
    if (!isOnTrack) return "bg-yellow-500";
    if (displayProgress >= 100) return "bg-green-500";
    if (displayProgress >= 75) return "bg-green-500";
    if (displayProgress >= 50) return "bg-blue-500";
    if (displayProgress >= 25) return "bg-blue-400";
    return "bg-blue-300";
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={cn(
            "h-full transition-all duration-300 ease-in-out",
            getProgressColor(),
          )}
          style={{ width: `${displayProgress}%` }}
        />
      </div>
      {showLabel && (
        <p className="mt-1 text-right text-xs text-muted-foreground">
          {Math.round(progress)}%
        </p>
      )}
    </div>
  );
}
