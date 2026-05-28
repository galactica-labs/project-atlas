# Atlas: Multi-Agent Industrial Monitoring, Reasoning, & Dispatch Platform

Atlas is a state-of-the-art, multi-agent industrial monitoring, reasoning, decision-making, and automated dispatch/compliance platform. It bridges a modern visual operations dashboard, an enterprise orchestration layer, and a Python-based reasoning engine powered by specialized artificial intelligence agents.

---

## 🏗️ System Architecture & Scope

Atlas is organized as an **Nx monorepo** managed with **Bun**, partitioning responsibilities into three major tiers:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Vite & React 19 Frontend                        │
│     (Mapbox Spatial, 3D R3F Model, XYFlow Graph, Incident Control)     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    │ Type-Safe API Calls (@atlas/api-client)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        NestJS v11 API Gateway                          │
│     (Drizzle ORM, Component Ingestion, RAG Doc Search, Proxy Layer)    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    │ HTTP API Proxying (PipelineService)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     Python: atlas_ml FastAPI Engine                    │
│                                                                        │
│  Telemetry Drift ────► Anomaly Alerts ────► Quantile Forecasting       │
│  (Sentinel, Agt 4)      (z-score)           (Triton, Agt 5 - RUL)      │
│                                                     │                  │
│                                                     ▼                  │
│  Technician Dispatch ◄─── Policy Rules ◄──── Action Recommendations     │
│  (Hermes, Agt 6B-MILP)   (Engine, Agt 14A)   (Hephaestus, Agt 6A-RAG)  │
│          │                                                             │
│          ▼                                                             │
│  Human-in-the-Loop ────► Cryptographic Ledgers ────► Loop Feedback     │
│  (HITL Gateway, 14B)     (Audit Chain, Agt 15)       (Mnemos, Agt 6C)  │
└────────────────────────────────────────────────────────────────────────┘
```

### 1. Presentation Layer (`projects/frontend`)
*   **Technologies:** Vite, React 19, TypeScript, Tailwind CSS, Shadcn, Framer Motion, Playwright.
*   **Key Features:**
    *   **Geospatial Tracking:** Visualizes facility locations and asset maps in real time via **Mapbox GL**.
    *   **3D Telemetry:** Renders detailed interactive 3D digital-twin equipment models using **React Three Fiber (R3F) and @react-three/drei**.
    *   **Topological Dependency Graphs:** Displays system dependency lines, logical paths, and cascade impact projections using **XYFlow (@xyflow/react)**.
    *   **Incident Lifecycle Control:** Operates anomaly simulators, views triages, displays policy effects, controls dispatches, and processes supervisor approvals.

### 2. Orchestration & Coordination Layer (`projects/backend` & `packages/`)
*   **Technologies:** NestJS 11, Drizzle ORM, OpenAPI/Swagger, Scalar API Reference, PostgreSQL.
*   **Key Features:**
    *   **Database Ingestion & Schema:** Manages structural asset records, component catalogs, and batch ingestions under a PostgreSQL container via **Drizzle ORM**.
    *   **Technician Assistance RAG:** Implements a document text generator, embeddings encoder, and manual task RAG pipeline (`technician-assist`) over facility guides.
    *   **Type-Safe Interfaces:** Exposes shared API schema packages:
        *   `@atlas/api-types` (`packages/api-types`): Shared type schemas auto-generated from OpenAPI via `openapi-typescript`.
        *   `@atlas/api-client` (`packages/api-client`): Lightweight, fully typed HTTP Client wrapping `openapi-fetch`.

### 3. Reasoning & Machine Learning Engine (`python/atlas_ml`)
*   **Technologies:** Python, FastAPI, LightGBM (Quantile Forecasting), FastMCP, PuLP/CBC.
*   **Key Features:** Orchestrates the multi-agent incident management lifecycle via standard HTTP endpoints and 5 unified Model Context Protocol (MCP) servers.

---

## 🤖 The Multi-Agent Reasoning Chain

When industrial telemetry drifts, Atlas triggers a deterministic, chain-linked multi-agent pipeline:

1.  **Sentinel (Agent 4) — Telemetry Drift Detection:** Monitors streaming asset metrics (e.g., temperatures, voltages). Computes continuous statistical z-scores against 30-day baseline distributions and fires `critical` anomaly signals.
2.  **Triton (Agent 5) — Quantile Forecaster & Blast Radius:** Loads LightGBM quantile regression models to estimate Remaining Useful Life (RUL) with confidence bands. Conducts dependency tree parsing to calculate blast radius impact on downstream hardware.
3.  **Hephaestus (Agent 6A) — Action Recommendation:** Evaluates triages and recommends specific repairs. Queries technical manuals using an in-memory cosine-similarity RAG vector retriever (`ManualRAG`) to compile citations.
4.  **Policy Engine (Agent 14A) — Rule-Based Safety Evaluator:** Matches proposed actions against YAML policy profiles (`conservative`, `balanced`, `aggressive`). Decides if actions can run autonomously or require supervisor review.
5.  **HITL Gateway & Notifications (Agent 14B) — Human-In-The-Loop:** Manages authorization requests. Dispatches notifications (e.g., inline interactive Telegram buttons) and signs cryptographic HMAC tokens (`ATLAS_HITL_SECRET`) upon decision callbacks.
6.  **Hermes (Agent 6B) — Technician Dispatch Optimizer:** Formulates optimal technician matches. Employs Mixed-Integer Linear Programming (MILP with PuLP/CBC) to solve constraints (certifications, shifts, distance, cost metrics) with a greedy fallback.
7.  **Mnemos (Agent 6C) — Continuous Feedback Capture:** Captures technician task outcomes, edits, and checklists. Encodes closure metrics into structured `TrainingTuple` JSONL logs, facilitating future model fine-tuning.
8.  **FastMCP Servers (Agent 10) — Tool Integration:** Employs five FastMCP stdio servers making capabilities tool-accessible to any LLM:
    *   `telemetry`: Current values, windows, active anomalies.
    *   `graph`: Topology queries, dependents, blast radius.
    *   `parts`: Inventory levels, compatibility, nearby warehouses.
    *   `history`: Past incident logs, repair patterns, tech logs.
    *   `dispatch`: Auto-dispatches, confirms jobs, tickets.
9.  **Audit Ledger (Agent 15) — Secure Compliance Logger:** Records state transitions in an append-only, tamper-evident SHA-256 hash-chain (building a canonical ledger). Generates compliance reports and validates chain integrity.

---

## 📁 Repository Structure

```
project-atlas/
├── docker-compose.yml     # Local Postgres container (atlas-postgres)
├── package.json           # Root package and monorepos workspace mapping
├── start.sh               # Main startup script for DB and Node/Bun services
├── start-all.sh           # Exec wrapper for start.sh
├── biome.json             # Code quality rules (formatting and linting)
├── projects/
│   ├── frontend/          # Vite + React 19 visual operations console
│   └── backend/           # NestJS 11 orchestration API Gateway
├── packages/
│   ├── api-types/         # Typed interfaces compiled from backend OpenAPI spec
│   └── api-client/        # Type-safe openapi-fetch client wrapper
├── python/
│   └── atlas_ml/          # Python reasoning engine, agent pipelines, and MCP servers
│       ├── atlas_ml/      # Internal Python modules (sentinel, triton, hephaestus, etc.)
│       ├── scripts/       # CLI executors (smoke.py, audit_check.py, mcp_check.py)
│       └── requirements.txt # Python package requirements
└── tools/
    └── biome-plugin/      # Biome toolchain integration plugin
