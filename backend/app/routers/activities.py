"""
Activities router.

Endpoints for syncing and retrieving running activities.
"""

import os
from pathlib import Path
from fastapi import APIRouter, HTTPException

from models.activity import ActivitySummary, SyncResponse
from services.garmin_sync import get_garmin_service

router = APIRouter(prefix="/activities", tags=["activities"])


def get_cached_activities() -> list[ActivitySummary]:
    """Get list of activities from cached FIT files."""
    fit_path = Path(os.environ.get("FIT_FILES_PATH", "/data/fit-files"))

    if not fit_path.exists():
        return []

    activities = []
    for fit_file in sorted(fit_path.glob("*.fit"), reverse=True):
        # Extract activity ID from filename
        activity_id = fit_file.stem

        # Get file modification time as proxy for activity time
        mtime = fit_file.stat().st_mtime

        activities.append(
            ActivitySummary(
                id=activity_id,
                activityName=f"Run {activity_id}",
                startTime="",  # Would need to parse FIT to get actual time
                distanceKm=0,  # Would need to parse FIT
                durationSeconds=0,  # Would need to parse FIT
                fitFilePath=str(fit_file),
                hasBeenAnalyzed=False,
            )
        )

    return activities[:20]  # Return most recent 20


@router.get("", response_model=list[ActivitySummary])
async def list_activities():
    """
    List all cached activities.

    Returns activities that have been synced and have FIT files available.
    Call POST /activities/sync first to fetch latest from Garmin.
    """
    return get_cached_activities()


@router.post("/sync", response_model=SyncResponse)
async def sync_activities(count: int = 10):
    """
    Sync latest activities from Garmin Connect.

    Downloads FIT files for the most recent running activities.
    """
    try:
        service = get_garmin_service()
        synced = service.sync_latest(count=count)

        return SyncResponse(
            synced=len(synced),
            activities=[ActivitySummary(**a) for a in synced],
            message=f"Successfully synced {len(synced)} activities",
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to sync with Garmin: {str(e)}",
        )


@router.get("/{activity_id}", response_model=ActivitySummary)
async def get_activity(activity_id: str):
    """
    Get details for a specific activity.

    For now returns summary; full analysis will be added in Phase 3.
    """
    fit_path = Path(os.environ.get("FIT_FILES_PATH", "/data/fit-files"))
    fit_file = fit_path / f"{activity_id}.fit"

    if not fit_file.exists():
        raise HTTPException(status_code=404, detail="Activity not found")

    return ActivitySummary(
        id=activity_id,
        activityName=f"Run {activity_id}",
        startTime="",
        distanceKm=0,
        durationSeconds=0,
        fitFilePath=str(fit_file),
        hasBeenAnalyzed=False,
    )
