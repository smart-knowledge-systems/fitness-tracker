/**
 * Goal Pace Solver Module
 * Implements iterative algorithm to find the correct base pace that achieves target goal time
 * when adjusted for elevation changes using GAP calculations and altitude adjustments
 */

import { GPXParser } from "./gpxParser";
import {
  calcDeltaEC,
  lookupSpeed,
  formatTime,
  parseTime,
} from "./gapCalculations";
import { calculateAltitudePenalty } from "./altitudeAdjustment";

export interface DownhillAdjustment {
  startDistance: number;
  endDistance: number;
  grade: number;
  theoreticalSpeed: number;
  actualSpeed: number;
  speedReduction: number;
}

export interface ConvergenceStep {
  iteration: number;
  basePace: number;
  predictedTime: number;
  error: number;
  errorPercent: number;
}

export interface SolverResult {
  basePaceMs: number;
  basePaceMinPerKm: number;
  finalError: number;
  converged: boolean;
  iterations: number;
  convergenceHistory: ConvergenceStep[];
  predictedTime: number;
  downhillAdjustments: DownhillAdjustment[];
}

export class GoalPaceSolver {
  maxIterations: number = 20;
  tolerance: number = 1.0; // seconds tolerance
  downhillAdjustments: DownhillAdjustment[] = [];
  baselineElevation: number = 0; // Runner's training elevation in meters

  constructor(baselineElevation: number = 0) {
    this.baselineElevation = baselineElevation;
  }

  /**
   * Set the baseline elevation for altitude adjustments
   * @param elevation - Baseline training elevation in meters
   */
  setBaselineElevation(elevation: number): void {
    this.baselineElevation = elevation;
  }

  /**
   * Find the base pace (flat ground equivalent) needed to achieve goal time
   * @param gpxParser - Parsed GPX data
   * @param goalTimeSeconds - Target time in seconds
   * @param segmentLength - Length of calculation segments in meters (default 50m)
   * @returns Solver result with base pace and convergence info
   */
  findBasePaceForGoalTime(
    gpxParser: GPXParser,
    goalTimeSeconds: number,
    segmentLength: number = 50,
  ): SolverResult {
    console.log(`Solving for goal time: ${formatTime(goalTimeSeconds)}`);

    const totalDistance = gpxParser.totalDistance;

    // Initial guess: simple average pace
    const basePaceMinPerKm = goalTimeSeconds / 60 / (totalDistance / 1000);
    let basePaceMs = this.paceToSpeed(basePaceMinPerKm);

    let iteration = 0;
    let bestError = Infinity;
    let bestPace = basePaceMs;

    const convergenceHistory: ConvergenceStep[] = [];

    while (iteration < this.maxIterations) {
      // Calculate predicted time with current base pace
      const timeResult = this.calculateTotalTimeWithAdjustments(
        gpxParser,
        basePaceMs,
        segmentLength,
      );
      const predictedTime = timeResult.totalTime;

      const error = predictedTime - goalTimeSeconds;

      convergenceHistory.push({
        iteration,
        basePace: this.speedToPace(basePaceMs),
        predictedTime: predictedTime,
        error: error,
        errorPercent: (error / goalTimeSeconds) * 100,
      });

      console.log(
        `Iteration ${iteration}: Base pace ${this.speedToPace(basePaceMs).toFixed(2)} min/km, ` +
          `predicted ${formatTime(predictedTime)}, error ${error.toFixed(1)}s`,
      );

      // Track best result
      if (Math.abs(error) < Math.abs(bestError)) {
        bestError = error;
        bestPace = basePaceMs;
      }

      // Check convergence
      if (Math.abs(error) <= this.tolerance) {
        console.log(`Converged in ${iteration + 1} iterations`);
        break;
      }

      // Adjust base pace based on error
      if (error > 0) {
        // Too slow, increase speed (decrease pace)
        basePaceMs *= 1 + (Math.abs(error) / goalTimeSeconds) * 0.5;
      } else {
        // Too fast, decrease speed (increase pace)
        basePaceMs *= 1 - (Math.abs(error) / goalTimeSeconds) * 0.5;
      }

      // Sanity bounds - don't go below 2:30/km or above 12:00/km
      const minSpeed = this.paceToSpeed(12.0); // 12 min/km
      const maxSpeed = this.paceToSpeed(2.5); // 2.5 min/km
      basePaceMs = Math.max(minSpeed, Math.min(maxSpeed, basePaceMs));

      iteration++;
    }

    // Use best result if we didn't converge
    if (
      Math.abs(bestError) <
      Math.abs(convergenceHistory[convergenceHistory.length - 1].error)
    ) {
      basePaceMs = bestPace;
    }

    const finalResult = this.calculateTotalTimeWithAdjustments(
      gpxParser,
      basePaceMs,
      segmentLength,
    );

    // Store on instance for lapCalculator access
    this.downhillAdjustments = finalResult.adjustments;

    return {
      basePaceMs: basePaceMs,
      basePaceMinPerKm: this.speedToPace(basePaceMs),
      finalError: finalResult.totalTime - goalTimeSeconds,
      converged:
        Math.abs(finalResult.totalTime - goalTimeSeconds) <= this.tolerance,
      iterations: iteration,
      convergenceHistory: convergenceHistory,
      predictedTime: finalResult.totalTime,
      downhillAdjustments: finalResult.adjustments,
    };
  }

