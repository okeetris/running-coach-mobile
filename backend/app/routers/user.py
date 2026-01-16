"""
User-related endpoints including HR zones and profile settings.
"""

from typing import Optional
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel

from services.garmin_sync import GarminSyncService
from dependencies.auth import decode_tokens_to_dir


router = APIRouter(prefix="/user", tags=["user"])


class HRZone(BaseModel):
    """Single heart rate zone."""
    zone: int
    minHR: int
    maxHR: int


class HRZonesResponse(BaseModel):
    """Heart rate zones response."""
    maxHR: int
    zones: list[HRZone]


@router.get("/hr-zones", response_model=Optional[HRZonesResponse])
async def get_hr_zones(
    authorization: Optional[str] = Header(None),
):
    """
    Get user's heart rate zones from Garmin.

    Returns the user's configured HR zones including max HR and
    zone boundaries. These can be used for accurate zone calculations
    during activity analysis.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization required")

    try:
        token_dir = decode_tokens_to_dir(authorization)
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")

    try:
        sync = GarminSyncService(client_tokens=token_dir)
        hr_zones = sync.get_user_hr_zones()

        if not hr_zones:
            return None

        return HRZonesResponse(
            maxHR=hr_zones["maxHR"],
            zones=[HRZone(**z) for z in hr_zones["zones"]],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch HR zones: {e}")
