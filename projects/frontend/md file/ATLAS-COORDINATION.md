# ATLAS — Hackathon Coordination Document

**Read this entire document before writing a single line of code.** If anything here conflicts with what you remember from a previous chat, this document wins. If anything here is ambiguous, post in `#atlas-blockers` immediately. Do not guess.

---

## 0. The North Star (memorize this)

Atlas is a mission-critical infrastructure OS for AI-era data centers. A judge watching the demo must see, in order:

1. Cryptic factory tags get LLM-classified into structured assets; humans confirm the uncertain ones.
2. A facility PDF gets vision-parsed into a dependency graph drawn on a Mapbox floor plan.
3. Anomaly fires on a chiller, cascade animates downstream to GPU pods with countdown timers.
4. Atlas proposes a dispatch; risky action pauses for Telegram approval; human taps Approve.
5. Technician opens the PWA, voice walks them through the fix, camera identifies the asset.
6. An external agent (Claude desktop or a script) connects to Atlas's MCP server and triggers any of the above.

If your component does not contribute to one of these six moments, **deprioritize it**. We finish the demo or we have nothing.

---

## 1. Hard rules for every agent

1. **Never invent dependencies.** If a service you need doesn't exist yet, check the DAG (§7) to see who owns it. Mock its interface from the contract in §4 and keep building.
2. **Pydantic models are law.** Every cross-service boundary uses the schemas in `shared/schemas.py`. Do not redefine them locally. If you need a new field, propose it in `#atlas-schemas` before merging.
3. **Branch naming:** `agent-{N}/{component}` — e.g. `agent-04/sentinel-zscore`. One PR per branch. Squash on merge.
4. **One owner per file.** The §6 assignment table is authoritative. If you need to touch a file you don't own, request the owner in `#atlas-blockers`; do not edit it yourself.
5. **All LLM calls go through `shared/llm.py`.** Never hardcode a provider or model name in your agent. Call `llm.complete(messages, role="agent")` or `llm.vision(image, prompt)` or `llm.embed(text)`. The actual backend (GPT-4o, Claude, local Qwen, etc.) is a single config decision made at demo time. If you import `anthropic` or `openai` directly from agent code, your PR gets reverted. **The vision model is local — Qwen2.5-VL-7B via vLLM, Moondream2 CPU fallback.** Embeddings: OpenAI `text-embedding-3-small` (or local `bge-small` — same adapter).
6. **No real BMS/SCADA, no real BACnet.** Telemetry comes from the synthetic generator (Agent 3). Adapters are voiceover only.
7. **No blockchain.** The "ledger" is a Postgres table with a SHA-256 trigger. If you find yourself reaching for `web3.py`, stop.
8. **Time budget is 12 hours.** Hours 0–8 build, hours 8–10 integrate, hours 10–11 demo polish, hour 11–12 dry runs. See §8 timeline. **At hour 9 we freeze new features.**
9. **When stuck for >20 min, post in `#atlas-blockers`.** Don't grind silently. Someone parallel probably solved it.
10. **Commit every 30 min, even if broken.** Tag working commits with `[GREEN]` in the message.

---

## 2. Locked architecture

### 2.1 The five reasoning agents (do not rename, do not merge)

| Agent | Job | Inputs | Outputs | Uses LLM? | Uses ML? |
|---|---|---|---|---|---|
| **Sentinel** | Detect anomaly via z-score on rolling baseline | telemetry stream | `AnomalySignal` | No | No (pure stats) |
| **Triton** | Compute blast radius via Cypher + forecast time-to-failure with quantile LightGBM + reason about severity | `AnomalySignal`, graph, forecaster | `TriageReport` (incl. q05/q50/q95 forecast) | Yes (narrative) | **Yes — vendored LightGBM forecaster** |
| **Hephaestus** | Decide the action (repair / dispatch / shutdown / wait) | `TriageReport`, manuals (RAG), policies | `ProposedAction` | Yes | No |
| **Hermes** | Pick the optimal technician (hybrid RAG→MILP) | `ProposedAction`, tech roster | `Dispatch` | Yes (explanation only) | RAG (embedding similarity) + MILP |
| **Mnemos** | After work order closes, extract labeled training tuple (hackathon: data capture only, no retrain) | work order, telemetry window | `TrainingTuple` | Yes (root cause synthesis) | No (cut list item: nightly retrain) |

### 2.2 The forecasting & learning stack (what's a model, what's not)

| Concern | Tool | Hackathon scope |
|---|---|---|
| Anomaly detection | Z-score on rolling baseline | Real, not mocked. Built by Agent 4. |
| Time-to-failure forecast | **Vendored LightGBM quantile forecaster** (q05/q50/q95) — repurposed from renewable-energy battery model | Real. Trained on seed telemetry. Loaded by Triton (Agent 5). |
| Uncertainty signal | Width of (q95 - q05) band | Wide band → policy engine routes to HITL. Narrow band → may auto-execute. |
| Technician matching | Sentence-transformer embeddings + cosine | Real. Tech embeddings built once at seed time. |
| Optimal dispatch | PuLP + CBC MILP | Real. Solves in <2s for the demo. |
| Approval pattern learning | SQL aggregates over `approval_decisions` — count by (action_tag, criticality, confidence_bucket); promote at ≥5 same decision | Real. Lightweight, no model. |
| Nightly retraining of forecaster | LightGBM retrain on accumulated `training_tuples` + seed | **Cut list item #1** — capture tuples and show UI toast; skip live retrain unless time at hour 10 |
| Federated baseline sharing | Anonymized failure-signature POST to mock registry endpoint | Voiceover only. |

**Why z-score + LightGBM, not deep learning:** judges respect that we picked the simplest tool that demonstrably works. Z-score catches anomalies; quantile LightGBM gives calibrated uncertainty bands; conformal calibration guarantees coverage. Deep learning on 30 days of single-site data would overfit and we can't justify it. The architecture cleanly supports swapping in heavier models when there's enough data — that's the v2 story.

### 2.3 The five MCP servers (one per concern, all FastMCP)

| Server | Tools exposed |
|---|---|
| `mcp_telemetry` | `get_current(asset_id, metric)`, `get_window(asset_id, metric, start, end)`, `list_anomalies(since)` |
| `mcp_graph` | `get_asset(id)`, `blast_radius(asset_id, hops=3)`, `dependencies_of(asset_id)`, `dependents_of(asset_id)` |
| `mcp_parts` | `check_stock(part_sku)`, `nearest_warehouse(part_sku, location)`, `compatible_parts(asset_model)` |
| `mcp_history` | `past_incidents(asset_id, limit=10)`, `similar_failures(failure_mode, limit=5)`, `tech_history(tech_id)` |
| `mcp_dispatch` | `propose_dispatch(action)`, `confirm_dispatch(dispatch_id, approver)`, `create_ticket(action)` |

