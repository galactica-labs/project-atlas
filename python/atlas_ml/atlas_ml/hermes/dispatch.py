"""Hermes: hybrid RAG -> MILP technician dispatch (coordination doc §5).

Stage 1  RAG shortlist: embed the incident query + each tech profile, cosine
          rank, keep top-K by relevance (past root causes, asset families).
Stage 2  MILP: among the shortlist, enforce hard constraints (certs,
          availability, shift covers the SLA, parts obtainable) and minimize a
          weighted cost (dispatch delay + travel + skill gap + overtime).
          PuLP+CBC if installed; deterministic greedy fallback otherwise — same
          objective, exact for one assignment.
Stage 3  LLM explanation of why this tech, given the MILP slack.

RAG narrows by relevance; MILP proves the pick is optimal among the feasible.
"""
from __future__ import annotations

import math
import uuid

from atlas_ml.assets import catalog
from atlas_ml.hermes.requirements_map import (
    REQUIRED_CERTS, REQUIRED_PARTS, SITE_LAT, SITE_LNG, WAREHOUSE_DETOUR_MIN,
)
from atlas_ml.llm import LLMMessage, llm
from atlas_ml.schemas import Dispatch, ProposedAction, Technician, TriageReport
from atlas_ml.technicians import TechRoster, roster as default_roster

# objective weights
W_DELAY, W_TRAVEL, W_SKILL, W_OVERTIME = 1.0, 0.5, 20.0, 15.0


def _haversine_min(lat1, lng1, lat2, lng2, kmph: float = 45.0) -> float:
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = math.radians(lat2 - lat1), math.radians(lng2 - lng1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    km = 2 * r * math.asin(min(1.0, math.sqrt(a)))
    return (km / kmph) * 60.0


def _cosine(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a)) or 1.0
    nb = math.sqrt(sum(y * y for y in b)) or 1.0
    return dot / (na * nb)


def _profile_text(t: Technician) -> str:
    return (
        f"certs {' '.join(t.certs)}; families {' '.join(t.asset_families)}; "
        f"resolved {' '.join(t.past_root_causes)}; rating {t.customer_rating}"
    )


class _Candidate:
    __slots__ = ("tech", "sim", "feasible", "reason", "delay", "travel",
                 "skill_gap", "overtime", "cost", "parts_in_van")

    def __init__(self, tech, sim):
        self.tech = tech
        self.sim = sim
        self.feasible = True
        self.reason = ""
        self.delay = self.travel = self.skill_gap = self.overtime = self.cost = 0.0
        self.parts_in_van = True


