/**
 * Garmin Authentication Service
 *
 * Handles login, MFA, and secure token storage.
 * Tokens are stored in expo-secure-store (hardware-backed security).
 */

import * as SecureStore from "expo-secure-store";
import { API_BASE_URL } from "./apiConfig";

const TOKEN_KEY = "garmin_tokens";

export interface GarminTokens {
  oauth1_token: string;
  oauth1_token_secret: string;
  oauth2_access_token: string;
  oauth2_refresh_token: string;
  oauth2_expires_at?: number;
}

export interface LoginResponse {
  status: "success" | "mfa_required" | "error";
  message: string;
  tokens?: string; // Base64-encoded tokens
}

export interface MFAResponse {
  status: "success" | "error";
  message: string;
  tokens?: string;
}

/**
 * Check if user has stored Garmin tokens
 */
export async function hasStoredTokens(): Promise<boolean> {
  try {
    const tokens = await SecureStore.getItemAsync(TOKEN_KEY);
    return tokens !== null;
  } catch {
    return false;
  }
}

/**
 * Get stored tokens for API calls
 * Returns base64-encoded token string for Authorization header
 */
export async function getAuthHeader(): Promise<string | null> {
  try {
    const tokensB64 = await SecureStore.getItemAsync(TOKEN_KEY);
    if (!tokensB64) return null;
    return `Bearer ${tokensB64}`;
  } catch {
    return null;
  }
}

/**
 * Get decoded tokens (for display/debugging)
 */
export async function getStoredTokens(): Promise<GarminTokens | null> {
  try {
    const tokensB64 = await SecureStore.getItemAsync(TOKEN_KEY);
    if (!tokensB64) return null;

    const tokensJson = atob(tokensB64);
    return JSON.parse(tokensJson) as GarminTokens;
  } catch {
    return null;
  }
}

/**
 * Store tokens securely
 */
export async function storeTokens(tokensB64: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, tokensB64);
}

/**
 * Update tokens if they were refreshed (from X-Refreshed-Tokens header)
 */
export async function updateTokensIfRefreshed(
  response: Response
): Promise<void> {
  const refreshedTokens = response.headers.get("X-Refreshed-Tokens");
  if (refreshedTokens) {
    await storeTokens(refreshedTokens);
    console.log("Tokens refreshed and saved");
  }
}

/**
 * Clear stored tokens (logout)
 */
export async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

/**
 * Login to Garmin Connect
 */
export async function loginToGarmin(
  email: string,
  password: string
): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/garmin/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    return {
      status: "error",
      message: data.detail || "Login failed",
    };
  }

  // If login successful, store tokens
  if (data.status === "success" && data.tokens) {
    await storeTokens(data.tokens);
  }

  return data;
}

/**
 * Submit MFA code
 */
export async function submitMFA(
  email: string,
  code: string
): Promise<MFAResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/garmin/mfa`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, code }),
  });

  const data = await response.json();

  if (!response.ok) {
    return {
      status: "error",
      message: data.detail || "MFA verification failed",
    };
  }

  // If MFA successful, store tokens
  if (data.status === "success" && data.tokens) {
    await storeTokens(data.tokens);
  }

  return data;
}

/**
 * Check if we're authenticated (has valid tokens)
 */
export async function isAuthenticated(): Promise<boolean> {
  return hasStoredTokens();
}