These five servers are **also** the public-facing MCP surface. The external-agent demo connects to them. There is no separate "external API" — MCP is the API.

### 2.4 Data stores (one Postgres, multiple extensions)

| Store | Purpose |
|---|---|
| Postgres core | `assets`, `tag_mappings`, `policies`, `audit_records`, `work_orders`, `dispatches`, `training_tuples` |
| Apache AGE (Postgres ext) | Graph: `assets` as nodes, `FEEDS`, `DEPENDS_ON`, `CONTAINED_IN`, `GOVERNED_BY` as edges |
| TimescaleDB (Postgres ext) | `telemetry` hypertable partitioned by day |
| pgvector (Postgres ext) | Manual chunks (`manual_sections`), technician embeddings (`tech_embeddings`) |
| Redis | Pub/sub channels: `anomaly_events`, `dispatch_events`, `hitl_pending`, `telemetry_tick` |
| Cloudflare R2 | Uploaded PDFs, generated compliance reports |

**One Supabase project hosts the Postgres.** All extensions install in the same DB. Connection string in `shared/db.py`.

### 2.5 Frontend surfaces (all in one Next.js 14 app, multiple routes)

| Route | Purpose | Owner |
|---|---|---|
| `/onboard/tags` | Tag classification HITL review | Agent 7 |
| `/onboard/floorplan` | Mapbox asset placement + React Flow dependency editor | Agent 8 |
| `/onboard/manuals` | PDF upload, Perplexity-then-upload flow | Agent 9 |
| `/command` | Live floor plan + cascade animation + anomaly feed | Agent 10 |
| `/tech` (PWA) | Voice + camera technician interface | Agent 11 |
| `/admin/policies` | Monaco YAML editor for policy engine | Agent 12 |

---

## 3. Decision log (corrections to what was in your head)

| Topic | Your assumption | What we're actually doing | Why |
|---|---|---|---|
| Manual discovery | Perplexity researches manuals | **Perplexity first, fallback to worker upload** | Best of both: automation when possible, human safety net when Perplexity fails |
| Technician dispatch | RAG over tech embeddings | **Hybrid: RAG shortlists ~15, MILP picks optimal 1** | RAG alone ignores hard constraints (certs, SLA, parts). MILP alone ignores past-incident similarity. Hybrid uses each for its strength. Demo voiceover: "RAG narrows the field by relevance, MILP proves the pick is optimal." See §5 for details. |
| Ticket integrity | Blockchain | **Hash-chained Postgres ledger** (`sha256(payload + prev_hash)` trigger) | Tamper-evident, append-only, no consensus overhead, no chain network. Same audit guarantees, 1% the complexity. |
| Confidence-based autonomy | "Model confident → auto-decide" | **Policy YAML evaluated per action.** Decision memory promotes rules into the YAML over time. | Confidence alone is unsafe; the policy file is the contract with the customer about what Atlas may do unattended. |
| Learning period | "First half to one month" | **Pre-seeded with 30 days of synthetic history.** Demo shows the mechanism, not the wall clock. | 12-hour hackathon. We voiceover the calibration period. |
| Agent count | Generic "the LLM" | **Five named agents** with strict roles. | Demo narrative: judges see specialization, not a monolith. |
| Technician PWA | Not mentioned | **Required surface** — voice + camera + AR module ALREADY BUILT, integration only | Big de-risk. Agent 13 wires the existing PWA into Atlas APIs; no new model wiring. |
| Sentinel "learning model" | "Some kind of ML" | **Z-score (Sentinel) + vendored LightGBM quantile forecaster (Triton)** | Z-score for detection (no training needed); your renewable-energy LightGBM model is repurposed for time-to-failure forecasting with q05/q50/q95 bands. Uncertainty width gates HITL. |
| Mnemos model | "What model do I use?" | **No model. Data capture only.** Captures `TrainingTuple` on work-order close, displays in UI. Nightly retrain is cut list. | A single demo incident isn't enough to demonstrate retraining; live retrain adds risk without payoff. |
| LLM choice | Anthropic vs other | **Adapter pattern via `shared/llm.py`** — swap backend at config time | Frees decision until demo day; no agent hardcodes a provider; voice & camera are already-built and don't go through this adapter |
| Vision model | "Probably local" | **Qwen2.5-VL-7B via vLLM** (Moondream2 CPU fallback) | Strong on schematics + OCR, fits on a single GPU; Moondream2 is the no-GPU fallback |
| Policy templates | Implicit in spec | **Ship 3 templates at launch** — conservative / balanced / aggressive — customer picks one and Monaco-edits | Removes the "write YAML from scratch" objection; matches Phase 2 spec |

---

## 4. Interface contracts (Pydantic — copy verbatim, do not modify)

All in `shared/schemas.py`. Owner: Agent 1. Everyone else imports.

