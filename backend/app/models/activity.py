"""
Pydantic models for activity data.

These models define the API response shapes and are mirrored
in the mobile app's TypeScript types.
"""

from typing import Optional
from pydantic import BaseModel


class ActivitySummary(BaseModel):
    """Summary of an activity for list views."""

    id: str
    activityName: str
    startTime: str  # ISO 8601
    distanceKm: float
    durationSeconds: int
    fitFilePath: Optional[str] = None
    hasBeenAnalyzed: bool = False


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
    avgCadence: Optional[int] = None
    avgGct: Optional[int] = None
    avgHeartRate: Optional[int] = None


class CoachingInsights(BaseModel):
    """AI-generated coaching insights."""

    atAGlance: str
    whatWentWell: list[str]
    areasToAddress: list[str]
    focusCue: str


class ActivityDetails(ActivitySummary):
    """Full activity details with analysis."""

    summaryMetrics: SummaryMetrics
    timeSeries: list[TimeSeriesDataPoint]
    laps: list[Lap]
    coaching: CoachingInsights
