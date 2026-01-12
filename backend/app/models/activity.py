"""
Pydantic models for activity data.

These models define the API response shapes and are mirrored
in the mobile app's TypeScript types.
"""

from typing import Optional
from pydantic import BaseModel


class GradeSummary(BaseModel):
    """Grade summary for list view badges."""

    cadence: str  # A, B, C, D
    gct: str
    gctBalance: str
    verticalRatio: str


class ActivitySummary(BaseModel):
    """Summary of an activity for list views."""

    id: str
    activityName: str
    startTime: str  # ISO 8601
    distanceKm: float
    durationSeconds: int
    fitFilePath: Optional[str] = None
    hasBeenAnalyzed: bool = False
    workoutName: Optional[str] = None  # Scheduled workout name if matched
    compliancePercent: Optional[int] = None  # Workout compliance if calculated
    grades: Optional[GradeSummary] = None  # Running dynamics grades


class SyncResponse(BaseModel):
    """Response from sync endpoint."""

    synced: int
    activities: list[ActivitySummary]
    message: str


class GradeValue(BaseModel):
    """A metric value with its grade."""

    value: float
    grade: str  # A, B, C, D


class SummaryMetrics(BaseModel):
    """Summary metrics with grades."""

    avgCadence: GradeValue
    avgGct: GradeValue
    avgGctBalance: GradeValue
    avgVerticalRatio: GradeValue
    avgHeartRate: Optional[float] = None
    avgPace: float  # seconds per km


class TimeSeriesDataPoint(BaseModel):
    """Single data point in time series."""

    timestamp: float  # seconds from start
    heartRate: Optional[int] = None
    cadence: Optional[int] = None
    pace: Optional[float] = None
    gct: Optional[int] = None
    gctBalance: Optional[float] = None
    verticalRatio: Optional[float] = None
    power: Optional[int] = None


class Lap(BaseModel):
    """Lap data."""

    lapNumber: int
    distance: float  # meters
    duration: float  # seconds
    avgPace: float  # seconds per km
    avgCadence: Optional[float] = None
    avgGct: Optional[float] = None
    avgHeartRate: Optional[float] = None


class CoachingInsights(BaseModel):
    """AI-generated coaching insights."""

    atAGlance: str
    whatWentWell: list[str]
    areasToAddress: list[str]
    focusCue: str


class FatigueComparison(BaseModel):
    """First half vs second half comparison."""

    metric: str
    firstHalf: float
    secondHalf: float
    change: float  # percentage change
    changeDirection: str  # improved, degraded, stable


class StepCompliance(BaseModel):
    """Compliance metrics for a single workout step."""

    stepType: str
    rawStepType: Optional[str] = None
    actualPace: Optional[str] = None
    actualPaceSecKm: Optional[int] = None
    actualDistanceM: Optional[int] = None
    actualDurationSec: Optional[int] = None
    targetPaceRange: Optional[dict] = None
    targetDistanceM: Optional[float] = None
    targetDurationSec: Optional[int] = None
    paceCompliance: Optional[str] = None  # hit, slow, fast, close
    lapsUsed: list[int] = []  # Lap numbers used for this step
    status: str  # hit, partial, missed, fast, no_target


class WorkoutCompliance(BaseModel):
    """Workout compliance summary."""

    workoutName: str
    workoutDescription: Optional[str] = None
    compliancePercent: int
    stepsHit: int
    stepsPartial: int
    stepsMissed: int = 0
    totalSteps: int
    distanceStatus: Optional[str] = None
    targetDistanceM: Optional[float] = None
    actualDistanceM: Optional[int] = None
    stepBreakdown: list[StepCompliance] = []


class ActivityDetails(ActivitySummary):
    """Full activity details with analysis."""

    summaryMetrics: SummaryMetrics
    timeSeries: list[TimeSeriesDataPoint]
    laps: list[Lap]
    coaching: CoachingInsights
    fatigueComparison: list[FatigueComparison] = []
    workoutCompliance: Optional[WorkoutCompliance] = None
    hasRunningDynamics: bool = False  # True if HRM-600 or similar pod detected
