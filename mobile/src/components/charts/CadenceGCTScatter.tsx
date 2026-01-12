/**
 * Cadence-GCT Scatter Plot
 *
 * Shows correlation between cadence and ground contact time.
 * Generally, higher cadence correlates with lower GCT (better efficiency).
 */

import { useMemo } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { Canvas, Circle, Line, vec } from "@shopify/react-native-skia";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface DataPoint {
  cadence: number;
  gct: number;
}

interface CadenceGCTScatterProps {
  data: DataPoint[];
  height?: number;
}

const PADDING = { top: 20, right: 20, bottom: 40, left: 50 };

// Calculate linear regression for trend line
function linearRegression(data: DataPoint[]): { slope: number; intercept: number; r2: number } {
  const n = data.length;
  if (n === 0) return { slope: 0, intercept: 0, r2: 0 };

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;

  data.forEach(({ cadence, gct }) => {
    sumX += cadence;
    sumY += gct;
    sumXY += cadence * gct;
    sumX2 += cadence * cadence;
    sumY2 += gct * gct;
  });

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R²
  const meanY = sumY / n;
  let ssRes = 0, ssTot = 0;
  data.forEach(({ cadence, gct }) => {
    const predicted = slope * cadence + intercept;
    ssRes += (gct - predicted) ** 2;
    ssTot += (gct - meanY) ** 2;
  });
  const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot;

  return { slope, intercept, r2 };
}

// Sample data to reduce number of points for performance
function sampleData(data: DataPoint[], maxPoints: number = 200): DataPoint[] {
  if (data.length <= maxPoints) return data;
  const step = Math.ceil(data.length / maxPoints);
  return data.filter((_, i) => i % step === 0);
}

