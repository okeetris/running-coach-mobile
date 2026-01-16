/**
 * Heart Rate Zones Calculation
 *
 * Supports both Garmin zones (from API) and fallback percentage-based zones.
 */

import type { TimeSeriesDataPoint, GarminHRZone } from "../types";

export interface HRZone {
  zone: number;
  name: string;
  color: string;
  minHR: number;
  maxHR: number;
  seconds: number;
  percentage: number;
}

const ZONE_COLORS = ["#90CAF9", "#81C784", "#FFF176", "#FFB74D", "#E57373"];
const ZONE_NAMES = ["Recovery", "Easy", "Aerobic", "Threshold", "VO2max"];

// Default zones as percentage of max HR (fallback if Garmin zones unavailable)
const DEFAULT_ZONE_PCTS = [
  { minPct: 0, maxPct: 60 },
  { minPct: 60, maxPct: 70 },
  { minPct: 70, maxPct: 80 },
  { minPct: 80, maxPct: 90 },
  { minPct: 90, maxPct: 100 },
];

export const DEFAULT_MAX_HR = 190;

/**
 * Calculate HR zones using Garmin's actual zone boundaries
 */
export function calculateHRZonesWithGarmin(
  timeSeries: TimeSeriesDataPoint[],
  garminZones: GarminHRZone[]
): HRZone[] | null {
  const hrPoints = timeSeries.filter((p) => p.heartRate && p.heartRate > 0);

  if (hrPoints.length < 10) {
    return null;
  }

  // Initialize zone times
  const zoneTimes: Record<number, number> = {};
  garminZones.forEach((z) => (zoneTimes[z.zone] = 0));

  for (let i = 0; i < hrPoints.length; i++) {
    const hr = hrPoints[i].heartRate!;

    // Find which zone this HR falls into
    let zoneNum = 1;
    for (const zone of garminZones) {
      if (hr >= zone.minHR && hr <= zone.maxHR) {
        zoneNum = zone.zone;
        break;
      }
      // Handle HR above max zone
      if (hr > zone.maxHR && zone.zone === garminZones.length) {
        zoneNum = zone.zone;
      }
    }

    // Calculate duration
    let duration = 1;
    if (i < hrPoints.length - 1) {
      duration = hrPoints[i + 1].timestamp - hrPoints[i].timestamp;
      if (duration > 5 || duration <= 0) duration = 1;
    }

    zoneTimes[zoneNum] = (zoneTimes[zoneNum] || 0) + duration;
  }

  const totalTime = Object.values(zoneTimes).reduce((a, b) => a + b, 0);
  if (totalTime === 0) return null;

  return garminZones.map((gz) => ({
    zone: gz.zone,
    name: ZONE_NAMES[gz.zone - 1] || `Zone ${gz.zone}`,
    color: ZONE_COLORS[gz.zone - 1] || "#9E9E9E",
    minHR: gz.minHR,
    maxHR: gz.maxHR,
    seconds: Math.round(zoneTimes[gz.zone] || 0),
    percentage: Math.round(((zoneTimes[gz.zone] || 0) / totalTime) * 100),
  }));
}

/**
 * Calculate HR zones using default percentage-based boundaries
 * (fallback when Garmin zones not available)
 */
export function calculateHRZones(
  timeSeries: TimeSeriesDataPoint[],
  maxHR: number = DEFAULT_MAX_HR
): HRZone[] | null {
  const hrPoints = timeSeries.filter((p) => p.heartRate && p.heartRate > 0);

  if (hrPoints.length < 10) {
    return null;
  }

  const zoneTimes: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  for (let i = 0; i < hrPoints.length; i++) {
    const hr = hrPoints[i].heartRate!;
    const hrPct = (hr / maxHR) * 100;

    let zone = 1;
    if (hrPct >= 90) zone = 5;
    else if (hrPct >= 80) zone = 4;
    else if (hrPct >= 70) zone = 3;
    else if (hrPct >= 60) zone = 2;

    let duration = 1;
    if (i < hrPoints.length - 1) {
      duration = hrPoints[i + 1].timestamp - hrPoints[i].timestamp;
      if (duration > 5 || duration <= 0) duration = 1;
    }

    zoneTimes[zone] += duration;
  }

  const totalTime = Object.values(zoneTimes).reduce((a, b) => a + b, 0);
  if (totalTime === 0) return null;

  return DEFAULT_ZONE_PCTS.map((def, idx) => ({
    zone: idx + 1,
    name: ZONE_NAMES[idx],
    color: ZONE_COLORS[idx],
    minHR: Math.round((def.minPct / 100) * maxHR),
    maxHR: Math.round((def.maxPct / 100) * maxHR),
    seconds: Math.round(zoneTimes[idx + 1]),
    percentage: Math.round((zoneTimes[idx + 1] / totalTime) * 100),
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
