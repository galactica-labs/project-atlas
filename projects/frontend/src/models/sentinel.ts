import type { Asset, Incident } from "../data/mock";

const BASELINES: Record<string, { mean: number; std: number; threshold: number }> = {
  "CHW Supply Temp": { mean: 7.0, std: 1.0, threshold: 12.0 },
  "Compressor Load": { mean: 70, std: 10, threshold: 95 },
  "Flow Rate": { mean: 145, std: 15, threshold: 80 },
  "GPU Inlet Temp": { mean: 24, std: 3, threshold: 35 },
  "Supply Air Temp": { mean: 18, std: 1.5, threshold: 25 },
  Battery: { mean: 90, std: 10, threshold: 20 },
  "Fuel Level": { mean: 85, std: 10, threshold: 15 },
};

// true = above threshold is bad, false = below threshold is bad
const ABOVE_IS_BAD: Record<string, boolean> = {
  "CHW Supply Temp": true,
  "Compressor Load": true,
  "Flow Rate": false,
  "GPU Inlet Temp": true,
  "Supply Air Temp": true,
  Battery: false,
  "Fuel Level": false,
};

export interface SentinelMeta {
  sigma: number;
  primaryMetric: string;
  primaryValue: number;
  primaryThreshold: number;
}

let _counter = 1;

export function runSentinel(assets: Asset[]): {
  incident: Omit<Incident, "blastRadius" | "recommendedAction">;
  meta: SentinelMeta;
}[] {
  _counter = 1;

  return assets
    .filter((a) => a.status === "critical")
    .map((asset) => {
      let maxSigma = 0;
      let primaryMetric = "";
      let primaryValue = 0;
      let primaryThreshold = 12.0;
      let anomalousCount = 0;
      const predParts: string[] = [];

      for (const t of asset.telemetry) {
        const bl = BASELINES[t.metric];
        const aboveBad = ABOVE_IS_BAD[t.metric];
        if (bl === undefined || aboveBad === undefined) continue;

        const rawSigma = (t.value - bl.mean) / bl.std;
        const absSigma = Math.abs(rawSigma);
        const isBad = aboveBad ? rawSigma > 1.5 : rawSigma < -1.5;

        if (isBad && absSigma > maxSigma) {
          maxSigma = absSigma;
          primaryMetric = t.metric;
          primaryValue = t.value;
          primaryThreshold = bl.threshold;
        }
        if (isBad) {
          anomalousCount++;
          predParts.push(
            `${t.metric} at ${t.value}${t.unit} (+${absSigma.toFixed(1)}σ above 30-day baseline)`
          );
        }
      }

      const compressor = asset.telemetry.find((t) => t.metric === "Compressor Load");
      const compLoad = compressor?.value ?? 70;
      if (compressor && compLoad > 90 && !predParts.some((p) => p.startsWith("Compressor"))) {
        predParts.push(`compressor load ${compLoad}%`);
      }

      // Rate of temperature rise based on compressor load
      let rate: number;
      if (compLoad >= 96) rate = 0.045;
      else if (compLoad >= 90) rate = 0.025;
      else rate = 0.012;

      const gap = primaryThreshold - primaryValue;
      const ttf = gap <= 0 ? 5 : Math.max(5, Math.round(gap / rate));

      const confidence = Math.min(
        0.98,
        0.6 + (anomalousCount / Math.max(asset.telemetry.length, 1)) * 0.34
      );

      const prediction =
        predParts.length > 0
          ? predParts.join(". ") +
            `. q50 forecast crosses ${primaryThreshold}°C threshold in ${ttf} min.`
          : `${asset.type} system anomaly detected on ${asset.name}`;

      return {
        incident: {
          id: `inc-${String(_counter++).padStart(3, "0")}`,
          assetId: asset.id,
          severity: "critical" as const,
          detectedAt: new Date().toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
          prediction,
          confidence: parseFloat(confidence.toFixed(2)),
          ttf,
          status: "hitl-pending" as const,
        },
        meta: {
          sigma: parseFloat(maxSigma.toFixed(1)),
          primaryMetric,
          primaryValue,
          primaryThreshold,
        },
      };
    });
}
