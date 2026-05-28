/**
 * SSE stream types and helpers for the Atlas frontend.
 *
 * The Python engine emits temperatures in °F; all temperature values are
 * converted to °C here before they reach the store.
 */
import type { ForecastPoint } from "../models/triton";

// ── stream payload types ─────────────────────────────────────────────────────

export interface TelemetryTick {
  asset_id: string;
  asset_type: string;
  metric: string;
  value: number;
}

export interface TelemetryBatch {
  ts: string;
  ticks: TelemetryTick[];
}

export interface LogEntry {
  seq: number;
  ts: string;
  agent: string;
  asset_id: string;
  metric: string;
  value: number;
  z_score: number;
  severity: "info" | "warn" | "critical";
  message: string;
}

/** Rolling chart point used in the CommandCenter telemetry panel. */
export interface LiveChartPoint {
  time: string;
  chwTemp: number;
  baseline: number;
}

// ── metric / display mapping ─────────────────────────────────────────────────

/** Backend metric name → frontend display label. */
export const METRIC_MAP: Record<string, string> = {
  supply_temperature: "CHW Supply Temp",
  return_temperature: "Return Air Temp",
  flow_rate: "Flow Rate",
  load_pct: "Load",
};

// ── unit conversion ──────────────────────────────────────────────────────────

/** Convert Fahrenheit to Celsius, rounded to 2 decimal places. */
export function fToC(f: number): number {
  return Math.round((((f - 32) * 5) / 9) * 100) / 100;
}

// ── forecast builder ─────────────────────────────────────────────────────────

/**
 * Minimal subset of QuantileForecastDto consumed by buildForecastPoints.
 * Structurally compatible with the generated api-types schema.
 */
interface QuantileForecast {
  q05: number[];
  q50: number[];
  q95: number[];
  horizon_seconds: number;
  threshold: number;
  time_to_q50_crosses_threshold?: number | null;
  time_to_q95_crosses_threshold?: number | null;
}

/**
 * Frontend display steps.
 * +11m and +18m are not emitted by the backend (5-min ticks) so they are
 * linearly interpolated from the surrounding ticks.
 */
const STEPS = [
  { label: "now", minutesOut: 0 },
  { label: "+5m", minutesOut: 5 },
  { label: "+10m", minutesOut: 10 },
  { label: "+11m", minutesOut: 11 },
  { label: "+15m", minutesOut: 15 },
  { label: "+18m", minutesOut: 18 },
  { label: "+20m", minutesOut: 20 },
  { label: "+25m", minutesOut: 25 },
  { label: "+30m", minutesOut: 30 },
] as const;

function lerp(a: number, b: number, t: number): number {
  return Math.round((a + (b - a) * t) * 100) / 100;
}

/**
 * Interpolate a quantile array (5-min ticks) at an arbitrary minutesOut value
 * and convert the result from °F to °C.
 */
function interpC(arr: number[], minutesOut: number): number {
  const rawIdx = minutesOut / 5;
  const lo = Math.floor(rawIdx);
  const hi = Math.ceil(rawIdx);
  const t = rawIdx - lo;
  const vLo = arr[Math.min(lo, arr.length - 1)];
  const vHi = arr[Math.min(hi, arr.length - 1)];
  return fToC(lerp(vLo, vHi, t));
}

/**
 * Map a backend QuantileForecastDto (all temperature values in °F) to the
 * ForecastPoint array the chart expects (all values in °C).
 *
 * @param forecast   Backend quantile forecast DTO
 * @param currentC   Current observed temperature in °C (placed at t=0 as `actual`)
 */
export function buildForecastPoints(forecast: QuantileForecast, currentC: number): ForecastPoint[] {
  const thresholdC = fToC(forecast.threshold);
  return STEPS.map(({ label, minutesOut }) => {
    if (minutesOut === 0) {
      return {
        time: label,
        actual: currentC,
        q05: currentC,
        q50: currentC,
        q95: currentC,
        threshold: thresholdC,
      };
    }
    return {
      time: label,
      actual: null,
      q05: interpC(forecast.q05, minutesOut),
      q50: interpC(forecast.q50, minutesOut),
      q95: interpC(forecast.q95, minutesOut),
      threshold: thresholdC,
    };
  });
}

/**
 * Extract q50/q95 breach times (in minutes) from the forecast DTO.
 * Falls back to JS-model defaults when the backend values are absent.
 */
export function buildTritonMeta(forecast: QuantileForecast): {
  q50BreachMin: number;
  q95BreachMin: number;
} {
  return {
    q50BreachMin:
      forecast.time_to_q50_crosses_threshold != null
        ? Math.round(forecast.time_to_q50_crosses_threshold / 60)
        : 18,
    q95BreachMin:
      forecast.time_to_q95_crosses_threshold != null
        ? Math.round(forecast.time_to_q95_crosses_threshold / 60)
        : 11,
  };
}