```python
from pydantic import BaseModel, Field
from typing import Literal, Optional
from datetime import datetime
from decimal import Decimal

# ============ DOMAIN PRIMITIVES ============

class Asset(BaseModel):
    id: str  # e.g. "CHILLER-A-03"
    asset_type: Literal["chiller", "crah", "pdu", "ups", "gpu_pod", "switchgear", "pump", "ahu"]
    model: str  # e.g. "Carrier 30XA-1102"
    criticality: Literal["low", "medium", "high", "critical"]
    location: dict  # {"floor": 1, "row": "A", "col": 3, "lat": 0.0, "lng": 0.0}
    manual_ids: list[str] = []

class TagMapping(BaseModel):
    raw_tag: str  # e.g. "AHU_03_SUP_TMP_F"
    asset_id: str
    metric: str  # e.g. "supply_temperature"
    unit: str  # e.g. "fahrenheit"
    confidence: float = Field(..., ge=0.0, le=1.0)
    auto_accepted: bool  # True if confidence > 0.9
    human_reviewed: bool = False
    human_corrected: bool = False

# ============ AGENT I/O ============

class AnomalySignal(BaseModel):
    """Sentinel output."""
    id: str
    asset_id: str
    metric: str
    current_value: float
    baseline_mean: float
    baseline_std: float
    z_score: float
    severity: Literal["info", "warn", "critical"]
    detected_at: datetime

class BlastRadiusNode(BaseModel):
    asset_id: str
    hops_from_source: int
    estimated_impact_at: datetime  # when this asset is affected if no action
    impact_type: Literal["loss_of_cooling", "loss_of_power", "loss_of_capacity", "degraded"]

class QuantileForecast(BaseModel):
    """Triton's LightGBM forecaster output."""
    metric: str
    horizon_seconds: int  # e.g. 1800 (30 min)
    q05: list[float]  # length = horizon / tick
    q50: list[float]
    q95: list[float]
    threshold: float  # from manual — value at which asset fails
    time_to_q50_crosses_threshold: Optional[int] = None  # seconds; None if no crossing in horizon
    time_to_q95_crosses_threshold: Optional[int] = None
    uncertainty_band_width: float  # mean(q95 - q05) — used by policy engine

class TriageReport(BaseModel):
    """Triton output."""
    signal_id: str
    failure_mode_hypothesis: str  # e.g. "compressor_bearing_wear"
    time_to_failure_seconds: int  # = forecast.time_to_q95_crosses_threshold, or None → escalate
    confidence: float = Field(..., ge=0.0, le=1.0)  # derived from uncertainty_band_width
    quantile_forecast: QuantileForecast
    blast_radius: list[BlastRadiusNode]
    reasoning: str  # LLM's narrative explanation

class ProposedAction(BaseModel):
    """Hephaestus output."""
    id: str
    triage_id: str
    action_type: Literal["dispatch_tech", "shutdown", "throttle", "wait", "schedule_maintenance"]
    action_tags: list[str]  # for policy engine: e.g. ["physical_intervention", "service_affecting"]
    target_asset_id: str
    rationale: str
    cited_manual_sections: list[str]
    agent_confidence: float = Field(..., ge=0.0, le=1.0)
    requires_approval: bool  # set by policy engine
    approval_reason: Optional[str] = None  # which policy rule fired

class Dispatch(BaseModel):
    """Hermes output."""
    id: str
    action_id: str
    chosen_tech_id: str
    rag_candidates: list[str]  # top 15 from vector search
    milp_alternatives: list[dict]  # [{tech_id, total_cost, slack}, ...]
    explanation: str  # Claude-generated "why this tech"
    eta_minutes: int
    parts_needed: list[str]
    parts_status: Literal["in_van", "in_warehouse", "to_order"]

class TrainingTuple(BaseModel):
    """Mnemos output."""
    incident_id: str
    telemetry_window_start: datetime
    telemetry_window_end: datetime
    anomaly_signal: AnomalySignal
    triage_report: TriageReport
    actions_taken: list[ProposedAction]
    confirmed_root_cause: str
    parts_consumed: list[str]
    hitl_decisions: list[dict]
    outcome: Literal["resolved", "escalated", "false_positive"]

# ============ HITL ============

class ApprovalRequest(BaseModel):
    id: str
    action: ProposedAction
    triage: TriageReport
    dispatch: Optional[Dispatch] = None
    sent_to: list[str]  # ["telegram:chat_123"]
    sent_at: datetime
    expires_at: datetime

class ApprovalDecision(BaseModel):
    request_id: str
    approver_id: str
    decision: Literal["approve", "reject", "modify"]
    reason: Optional[str] = None  # required if reject/modify
    modified_action: Optional[ProposedAction] = None
    signature: str  # HMAC of decision for audit
    decided_at: datetime
```

**Redis channel payloads:** the JSON form of the above schemas. `anomaly_events` carries `AnomalySignal`, `dispatch_events` carries `Dispatch`, `hitl_pending` carries `ApprovalRequest`.

### 4.1 The LLM adapter (`shared/llm.py`)

Every agent imports this. Backend is config, swapped at demo time.

```python
from typing import Literal, Any
from pydantic import BaseModel

class LLMMessage(BaseModel):
    role: Literal["system", "user", "assistant"]
    content: str

class LLMAdapter:
    """Single point of contact for all LLM operations.
    
    Backend selected via env var ATLAS_LLM_BACKEND in {"openai", "anthropic", "local_vllm"}.
    Vision backend always Qwen2.5-VL-7B (env: ATLAS_VISION_URL pointing to vLLM endpoint).
    Embedding backend selected via ATLAS_EMBED_BACKEND in {"openai", "bge_local"}.
    """
    
    async def complete(
        self,
        messages: list[LLMMessage],
        role: Literal["agent", "classifier", "explainer"] = "agent",
        max_tokens: int = 1024,
        temperature: float = 0.3,
        json_mode: bool = False,
    ) -> str: ...
    
    async def complete_with_tools(
        self,
        messages: list[LLMMessage],
        tools: list[dict],  # JSON schema
        max_iterations: int = 5,
    ) -> dict: ...  # final result after tool loop
    
    async def vision(
        self,
        image_path: str,
        prompt: str,
        json_mode: bool = True,
    ) -> str: ...
    
    async def embed(self, texts: list[str]) -> list[list[float]]: ...

llm = LLMAdapter()  # singleton; import from shared.llm
```

**Rules for agents:**
- Never `import openai` or `import anthropic` outside `shared/llm.py`
- Use `role="classifier"` for cheap structured tasks (tag classification, ingest), `role="agent"` for reasoning (Triton, Hephaestus), `role="explainer"` for narrative (Hermes explanations)
- The adapter routes by role: e.g. classifier → cheap fast model, agent → reasoning model
- All tool calling goes through `complete_with_tools` which handles the MCP loop internally

---

## 5. Hybrid dispatch (the decision you asked me to make)

### What we're doing

Two-stage selection: **RAG narrows, MILP optimizes, Claude explains.**

**Stage 1 — RAG shortlist.** Each technician has an embedding built from:
- Certification list (CFC, EPA 608, NFPA 70E, etc.)
- Asset families historically worked (chiller, CRAH, switchgear, ...)
- Past root causes resolved (free text from work orders)
- Customer-rated outcomes (1–5)

When an incident fires, we embed the query `f"{failure_mode} on {asset_type} {asset_model}. Symptoms: {top_metrics}. Past root causes: {similar_history}"` and run pgvector cosine similarity. Top 15 candidates pass to stage 2.

**Stage 2 — MILP feasibility + optimality.** Feed the 15 to PuLP+CBC.

- **Decision variable:** `x[t] ∈ {0,1}` — assign tech `t` or not. Exactly one must be 1.
- **Hard constraints:**
  - Tech holds all required certs for the asset
  - Tech is not currently dispatched
  - Tech's shift covers the SLA window
  - Required parts are in tech's van OR in a warehouse the tech can detour through within SLA
- **Objective:** minimize `Σ x[t] · (w1·dispatch_delay_min + w2·travel_min + w3·skill_gap + w4·overtime_cost)`
- **Solve:** CBC, <2s on 15 candidates.

**Stage 3 — Explanation.** Claude takes the chosen tech, the MILP slack values (which constraints were binding, which alternative lost by how much), and the RAG similarity reasons, and writes one paragraph for the UI and audit log.

