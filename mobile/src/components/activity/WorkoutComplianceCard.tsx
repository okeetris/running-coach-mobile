/**
 * Workout Compliance Card
 *
 * Shows workout compliance with expandable step-by-step breakdown.
 * Includes visual pace compliance bars and distance/duration details.
 */

import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  LayoutAnimation,
} from "react-native";
import type { WorkoutCompliance, StepCompliance } from "../../types";

interface Props {
  compliance: WorkoutCompliance;
  defaultExpanded?: boolean;
}

function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${Math.round(meters)} m`;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remainMins = mins % 60;
    return `${hrs}:${remainMins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

const statusConfig = {
  hit: { icon: "✓", color: "#4CAF50", label: "Hit" },
  partial: { icon: "~", color: "#FFC107", label: "Close" },
  fast: { icon: "↑", color: "#2196F3", label: "Fast" },
  missed: { icon: "✗", color: "#F44336", label: "Missed" },
  no_target: { icon: "-", color: "#9E9E9E", label: "No Target" },
};

function PaceComplianceBar({ step }: { step: StepCompliance }) {
  if (!step.targetPaceRange || !step.actualPaceSecKm) {
    return null;
  }

  // Parse target paces (format "M:SS")
  const parsePace = (paceStr: string): number => {
    const [mins, secs] = paceStr.split(":").map(Number);
    return mins * 60 + secs;
  };

  const fastTarget = parsePace(step.targetPaceRange.fast);
  const slowTarget = parsePace(step.targetPaceRange.slow);
  const actual = step.actualPaceSecKm;

  // Calculate range for visualization
  // Add 30 sec buffer on each side for visual context
  const rangeStart = fastTarget - 30;
  const rangeEnd = slowTarget + 30;
  const totalRange = rangeEnd - rangeStart;

  // Calculate positions as percentages
  const targetStartPct = ((fastTarget - rangeStart) / totalRange) * 100;
  const targetWidthPct = ((slowTarget - fastTarget) / totalRange) * 100;
  const actualPct = Math.max(0, Math.min(100, ((actual - rangeStart) / totalRange) * 100));

  const isInRange = actual >= fastTarget && actual <= slowTarget;
  const isFast = actual < fastTarget;
  const markerColor = isInRange ? "#4CAF50" : isFast ? "#2196F3" : "#F44336";

  return (
    <View style={styles.paceBarContainer}>
      <View style={styles.paceBarTrack}>
        {/* Target zone */}
        <View
          style={[
            styles.paceBarTarget,
            {
              left: `${targetStartPct}%`,
              width: `${targetWidthPct}%`,
            },
          ]}
        />
        {/* Actual pace marker */}
        <View
          style={[
            styles.paceBarMarker,
            {
              left: `${actualPct}%`,
              backgroundColor: markerColor,
            },
          ]}
        />
      </View>
      <View style={styles.paceBarLabels}>
        <Text style={styles.paceBarLabel}>{step.targetPaceRange.fast}</Text>
        <Text style={styles.paceBarLabel}>{step.targetPaceRange.slow}</Text>
      </View>
    </View>
  );
}

function StepCard({ step, index }: { step: StepCompliance; index: number }) {
  const config = statusConfig[step.status] || statusConfig.no_target;

  return (
    <View style={styles.stepCard}>
      {/* Step header */}
      <View style={styles.stepHeader}>
        <View style={[styles.stepStatusBadge, { backgroundColor: config.color + "20" }]}>
          <Text style={[styles.stepStatusIcon, { color: config.color }]}>{config.icon}</Text>
        </View>
        <View style={styles.stepTitleContainer}>
          <Text style={styles.stepType}>{step.stepType}</Text>
          {step.lapsUsed && step.lapsUsed.length > 0 && (
            <Text style={styles.stepLapsLabel}>
              {step.lapsUsed.length === 1 ? `Lap ${step.lapsUsed[0]}` : `Laps ${step.lapsUsed.join("-")}`}
            </Text>
          )}
        </View>
        <View style={styles.stepPaceContainer}>
          {step.actualPace && (
            <Text style={[styles.stepActualPace, { color: config.color }]}>
              {step.actualPace}/km
            </Text>
          )}
        </View>
      </View>

      {/* Pace compliance bar */}
      <PaceComplianceBar step={step} />

      {/* Step details */}
      <View style={styles.stepDetails}>
        {step.actualDistanceM && step.actualDistanceM > 0 && (
          <View style={styles.stepDetailItem}>
            <Text style={styles.stepDetailLabel}>Distance</Text>
            <Text style={styles.stepDetailValue}>{formatDistance(step.actualDistanceM)}</Text>
            {step.targetDistanceM && (
              <Text style={styles.stepDetailTarget}>/ {formatDistance(step.targetDistanceM)}</Text>
            )}
          </View>
        )}
        {step.actualDurationSec && step.actualDurationSec > 0 && (
          <View style={styles.stepDetailItem}>
            <Text style={styles.stepDetailLabel}>Duration</Text>
            <Text style={styles.stepDetailValue}>{formatDuration(step.actualDurationSec)}</Text>
            {step.targetDurationSec && (
              <Text style={styles.stepDetailTarget}>/ {formatDuration(step.targetDurationSec)}</Text>
            )}
          </View>
        )}
        {step.targetPaceRange && (
          <View style={styles.stepDetailItem}>
            <Text style={styles.stepDetailLabel}>Target</Text>
            <Text style={styles.stepDetailValue}>
              {step.targetPaceRange.fast}-{step.targetPaceRange.slow}/km
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

export function WorkoutComplianceCard({ compliance, defaultExpanded }: Props) {
  // Default: expanded for single-step, collapsed for multi-step
  const [isExpanded, setIsExpanded] = useState(
    defaultExpanded ?? compliance.totalSteps <= 1
  );

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  // Compliance percent color based on value
  const complianceColor =
    compliance.compliancePercent >= 80
      ? "#4CAF50"
      : compliance.compliancePercent >= 50
        ? "#FFC107"
        : "#F44336";

  // Distance status
  const distanceStatusText = compliance.distanceStatus === "short"
    ? "Short"
    : compliance.distanceStatus === "long"
      ? "Long"
      : compliance.distanceStatus === "hit"
        ? "On target"
        : null;

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.workoutName}>{compliance.workoutName}</Text>
          {compliance.workoutDescription && (
            <Text style={styles.workoutDescription} numberOfLines={2}>
              {compliance.workoutDescription}
            </Text>
          )}
        </View>
        <View style={[styles.complianceBadge, { backgroundColor: complianceColor + "20" }]}>
          <Text style={[styles.compliancePercent, { color: complianceColor }]}>
            {compliance.compliancePercent}%
          </Text>
        </View>
      </View>

      {/* Summary stats */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: "#4CAF50" }]}>{compliance.stepsHit}</Text>
          <Text style={styles.summaryLabel}>Hit</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: "#FFC107" }]}>{compliance.stepsPartial}</Text>
          <Text style={styles.summaryLabel}>Partial</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: "#F44336" }]}>{compliance.stepsMissed}</Text>
          <Text style={styles.summaryLabel}>Missed</Text>
        </View>
        {distanceStatusText && (
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{distanceStatusText}</Text>
            <Text style={styles.summaryLabel}>Distance</Text>
          </View>
        )}
      </View>

      {/* Expandable step breakdown */}
      {compliance.stepBreakdown.length > 0 && (
        <>
          <Pressable onPress={toggleExpand} style={styles.expandButton}>
            <Text style={styles.expandButtonText}>
              {isExpanded ? "Hide" : "Show"} Step Details
            </Text>
            <Text style={styles.expandChevron}>{isExpanded ? "▲" : "▼"}</Text>
          </Pressable>

          {isExpanded && (
            <View style={styles.stepsContainer}>
              {compliance.stepBreakdown.map((step, index) => (
                <StepCard key={index} step={step} index={index} />
              ))}
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1B1F",
  },
  workoutDescription: {
    fontSize: 13,
    color: "#49454F",
    marginTop: 4,
  },
  complianceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  compliancePercent: {
    fontSize: 16,
    fontWeight: "bold",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  summaryItem: {
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1C1B1F",
  },
  summaryLabel: {
    fontSize: 11,
    color: "#9E9E9E",
    marginTop: 2,
  },
  expandButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    gap: 6,
  },
  expandButtonText: {
    fontSize: 13,
    color: "#1976D2",
    fontWeight: "500",
  },
  expandChevron: {
    fontSize: 10,
    color: "#1976D2",
  },
  stepsContainer: {
    gap: 12,
  },
  stepCard: {
    backgroundColor: "#FAFAFA",
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#E0E0E0",
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  stepStatusBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  stepStatusIcon: {
    fontSize: 14,
    fontWeight: "bold",
  },
  stepTitleContainer: {
    flex: 1,
  },
  stepType: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1C1B1F",
  },
  stepLapsLabel: {
    fontSize: 11,
    color: "#9E9E9E",
    marginTop: 1,
  },
  stepPaceContainer: {
    alignItems: "flex-end",
  },
  stepActualPace: {
    fontSize: 15,
    fontWeight: "bold",
  },
  paceBarContainer: {
    marginTop: 10,
    marginBottom: 6,
  },
  paceBarTrack: {
    height: 8,
    backgroundColor: "#E0E0E0",
    borderRadius: 4,
    position: "relative",
    overflow: "hidden",
  },
  paceBarTarget: {
    position: "absolute",
    top: 0,
    bottom: 0,
    backgroundColor: "#C8E6C9",
    borderRadius: 4,
  },
  paceBarMarker: {
    position: "absolute",
    top: -2,
    width: 4,
    height: 12,
    borderRadius: 2,
    marginLeft: -2,
  },
  paceBarLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  paceBarLabel: {
    fontSize: 10,
    color: "#9E9E9E",
  },
  stepDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E8E8E8",
  },
  stepDetailItem: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  stepDetailLabel: {
    fontSize: 11,
    color: "#9E9E9E",
  },
  stepDetailValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1C1B1F",
  },
  stepDetailTarget: {
    fontSize: 11,
    color: "#BDBDBD",
  },
});
