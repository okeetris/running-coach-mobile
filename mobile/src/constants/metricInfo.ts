/**
 * Running dynamics metric information for grade explanations and coaching.
 * Thresholds match backend: backend/app/services/fit_parser.py
 */

import type { Grade } from "../types";

export interface MetricInfo {
  label: string;
  thresholds: Record<Grade, string>;
  unit: string;
  why: string;
  coachingCues: Partial<Record<Grade, string>>;
  higherIsBetter: boolean;
}

export const METRIC_INFO: Record<string, MetricInfo> = {
  cadence: {
    label: "Cadence",
    thresholds: {
      A: "180+ spm",
      B: "170-179 spm",
      C: "160-169 spm",
      D: "<160 spm",
    },
    unit: "spm",
    why: "Higher cadence reduces ground contact time and impact forces, lowering injury risk.",
    coachingCues: {
      B: "Try running to a 180bpm metronome or uptempo music.",
      C: "Focus on quicker, lighter foot turnover. Shorten your stride slightly.",
      D: "Work on cadence drills - high knees and quick feet exercises help build turnover.",
    },
    higherIsBetter: true,
  },
  gct: {
    label: "Ground Contact Time",
    thresholds: {
      A: "<220 ms",
      B: "220-250 ms",
      C: "251-280 ms",
      D: ">280 ms",
    },
    unit: "ms",
    why: "Less time on the ground means more efficient energy return and faster running.",
    coachingCues: {
      B: "Focus on a quick, springy push-off. Plyometrics can help.",
      C: "Work on reactive strength - jump rope and bounding drills improve ground contact.",
      D: "Build leg stiffness with plyometrics and hill sprints. Focus on 'popping' off the ground.",
    },
    higherIsBetter: false,
  },
  gctBalance: {
    label: "GCT Balance",
    thresholds: {
      A: "49-51%",
      B: "48-52%",
      C: "46-54%",
      D: "<46% or >54%",
    },
    unit: "%",
    why: "Balanced ground contact reduces asymmetric loading and injury risk.",
    coachingCues: {
      B: "Minor imbalance - single-leg exercises can help even things out.",
      C: "Noticeable asymmetry - consider gait analysis or targeted strength work.",
      D: "Significant imbalance - address with single-leg drills and possibly physio assessment.",
    },
    higherIsBetter: false, // Deviation from 50% - lower is better
  },
  verticalRatio: {
    label: "Vertical Ratio",
    thresholds: {
      A: "<8%",
      B: "8-9%",
      C: "9-10%",
      D: ">10%",
    },
    unit: "%",
    why: "Lower vertical oscillation means more energy goes into forward motion, not bouncing.",
    coachingCues: {
      B: "Good efficiency. Slight focus on 'running tall' can improve further.",
      C: "Reduce bounce by focusing on forward lean and quick cadence.",
      D: "Too much vertical movement - shorten stride, increase cadence, and lean slightly forward.",
    },
    higherIsBetter: false,
  },
};
