"""
Activities router.

Endpoints for syncing and retrieving running activities.
"""

import os
from pathlib import Path
from fastapi import APIRouter, HTTPException

from models.activity import (
    ActivitySummary,
    ActivityDetails,
    SyncResponse,
    GradeValue,
    SummaryMetrics,
    TimeSeriesDataPoint,
    Lap,
    CoachingInsights,
    FatigueComparison,
)
from services.garmin_sync import get_garmin_service, MFARequiredError
from services.fit_parser import parse_fit_file

router = APIRouter(prefix="/activities", tags=["activities"])


# MFA Response Models
from pydantic import BaseModel


class MFARequiredResponse(BaseModel):
    """Response when MFA is required."""
    mfa_required: bool = True
    message: str


class MFASubmitRequest(BaseModel):
    """Request to submit MFA code."""
    code: str


class MFASubmitResponse(BaseModel):
    """Response after MFA submission."""
    success: bool
    message: str


def get_cached_activities() -> list[ActivitySummary]:
    """Get list of activities from cached FIT files with parsed summary data."""
    fit_path = Path(os.environ.get("FIT_FILES_PATH", "/data/fit-files"))

    if not fit_path.exists():
        return []

    activities = []
    for fit_file in sorted(fit_path.glob("*.fit"), reverse=True):
        activity_id = fit_file.stem

        try:
            # Parse FIT file for summary data
            parsed = parse_fit_file(str(fit_file))
            summary = parsed.get("summary", {})

            activities.append(
                ActivitySummary(
                    id=activity_id,
                    activityName=summary.get("activityName", f"Run {activity_id}"),
                    startTime=summary.get("startTime", ""),
                    distanceKm=summary.get("totalDistance", 0) / 1000,
                    durationSeconds=int(summary.get("totalDuration", 0)),
                    fitFilePath=str(fit_file),
                    hasBeenAnalyzed=True,
                )
            )
        except Exception:
            # If parsing fails, add with minimal data
            activities.append(
                ActivitySummary(
                    id=activity_id,
                    activityName=f"Run {activity_id}",
                    startTime="",
                    distanceKm=0,
                    durationSeconds=0,
                    fitFilePath=str(fit_file),
                    hasBeenAnalyzed=False,
                )
            )

    return activities[:20]


@router.get("", response_model=list[ActivitySummary])
async def list_activities():
    """
    List all cached activities.

    Returns activities that have been synced and have FIT files available.
    Call POST /activities/sync first to fetch latest from Garmin.
    """
    return get_cached_activities()


@router.post("/sync")
async def sync_activities(count: int = 10):
    """
    Sync latest activities from Garmin Connect.

    Downloads FIT files for the most recent running activities.
    Returns 200 with mfa_required=true if MFA code is needed.
    """
    try:
        service = get_garmin_service()
        synced = service.sync_latest(count=count)

        return SyncResponse(
            synced=len(synced),
            activities=[ActivitySummary(**a) for a in synced],
            message=f"Successfully synced {len(synced)} activities",
        )
    except MFARequiredError as e:
        # Return 200 with MFA required flag (not an error, just needs input)
        return MFARequiredResponse(
            mfa_required=True,
            message=str(e.message),
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to sync with Garmin: {str(e)}",
        )


@router.post("/mfa", response_model=MFASubmitResponse)
async def submit_mfa(request: MFASubmitRequest):
    """
    Submit MFA code to complete Garmin authentication.

    Call this after /sync returns mfa_required=true.
    """
    try:
        service = get_garmin_service()
        service.submit_mfa(request.code)
        return MFASubmitResponse(
            success=True,
            message="MFA verified successfully. You can now sync activities.",
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"MFA failed: {str(e)}")


