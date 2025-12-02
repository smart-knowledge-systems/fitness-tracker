/**
 * Lap Calculator Module
 * Generates lap splits accounting for elevation changes using GAP calculations
 */

import { GPXParser, RouteStats } from "./gpxParser";
import { GoalPaceSolver, SolverResult } from "./goalPaceSolver";
import { formatTime } from "./gapCalculations";

export interface LapSplit {
  lapNumber: number;
  startDistance: number;
  endDistance: number;
  lapDistance: number;
  lapTime: number;
  cumulativeTime: number;
  startElevation: number;
  endElevation: number;
  elevationChange: number;
  elevationGain: number;
  elevationLoss: number;
  averageGrade: number;
  averageElevation: number;
  averagePace: number; // min/km
  effortLevel: string;
  hasDownhillSpeedCap: boolean;
}

export interface RouteAnalysis {
  hardestLap: LapSplit;
  easiestLap: LapSplit;
  slowestLap: LapSplit;
  fastestLap: LapSplit;
  averagePace: number;
  paceVariation: number;
  totalClimbing: number;
  totalDescending: number;
  netElevationChange: number;
}

export interface LapCalculatorResult {
  goalTime: number;
  lapInterval: string;
  lapDistance: number;
  solverResult: SolverResult;
  lapSplits: LapSplit[];
  routeAnalysis: RouteAnalysis;
  routeStats: RouteStats;
}

export const LAP_DISTANCES: Record<string, number> = {
  "400m": 400,
  "1000m": 1000,
  "1km": 1000,
  "1mile": 1609.344,
  "5000m": 5000,
  "5km": 5000,
};

export class LapCalculator {
  private solver: GoalPaceSolver;

  constructor(solver: GoalPaceSolver) {
    this.solver = solver;
  }

  /**
   * Calculate lap splits for the route
   * @param gpxParser - Parsed GPX data
   * @param goalTimeSeconds - Target time in seconds
   * @param lapInterval - Lap interval ('400m', '1000m', '1mile', etc.)
   * @param segmentLength - Length of calculation segments in meters
   * @returns Lap splits and analysis data
   */
  calculateLapSplits(
    gpxParser: GPXParser,
    goalTimeSeconds: number,
    lapInterval: string,
    segmentLength: number = 50,
  ): LapCalculatorResult {
    console.log(`Calculating lap splits for ${lapInterval} intervals`);

    // Get lap distance
    const lapDistance = LAP_DISTANCES[lapInterval];
    if (!lapDistance) {
      throw new Error(`Unsupported lap interval: ${lapInterval}`);
    }

    // Solve for base pace
    const solverResult = this.solver.findBasePaceForGoalTime(
      gpxParser,
      goalTimeSeconds,
      segmentLength,
    );

    if (!solverResult.converged) {
      console.warn(
        `Solver did not converge. Final error: ${solverResult.finalError.toFixed(1)}s`,
      );
    }

    // Generate lap boundaries
    const lapBoundaries = gpxParser.generateLapBoundaries(lapDistance);

    // Calculate detailed splits
    const lapSplits = this.calculateDetailedSplits(
      gpxParser,
      lapBoundaries,
      solverResult.basePaceMs,
      segmentLength,
    );

    // Calculate route analysis
    const routeAnalysis = this.analyzeRoute(gpxParser, lapSplits);

    return {
      goalTime: goalTimeSeconds,
      lapInterval: lapInterval,
      lapDistance: lapDistance,
      solverResult: solverResult,
      lapSplits: lapSplits,
      routeAnalysis: routeAnalysis,
      routeStats: gpxParser.getRouteStats(),
    };
  }

