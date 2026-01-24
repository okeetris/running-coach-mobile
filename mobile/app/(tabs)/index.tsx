/**
 * Home Screen
 *
 * Dashboard with welcome message, analyze CTA, and latest analysis.
 */

import { View, Text, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useActivities } from "../../src/hooks/useActivities";
import type { ActivitySummary, Grade } from "../../src/types";
import { styles } from "./_index.styles";

const gradeColors: Record<Grade, string> = {
  A: "#4CAF50",
  B: "#8BC34A",
  C: "#FFC107",
  D: "#F44336",
};

function formatDate(dateString: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();

  // Compare by calendar date in local timezone
  const dateLocal = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const nowLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((nowLocal.getTime() - dateLocal.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatPace(secPerKm: number): string {
  if (!secPerKm || secPerKm === 0) return "--:--";
  const mins = Math.floor(secPerKm / 60);
  const secs = Math.floor(secPerKm % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}/km`;
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds === 0) return "";
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins} min`;
}

function GradeBadge({ grade }: { grade: Grade }) {
  return (
    <View style={[styles.gradeBadge, { backgroundColor: gradeColors[grade] }]}>
      <Text style={styles.gradeText}>{grade}</Text>
    </View>
  );
}

function LatestAnalysisCard({ activity }: { activity: ActivitySummary }) {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/activity/${activity.id}`);
  };

  return (
    <Pressable style={styles.latestCard} onPress={handlePress}>
      <View style={styles.latestHeader}>
        <Text style={styles.latestDate}>{formatDate(activity.startTime)}</Text>
        {activity.compliancePercent !== undefined && (
          <View style={styles.complianceBadge}>
            <Text style={styles.complianceText}>{activity.compliancePercent}%</Text>
          </View>
        )}
      </View>
      <Text style={styles.latestTitle}>
        {activity.workoutName || activity.activityName}
      </Text>
      <Text style={styles.latestStats}>
        {activity.distanceKm.toFixed(1)} km • {formatDuration(activity.durationSeconds)}
      </Text>

      {/* Placeholder grades - will be populated when we add grades to summary */}
      {activity.grades && (
        <View style={styles.gradesRow}>
          <View style={styles.gradeItem}>
            <Text style={styles.gradeLabel}>CAD</Text>
            <GradeBadge grade={activity.grades.cadence} />
          </View>
          <View style={styles.gradeItem}>
            <Text style={styles.gradeLabel}>GCT</Text>
            <GradeBadge grade={activity.grades.gct} />
          </View>
          <View style={styles.gradeItem}>
            <Text style={styles.gradeLabel}>BAL</Text>
            <GradeBadge grade={activity.grades.gctBalance} />
          </View>
          <View style={styles.gradeItem}>
            <Text style={styles.gradeLabel}>V.R</Text>
            <GradeBadge grade={activity.grades.verticalRatio} />
          </View>
        </View>
      )}

      <View style={styles.viewDetailsRow}>
        <Text style={styles.viewDetailsText}>View Details</Text>
        <Text style={styles.viewDetailsArrow}>→</Text>
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { data: activities } = useActivities();

  const latestActivity = activities?.[0];

  const handleAnalyzePress = () => {
    router.push("/analyze");
  };

  const handleActivitiesPress = () => {
    router.push("/activities");
  };

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const handleSettingsPress = () => {
    router.push("/settings");
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.title}>Atlas</Text>
        </View>
        <Pressable style={styles.settingsButton} onPress={handleSettingsPress}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Analyze CTA */}
        <Pressable style={styles.analyzeCta} onPress={handleAnalyzePress}>
          <View style={styles.analyzeCtaContent}>
            <Text style={styles.analyzeCtaIcon}>📊</Text>
            <View style={styles.analyzeCtaText}>
              <Text style={styles.analyzeCtaTitle}>Analyze New Run</Text>
              <Text style={styles.analyzeCtaSubtitle}>Get biomechanics insights</Text>
            </View>
          </View>
          <Text style={styles.analyzeCtaArrow}>→</Text>
        </Pressable>

        {/* Latest Analysis */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Latest Analysis</Text>
          {latestActivity ? (
            <LatestAnalysisCard activity={latestActivity} />
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No activities yet</Text>
              <Text style={styles.emptyHint}>
                Sync with Garmin to see your runs
              </Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsRow}>
            <Pressable style={styles.quickAction} onPress={handleActivitiesPress}>
              <Text style={styles.quickActionIcon}>🏃</Text>
              <Text style={styles.quickActionLabel}>All Runs</Text>
            </Pressable>
            <Pressable style={styles.quickAction} onPress={handleAnalyzePress}>
              <Text style={styles.quickActionIcon}>📥</Text>
              <Text style={styles.quickActionLabel}>Fetch New</Text>
            </Pressable>
          </View>
        </View>

        {/* Your Tools */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Tools</Text>
          <View style={styles.toolsRow}>
            <Pressable
              style={styles.toolCard}
              onPress={() => router.push("/tools/glucose")}
            >
              <Text style={styles.toolIcon}>🩸</Text>
              <Text style={styles.toolTitle}>Glucose</Text>
              <Text style={styles.toolSubtitle}>mmol/L ↔ mg/dL</Text>
            </Pressable>
            <Pressable
              style={styles.toolCard}
              onPress={() => router.push("/tools/pace")}
            >
              <Text style={styles.toolIcon}>⏱️</Text>
              <Text style={styles.toolTitle}>Pace</Text>
              <Text style={styles.toolSubtitle}>Speed & Race Times</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