### Why this beats either pure approach

| Approach | Pure RAG fails because | Pure MILP fails because |
|---|---|---|
| **Pure RAG** | No notion of hard constraints — returns 3 techs all already busy or missing certs. | — |
| **Pure MILP** | — | Treats techs as flat feature vectors. Can't capture "this person fixed three identical chiller incidents at this exact site." With 5,000 techs across 50 sites, MILP search space explodes. |
| **Hybrid** | RAG prunes 5,000 → 15 by relevance. MILP proves the pick is optimal among the 15. Each does what it's good at. | |

### Fallback

If MILP is infeasible (no tech meets all hard constraints), surface the RAG top-3 with a HITL "no perfect match" prompt. Better to ask a human than dispatch wrong.

### Hackathon scope

8 seeded techs. MILP solves trivially. The hybrid is built end-to-end and the voiceover sells it as "this is the production code path; with 5,000 techs, RAG is what makes MILP tractable."

**Owner:** Agent 6 (Hermes). Tech embeddings: Agent 5. Policy engine that calls dispatch: Agent 14.

---

## 5.5 Policy templates (what ships at install)

Three YAML templates ship with Atlas. Customer picks one in `/admin/policies` during onboarding, then tweaks. Monaco editor is the "advanced" tab for power users.

### Template structure (all three)

```yaml
# Each rule: if all `match` conditions hold for a ProposedAction, take `effect`
# Effects: "auto_execute" | "require_approval" | "block"
# Conditions can match on: action_type, action_tags, asset_criticality, agent_confidence, uncertainty_band_width
# Decision memory writes new rules here over time (with a `learned: true` flag and provenance)

rules:
  - id: <unique_id>
    match:
      action_type: <type or any>
      action_tags: [<tag>, ...]  # ALL must be present
      asset_criticality: [<level>, ...]  # ANY matches
      agent_confidence: { min: 0.0, max: 1.0 }
      uncertainty_band_width: { max: <float> }  # from QuantileForecast
    effect: <effect>
    approvers: [<role>, ...]  # for require_approval
    reason: "<human-readable why this rule exists>"
```

### Conservative (data_center, default for first 30 days)

> "Atlas asks before doing anything that touches a running asset."

```yaml
rules:
  - id: any_physical_action
    match: { action_tags: [physical_intervention] }
    effect: require_approval
    approvers: [supervisor, ops_manager]
    reason: "All hands-on work requires supervisor sign-off during shadow period"
  - id: any_shutdown
    match: { action_type: shutdown }
    effect: require_approval
    approvers: [ops_manager, site_director]
    reason: "Shutdowns always require ops manager"
  - id: read_only_diagnostics
    match: { action_tags: [diagnostic, read_only] }
    effect: auto_execute
    reason: "Atlas can always look, never touch unattended"
  - id: schedule_low_criticality
    match:
      action_type: schedule_maintenance
      asset_criticality: [low, medium]
      agent_confidence: { min: 0.8 }
    effect: auto_execute
    reason: "Routine scheduling on non-critical assets is safe"
```

### Balanced (data_center, default after shadow period)

> "Atlas acts on low-stakes things, asks on the rest."

```yaml
rules:
  - id: critical_asset_any_action
    match: { asset_criticality: [critical] }
    effect: require_approval
    approvers: [ops_manager]
    reason: "Critical assets always have a human in the loop"
  - id: high_uncertainty_pause
    match: { uncertainty_band_width: { min: 0.4 } }  # wide forecast = unsure
    effect: require_approval
    approvers: [supervisor]
    reason: "When the forecast is uncertain, ask"
  - id: confident_dispatch_medium
    match:
      action_type: dispatch_tech
      asset_criticality: [medium]
      agent_confidence: { min: 0.85 }
      uncertainty_band_width: { max: 0.25 }
    effect: auto_execute
    reason: "Confident dispatch on medium-criticality is automatic"
  - id: shutdowns_always
    match: { action_type: shutdown }
    effect: require_approval
    approvers: [ops_manager]
```

### Aggressive (after 90+ days of clean operation, opt-in only)

> "Atlas acts unless it's unsafe; humans get a digest."

```yaml
rules:
  - id: site_director_only_shutdowns_of_critical
    match:
      action_type: shutdown
      asset_criticality: [critical]
    effect: require_approval
    approvers: [site_director]
  - id: confident_anything
    match:
      agent_confidence: { min: 0.9 }
      uncertainty_band_width: { max: 0.3 }
    effect: auto_execute
    reason: "Trusted to act when confident"
  - id: medium_confidence_digest
    match:
      agent_confidence: { min: 0.7, max: 0.9 }
    effect: auto_execute
    notify: [supervisor]
    digest: shift_change
    reason: "Execute but include in next shift digest"
```

### Decision-memory promotion (the learning loop)

A Celery job runs hourly:
- Query: "approvals in last 30d where decision was identical for ≥5 events with matching (action_tags, criticality bucket, confidence bucket, uncertainty bucket)"
- For each pattern → propose a new rule with `learned: true` and the matching conditions
- The proposal itself fires a HITL "promote this to auto-approved?" via Telegram
- Approval writes the rule into the customer's active policy YAML with provenance

This is the only "model learning" that fires during the hackathon demo. **No ML weights are updated live.** It's SQL aggregates and a YAML write.

**Owner:** Agent 14.

---

## 5.6 Forecaster integration (vendored LightGBM)

The user's existing renewable-energy forecaster is repurposed for Triton's time-to-failure prediction. Drop the code into `vendored/forecaster/` as-is. Agent 17 trains it; Agent 5 loads it in Triton.

### What the forecaster does in Atlas

For a given (asset_id, metric, current_value, last_60min_window):
1. Build feature row: time-of-day sin/cos, day-of-week, lags [1m, 5m, 15m, 60m], related-asset metrics from graph neighbors (e.g. chiller A-03 forecast uses CRAH return temps that depend on it)
2. Predict q05/q50/q95 trajectory for next 30 minutes (180 ticks at 10s sample rate, or 6 ticks at 5min)
3. Read failure threshold from the manual (cached per asset_model)
4. Find first index where each quantile crosses the threshold
5. Return `QuantileForecast` (schema in §4)

### Training data preparation (Agent 17, hour 1–3)

```python
# pseudo
seed_telemetry = load_30_days_from_timescale()  # all 50 assets × all metrics
features = build_features(
    seed_telemetry,
    lags=[1, 5, 15, 60],         # minutes
    neighbor_metrics=load_from_age(),   # graph-derived
    time_features=["hour_sin", "hour_cos", "dow", "month_sin", "month_cos"],
)
# Train per (asset_type, metric) — chiller supply_temp gets its own model
for asset_type, metric in CRITICAL_PAIRS:  # ~12 pairs
    train_quantile_lgbm(features[asset_type, metric], quantiles=[0.05, 0.50, 0.95])
    save_to(f"models/triton/{asset_type}_{metric}/")
```