export function CadenceGCTScatter({ data, height = 200 }: CadenceGCTScatterProps) {
  const width = SCREEN_WIDTH - 32;
  const chartWidth = width - PADDING.left - PADDING.right;
  const chartHeight = height - PADDING.top - PADDING.bottom;

  // Filter valid data points
  const validData = useMemo(() => {
    return data.filter(
      (p) => p.cadence >= 140 && p.cadence <= 200 && p.gct >= 180 && p.gct <= 320
    );
  }, [data]);

  // Calculate axis ranges
  const ranges = useMemo(() => {
    if (validData.length === 0) {
      return { cadenceMin: 160, cadenceMax: 190, gctMin: 200, gctMax: 280 };
    }

    let cadenceMin = Infinity, cadenceMax = -Infinity;
    let gctMin = Infinity, gctMax = -Infinity;

    validData.forEach(({ cadence, gct }) => {
      cadenceMin = Math.min(cadenceMin, cadence);
      cadenceMax = Math.max(cadenceMax, cadence);
      gctMin = Math.min(gctMin, gct);
      gctMax = Math.max(gctMax, gct);
    });

    // Add padding
    const cadenceRange = cadenceMax - cadenceMin;
    const gctRange = gctMax - gctMin;
    cadenceMin -= cadenceRange * 0.1;
    cadenceMax += cadenceRange * 0.1;
    gctMin -= gctRange * 0.1;
    gctMax += gctRange * 0.1;

    return { cadenceMin, cadenceMax, gctMin, gctMax };
  }, [validData]);

  // Calculate regression
  const regression = useMemo(() => linearRegression(validData), [validData]);

  // Sample data for rendering
  const sampledData = useMemo(() => sampleData(validData, 150), [validData]);

  // Convert data point to chart coordinates
  const toChartCoords = (cadence: number, gct: number) => {
    const x =
      PADDING.left +
      ((cadence - ranges.cadenceMin) / (ranges.cadenceMax - ranges.cadenceMin)) *
        chartWidth;
    const y =
      PADDING.top +
      ((gct - ranges.gctMin) / (ranges.gctMax - ranges.gctMin)) * chartHeight;
    return { x, y };
  };

  // Trend line points
  const trendLine = useMemo(() => {
    const startCadence = ranges.cadenceMin;
    const endCadence = ranges.cadenceMax;
    const startGct = regression.slope * startCadence + regression.intercept;
    const endGct = regression.slope * endCadence + regression.intercept;

    const start = toChartCoords(startCadence, startGct);
    const end = toChartCoords(endCadence, endGct);

    return { start, end };
  }, [ranges, regression, chartWidth, chartHeight]);

  if (validData.length < 10) {
    return (
      <View style={[styles.container, { height }]}>
        <Text style={styles.emptyText}>Not enough data for correlation</Text>
      </View>
    );
  }

  // Determine correlation strength
  const correlationText =
    Math.abs(regression.r2) >= 0.5
      ? "Strong"
      : Math.abs(regression.r2) >= 0.3
        ? "Moderate"
        : "Weak";
  const correlationColor =
    regression.slope < 0 ? "#4CAF50" : "#F44336"; // Negative slope is good

  return (
    <View style={[styles.container, { height }]}>
      {/* Header with R² */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Cadence vs GCT Correlation</Text>
        <View style={styles.r2Badge}>
          <Text style={styles.r2Text}>
            r² = {regression.r2.toFixed(2)} ({correlationText})
          </Text>
        </View>
      </View>

      <View style={{ width, height: height - 60 }}>
        <Canvas style={{ flex: 1 }}>
          {/* Grid lines */}
          {[0.25, 0.5, 0.75].map((ratio) => (
            <Line
              key={`h-${ratio}`}
              p1={vec(PADDING.left, PADDING.top + chartHeight * ratio)}
              p2={vec(PADDING.left + chartWidth, PADDING.top + chartHeight * ratio)}
              color="#F0F0F0"
              strokeWidth={1}
            />
          ))}
          {[0.25, 0.5, 0.75].map((ratio) => (
            <Line
              key={`v-${ratio}`}
              p1={vec(PADDING.left + chartWidth * ratio, PADDING.top)}
              p2={vec(PADDING.left + chartWidth * ratio, PADDING.top + chartHeight)}
              color="#F0F0F0"
              strokeWidth={1}
            />
          ))}

          {/* Trend line */}
          <Line
            p1={vec(trendLine.start.x, trendLine.start.y)}
            p2={vec(trendLine.end.x, trendLine.end.y)}
            color={correlationColor}
            strokeWidth={2}
            style="stroke"
          />

          {/* Data points */}
          {sampledData.map((point, i) => {
            const { x, y } = toChartCoords(point.cadence, point.gct);
            return (
              <Circle
                key={i}
                cx={x}
                cy={y}
                r={3}
                color="rgba(25, 118, 210, 0.4)"
              />
            );
          })}
        </Canvas>

        {/* Y-axis label */}
        <View style={styles.yAxisLabel}>
          <Text style={styles.axisLabelRotated}>GCT (ms)</Text>
        </View>

        {/* Y-axis values */}
        <View style={styles.yAxis}>
          <Text style={styles.axisValue}>{Math.round(ranges.gctMin)}</Text>
          <Text style={styles.axisValue}>
            {Math.round((ranges.gctMin + ranges.gctMax) / 2)}
          </Text>
          <Text style={styles.axisValue}>{Math.round(ranges.gctMax)}</Text>
        </View>
      </View>

      {/* X-axis */}
      <View style={[styles.xAxis, { marginLeft: PADDING.left }]}>
        <Text style={styles.axisValue}>{Math.round(ranges.cadenceMin)}</Text>
        <Text style={styles.axisValue}>
          {Math.round((ranges.cadenceMin + ranges.cadenceMax) / 2)}
        </Text>
        <Text style={styles.axisValue}>{Math.round(ranges.cadenceMax)}</Text>
      </View>
      <Text style={styles.xAxisLabel}>Cadence (spm)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 8,
    marginBottom: 16,
  },
  emptyText: {
    textAlign: "center",
    color: "#9E9E9E",
    marginTop: 60,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  headerText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1C1B1F",
  },
  r2Badge: {
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  r2Text: {
    fontSize: 11,
    color: "#49454F",
  },
  yAxisLabel: {
    position: "absolute",
    left: 2,
    top: "50%",
    transform: [{ rotate: "-90deg" }, { translateX: -20 }],
  },
  axisLabelRotated: {
    fontSize: 10,
    color: "#9E9E9E",
  },
  yAxis: {
    position: "absolute",
    left: 8,
    top: PADDING.top,
    bottom: 0,
    justifyContent: "space-between",
    alignItems: "flex-end",
    width: 35,
  },
  xAxis: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingRight: PADDING.right,
  },
  axisValue: {
    fontSize: 10,
    color: "#9E9E9E",
  },
  xAxisLabel: {
    textAlign: "center",
    fontSize: 10,
    color: "#9E9E9E",
    marginTop: 4,
  },
});
