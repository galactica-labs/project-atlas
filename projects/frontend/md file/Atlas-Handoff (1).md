# ATLAS — Handoff Document

> Mission-critical infrastructure OS for AI-era data centers. This document captures the deployment flow, business narrative, and full technical implementation plan for the hackathon build and the v1 production path.

---

## Part 1 — Business Flow (Sequential)

How the app processes a customer from install through continuous operation.

1. Atlas team installs an edge gateway inside the customer's facility.
2. Gateway connects to the customer's BMS/SCADA and pulls every telemetry tag.
3. Atlas suggests what each cryptic tag means; factory workers confirm or correct.
4. Workers place each asset on the facility floor plan at its real location.
5. Workers draw dependency lines — which asset powers, cools, or feeds which.
6. Workers upload service manuals, SOPs, and safety documents.
7. Workers set criticality levels and SLA contracts per asset.
8. Customer reviews default safety policies and edits which actions need human approval.
9. Atlas runs silently for 2–4 weeks learning normal behavior for every asset.
10. Operators review the would-be alerts during this period and tune thresholds.
11. Atlas goes live — telemetry streams in continuously, predictions update in real time.
12. An asset starts drifting outside its normal pattern.
13. Atlas predicts time-to-failure and computes which downstream assets get hit and when.
14. The blast radius lights up the floor plan with countdowns.
15. Atlas decides on an action — repair, dispatch, shutdown, or wait.
16. If the action is risky, it pauses and asks the right human via Telegram/Slack.
17. The human approves, rejects, or modifies — with a mandatory reason for any change.
18. Atlas dispatches the optimal technician — math-proven to have the certifications, parts, and SLA window.
19. Technician arrives, opens the PWA, points the camera at the asset.
20. Camera identifies the equipment and verifies it's safe to work on.
21. Voice guides the tech step by step; tech logs actions hands-free.
22. Any risky step (bypass, override) round-trips an approval without blocking inspection.
23. Tech closes the work order; root cause and parts used are logged.
24. Atlas extracts the full incident as a labeled training example.
25. Overnight, the local model retrains on accumulated incidents.
26. Anonymized failure patterns get shared to the federated registry.
27. Every other Atlas deployment gets smarter from this incident.
28. Compliance reports auto-generate monthly from the audit ledger.

---

## Part 2 — Technical Flow (By Deployment Phase)

What to build at each stage, with the exact tech stack per task.

### Phase 0 — Site install and secure ingress

Install an edge gateway on the customer's network. Use a small Linux VM or physical box running a Python service that speaks industrial protocols locally. Open one outbound tunnel to Atlas cloud — WireGuard or Tailscale. Wire SSO to the customer's identity provider via SAML or OIDC. Define RBAC roles (technician, supervisor, ops manager, site director, auditor) in Supabase Auth. Write the genesis hash of the audit ledger to Postgres.

**Hackathon scope:** skip this — mention it in your voiceover.

**Tech:** Linux VM, WireGuard/Tailscale, SAML/OIDC, Supabase Auth, PostgreSQL.

### Phase 1 — Brain connection and tag discovery

Build protocol adapter modules in Python. Use `BAC0` for BACnet/IP, `pymodbus` for Modbus TCP, `asyncua` for OPC-UA, `pysnmp` for SNMP. The adapter discovers points and streams them into a Redis queue. A FastAPI endpoint receives the raw tag list, passes it to Claude (`claude-sonnet-4-5`) with a few-shot prompt and your asset-type taxonomy. Claude proposes asset type + metric + unit per tag. Build a Next.js review screen where workers confirm or correct. Save mappings to a `tag_mappings` table in Postgres.

**Hackathon scope:** replace the adapter with a synthetic telemetry generator — Python script writing realistic HVAC patterns to Redis on a 1-second tick.

**Reducing human burden:** Claude assigns a confidence score per tag suggestion. Auto-accept anything above ~0.9 with a "flag for review" option — workers only touch the ambiguous 10–20%. Pre-train on standard BACnet/Modbus point-name conventions (consistent across vendors for HVAC) so most tags map themselves. Cuts labeling time by roughly an order of magnitude.

