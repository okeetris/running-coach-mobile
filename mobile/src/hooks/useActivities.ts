/**
 * TanStack Query hooks for activities.
 *
 * Handles fetching, caching, and syncing activities from the backend.
 * Includes MFA (Multi-Factor Authentication) support for Garmin sync.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_BASE_URL, API_ENDPOINTS } from "../services/apiConfig";
import { getAuthHeader, updateTokensIfRefreshed } from "../services/authService";
import type { ActivitySummary, ActivityDetails, MFARequiredResponse, MFASubmitResponse } from "../types";

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
 * Fetch activities list from backend.
 */
async function fetchActivities(): Promise<ActivitySummary[]> {
  const headers: Record<string, string> = {};
  const authHeader = await getAuthHeader();
  if (authHeader) {
    headers["Authorization"] = authHeader;
  }

  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.activities}`, { headers });
  if (!response.ok) {
    throw new Error(`Failed to fetch activities: ${response.statusText}`);
  }
  return response.json();
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
    onSuccess: (data) => {
      // Only invalidate if actual sync happened (not MFA required)
      if (!isMFARequired(data)) {
        queryClient.invalidateQueries({ queryKey: ["activities"] });
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