  /**
   * Calculate detailed splits for each lap
   */
  private calculateDetailedSplits(
    gpxParser: GPXParser,
    lapBoundaries: Array<{
      lapNumber: number;
      distance: number;
      elevation: number;
    }>,
    basePaceMs: number,
    segmentLength: number,
  ): LapSplit[] {
    const splits: LapSplit[] = [];
    let cumulativeTime = 0;

    for (let i = 1; i < lapBoundaries.length; i++) {
      const lapStart = lapBoundaries[i - 1];
      const lapEnd = lapBoundaries[i];
      const lapDistance = lapEnd.distance - lapStart.distance;

      // Calculate time for this lap using fine segments
      const lapTime = this.calculateLapTime(
        gpxParser,
        lapStart.distance,
        lapEnd.distance,
        basePaceMs,
        segmentLength,
      );

      cumulativeTime += lapTime;

      // Calculate lap statistics
      const averageGrade = gpxParser.getAverageGrade(
        lapStart.distance,
        lapEnd.distance,
      );
      const averageElevation = gpxParser.getAverageElevation(
        lapStart.distance,
        lapEnd.distance,
      );
      const elevationChange = lapEnd.elevation - lapStart.elevation;
      const { gain: elevationGain, loss: elevationLoss } =
        this.calculateElevationGainLoss(
          gpxParser,
          lapStart.distance,
          lapEnd.distance,
        );

      const split: LapSplit = {
        lapNumber: i,
        startDistance: lapStart.distance,
        endDistance: lapEnd.distance,
        lapDistance: lapDistance,
        lapTime: lapTime,
        cumulativeTime: cumulativeTime,
        startElevation: lapStart.elevation,
        endElevation: lapEnd.elevation,
        elevationChange: elevationChange,
        elevationGain: elevationGain,
        elevationLoss: elevationLoss,
        averageGrade: averageGrade,
        averageElevation: averageElevation,
        averagePace: this.calculateAveragePace(lapDistance, lapTime),
        effortLevel: this.calculateEffortLevel(averageGrade),
        hasDownhillSpeedCap: this.checkForDownhillSpeedCap(
          lapStart.distance,
          lapEnd.distance,
        ),
      };

      splits.push(split);
    }

    return splits;
  }

  /**
   * Calculate time for a single lap segment
   */
  private calculateLapTime(
    gpxParser: GPXParser,
    startDistance: number,
    endDistance: number,
    basePaceMs: number,
    segmentLength: number,
  ): number {
    let totalTime = 0;
    let currentDistance = startDistance;

    while (currentDistance < endDistance) {
      const segmentEnd = Math.min(currentDistance + segmentLength, endDistance);
      const actualSegmentLength = segmentEnd - currentDistance;

      if (actualSegmentLength <= 0) break;

      // Get average grade and elevation for this segment
      const averageGrade = gpxParser.getAverageGrade(
        currentDistance,
        segmentEnd,
      );
      const averageElevation = gpxParser.getAverageElevation(
        currentDistance,
        segmentEnd,
      );

      // Apply GAP and altitude adjustments
      const adjustedSpeed = this.solver.applyGAPAdjustment(
        basePaceMs,
        averageGrade,
        averageElevation,
        currentDistance,
        segmentEnd,
      );

      // Calculate time for this segment
      const segmentTime = actualSegmentLength / adjustedSpeed;
      totalTime += segmentTime;

      currentDistance = segmentEnd;
    }

    return totalTime;
  }

  /**
   * Calculate elevation gain and loss within a distance range
   */
  private calculateElevationGainLoss(
    gpxParser: GPXParser,
    startDistance: number,
    endDistance: number,
  ): { gain: number; loss: number } {
    let totalGain = 0;
    let totalLoss = 0;

    for (const segment of gpxParser.segments) {
      if (
        segment.endDistance > startDistance &&
        segment.startDistance < endDistance
      ) {
        // Calculate overlap with our range
        const overlapStart = Math.max(segment.startDistance, startDistance);
        const overlapEnd = Math.min(segment.endDistance, endDistance);
        const overlapRatio =
          (overlapEnd - overlapStart) / segment.horizontalDistance;

        if (segment.elevationChange > 0) {
          totalGain += segment.elevationChange * overlapRatio;
        } else {
          totalLoss += Math.abs(segment.elevationChange) * overlapRatio;
        }
      }
    }

    return { gain: totalGain, loss: totalLoss };
  }

