/**
 * Coaching Tab
 *
 * Shows what went well, areas to address, focus cue, and fatigue analysis.
 */

import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useActivity } from "../../../src/contexts/ActivityContext";
import type { FatigueComparison } from "../../../src/types";

function WentWellItem({ text }: { text: string }) {
  return (
    <View style={styles.coachingItem}>
      <Text style={styles.checkIcon}>✓</Text>
      <Text style={styles.coachingText}>{text}</Text>
    </View>
  );
}

function AreaToAddressItem({ text }: { text: string }) {
  return (
    <View style={styles.coachingItem}>
      <Text style={styles.attentionIcon}>!</Text>
      <Text style={styles.coachingText}>{text}</Text>
    </View>
  );
}

function FatigueCard({ item }: { item: FatigueComparison }) {
  const isGood = item.changeDirection === "improved" || item.changeDirection === "stable";
  const changeColor = isGood ? "#4CAF50" : "#F44336";
  const arrow = item.change > 0 ? "↑" : item.change < 0 ? "↓" : "→";

  return (
    <View style={styles.fatigueCard}>
      <Text style={styles.fatigueMetric}>{item.metric}</Text>
      <View style={styles.fatigueRow}>
        <Text style={styles.fatigueValue}>{item.firstHalf.toFixed(1)}</Text>
        <Text style={styles.fatigueArrow}>→</Text>
        <Text style={styles.fatigueValue}>{item.secondHalf.toFixed(1)}</Text>
        <Text style={[styles.fatigueChange, { color: changeColor }]}>
          {arrow} {Math.abs(item.change).toFixed(1)}%
        </Text>
      </View>
    </View>
  );
}

export default function CoachingTab() {
  const { activity } = useActivity();

  if (!activity) return null;

  const { coaching, fatigueComparison } = activity;
  const hasContent =
    coaching.whatWentWell.length > 0 ||
    coaching.areasToAddress.length > 0 ||
    coaching.focusCue ||
    (fatigueComparison && fatigueComparison.length > 0);

  if (!hasContent) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No coaching insights available</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* What Went Well */}
      {coaching.whatWentWell.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>What Went Well</Text>
          <View style={styles.card}>
            {coaching.whatWentWell.map((item, index) => (
              <WentWellItem key={index} text={item} />
            ))}
          </View>
        </>
      )}

      {/* Areas to Address */}
      {coaching.areasToAddress.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Areas to Address</Text>
          <View style={styles.card}>
            {coaching.areasToAddress.map((item, index) => (
              <AreaToAddressItem key={index} text={item} />
            ))}
          </View>
        </>
      )}

      {/* Focus Cue */}
      {coaching.focusCue && (
        <>
          <Text style={styles.sectionTitle}>Focus Cue</Text>
          <View style={styles.focusCard}>
            <Text style={styles.focusIcon}>🎯</Text>
            <Text style={styles.focusCue}>{coaching.focusCue}</Text>
          </View>
        </>
      )}

      {/* Fatigue Analysis */}
      {fatigueComparison && fatigueComparison.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Fatigue Analysis</Text>
          <View style={styles.card}>
            {fatigueComparison.map((item, index) => (
              <FatigueCard key={index} item={item} />
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: "#757575",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1B1F",
    marginBottom: 12,
    marginTop: 8,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  coachingItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  checkIcon: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4CAF50",
    marginRight: 12,
    width: 20,
  },
  attentionIcon: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF9800",
    marginRight: 12,
    width: 20,
    textAlign: "center",
  },
  coachingText: {
    flex: 1,
    fontSize: 14,
    color: "#49454F",
    lineHeight: 20,
  },
  focusCard: {
    backgroundColor: "#E3F2FD",
    borderRadius: 12,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  focusIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  focusCue: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#1565C0",
    lineHeight: 24,
  },
  fatigueCard: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  fatigueMetric: {
    fontSize: 12,
    color: "#49454F",
    marginBottom: 4,
  },
  fatigueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  fatigueValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1B1F",
  },
  fatigueArrow: {
    fontSize: 14,
    color: "#49454F",
  },
  fatigueChange: {
    marginLeft: "auto",
    fontSize: 14,
    fontWeight: "600",
  },
});
