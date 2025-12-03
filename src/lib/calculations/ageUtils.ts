/**
 * Age calculation utilities.
 * Centralizes age calculation logic used across the application.
 */

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;
const DEFAULT_AGE = 30;

/**
 * Calculate age from a birth date timestamp.
 * @param birthDate - Birth date as Unix timestamp (milliseconds)
 * @param referenceDate - Date to calculate age at (defaults to now)
 * @returns Age in years, or DEFAULT_AGE (30) if birthDate is undefined
 */
export function calculateAge(
  birthDate: number | undefined | null,
  referenceDate: number = Date.now(),
): number {
  if (birthDate == null) return DEFAULT_AGE;
  return Math.floor((referenceDate - birthDate) / MS_PER_YEAR);
}

/**
 * Calculate age at a specific measurement date.
 * Useful for historical calculations where the reference date matters.
 * @param birthDate - Birth date as Unix timestamp (milliseconds)
 * @param measurementDate - Date of the measurement (milliseconds)
 * @returns Age in years at the measurement date
 */
export function calculateAgeAtDate(
  birthDate: number,
  measurementDate: number,
): number {
  return Math.floor((measurementDate - birthDate) / MS_PER_YEAR);
}
