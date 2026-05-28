# atlas_ml

The Atlas reasoning chain in Python: **Sentinel** (z-score) → **Triton** (forecast +
blast radius + narrative) → **Hephaestus** (action decision + manual RAG) → **policy engine**
(YAML, sets HITL) → **HITL gateway + Telegram** (human approve/reject) → **Hermes** (RAG→MILP
dispatch) → **Mnemos** (training capture).
Forecaster vendored from the renewable-energy LightGBM quantile model; electricity
features swapped for asset telemetry. Contracts in `atlas_ml/schemas.py` (coordination doc §4).
LLM + embeddings go through `atlas_ml/llm.py` (offline deterministic fallback, no keys needed).

Package layout maps to the doc's `agents/{sentinel,triton,hermes,mnemos}/`.

## Run

```bash
pip install -r requirements.txt          # lightgbm + pulp optional; fallbacks engage if absent
python scripts/train_forecaster.py        # train per (asset_type,metric) from synthetic seed
python scripts/smoke.py                   # full chain: drift -> Sentinel -> Triton -> policy/HITL -> Hermes -> Mnemos
python scripts/mcp_check.py               # invoke all 5 MCP servers' tools in-process
python scripts/audit_check.py             # hash chain: build, verify, tamper, re-verify, report
python -m atlas_ml.mcp_servers.telemetry  # run one MCP server over stdio (also: graph|parts|history|dispatch)
```

## Integration points

- **Sentinel (Agent 4):** `Sentinel(seeds=...).tick(asset_id, metric, value)` -> `AnomalySignal | None`.
  Warm-start `seeds={(asset_id,metric):(mean,std)}` from the 30-day seed. Publish result to Redis `anomaly_events`.
- **Triton forecaster (Agent 5):** `QuantileForecaster.load("models/triton/{asset_type}_{metric}")`,
  then `forecast(qf, window, metric, threshold, threshold_direction=...)` -> `QuantileForecast`.
  `remaining_useful_life(qf)` gives pessimistic/expected/optimistic RUL seconds. `forecaster=None` -> naive linear fallback.
- **Triton (Agent 5):** `Triton(TritonForecaster(...)).triage(signal, window)` -> `TriageReport`
  (forecast + blast radius + LLM-narrated hypothesis; confidence from band width). `TritonService`
  in `triton/main.py` is the Redis `anomaly_events` -> `triage_events` loop. Graph/thresholds from
  `atlas_ml/assets.py` (swap for Apache AGE Cypher when the DB lands).
- **Hephaestus (Agent 6A):** `Hephaestus().propose(triage, asset_id)` -> `ProposedAction`
  (action_type by transparent rules from failure mode + urgency + confidence; LLM rationale; manual
  citations via `atlas_ml/rag.py` `ManualRAG`, a stand-in for Agent 9's pgvector ingestion).
  `HephaestusService().handle(triage, asset_id)` also runs the policy engine and returns
  `(action, PolicyDecision)`.
- **Policy engine (Agent 14A):** `PolicyEngine.from_template("data_center_balanced")` then
  `.apply(action, triage)` -> `(action, PolicyDecision)`. Matches action_type / action_tags /
  asset_criticality / agent_confidence / uncertainty_band_width; first matching rule wins; safe
  default is require_approval. Three templates ship in `templates/policies/` (conservative / balanced /
  aggressive, verbatim from §5.5). `PolicyDecision.requires_approval` gates the HITL handoff.
- **HITL gateway + Telegram (Agent 14B):** `HITLGateway(notifier=TelegramBot(), on_resolved=cb)`.
  `submit(action, triage, dispatch)` parks an `ApprovalRequest` and fires the notifier (inline
  Approve/Reject keyboard; offline-prints with no token). `TelegramBot.handle_callback(update, gateway)`
  resolves from the real webhook; `simulate_decision(...)` is the in-app-button / demo path. `resolve()`
  signs an HMAC `ApprovalDecision` (for the audit ledger) and runs `on_resolved` to resume the chain.
  Pending state is in-memory; swap for Redis `hitl_pending`. HMAC secret: `ATLAS_HITL_SECRET`;
  Telegram: `ATLAS_TELEGRAM_TOKEN`, `ATLAS_TELEGRAM_CHATS`.
- **Hermes (Agent 6B):** `Hermes(roster).dispatch(action, triage, incident_at=...)` -> `Dispatch`.
  Stage 1 RAG cosine shortlist over tech profile embeddings; stage 2 MILP (PuLP+CBC, greedy fallback)
  with hard constraints (certs, availability, shift covers SLA, parts) + cost objective; stage 3 LLM
  explanation. Roster in `atlas_ml/technicians.py`, job requirements in `hermes/requirements_map.py`
  (swap for `technicians`/`tech_embeddings` tables when the DB lands).
- **Mnemos (Agent 6C):** `Mnemos(on_toast=...).on_work_order_close(...)` writes a `TrainingTuple` to the
  JSONL corpus and fires the UI toast. `TupleStore.failure_patterns()` aggregates human/failure signal.
  No live retrain (cut-list #1); swap `TupleStore` for the Postgres `training_tuples` table when Agent 2's DB is up.
- **MCP servers (Agent 10):** five FastMCP servers in `atlas_ml/mcp_servers/` — `telemetry`
  (`get_current`, `get_window`, `list_anomalies`), `graph` (`get_asset`, `blast_radius`,
  `dependencies_of`, `dependents_of`), `parts` (`check_stock`, `nearest_warehouse`,
  `compatible_parts`), `history` (`past_incidents`, `similar_failures`, `tech_history`),
  `dispatch` (`propose_dispatch` runs Hermes, `confirm_dispatch`, `create_ticket`). This is the
  public API surface (demo moment 6). Register with Claude Desktop via
  `atlas_ml/mcp_servers/claude_desktop_config.json`. Backends in `mcp_servers/backends.py` synthesize
  from catalog/corpus until Redis/Timescale/Postgres are up.
- **Audit ledger (Agent 15):** `AuditLedger().append(actor, action, payload)` writes a tamper-evident
  hash-chained record (`hash = sha256(prev_hash + canonical_body)`, no blockchain). `verify_chain()`
  recomputes every link and flags `tampered` / `broken_link` / `bad_sequence`. `compliance_report()`
  writes a 1-pager HTML (PDF when WeasyPrint installed — cut-list #2). `audit/audit_trigger.sql` is the
  production Postgres equivalent (BEFORE INSERT trigger + append-only guard + `verify_audit_chain()`).
  Append-only JSONL now; swap for the `audit_records` table when the DB lands.