Total training time: ~5–10 minutes for all critical pairs on CPU. Run once in seed phase. Hot-swap not needed for hackathon.

### Loading in Triton (Agent 5)

```python
# agents/triton/forecaster.py
from vendored.forecaster import QuantileForecaster

class TritonForecaster:
    def __init__(self):
        self._cache = {}  # (asset_type, metric) -> QuantileForecaster
    
    def predict(self, asset_id, metric, window) -> QuantileForecast:
        asset_type = lookup_asset_type(asset_id)
        key = (asset_type, metric)
        if key not in self._cache:
            self._cache[key] = QuantileForecaster.load(f"models/triton/{asset_type}_{metric}/")
        features = build_features_inference(asset_id, metric, window)
        q05, q50, q95 = self._cache[key].predict(features)
        threshold = lookup_threshold(asset_id, metric)
        return QuantileForecast(
            metric=metric, horizon_seconds=1800,
            q05=q05.tolist(), q50=q50.tolist(), q95=q95.tolist(),
            threshold=threshold,
            time_to_q50_crosses_threshold=first_cross_seconds(q50, threshold),
            time_to_q95_crosses_threshold=first_cross_seconds(q95, threshold),
            uncertainty_band_width=float(np.mean(np.array(q95) - np.array(q05))),
        )
```

### Demo voiceover beat (Triton)

> "Sentinel caught the anomaly with z-score. Triton then forecasts the next 30 minutes — quantile LightGBM gives us a 90% prediction interval, calibrated with conformal residuals. We see q50 crosses the failure threshold in 18 minutes; q95 — our pessimistic case — at 11. The interval is tight, so Atlas is confident. Wide intervals would route this to a human; narrow ones let policy decide."

---

## 6. Agent assignments (10–20 parallel)

The spec is built for 16 agents. If you spin up 10, fold the bracketed agents into their parent (noted). If 20, split the largest as noted.

### Foundation layer (must start at t=0, blocks everything)

| Agent | Owns | Files | Done when |
|---|---|---|---|
| **1 — Schemas, LLM adapter, shared utils** | All Pydantic models, `shared/llm.py` adapter, DB connection helpers, Redis client, logging config | `shared/schemas.py`, `shared/llm.py`, `shared/db.py`, `shared/redis.py`, `shared/logging.py` | Other agents can import and start coding. Adapter has stub implementations for OpenAI + Anthropic; choosing backend is one env var. **DELIVER BY HOUR 1.** |
| **2 — Database + seed** | Postgres schema (assets, tag_mappings, telemetry hypertable, audit_records, work_orders, dispatches, training_tuples, policies, manual_sections, tech_embeddings), AGE graph schema, seed script for 50 assets + 8 techs + 30 days of pre-baked telemetry | `db/migrations/`, `db/seed.py`, `db/age_setup.sql` | Migrations run clean, seed produces a queryable DB. **DELIVER BY HOUR 2.** |
| **3 — Synthetic telemetry generator** | Python script writing realistic HVAC patterns to Redis on 1s tick; injects scripted anomalies on cue | `services/telemetry_gen/main.py`, `services/telemetry_gen/patterns.py`, `services/telemetry_gen/anomaly_script.py` | Running it streams to Redis; calling `inject_anomaly("CHILLER-A-03")` triggers the demo cascade. **DELIVER BY HOUR 3.** |

### Agent layer (the five reasoning agents)

| Agent | Owns | Files | Done when |
|---|---|---|---|
| **4 — Sentinel** | Z-score scorer, baseline calculator, anomaly publisher | `agents/sentinel/scorer.py`, `agents/sentinel/baseline.py`, `agents/sentinel/main.py` (Celery worker) | Telemetry tick → `AnomalySignal` published to Redis `anomaly_events` when z>3. **HOUR 4.** |
| **5 — Triton + forecaster + tech embeddings** | Blast-radius Cypher, vendored LightGBM forecaster integration, failure-mode hypothesis via LLM, tech embedding job | `agents/triton/blast_radius.py`, `agents/triton/forecaster.py` (wraps `vendored/forecaster/`), `agents/triton/triage.py`, `agents/triton/main.py`, `jobs/embed_techs.py` | Consumes `AnomalySignal`, runs LightGBM forecast on the affected metric, publishes `TriageReport` with q05/q50/q95 + time-to-q95-crosses-threshold. Tech embeddings populated in pgvector. **HOUR 5.** |
| **6 — Hephaestus + Hermes + Mnemos** [split if 20 agents: 6a Hephaestus, 6b Hermes, 6c Mnemos] | Action decision with manual RAG; hybrid RAG→MILP dispatch; **Mnemos = data capture only** (TrainingTuple on close, UI toast, write to `training_tuples` table — NO live retraining) | `agents/hephaestus/`, `agents/hermes/`, `agents/mnemos/` | Full chain Sentinel→Triton→Hephaestus→Hermes runs end-to-end. Mnemos writes tuples and fires UI event. **HOUR 6.** |

| **17 — Forecaster trainer (vendored)** | Drops the user's existing LightGBM quantile forecaster into `vendored/forecaster/`. Wires it to seed telemetry: takes 30 days × 50 assets × ~4 metrics, pre-aggregates to 5-min buckets, trains q05/q50/q95 boosters per (asset_type, metric), saves artifacts. Includes feature engineering: time-of-day, day-of-week, lag-1/5/15/60min, related-asset metrics from graph neighbors | `vendored/forecaster/` (copy of existing code), `jobs/train_forecaster.py`, `models/triton/{asset_type}_{metric}/lgbm_q{05,50,95}.txt` | Running `make train-forecaster` produces artifacts loadable by Agent 5's `forecaster.py`. Predictions on held-out data show realistic uncertainty bands. **HOUR 3.** Critical-path for Agent 5. |

### Backend services

