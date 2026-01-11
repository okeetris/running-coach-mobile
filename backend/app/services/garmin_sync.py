"""
Garmin Connect sync service.

Handles authentication and activity fetching from Garmin Connect API.
Reuses credentials from the mounted .garmin directory.
"""

import json
import os
import zipfile
from datetime import datetime
from pathlib import Path
from typing import Optional

from garminconnect import Garmin


class GarminSyncService:
    """Service for syncing activities from Garmin Connect."""

    def __init__(self):
        self.config_path = os.environ.get(
            "GARMIN_CONFIG_PATH", "/data/garmin/config.json"
        )
        self.fit_files_path = Path(
            os.environ.get("FIT_FILES_PATH", "/data/fit-files")
        )
        self.garmin: Optional[Garmin] = None

    def _load_credentials(self) -> dict:
        """Load Garmin credentials from config file."""
        if not os.path.exists(self.config_path):
            raise FileNotFoundError(
                f"Garmin config not found at {self.config_path}. "
                "Create .garmin/config.json with email and password."
            )

        with open(self.config_path) as f:
            config = json.load(f)

        if "email" not in config or "password" not in config:
            raise ValueError("Config must contain 'email' and 'password' fields")

        return config

    def _get_client(self) -> Garmin:
        """Get authenticated Garmin client (lazy initialization)."""
        if self.garmin is None:
            creds = self._load_credentials()
            self.garmin = Garmin(creds["email"], creds["password"])
            self.garmin.login()
        return self.garmin

    def get_recent_activities(self, limit: int = 20) -> list[dict]:
        """Fetch recent activities from Garmin Connect."""
        client = self._get_client()
        activities = client.get_activities(0, limit)

        # Filter to running activities only
        running_activities = [
            a for a in activities
            if a.get("activityType", {}).get("typeKey") == "running"
        ]

        return running_activities

    def download_activity_fit(self, activity_id: int) -> Path:
        """Download FIT file for an activity if not already cached."""
        fit_path = self.fit_files_path / f"{activity_id}.fit"

        # Return cached file if exists
        if fit_path.exists():
            return fit_path

        # Download from Garmin
        client = self._get_client()
        zip_data = client.download_activity(
            activity_id, dl_fmt=client.ActivityDownloadFormat.ORIGINAL
        )

        # Extract FIT from ZIP
        zip_path = self.fit_files_path / f"{activity_id}.zip"
        with open(zip_path, "wb") as f:
            f.write(zip_data)

        with zipfile.ZipFile(zip_path, "r") as z:
            fit_files = [n for n in z.namelist() if n.endswith(".fit")]
            if fit_files:
                z.extract(fit_files[0], self.fit_files_path)
                extracted = self.fit_files_path / fit_files[0]
                extracted.rename(fit_path)

        # Cleanup zip
        zip_path.unlink(missing_ok=True)

        return fit_path

    def sync_latest(self, count: int = 5) -> list[dict]:
        """
        Sync latest activities - fetch metadata and download FIT files.
        Returns list of activity summaries.
        """
        activities = self.get_recent_activities(limit=count)

        synced = []
        for activity in activities:
            activity_id = activity["activityId"]
            try:
                fit_path = self.download_activity_fit(activity_id)
                synced.append({
                    "id": str(activity_id),
                    "activityName": activity.get("activityName", "Untitled Run"),
                    "startTime": activity.get("startTimeLocal"),
                    "distanceKm": round(activity.get("distance", 0) / 1000, 2),
                    "durationSeconds": int(activity.get("duration", 0)),
                    "fitFilePath": str(fit_path),
                    "hasBeenAnalyzed": False,
                })
            except Exception as e:
                print(f"Failed to sync activity {activity_id}: {e}")

        return synced


# Singleton instance
_service: Optional[GarminSyncService] = None


def get_garmin_service() -> GarminSyncService:
    """Get singleton GarminSyncService instance."""
    global _service
    if _service is None:
        _service = GarminSyncService()
    return _service
