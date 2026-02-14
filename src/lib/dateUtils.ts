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
 * Returns NaN if the date string is malformed or has out-of-range components.
 */
export function localDateStringToTimestamp(dateStr: string): number {
  const parts = dateStr.split("-").map(Number);
  if (
    parts.length !== 3 ||
    parts.some(isNaN) ||
    parts[1] < 1 ||
    parts[1] > 12 ||
    parts[2] < 1 ||
    parts[2] > 31
  ) {
    return NaN;
  }
  const [year, month, day] = parts;
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
