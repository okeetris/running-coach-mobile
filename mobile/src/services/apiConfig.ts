import { Platform } from "react-native";

/**
 * API Configuration
 *
 * Modes:
 * 1. Production (USE_PRODUCTION = true) - Uses Render/cloud URL
 * 2. Physical device (USE_PHYSICAL_DEVICE = true) - Uses local network IP
 * 3. Simulator/emulator (default) - Uses localhost mapping
 */

// === PRODUCTION CONFIG ===
// Set to true to use the deployed Render backend
const USE_PRODUCTION = true;

// Your Render URL
const PRODUCTION_URL = "https://running-coach-mobile.onrender.com";

// === LOCAL DEVELOPMENT CONFIG ===
// Set to true when testing on a physical device over local network
const USE_PHYSICAL_DEVICE = false;

// Your machine's local IP (for physical device testing)
// Find it with: ifconfig | grep "inet " | grep -v 127.0.0.1
const PHYSICAL_DEVICE_IP = "192.168.1.100";

// Backend port (from docker-compose.yml)
const API_PORT = 8000;

// Android emulator uses 10.0.2.2 to reach host machine
const ANDROID_LOCALHOST = "10.0.2.2";
const IOS_LOCALHOST = "localhost";

function getBaseUrl(): string {
  // Production mode - use cloud deployment
  if (USE_PRODUCTION) {
    return PRODUCTION_URL;
  }

  // Physical device - use local network IP
  if (USE_PHYSICAL_DEVICE) {
    return `http://${PHYSICAL_DEVICE_IP}:${API_PORT}`;
  }

  // Simulator/emulator - use localhost mapping
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