  /**
   * Calculate total time for a route given a base pace, collecting downhill adjustments.
   */
  private calculateTotalTimeWithAdjustments(
    gpxParser: GPXParser,
    basePaceMs: number,
    segmentLength: number,
  ): { totalTime: number; adjustments: DownhillAdjustment[] } {
    let totalTime = 0;
    let currentDistance = 0;
    const adjustments: DownhillAdjustment[] = [];

    while (currentDistance < gpxParser.totalDistance) {
      const segmentEnd = Math.min(
        currentDistance + segmentLength,
        gpxParser.totalDistance,
      );
      const actualSegmentLength = segmentEnd - currentDistance;

      if (actualSegmentLength <= 0) break;

      const averageGrade = gpxParser.getAverageGrade(
        currentDistance,
        segmentEnd,
      );
      const averageElevation = gpxParser.getAverageElevation(
        currentDistance,
        segmentEnd,
      );

      const result = this.applyGAPAdjustment(
        basePaceMs,
        averageGrade,
        averageElevation,
        currentDistance,
        segmentEnd,
      );

      totalTime += actualSegmentLength / result.speed;

      if (result.adjustment) {
        adjustments.push(result.adjustment);
      }

      currentDistance = segmentEnd;
    }

    return { totalTime, adjustments };
  }

  /**
   * Calculate total time for a route given a base pace
   * @param gpxParser - Parsed GPX data
   * @param basePaceMs - Base pace in m/s
   * @param segmentLength - Length of calculation segments in meters
   * @returns Total time in seconds
   */
  calculateTotalTime(
    gpxParser: GPXParser,
    basePaceMs: number,
    segmentLength: number = 50,
  ): number {
    return this.calculateTotalTimeWithAdjustments(
      gpxParser,
      basePaceMs,
      segmentLength,
    ).totalTime;
  }

