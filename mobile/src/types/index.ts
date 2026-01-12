/**
 * Type definitions for Running Coach API
 * These mirror the Pydantic models in the backend
 */

// Health check response
export interface HealthCheck {
  status: "ok" | "error";
  fit_files_path: string;
  fit_files_accessible: boolean;
}

// MFA response when authentication needs a code
export interface MFARequiredResponse {
  mfa_required: true;
  message: string;
}

// MFA submission response
export interface MFASubmitResponse {
  success: boolean;
  message: string;
}

// Grade summary for activity cards
export interface GradeSummary {
  cadence: Grade;
  gct: Grade;
  gctBalance: Grade;
  verticalRatio: Grade;
}

// Activity summary for list view
export interface ActivitySummary {
  id: string;
  startTime: string; // ISO 8601
  activityName: string;
  distanceKm: number;
  durationSeconds: number;
  workoutName?: string; // Scheduled workout name if matched
  compliancePercent?: number; // Workout compliance if calculated
  grades?: GradeSummary; // Running dynamics grades
}

// Grade values
export type Grade = "A" | "B" | "C" | "D";

// Time series data point for charts
export interface TimeSeriesDataPoint {
  timestamp: number; // seconds from start
  heartRate?: number;
  cadence?: number;
  pace?: number; // seconds per km
  gct?: number; // ground contact time in ms
  gctBalance?: number; // percentage (50 = balanced)
  verticalRatio?: number; // percentage
  verticalOscillation?: number; // cm
  strideLength?: number; // meters
  power?: number; // watts
  ssl?: number; // step speed loss (HRM-600 only)
}

// Lap data
export interface Lap {
  lapNumber: number;
  startTime: number; // seconds from activity start
  distance: number; // meters
  duration: number; // seconds
  avgPace: number; // seconds per km
  avgCadence?: number;
  avgGct?: number;
  avgHeartRate?: number;
  intensity?: "Easy" | "Moderate" | "Tempo" | "Threshold" | "VO2max" | "Sprint";
}

// Step compliance for workout tracking
export interface StepCompliance {
  stepType: string;
  rawStepType?: string; // Original step type before formatting
  actualPace?: string;
  actualPaceSecKm?: number;
  actualDistanceM?: number;
  actualDurationSec?: number;
  targetPaceRange?: {
    slow: string;
    fast: string;
  };
  targetDistanceM?: number;
  targetDurationSec?: number;
  paceCompliance?: "hit" | "slow" | "fast" | "close";
  lapsUsed: number[]; // Lap numbers used for this step
  status: "hit" | "partial" | "missed" | "fast" | "no_target";
}

// Workout compliance summary
export interface WorkoutCompliance {
  workoutName: string;
  workoutDescription?: string;
  compliancePercent: number;
  stepsHit: number;
  stepsPartial: number;
  stepsMissed: number;
  totalSteps: number;
  distanceStatus?: "hit" | "short" | "long";
  targetDistanceM?: number;
  actualDistanceM?: number;
  stepBreakdown: StepCompliance[];
}

// Metric value with grade
export interface GradeValue {
  value: number;
  grade: Grade;
}

// Summary metrics with grades (matches backend)
export interface SummaryMetrics {
  avgCadence: GradeValue;
  avgGct: GradeValue;
  avgGctBalance: GradeValue;
  avgVerticalRatio: GradeValue;
  avgHeartRate?: number;
  avgPace: number;
}

// Fatigue comparison (first half vs second half)
export interface FatigueComparison {
  metric: string;
  firstHalf: number;
  secondHalf: number;
  change: number; // percentage change
  changeDirection: "improved" | "degraded" | "stable";
}

// Coaching insights
export interface CoachingInsights {
  atAGlance: string;
  whatWentWell: string[];
  areasToAddress: string[];
  focusCue: string;
}

// Full activity details
export interface ActivityDetails extends ActivitySummary {
  summaryMetrics: SummaryMetrics;
  timeSeries: TimeSeriesDataPoint[];
  laps: Lap[];
  workoutCompliance?: WorkoutCompliance;
  fatigueComparison: FatigueComparison[];
  coaching: CoachingInsights;
  hasRunningDynamics: boolean; // True if HRM-600 or similar pod detected
  // Correlation data
  cadenceGctCorrelation?: number; // r-squared value
  hrPaceDecoupling?: number; // percentage
}
