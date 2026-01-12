/**
 * Pace/Speed Converter Screen
 *
 * Converts between speeds, paces, and race times.
 * All fields auto-update when any field is changed.
 */

import { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";

// Distance constants in km
const DISTANCES = {
  "5k": 5,
  "10k": 10,
  half: 21.0975,
  marathon: 42.195,
};

// Conversion constants
const KM_PER_MILE = 1.60934;

interface TimeFields {
  hours: string;
  mins: string;
  secs: string;
}

interface PaceFields {
  mins: string;
  secs: string;
}

export default function PaceConverterScreen() {
  const router = useRouter();
  const isUpdating = useRef(false);

  // Speed fields
  const [mph, setMph] = useState("");
  const [kph, setKph] = useState("");

  // Pace fields
  const [pacePerMile, setPacePerMile] = useState<PaceFields>({ mins: "", secs: "" });
  const [pacePerKm, setPacePerKm] = useState<PaceFields>({ mins: "", secs: "" });

  // Race time fields
  const [time5k, setTime5k] = useState<TimeFields>({ hours: "", mins: "", secs: "" });
  const [time10k, setTime10k] = useState<TimeFields>({ hours: "", mins: "", secs: "" });
  const [timeHalf, setTimeHalf] = useState<TimeFields>({ hours: "", mins: "", secs: "" });
  const [timeMarathon, setTimeMarathon] = useState<TimeFields>({ hours: "", mins: "", secs: "" });

  // Convert pace fields to total seconds
  const paceToSeconds = (pace: PaceFields): number => {
    const mins = parseFloat(pace.mins) || 0;
    const secs = parseFloat(pace.secs) || 0;
    return mins * 60 + secs;
  };

  // Convert time fields to total seconds
  const timeToSeconds = (time: TimeFields): number => {
    const hours = parseFloat(time.hours) || 0;
    const mins = parseFloat(time.mins) || 0;
    const secs = parseFloat(time.secs) || 0;
    return hours * 3600 + mins * 60 + secs;
  };

  // Convert seconds to pace fields
  const secondsToPace = (totalSecs: number): PaceFields => {
    if (totalSecs <= 0 || !isFinite(totalSecs)) return { mins: "", secs: "" };
    const mins = Math.floor(totalSecs / 60);
    const secs = Math.round(totalSecs % 60);
    return { mins: mins.toString(), secs: secs.toString().padStart(2, "0") };
  };

  // Convert seconds to time fields
  const secondsToTime = (totalSecs: number): TimeFields => {
    if (totalSecs <= 0 || !isFinite(totalSecs)) return { hours: "", mins: "", secs: "" };
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = Math.round(totalSecs % 60);
    return {
      hours: hours > 0 ? hours.toString() : "",
      mins: mins.toString().padStart(hours > 0 ? 2 : 1, "0"),
      secs: secs.toString().padStart(2, "0"),
    };
  };

  // Update all fields based on pace per km (in seconds)
  const updateFromPacePerKm = useCallback((paceSecPerKm: number) => {
    if (isUpdating.current) return;
    isUpdating.current = true;

    // Calculate speeds
    const kphVal = paceSecPerKm > 0 ? 3600 / paceSecPerKm : 0;
    const mphVal = kphVal / KM_PER_MILE;

    setKph(kphVal > 0 ? kphVal.toFixed(2) : "");
    setMph(mphVal > 0 ? mphVal.toFixed(2) : "");

    // Calculate pace per mile
    const paceSecPerMile = paceSecPerKm * KM_PER_MILE;
    setPacePerMile(secondsToPace(paceSecPerMile));
    setPacePerKm(secondsToPace(paceSecPerKm));

    // Calculate race times
    setTime5k(secondsToTime(paceSecPerKm * DISTANCES["5k"]));
    setTime10k(secondsToTime(paceSecPerKm * DISTANCES["10k"]));
    setTimeHalf(secondsToTime(paceSecPerKm * DISTANCES.half));
    setTimeMarathon(secondsToTime(paceSecPerKm * DISTANCES.marathon));

    isUpdating.current = false;
  }, []);

  // Speed change handlers
  const handleMphChange = useCallback((value: string) => {
    setMph(value);
    const num = parseFloat(value);
    if (!isNaN(num) && num > 0) {
      const paceSecPerKm = 3600 / (num * KM_PER_MILE);
      updateFromPacePerKm(paceSecPerKm);
    } else if (value === "") {
      handleClear();
    }
  }, [updateFromPacePerKm]);

  const handleKphChange = useCallback((value: string) => {
    setKph(value);
    const num = parseFloat(value);
    if (!isNaN(num) && num > 0) {
      const paceSecPerKm = 3600 / num;
      updateFromPacePerKm(paceSecPerKm);
    } else if (value === "") {
      handleClear();
    }
  }, [updateFromPacePerKm]);

  // Pace change handlers
  const handlePacePerMileChange = useCallback((field: "mins" | "secs", value: string) => {
    const newPace = { ...pacePerMile, [field]: value };
    setPacePerMile(newPace);
    const totalSecs = paceToSeconds(newPace);
    if (totalSecs > 0) {
      const paceSecPerKm = totalSecs / KM_PER_MILE;
      updateFromPacePerKm(paceSecPerKm);
    }
  }, [pacePerMile, updateFromPacePerKm]);

  const handlePacePerKmChange = useCallback((field: "mins" | "secs", value: string) => {
    const newPace = { ...pacePerKm, [field]: value };
    setPacePerKm(newPace);
    const totalSecs = paceToSeconds(newPace);
    if (totalSecs > 0) {
      updateFromPacePerKm(totalSecs);
    }
  }, [pacePerKm, updateFromPacePerKm]);

  // Race time change handlers
  const createTimeHandler = useCallback((
    distance: number,
    setter: React.Dispatch<React.SetStateAction<TimeFields>>,
    currentTime: TimeFields
  ) => {
    return (field: "hours" | "mins" | "secs", value: string) => {
      const newTime = { ...currentTime, [field]: value };
      setter(newTime);
      const totalSecs = timeToSeconds(newTime);
      if (totalSecs > 0) {
        const paceSecPerKm = totalSecs / distance;
        updateFromPacePerKm(paceSecPerKm);
      }
    };
  }, [updateFromPacePerKm]);

  const handleClear = useCallback(() => {
    isUpdating.current = true;
    setMph("");
    setKph("");
    setPacePerMile({ mins: "", secs: "" });
    setPacePerKm({ mins: "", secs: "" });
    setTime5k({ hours: "", mins: "", secs: "" });
    setTime10k({ hours: "", mins: "", secs: "" });
    setTimeHalf({ hours: "", mins: "", secs: "" });
    setTimeMarathon({ hours: "", mins: "", secs: "" });
    isUpdating.current = false;
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>
        <Text style={styles.title}>Pace Converter</Text>
        <Pressable onPress={handleClear} style={styles.clearBtn}>
          <Text style={styles.clearBtnText}>Clear</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Speeds Section */}
          <Text style={styles.sectionTitle}>SPEEDS</Text>
          <View style={styles.speedRow}>
            <SpeedInput label="mph" value={mph} onChange={handleMphChange} />
            <SpeedInput label="kph" value={kph} onChange={handleKphChange} />
          </View>

          {/* Paces Section */}
          <Text style={styles.sectionTitle}>PACES</Text>
          <View style={styles.paceRow}>
            <PaceInput
              label="mins/mile"
              pace={pacePerMile}
              onChange={handlePacePerMileChange}
            />
            <PaceInput
              label="mins/km"
              pace={pacePerKm}
              onChange={handlePacePerKmChange}
            />
          </View>

          {/* Common Distances Section */}
          <Text style={styles.sectionTitle}>COMMON DISTANCES</Text>
          <View style={styles.distanceGrid}>
            <TimeInput
              label="5k"
              time={time5k}
              onChange={createTimeHandler(DISTANCES["5k"], setTime5k, time5k)}
            />
            <TimeInput
              label="10k"
              time={time10k}
              onChange={createTimeHandler(DISTANCES["10k"], setTime10k, time10k)}
            />
            <TimeInput
              label="half mara"
              time={timeHalf}
              onChange={createTimeHandler(DISTANCES.half, setTimeHalf, timeHalf)}
            />
            <TimeInput
              label="marathon"
              time={timeMarathon}
              onChange={createTimeHandler(DISTANCES.marathon, setTimeMarathon, timeMarathon)}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// Speed input component
function SpeedInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.speedInput}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={styles.smallInput}
        value={value}
        onChangeText={onChange}
        keyboardType="decimal-pad"
        placeholder="0"
        placeholderTextColor="#BDBDBD"
      />
    </View>
  );
}

