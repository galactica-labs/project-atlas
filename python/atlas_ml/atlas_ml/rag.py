"""Manual RAG retrieval (stand-in for Agent 9's pgvector ingestion).

Hephaestus cites manual sections to justify a repair action. Until the real
ingestion pipeline + pgvector are up, this serves a small seeded set of manual
chunks and retrieves by embedding cosine (offline embed fallback in llm.py).
Same `retrieve()` contract Agent 9 will expose, so Hephaestus needs no change
when it swaps in.
"""
from __future__ import annotations

import math

from atlas_ml.llm import llm

# (citation, chunk text). Citation is what lands in ProposedAction.cited_manual_sections.
_SEED_CHUNKS = [
    ("Carrier 30XA §7.3 Compressor Bearing Replacement",
     "Rising supply temperature with normal refrigerant charge indicates compressor "
     "bearing wear. Replace bearing assembly BEARING-30XA-001; verify oil pressure."),
    ("Carrier 30XA §5.1 Refrigerant Charge",
     "Overcharge raises discharge pressure. Recover refrigerant to nameplate charge; "
     "inspect for non-condensables before topping up."),
    ("Stulz CW-080 §4.2 Coil & Fan Service",
     "Elevated return temperature with adequate chilled water flow points to coil "
     "fouling or a failing EC fan. Clean coil; test fan tach signal."),
    ("Grundfos NK 100-200 §6.4 Impeller Inspection",
     "Reduced flow at rated head indicates impeller wear or suction blockage. "
     "Inspect impeller clearance; replace mechanical seal SEAL-NK100 if leaking."),
    ("Vertiv 250kVA §3.5 Load Balancing",
     "Sustained load above 95% risks breaker trip. Rebalance phases or shed "
     "non-critical circuits."),
    ("Eaton 9395 §8.1 Battery Thermal Management",
     "Battery temperature above 60C risks thermal runaway. Reduce charge rate; "
     "verify HVAC to battery room; prepare for controlled transfer."),
]


def _cosine(a, b):
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a)) or 1.0
    nb = math.sqrt(sum(y * y for y in b)) or 1.0
    return dot / (na * nb)


class ManualRAG:
    def __init__(self, chunks=None):
        self.chunks = chunks if chunks is not None else list(_SEED_CHUNKS)
        self._vecs = llm.embed([c[1] for c in self.chunks])

    def retrieve(self, query: str, k: int = 3) -> list[dict]:
        qv = llm.embed([query])[0]
        scored = sorted(
            (
                {"citation": cit, "text": txt, "score": _cosine(qv, v)}
                for (cit, txt), v in zip(self.chunks, self._vecs)
            ),
            key=lambda d: d["score"], reverse=True,
        )
        return scored[:k]


rag = ManualRAG()
