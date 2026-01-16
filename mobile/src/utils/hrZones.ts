/**
 * Heart Rate Zones Calculation
 *
 * Standard 5-zone model based on percentage of max HR.
 * Default max HR is 190 - user can override in future settings.
 */

import type { TimeSeriesDataPoint } from "../types";

export interface HRZone {
  zone: number;
  name: string;
  color: string;
  minPct: number;
  maxPct: number;
  seconds: number;
  percentage: number;
}

const ZONE_DEFINITIONS = [
  { zone: 1, name: "Recovery", color: "#90CAF9", minPct: 0, maxPct: 60 },
  { zone: 2, name: "Easy", color: "#81C784", minPct: 60, maxPct: 70 },
  { zone: 3, name: "Aerobic", color: "#FFF176", minPct: 70, maxPct: 80 },
  { zone: 4, name: "Threshold", color: "#FFB74D", minPct: 80, maxPct: 90 },
  { zone: 5, name: "VO2max", color: "#E57373", minPct: 90, maxPct: 100 },
];

export const DEFAULT_MAX_HR = 190;

export function calculateHRZones(
  timeSeries: TimeSeriesDataPoint[],
  maxHR: number = DEFAULT_MAX_HR
): HRZone[] | null {
  // Filter to points with HR data
  const hrPoints = timeSeries.filter((p) => p.heartRate && p.heartRate > 0);

  if (hrPoints.length < 10) {
    return null; // Not enough HR data
  }

  // Calculate time between points (assume ~1 second intervals)
  // Use timestamp differences where available
  const zoneTimes: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  for (let i = 0; i < hrPoints.length; i++) {
    const hr = hrPoints[i].heartRate!;
    const hrPct = (hr / maxHR) * 100;

    // Determine which zone
    let zone = 1;
    if (hrPct >= 90) zone = 5;
    else if (hrPct >= 80) zone = 4;
    else if (hrPct >= 70) zone = 3;
    else if (hrPct >= 60) zone = 2;

    // Calculate duration for this point
    let duration = 1; // Default 1 second
    if (i < hrPoints.length - 1) {
      duration = hrPoints[i + 1].timestamp - hrPoints[i].timestamp;
      // Sanity check - cap at 5 seconds to handle gaps
      if (duration > 5 || duration <= 0) duration = 1;
    }

    zoneTimes[zone] += duration;
  }

  const totalTime = Object.values(zoneTimes).reduce((a, b) => a + b, 0);

  if (totalTime === 0) return null;

  return ZONE_DEFINITIONS.map((def) => ({
    ...def,
    seconds: Math.round(zoneTimes[def.zone]),
    percentage: Math.round((zoneTimes[def.zone] / totalTime) * 100),
  }));
}

export function formatZoneTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins < 60) return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hrs}h ${remainingMins}m`;
}
