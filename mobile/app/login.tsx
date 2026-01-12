/**
 * Garmin Login Screen
 *
 * Handles login and MFA verification flow.
 */

import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "../src/contexts/AuthContext";

export default function LoginScreen() {
  const { login, completeMFA, pendingMFA } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const response = await login(email, password);

      if (response.status === "success") {
        router.replace("/(tabs)");
      } else if (response.status === "mfa_required") {
        // MFA screen will show automatically via pendingMFA state
      } else {
        setError(response.message);
      }
    } catch (e) {
      setError("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMFA = async () => {
    if (!mfaCode) {
      setError("Please enter the verification code");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const response = await completeMFA(mfaCode);

      if (response.status === "success") {
        router.replace("/(tabs)");
      } else {
        setError(response.message);
      }
    } catch (e) {
      setError("Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // MFA Code Entry
  if (pendingMFA) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Verification Required</Text>
          <Text style={styles.subtitle}>
            Enter the code sent to your email or phone
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Verification code"
            placeholderTextColor="#666"
            value={mfaCode}
            onChangeText={setMfaCode}
            keyboardType="number-pad"
            autoCapitalize="none"
            autoComplete="one-time-code"
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleMFA}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Verify</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // Login Form
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Connect to Garmin</Text>
        <Text style={styles.subtitle}>
          Sign in with your Garmin Connect account to sync your running data
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#666"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#666"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </Pressable>

        <Text style={styles.disclaimer}>
          Your credentials are sent securely to the backend and used only to
          authenticate with Garmin. They are never stored on our servers.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  input: {
    backgroundColor: "#252542",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#fff",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#3a3a5c",
  },
  button: {
    backgroundColor: "#4CAF50",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  error: {
    color: "#ff6b6b",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
  disclaimer: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginTop: 24,
    lineHeight: 18,
  },
});