| Agent | Owns | Files | Done when |
|---|---|---|---|
| **7 — Tag classification + Perplexity manual fetch** | FastAPI endpoint that takes raw tags → Claude classification with confidence → store in `tag_mappings`. Perplexity client that looks up manuals by model number; on fail, expose upload endpoint | `services/api/routes/tags.py`, `services/api/routes/manuals.py`, `services/perplexity_client.py` | Posting a tag list returns mappings with confidences. Posting a model number returns a manual URL or 404→upload. **HOUR 4.** |
| **8 — Vision dependency-graph builder** | Endpoint that takes uploaded facility PDF → rasterize pages → call local Qwen2.5-VL-7B (or Moondream2 CPU fallback) via `llm.vision()` → return proposed nodes + edges. Write proposals into AGE | `services/api/routes/floorplan.py`, `services/vision/parse_pdf.py`, `services/vision/build_graph.py`, `infra/vllm_qwen.sh` (startup script) | Uploading the seeded floor-plan PDF produces a graph with ≥10 nodes and ≥15 edges, visible in `/onboard/floorplan` for human confirmation. vLLM server up before hour 4. **HOUR 6.** |
| **9 — Manual RAG ingestion** | PDF → pypdf + unstructured → chunk → `llm.embed()` → pgvector. Reranker uses `llm.complete()` | `services/rag/ingest.py`, `services/rag/retrieve.py` | Ingesting 3 seeded HVAC manuals + query returns top-5 chunks with citations. **HOUR 5.** |
| **10 — Five MCP servers** | FastMCP servers for telemetry, graph, parts, history, dispatch | `mcp_servers/telemetry.py`, `mcp_servers/graph.py`, `mcp_servers/parts.py`, `mcp_servers/history.py`, `mcp_servers/dispatch.py` | Claude desktop config snippet works; each tool callable and returns typed output. **HOUR 7.** |

### Frontend

| Agent | Owns | Files | Done when |
|---|---|---|---|
| **11 — Onboarding screens** | `/onboard/tags`, `/onboard/floorplan` (Mapbox + React Flow), `/onboard/manuals` | `app/onboard/tags/`, `app/onboard/floorplan/`, `app/onboard/manuals/` | All three flows demo-able with seeded data. **HOUR 7.** |
| **12 — Command center** | `/command` — Mapbox floor plan, WebSocket subscribes to Redis events, asset color updates, cascade animation, anomaly feed sidebar | `app/command/` | Live tick visible, anomaly triggers cascade, blast radius lights up with countdowns. **HOUR 8.** |
| **13 — Technician PWA integration** [SCOPE REDUCED: the PWA with voice + camera + AR is already built in another project; this agent integrates it into Atlas, not rebuilds it] | Drop existing PWA module into `app/tech/`, wire it to Atlas APIs: function-calling handlers route to FastAPI endpoints (`start_job`, `next_step`, `pull_manual`, `log_action`, `close_job`); camera frame context wires to current work order asset_id; auth handshake with Supabase | `app/tech/` (mostly imported from existing project), `services/api/routes/work_orders.py` (the endpoints the PWA calls) | Existing voice walks through a scripted repair using the seeded chiller work order. Camera identifies the chiller. Function calls hit Atlas endpoints and update DB. **HOUR 7** (earlier due to reduced scope). |
| **14 — Policy engine + templates + HITL gateway + Telegram bot + admin UI** | (a) Policy YAML evaluator. (b) **Ship 3 pre-built templates** (`templates/policies/data_center_conservative.yaml`, `_balanced.yaml`, `_aggressive.yaml`) covering action_tags × asset_criticality × confidence_bucket × uncertainty_band_width with sensible defaults per risk profile. (c) FastAPI + Redis pending-state HITL (Azure Durable Functions is voiceover only — too much setup for 12hr). (d) Telegram bot with inline keyboard. (e) `/admin/policies` — template picker UI as primary flow, Monaco editor as "advanced" tab | `services/policy/engine.py`, `templates/policies/*.yaml`, `services/hitl/gateway.py`, `services/hitl/telegram_bot.py`, `app/admin/policies/` | Customer picks a template → policy loads. Hephaestus proposes risky action → bot message arrives with full reasoning trace → tapping Approve resumes the chain → audit row written. **HOUR 8.** |

### Quality + demo

| Agent | Owns | Files | Done when |
|---|---|---|---|
| **15 — Audit ledger + compliance report** | SHA-256 trigger, verification job, WeasyPrint monthly report template (1-pager for demo) | `db/migrations/audit_trigger.sql`, `jobs/verify_chain.py`, `services/reports/compliance.py` | Inserting two rows produces valid chain; tampering one row makes verifier flag it; sample compliance PDF generates. **HOUR 7.** |
| **16 — Demo script + voiceover + dry-run conductor** | The 5-minute narrated walkthrough, the anomaly injection cue sheet, the fallback script if something breaks live, README for judges | `demo/script.md`, `demo/cue_sheet.md`, `demo/fallback.md`, `README.md` | Two clean dry-runs completed by hour 11. **HOUR 11.** |

### If you have 20 agents (split these)

- 6a Hephaestus, 6b Hermes, 6c Mnemos (split agent 6)
- 13a Tech PWA shell + voice, 13b Camera + AR (split agent 13)
- 14a Policy engine, 14b Telegram bot + HITL gateway (split agent 14)

### If you have 10 agents (fold these)

- Fold 15 (audit) into 2 (database) — same DB skillset
- Fold 16 (demo) into the team lead's role
- Fold 9 (manual RAG) into 7 (manual fetch) — same domain
- Fold 11 (onboarding screens) into 12 (command center) — same Next.js codebase

---

## 7. Dependency DAG (what blocks what)

```
HOUR 0 ──► START
            │
            ├──► Agent 1 (schemas)           ◄── EVERYONE WAITS FOR THIS
            ├──► Agent 16 (demo planning, can start in parallel)
            │
HOUR 1 ──► Agent 1 DELIVERS
            │
            ├──► Agent 2 (DB + seed)
            ├──► Agent 3 (telemetry gen) — needs only Redis from Agent 1
            ├──► Agent 7 (tag classification API) — can mock DB for now
            ├──► Agent 14a (policy engine)
            │
HOUR 2 ──► Agent 2 DELIVERS
            │
            ├──► Agent 4 (Sentinel) — needs DB hypertable + Redis
            ├──► Agent 5 (Triton + tech embeddings) — needs AGE schema + waits on Agent 17 forecaster
            ├──► Agent 8 (vision graph) — needs AGE schema + Qwen2.5-VL vLLM running
            ├──► Agent 9 (RAG ingestion) — needs pgvector schema
            ├──► Agent 15 (audit) — needs base tables
            ├──► Agent 17 (forecaster training) — needs seed telemetry from Agent 2
            │
HOUR 3 ──► Agents 3 + 17 DELIVER
            │
            ├──► Agent 4 can now consume real ticks
            ├──► Agent 5 can load forecaster artifacts
            │
HOUR 4 ──► Agents 4 + 7 DELIVER
            │
            ├──► Agent 6 (Hephaestus chain) — needs Triton + RAG
            ├──► Agent 11 (onboarding UI) — needs tag API
            │
HOUR 5 ──► Agents 5 + 9 DELIVER
            │
            └──► Agent 6 can complete the chain
            │
HOUR 6 ──► Agents 6 + 8 DELIVER
            │
            ├──► Agent 10 (MCP servers) — needs all underlying APIs
            ├──► Agent 14b (Telegram + HITL) — needs ProposedAction flowing
            ├──► Agent 12 (command center) — needs anomaly events live
            ├──► Agent 13 (PWA) — needs manual RAG + dispatch
            │
HOUR 7 ──► Agents 7-onboarding, 10, 15 DELIVER
            │
HOUR 8 ──► Agents 12, 13, 14 DELIVER  ◄── ALL COMPONENTS COMPLETE
            │
HOUR 8–10 ─► INTEGRATION + END-TO-END TESTS  ◄── NO NEW FEATURES PAST HOUR 9
            │
HOUR 10–11 ► DEMO POLISH + RECORDING BACKUP
            │
HOUR 11–12 ► TWO LIVE DRY RUNS
```

