/**
 * Laps Tab
 *
 * Shows lap-by-lap breakdown.
 */

import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useActivity } from "../../../src/contexts/ActivityContext";
import type { Lap } from "../../../src/types";

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: "#757575",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1B1F",
    marginBottom: 12,
    marginTop: 8,
  },
  lapsContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  lapsHeader: {
    flexDirection: "row",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    marginBottom: 8,
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#757575",
    textTransform: "uppercase",
  },
  headerPace: {
    flex: 1,
    marginLeft: 40,
  },
  headerDist: {
    width: 70,
    textAlign: "right",
  },
  headerTime: {
    width: 50,
    textAlign: "right",
  },
  lapRow: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  lapNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  lapNumberText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1976D2",
  },
  lapDetails: {
    flex: 1,
  },
  lapMainRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  lapPace: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#1C1B1F",
  },
  lapDistance: {
    width: 70,
    fontSize: 13,
    color: "#49454F",
    textAlign: "right",
  },
  lapDuration: {
    width: 50,
    fontSize: 13,
    color: "#49454F",
    textAlign: "right",
  },
  lapMetrics: {
    flexDirection: "row",
    marginTop: 4,
    gap: 12,
    alignItems: "center",
  },
  lapMetric: {
    fontSize: 12,
    color: "#757575",
  },
  intensityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: "auto",
  },
  intensityText: {
    fontSize: 11,
    fontWeight: "600",
  },
});
