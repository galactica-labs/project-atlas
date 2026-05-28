"""Triton: consume an AnomalySignal, forecast time-to-failure, compute blast
radius, synthesize a failure-mode hypothesis + narrative -> TriageReport.

Confidence is derived from the forecast's uncertainty band: a tight q95-q05
band means the model is sure when the threshold is crossed, so policy can act;
a wide band routes to a human (coordination doc §2.2). The LLM writes only the
narrative — the numbers come from the forecaster and the graph, never the LLM.
"""
from __future__ import annotations

import pandas as pd

from atlas_ml.assets import catalog, graph
from atlas_ml.llm import LLMMessage, llm
from atlas_ml.schemas import AnomalySignal, TriageReport
from atlas_ml.triton.forecaster import TritonForecaster

# rule-based first-guess; LLM refines the narrative, not the label
_HYPOTHESIS = {
    ("chiller", "supply_temperature", "above"): "compressor_bearing_wear",
    ("chiller", "compressor_pressure", "above"): "refrigerant_overcharge",
    ("crah", "return_temperature", "above"): "coil_fouling_or_fan_fault",
    ("pump", "flow_rate", "below"): "impeller_wear_or_blockage",
    ("pdu", "load_pct", "above"): "load_imbalance",
    ("ups", "battery_temperature", "above"): "battery_thermal_runaway_risk",
    ("gpu_pod", "inlet_temperature", "above"): "cooling_supply_shortfall",
}


def _confidence_from_band(band_width: float, threshold: float) -> float:
    # ref band ~ 10% of threshold magnitude; tighter than ref -> >0.5 confidence
    ref = max(abs(threshold) * 0.10, 1e-3)
    return float(max(0.0, min(1.0, 1.0 / (1.0 + band_width / ref))))


class Triton:
    def __init__(self, forecaster: TritonForecaster | None = None, max_hops: int = 3):
        self.forecaster = forecaster or TritonForecaster()
        self.max_hops = max_hops

    def triage(self, signal: AnomalySignal, window: pd.Series) -> TriageReport:
        fc = self.forecaster.predict(signal.asset_id, signal.metric, window)

        # if the metric already sits past its failure threshold, the asset is
        # failing now — that overrides any forecast-crossing estimate.
        already_breached = (
            signal.current_value >= fc.threshold if fc.threshold_direction == "above"
            else signal.current_value <= fc.threshold
        )

        # pessimistic crossing drives the clock; fall back to q50, then horizon
        ttf = fc.time_to_q95_crosses_threshold
        escalate = False
        if ttf is None:
            ttf = fc.time_to_q50_crosses_threshold
        if ttf is None:
            ttf = fc.horizon_seconds
            escalate = True
        if already_breached:
            ttf = 0
            escalate = False

        blast = graph.blast_radius(
            signal.asset_id, ttf, signal.detected_at, max_hops=self.max_hops
        )

        atype = catalog.asset_type(signal.asset_id) or "unknown"
        hypothesis = _HYPOTHESIS.get(
            (atype, signal.metric, fc.threshold_direction), "anomalous_drift"
        )
        confidence = _confidence_from_band(fc.uncertainty_band_width, fc.threshold)

        reasoning = self._narrate(signal, fc, hypothesis, ttf, blast, escalate)

        return TriageReport(
            signal_id=signal.id,
            failure_mode_hypothesis=hypothesis,
            time_to_failure_seconds=int(ttf),
            confidence=confidence,
            quantile_forecast=fc,
            blast_radius=blast,
            reasoning=reasoning,
        )

    def _narrate(self, signal, fc, hypothesis, ttf, blast, escalate) -> str:
        downstream = ", ".join(f"{b.asset_id}({b.impact_type})" for b in blast[:6]) or "none"
        prompt = (
            f"Asset {signal.asset_id} ({catalog.asset_type(signal.asset_id)}) tripped "
            f"a z-score anomaly on {signal.metric}: value {signal.current_value:.1f} vs "
            f"baseline {signal.baseline_mean:.1f}±{signal.baseline_std:.2f} (z={signal.z_score:.1f}). "
            f"Quantile forecaster: q50 crosses the failure threshold "
            f"({fc.threshold} {fc.threshold_direction}) in "
            f"{fc.time_to_q50_crosses_threshold}s, q95 (pessimistic) in "
            f"{fc.time_to_q95_crosses_threshold}s, band width {fc.uncertainty_band_width:.2f}. "
            f"Working hypothesis: {hypothesis}. Downstream blast radius: {downstream}. "
            f"{'Forecast did not cross within the horizon — recommend escalation. ' if escalate else ''}"
            "Write a concise 2-3 sentence operator triage summary."
        )
        return llm.complete(
            [LLMMessage(role="user", content=prompt)], role="agent", max_tokens=300
        )
