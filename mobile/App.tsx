import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { checkHealth } from "./src/services/api";
import { API_BASE_URL } from "./src/services/apiConfig";
import type { HealthCheck } from "./src/types";

/**
 * Initial App - Tests connection to backend
 * This will be replaced with proper navigation setup
 */
export default function App() {
  const [health, setHealth] = useState<HealthCheck | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function testConnection() {
      try {
        const result = await checkHealth();
        setHealth(result);
        setError(null);
      } catch (err) {
        setError((err as Error).message);
        setHealth(null);
      } finally {
        setLoading(false);
      }
    }

    testConnection();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Running Coach</Text>
      <Text style={styles.subtitle}>Backend Connection Test</Text>

      <View style={styles.card}>
        <Text style={styles.label}>API URL:</Text>
        <Text style={styles.value}>{API_BASE_URL}</Text>
      </View>

      {loading && (
        <View style={styles.card}>
          <ActivityIndicator size="large" color="#1976D2" />
          <Text style={styles.statusText}>Connecting to backend...</Text>
        </View>
      )}

      {health && (
        <View style={[styles.card, styles.successCard]}>
          <Text style={styles.successText}>Connected!</Text>
          <Text style={styles.label}>Status: {health.status}</Text>
          <Text style={styles.label}>
            FIT Files Path: {health.fit_files_path}
          </Text>
          <Text style={styles.label}>
            Files Accessible: {health.fit_files_accessible ? "Yes" : "No"}
          </Text>
        </View>
      )}

      {error && (
        <View style={[styles.card, styles.errorCard]}>
          <Text style={styles.errorText}>Connection Failed</Text>
          <Text style={styles.errorDetail}>{error}</Text>
          <Text style={styles.hint}>
            Make sure the backend is running:{"\n"}
            cd running-coach-mobile{"\n"}
            docker-compose up --build
          </Text>
        </View>
      )}

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1C1B1F",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#49454F",
    marginBottom: 32,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    width: "100%",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  successCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
  },
  errorCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#F44336",
  },
  label: {
    fontSize: 14,
    color: "#49454F",
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    color: "#1C1B1F",
    fontFamily: "monospace",
  },
  statusText: {
    fontSize: 14,
    color: "#49454F",
    marginTop: 12,
    textAlign: "center",
  },
  successText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#4CAF50",
    marginBottom: 12,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#F44336",
    marginBottom: 8,
  },
  errorDetail: {
    fontSize: 14,
    color: "#1C1B1F",
    marginBottom: 12,
  },
  hint: {
    fontSize: 12,
    color: "#49454F",
    fontFamily: "monospace",
    backgroundColor: "#F5F5F5",
    padding: 12,
    borderRadius: 8,
  },
});
