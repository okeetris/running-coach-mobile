/**
 * Charts Tab
 *
 * Shows all time series charts: Cadence/GCT, HR, GCT Balance, Cadence-GCT correlation.
 */

import { useMemo } from "react";
import { View, Text, ScrollView } from "react-native";
import { useActivity } from "../../../src/contexts/ActivityContext";
import { styles } from "../../../src/styles/app/activity-detail/charts.styles";
import { InteractiveRunChart } from "../../../src/components/charts/InteractiveRunChart";
import { GCTBalanceChart } from "../../../src/components/charts/GCTBalanceChart";
import { CadenceGCTScatter } from "../../../src/components/charts/CadenceGCTScatter";
import type { TimeSeriesDataPoint } from "../../../src/types";

export default function ChartsTab() {
  const { activity } = useActivity();
  const timeSeries = activity?.timeSeries;

  // Cadence & GCT chart configs
  const chartConfigs = useMemo(() => {
    if (!timeSeries || timeSeries.length === 0) return [];

    const configs = [];

    const cadenceData = timeSeries
      .filter((p: TimeSeriesDataPoint) => p.cadence != null)
      .map((p: TimeSeriesDataPoint) => ({ timestamp: p.timestamp, value: p.cadence! }));
    if (cadenceData.length > 0) {
      configs.push({
        key: "cadence",
        label: "Cadence",
        color: "#1976D2",
        unit: "spm",
        data: cadenceData,
        minValue: 150,
        maxValue: 200,
      });
    }

    const gctData = timeSeries
      .filter((p: TimeSeriesDataPoint) => p.gct != null)
      .map((p: TimeSeriesDataPoint) => ({ timestamp: p.timestamp, value: p.gct! }));
    if (gctData.length > 0) {
      configs.push({
        key: "gct",
        label: "GCT",
        color: "#F57C00",
        unit: "ms",
        data: gctData,
        minValue: 180,
        maxValue: 320,
      });
    }

    return configs;
  }, [timeSeries]);

  // Heart rate chart
  const hrChartConfigs = useMemo(() => {
    if (!timeSeries || timeSeries.length === 0) return [];

    const hrData = timeSeries
      .filter((p: TimeSeriesDataPoint) => p.heartRate != null)
      .map((p: TimeSeriesDataPoint) => ({ timestamp: p.timestamp, value: p.heartRate! }));

    if (hrData.length === 0) return [];

    return [
      {
        key: "hr",
        label: "Heart Rate",
        color: "#E53935",
        unit: "bpm",
        data: hrData,
      },
    ];
  }, [timeSeries]);

  // GCT Balance data
  const gctBalanceData = useMemo(() => {
    if (!timeSeries || timeSeries.length === 0) return [];
    return timeSeries
      .filter((p: TimeSeriesDataPoint) => p.gctBalance != null)
      .map((p: TimeSeriesDataPoint) => ({ timestamp: p.timestamp, value: p.gctBalance! }));
  }, [timeSeries]);

  // Cadence-GCT correlation data
  const cadenceGctData = useMemo(() => {
    if (!timeSeries || timeSeries.length === 0) return [];
    return timeSeries
      .filter((p: TimeSeriesDataPoint) => p.cadence != null && p.gct != null)
      .map((p: TimeSeriesDataPoint) => ({ cadence: p.cadence!, gct: p.gct! }));
  }, [timeSeries]);

  if (!activity) return null;

  const hasCharts = chartConfigs.length > 0 || hrChartConfigs.length > 0 ||
                    gctBalanceData.length > 10 || cadenceGctData.length > 10;

  if (!hasCharts) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No chart data available</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Cadence & GCT */}
      {chartConfigs.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Cadence & Ground Contact</Text>
          <Text style={styles.chartHint}>Touch and drag to see values</Text>
          <InteractiveRunChart configs={chartConfigs} height={220} />
        </>
      )}

      {/* Heart Rate */}
      {hrChartConfigs.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Heart Rate</Text>
          <InteractiveRunChart configs={hrChartConfigs} height={180} />
        </>
      )}

      {/* GCT Balance */}
      {gctBalanceData.length > 10 && (
        <>
          <Text style={styles.sectionTitle}>GCT Balance</Text>
          <Text style={styles.chartHint}>49-51% is ideal (balanced stride)</Text>
          <GCTBalanceChart data={gctBalanceData} />
        </>
      )}

      {/* Cadence-GCT Correlation */}
      {cadenceGctData.length > 10 && (
        <>
          <Text style={styles.sectionTitle}>Cadence vs GCT</Text>
          <Text style={styles.chartHint}>Higher cadence typically means lower ground contact time</Text>
          <CadenceGCTScatter data={cadenceGctData} />
        </>
      )}
    </ScrollView>
  );
}
