/**
 * GCT Balance Chart
 *
 * Shows ground contact time balance over time with ideal zone shading.
 * Ideal balance is 50% (equal time on each foot), acceptable range is 49-51%.
 */

import { useMemo, useState, useCallback } from "react";
import { View, Text, StyleSheet, Dimensions, PanResponder } from "react-native";
import {
  Canvas,
  Path,
  Skia,
  Line,
  vec,
  Circle,
  Rect,
} from "@shopify/react-native-skia";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface DataPoint {
  timestamp: number;
  value: number; // GCT balance percentage (50 = balanced)
}

interface GCTBalanceChartProps {
  data: DataPoint[];
  height?: number;
}

const IDEAL_MIN = 49;
const IDEAL_MAX = 51;
const CHART_MIN = 46;
const CHART_MAX = 54;
const PADDING = { top: 20, right: 16, bottom: 30, left: 40 };

// Apply rolling average to smooth data
function smoothData(data: DataPoint[], windowSize: number = 30): DataPoint[] {
  if (data.length < windowSize) return data;

  const result: DataPoint[] = [];
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - Math.floor(windowSize / 2));
    const end = Math.min(data.length, i + Math.floor(windowSize / 2) + 1);
    const window = data.slice(start, end);
    const avg = window.reduce((sum, p) => sum + p.value, 0) / window.length;
    result.push({ timestamp: data[i].timestamp, value: avg });
  }
  return result;
}

