/**
 * MFA Code Input Modal
 *
 * Shown when Garmin sync requires multi-factor authentication.
 */

import { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

interface MFAModalProps {
  visible: boolean;
  onSubmit: (code: string) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  error?: string | null;
}

export function MFAModal({
  visible,
  onSubmit,
  onCancel,
  isSubmitting,
  error,
}: MFAModalProps) {
  const [code, setCode] = useState("");

  const handleSubmit = () => {
    if (code.length >= 4) {
      onSubmit(code.trim());
    }
  };

  const handleCancel = () => {
    setCode("");
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <View style={styles.container}>
          <View style={styles.modal}>
            <Text style={styles.title}>Garmin Authentication</Text>
            <Text style={styles.description}>
              A verification code has been sent to your email or phone. Enter
              the code below to complete sign-in.
            </Text>

            <TextInput
              style={styles.input}
              value={code}
              onChangeText={setCode}
              placeholder="Enter code"
              placeholderTextColor="#9E9E9E"
              keyboardType="number-pad"
              maxLength={10}
              autoFocus
              editable={!isSubmitting}
            />

            {error && <Text style={styles.error}>{error}</Text>}

            <View style={styles.buttons}>
              <Pressable
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
                disabled={isSubmitting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.button,
                  styles.submitButton,
                  (code.length < 4 || isSubmitting) && styles.buttonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={code.length < 4 || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Verify</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modal: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1C1B1F",
    marginBottom: 12,
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    color: "#49454F",
    marginBottom: 20,
    textAlign: "center",
    lineHeight: 20,
  },
  input: {
    borderWidth: 2,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    textAlign: "center",
    letterSpacing: 8,
    fontWeight: "600",
    color: "#1C1B1F",
    marginBottom: 16,
  },
  error: {
    color: "#D32F2F",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
  buttons: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#F5F5F5",
  },
  cancelButtonText: {
    color: "#49454F",
    fontSize: 16,
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: "#1976D2",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    backgroundColor: "#BDBDBD",
  },
});
