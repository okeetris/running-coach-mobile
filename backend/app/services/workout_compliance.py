"""
Workout compliance service.

Compares actual performance against scheduled workout targets.
Calculates per-step and overall compliance metrics.

Based on the logic from running-coach/scripts/generate_report.py
"""

from typing import Optional


def format_pace(sec_per_km: float) -> str:
    """Format pace as M:SS/km."""
    if not sec_per_km or sec_per_km <= 0:
        return "--:--"
    mins = int(sec_per_km // 60)
    secs = int(sec_per_km % 60)
    return f"{mins}:{secs:02d}"


def format_step_type(step_type: str) -> str:
    """Format step type for display."""
    type_map = {
        "warmup": "Warmup",
        "warm_up": "Warmup",
        "cooldown": "Cooldown",
        "cool_down": "Cooldown",
        "active": "Active",
        "interval": "Interval",
        "recovery": "Recovery",
        "rest": "Recovery",
        "other": "Interval",  # Garmin uses "other" for work/interval steps
        "run": "Run",
        "work": "Work",
    }
    return type_map.get(step_type.lower(), step_type.replace("_", " ").title())


def calculate_step_compliance(
    step: dict,
    actual_pace_sec: float,
    actual_distance_m: float,
    actual_duration_sec: float,
    laps_used: list,
) -> dict:
    """
    Calculate compliance for a single workout step.
    Returns compliance metrics and status.
    """
    step_type = step.get("type", "unknown")

    result = {
        "stepType": format_step_type(step_type),
        "rawStepType": step_type,
        "actualPaceSecKm": round(actual_pace_sec) if actual_pace_sec else None,
        "actualPace": format_pace(actual_pace_sec) if actual_pace_sec else None,
        "actualDistanceM": round(actual_distance_m),
        "actualDurationSec": round(actual_duration_sec),
        "lapsUsed": [lap.get("lapNumber", i + 1) for i, lap in enumerate(laps_used)],
        "paceCompliance": None,
        "status": "no_target",
    }

    # Get target pace range
    pace_range = step.get("targetPaceRange")
    if pace_range and actual_pace_sec:
        slow_target = pace_range.get("slowSecPerKm")
        fast_target = pace_range.get("fastSecPerKm")

        if slow_target and fast_target:
            result["targetPaceRange"] = {
                "slow": format_pace(slow_target),
                "fast": format_pace(fast_target),
            }

            # Check compliance with 5% tolerance on slow end
            if fast_target <= actual_pace_sec <= slow_target:
                result["paceCompliance"] = "hit"
                result["status"] = "hit"
            elif actual_pace_sec < fast_target:
                result["paceCompliance"] = "fast"
                result["status"] = "fast"  # Ran faster than target (might be good or bad)
            elif actual_pace_sec <= slow_target * 1.05:  # 5% tolerance
                result["paceCompliance"] = "close"
                result["status"] = "partial"
            else:
                result["paceCompliance"] = "slow"
                result["status"] = "missed"

    # Add target distance/duration info
    if step.get("targetDistanceM"):
        result["targetDistanceM"] = step["targetDistanceM"]
    if step.get("targetDurationSec"):
        result["targetDurationSec"] = step["targetDurationSec"]

    return result


def map_laps_to_steps(
    laps: list,
    steps: list,
    session_distance_m: float = 0,
    session_duration_sec: float = 0
) -> list:
    """
    Map actual laps to workout steps sequentially.

    For each step:
    - If step has target distance, accumulate laps until ~90% of target reached
    - If step has target duration, use time-based matching
    - Otherwise, use single lap per step

    For single-step workouts, uses session data if laps don't cover full distance.
    """
    if not steps or not laps:
        return []

    # Filter out repeat markers, keep actionable steps
    actionable_steps = [
        s for s in steps
        if s.get("type", "").lower() != "repeat"
    ]

    if not actionable_steps:
        return []

    results = []
    lap_idx = 0

    for step in actionable_steps:
        if lap_idx >= len(laps):
            break

        target_distance = step.get("targetDistanceM", 0)
        target_duration = step.get("targetDurationSec", 0)

        # Accumulate laps for this step
        matched_laps = []
        accumulated_dist = 0
        accumulated_time = 0

        # Distance-based matching (primary)
        if target_distance > 0:
            # For single-step workouts or last step, use all remaining laps
            is_last_step = (step == actionable_steps[-1])

            while lap_idx < len(laps):
                lap = laps[lap_idx]
                lap_distance = lap.get("distance") or (lap.get("distanceKm", 0) * 1000)
                lap_duration = lap.get("duration") or lap.get("durationSeconds") or 0

                matched_laps.append(lap)
                accumulated_dist += lap_distance
                accumulated_time += lap_duration
                lap_idx += 1

                # For last step or single-step workout, use all laps
                # Otherwise stop when we've reached ~90% of target
                if not is_last_step and accumulated_dist >= target_distance * 0.9:
                    break

        # Time-based matching (if no distance)
        elif target_duration > 0:
            while lap_idx < len(laps) and accumulated_time < target_duration * 0.9:
                lap = laps[lap_idx]
                lap_distance = lap.get("distance") or (lap.get("distanceKm", 0) * 1000)
                lap_duration = lap.get("duration") or lap.get("durationSeconds") or 0

                matched_laps.append(lap)
                accumulated_dist += lap_distance
                accumulated_time += lap_duration
                lap_idx += 1

                if accumulated_time >= target_duration * 0.8:
                    break

        # Default: single lap per step
        else:
            lap = laps[lap_idx]
            lap_distance = lap.get("distance") or (lap.get("distanceKm", 0) * 1000)
            lap_duration = lap.get("duration") or lap.get("durationSeconds") or 0

            matched_laps.append(lap)
            accumulated_dist = lap_distance
            accumulated_time = lap_duration
            lap_idx += 1

        if not matched_laps:
            continue

        # For single-step workouts, use session data if laps are incomplete
        # (laps often don't capture the full distance)
        is_single_step = len(actionable_steps) == 1
        if is_single_step and session_distance_m > 0 and session_duration_sec > 0:
            # If laps cover less than 95% of session distance, use session data
            if accumulated_dist < session_distance_m * 0.95:
                accumulated_dist = session_distance_m
                accumulated_time = session_duration_sec

        # Calculate weighted average pace from accumulated data
        if accumulated_dist > 0 and accumulated_time > 0:
            actual_pace_sec = accumulated_time / (accumulated_dist / 1000)
        else:
            actual_pace_sec = 0

        # Calculate compliance for this step
        compliance = calculate_step_compliance(
            step,
            actual_pace_sec,
            accumulated_dist,
            accumulated_time,
            matched_laps,
        )
        results.append(compliance)

    return results


def calculate_workout_compliance(
    workout: Optional[dict],
    laps: list,
    total_distance_km: float,
    total_duration_sec: float,
) -> Optional[dict]:
    """
    Calculate overall workout compliance.
    Returns compliance summary with per-step breakdown.
    """
    if not workout:
        return None

    steps = workout.get("steps", [])
    if not steps:
        return None

    # Map laps to steps, passing session totals for fallback
    step_compliance = map_laps_to_steps(
        laps, steps,
        session_distance_m=total_distance_km * 1000,
        session_duration_sec=total_duration_sec
    )

    if not step_compliance:
        return None

    # Calculate overall stats
    hit_count = sum(1 for s in step_compliance if s["status"] == "hit")
    partial_count = sum(1 for s in step_compliance if s["status"] in ["partial", "fast"])
    missed_count = sum(1 for s in step_compliance if s["status"] == "missed")
    total_steps = len(step_compliance)

    # Compliance percentage: hit = 100%, partial/fast = 50%, missed = 0%
    if total_steps > 0:
        compliance_pct = round((hit_count * 100 + partial_count * 50) / total_steps)
    else:
        compliance_pct = 0

    # Check total distance
    target_distance = workout.get("estimatedDistanceM")
    distance_status = None
    if target_distance:
        actual_m = total_distance_km * 1000
        diff_pct = abs(actual_m - target_distance) / target_distance * 100
        if diff_pct <= 10:
            distance_status = "hit"
        elif actual_m < target_distance:
            distance_status = "short"
        else:
            distance_status = "long"

    return {
        "workoutName": workout.get("name", "Workout"),
        "workoutDescription": workout.get("description", ""),
        "compliancePercent": compliance_pct,
        "stepsHit": hit_count,
        "stepsPartial": partial_count,
        "stepsMissed": missed_count,
        "totalSteps": total_steps,
        "distanceStatus": distance_status,
        "targetDistanceM": target_distance,
        "actualDistanceM": round(total_distance_km * 1000),
        "stepBreakdown": step_compliance,
    }
