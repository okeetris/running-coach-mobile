/**
 * Summary Tab
 *
 * Shows key metrics, grades, at-a-glance, and workout compliance.
 */

import { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { useActivity } from "../../../src/contexts/ActivityContext";
import { styles } from "../../../src/styles/app/activity-detail/index.styles";
import { WorkoutComplianceCard } from "../../../src/components/activity/WorkoutComplianceCard";
import { HRZonesCard } from "../../../src/components/activity/HRZonesCard";
import { METRIC_INFO } from "../../../src/constants/metricInfo";
import { calculateHRZones, type HRZone } from "../../../src/utils/hrZones";
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

  // Use Garmin's pre-calculated HR zones if available, otherwise calculate locally
  const hrZones = useMemo((): HRZone[] | null => {
    // Prefer Garmin's activity-specific zones (from API)
    if (activity?.hrZones && activity.hrZones.length > 0) {
      return activity.hrZones.map((z) => ({
        zone: z.zone,
        name: z.name || `Zone ${z.zone}`,
        color: z.color || "#9E9E9E",
        minHR: z.minHR || 0,
        maxHR: z.maxHR || 0,
        seconds: z.seconds,
        percentage: z.percentage || 0,
      }));
    }
    // Fallback to local calculation from time series
    if (!activity?.timeSeries) return null;
    return calculateHRZones(activity.timeSeries);
  }, [activity?.hrZones, activity?.timeSeries]);

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
