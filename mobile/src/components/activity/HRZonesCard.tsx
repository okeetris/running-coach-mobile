/**
 * Heart Rate Zones Card
 *
 * Displays time spent in each HR zone as a stacked bar with breakdown.
 */

import { View, Text, StyleSheet } from "react-native";
import type { HRZone } from "../../utils/hrZones";
import { formatZoneTime } from "../../utils/hrZones";

interface HRZonesCardProps {
  zones: HRZone[];
  avgHR?: number;
}

export function HRZonesCard({ zones, avgHR }: HRZonesCardProps) {
  // Filter out zones with 0 time for the bar
  const activeZones = zones.filter((z) => z.percentage > 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Heart Rate Zones</Text>
        {avgHR && <Text style={styles.avgHR}>Avg {Math.round(avgHR)} bpm</Text>}
      </View>

      {/* Stacked bar */}
      <View style={styles.barContainer}>
        {activeZones.map((zone) => (
          <View
            key={zone.zone}
            style={[
              styles.barSegment,
              {
                backgroundColor: zone.color,
                flex: zone.percentage,
              },
            ]}
          >
            {zone.percentage >= 10 && (
              <Text style={styles.barLabel}>Z{zone.zone}</Text>
            )}
          </View>
        ))}
      </View>

      {/* Zone breakdown */}
      <View style={styles.breakdown}>
        {zones.map((zone) => (
          <View key={zone.zone} style={styles.zoneRow}>
            <View style={styles.zoneInfo}>
              <View style={[styles.zoneDot, { backgroundColor: zone.color }]} />
              <Text style={styles.zoneName}>
                Z{zone.zone} {zone.name}
              </Text>
            </View>
            <View style={styles.zoneStats}>
              <Text style={styles.zoneTime}>{formatZoneTime(zone.seconds)}</Text>
              <Text style={styles.zonePct}>{zone.percentage}%</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1C1B1F",
  },
  avgHR: {
    fontSize: 13,
    color: "#E57373",
    fontWeight: "500",
  },
  barContainer: {
    flexDirection: "row",
    height: 32,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 16,
  },
  barSegment: {
    justifyContent: "center",
    alignItems: "center",
    minWidth: 2,
  },
  barLabel: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#000000",
    opacity: 0.7,
  },
  breakdown: {
    gap: 8,
  },
  zoneRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  zoneInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  zoneDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  zoneName: {
    fontSize: 13,
    color: "#49454F",
  },
  zoneStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  zoneTime: {
    fontSize: 13,
    color: "#1C1B1F",
    fontWeight: "500",
    minWidth: 50,
    textAlign: "right",
  },
  zonePct: {
    fontSize: 13,
    color: "#49454F",
    minWidth: 35,
    textAlign: "right",
  },
});