**Tech:** Python, `BAC0`, `pymodbus`, `asyncua`, `pysnmp`, Redis, FastAPI, Claude Sonnet 4.5 via Anthropic API, Next.js, PostgreSQL.

### Phase 2 — Hierarchy, dependencies, manuals

Set up PostgreSQL with Apache AGE extension on Supabase. Create your node tables (`assets`, `spatial_units`, `technicians`, `part_skus`, `manual_sections`, `slas`, `failure_modes`, `maintenance_events`) and AGE graph schema with edge types (`FEEDS`, `DEPENDS_ON`, `CONTAINED_IN`, `COMPATIBLE_WITH`, `GOVERNED_BY`, `EXHIBITS`, `RESOLVED_BY`).

Build the asset placement UI in Next.js with Mapbox GL JS — drag assets onto the floor plan, snap to grid, persist coordinates. Build the dependency editor as a node-and-edge canvas using React Flow. Each `FEEDS` or `DEPENDS_ON` edge writes a Cypher `CREATE` into AGE.

For manuals: upload to Cloudflare R2, parse with `pypdf` and `unstructured.io`, chunk at section boundaries (~500 tokens with 100-token overlap), embed with OpenAI `text-embedding-3-small` or Voyage AI's domain models, store vectors in pgvector. Link each chunk to a `ManualSection` node connected to the relevant asset model.

Load the policy YAML into a `policies` table. Build a simple admin UI to edit the YAML — Monaco editor with schema validation. Ship a library of pre-built policy templates by industry (data center, semiconductor fab, pharma) and risk profile (conservative / balanced / aggressive) so customers pick a template and tweak rather than writing YAML from scratch — Monaco stays for power users.

**Reducing human burden:**
- **Dependency drawing** is the biggest hidden cost. Two automations: (a) infer dependencies from electrical panel schedules and P&ID drawings using Claude vision — most facilities have these PDFs already; auto-propose the graph, humans only confirm. (b) infer dependencies from telemetry correlations during the shadow period — assets whose readings move together are almost certainly coupled. Propose the graph, let humans prune.
- **Manuals** auto-ingest: workers photograph each asset's nameplate during placement, Claude vision reads the model number, the system fetches and ingests the manufacturer's service docs automatically. Worker effort drops to "take a photo."

**Tech:** PostgreSQL + Apache AGE, Supabase, Next.js, Mapbox GL JS, React Flow, Cloudflare R2, `pypdf`, `unstructured.io`, OpenAI embeddings (or Voyage AI), pgvector, Monaco editor.

### Phase 3 — Baseline calibration (shadow mode)

Add TimescaleDB extension to Postgres, create a hypertable for telemetry partitioned by day. Run a Celery beat job every minute that pulls the last hour of data per asset per metric, computes rolling mean and standard deviation with `scipy.stats`, writes to a `baselines` table.

Build the Sentinel agent. MVP scorer is a z-score function: `(current - baseline_mean) / baseline_std`. Wrap it in the `AnomalySignal` dataclass from the blueprint. Run it on a Celery worker against incoming telemetry.

For shadow mode: route Sentinel output to a `shadow_alerts` table and a review queue in the command center, not to Triton. Operators mark each as true/false positive; this data feeds threshold tuning.

**Hackathon scope:** run the calibration step in fast-forward — generate 30 days of synthetic data in advance and pre-load baselines.

**Reducing human burden:**
- **Shorten calibration.** 4 weeks is conservative. For many asset classes, 7–10 days of clean data plus the federated baseline from similar assets at other sites gets to acceptable confidence. Frame it as "2 weeks to go live in supervised mode, full autonomy at 4 weeks" — faster perceived time-to-value.
- **Active-learning threshold tuning.** Instead of operators marking every shadow alert true/false, only surface alerts where the model is uncertain (nearest the decision boundary). Operators label ~20 alerts instead of 2,000, and the model learns just as fast.

