/**
 * Activity card component for list view.
 */

import { View, Text, StyleSheet, Pressable } from "react-native";
import type { ActivitySummary, Grade } from "../../types";

interface ActivityCardProps {
  activity: ActivitySummary;
  onPress?: () => void;
}

const gradeColors: Record<Grade, string> = {
  A: "#4CAF50",
  B: "#8BC34A",
  C: "#FFC107",
  D: "#F44336",
};

function GradeBadge({ grade, label }: { grade: Grade; label: string }) {
  return (
    <View style={styles.gradeItem}>
      <Text style={styles.gradeLabel}>{label}</Text>
      <View style={[styles.gradeBadge, { backgroundColor: gradeColors[grade] }]}>
        <Text style={styles.gradeText}>{grade}</Text>
      </View>
    </View>
  );
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

function getComplianceColor(percent: number): string {
  if (percent >= 80) return "#4CAF50";
  if (percent >= 50) return "#FFC107";
  return "#F44336";
}

export function ActivityCard({ activity, onPress }: ActivityCardProps) {
  const pace = formatPace(activity.distanceKm, activity.durationSeconds);
  const hasCompliance = activity.compliancePercent != null;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.date}>{formatDate(activity.startTime)}</Text>
          {hasCompliance && (
            <View style={[
              styles.complianceBadge,
              { backgroundColor: getComplianceColor(activity.compliancePercent!) + "20" }
            ]}>
              <Text style={[
                styles.complianceText,
                { color: getComplianceColor(activity.compliancePercent!) }
              ]}>
                {activity.compliancePercent}%
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.name}>{activity.activityName}</Text>
        {activity.workoutName && (
          <Text style={styles.workoutName}>{activity.workoutName}</Text>
        )}
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

      {/* Grade badges */}
      {activity.grades && (
        <View style={styles.gradesRow}>
          <GradeBadge grade={activity.grades.cadence} label="CAD" />
          <GradeBadge grade={activity.grades.gct} label="GCT" />
          <GradeBadge grade={activity.grades.gctBalance} label="BAL" />
          <GradeBadge grade={activity.grades.verticalRatio} label="V.R" />
        </View>
      )}
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
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: "#49454F",
  },
  complianceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  complianceText: {
    fontSize: 12,
    fontWeight: "600",
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1C1B1F",
  },
  workoutName: {
    fontSize: 13,
    color: "#1976D2",
    marginTop: 2,
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
  gradesRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  gradeItem: {
    alignItems: "center",
    gap: 4,
  },
  gradeLabel: {
    fontSize: 10,
    color: "#9E9E9E",
    fontWeight: "500",
  },
  gradeBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  gradeText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
});
