/**
 * Analyze Screen
 *
 * Trigger new run analysis or select a specific activity to analyze.
 */

import { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { styles } from "../../src/styles/app/tabs/analyze.styles";
import {
  useActivities,
  useSyncActivities,
  useSubmitMFA,
  isMFARequired,
} from "../../src/hooks/useActivities";
import { MFAModal } from "../../src/components/MFAModal";
import type { ActivitySummary } from "../../src/types";

function formatDate(dateString: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function RecentActivityItem({
  activity,
  onPress,
}: {
  activity: ActivitySummary;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.recentItem} onPress={onPress}>
      <View style={styles.recentInfo}>
        <Text style={styles.recentDate}>{formatDate(activity.startTime)}</Text>
        <Text style={styles.recentName}>
          {activity.workoutName || activity.activityName}
        </Text>
        <Text style={styles.recentStats}>
          {activity.distanceKm.toFixed(1)} km
        </Text>
      </View>
      <Text style={styles.recentArrow}>→</Text>
    </Pressable>
  );
}

export default function AnalyzeScreen() {
  const router = useRouter();
  const { data: activities, isLoading: activitiesLoading, isFetching: activitiesFetching } = useActivities();
  const syncMutation = useSyncActivities();
  const mfaMutation = useSubmitMFA();
  const [showMFAModal, setShowMFAModal] = useState(false);
  const [mfaError, setMfaError] = useState<string | null>(null);

  // Check if sync result requires MFA
  useEffect(() => {
    if (syncMutation.data && isMFARequired(syncMutation.data)) {
      setShowMFAModal(true);
      setMfaError(null);
    }
  }, [syncMutation.data]);

  // After successful sync, navigate to the latest activity
  useEffect(() => {
    if (
      syncMutation.isSuccess &&
      !isMFARequired(syncMutation.data) &&
      syncMutation.data.activities?.length > 0
    ) {
      const latestId = syncMutation.data.activities[0].id;
      router.push(`/activity/${latestId}`);
    }
  }, [syncMutation.isSuccess, syncMutation.data]);

  const handleFetchLatest = () => {
    syncMutation.mutate(1);
  };

  const handleActivityPress = (activity: ActivitySummary) => {
    router.push(`/activity/${activity.id}`);
  };

  const handleMFASubmit = (code: string) => {
    setMfaError(null);
    mfaMutation.mutate(code, {
      onSuccess: () => {
        setShowMFAModal(false);
        syncMutation.mutate(1);
      },
      onError: (err) => {
        setMfaError(err.message);
      },
    });
  };

  const handleMFACancel = () => {
    setShowMFAModal(false);
    setMfaError(null);
  };

  // Get recent activities (limit to 5)
  const recentActivities = activities?.slice(0, 5) || [];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Analyze Run</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Fetch Latest CTA */}
        <Pressable
          style={[
            styles.fetchButton,
            syncMutation.isPending && styles.fetchButtonDisabled,
          ]}
          onPress={handleFetchLatest}
          disabled={syncMutation.isPending}
        >
          {syncMutation.isPending ? (
            <>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.fetchButtonText}>Fetching...</Text>
            </>
          ) : (
            <>
              <Text style={styles.fetchButtonIcon}>📥</Text>
              <Text style={styles.fetchButtonText}>Fetch Latest Run</Text>
            </>
          )}
        </Pressable>

        {syncMutation.isError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>
              {syncMutation.error.message}
            </Text>
          </View>
        )}

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR SELECT</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Recent Activities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activities</Text>
          {activitiesLoading || activitiesFetching ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color="#1976D2" />
              <Text style={styles.emptyHint}>Loading activities...</Text>
            </View>
          ) : recentActivities.length > 0 ? (
            <View style={styles.recentList}>
              {recentActivities.map((activity) => (
                <RecentActivityItem
                  key={activity.id}
                  activity={activity}
                  onPress={() => handleActivityPress(activity)}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No activities yet</Text>
              <Text style={styles.emptyHint}>
                Tap "Fetch Latest Run" to sync with Garmin
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* MFA Modal */}
      <MFAModal
        visible={showMFAModal}
        onSubmit={handleMFASubmit}
        onCancel={handleMFACancel}
        isSubmitting={mfaMutation.isPending}
        error={mfaError}
      />
    </View>
  );
}
