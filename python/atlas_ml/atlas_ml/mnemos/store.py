"""Central training corpus for Mnemos.

Each closed incident becomes one TrainingTuple appended here. This is the
"central system" the asset-failure models learn from over time: the corpus
accumulates labeled (telemetry-window -> confirmed-root-cause -> outcome)
examples plus the human decisions made along the way.

Hackathon scope is **capture only** — no live retrain (coordination doc §2.2,
cut-list #1). The corpus is durable so a nightly job can train on it later.
Backed by JSONL for zero-setup; swap for the Postgres `training_tuples` table
when Agent 2's DB is up (same TrainingTuple schema).
"""
from __future__ import annotations

import json
from collections import Counter
from pathlib import Path

from atlas_ml.schemas import TrainingTuple


class TupleStore:
    def __init__(self, path: str | Path = "data/training_corpus.jsonl"):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)

    def append(self, tup: TrainingTuple) -> None:
        with self.path.open("a") as f:
            f.write(tup.model_dump_json() + "\n")

    def all(self) -> list[TrainingTuple]:
        if not self.path.exists():
            return []
        out = []
        for line in self.path.read_text().splitlines():
            line = line.strip()
            if line:
                out.append(TrainingTuple.model_validate_json(line))
        return out

    def count(self) -> int:
        if not self.path.exists():
            return 0
        return sum(1 for ln in self.path.read_text().splitlines() if ln.strip())

    def failure_patterns(self) -> dict:
        """Aggregate the human-labeled corpus into the learnable signal.

        This is what makes the central system 'learn from human behaviour':
          - which root causes recur per failure-mode hypothesis (did Triton's
            guess match the confirmed cause?)
          - approve/reject behaviour per action_type
          - false-positive rate (Sentinel/Triton precision proxy)
        """
        tuples = self.all()
        n = len(tuples)
        root_cause = Counter()
        hypothesis_vs_actual = Counter()
        outcome = Counter()
        hitl = Counter()
        for t in tuples:
            root_cause[t.confirmed_root_cause] += 1
            hypothesis_vs_actual[(t.triage_report.failure_mode_hypothesis, t.confirmed_root_cause)] += 1
            outcome[t.outcome] += 1
            for d in t.hitl_decisions:
                hitl[d.get("decision", "unknown")] += 1
        return {
            "n_tuples": n,
            "by_root_cause": dict(root_cause),
            "hypothesis_match": {
                f"{h}->{a}": c for (h, a), c in hypothesis_vs_actual.items()
            },
            "by_outcome": dict(outcome),
            "false_positive_rate": (outcome.get("false_positive", 0) / n) if n else 0.0,
            "hitl_decisions": dict(hitl),
        }
