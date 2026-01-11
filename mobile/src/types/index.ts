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

// Activity summary for list view
export interface ActivitySummary {
  id: string;
  startTime: string; // ISO 8601
  activityName: string;
  distanceKm: number;
  durationSeconds: number;
  // Optional grade summary for list view
  grades?: {
    cadence: Grade;
    gct: Grade;
    gctBalance: Grade;
    verticalRatio: Grade;
  };
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

// Workout step for compliance tracking
export interface WorkoutStep {
  stepName: string;
  targetPace?: number; // seconds per km
  actualPace?: number;
  status?: "hit" | "missed" | "close"; // ✓, ✗, ~
}

// Summary metrics with grades
export interface SummaryMetrics {
  avgCadence: number;
  cadenceGrade: Grade;
  avgGct: number;
  gctGrade: Grade;
  avgGctBalance: number;
  gctBalanceGrade: Grade;
  avgVerticalRatio: number;
  verticalRatioGrade: Grade;
  avgHeartRate?: number;
  avgPace: number;
  // HRM-600 specific
  avgSsl?: number;
  sslGrade?: Grade;
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
  workoutCompliance?: WorkoutStep[];
  fatigueComparison: FatigueComparison[];
  coaching: CoachingInsights;
  // Correlation data
  cadenceGctCorrelation?: number; // r-squared value
  hrPaceDecoupling?: number; // percentage
}