**Critical path:** Agent 1 → 2 → {17, 5} → 6 → 12. Anything on this path slipping puts the demo at risk. Pull help from non-critical agents if any of these slip by >30 min. **Agent 17 (forecaster training) joins the critical path because Agent 5/Triton blocks on its artifacts.**

---

## 8. Hour-by-hour timeline with hard cutoffs

| Hour | Milestone | Cutoff action if missed |
|---|---|---|
| 0 | All agents have read this doc and posted "READY" in `#atlas-roll-call` | Hold spin-up |
| 1 | Schemas merged. Repo skeleton pushed. | Pause non-foundation work |
| 2 | DB up, seed runs. **Qwen2.5-VL vLLM server up.** | Switch to in-memory fakes for downstream agents; vision falls back to Moondream2 CPU |
| 3 | Telemetry streaming. **Forecaster artifacts trained and saved.** | Hardcode synthetic ticks in Sentinel; Triton uses naive linear extrapolation as forecaster fallback |
| 4 | Sentinel publishing anomalies. Tag API live. | — |
| 5 | Triton publishing triage. RAG queryable. | Skip RAG in Hephaestus; use static manual citations |
| 6 | Full agent chain green. Vision graph endpoint works. | Pre-bake the dependency graph, skip vision live |
| 7 | MCP servers up. Onboarding UIs done. Audit ledger working. | Demo MCP via curl, skip Claude-desktop config |
| 8 | Command center, PWA, HITL gateway all live. | Pre-record PWA video as fallback |
| **9** | **FEATURE FREEZE.** | No exceptions. |
| 10 | First end-to-end dry run complete. | Identify the one breaking thing and fix |
| 11 | Demo script locked, second dry run complete. | — |
| 12 | DEMO. | — |

---

## 9. Mock data spec

### 9.1 The 50 seeded assets (in `db/seed.py`)

- **3 chillers** (CHILLER-A-01/02/03) — Carrier 30XA-1102, 1100kW each, critical
- **8 CRAH units** (CRAH-{A,B}-{01..04}) — Stulz CW-080, high
- **4 PDUs** (PDU-{A,B,C,D}) — Vertiv 250kVA, critical
- **2 UPS** (UPS-MAIN, UPS-BACKUP) — Eaton 9395, critical
- **6 GPU pods** (POD-{01..06}) — NVIDIA DGX H100, critical
- **2 switchgear** (SWG-MAIN, SWG-BACKUP) — Schneider Masterpact, critical
- **4 pumps** (PUMP-CHW-{01..04}) — Grundfos NK 100-200, high
- **3 AHUs** (AHU-{01..03}) — Trane M-Series, medium
- **8 generic sensors** (SENSOR-{01..08}) — Onset HOBO, low
- **10 humidity/temperature transmitters** (HTM-{01..10}) — Vaisala HMT330, low

### 9.2 Dependency graph (must be in seed)

```
SWG-MAIN ──FEEDS──► UPS-MAIN ──FEEDS──► PDU-A ──FEEDS──► POD-01, POD-02
                                       └──► PDU-B ──FEEDS──► POD-03, POD-04
SWG-BACKUP ──FEEDS──► UPS-BACKUP ──FEEDS──► PDU-C ──FEEDS──► POD-05
                                          └──► PDU-D ──FEEDS──► POD-06

CHILLER-A-01 ──FEEDS chilled water──► PUMP-CHW-01 ──FEEDS──► CRAH-A-01, CRAH-A-02
CHILLER-A-02 ──FEEDS chilled water──► PUMP-CHW-02 ──FEEDS──► CRAH-A-03, CRAH-A-04
CHILLER-A-03 ──FEEDS chilled water──► PUMP-CHW-03 ──FEEDS──► CRAH-B-01, CRAH-B-02
                                    └► PUMP-CHW-04 ──FEEDS──► CRAH-B-03, CRAH-B-04

ALL CRAH ──DEPENDS_ON──► POD-{matching row}  (cooling dependency)
```

**The demo anomaly:** CHILLER-A-03 supply temperature drifts up. Blast radius hits PUMP-CHW-03/04 → 8 CRAH units → POD-05 and POD-06 within 18 minutes. Six downstream nodes light up with countdowns. This matches the spec's "six downstream nodes flip color in sequence."

### 9.3 Pre-baked telemetry (30 days)

Owner: Agent 3. Patterns:
- Chiller supply temp: 44°F ± 1.5°F daily sinusoid, std ~0.8
- CRAH return temp: 75°F ± 2°F, std ~1.2
- PDU load: 65–80% sinusoid following workload pattern
- All metrics have realistic correlated noise. Pre-compute baselines so Sentinel doesn't need 30 days to warm up.

### 9.4 The 8 technicians

Mix of certifications, locations, and skill sets. Two should be perfect-fit for the chiller incident; the MILP picks one because the other is in another job. Detail in `db/seed.py` — Agent 5 owns the embedding text.

### 9.5 The 3 manuals

- Carrier 30XA chiller service manual (real PDF, ~200 pages)
- Stulz CW-series CRAH manual
- Vertiv Liebert PDU manual

Put PDFs in `/seed/manuals/`. Agent 9 ingests on `make seed`.

### 9.6 The 1 facility PDF for vision parsing

Hand-draw a fake one-line + floor plan in Excalidraw or steal a generic public one. Must contain enough labeled assets that Claude vision can extract ≥10 nodes. Owner: Agent 16 produces this in hour 1.

---

## 10. Demo script (5 minutes — owned by Agent 16, locked at hour 10)

Each section is ~50 seconds. Voiceover scripted in `demo/script.md`. **Anomaly is injected at second 90 via cue sheet.**

