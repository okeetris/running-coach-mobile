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
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { styles } from "../../src/styles/app/tools/pace.styles";

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
        selectTextOnFocus
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
            selectTextOnFocus
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
            selectTextOnFocus
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
            selectTextOnFocus
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
            selectTextOnFocus
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
            selectTextOnFocus
          />
        </View>
      </View>
    </View>
  );
}