@router.get("/{activity_id}", response_model=ActivityDetails)
async def get_activity(activity_id: str):
    """
    Get full details for a specific activity.

    Parses the FIT file and returns running dynamics metrics with grades.
    """
    fit_path = Path(os.environ.get("FIT_FILES_PATH", "/data/fit-files"))
    fit_file = fit_path / f"{activity_id}.fit"

    if not fit_file.exists():
        raise HTTPException(status_code=404, detail="Activity not found")

    try:
        parsed = parse_fit_file(str(fit_file))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse FIT file: {e}")

    summary = parsed.get("summary", {})
    metrics = parsed.get("metrics", {})
    time_series = parsed.get("timeSeries", [])
    laps = parsed.get("laps", [])
    fatigue = parsed.get("fatigue", [])

    # Build summary metrics from parsed data
    summary_metrics = SummaryMetrics(
        avgCadence=GradeValue(
            value=metrics.get("avgCadence", {}).get("value", 0),
            grade=metrics.get("avgCadence", {}).get("grade", "B"),
        ),
        avgGct=GradeValue(
            value=metrics.get("avgGct", {}).get("value", 0),
            grade=metrics.get("avgGct", {}).get("grade", "B"),
        ),
        avgGctBalance=GradeValue(
            value=metrics.get("avgGctBalance", {}).get("value", 50),
            grade=metrics.get("avgGctBalance", {}).get("grade", "B"),
        ),
        avgVerticalRatio=GradeValue(
            value=metrics.get("avgVerticalRatio", {}).get("value", 0),
            grade=metrics.get("avgVerticalRatio", {}).get("grade", "B"),
        ),
        avgHeartRate=metrics.get("avgHeartRate", {}).get("value"),
        avgPace=summary.get("avgPace", 0),
    )

    # Convert time series to Pydantic models
    ts_points = [TimeSeriesDataPoint(**point) for point in time_series]

    # Convert laps to Pydantic models
    lap_models = [Lap(**lap) for lap in laps]

    # Generate coaching insights based on metrics
    coaching = generate_coaching_insights(metrics, fatigue)

    # Convert fatigue comparison
    fatigue_models = [FatigueComparison(**f) for f in fatigue]

    return ActivityDetails(
        id=activity_id,
        activityName=summary.get("activityName", f"Run {activity_id}"),
        startTime=summary.get("startTime", ""),
        distanceKm=summary.get("totalDistance", 0) / 1000,
        durationSeconds=int(summary.get("totalDuration", 0)),
        fitFilePath=str(fit_file),
        hasBeenAnalyzed=True,
        summaryMetrics=summary_metrics,
        timeSeries=ts_points,
        laps=lap_models,
        coaching=coaching,
        fatigueComparison=fatigue_models,
    )


def generate_coaching_insights(metrics: dict, fatigue: list) -> CoachingInsights:
    """Generate coaching insights from metrics and fatigue data."""
    well = []
    issues = []
    cue = "Focus on smooth, efficient running"

    # Analyze grades
    if metrics.get("avgCadence", {}).get("grade") in ["A", "B"]:
        well.append("Good cadence maintained throughout")
    else:
        issues.append("Cadence could be higher - aim for 180 spm")
        cue = "Quick feet, quick turnover"

    if metrics.get("avgGct", {}).get("grade") in ["A", "B"]:
        well.append("Efficient ground contact time")
    else:
        issues.append("Ground contact time is elevated - work on elastic recoil")
        cue = "Light and springy off the ground"

    gct_balance = metrics.get("avgGctBalance", {}).get("value", 50)
    if gct_balance and abs(gct_balance - 50) <= 2:
        well.append("Well-balanced GCT between legs")
    elif gct_balance:
        side = "left" if gct_balance > 50 else "right"
        issues.append(f"GCT imbalance detected - spending more time on {side} foot")

    if metrics.get("avgVerticalRatio", {}).get("grade") in ["A", "B"]:
        well.append("Good vertical efficiency")
    else:
        issues.append("Too much vertical bounce - focus on forward motion")
        cue = "Run tall, eyes forward"

    # Analyze fatigue
    for item in fatigue:
        if item.get("changeDirection") == "degraded":
            metric = item.get("metric", "")
            change = item.get("change", 0)
            issues.append(f"{metric} degraded by {abs(change):.1f}% in second half")

    # Build at-a-glance summary
    a_count = sum(
        1 for m in ["avgCadence", "avgGct", "avgGctBalance", "avgVerticalRatio"]
        if metrics.get(m, {}).get("grade") == "A"
    )
    if a_count >= 3:
        glance = "Excellent biomechanics - all systems firing well"
    elif a_count >= 2:
        glance = "Solid run with good form fundamentals"
    elif well:
        glance = "Room for improvement in running economy"
    else:
        glance = "Focus on form drills to improve efficiency"

    return CoachingInsights(
        atAGlance=glance,
        whatWentWell=well if well else ["Completed the run"],
        areasToAddress=issues if issues else ["Keep up the consistent training"],
        focusCue=cue,
    )