| Time | Surface | Voiceover beat |
|---|---|---|
| 0:00–0:30 | Title + ROI slide | "One data center outage runs $1M–$9M per hour. Atlas is the OS that prevents it." |
| 0:30–1:00 | `/onboard/tags` | "Step one: factory tags are cryptic. Atlas classifies them with confidence. Workers only touch the ambiguous 10%." Click through 3 ambiguous ones. |
| 1:00–1:30 | `/onboard/floorplan` + `/admin/policies` | "Upload the facility PDF — local vision model parses it into a dependency graph. Workers confirm — they don't draw from scratch." Then quick-flash: "Pick a policy template — conservative, balanced, aggressive. Customer doesn't write YAML." |
| 1:30–2:15 | `/command` (silent at first) | "Atlas is live. Pre-trained on 30 days of synthetic telemetry — in production, this is a 2–4 week shadow period that earns trust." [ANOMALY FIRES] "Chiller A-03 starts drifting. Sentinel catches it at z=4.2." |
| 2:15–3:00 | `/command` cascade + forecast panel | "Triton runs the LightGBM quantile forecaster — q50 crosses the failure threshold in 18 minutes, q95 at 11. Tight prediction interval, high confidence. Six downstream assets affected. Watch them light up." |
| 3:00–3:45 | Telegram | "Hephaestus proposes dispatch. Per the balanced policy, this requires approval. Telegram bot fires; on-call engineer sees the full reasoning trace + the forecast bands." [Tap Approve] "Hermes picks the optimal tech — RAG narrowed 5000 candidates to 15, MILP proved this is the best by 7 minutes." |
| 3:45–4:30 | `/tech` PWA | "Technician on site. Voice walks them through. Camera identifies the chiller. Hands-free logging. This module was already production-tested from our previous build — integration was a day." |
| 4:30–5:00 | MCP demo + close | Open external client, ask "what's happening at the data center" — it calls `mcp_telemetry.list_anomalies`, `mcp_graph.blast_radius`. "Every Atlas capability is exposed as MCP. Your agents can run the data center." |

**Recorded backup:** every surface gets a 30-second screen recording stored in `demo/backup/`. If something breaks live, switch to video; voiceover continues unchanged.

---

## 11. Cut list (drop in this order if we slip)

Pre-decided. If you hit hour 9 and something isn't ready, look here. Do not improvise.

1. **First cut: Nightly forecaster retrain.** Mnemos captures training tuples and shows the UI toast; skip the actual LightGBM retrain. Voiceover covers it.
2. **Second cut: Compliance PDF generation.** Show the template, skip the live generation.
3. **Third cut: Live MCP from external client.** Demo MCP via a curl script instead. Show the config but don't connect live.
4. **Fourth cut: Perplexity manual lookup.** Manuals are pre-uploaded only.
5. **Fifth cut: Vision graph live parsing.** Floor plan shows a pre-baked graph; voiceover says "we parsed this from the uploaded PDF" and shows a recording. (Fallback if Qwen vLLM unstable.)
6. **Sixth cut: Live quantile forecast.** Triton returns pre-computed q05/q50/q95 trajectories instead of running the LightGBM inference live. (Fallback if Agent 17 slips.)
7. **Seventh cut: Telegram round-trip.** HITL approval happens in-app via a button instead of Telegram.
8. **DO NOT CUT:** anomaly → cascade → action → dispatch → tech PWA chain. That's the demo. **Also do not cut: the forecaster + uncertainty story** — it's the most credible technical moment for judges.

---

## 12. Risks and what to do about them

| Risk | Likelihood | Mitigation |
|---|---|---|
| Apache AGE setup eats 2 hours | High | Agent 2 starts with AGE in hour 0; if not working by hour 2, fall back to plain SQL recursive CTE for blast radius and voiceover the graph DB |
| Qwen2.5-VL vLLM unstable on demo hardware | High | Pre-test on the actual demo machine in hour 0; Moondream2 CPU fallback ready in `services/vision/parse_pdf.py`; pre-baked graph as last resort |
| Vision misreads the facility PDF | Medium | Agent 16 hand-picks a clean PDF in hour 1 (high contrast, labeled boxes); Agent 8 has a pre-baked graph as fallback |
| LightGBM training takes longer than expected | Low | Agent 17 uses small `num_leaves`, 100 iterations max for demo; pre-computed quantile trajectories cached if training fails |
| Telegram bot delivery delayed | Low | Use webhook not polling; have an in-app approve button as immediate fallback |
| PuLP CBC not installed cleanly | Low | `pip install pulp` ships CBC; if it fails, Hermes returns RAG top-1 with a "MILP unavailable" flag |
| Mapbox token quota | Low | Use a fresh token; have a Leaflet fallback ready in Agent 12's branch |
| LLM API rate limit (whichever backend) | Medium | Cache classification results in dev; batch tag classification; adapter has retry+backoff built in |
| Pre-built PWA integration breaks | Medium | Agent 13 starts in hour 2 with the integration smoke test; if framework mismatch (Vite vs Next.js, etc.), wrap as iframe |
| **Demo PC dies** | Low | Run demo from two laptops, one hot-standby with the same state |

---

## 13. What to do RIGHT NOW

If you are Agent 1 → start `shared/schemas.py` and `shared/llm.py`. Copy §4 and §4.1 verbatim. Stub two backends (OpenAI + Anthropic) behind the adapter with the same interface. Push to `main` by hour 1.

If you are Agent 2 → set up Supabase project, enable AGE + TimescaleDB + pgvector extensions, write migration files. Don't wait for schemas — you know the table names from §2.4.

If you are Agent 3 → start the telemetry pattern functions. You only need Redis from Agent 1.

If you are Agent 17 → drop the user's existing LightGBM forecaster code into `vendored/forecaster/` as-is. Write the feature builder + training driver. Wait on Agent 2 for seed telemetry, train hour 1–3, save artifacts to `models/triton/`. This is on the critical path — Agent 5 cannot proceed until you ship.

If you are Agent 8 → start the vLLM startup script for Qwen2.5-VL-7B in hour 0; PDF rasterization can start with stub vision returns; integrate when vLLM is up.

If you are Agent 16 → write the voiceover draft, source the facility PDF, prep the demo cue sheet. Pre-test the demo machine for GPU availability (drives vision and forecaster decisions).

Everyone else → read this doc end to end, then read your assignment row in §6, then read your contract in §4, then post READY in `#atlas-roll-call`. Do not start coding until your blockers in §7 are green.

**One last thing:** if a judge asks "did you really build all this in 12 hours?" — yes, because the architecture was locked before anyone wrote a line of code. That's this document. Don't deviate from it under demo-day pressure.

— End of coordination doc —
