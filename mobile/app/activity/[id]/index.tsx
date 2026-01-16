/**
 * Summary Tab
 *
 * Shows key metrics, grades, at-a-glance, and workout compliance.
 */

import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { useMemo } from "react";
import { useActivity } from "../../../src/contexts/ActivityContext";
import { WorkoutComplianceCard } from "../../../src/components/activity/WorkoutComplianceCard";
import { HRZonesCard } from "../../../src/components/activity/HRZonesCard";
import { METRIC_INFO } from "../../../src/constants/metricInfo";
import { calculateHRZones } from "../../../src/utils/hrZones";
import type { Grade, GradeValue } from "../../../src/types";

// Enable LayoutAnimation on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
  metricKey,
  isExpanded,
  onPress,
}: {
  label: string;
  value: string;
  unit: string;
  gradeValue?: GradeValue;
  metricKey: string;
  isExpanded: boolean;
  onPress: () => void;
}) {
  const metricInfo = METRIC_INFO[metricKey];
  const grade = gradeValue?.grade;

  return (
    <Pressable
      style={[styles.metricCard, isExpanded && styles.metricCardExpanded]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ expanded: isExpanded }}
      accessibilityHint="Tap to see grade details"
    >
      <View style={styles.metricHeader}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={styles.expandIndicator}>{isExpanded ? "−" : "+"}</Text>
      </View>
      <View style={styles.metricRow}>
        <Text style={styles.metricValue}>{value}</Text>
        <Text style={styles.metricUnit}>{unit}</Text>
        {gradeValue && <GradeBadge grade={gradeValue.grade} />}
      </View>

      {isExpanded && metricInfo && (
        <View style={styles.expandedContent}>
          <View style={styles.thresholdsContainer}>
            <Text style={styles.expandedLabel}>Grade Thresholds</Text>
            <View style={styles.thresholdsList}>
              {(["A", "B", "C", "D"] as Grade[]).map((g) => (
                <View
                  key={g}
                  style={[
                    styles.thresholdItem,
                    grade === g && styles.thresholdItemActive,
                  ]}
                >
                  <View
                    style={[styles.thresholdBadge, { backgroundColor: gradeColors[g] }]}
                  >
                    <Text style={styles.thresholdBadgeText}>{g}</Text>
                  </View>
                  <Text
                    style={[
                      styles.thresholdValue,
                      grade === g && styles.thresholdValueActive,
                    ]}
                  >
                    {metricInfo.thresholds[g]}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.whyContainer}>
            <Text style={styles.expandedLabel}>Why It Matters</Text>
            <Text style={styles.whyText}>{metricInfo.why}</Text>
          </View>

          {grade && grade !== "A" && metricInfo.coachingCues[grade] && (
            <View style={styles.coachingContainer}>
              <Text style={styles.coachingLabel}>Coaching Tip</Text>
              <Text style={styles.coachingText}>{metricInfo.coachingCues[grade]}</Text>
            </View>
          )}
        </View>
      )}
    </Pressable>
  );
}

export default function SummaryTab() {
  const { activity } = useActivity();
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);

  const toggleMetric = (metricKey: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedMetric(expandedMetric === metricKey ? null : metricKey);
  };

  // Calculate HR zones from time series data
  const hrZones = useMemo(() => {
    if (!activity?.timeSeries) return null;
    return calculateHRZones(activity.timeSeries);
  }, [activity?.timeSeries]);

  if (!activity) return null;

  const { summaryMetrics, coaching, workoutCompliance, complianceError } = activity;

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
          metricKey="cadence"
          isExpanded={expandedMetric === "cadence"}
          onPress={() => toggleMetric("cadence")}
        />
        <MetricCard
          label="Ground Contact"
          value={summaryMetrics.avgGct.value.toFixed(0)}
          unit="ms"
          gradeValue={summaryMetrics.avgGct}
          metricKey="gct"
          isExpanded={expandedMetric === "gct"}
          onPress={() => toggleMetric("gct")}
        />
        <MetricCard
          label="GCT Balance"
          value={summaryMetrics.avgGctBalance.value.toFixed(1)}
          unit="%"
          gradeValue={summaryMetrics.avgGctBalance}
          metricKey="gctBalance"
          isExpanded={expandedMetric === "gctBalance"}
          onPress={() => toggleMetric("gctBalance")}
        />
        <MetricCard
          label="Vertical Ratio"
          value={summaryMetrics.avgVerticalRatio.value.toFixed(1)}
          unit="%"
          gradeValue={summaryMetrics.avgVerticalRatio}
          metricKey="verticalRatio"
          isExpanded={expandedMetric === "verticalRatio"}
          onPress={() => toggleMetric("verticalRatio")}
        />
      </View>

      {/* Heart Rate Zones */}
      {hrZones && (
        <>
          <Text style={styles.sectionTitle}>Heart Rate Zones</Text>
          <View style={styles.hrZonesContainer}>
            <HRZonesCard zones={hrZones} avgHR={summaryMetrics.avgHeartRate} />
          </View>
        </>
      )}

      {/* Workout Compliance */}
      {workoutCompliance && (
        <>
          <Text style={styles.sectionTitle}>Workout Compliance</Text>
          <WorkoutComplianceCard compliance={workoutCompliance} defaultExpanded />
        </>
      )}
      {!workoutCompliance && complianceError && (
        <View style={styles.complianceError}>
          <Text style={styles.complianceErrorTitle}>Workout Compliance Unavailable</Text>
          <Text style={styles.complianceErrorText}>
            {complianceError === "No authorization header"
              ? "Sign in to Garmin to view workout compliance"
              : complianceError}
          </Text>
        </View>
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
  hrZonesContainer: {
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
  metricCardExpanded: {
    width: "100%",
    elevation: 4,
    shadowOpacity: 0.15,
  },
  metricHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metricLabel: {
    fontSize: 12,
    color: "#49454F",
    marginBottom: 8,
  },
  expandIndicator: {
    fontSize: 18,
    color: "#49454F",
    fontWeight: "500",
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
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  thresholdsContainer: {
    marginBottom: 12,
  },
  expandedLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#49454F",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  thresholdsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  thresholdItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: "#F5F5F5",
  },
  thresholdItemActive: {
    backgroundColor: "#E3F2FD",
  },
  thresholdBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  thresholdBadgeText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  thresholdValue: {
    fontSize: 12,
    color: "#49454F",
  },
  thresholdValueActive: {
    fontWeight: "600",
    color: "#1565C0",
  },
  whyContainer: {
    marginBottom: 12,
  },
  whyText: {
    fontSize: 13,
    color: "#1C1B1F",
    lineHeight: 18,
  },
  coachingContainer: {
    backgroundColor: "#FFF8E1",
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#FFB300",
  },
  coachingLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FF8F00",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  coachingText: {
    fontSize: 13,
    color: "#5D4037",
    lineHeight: 18,
  },
  complianceError: {
    backgroundColor: "#FFF3E0",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#FF9800",
  },
  complianceErrorTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#E65100",
    marginBottom: 4,
  },
  complianceErrorText: {
    fontSize: 13,
    color: "#BF360C",
  },
});
