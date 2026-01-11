import { API_BASE_URL, API_ENDPOINTS } from "./apiConfig";
import type { ActivitySummary, ActivityDetails, HealthCheck } from "../types";

/**
 * API Client for Running Coach Backend
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

async function fetchJson<T>(endpoint: string): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new ApiError(
        response.status,
        `HTTP ${response.status}: ${response.statusText}`
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
  return fetchJson<HealthCheck>(API_ENDPOINTS.health);
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
export async function fetchActivityDetail(id: string): Promise<ActivityDetails> {
  return fetchJson<ActivityDetails>(API_ENDPOINTS.activityDetail(id));
}

export { ApiError };
