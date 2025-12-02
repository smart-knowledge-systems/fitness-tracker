/**
 * GPX Pace Calculator Module
 *
 * Combines Grade-Adjusted Pace (GAP) calculations from Minetti et al. 2002
 * with altitude adjustments to predict race splits on GPX routes.
 */

// Core GAP calculations
export {
  calcDeltaEC,
  lookupSpeed,
  getEquivFlatSpeed,
  calculateSpeedOnGrade,
  paceToSpeed,
  speedToPace,
  pacePerMileToSpeed,
  speedToPacePerMile,
  formatPace,
  formatTime,
  parseTime,
} from "./gapCalculations";

// Altitude adjustments
export {
  calculateAltitudePenalty,
  applyAltitudeToSpeed,
  calculateAltitudeTimePenalty,
  feetToMeters,
  metersToFeet,
  describeAltitudeImpact,
} from "./altitudeAdjustment";

// GPX Parser
export { GPXParser } from "./gpxParser";
export type { TrackPoint, Segment, LapBoundary, RouteStats } from "./gpxParser";

// Goal Pace Solver
export { GoalPaceSolver } from "./goalPaceSolver";
export type {
  DownhillAdjustment,
  ConvergenceStep,
  SolverResult,
} from "./goalPaceSolver";

// Lap Calculator
export { LapCalculator, LAP_DISTANCES } from "./lapCalculator";
export type {
  LapSplit,
  RouteAnalysis,
  LapCalculatorResult,
} from "./lapCalculator";
