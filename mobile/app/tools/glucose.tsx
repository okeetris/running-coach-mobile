/**
 * Glucose Converter Screen
 *
 * Converts between mmol/L and mg/dL units.
 * Conversion: mmol/L × 18.0182 = mg/dL
 */

import { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";

const CONVERSION_FACTOR = 18.0182;

export default function GlucoseConverterScreen() {
  const router = useRouter();
  const [mmol, setMmol] = useState("");
  const [mgdl, setMgdl] = useState("");

  const handleMmolChange = useCallback((value: string) => {
    setMmol(value);
    const num = parseFloat(value);
    if (!isNaN(num) && value !== "") {
      setMgdl(Math.round(num * CONVERSION_FACTOR).toString());
    } else {
      setMgdl("");
    }
  }, []);

  const handleMgdlChange = useCallback((value: string) => {
    setMgdl(value);
    const num = parseFloat(value);
    if (!isNaN(num) && value !== "") {
      setMmol((num / CONVERSION_FACTOR).toFixed(1));
    } else {
      setMmol("");
    }
  }, []);

  const handleClear = useCallback(() => {
    setMmol("");
    setMgdl("");
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>
        <Text style={styles.title}>Glucose Converter</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        <View style={styles.scrollContent}>
          {/* Info */}
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              Enter a value in either field to convert
            </Text>
          </View>

          {/* Horizontal converter layout */}
          <View style={styles.converterRow}>
            {/* mmol/L Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>mmol/L</Text>
              <TextInput
                style={styles.input}
                value={mmol}
                onChangeText={handleMmolChange}
                keyboardType="decimal-pad"
                placeholder="0.0"
                placeholderTextColor="#9E9E9E"
                selectTextOnFocus
              />
            </View>

            {/* Equals sign */}
            <Text style={styles.equalsSign}>=</Text>

            {/* mg/dL Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>mg/dL</Text>
              <TextInput
                style={styles.input}
                value={mgdl}
                onChangeText={handleMgdlChange}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor="#9E9E9E"
                selectTextOnFocus
              />
            </View>
          </View>

          {/* Clear Button */}
          <Pressable style={styles.clearButton} onPress={handleClear}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  backButton: {
    padding: 8,
  },
  backArrow: {
    fontSize: 24,
    color: "#1976D2",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1C1B1F",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  infoCard: {
    backgroundColor: "#E3F2FD",
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  infoText: {
    fontSize: 14,
    color: "#1565C0",
    textAlign: "center",
  },
  converterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  inputGroup: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1C1B1F",
    marginBottom: 8,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    paddingHorizontal: 12,
    paddingVertical: 16,
    fontSize: 24,
    fontWeight: "600",
    color: "#1976D2",
    textAlign: "center",
  },
  equalsSign: {
    fontSize: 28,
    color: "#9E9E9E",
    fontWeight: "300",
    marginTop: 20,
  },
  clearButton: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 32,
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#49454F",
    textAlign: "center",
  },
});
