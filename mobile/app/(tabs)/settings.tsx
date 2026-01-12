/**
 * Settings Screen
 *
 * App preferences, Garmin connection, and data management.
 */

import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { checkHealth } from "../../src/services/api";
import { API_BASE_URL, API_ENDPOINTS } from "../../src/services/apiConfig";

// Storage keys
const STORAGE_KEYS = {
  UNITS: "@settings_units",
  DARK_MODE: "@settings_dark_mode",
  LAST_SYNC: "@settings_last_sync",
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
  const [units, setUnits] = useState<Units>("metric");
  const [darkMode, setDarkMode] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
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
      setIsConnected(true);
    } catch {
      setIsConnected(false);
    } finally {
      setIsCheckingConnection(false);
    }
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
    setIsSyncing(true);
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.activities}/sync`, {
        method: "POST",
      });
      const data: SyncResponse | MFAResponse = await response.json();

      if ("mfa_required" in data && data.mfa_required) {
        Alert.alert(
          "MFA Required",
          "Please open the app and complete MFA authentication in the Runs tab."
        );
      } else if ("synced" in data) {
        const now = new Date().toISOString();
        setLastSync(now);
        await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, now);
        Alert.alert("Sync Complete", `Synced ${data.synced} activities`);
      }
    } catch (error) {
      Alert.alert("Sync Failed", "Could not connect to Garmin. Check your connection.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      "Clear Cache",
      "This will clear locally stored preferences. You'll need to sync again to see your activities.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove([
                STORAGE_KEYS.LAST_SYNC,
              ]);
              setLastSync(null);
              Alert.alert("Cache Cleared", "Local cache has been cleared.");
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
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
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
          <Text style={styles.rowLabel}>Status</Text>
          <View style={styles.statusRow}>
            {isCheckingConnection ? (
              <ActivityIndicator size="small" color="#1976D2" />
            ) : (
              <>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: isConnected ? "#4CAF50" : "#F44336" },
                  ]}
                />
                <Text style={styles.statusText}>
                  {isConnected ? "Connected" : "Disconnected"}
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
      </View>

      {/* Preferences */}
      <Text style={styles.sectionTitle}>Preferences</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  content: {
    paddingBottom: 32,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  backArrow: {
    fontSize: 24,
    color: "#1976D2",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1C1B1F",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#49454F",
    marginTop: 24,
    marginBottom: 8,
    marginHorizontal: 16,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowLabel: {
    fontSize: 16,
    color: "#1C1B1F",
  },
  rowValue: {
    fontSize: 16,
    color: "#49454F",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 16,
    color: "#49454F",
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginHorizontal: 16,
  },
  button: {
    backgroundColor: "#1976D2",
    marginHorizontal: 16,
    marginVertical: 12,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#90CAF9",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: "#F0F0F0",
    borderRadius: 8,
    padding: 2,
  },
  segment: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  segmentActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  segmentText: {
    fontSize: 14,
    color: "#757575",
    fontWeight: "500",
  },
  segmentTextActive: {
    color: "#1976D2",
    fontWeight: "600",
  },
  destructiveRow: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  destructiveText: {
    fontSize: 16,
    color: "#F44336",
    fontWeight: "500",
  },
  footer: {
    height: 32,
  },
});
