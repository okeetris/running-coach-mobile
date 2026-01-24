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
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { styles } from "../../src/styles/app/tools/glucose.styles";

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
