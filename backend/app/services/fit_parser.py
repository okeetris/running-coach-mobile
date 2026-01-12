"""
FIT File Parser Service.

Extracts running dynamics metrics from Garmin FIT files.
Ported from running-coach/scripts/parse_fit.py
"""

from datetime import datetime
from pathlib import Path
from typing import Optional
import statistics

from fitparse import FitFile


# Grading thresholds
GRADES = {
    "cadence": {"A": 180, "B": 170, "C": 160},  # spm
    "gct": {"A": 220, "B": 250, "C": 280},  # ms (lower is better)
    "gct_balance": {"A": 1, "B": 2, "C": 4},  # % deviation from 50
    "vertical_ratio": {"A": 8, "B": 9, "C": 10},  # % (lower is better)
}


def grade_metric(metric: str, value: float) -> str:
    """Assign A/B/C/D grade to a metric value."""
    thresholds = GRADES.get(metric)
    if not thresholds:
        return "B"  # Default

    if metric in ["gct", "gct_balance", "vertical_ratio"]:
        # Lower is better
        if value <= thresholds["A"]:
            return "A"
        elif value <= thresholds["B"]:
            return "B"
        elif value <= thresholds["C"]:
            return "C"
        return "D"
    else:
        # Higher is better (cadence)
        if value >= thresholds["A"]:
            return "A"
        elif value >= thresholds["B"]:
            return "B"
        elif value >= thresholds["C"]:
            return "C"
        return "D"


def parse_fit_file(fit_path: str) -> dict:
    """
    Parse a FIT file and extract running dynamics data.

    Returns dict with:
    - summary: Activity summary (distance, duration, pace)
    - metrics: Running dynamics metrics with grades
    - timeSeries: 1-second records for charting
    - laps: Lap breakdown
    """
    fit_path = Path(fit_path)
    if not fit_path.exists():
        raise FileNotFoundError(f"FIT file not found: {fit_path}")

    fitfile = FitFile(str(fit_path))

    # Extract activity summary from session
    summary = extract_session_summary(fitfile)

    # Extract 1-second records
    records = extract_records(fitfile)

    # Extract laps
    laps = extract_laps(fitfile)

    # Compute summary metrics with grades
    metrics = compute_metrics(records)

    # Compute fatigue comparison
    fatigue = compute_fatigue_comparison(records)

    # Detect running dynamics pod (HRM-600 or similar)
    # Require GCT balance data - watches without pods don't have this
    # Also require sufficient data points (not just a few readings)
    gct_balance_count = sum(1 for r in records if r.get("gctBalance") is not None)
    has_running_dynamics = gct_balance_count > len(records) * 0.5  # >50% of records have balance data

    return {
        "summary": summary,
        "metrics": metrics,
        "timeSeries": records,
        "laps": laps,
        "fatigue": fatigue,
        "hasRunningDynamics": has_running_dynamics,
    }


def extract_session_summary(fitfile: FitFile) -> dict:
    """Extract session-level summary from FIT file."""
    summary = {
        "startTime": None,
        "totalDistance": 0,
        "totalDuration": 0,
        "avgPace": 0,
        "avgHeartRate": None,
        "activityName": "Run",
    }

    for record in fitfile.get_messages("session"):
        data = {field.name: field.value for field in record.fields}

        if data.get("start_time"):
            start = data["start_time"]
            # FIT timestamps are UTC - append Z so JS converts to local time
            if isinstance(start, datetime):
                summary["startTime"] = start.isoformat() + "Z"
            else:
                summary["startTime"] = str(start)

        summary["totalDistance"] = data.get("total_distance", 0)
        summary["totalDuration"] = data.get("total_elapsed_time", 0)
        summary["avgHeartRate"] = data.get("avg_heart_rate")

        # Calculate average pace (sec/km)
        if summary["totalDistance"] > 0:
            summary["avgPace"] = (
                summary["totalDuration"] / summary["totalDistance"]
            ) * 1000

        break  # Only need first session

    return summary


