import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Text,
  View,
  RefreshControl,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FlashList } from "@shopify/flash-list";

import { useActivities, useSyncActivities } from "./src/hooks/useActivities";
import { ActivityCard } from "./src/components/activity/ActivityCard";
import type { ActivitySummary } from "./src/types";

// Create QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000,
    },
  },
});

/**
 * Main activities screen with sync-on-open.
 */
function ActivitiesScreen() {
  const { data: activities, isLoading, error, refetch } = useActivities();
  const syncMutation = useSyncActivities();

  // Sync on first mount
  useEffect(() => {
    syncMutation.mutate(10);
  }, []);

  const handleRefresh = () => {
    syncMutation.mutate(10);
  };

  const handleActivityPress = (activity: ActivitySummary) => {
    // TODO: Navigate to activity detail
    console.log("Activity pressed:", activity.id);
  };

  const isRefreshing = syncMutation.isPending;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Running Coach</Text>
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
          <Text style={styles.successText}>
            {syncMutation.data.message}
          </Text>
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
          estimatedItemSize={120}
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

      <StatusBar style="auto" />
    </View>
  );
}

/**
 * App root with QueryClientProvider.
 */
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ActivitiesScreen />
    </QueryClientProvider>
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
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1C1B1F",
  },
  syncButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#E3F2FD",
    borderRadius: 20,
    minWidth: 60,
    alignItems: "center",
  },
  syncButtonText: {
    color: "#1976D2",
    fontWeight: "600",
  },
  syncStatus: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    backgroundColor: "#E3F2FD",
    gap: 8,
  },
  syncStatusText: {
    color: "#1976D2",
    fontSize: 14,
  },
  syncError: {
    backgroundColor: "#FFEBEE",
  },
  syncSuccess: {
    backgroundColor: "#E8F5E9",
  },
  errorText: {
    color: "#D32F2F",
    fontSize: 14,
  },
  successText: {
    color: "#388E3C",
    fontSize: 14,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#49454F",
  },
  errorDetail: {
    marginTop: 8,
    fontSize: 14,
    color: "#49454F",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#1976D2",
    borderRadius: 24,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  listContent: {
    paddingVertical: 8,
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#49454F",
  },
  emptyHint: {
    marginTop: 8,
    fontSize: 14,
    color: "#757575",
  },
});