  /**
   * Apply GAP and altitude adjustments to convert base pace to actual pace
   * @param basePaceMs - Base flat-ground pace in m/s
   * @param grade - Grade as decimal (0.05 = 5%)
   * @param segmentElevation - Average elevation of the segment in meters
   * @param segmentStart - Start distance of segment for tracking (meters)
   * @param segmentEnd - End distance of segment for tracking (meters)
   * @returns Adjusted speed and optional downhill adjustment record
   */
  applyGAPAdjustment(
    basePaceMs: number,
    grade: number,
    segmentElevation: number,
    segmentStart: number | null = null,
    segmentEnd: number | null = null,
  ): { speed: number; adjustment: DownhillAdjustment | null } {
    // Calculate expected energetic cost for flat ground at base pace
    let flatCr = lookupSpeed(basePaceMs, "energy_j_kg_m");
    if (isNaN(flatCr)) {
      flatCr = 4.0; // Reasonable default J/kg/m
    }

    // Calculate additional energetic cost due to grade
    const deltaCr = calcDeltaEC(grade);
    const totalCr = flatCr + deltaCr;

    // Get target metabolic power (what we want to maintain)
    let targetWkg = lookupSpeed(basePaceMs, "energy_j_kg_s");
    if (isNaN(targetWkg)) {
      targetWkg = flatCr * basePaceMs;
    }

    // Find speed that gives target metabolic power on this grade
    let actualSpeed = targetWkg / totalCr;

    if (!Number.isFinite(actualSpeed) || actualSpeed <= 0) {
      // Fallback to simple grade penalty
      const gradePenalty = Math.max(-0.5, Math.min(0.8, grade * 10));
      actualSpeed = basePaceMs * (1 - gradePenalty);
    }

    // Apply steep downhill speed limitations
    let adjustment: DownhillAdjustment | null = null;
    if (grade < -0.08) {
      const originalSpeed = actualSpeed;
      actualSpeed = this.applyDownhillSpeedCap(actualSpeed, basePaceMs, grade);

      if (
        segmentStart !== null &&
        segmentEnd !== null &&
        actualSpeed < originalSpeed
      ) {
        adjustment = {
          startDistance: segmentStart,
          endDistance: segmentEnd,
          grade: grade,
          theoreticalSpeed: originalSpeed,
          actualSpeed: actualSpeed,
          speedReduction: ((originalSpeed - actualSpeed) / originalSpeed) * 100,
        };
      }
    }

    // Apply altitude adjustment based on segment elevation vs baseline
    const altitudePenalty = calculateAltitudePenalty(
      segmentElevation,
      this.baselineElevation,
    );
    actualSpeed = actualSpeed / altitudePenalty;

    return { speed: actualSpeed, adjustment };
  }

  /**
   * Apply speed cap for steep downhills where theoretical GAP cannot be safely achieved
   * @param theoreticalSpeed - The speed calculated by pure GAP theory
   * @param basePaceMs - Base flat-ground pace in m/s
   * @param grade - Grade as decimal (negative for downhill)
   * @returns Speed capped for safety on steep downhills
   */
  applyDownhillSpeedCap(
    theoreticalSpeed: number,
    basePaceMs: number,
    grade: number,
  ): number {
    // Progressive limitation for downhills steeper than -8%
    const steepnessThreshold = -0.08; // -8% grade
    const maxSteepness = -0.25; // -25% grade where we apply maximum limitation

    if (grade >= steepnessThreshold) {
      return theoreticalSpeed; // No limitation needed
    }

    // Calculate limitation factor based on steepness
    const steepnessFactor = Math.max(
      0,
      (grade - steepnessThreshold) / (maxSteepness - steepnessThreshold),
    );
    const limitationFactor = 1.0 - steepnessFactor * 0.6; // Max 60% speed reduction

    // Calculate maximum safe speed as a multiple of base pace
    const maxSafeSpeed = basePaceMs * 1.5;

    // Apply the more restrictive of the two limitations
    const cappedSpeed = Math.min(
      theoreticalSpeed * limitationFactor,
      maxSafeSpeed,
    );

    // Ensure we don't go slower than base pace
    return Math.max(cappedSpeed, basePaceMs);
  }

  /**
   * Convert pace in min/km to speed in m/s
   */
  paceToSpeed(paceMinPerKm: number): number {
    return 1000 / (paceMinPerKm * 60);
  }

  /**
   * Convert speed in m/s to pace in min/km
   */
  speedToPace(speedMs: number): number {
    return 1000 / (speedMs * 60);
  }

  /**
   * Parse time string to seconds (delegating to gapCalculations)
   */
  parseTime(timeString: string): number {
    return parseTime(timeString);
  }

  /**
   * Format time in seconds (delegating to gapCalculations)
   */
  formatTime(timeSeconds: number): string {
    return formatTime(timeSeconds);
  }
}
