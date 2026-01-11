/**
 * TanStack Query hooks for activities.
 *
 * Handles fetching, caching, and syncing activities from the backend.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_BASE_URL, API_ENDPOINTS } from "../services/apiConfig";
import type { ActivitySummary } from "../types";

interface SyncResponse {
  synced: number;
  activities: ActivitySummary[];
  message: string;
}

/**
 * Fetch activities list from backend.
 */
async function fetchActivities(): Promise<ActivitySummary[]> {
  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.activities}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch activities: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Trigger sync with Garmin Connect.
 */
async function syncActivities(count: number = 10): Promise<SyncResponse> {
  const response = await fetch(
    `${API_BASE_URL}${API_ENDPOINTS.activities}/sync?count=${count}`,
    { method: "POST" }
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to sync activities");
  }
  return response.json();
}

/**
 * Hook to fetch and cache activities list.
 *
 * Features:
 * - Fetches on mount (sync-on-open)
 * - Caches for 5 minutes (staleTime)
 * - Refetches in background when stale
 * - Refetches every 5 minutes while app is open
 */
export function useActivities() {
  return useQuery({
    queryKey: ["activities"],
    queryFn: fetchActivities,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to trigger Garmin sync.
 *
 * After successful sync, invalidates the activities cache
 * to trigger a refetch with the new data.
 */
export function useSyncActivities() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (count: number = 10) => syncActivities(count),
    onSuccess: () => {
      // Invalidate and refetch activities after sync
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}