export function GCTBalanceChart({ data, height = 180 }: GCTBalanceChartProps) {
  const width = SCREEN_WIDTH - 32;
  const chartWidth = width - PADDING.left - PADDING.right;
  const chartHeight = height - PADDING.top - PADDING.bottom;

  const [tooltipData, setTooltipData] = useState<{
    x: number;
    timestamp: number;
    value: number;
  } | null>(null);

  // Calculate time range
  const timeRange = useMemo(() => {
    if (data.length === 0) return { min: 0, max: 1 };
    let minTime = Infinity;
    let maxTime = -Infinity;
    data.forEach((point) => {
      minTime = Math.min(minTime, point.timestamp);
      maxTime = Math.max(maxTime, point.timestamp);
    });
    return { min: minTime, max: maxTime };
  }, [data]);

  // Build path from data
  const pathData = useMemo(() => {
    if (data.length === 0) return null;

    const smoothed = smoothData(data, 30);
    const range = CHART_MAX - CHART_MIN;

    const path = Skia.Path.Make();
    let started = false;

    smoothed.forEach((point) => {
      const x =
        PADDING.left +
        ((point.timestamp - timeRange.min) / (timeRange.max - timeRange.min)) *
          chartWidth;
      const y =
        PADDING.top +
        chartHeight -
        ((point.value - CHART_MIN) / range) * chartHeight;

      if (!started) {
        path.moveTo(x, y);
        started = true;
      } else {
        path.lineTo(x, y);
      }
    });

    return path;
  }, [data, timeRange, chartWidth, chartHeight]);

  // Find value at x position
  const getValueAtX = useCallback(
    (x: number) => {
      const timestamp =
        timeRange.min +
        ((x - PADDING.left) / chartWidth) * (timeRange.max - timeRange.min);

      let closest = data[0];
      let minDist = Infinity;
      data.forEach((point) => {
        const dist = Math.abs(point.timestamp - timestamp);
        if (dist < minDist) {
          minDist = dist;
          closest = point;
        }
      });

      return { timestamp, value: closest?.value ?? 50 };
    },
    [data, timeRange, chartWidth]
  );

  // Pan responder for touch
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          const x = evt.nativeEvent.locationX;
          if (x >= PADDING.left && x <= PADDING.left + chartWidth) {
            const { timestamp, value } = getValueAtX(x);
            setTooltipData({ x, timestamp, value });
          }
        },
        onPanResponderMove: (evt) => {
          const x = evt.nativeEvent.locationX;
          if (x >= PADDING.left && x <= PADDING.left + chartWidth) {
            const { timestamp, value } = getValueAtX(x);
            setTooltipData({ x, timestamp, value });
          }
        },
        onPanResponderRelease: () => setTooltipData(null),
        onPanResponderTerminate: () => setTooltipData(null),
      }),
    [getValueAtX, chartWidth]
  );

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Calculate Y position for a value
  const getY = (value: number) =>
    PADDING.top +
    chartHeight -
    ((value - CHART_MIN) / (CHART_MAX - CHART_MIN)) * chartHeight;

  // Ideal zone dimensions
  const idealZoneY = getY(IDEAL_MAX);
  const idealZoneHeight = getY(IDEAL_MIN) - idealZoneY;

  if (data.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <Text style={styles.emptyText}>No GCT balance data</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height }]}>
      <View style={{ width, height: height - 20 }} {...panResponder.panHandlers}>
        <Canvas style={{ flex: 1 }}>
          {/* Ideal zone shading */}
          <Rect
            x={PADDING.left}
            y={idealZoneY}
            width={chartWidth}
            height={idealZoneHeight}
            color="rgba(76, 175, 80, 0.15)"
          />

          {/* Reference lines */}
          <Line
            p1={vec(PADDING.left, getY(50))}
            p2={vec(PADDING.left + chartWidth, getY(50))}
            color="#4CAF50"
            strokeWidth={1}
            style="stroke"
          />
          <Line
            p1={vec(PADDING.left, getY(49))}
            p2={vec(PADDING.left + chartWidth, getY(49))}
            color="#E0E0E0"
            strokeWidth={1}
          />
          <Line
            p1={vec(PADDING.left, getY(51))}
            p2={vec(PADDING.left + chartWidth, getY(51))}
            color="#E0E0E0"
            strokeWidth={1}
          />

          {/* Data path */}
          {pathData && (
            <Path
              path={pathData}
              color="#1976D2"
              style="stroke"
              strokeWidth={2}
            />
          )}

          {/* Touch indicator */}
          {tooltipData && (
            <>
              <Line
                p1={vec(tooltipData.x, PADDING.top)}
                p2={vec(tooltipData.x, PADDING.top + chartHeight)}
                color="#1976D2"
                strokeWidth={1}
              />
              <Circle
                cx={tooltipData.x}
                cy={getY(tooltipData.value)}
                r={5}
                color="#1976D2"
              />
            </>
          )}
        </Canvas>

        {/* Y-axis labels */}
        <View style={styles.yAxis}>
          <Text style={styles.yLabel}>54%</Text>
          <Text style={[styles.yLabel, styles.yLabelIdeal]}>51%</Text>
          <Text style={[styles.yLabel, styles.yLabelCenter]}>50%</Text>
          <Text style={[styles.yLabel, styles.yLabelIdeal]}>49%</Text>
          <Text style={styles.yLabel}>46%</Text>
        </View>

        {/* Side indicator */}
        <View style={styles.sideIndicator}>
          <Text style={styles.sideText}>← Left</Text>
          <Text style={styles.sideText}>Right →</Text>
        </View>

        {/* Tooltip */}
        {tooltipData && (
          <View
            style={[
              styles.tooltip,
              { left: Math.min(tooltipData.x + 10, width - 100), top: PADDING.top },
            ]}
          >
            <Text style={styles.tooltipTime}>{formatTime(tooltipData.timestamp)}</Text>
            <Text style={styles.tooltipValue}>
              {tooltipData.value.toFixed(1)}%
            </Text>
            <Text style={styles.tooltipSide}>
              {tooltipData.value > 50 ? "Left heavy" : tooltipData.value < 50 ? "Right heavy" : "Balanced"}
            </Text>
          </View>
        )}
      </View>

      {/* X-axis labels */}
      <View style={[styles.xAxis, { paddingLeft: PADDING.left }]}>
        <Text style={styles.axisLabel}>{formatTime(timeRange.min)}</Text>
        <Text style={styles.axisLabel}>
          {formatTime((timeRange.min + timeRange.max) / 2)}
        </Text>
        <Text style={styles.axisLabel}>{formatTime(timeRange.max)}</Text>
      </View>
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
    marginTop: 40,
  },
  yAxis: {
    position: "absolute",
    left: 4,
    top: 20,
    bottom: 30,
    justifyContent: "space-between",
    width: 30,
  },
  yLabel: {
    fontSize: 9,
    color: "#9E9E9E",
    textAlign: "right",
  },
  yLabelIdeal: {
    color: "#BDBDBD",
  },
  yLabelCenter: {
    color: "#4CAF50",
    fontWeight: "600",
  },
  sideIndicator: {
    position: "absolute",
    right: 8,
    top: 20,
    bottom: 30,
    justifyContent: "space-between",
  },
  sideText: {
    fontSize: 8,
    color: "#BDBDBD",
  },
  tooltip: {
    position: "absolute",
    backgroundColor: "rgba(0,0,0,0.85)",
    borderRadius: 8,
    padding: 8,
    minWidth: 80,
  },
  tooltipTime: {
    fontSize: 11,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  tooltipValue: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "bold",
    marginTop: 2,
  },
  tooltipSide: {
    fontSize: 10,
    color: "#90CAF9",
    marginTop: 2,
  },
  xAxis: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingRight: 16,
  },
  axisLabel: {
    fontSize: 10,
    color: "#9E9E9E",
  },
});
