import { API_BASE_URL, API_ENDPOINTS } from "./apiConfig";
import {
  getAuthHeader,
  updateTokensIfRefreshed,
} from "./authService";
import type { ActivitySummary, ActivityDetails, HealthCheck } from "../types";

/**
 * API Client for Running Coach Backend
 *
 * Automatically includes Garmin tokens in requests and handles token refresh.
 */

class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface FetchOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: object;
  includeAuth?: boolean;
}

async function fetchJson<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { method = "GET", body, includeAuth = true } = options;
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Include auth token if available and requested
    if (includeAuth) {
      const authHeader = await getAuthHeader();
      if (authHeader) {
        headers["Authorization"] = authHeader;
      }
    }

    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    if (body) {
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(url, fetchOptions);

    // Check for refreshed tokens and save them
    await updateTokensIfRefreshed(response);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        response.status,
        errorData.detail || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    return response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network error or other fetch failure
    throw new ApiError(0, `Network error: ${(error as Error).message}`);
  }
}

/**
 * Check backend health status
 */
export async function checkHealth(): Promise<HealthCheck> {
  return fetchJson<HealthCheck>(API_ENDPOINTS.health, { includeAuth: false });
}

/**
 * Fetch list of all activities
 */
export async function fetchActivities(): Promise<ActivitySummary[]> {
  return fetchJson<ActivitySummary[]>(API_ENDPOINTS.activities);
}

/**
 * Fetch detailed analysis for a specific activity
 */
export async function fetchActivityDetail(
  id: string
): Promise<ActivityDetails> {
  return fetchJson<ActivityDetails>(API_ENDPOINTS.activityDetail(id));
}

/**
 * Sync response types
 */
interface SyncResponse {
  synced: number;
  activities: ActivitySummary[];
  message: string;
}

interface MFARequiredResponse {
  mfa_required: true;
  message: string;
}

type SyncResult = SyncResponse | MFARequiredResponse;

/**
 * Sync activities from Garmin Connect
 */
export async function syncActivities(count: number = 10): Promise<SyncResult> {
  return fetchJson<SyncResult>(`${API_ENDPOINTS.activities}/sync?count=${count}`, {
    method: "POST",
  });
}

/**
 * Check if sync response requires MFA
 */
export function isMFARequired(response: SyncResult): response is MFARequiredResponse {
  return "mfa_required" in response && response.mfa_required === true;
}

export { ApiError };