// Pace input component (mins + secs)
function PaceInput({
  label,
  pace,
  onChange,
}: {
  label: string;
  pace: PaceFields;
  onChange: (field: "mins" | "secs", value: string) => void;
}) {
  return (
    <View style={styles.paceInput}>
      <Text style={styles.paceLabel}>{label}</Text>
      <View style={styles.paceFields}>
        <View style={styles.paceFieldGroup}>
          <Text style={styles.fieldLabel}>mins</Text>
          <TextInput
            style={styles.smallInput}
            value={pace.mins}
            onChangeText={(v) => onChange("mins", v)}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor="#BDBDBD"
          />
        </View>
        <View style={styles.paceFieldGroup}>
          <Text style={styles.fieldLabel}>secs</Text>
          <TextInput
            style={styles.smallInput}
            value={pace.secs}
            onChangeText={(v) => onChange("secs", v)}
            keyboardType="number-pad"
            placeholder="00"
            placeholderTextColor="#BDBDBD"
          />
        </View>
      </View>
    </View>
  );
}

// Time input component (hours + mins + secs)
function TimeInput({
  label,
  time,
  onChange,
}: {
  label: string;
  time: TimeFields;
  onChange: (field: "hours" | "mins" | "secs", value: string) => void;
}) {
  return (
    <View style={styles.timeInput}>
      <Text style={styles.distanceLabel}>{label}</Text>
      <View style={styles.timeFields}>
        <View style={styles.timeFieldGroup}>
          <Text style={styles.fieldLabel}>hours</Text>
          <TextInput
            style={styles.timeFieldInput}
            value={time.hours}
            onChangeText={(v) => onChange("hours", v)}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor="#BDBDBD"
          />
        </View>
        <View style={styles.timeFieldGroup}>
          <Text style={styles.fieldLabel}>mins</Text>
          <TextInput
            style={styles.timeFieldInput}
            value={time.mins}
            onChangeText={(v) => onChange("mins", v)}
            keyboardType="number-pad"
            placeholder="00"
            placeholderTextColor="#BDBDBD"
          />
        </View>
        <View style={styles.timeFieldGroup}>
          <Text style={styles.fieldLabel}>secs</Text>
          <TextInput
            style={styles.timeFieldInput}
            value={time.secs}
            onChangeText={(v) => onChange("secs", v)}
            keyboardType="number-pad"
            placeholder="00"
            placeholderTextColor="#BDBDBD"
          />
        </View>
      </View>
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
  clearBtn: {
    padding: 8,
  },
  clearBtnText: {
    fontSize: 14,
    color: "#1976D2",
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#49454F",
    textAlign: "center",
    marginTop: 24,
    marginBottom: 16,
    letterSpacing: 1,
  },
  speedRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 8,
  },
  speedInput: {
    alignItems: "center",
  },
  inputLabel: {
    fontSize: 14,
    color: "#49454F",
    marginBottom: 8,
  },
  smallInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    width: 70,
    height: 50,
    fontSize: 18,
    fontWeight: "600",
    color: "#1C1B1F",
    textAlign: "center",
  },
  paceRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 8,
  },
  paceInput: {
    alignItems: "center",
  },
  paceLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#49454F",
    marginBottom: 8,
  },
  paceFields: {
    flexDirection: "row",
    gap: 8,
  },
  paceFieldGroup: {
    alignItems: "center",
  },
  fieldLabel: {
    fontSize: 11,
    color: "#9E9E9E",
    marginBottom: 4,
  },
  distanceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  timeInput: {
    width: "48%",
    marginBottom: 20,
  },
  distanceLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#49454F",
    textAlign: "center",
    marginBottom: 8,
  },
  timeFields: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  timeFieldGroup: {
    alignItems: "center",
  },
  timeFieldInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    width: 50,
    height: 50,
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1B1F",
    textAlign: "center",
  },
});