```

---

## ⚙️ Setup & Development Commands

### 1. Quick Start (Full Stack)

This command pulls and starts Postgres via Docker, executes database migrations, launches the SWC watcher for NestJS, and serves the Vite frontend:

```sh
bun install
./start.sh
```

To run **only the frontend** dashboard without booting database or NestJS services:

```sh
./start.sh --frontend-only
```

---

### 2. Database Commands (NestJS & Drizzle)

Run these targets via Nx to manage the PostgreSQL relational models:

```sh
# Generate new schema migration SQL files
bun nx run @atlas/backend:db:generate

# Execute outstanding schema migrations on the database
bun nx run @atlas/backend:db:migrate

# Interactively push schema modifications (prototyping bypass)
bun nx run @atlas/backend:db:push

# Launch the visual Drizzle Studio database explorer
bun nx run @atlas/backend:db:studio

# Seed baseline catalogs and asset registers
bun nx run @atlas/backend:db:seed
```

---

### 3. API Sync and OpenAPI Type Generation

When editing NestJS controllers or schemas, regenerate the types to synchronize the frontend clients:

```sh
# Step 1: Extract OpenAPI JSON schema statically from NestJS
bun nx run @atlas/backend:openapi:generate

# Step 2: Generate type interfaces and client classes for the frontend
bun nx run @atlas/api-types:generate-types
```

---

### 4. Running Python Agent Tasks & MCP Servers

Make sure your virtual environment is active, then run tasks from the `python/atlas_ml` folder:

```sh
# Install Python packages (e.g. LightGBM, PuLP, FastMCP, FastAPI, etc.)
pip install -r python/atlas_ml/requirements.txt

# Train Triton forecasters using synthetic seed data
python python/atlas_ml/scripts/train_forecaster.py

# Run a full dry-run of the 8-agent reasoning chain
python python/atlas_ml/scripts/smoke.py

# Run a check of all 5 MCP servers internally in-process
python python/atlas_ml/scripts/mcp_check.py

# Run the tamper-evident hash-chain audit ledger compliance checks
python python/atlas_ml/scripts/audit_check.py

# Spin up a specific stdio FastMCP server (telemetry, graph, parts, history, or dispatch)
python -m atlas_ml.mcp_servers.telemetry
```

---

### 5. Quality Controls & Tests

Atlas utilizes **Biome** for lightning-fast linting and formatting across the monorepo:

```sh
# Run checks and apply auto-formatting across TS/JS/JSON files
bun biome check --write .

# Run Playwright E2E visual/functional tests on the frontend
bun nx run @atlas/frontend:test
```
