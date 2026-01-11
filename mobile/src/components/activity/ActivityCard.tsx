/**
 * Activity card component for list view.
 */

import { View, Text, StyleSheet, Pressable } from "react-native";
import type { ActivitySummary } from "../../types";

interface ActivityCardProps {
  activity: ActivitySummary;
  onPress?: () => void;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatPace(distanceKm: number, durationSeconds: number): string {
  if (distanceKm === 0) return "--:--";
  const paceSeconds = durationSeconds / distanceKm;
  const mins = Math.floor(paceSeconds / 60);
  const secs = Math.floor(paceSeconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}/km`;
}

function formatDate(dateString: string): string {
  if (!dateString) return "Unknown date";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ActivityCard({ activity, onPress }: ActivityCardProps) {
  const pace = formatPace(activity.distanceKm, activity.durationSeconds);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      <View style={styles.header}>
        <Text style={styles.date}>{formatDate(activity.startTime)}</Text>
        <Text style={styles.name}>{activity.activityName}</Text>
      </View>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{activity.distanceKm.toFixed(1)}</Text>
          <Text style={styles.statLabel}>km</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {formatDuration(activity.durationSeconds)}
          </Text>
          <Text style={styles.statLabel}>time</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{pace}</Text>
          <Text style={styles.statLabel}>pace</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardPressed: {
    backgroundColor: "#F5F5F5",
  },
  header: {
    marginBottom: 12,
  },
  date: {
    fontSize: 12,
    color: "#49454F",
    marginBottom: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1C1B1F",
  },
  stats: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  stat: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1976D2",
  },
  statLabel: {
    fontSize: 12,
    color: "#49454F",
    marginTop: 2,
  },
});