**Tech:** TimescaleDB, Celery + Redis, `scipy.stats`, Python dataclasses (Pydantic), FastAPI.

### Phase 4 — Live operations

Wire the agent pipeline: Sentinel → Triton → Hephaestus → Hermes. Each agent is a FastAPI endpoint or Celery task that takes a typed input and produces a typed output (use Pydantic models).

Build the MCP servers with FastMCP. One per concern: `mcp_telemetry`, `mcp_graph`, `mcp_parts`, `mcp_history`, `mcp_dispatch`. Each exposes typed tools the agents can call. All agents use `claude-sonnet-4-5` via the Anthropic API with tool calling.

Triton's blast radius computation is a Cypher query against AGE — traverse outgoing `FEEDS` and `DEPENDS_ON` edges up to 3 hops, return ordered list with cumulative impact time.

Hermes uses PuLP with the CBC solver. Encode the MILP from the blueprint — objective minimizes weighted dispatch delay plus travel cost plus skill mismatch; hard constraints on certifications, workload, SLA window, parts availability. Solve in under 2 seconds for the demo.

The policy engine is a Python module that evaluates each proposed action against the YAML rules — checks `action_tags`, `asset_criticality`, `agent_confidence`. If any rule fires, the action is paused.

HITL Gateway: Azure Durable Functions using the Human Interaction pattern. The orchestrator function suspends with `WaitForExternalEvent`, sends the approval payload (full reasoning trace, recommended action, alternatives, blast radius) to a Telegram bot via the bot API. The bot's inline keyboard buttons trigger an HTTP callback that resumes the orchestration with the signed decision.

Audit ledger: append-only `audit_records` table, every insert computes `sha256(payload + previous_hash)` via a Postgres trigger. Verification job runs hourly to detect tampering.

Command center: Next.js page with Mapbox floor plan. WebSocket client subscribes to Redis pub/sub channels (`anomaly_events`, `dispatch_events`, `hitl_pending`). Live asset color updates from current graph state. Cascade animation when blast radius arrives — six downstream nodes flip color in sequence with countdown overlays.

**Reducing human burden (HITL fatigue is the long-term killer):**
- **Decision memory.** When a human approves the same kind of action 5 times with the same reasoning, Atlas proposes promoting it to auto-approved under those specific conditions. The promotion itself is a HITL approval — humans control the autonomy boundary, but the boundary expands over time without re-litigation.
- **Batched approvals.** Low-stakes actions consolidate into one digest at shift change with bulk approve/reject, replacing 40 interruptions a day with one focused review.

**Tech:** FastAPI, Pydantic, FastMCP, Claude Sonnet 4.5, Apache AGE (Cypher), PuLP + CBC solver, Azure Durable Functions, Telegram Bot API, PostgreSQL triggers, Next.js, Mapbox GL JS, Redis pub/sub, WebSockets.

### Phase 5 — Technician execution

PWA built into the same Next.js app with a separate route and service worker config. Voice interface uses OpenAI Realtime API over WebRTC — set `turn_detection: server_vad` with `threshold: 0.8` for high noise environments. Push-to-talk fallback uses `MediaRecorder` API. Apply `noiseSuppression: true` and `echoCancellation: true` in `getUserMedia` constraints.

The voice handler is a Realtime API session with function calling configured. Functions match the command categories — `start_job`, `next_step`, `pull_manual`, `log_action`, `escalate`, `close_job`. Each function call hits a FastAPI endpoint that updates work order state and queries the manual RAG.

Manual RAG retrieval: embed the technician's query, pgvector similarity search against `ManualSection` chunks scoped to the current asset model, return top 5, rerank with Claude.

Camera/AR guidance: drop in the existing project. Wire the work order context (asset ID, current step, expected part) into the camera component as initial state. The camera feed runs frame analysis at ~2fps — for the hackathon, send sampled frames to Claude with vision for asset identification, panel state verification, and part number OCR.

