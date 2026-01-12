"""
Activities router.

Endpoints for syncing and retrieving running activities.
"""

import json
import os
import shutil
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, HTTPException, Header, Response

from dependencies.auth import decode_tokens_to_dir
from models.activity import (
    ActivitySummary,
    ActivityDetails,
    SyncResponse,
    GradeValue,
    GradeSummary,
    SummaryMetrics,
    TimeSeriesDataPoint,
    Lap,
    CoachingInsights,
    FatigueComparison,
    WorkoutCompliance,
    StepCompliance,
)
from services.garmin_sync import get_garmin_service, MFARequiredError
from services.fit_parser import parse_fit_file
from services.workout_compliance import calculate_workout_compliance

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


def get_compliance_cache_path(fit_path: Path) -> Path:
    """Get path for cached compliance data."""
    return fit_path.with_suffix(".compliance.json")


def load_cached_compliance(fit_path: Path) -> Optional[dict]:
    """Load cached compliance data if available."""
    cache_path = get_compliance_cache_path(fit_path)
    if cache_path.exists():
        try:
            with open(cache_path) as f:
                return json.load(f)
        except Exception:
            pass
    return None


def save_compliance_cache(fit_path: Path, compliance: dict):
    """Save compliance data to cache."""
    cache_path = get_compliance_cache_path(fit_path)
    try:
        with open(cache_path, "w") as f:
            json.dump(compliance, f)
    except Exception as e:
        print(f"Failed to cache compliance: {e}")


def extract_garmin_id(filename: str) -> str:
    """Extract the Garmin activity ID from a filename.

    Handles both formats:
    - Descriptive: 2026-01-08_New_York_-_Quality_Session_21487950438
    - ID only: 21487950438
    """
    # If it's all digits, it's the ID
    if filename.isdigit():
        return filename
    # Otherwise, the ID is the last underscore-separated segment
    parts = filename.split("_")
    if parts and parts[-1].isdigit():
        return parts[-1]
    return filename


