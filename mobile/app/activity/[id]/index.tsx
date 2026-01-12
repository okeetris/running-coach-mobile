/**
 * Summary Tab
 *
 * Shows key metrics, grades, at-a-glance, and workout compliance.
 */

import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useActivity } from "../../../src/contexts/ActivityContext";
import { WorkoutComplianceCard } from "../../../src/components/activity/WorkoutComplianceCard";
import type { Grade, GradeValue } from "../../../src/types";

function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatPace(secPerKm: number): string {
  if (!secPerKm || secPerKm === 0) return "--:--";
  const mins = Math.floor(secPerKm / 60);
  const secs = Math.floor(secPerKm % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}/km`;
}

const gradeColors: Record<Grade, string> = {
  A: "#4CAF50",
  B: "#8BC34A",
  C: "#FFC107",
  D: "#F44336",
};

function GradeBadge({ grade }: { grade: Grade }) {
  return (
    <View style={[styles.gradeBadge, { backgroundColor: gradeColors[grade] }]}>
      <Text style={styles.gradeText}>{grade}</Text>
    </View>
  );
}

function MetricCard({
  label,
  value,
  unit,
  gradeValue,
}: {
  label: string;
  value: string;
  unit: string;
  gradeValue?: GradeValue;
}) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <View style={styles.metricRow}>
        <Text style={styles.metricValue}>{value}</Text>
        <Text style={styles.metricUnit}>{unit}</Text>
        {gradeValue && <GradeBadge grade={gradeValue.grade} />}
      </View>
    </View>
  );
}

export default function SummaryTab() {
  const { activity } = useActivity();

  if (!activity) return null;

  const { summaryMetrics, coaching, workoutCompliance } = activity;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Summary Stats */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryStat}>
          <Text style={styles.summaryValue}>{activity.distanceKm.toFixed(2)}</Text>
          <Text style={styles.summaryLabel}>km</Text>
        </View>
        <View style={styles.summaryStat}>
          <Text style={styles.summaryValue}>
            {formatDuration(activity.durationSeconds)}
          </Text>
          <Text style={styles.summaryLabel}>time</Text>
        </View>
        <View style={styles.summaryStat}>
          <Text style={styles.summaryValue}>
            {formatPace(summaryMetrics.avgPace)}
          </Text>
          <Text style={styles.summaryLabel}>pace</Text>
        </View>
      </View>

      {/* At-a-Glance */}
      <View style={styles.glanceCard}>
        <Text style={styles.glanceText}>{coaching.atAGlance}</Text>
      </View>

      {/* Running Dynamics */}
      <Text style={styles.sectionTitle}>Running Dynamics</Text>
      <View style={styles.metricsGrid}>
        <MetricCard
          label="Cadence"
          value={summaryMetrics.avgCadence.value.toFixed(0)}
          unit="spm"
          gradeValue={summaryMetrics.avgCadence}
        />
        <MetricCard
          label="Ground Contact"
          value={summaryMetrics.avgGct.value.toFixed(0)}
          unit="ms"
          gradeValue={summaryMetrics.avgGct}
        />
        <MetricCard
          label="GCT Balance"
          value={summaryMetrics.avgGctBalance.value.toFixed(1)}
          unit="%"
          gradeValue={summaryMetrics.avgGctBalance}
        />
        <MetricCard
          label="Vertical Ratio"
          value={summaryMetrics.avgVerticalRatio.value.toFixed(1)}
          unit="%"
          gradeValue={summaryMetrics.avgVerticalRatio}
        />
      </View>

      {/* Workout Compliance */}
      {workoutCompliance && (
        <>
          <Text style={styles.sectionTitle}>Workout Compliance</Text>
          <WorkoutComplianceCard compliance={workoutCompliance} defaultExpanded />
        </>
      )}
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
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryStat: {
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1976D2",
  },
  summaryLabel: {
    fontSize: 12,
    color: "#49454F",
    marginTop: 4,
  },
  glanceCard: {
    backgroundColor: "#E3F2FD",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  glanceText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1565C0",
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1B1F",
    marginBottom: 12,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    width: "47%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  metricLabel: {
    fontSize: 12,
    color: "#49454F",
    marginBottom: 8,
  },
  metricRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1C1B1F",
  },
  metricUnit: {
    fontSize: 14,
    color: "#49454F",
  },
  gradeBadge: {
    marginLeft: "auto",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  gradeText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
});