HITL approvals from the field route through the same Durable Functions gateway. The tech sees a "waiting for approval" indicator but the voice and camera flows continue with non-blocking steps (inspection, photo documentation) while the approval resolves.

**Tech:** Next.js PWA, OpenAI Realtime API, WebRTC, `MediaRecorder` API, FastAPI, pgvector, Claude Sonnet 4.5 (with vision), reused camera/AR module from previous project.

### Phase 6 — Mnemos learning and federated contribution

When a work order closes, a Celery task extracts the labeled tuple: 48-hour telemetry window before the anomaly, full `AnomalySignal` and `TriageReport`, dispatched technician's confirmed root cause, parts consumed, every HITL decision with notes, final outcome. Write to a `training_tuples` table.

Nightly Celery beat job triggers retraining. MVP retrains the z-score baseline weights. V1 retrains Isolation Forest with scikit-learn. V2 retrains LightGBM with MAPIE conformal calibration. The trained model artifact gets versioned in a `model_registry` table and hot-swapped into Sentinel.

Federated contribution: a separate job strips PII and identifiers from training tuples, extracts only the failure signature (telemetry pattern + asset type + root cause class), and POSTs to the central registry. The registry merges signatures across customers and serves a global model that local Sentinels pull nightly.

SLA monitor: Celery beat job runs every minute, scans open work orders, computes time-to-breach, escalates via notification adapter when crossing 75% and 90% thresholds.

Compliance reporting: monthly Celery job queries the audit ledger, formats against ISO 55000 / NERC CIP / SEMI S2 templates, generates PDF via WeasyPrint, drops into Cloudflare R2, emails the customer.

**Tech:** Celery beat, scikit-learn (Isolation Forest), LightGBM + MAPIE (v2), PostgreSQL model registry, WeasyPrint, Cloudflare R2, SMTP/SendGrid for delivery.

---

## Part 3 — Consolidated Tech Stack

### Frontend
- Next.js 14 + TypeScript + Tailwind CSS
- Mapbox GL JS (floor plan rendering)
- React Flow (dependency editor)
- Monaco editor (policy YAML editing)
- WebSocket client (live telemetry updates)
- PWA service worker (technician mobile)
- WebRTC + `MediaRecorder` (voice + camera)
- Vercel (hosting)

### Backend
- FastAPI (Python 3.11)
- Pydantic (typed I/O contracts)
- Celery + Redis (background jobs, pub/sub)
- FastMCP (MCP server implementations)
- Render or Railway (hosting)

### Data
- PostgreSQL with Apache AGE (graph queries via Cypher)
- TimescaleDB extension (time-series telemetry)
- pgvector (manual embeddings)
- Supabase (hosted Postgres + Auth + Storage)
- Cloudflare R2 (manuals, reports, blobs)

### Industrial protocols
- `BAC0` (BACnet/IP)
- `pymodbus` (Modbus TCP)
- `asyncua` (OPC-UA)
- `pysnmp` (SNMP)

### AI / ML
- Claude Sonnet 4.5 (`claude-sonnet-4-5`) via Anthropic API — all five reasoning agents (Sentinel, Triton, Hephaestus, Hermes, Mnemos) and vision frame analysis
- OpenAI Realtime API (voice interface)
- OpenAI `text-embedding-3-small` or Voyage AI (manual embeddings)
- `scipy.stats` (z-score, MVP)
- scikit-learn Isolation Forest (v1)
- LightGBM + MAPIE conformal calibration (v2)

### Solvers / Math
- PuLP + CBC (Hermes dispatch MILP)

### Orchestration / Governance
- Azure Durable Functions (HITL Gateway)
- Telegram Bot API (MVP approval channel; Slack/Teams/PagerDuty later)
- PostgreSQL triggers (hash-chained audit ledger)

### Document processing
- `pypdf` + `unstructured.io` (manual parsing)
- WeasyPrint (compliance reports)

### Infrastructure
- WireGuard or Tailscale (edge tunnel)
- SAML/OIDC (SSO bootstrap)
- Supabase Auth (RBAC)

---

## Part 4 — Hackathon Demo Scope

