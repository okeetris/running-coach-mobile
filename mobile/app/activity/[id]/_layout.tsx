/**
 * Activity Detail Tab Layout
 *
 * Top tabs for Summary, Charts, Laps, Coaching.
 */

import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { Tabs, useLocalSearchParams, useRouter } from "expo-router";
import { useActivityDetails } from "../../../src/hooks/useActivities";
import { ActivityProvider } from "../../../src/contexts/ActivityContext";
import { styles } from "../../../src/styles/app/activity-detail/layout.styles";

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
            tabBarIconStyle: styles.tabIcon,
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: "Summary",
              tabBarIcon: ({ focused }) => (
                <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.6 }}>📋</Text>
              ),
            }}
          />
          <Tabs.Screen
            name="charts"
            options={{
              title: "Charts",
              tabBarIcon: ({ focused }) => (
                <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.6 }}>📈</Text>
              ),
            }}
          />
          <Tabs.Screen
            name="laps"
            options={{
              title: "Laps",
              tabBarIcon: ({ focused }) => (
                <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.6 }}>⏱️</Text>
              ),
            }}
          />
          <Tabs.Screen
            name="coaching"
            options={{
              title: "Coaching",
              tabBarIcon: ({ focused }) => (
                <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.6 }}>💡</Text>
              ),
            }}
          />
        </Tabs>
      </View>
    </ActivityProvider>
  );
}
