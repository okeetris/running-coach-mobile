/**
 * Settings Screen
 *
 * App preferences, Garmin connection, and data management.
 */

import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { styles } from "../../src/styles/app/tabs/settings.styles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { useQueryClient } from "@tanstack/react-query";
import {
  checkHealth,
  syncActivities,
  isMFARequired,
} from "../../src/services/api";
import { useAuth } from "../../src/contexts/AuthContext";

// Storage keys
const STORAGE_KEYS = {
  UNITS: "@settings_units",
  DARK_MODE: "@settings_dark_mode",
  LAST_SYNC: "@settings_last_sync",
  CACHED_ACTIVITIES: "cached_activities", // From useActivities.ts
};

type Units = "metric" | "imperial";

interface SyncResponse {
  synced: number;
  message: string;
}

interface MFAResponse {
  mfa_required: boolean;
  message: string;
}

export default function SettingsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isLoggedIn, logout, isLoading: authLoading } = useAuth();
  const [units, setUnits] = useState<Units>("metric");
  const [darkMode, setDarkMode] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean | null>(
    null
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
    checkConnection();
  }, []);

  const loadSettings = async () => {
    try {
      const [savedUnits, savedDarkMode, savedLastSync] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.UNITS),
        AsyncStorage.getItem(STORAGE_KEYS.DARK_MODE),
        AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC),
      ]);

      if (savedUnits) setUnits(savedUnits as Units);
      if (savedDarkMode) setDarkMode(savedDarkMode === "true");
      if (savedLastSync) setLastSync(savedLastSync);
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
  };

  const checkConnection = async () => {
    setIsCheckingConnection(true);
    try {
      await checkHealth();
      setIsBackendConnected(true);
    } catch {
      setIsBackendConnected(false);
    } finally {
      setIsCheckingConnection(false);
    }
  };

  const handleConnectGarmin = () => {
    router.push("/login");
  };

  const handleDisconnect = () => {
    Alert.alert(
      "Disconnect Garmin",
      "This will log you out of Garmin Connect. You'll need to sign in again to sync activities.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const handleUnitsChange = async (newUnits: Units) => {
    setUnits(newUnits);
    await AsyncStorage.setItem(STORAGE_KEYS.UNITS, newUnits);
  };

  const handleDarkModeChange = async (enabled: boolean) => {
    setDarkMode(enabled);
    await AsyncStorage.setItem(STORAGE_KEYS.DARK_MODE, enabled.toString());
    // TODO: Apply dark mode theme
  };

  const handleSync = async () => {
    if (!isLoggedIn) {
      Alert.alert(
        "Not Connected",
        "Please connect to Garmin first to sync activities.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Connect", onPress: handleConnectGarmin },
        ]
      );
      return;
    }

    setIsSyncing(true);
    try {
      const data = await syncActivities(10);

      if (isMFARequired(data)) {
        Alert.alert(
          "Re-authentication Required",
          "Your Garmin session expired. Please sign in again.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Sign In", onPress: handleConnectGarmin },
          ]
        );
      } else {
        const now = new Date().toISOString();
        setLastSync(now);
        await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, now);
        Alert.alert("Sync Complete", `Synced ${data.synced} activities`);
      }
    } catch (error) {
      Alert.alert(
        "Sync Failed",
        "Could not sync activities. Please try again."
      );
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      "Clear Cache",
      "This will clear cached activities and sync data. You'll need to sync again to see your activities.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            try {
              // Clear AsyncStorage cache
              await AsyncStorage.multiRemove([
                STORAGE_KEYS.LAST_SYNC,
                STORAGE_KEYS.CACHED_ACTIVITIES,
              ]);
              setLastSync(null);

              // Invalidate TanStack Query cache
              queryClient.removeQueries({ queryKey: ["activities"] });
              queryClient.removeQueries({ queryKey: ["activity"] });

              Alert.alert("Cache Cleared", "Local cache has been cleared. Sync to fetch fresh data.");
            } catch (error) {
              Alert.alert("Error", "Failed to clear cache.");
            }
          },
        },
      ]
    );
  };

  const formatLastSync = (isoString: string | null): string => {
    if (!isoString) return "Never";
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString();
  };

  const appVersion = Constants.expoConfig?.version || "1.0.0";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      {/* Garmin Connection */}
      <Text style={styles.sectionTitle}>Garmin Connection</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Garmin Account</Text>
          <View style={styles.statusRow}>
            {authLoading ? (
              <ActivityIndicator size="small" color="#1976D2" />
            ) : (
              <>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: isLoggedIn ? "#4CAF50" : "#9E9E9E" },
                  ]}
                />
                <Text style={styles.statusText}>
                  {isLoggedIn ? "Connected" : "Not connected"}
                </Text>
              </>
            )}
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Backend Status</Text>
          <View style={styles.statusRow}>
            {isCheckingConnection ? (
              <ActivityIndicator size="small" color="#1976D2" />
            ) : (
              <>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: isBackendConnected
                        ? "#4CAF50"
                        : "#F44336",
                    },
                  ]}
                />
                <Text style={styles.statusText}>
                  {isBackendConnected ? "Online" : "Offline"}
                </Text>
              </>
            )}
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Last Sync</Text>
          <Text style={styles.rowValue}>{formatLastSync(lastSync)}</Text>
        </View>

        <View style={styles.divider} />

        {isLoggedIn ? (
          <>
            <Pressable
              style={[styles.button, isSyncing && styles.buttonDisabled]}
              onPress={handleSync}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Sync Now</Text>
              )}
            </Pressable>
            <Pressable
              style={styles.disconnectButton}
              onPress={handleDisconnect}
            >
              <Text style={styles.disconnectText}>Disconnect Garmin</Text>
            </Pressable>
          </>
        ) : (
          <Pressable style={styles.button} onPress={handleConnectGarmin}>
            <Text style={styles.buttonText}>Connect to Garmin</Text>
          </Pressable>
        )}
      </View>

      {/* Preferences */}
      <Text style={styles.sectionTitle}>Preferences (WIP)</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Units</Text>
          <View style={styles.segmentedControl}>
            <Pressable
              style={[
                styles.segment,
                units === "metric" && styles.segmentActive,
              ]}
              onPress={() => handleUnitsChange("metric")}
            >
              <Text
                style={[
                  styles.segmentText,
                  units === "metric" && styles.segmentTextActive,
                ]}
              >
                km
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.segment,
                units === "imperial" && styles.segmentActive,
              ]}
              onPress={() => handleUnitsChange("imperial")}
            >
              <Text
                style={[
                  styles.segmentText,
                  units === "imperial" && styles.segmentTextActive,
                ]}
              >
                mi
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Dark Mode</Text>
          <Switch
            value={darkMode}
            onValueChange={handleDarkModeChange}
            trackColor={{ false: "#E0E0E0", true: "#90CAF9" }}
            thumbColor={darkMode ? "#1976D2" : "#FAFAFA"}
          />
        </View>
      </View>

      {/* About */}
      <Text style={styles.sectionTitle}>About</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>App Version</Text>
          <Text style={styles.rowValue}>{appVersion}</Text>
        </View>
      </View>

      {/* Data */}
      <Text style={styles.sectionTitle}>Data</Text>
      <View style={styles.card}>
        <Pressable style={styles.destructiveRow} onPress={handleClearCache}>
          <Text style={styles.destructiveText}>Clear Cache</Text>
        </Pressable>
      </View>

      {/* Footer spacing */}
      <View style={styles.footer} />
    </ScrollView>
  );
}