  /**
   * Calculate average pace for a lap
   * @returns Pace in minutes per kilometer
   */
  private calculateAveragePace(distance: number, time: number): number {
    return time / 60 / (distance / 1000);
  }

  /**
   * Calculate effort level based on grade
   */
  private calculateEffortLevel(grade: number): string {
    const gradePercent = grade * 100;

    if (gradePercent > 8) return "Very Hard";
    if (gradePercent > 4) return "Hard";
    if (gradePercent > 1) return "Moderate";
    if (gradePercent > -2) return "Easy";
    if (gradePercent > -5) return "Fast";
    return "Very Fast";
  }

  /**
   * Check if a lap segment contains any downhill speed cap adjustments
   */
  private checkForDownhillSpeedCap(
    startDistance: number,
    endDistance: number,
  ): boolean {
    if (
      !this.solver.downhillAdjustments ||
      this.solver.downhillAdjustments.length === 0
    ) {
      return false;
    }

    return this.solver.downhillAdjustments.some((adjustment) => {
      return (
        adjustment.startDistance < endDistance &&
        adjustment.endDistance > startDistance
      );
    });
  }

  /**
   * Analyze the route and provide insights
   */
  private analyzeRoute(
    gpxParser: GPXParser,
    lapSplits: LapSplit[],
  ): RouteAnalysis {
    const routeStats = gpxParser.getRouteStats();

    if (lapSplits.length === 0) {
      throw new Error("No lap splits to analyze");
    }

    // Find hardest and easiest laps
    let hardestLap = lapSplits[0];
    let easiestLap = lapSplits[0];
    let slowestLap = lapSplits[0];
    let fastestLap = lapSplits[0];

    for (const split of lapSplits) {
      if (split.averageGrade > hardestLap.averageGrade) hardestLap = split;
      if (split.averageGrade < easiestLap.averageGrade) easiestLap = split;
      if (split.averagePace > slowestLap.averagePace) slowestLap = split;
      if (split.averagePace < fastestLap.averagePace) fastestLap = split;
    }

    // Calculate pace variation
    const paces = lapSplits.map((s) => s.averagePace);
    const avgPace = paces.reduce((a, b) => a + b, 0) / paces.length;
    const paceVariation = Math.sqrt(
      paces.reduce((sum, pace) => sum + Math.pow(pace - avgPace, 2), 0) /
        paces.length,
    );

    return {
      hardestLap,
      easiestLap,
      slowestLap,
      fastestLap,
      averagePace: avgPace,
      paceVariation,
      totalClimbing: routeStats.totalElevationGain,
      totalDescending: routeStats.totalElevationLoss,
      netElevationChange: routeStats.netElevationChange,
    };
  }

  /**
   * Format time in seconds to MM:SS
   */
  formatTime(timeSeconds: number): string {
    const minutes = Math.floor(timeSeconds / 60);
    const seconds = Math.floor(timeSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  /**
   * Format cumulative time in seconds to MM:SS or HH:MM:SS
   */
  formatCumulativeTime(timeSeconds: number): string {
    return formatTime(timeSeconds);
  }

  /**
   * Format pace as MM:SS per unit
   */
  formatPace(paceMinPerUnit: number): string {
    const minutes = Math.floor(paceMinPerUnit);
    const seconds = Math.floor((paceMinPerUnit % 1) * 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  /**
   * Generate CSV export of lap splits
   */
  generateCSV(lapSplits: LapSplit[]): string {
    const headers = [
      "Lap",
      "Distance (m)",
      "Split Time",
      "Cumulative Time",
      "Pace (min/km)",
      "Elevation Change (m)",
      "Grade (%)",
      "Effort",
    ];

    let csv = headers.join(",") + "\n";

    for (const split of lapSplits) {
      const row = [
        split.lapNumber,
        split.endDistance.toFixed(0),
        this.formatTime(split.lapTime),
        this.formatCumulativeTime(split.cumulativeTime),
        split.averagePace.toFixed(2),
        split.elevationChange.toFixed(1),
        (split.averageGrade * 100).toFixed(1),
        split.effortLevel,
      ];
      csv += row.join(",") + "\n";
    }

    return csv;
  }
}
