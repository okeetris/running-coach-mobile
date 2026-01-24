/**
 * Laps Tab
 *
 * Shows lap-by-lap breakdown.
 */

import { View, Text, ScrollView } from "react-native";
import { useActivity } from "../../../src/contexts/ActivityContext";
import type { Lap } from "../../../src/types";
import { styles } from "./_laps.styles";

function formatPace(secPerKm: number): string {
  if (!secPerKm || secPerKm === 0) return "--:--";
  const mins = Math.floor(secPerKm / 60);
  const secs = Math.floor(secPerKm % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${Math.round(meters)} m`;
}

const intensityColors: Record<string, string> = {
  Easy: "#4CAF50",
  Moderate: "#8BC34A",
  Tempo: "#FFC107",
  Threshold: "#FF9800",
  VO2max: "#F44336",
  Sprint: "#9C27B0",
};

function LapRow({ lap }: { lap: Lap }) {
  const intensityColor = lap.intensity ? intensityColors[lap.intensity] || "#757575" : "#757575";

  return (
    <View style={styles.lapRow}>
      <View style={styles.lapNumber}>
        <Text style={styles.lapNumberText}>{lap.lapNumber}</Text>
      </View>
      <View style={styles.lapDetails}>
        <View style={styles.lapMainRow}>
          <Text style={styles.lapPace}>{formatPace(lap.avgPace)}/km</Text>
          <Text style={styles.lapDistance}>{formatDistance(lap.distance)}</Text>
          <Text style={styles.lapDuration}>{formatDuration(lap.duration)}</Text>
        </View>
        <View style={styles.lapMetrics}>
          {lap.avgCadence && (
            <Text style={styles.lapMetric}>{Math.round(lap.avgCadence)} spm</Text>
          )}
          {lap.avgGct && (
            <Text style={styles.lapMetric}>{Math.round(lap.avgGct)} ms</Text>
          )}
          {lap.avgHeartRate && (
            <Text style={styles.lapMetric}>{Math.round(lap.avgHeartRate)} bpm</Text>
          )}
          {lap.intensity && (
            <View style={[styles.intensityBadge, { backgroundColor: intensityColor + "20" }]}>
              <Text style={[styles.intensityText, { color: intensityColor }]}>
                {lap.intensity}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

export default function LapsTab() {
  const { activity } = useActivity();

  if (!activity) return null;

  const { laps } = activity;

  if (!laps || laps.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No lap data available</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Lap Breakdown</Text>
      <View style={styles.lapsContainer}>
        <View style={styles.lapsHeader}>
          <Text style={styles.headerLabel}>Lap</Text>
          <Text style={[styles.headerLabel, styles.headerPace]}>Pace</Text>
          <Text style={[styles.headerLabel, styles.headerDist]}>Dist</Text>
          <Text style={[styles.headerLabel, styles.headerTime]}>Time</Text>
        </View>
        {laps.map((lap) => (
          <LapRow key={lap.lapNumber} lap={lap} />
        ))}
      </View>
    </ScrollView>
  );
}