def get_cached_activities() -> list[ActivitySummary]:
    """Get list of activities from cached FIT files with parsed summary data.

    Prefers descriptive filenames over ID-only ones for better workout matching.
    Dedupes by Garmin activity ID.
    """
    fit_path = Path(os.environ.get("FIT_FILES_PATH", "/data/fit-files"))

    if not fit_path.exists():
        return []

    # Group files by Garmin activity ID, preferring descriptive names
    files_by_id: dict[str, Path] = {}
    for fit_file in fit_path.glob("*.fit"):
        garmin_id = extract_garmin_id(fit_file.stem)
        existing = files_by_id.get(garmin_id)

        # Prefer descriptive filename (longer) over ID-only
        if existing is None or len(fit_file.stem) > len(existing.stem):
            files_by_id[garmin_id] = fit_file

    activities = []
    for fit_file in files_by_id.values():
        activity_id = fit_file.stem

        # Load cached compliance if available
        cached = load_cached_compliance(fit_file)
        workout_name = cached.get("workoutName") if cached else None
        compliance_pct = cached.get("compliancePercent") if cached else None

        try:
            # Parse FIT file for summary data
            parsed = parse_fit_file(str(fit_file))
            summary = parsed.get("summary", {})
            metrics = parsed.get("metrics", {})

            # Extract grades if available
            grades = None
            if metrics.get("avgCadence") and metrics.get("avgGct"):
                grades = GradeSummary(
                    cadence=metrics.get("avgCadence", {}).get("grade", "B"),
                    gct=metrics.get("avgGct", {}).get("grade", "B"),
                    gctBalance=metrics.get("avgGctBalance", {}).get("grade", "B"),
                    verticalRatio=metrics.get("avgVerticalRatio", {}).get("grade", "B"),
                )

            activities.append(
                ActivitySummary(
                    id=activity_id,
                    activityName=summary.get("activityName", f"Run {activity_id}"),
                    startTime=summary.get("startTime", ""),
                    distanceKm=summary.get("totalDistance", 0) / 1000,
                    durationSeconds=int(summary.get("totalDuration", 0)),
                    activityType=summary.get("activityType", "running"),
                    fitFilePath=str(fit_file),
                    hasBeenAnalyzed=True,
                    workoutName=workout_name,
                    compliancePercent=compliance_pct,
                    grades=grades,
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

    # Sort by startTime descending (most recent first)
    activities.sort(key=lambda a: a.startTime or "", reverse=True)
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
async def sync_activities(
    response: Response,
    count: int = 10,
    authorization: Optional[str] = Header(None),
):
    """
    Sync latest activities from Garmin Connect.

    Downloads FIT files for the most recent running activities.

    Authentication:
    - Pass Authorization header with client tokens (preferred for cloud)
    - Or use server-side credentials (local development)

    Returns X-Refreshed-Tokens header if tokens were refreshed.
    """
    # Debug: log what we received
    print(f"DEBUG sync: authorization header present = {authorization is not None}")
    print(f"DEBUG sync: authorization length = {len(authorization) if authorization else 0}")
    if authorization:
        print(f"DEBUG sync: authorization prefix = {authorization[:50]}...")

    token_dir = None
    try:
        # Decode tokens to temp directory if provided
        if authorization:
            try:
                token_dir = decode_tokens_to_dir(authorization)
            except HTTPException:
                raise
            except Exception as e:
                raise HTTPException(status_code=401, detail=f"Invalid token: {e}")

        service = get_garmin_service(client_tokens=token_dir)
        synced = service.sync_latest(count=count)

        # Check if tokens were refreshed (returns encoded string now)
        refreshed_b64 = service.get_refreshed_tokens()
        if refreshed_b64:
            response.headers["X-Refreshed-Tokens"] = refreshed_b64

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
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to sync with Garmin: {str(e)}",
        )
    finally:
        # Clean up temp directory
        if token_dir:
            shutil.rmtree(token_dir, ignore_errors=True)


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
async def get_activity(
    activity_id: str,
    response: Response,
    authorization: Optional[str] = Header(None),
):
    """
    Get full details for a specific activity.

    Parses the FIT file and returns running dynamics metrics with grades.
    Optionally fetches workout compliance if tokens provided.
    """
    token_dir = None
    try:
        # Decode tokens to temp directory if provided
        if authorization:
            try:
                token_dir = decode_tokens_to_dir(authorization)
            except Exception:
                pass  # Continue without tokens, won't fetch compliance

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

        # Fetch scheduled workout and calculate compliance
        workout_compliance = None
        start_time = summary.get("startTime", "")
        # Use activity_id (filename) for matching - it contains descriptive name like "Quality_Session"
        # The FIT file's activityName is often just "Run"
        activity_name_for_matching = activity_id.replace("_", " ").replace("-", " ")
        distance_m = summary.get("totalDistance", 0)

        # Extract Garmin activity ID for API lookup
        garmin_id = extract_garmin_id(activity_id)
        garmin_activity_id = int(garmin_id) if garmin_id.isdigit() else None

        garmin_service = None
        if start_time and token_dir:
            try:
                garmin_service = get_garmin_service(client_tokens=token_dir)
                scheduled_workout = garmin_service.get_scheduled_workout(
                    start_time,
                    activity_name=activity_name_for_matching,
                    activity_distance_m=distance_m,
                    garmin_activity_id=garmin_activity_id,
                )
                if scheduled_workout:
                    distance_km = summary.get("totalDistance", 0) / 1000
                    duration_sec = summary.get("totalDuration", 0)
                    compliance_data = calculate_workout_compliance(
                        scheduled_workout, laps, distance_km, duration_sec
                    )
                    if compliance_data:
                        workout_compliance = WorkoutCompliance(
                            workoutName=compliance_data["workoutName"],
                            workoutDescription=compliance_data.get("workoutDescription"),
                            compliancePercent=compliance_data["compliancePercent"],
                            stepsHit=compliance_data["stepsHit"],
                            stepsPartial=compliance_data["stepsPartial"],
                            stepsMissed=compliance_data["stepsMissed"],
                            totalSteps=compliance_data["totalSteps"],
                            distanceStatus=compliance_data.get("distanceStatus"),
                            targetDistanceM=compliance_data.get("targetDistanceM"),
                            actualDistanceM=compliance_data.get("actualDistanceM"),
                            stepBreakdown=[
                                StepCompliance(**s) for s in compliance_data.get("stepBreakdown", [])
                            ],
                        )
                        # Cache compliance for list view
                        save_compliance_cache(fit_file, {
                            "workoutName": compliance_data["workoutName"],
                            "compliancePercent": compliance_data["compliancePercent"],
                        })
            except Exception as e:
                print(f"Could not fetch workout compliance: {e}")

        # Check if tokens were refreshed (returns encoded string now)
        if garmin_service:
            refreshed_b64 = garmin_service.get_refreshed_tokens()
            if refreshed_b64:
                response.headers["X-Refreshed-Tokens"] = refreshed_b64

        return ActivityDetails(
            id=activity_id,
            activityName=summary.get("activityName", f"Run {activity_id}"),
            startTime=summary.get("startTime", ""),
            distanceKm=summary.get("totalDistance", 0) / 1000,
            durationSeconds=int(summary.get("totalDuration", 0)),
            activityType=summary.get("activityType", "running"),
            fitFilePath=str(fit_file),
            hasBeenAnalyzed=True,
            summaryMetrics=summary_metrics,
            timeSeries=ts_points,
            laps=lap_models,
            coaching=coaching,
            fatigueComparison=fatigue_models,
            workoutCompliance=workout_compliance,
            hasRunningDynamics=parsed.get("hasRunningDynamics", False),
        )
    finally:
        # Clean up temp directory
        if token_dir:
            shutil.rmtree(token_dir, ignore_errors=True)


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
