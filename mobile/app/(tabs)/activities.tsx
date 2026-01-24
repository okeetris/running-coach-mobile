/**
 * Activities Screen
 *
 * List of all running activities with sync functionality.
 */

import { useEffect, useState } from "react";
import {
  View,
  Text,
  RefreshControl,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { styles } from "./_activities.styles";
import { FlashList } from "@shopify/flash-list";
import {
  useActivities,
  useSyncActivities,
  useSubmitMFA,
  isMFARequired,
} from "../../src/hooks/useActivities";
import { ActivityCard } from "../../src/components/activity/ActivityCard";
import { MFAModal } from "../../src/components/MFAModal";
import type { ActivitySummary } from "../../src/types";

export default function ActivitiesScreen() {
  const router = useRouter();
  const { data: activities, isLoading, error, refetch } = useActivities();
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

  const handleRefresh = () => {
    syncMutation.mutate(20);
  };

  const handleActivityPress = (activity: ActivitySummary) => {
    router.push(`/activity/${activity.id}`);
  };

  const handleMFASubmit = (code: string) => {
    setMfaError(null);
    mfaMutation.mutate(code, {
      onSuccess: () => {
        setShowMFAModal(false);
        syncMutation.mutate(20);
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

  const isRefreshing = syncMutation.isPending;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Activities</Text>
        <Pressable
          style={styles.syncButton}
          onPress={handleRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <ActivityIndicator size="small" color="#1976D2" />
          ) : (
            <Text style={styles.syncButtonText}>Sync</Text>
          )}
        </Pressable>
      </View>

      {/* Sync status */}
      {syncMutation.isPending && (
        <View style={styles.syncStatus}>
          <ActivityIndicator size="small" color="#1976D2" />
          <Text style={styles.syncStatusText}>Syncing with Garmin...</Text>
        </View>
      )}

      {syncMutation.isError && (
        <View style={[styles.syncStatus, styles.syncError]}>
          <Text style={styles.errorText}>
            Sync failed: {syncMutation.error.message}
          </Text>
        </View>
      )}

      {syncMutation.isSuccess && !syncMutation.isPending && (
        <View style={[styles.syncStatus, styles.syncSuccess]}>
          <Text style={styles.successText}>{syncMutation.data.message}</Text>
        </View>
      )}

      {/* Loading state */}
      {isLoading && !activities && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1976D2" />
          <Text style={styles.loadingText}>Loading activities...</Text>
        </View>
      )}

      {/* Error state */}
      {error && !activities && (
        <View style={styles.centered}>
          <Text style={styles.errorText}>Failed to load activities</Text>
          <Text style={styles.errorDetail}>{error.message}</Text>
          <Pressable style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      )}

      {/* Activities list */}
      {activities && (
        <FlashList
          data={activities}
          renderItem={({ item }) => (
            <ActivityCard
              activity={item}
              onPress={() => handleActivityPress(item)}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={["#1976D2"]}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No activities found</Text>
              <Text style={styles.emptyHint}>
                Pull down to sync with Garmin
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
        />
      )}

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
