/**
 * TanStack Query hooks for activities.
 *
 * Handles fetching, caching, and syncing activities from the backend.
 * Includes MFA (Multi-Factor Authentication) support for Garmin sync.
 * Persists activities to AsyncStorage for offline access.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL, API_ENDPOINTS } from "../services/apiConfig";
import { getAuthHeader, updateTokensIfRefreshed } from "../services/authService";
import type { ActivitySummary, ActivityDetails, MFARequiredResponse, MFASubmitResponse } from "../types";

const ACTIVITIES_STORAGE_KEY = "cached_activities";

/**
 * Load activities from device storage.
 */
async function loadCachedActivities(): Promise<ActivitySummary[]> {
  try {
    const cached = await AsyncStorage.getItem(ACTIVITIES_STORAGE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    console.warn("Failed to load cached activities:", error);
  }
  return [];
}

/**
 * Save activities to device storage.
 */
async function saveCachedActivities(activities: ActivitySummary[]): Promise<void> {
  try {
    await AsyncStorage.setItem(ACTIVITIES_STORAGE_KEY, JSON.stringify(activities));
  } catch (error) {
    console.warn("Failed to save activities to cache:", error);
  }
}

interface SyncResponse {
  synced: number;
  activities: ActivitySummary[];
  message: string;
}

// Union type for sync response (can be success or MFA required)
type SyncResult = SyncResponse | MFARequiredResponse;

function isMFARequired(response: SyncResult): response is MFARequiredResponse {
  return "mfa_required" in response && response.mfa_required === true;
}

/**
 * Fetch activities list from backend, falling back to device cache.
 * Backend has ephemeral storage, so we primarily rely on device cache.
 */
async function fetchActivities(): Promise<ActivitySummary[]> {
  // First try to load from device cache (primary source due to ephemeral backend storage)
  const cached = await loadCachedActivities();

  // Try backend as well (in case it has newer data)
  try {
    const headers: Record<string, string> = {};
    const authHeader = await getAuthHeader();
    if (authHeader) {
      headers["Authorization"] = authHeader;
    }

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.activities}`, { headers });
    if (response.ok) {
      const backendData = await response.json();
      // If backend has data, merge with cache (backend takes precedence for same IDs)
      if (backendData && backendData.length > 0) {
        const merged = mergeActivities(backendData, cached);
        await saveCachedActivities(merged);
        return merged;
      }
    }
  } catch (error) {
    // Backend unavailable, use cache
    console.warn("Backend unavailable, using cached activities");
  }

  return cached;
}

/**
 * Normalize startTime to minute precision for deduplication.
 * Strips timezone and seconds to handle format differences between sources.
 */
function normalizeStartTime(startTime: string): string {
  if (!startTime) return "";
  try {
    const date = new Date(startTime);
    // Round to nearest minute, format as ISO without seconds
    date.setSeconds(0, 0);
    return date.toISOString().slice(0, 16); // "2026-01-11T10:30"
  } catch {
    return startTime.slice(0, 16);
  }
}

/**
 * Merge activities from backend and cache, combining data from both sources.
 * Backend provides fresh metadata, cache may have grades from FIT parsing.
 * Uses normalized startTime as secondary deduplication key.
 */
function mergeActivities(backend: ActivitySummary[], cached: ActivitySummary[]): ActivitySummary[] {
  const byId = new Map<string, ActivitySummary>();
  const byNormalizedTime = new Map<string, ActivitySummary>(); // for finding duplicates

  // Index cached by normalized time for lookup
  for (const activity of cached) {
    byId.set(activity.id, activity);
    if (activity.startTime) {
      byNormalizedTime.set(normalizeStartTime(activity.startTime), activity);
    }
  }

  // Merge backend with cached data
  for (const activity of backend) {
    let merged = { ...activity };

    // Find matching cached entry (by ID or startTime)
    let cachedEntry = byId.get(activity.id);
    if (!cachedEntry && activity.startTime) {
      cachedEntry = byNormalizedTime.get(normalizeStartTime(activity.startTime));
    }

    if (cachedEntry) {
      // Merge: prefer backend for basic info, preserve cached grades/dynamics
      merged = {
        ...cachedEntry,
        ...activity,
        // Preserve grades if backend doesn't have them
        grades: activity.grades || cachedEntry.grades,
        // Preserve compliance if backend doesn't have it
        compliancePercent: activity.compliancePercent ?? cachedEntry.compliancePercent,
        workoutName: activity.workoutName || cachedEntry.workoutName,
      };

      // Remove old entry if ID changed
      if (cachedEntry.id !== activity.id) {
        byId.delete(cachedEntry.id);
      }
    }

    byId.set(activity.id, merged);
  }

  // Sort by startTime descending
  return Array.from(byId.values()).sort((a, b) =>
    (b.startTime || "").localeCompare(a.startTime || "")
  );
}

/**
 * Trigger sync with Garmin Connect.
 * May return MFA required response instead of sync data.
 */
async function syncActivities(count: number = 10): Promise<SyncResult> {
  const headers: Record<string, string> = {};

  // Include auth token if available
  const authHeader = await getAuthHeader();
  if (authHeader) {
    headers["Authorization"] = authHeader;
  }

  const response = await fetch(
    `${API_BASE_URL}${API_ENDPOINTS.activities}/sync?count=${count}`,
    { method: "POST", headers }
  );

  // Check for refreshed tokens
  await updateTokensIfRefreshed(response);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to sync activities");
  }
  return response.json();
}

/**
 * Submit MFA code to complete Garmin authentication.
 */
async function submitMFACode(code: string): Promise<MFASubmitResponse> {
  const response = await fetch(
    `${API_BASE_URL}${API_ENDPOINTS.activities}/mfa`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    }
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "MFA verification failed");
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
 *
 * Returns mutation with additional `needsMFA` flag in data when MFA is required.
 */
export function useSyncActivities() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (count: number = 10) => syncActivities(count),
    onSuccess: async (data) => {
      // Only update cache if actual sync happened (not MFA required)
      if (!isMFARequired(data)) {
        const syncData = data as SyncResponse;
        if (syncData.activities && syncData.activities.length > 0) {
          // Get existing cached activities and merge with new ones
          const existing = queryClient.getQueryData<ActivitySummary[]>(["activities"]) || [];
          const merged = mergeActivities(syncData.activities, existing);

          // Update query cache
          queryClient.setQueryData(["activities"], merged);

          // Persist to device storage
          await saveCachedActivities(merged);
        }
      }
    },
  });
}

/**
 * Check if sync result requires MFA.
 */
export { isMFARequired };

/**
 * Hook to submit MFA code.
 *
 * After successful MFA, you should retry the sync.
 */
export function useSubmitMFA() {
  return useMutation({
    mutationFn: (code: string) => submitMFACode(code),
  });
}

/**
 * Fetch activity details from backend.
 */
async function fetchActivityDetails(id: string): Promise<ActivityDetails> {
  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.activities}/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch activity: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Hook to fetch full activity details with metrics.
 */
export function useActivityDetails(activityId: string | null) {
  return useQuery({
    queryKey: ["activity", activityId],
    queryFn: () => fetchActivityDetails(activityId!),
    enabled: !!activityId,
    staleTime: 10 * 60 * 1000, // 10 minutes - parsed data doesn't change
  });
}
