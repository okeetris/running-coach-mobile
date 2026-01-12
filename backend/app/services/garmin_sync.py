"""
Garmin Connect sync service.

Handles authentication and activity fetching from Garmin Connect API.
Reuses credentials from the mounted .garmin directory.
Supports MFA (Multi-Factor Authentication) flow.
Fetches scheduled workouts for compliance tracking.
"""

import base64
import json
import os
import tarfile
import tempfile
import zipfile
from datetime import datetime
from io import BytesIO
from pathlib import Path
from typing import Optional

from garminconnect import Garmin


class MFARequiredError(Exception):
    """Raised when MFA code is needed to complete login."""

    def __init__(self, message: str = "MFA code required"):
        self.message = message
        super().__init__(self.message)


class GarminSyncService:
    """Service for syncing activities from Garmin Connect."""

    def __init__(self, client_tokens: Optional[dict] = None):
        """
        Initialize service.

        Args:
            client_tokens: Optional dict with oauth1/oauth2 tokens from client.
                          If provided, uses these instead of server-side auth.
        """
        self.config_path = os.environ.get(
            "GARMIN_CONFIG_PATH", "/data/garmin/config.json"
        )
        self.token_path = os.environ.get(
            "GARMIN_TOKEN_PATH", "/data/garmin/tokens"
        )
        self.fit_files_path = Path(
            os.environ.get("FIT_FILES_PATH", "/data/fit-files")
        )
        # Ensure FIT files directory exists
        self.fit_files_path.mkdir(parents=True, exist_ok=True)

        self.garmin: Optional[Garmin] = None
        self._mfa_token: Optional[str] = None  # Stored when MFA is needed
        self._client_tokens = client_tokens
        self._initial_oauth2_token: Optional[str] = None  # Track for refresh detection

    def _load_credentials(self) -> dict:
        """Load Garmin credentials from env vars or config file."""
        # First try environment variables (for cloud deployment)
        email = os.environ.get("GARMIN_EMAIL")
        password = os.environ.get("GARMIN_PASSWORD")

        if email and password:
            return {"email": email, "password": password}

        # Fall back to config file (for local development)
        if not os.path.exists(self.config_path):
            raise FileNotFoundError(
                f"Garmin credentials not found. Set GARMIN_EMAIL and GARMIN_PASSWORD "
                f"env vars, or create config at {self.config_path}."
            )

        with open(self.config_path) as f:
            config = json.load(f)

        if "email" not in config or "password" not in config:
            raise ValueError("Config must contain 'email' and 'password' fields")

        return config

    def _try_load_tokens(self) -> bool:
        """Try to load saved session tokens. Returns True if successful."""
        # First try GARMIN_TOKENS env var (base64 encoded tar.gz of token files)
        tokens_b64 = os.environ.get("GARMIN_TOKENS")
        if tokens_b64:
            try:
                # Decode base64 and extract to temp directory
                tokens_data = base64.b64decode(tokens_b64)
                with tempfile.TemporaryDirectory() as tmpdir:
                    with tarfile.open(fileobj=BytesIO(tokens_data), mode="r:gz") as tar:
                        tar.extractall(tmpdir)
                    self.garmin.garth.load(tmpdir)
                    print("Loaded tokens from GARMIN_TOKENS env var")
                    return True
            except Exception as e:
                print(f"Failed to load tokens from env var: {e}")

        # Fall back to file-based tokens
        if not os.path.exists(self.token_path):
            return False
        try:
            self.garmin.garth.load(self.token_path)
            return True
        except Exception:
            return False

    def _save_tokens(self):
        """Save session tokens for future use (avoids repeated MFA)."""
        try:
            os.makedirs(self.token_path, exist_ok=True)
            self.garmin.garth.dump(self.token_path)
        except Exception as e:
            print(f"Warning: Failed to save tokens: {e}")

    def _get_client_from_tokens(self) -> Garmin:
        """Create Garmin client from client-provided token directory."""
        if not self._client_tokens:
            raise ValueError("No client tokens provided")

        # _client_tokens is now a path to a temp directory with token files
        token_dir = self._client_tokens

        # Create Garmin instance without credentials (we have tokens)
        garmin = Garmin()

        # Load tokens using garth's native load
        garmin.garth.load(token_dir)

        # Store initial access token to detect refreshes
        try:
            with open(f"{token_dir}/oauth2_token.json") as f:
                oauth2_data = json.load(f)
                self._initial_oauth2_token = oauth2_data.get("access_token")
        except Exception:
            self._initial_oauth2_token = None

        return garmin

    def get_refreshed_tokens(self) -> Optional[str]:
        """
        Check if tokens were refreshed and return new encoded tokens if so.

        Returns base64-encoded tar.gz of token files, or None if not refreshed.
        """
        if not self.garmin or not self._initial_oauth2_token:
            return None

        # Get current access token from garth
        try:
            current_token = self.garmin.garth.oauth2_token.access_token
        except Exception:
            return None

        if current_token and current_token != self._initial_oauth2_token:
            # Token was refreshed, return new encoded tokens
            from dependencies.auth import encode_tokens_from_garth
            return encode_tokens_from_garth(self.garmin.garth)
        return None

    def _get_client(self) -> Garmin:
        """Get authenticated Garmin client with MFA support."""
        if self.garmin is not None:
            return self.garmin

        # If client tokens provided, use those
        if self._client_tokens:
            self.garmin = self._get_client_from_tokens()
            return self.garmin

        creds = self._load_credentials()
        # Use return_on_mfa=True to handle MFA ourselves
        self.garmin = Garmin(creds["email"], creds["password"], return_on_mfa=True)

        # Try loading saved tokens first
        if self._try_load_tokens():
            try:
                # Verify tokens work by making a simple API call
                self.garmin.get_full_name()
                return self.garmin
            except Exception:
                pass  # Tokens invalid, need fresh login

        # Fresh login required
        result = self.garmin.login()

        if result == "needs_mfa":
            # MFA required - store token and raise error
            self._mfa_token = self.garmin.garth.oauth1_token
            raise MFARequiredError("MFA code required. Check your email/SMS.")

        # Login successful, save tokens
        self._save_tokens()
        return self.garmin

    def needs_mfa(self) -> bool:
        """Check if MFA code is pending."""
        return self._mfa_token is not None

    def submit_mfa(self, code: str) -> bool:
        """
        Submit MFA code to complete authentication.
        Returns True on success, raises on failure.
        """
        if self.garmin is None:
            raise ValueError("Must attempt login before submitting MFA")

        try:
            self.garmin.resume_login(self._mfa_token, code)
            self._mfa_token = None  # Clear pending MFA
            self._save_tokens()  # Save tokens for future use
            return True
        except Exception as e:
            raise ValueError(f"MFA verification failed: {e}")

    def get_recent_activities(self, limit: int = 20) -> list[dict]:
        """Fetch recent activities from Garmin Connect."""
        client = self._get_client()
        # Fetch more activities to account for filtering (3x requested to ensure enough running activities)
        activities = client.get_activities(0, limit * 3)

        # Filter to running activities (outdoor, treadmill, trail, track, etc.)
        running_types = {"running", "treadmill_running", "trail_running", "track_running"}
        running_activities = [
            a for a in activities
            if a.get("activityType", {}).get("typeKey") in running_types
        ]

        return running_activities[:limit]

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

    def _parse_workout_details(self, workout_id: int) -> dict:
        """Parse a workout into structured format with steps and targets."""
        client = self._get_client()
        workout = client.connectapi(f"/workout-service/workout/{workout_id}")

        steps = []
        for segment in workout.get("workoutSegments", []):
            for step in segment.get("workoutSteps", []):
                step_info = {
                    "type": step.get("stepType", {}).get("stepTypeKey", "unknown"),
                    "order": step.get("stepOrder", 0),
                }

                # Parse end condition (distance or time)
                end_condition = step.get("endCondition", {}).get("conditionTypeKey")
                end_value = step.get("endConditionValue")
                if end_condition == "distance" and end_value:
                    step_info["targetDistanceM"] = end_value
                elif end_condition == "time" and end_value:
                    step_info["targetDurationSec"] = end_value

                # Parse target pace (speed values are in m/s)
                target_one = step.get("targetValueOne")
                target_two = step.get("targetValueTwo")
                if target_one and target_two:
                    # Convert m/s to sec/km for pace
                    slow_pace_sec = 1000 / target_one if target_one > 0 else None
                    fast_pace_sec = 1000 / target_two if target_two > 0 else None
                    if slow_pace_sec and fast_pace_sec:
                        step_info["targetPaceRange"] = {
                            "slowSecPerKm": round(slow_pace_sec),
                            "fastSecPerKm": round(fast_pace_sec),
                        }

                steps.append(step_info)

        return {
            "workoutId": workout_id,
            "name": workout.get("workoutName", "Unknown"),
            "description": workout.get("description", ""),
            "estimatedDistanceM": workout.get("estimatedDistanceInMeters"),
            "steps": steps,
        }

    def _match_workout_by_name(self, activity_name: str, activity_distance_m: float) -> Optional[dict]:
        """
        Fallback: match workout by name similarity and distance.
        Searches recent workouts and finds best match.
        Prioritizes specific workout types (Quality Session, Tempo, etc.) over generic (Easy Run).
        """
        try:
            client = self._get_client()
            workouts = client.connectapi("/workout-service/workouts?start=0&limit=30")

            best_match = None
            best_score = 0
            activity_lower = activity_name.lower()

            # Check for specific workout type keywords in activity name
            specific_keywords = ["quality", "tempo", "interval", "threshold", "fartlek", "long run", "race"]
            activity_is_specific = any(kw in activity_lower for kw in specific_keywords)

            for w in workouts:
                workout_name = w.get("workoutName", "").lower()
                workout_distance = w.get("estimatedDistanceInMeters")

                score = 0

                # Strong preference for exact type match
                if "quality" in activity_lower and "quality" in workout_name:
                    score += 100
                elif "tempo" in activity_lower and "tempo" in workout_name:
                    score += 100
                elif "interval" in activity_lower and "interval" in workout_name:
                    score += 100
                elif "easy" in activity_lower and "easy" in workout_name:
                    score += 100
                elif "long" in activity_lower and "long" in workout_name:
                    score += 100

                # Penalize generic workouts when activity is specific
                if activity_is_specific and "easy" in workout_name and "easy" not in activity_lower:
                    score -= 50  # Penalize Easy Run matching to Quality Session

                # General name matching
                if workout_name in activity_lower or activity_lower in workout_name:
                    score += 30

                # Distance matching (within 15% tolerance)
                if workout_distance and activity_distance_m:
                    distance_diff = abs(workout_distance - activity_distance_m)
                    tolerance = activity_distance_m * 0.15
                    if distance_diff <= tolerance:
                        score += 30 * (1 - distance_diff / tolerance)

                if score > best_score and score >= 30:
                    best_score = score
                    best_match = w

            if best_match:
                workout_id = best_match.get("workoutId")
                print(f"Matched workout by name: {best_match.get('workoutName')} (score: {best_score:.0f})")
                return self._parse_workout_details(workout_id)

            return None
        except Exception as e:
            print(f"Could not match workout by name: {e}")
            return None

    def _get_workout_from_activity(self, garmin_activity_id: int) -> Optional[dict]:
        """
        Get the associated workout for an activity from Garmin API.
        Activities store a reference to the workout they were executed from.
        """
        try:
            client = self._get_client()
            activity = client.connectapi(f"/activity-service/activity/{garmin_activity_id}")

            # Check metadata for associated workout
            metadata = activity.get("metadataDTO", {})
            workout_id = metadata.get("associatedWorkoutId")

            if workout_id:
                print(f"Found associated workout {workout_id} for activity {garmin_activity_id}")
                workout = self._parse_workout_details(workout_id)
                workout["matchedBy"] = "activity_link"
                return workout

            return None
        except Exception as e:
            print(f"Could not fetch workout from activity: {e}")
            return None

    def get_scheduled_workout(
        self, activity_date: str, activity_name: str = None, activity_distance_m: float = None,
        garmin_activity_id: int = None
    ) -> Optional[dict]:
        """
        Fetch the workout for an activity.

        Tries in order:
        1. Activity's associated workout (from Garmin API) - most reliable for past activities
        2. Calendar lookup by date (only works for same-day)
        3. Name/distance matching fallback

        Returns workout details including steps and target paces.
        """
        try:
            client = self._get_client()

            # Method 1: Get workout directly from activity (most reliable for past activities)
            if garmin_activity_id:
                workout = self._get_workout_from_activity(garmin_activity_id)
                if workout:
                    return workout

            # Method 2: Calendar lookup (works for same-day activities)
            date_obj = datetime.strptime(activity_date[:10], "%Y-%m-%d")
            year = date_obj.year
            month = date_obj.month

            calendar = client.connectapi(f"/calendar-service/year/{year}/month/{month}")

            target_date = activity_date[:10]
            for item in calendar.get("calendarItems", []):
                if item.get("itemType") == "workout" and item.get("date") == target_date:
                    workout_id = item.get("workoutId")
                    if workout_id:
                        workout = self._parse_workout_details(workout_id)
                        workout["matchedBy"] = "calendar"
                        return workout

            # Method 3: Fallback to name/distance matching
            if activity_name and activity_distance_m:
                matched = self._match_workout_by_name(activity_name, activity_distance_m)
                if matched:
                    matched["matchedBy"] = "name"
                    return matched

            return None
        except Exception as e:
            print(f"Could not fetch scheduled workout: {e}")
            return None

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


# Singleton instance (for server-side auth only)
_service: Optional[GarminSyncService] = None


def get_garmin_service(client_tokens: Optional[dict] = None) -> GarminSyncService:
    """
    Get GarminSyncService instance.

    If client_tokens provided, creates new instance using those tokens.
    Otherwise, returns singleton instance for server-side auth.
    """
    if client_tokens:
        # Create new instance with client tokens (no singleton)
        return GarminSyncService(client_tokens=client_tokens)

    # Use singleton for server-side auth
    global _service
    if _service is None:
        _service = GarminSyncService()
    return _service