class Hermes:
    def __init__(self, roster: TechRoster | None = None, shortlist_k: int = 15):
        self.roster = roster or default_roster
        self.shortlist_k = shortlist_k

    # ── stage 1: RAG ────────────────────────────────────────────────────
    def _rag_shortlist(self, triage: TriageReport, asset_type: str, model: str):
        techs = self.roster.all()
        query = (
            f"{triage.failure_mode_hypothesis} on {asset_type} {model}. "
            f"metric {triage.quantile_forecast.metric}."
        )
        vecs = llm.embed([query] + [_profile_text(t) for t in techs])
        qv, tvs = vecs[0], vecs[1:]
        scored = sorted(
            ((t, _cosine(qv, tv)) for t, tv in zip(techs, tvs)),
            key=lambda x: x[1], reverse=True,
        )
        return scored[: self.shortlist_k]

    # ── stage 2: feasibility + cost ─────────────────────────────────────
    def _evaluate(self, tech: Technician, sim: float, asset_type: str,
                  required_certs, required_parts, incident_hour: int) -> _Candidate:
        c = _Candidate(tech, sim)

        missing_certs = [x for x in required_certs if x not in tech.certs]
        if missing_certs:
            c.feasible, c.reason = False, f"missing certs {missing_certs}"
            return c
        if tech.currently_dispatched:
            c.feasible, c.reason = False, "already dispatched"
            return c
        if not self._shift_covers(tech, incident_hour):
            c.feasible, c.reason = False, "shift does not cover SLA window"
            return c

        c.parts_in_van = all(p in tech.van_parts for p in required_parts)
        c.delay = 0.0 if c.parts_in_van else WAREHOUSE_DETOUR_MIN
        c.travel = _haversine_min(tech.home_lat, tech.home_lng, SITE_LAT, SITE_LNG)
        c.skill_gap = (0.0 if asset_type in tech.asset_families else 1.0) \
            + max(0.0, (5.0 - tech.customer_rating) / 5.0)
        c.overtime = max(0.0, tech.overtime_rate - 1.0)
        c.cost = (W_DELAY * c.delay + W_TRAVEL * c.travel
                  + W_SKILL * c.skill_gap + W_OVERTIME * c.overtime)
        return c

    @staticmethod
    def _shift_covers(tech: Technician, hour: int) -> bool:
        s, e = tech.shift_start_hour, tech.shift_end_hour
        return s <= hour < e if s <= e else (hour >= s or hour < e)  # wrap nights

    def _solve_milp(self, feas: list[_Candidate]):
        """Return chosen _Candidate. Uses PuLP if available; else exact greedy."""
        try:
            import pulp  # noqa
        except Exception:
            return min(feas, key=lambda c: c.cost)
        prob = pulp.LpProblem("dispatch", pulp.LpMinimize)
        x = {c.tech.id: pulp.LpVariable(f"x_{c.tech.id}", cat="Binary") for c in feas}
        prob += pulp.lpSum(c.cost * x[c.tech.id] for c in feas)
        prob += pulp.lpSum(x.values()) == 1  # exactly one tech
        prob.solve(pulp.PULP_CBC_CMD(msg=0))
        chosen_id = next(c.tech.id for c in feas if x[c.tech.id].value() == 1)
        return next(c for c in feas if c.tech.id == chosen_id)

    # ── public ──────────────────────────────────────────────────────────
    def dispatch(self, action: ProposedAction, triage: TriageReport,
                 incident_at=None) -> Dispatch:
        asset = catalog.get(action.target_asset_id)
        asset_type = asset.asset_type if asset else "unknown"
        model = asset.model if asset else ""
        required_certs = REQUIRED_CERTS.get(asset_type, [])
        required_parts = REQUIRED_PARTS.get(triage.failure_mode_hypothesis, [])
        incident_hour = incident_at.hour if incident_at is not None else 10

        shortlist = self._rag_shortlist(triage, asset_type, model)
        rag_ids = [t.id for t, _ in shortlist]

        cands = [
            self._evaluate(t, sim, asset_type, required_certs, required_parts, incident_hour)
            for t, sim in shortlist
        ]
        feasible = [c for c in cands if c.feasible]

        if not feasible:
            # fallback: surface RAG top-3 for HITL "no perfect match" (doc §5)
            return Dispatch(
                id=str(uuid.uuid4()), action_id=action.id,
                chosen_tech_id=rag_ids[0] if rag_ids else "",
                rag_candidates=rag_ids[:3],
                milp_alternatives=[{"tech_id": c.tech.id, "reason": c.reason} for c in cands],
                explanation="No technician satisfies all hard constraints; escalating to a human.",
                eta_minutes=0, parts_needed=required_parts,
                parts_status="to_order", milp_status="infeasible",
            )

        chosen = self._solve_milp(feasible)
        alts = sorted(feasible, key=lambda c: c.cost)
        best_cost = alts[0].cost
        milp_alts = [
            {"tech_id": c.tech.id, "total_cost": round(c.cost, 1),
             "slack": round(c.cost - best_cost, 1)}
            for c in alts
        ]
        eta = int(round(chosen.travel + chosen.delay))
        parts_status = "in_van" if chosen.parts_in_van else (
            "in_warehouse" if required_parts else "in_van")

        explanation = self._explain(chosen, alts, asset_type, triage, required_parts)
        return Dispatch(
            id=str(uuid.uuid4()), action_id=action.id,
            chosen_tech_id=chosen.tech.id, rag_candidates=rag_ids,
            milp_alternatives=milp_alts, explanation=explanation,
            eta_minutes=eta, parts_needed=required_parts,
            parts_status=parts_status, milp_status="optimal",
        )

    def _explain(self, chosen, alts, asset_type, triage, required_parts) -> str:
        runner_up = alts[1] if len(alts) > 1 else None
        ru = (f"Next best {runner_up.tech.name} costs +{runner_up.cost - chosen.cost:.0f} "
              f"more ({runner_up.reason or 'higher travel/skill-gap'})." if runner_up else "")
        prompt = (
            f"Dispatch chosen: {chosen.tech.name} for a {triage.failure_mode_hypothesis} "
            f"on a {asset_type}. RAG ranked them highly (past root causes: "
            f"{', '.join(chosen.tech.past_root_causes)}). MILP confirmed optimal: "
            f"travel {chosen.travel:.0f}min, parts {'in van' if chosen.parts_in_van else 'via warehouse'}, "
            f"skill_gap {chosen.skill_gap:.2f}. {ru} "
            "Write a one-paragraph justification for the operator and audit log."
        )
        return llm.complete([LLMMessage(role="user", content=prompt)], role="explainer", max_tokens=250)