What ships in 48 hours:

- 50 seeded assets in a single simulated data center
- Synthetic telemetry generator producing realistic HVAC anomaly patterns
- Z-score anomaly detection with configurable thresholds (real, not mocked)
- Triton agent with Claude Sonnet 4.5 + MCP tool access
- Hermes dispatch with real MILP solver (PuLP + CBC)
- Azure Durable Functions HITL Gateway with Telegram approvals
- Mapbox command center with live cascade visualization
- Technician PWA with voice (OpenAI Realtime) + reused camera/AR module
- Manual RAG over 3 seeded HVAC service documents
- Hash-chained audit ledger
- Mnemos labeled tuple capture (display only, no retraining loop live)

What is implicit (covered in voiceover):

- Phase 0 install and SSO bootstrap
- Phase 1 BMS adapter and tag classification
- Phase 3 baseline calibration (pre-seeded with 30 days of synthetic history)
- Phase 6 nightly retraining and federated contribution

Honest framing for technical Q&A: the prediction interface is designed so the calibrated LightGBM model drops in as a direct replacement for the z-score scorer — same input schema, same output contract. The hackathon uses statistical threshold detection on synthetic telemetry to focus build time on the orchestration, voice, and governance layers that are architecturally novel.

---

## Part 5 — ROI Narrative and Objection Handling

The objection to expect: "This requires weeks of setup, tag labeling, dependency mapping, manual uploads, and 4 weeks of shadow-mode tuning — plus a recurring subscription. Why would any facility take that on?"

The pitch must reframe upfront effort as value, not cost.

### The core economic argument

A single hyperscale AI data center outage runs $1M–$9M per hour (Uptime Institute). A chiller failure cascading to a GPU pod can take 6+ hours to recover. **One prevented incident pays for years of Atlas. Everything after that is margin.**

The customer is *already* paying for this problem invisibly:
- **Over-provisioned redundancy** — N+2 instead of N+1 because they don't trust their predictions
- **Conservative maintenance** — replacing healthy parts on a fixed schedule because they can't tell which are actually failing
- **SLA penalties** when something slips through
- **Insurance premiums** priced for opacity
- **Senior engineer hours** triaging alerts a system should triage

Atlas converts those hidden costs into a measurable line item, then shrinks it.

### Reframing each "cost" as a feature

**The 4-week shadow period is not a tax — it's how Atlas earns the right to act autonomously.** An AI system that takes actions on day one with no site-specific grounding is exactly what ops directors refuse to buy. The shadow period is the trust-building mechanism. It's a selling point, not an apology.

**The tag-labeling work is institutional memory capture.** The customer's tags are currently understood by three people, two close to retirement. Atlas is the first time that knowledge gets structured, queryable, and transferable. We're not asking the customer to do work for us — we're giving them a knowledge asset they don't currently have. When the senior tech retires, the tag mappings stay.

**The dependency mapping is documentation they were going to need anyway.** Every facility audit, every insurance review, every compliance certification requires this graph. Most facilities maintain it badly in scattered Visio files. Atlas produces it as a live, queryable artifact.

**The federated learning is a network effect they only get by joining.** Every Atlas customer's deployment gets smarter from every other customer's incidents. A customer joining in year two inherits failure signatures from 50 facilities they never had to experience. Not joining means paying full tuition on every failure mode.

### One-line pitch sentence

> "The setup isn't overhead — it's the customer encoding tribal knowledge they're about to lose, and earning an autonomous system they can actually trust. One prevented outage pays for a decade of Atlas."

### Suggested ROI slide structure

1. **Cost of an outage** — Uptime Institute number, framed against the customer's specific workload (training run, inference fleet, HFT, etc.)
2. **Hidden costs today** — the five-bullet list above, with industry benchmarks where available
3. **Atlas investment** — honest numbers: setup hours, calibration period, subscription cost
4. **Payback math** — break-even is one prevented incident; everything after is pure margin
5. **The network effect** — graph showing federated learning value compounding with each new deployment
