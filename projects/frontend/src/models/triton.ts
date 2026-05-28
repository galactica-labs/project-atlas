export interface ForecastPoint {
  time: string;
  actual: number | null;
  q05: number | null;
  q50: number | null;
  q95: number | null;
  threshold: number;
}

export interface TritonOutput {
  forecastData: ForecastPoint[];
  q50BreachMin: number | null;
  q95BreachMin: number | null;
}

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
];

// °C per minute at each quantile, parameterized by compressor load
function getRates(compressorLoad: number) {
  if (compressorLoad >= 96) return { q05: 0.025, q50: 0.045, q95: 0.07 };
  if (compressorLoad >= 90) return { q05: 0.015, q50: 0.03, q95: 0.05 };
  return { q05: 0.008, q50: 0.015, q95: 0.025 };
}

function breachMinutes(current: number, threshold: number, rate: number): number | null {
  if (rate <= 0) return null;
  const gap = threshold - current;
  if (gap <= 0) return 0;
  return Math.round(gap / rate);
}

export function runTriton(
  currentValue: number,
  threshold: number,
  compressorLoad: number
): TritonOutput {
  const rates = getRates(compressorLoad);

  const forecastData: ForecastPoint[] = STEPS.map(({ label, minutesOut }) => {
    if (minutesOut === 0) {
      return {
        time: label,
        actual: currentValue,
        q05: currentValue,
        q50: currentValue,
        q95: currentValue,
        threshold,
      };
    }
    return {
      time: label,
      actual: null,
      q05: parseFloat((currentValue + rates.q05 * minutesOut).toFixed(2)),
      q50: parseFloat((currentValue + rates.q50 * minutesOut).toFixed(2)),
      q95: parseFloat((currentValue + rates.q95 * minutesOut).toFixed(2)),
      threshold,
    };
  });

  return {
    forecastData,
    q50BreachMin: breachMinutes(currentValue, threshold, rates.q50),
    q95BreachMin: breachMinutes(currentValue, threshold, rates.q95),
  };
}
