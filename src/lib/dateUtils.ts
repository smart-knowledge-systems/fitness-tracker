/**
 * Format a Date object as YYYY-MM-DD in local timezone.
 * Unlike toISOString().split("T")[0], this respects the user's local date.
 */
export function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Parse a YYYY-MM-DD string as local midnight and return timestamp.
 * Unlike new Date(str).getTime(), this interprets the date in local timezone.
 */
export function localDateStringToTimestamp(dateStr: string): number {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).getTime();
}

/**
 * Format timestamp as short date for chart axis labels (e.g., "Nov 15")
 */
export function formatShortDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/**
 * Format timestamp with abbreviated year for projected dates (e.g., "Nov 15, '24")
 */
export function formatDateWithYear(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "2-digit",
  });
}
