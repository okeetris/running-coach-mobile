/**
 * Coaching Tab
 *
 * Shows what went well, areas to address, focus cue, and fatigue analysis.
 */

import { View, Text, ScrollView } from "react-native";
import { useActivity } from "../../../src/contexts/ActivityContext";
import type { FatigueComparison } from "../../../src/types";
import { styles } from "../../../src/styles/app/activity-detail/coaching.styles";

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
