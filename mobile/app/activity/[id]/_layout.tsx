/**
 * Activity Detail Tab Layout
 *
 * Top tabs for Summary, Charts, Laps, Coaching.
 */

import { View, Text, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { Tabs, useLocalSearchParams, useRouter } from "expo-router";
import { useActivityDetails } from "../../../src/hooks/useActivities";
import { ActivityProvider } from "../../../src/contexts/ActivityContext";

function formatDate(dateString: string): string {
  if (!dateString) return "Unknown date";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function getActivityTypeLabel(activityType?: string): string | null {
  switch (activityType) {
    case "treadmill_running":
      return "Treadmill";
    case "trail_running":
      return "Trail";
    case "track_running":
      return "Track";
    default:
      return null;
  }
}

export default function ActivityDetailLayout() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: activity, isLoading, error } = useActivityDetails(id || "");

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={styles.loadingText}>Loading analysis...</Text>
      </View>
    );
  }

  if (error || !activity) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Failed to load activity</Text>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ActivityProvider activity={activity} isLoading={isLoading} error={error}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backPressable}>
            <Text style={styles.backArrow}>←</Text>
          </Pressable>
          <View style={styles.headerText}>
            <View style={styles.titleRow}>
              <Text style={styles.title} numberOfLines={1}>
                {activity.activityName}
              </Text>
              {getActivityTypeLabel(activity.activityType) && (
                <View style={styles.typeBadge}>
                  <Text style={styles.typeBadgeText}>
                    {getActivityTypeLabel(activity.activityType)}
                  </Text>
                </View>
              )}
              {activity.hasRunningDynamics && (
                <View style={styles.rdBadge}>
                  <Text style={styles.rdBadgeText}>RD</Text>
                </View>
              )}
            </View>
            <Text style={styles.date}>{formatDate(activity.startTime)}</Text>
          </View>
        </View>

        {/* Tabs */}
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: styles.tabBar,
            tabBarActiveTintColor: "#1976D2",
            tabBarInactiveTintColor: "#757575",
            tabBarLabelStyle: styles.tabLabel,
            tabBarIcon: () => null,
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: "Summary",
            }}
          />
          <Tabs.Screen
            name="charts"
            options={{
              title: "Charts",
            }}
          />
          <Tabs.Screen
            name="laps"
            options={{
              title: "Laps",
            }}
          />
          <Tabs.Screen
            name="coaching"
            options={{
              title: "Coaching",
            }}
          />
        </Tabs>
      </View>
    </ActivityProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#FAFAFA",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#49454F",
  },
  errorText: {
    fontSize: 16,
    color: "#D32F2F",
    marginBottom: 16,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#1976D2",
    borderRadius: 24,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
  },
  backPressable: {
    padding: 8,
    marginRight: 8,
  },
  backArrow: {
    fontSize: 24,
    color: "#1976D2",
  },
  headerText: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1C1B1F",
    flexShrink: 1,
  },
  typeBadge: {
    backgroundColor: "#E8E8E8",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#616161",
  },
  rdBadge: {
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#1976D2",
  },
  rdBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#1976D2",
  },
  date: {
    fontSize: 13,
    color: "#49454F",
    marginTop: 2,
  },
  tabBar: {
    backgroundColor: "#FFFFFF",
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "none",
  },
});
