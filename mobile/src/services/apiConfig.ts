import { Platform } from "react-native";

/**
 * API Configuration
 *
 * For Android emulator: 10.0.2.2 maps to host machine's localhost
 * For iOS simulator: localhost works directly
 * For physical devices: use your machine's local IP address
 */

// Android emulator uses 10.0.2.2 to reach host machine
const ANDROID_LOCALHOST = "10.0.2.2";
const IOS_LOCALHOST = "localhost";

// Set to true when testing on a physical device
const USE_PHYSICAL_DEVICE = false;

// Replace with your machine's IP when using physical device
// Find it with: ifconfig | grep "inet " | grep -v 127.0.0.1
const PHYSICAL_DEVICE_IP = "192.168.1.100";

// Backend port (from docker-compose.yml)
const API_PORT = 8000;

function getBaseUrl(): string {
  if (USE_PHYSICAL_DEVICE) {
    return `http://${PHYSICAL_DEVICE_IP}:${API_PORT}`;
  }

  const localhost =
    Platform.OS === "android" ? ANDROID_LOCALHOST : IOS_LOCALHOST;
  return `http://${localhost}:${API_PORT}`;
}

export const API_BASE_URL = getBaseUrl();

export const API_ENDPOINTS = {
  health: "/health",
  activities: "/activities",
  activityDetail: (id: string) => `/activities/${id}`,
} as const;