def extract_records(fitfile: FitFile) -> list[dict]:
    """Extract 1-second record data for time series charts."""
    records = []
    start_time = None

    for record in fitfile.get_messages("record"):
        data = {}

        for field in record.fields:
            name = field.name
            value = field.value

            if value is None:
                continue

            # Track start time for relative timestamps
            if name == "timestamp":
                if start_time is None:
                    start_time = value
                # Convert to seconds from start
                if isinstance(value, datetime) and isinstance(start_time, datetime):
                    data["timestamp"] = (value - start_time).total_seconds()
                continue

            # Map field names to our schema
            if name == "heart_rate":
                data["heartRate"] = value
            elif name == "cadence":
                # Garmin stores half-cadence, double it
                data["cadence"] = value * 2 if value < 120 else value
            elif name in ["enhanced_speed", "speed"]:
                if value and value > 0:
                    # Convert m/s to sec/km pace
                    data["pace"] = 1000 / value
            elif name == "stance_time":
                data["gct"] = value  # Ground contact time in ms
            elif name == "stance_time_balance":
                data["gctBalance"] = value
            elif name == "vertical_ratio":
                data["verticalRatio"] = value
            elif name == "vertical_oscillation":
                data["verticalOscillation"] = value
            elif name == "step_length":
                data["strideLength"] = value / 100  # cm to m
            elif name == "power":
                data["power"] = value

        if data and "timestamp" in data:
            records.append(data)

    return records


def extract_laps(fitfile: FitFile) -> list[dict]:
    """Extract lap data from FIT file."""
    laps = []
    lap_num = 0

    for record in fitfile.get_messages("lap"):
        lap_num += 1
        data = {field.name: field.value for field in record.fields}

        lap = {
            "lapNumber": lap_num,
            "distance": data.get("total_distance", 0),
            "duration": data.get("total_elapsed_time", 0),
            "avgHeartRate": data.get("avg_heart_rate"),
            "avgCadence": data.get("avg_running_cadence") or data.get("avg_cadence"),
            "avgGct": data.get("avg_stance_time"),
        }

        # Calculate pace
        if lap["distance"] > 0 and lap["duration"] > 0:
            lap["avgPace"] = (lap["duration"] / lap["distance"]) * 1000
        else:
            lap["avgPace"] = 0

        # Double cadence if stored as half-cadence
        if lap["avgCadence"] and lap["avgCadence"] < 120:
            lap["avgCadence"] = lap["avgCadence"] * 2

        laps.append(lap)

    return laps


def compute_metrics(records: list[dict]) -> dict:
    """Compute summary metrics with grades from records."""

    def avg(field: str) -> Optional[float]:
        values = [r[field] for r in records if field in r and r[field] is not None]
        return statistics.mean(values) if values else None

    cadence = avg("cadence")
    gct = avg("gct")
    gct_balance = avg("gctBalance")
    vertical_ratio = avg("verticalRatio")
    heart_rate = avg("heartRate")

    metrics = {}

    if cadence:
        metrics["avgCadence"] = {
            "value": round(cadence, 1),
            "grade": grade_metric("cadence", cadence),
        }

    if gct:
        metrics["avgGct"] = {
            "value": round(gct, 1),
            "grade": grade_metric("gct", gct),
        }

    if gct_balance:
        deviation = abs(gct_balance - 50)
        metrics["avgGctBalance"] = {
            "value": round(gct_balance, 1),
            "grade": grade_metric("gct_balance", deviation),
        }

    if vertical_ratio:
        metrics["avgVerticalRatio"] = {
            "value": round(vertical_ratio, 1),
            "grade": grade_metric("vertical_ratio", vertical_ratio),
        }

    if heart_rate:
        metrics["avgHeartRate"] = {"value": round(heart_rate, 1), "grade": "B"}

    return metrics


def compute_fatigue_comparison(records: list[dict]) -> list[dict]:
    """Compare first half vs second half metrics to detect fatigue."""
    if len(records) < 20:
        return []

    mid = len(records) // 2
    first_half = records[:mid]
    second_half = records[mid:]

    def avg(data: list[dict], field: str) -> Optional[float]:
        values = [r[field] for r in data if field in r and r[field] is not None]
        return statistics.mean(values) if values else None

    comparisons = []

    for field, label in [
        ("cadence", "Cadence"),
        ("gct", "Ground Contact Time"),
        ("verticalRatio", "Vertical Ratio"),
        ("heartRate", "Heart Rate"),
    ]:
        first = avg(first_half, field)
        second = avg(second_half, field)

        if first and second:
            change = ((second - first) / first) * 100
            comparisons.append({
                "metric": label,
                "firstHalf": round(first, 1),
                "secondHalf": round(second, 1),
                "change": round(change, 1),
                "changeDirection": (
                    "improved" if change < -2 else "degraded" if change > 2 else "stable"
                ),
            })

    return comparisons
