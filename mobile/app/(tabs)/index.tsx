/**
 * Home Screen
 *
 * Dashboard with welcome message, analyze CTA, and latest analysis.
 */

import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useActivities } from "../../src/hooks/useActivities";
import type { ActivitySummary, Grade } from "../../src/types";

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
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

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
        {activity.distanceKm.toFixed(1)} km
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.title}>Running Coach</Text>
        </View>
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
              <Text style={styles.quickActionIcon}>🔄</Text>
              <Text style={styles.quickActionLabel}>Sync</Text>
            </Pressable>
            <Pressable style={[styles.quickAction, styles.quickActionDisabled]}>
              <Text style={styles.quickActionIcon}>❤️</Text>
              <Text style={styles.quickActionLabel}>Recovery</Text>
            </Pressable>
            <Pressable style={[styles.quickAction, styles.quickActionDisabled]}>
              <Text style={styles.quickActionIcon}>📈</Text>
              <Text style={styles.quickActionLabel}>Trends</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "#FFFFFF",
  },
  greeting: {
    fontSize: 14,
    color: "#757575",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1C1B1F",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  analyzeCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1976D2",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    elevation: 4,
    shadowColor: "#1976D2",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  analyzeCtaContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  analyzeCtaIcon: {
    fontSize: 32,
  },
  analyzeCtaText: {
    gap: 2,
  },
  analyzeCtaTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  analyzeCtaSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
  },
  analyzeCtaArrow: {
    fontSize: 24,
    color: "#FFFFFF",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1C1B1F",
    marginBottom: 12,
  },
  latestCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  latestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  latestDate: {
    fontSize: 13,
    color: "#757575",
  },
  complianceBadge: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  complianceText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4CAF50",
  },
  latestTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1C1B1F",
    marginBottom: 4,
  },
  latestStats: {
    fontSize: 14,
    color: "#49454F",
    marginBottom: 12,
  },
  gradesRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    marginBottom: 12,
  },
  gradeItem: {
    alignItems: "center",
    gap: 4,
  },
  gradeLabel: {
    fontSize: 11,
    color: "#9E9E9E",
    fontWeight: "500",
  },
  gradeBadge: {
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
  viewDetailsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
  },
  viewDetailsText: {
    fontSize: 14,
    color: "#1976D2",
    fontWeight: "500",
  },
  viewDetailsArrow: {
    fontSize: 16,
    color: "#1976D2",
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#49454F",
  },
  emptyHint: {
    fontSize: 14,
    color: "#9E9E9E",
    marginTop: 4,
  },
  quickActionsRow: {
    flexDirection: "row",
    gap: 12,
  },
  quickAction: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  quickActionDisabled: {
    opacity: 0.5,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  quickActionLabel: {
    fontSize: 11,
    color: "#49454F",
    fontWeight: "500",
  },
  toolsRow: {
    flexDirection: "row",
    gap: 12,
  },
  toolCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  toolIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  toolTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1B1F",
    marginBottom: 2,
  },
  toolSubtitle: {
    fontSize: 12,
    color: "#757575",
  },
});
