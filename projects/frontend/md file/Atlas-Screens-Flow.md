# ATLAS — App Screens & Flow Map

This document maps every screen in the Atlas app to the deployment phase and user role that drives it. Use this as the source of truth for design and routing.

---

## Diagram 1 — Full App Flow (All Roles, All Phases)

```mermaid
flowchart TD
    Start([User opens Atlas]) --> Auth[Login / SSO Screen]
    Auth --> RoleCheck{Role?}

    RoleCheck -->|Admin / Installer| AdminHome[Admin Dashboard]
    RoleCheck -->|Ops Manager| OpsHome[Command Center]
    RoleCheck -->|Supervisor| SupHome[Supervisor Inbox]
    RoleCheck -->|Technician| TechHome[Technician PWA Home]
    RoleCheck -->|Auditor| AuditHome[Audit Ledger Browser]

    %% ===== ADMIN / INSTALLER FLOW (Phases 0-3) =====
    AdminHome --> A1[Site Setup Wizard]
    A1 --> A2[Edge Gateway Status]
    A2 --> A3[Brain Connection Screen]
    A3 --> A4[Tag Discovery Review]
    A4 --> A5[Tag Mapping Confirmation]
    A5 --> A6[Floor Plan Builder]
    A6 --> A7[Asset Placement Canvas]
    A7 --> A8[Dependency Graph Editor]
    A8 --> A9[Manual Upload Screen]
    A9 --> A10[SLA & Criticality Editor]
    A10 --> A11[Policy YAML Editor]
    A11 --> A12[Shadow Mode Dashboard]
    A12 --> A13[Baseline Tuning Review]
    A13 --> A14[Go-Live Checklist]
    A14 --> OpsHome

    %% ===== OPS MANAGER FLOW (Phase 4) =====
    OpsHome --> O1[Live Floor Plan View]
    O1 --> O2{Event Type?}
    O2 -->|Anomaly Detected| O3[Anomaly Detail Panel]
    O3 --> O4[Blast Radius Visualization]
    O4 --> O5[Cascade Timeline View]
    O5 --> O6[Recommended Action Panel]
    O6 --> O7{Action Type?}
    O7 -->|Read-only| O8[Auto-Execute Log]
    O7 -->|Risky| O9[HITL Pending Screen]
    O7 -->|Dispatch| O10[Dispatch Plan Preview]

    O2 -->|Query| O11[Natural Language Query Bar]
    O11 --> O12[Risk Profile Report]

    O2 -->|Browse| O13[Asset List & Filters]
    O13 --> O14[Asset Detail Screen]
    O14 --> O15[Asset Telemetry Charts]
    O14 --> O16[Asset Maintenance History]
    O14 --> O17[Asset Dependency View]

    OpsHome --> O18[Active Incidents Queue]
    OpsHome --> O19[Pending Approvals Queue]
    OpsHome --> O20[SLA Breach Risk Panel]

    %% ===== SUPERVISOR / HITL FLOW =====
    SupHome --> S1[Pending Approvals List]
    S1 --> S2[Approval Detail Screen]
    S2 --> S3[Agent Reasoning Trace View]
    S3 --> S4[Alternative Actions Comparison]
    S4 --> S5{Decision?}
    S5 -->|Approve| S6[Approval Confirmation]
    S5 -->|Reject| S7[Rejection w/ Mandatory Note]
    S5 -->|Modify| S8[Modification Editor]
    S6 --> S9[Audit Record Generated]
    S7 --> S9
    S8 --> S9

    %% Telegram approval (out-of-app channel)
    O9 -.->|Push| TG[Telegram Notification]
    TG -.->|Inline buttons| S9

    %% ===== TECHNICIAN FLOW (Phase 5) =====
    TechHome --> T1[Assigned Jobs List]
    T1 --> T2[Job Detail & Navigation]
    T2 --> T3[En-Route Screen]
    T3 --> T4[On-Site Arrival Confirm]
    T4 --> T5[Voice + Camera Active Screen]
    T5 --> T6{Voice Command?}

    T6 -->|Start diagnosis| T7[Step-by-Step Guide]
    T6 -->|Pull manual| T8[Manual Section Display]
    T6 -->|What happened last time| T9[Historical Repair Summary]
    T6 -->|Log action| T10[Action Logged Confirmation]
    T6 -->|Escalate| T11[Escalation Request Screen]
    T6 -->|Repair complete| T12[Close-Out Form]

    T5 --> T13[Camera AR Overlay]
    T13 --> T14[Asset Identification Badge]
    T13 --> T15[Part Number OCR Result]
    T13 --> T16[Safety State Verification]
    T13 --> T17[Remote Expert Join View]

    T11 -->|Awaiting approval| T18[Non-Blocking Wait Indicator]
    T18 --> T5

    T12 --> T19[Root Cause Selection]
    T19 --> T20[Parts Used Confirmation]
    T20 --> T21[Photo Documentation]
    T21 --> T22[Work Order Closed Receipt]
    T22 --> T1

    %% ===== POST-CLOSURE / LEARNING (Phase 6) =====
    T22 --> M1[Mnemos Training Tuple Captured]
    M1 -.->|Async| M2[Nightly Retraining Job]
    M2 -.->|Updates| O1
    M1 -.->|Anonymized| M3[Federated Contribution Indicator]

    %% ===== AUDITOR FLOW =====
    AuditHome --> AU1[Ledger Search & Filters]
    AU1 --> AU2[Audit Record Detail]
    AU2 --> AU3[Hash Chain Verification View]
    AuditHome --> AU4[Compliance Report Generator]
    AU4 --> AU5[ISO 55000 / NERC CIP / SEMI S2 Templates]
    AU5 --> AU6[PDF Export & Download]

    classDef admin fill:#EEEDFE,stroke:#534AB7,color:#26215C
    classDef ops fill:#E6F1FB,stroke:#185FA5,color:#042C53
    classDef sup fill:#FAEEDA,stroke:#854F0B,color:#412402
    classDef tech fill:#E1F5EE,stroke:#0F6E56,color:#04342C
    classDef audit fill:#F1EFE8,stroke:#5F5E5A,color:#2C2C2A
    classDef async fill:#FBEAF0,stroke:#993556,color:#4B1528

    class A1,A2,A3,A4,A5,A6,A7,A8,A9,A10,A11,A12,A13,A14,AdminHome admin
    class O1,O2,O3,O4,O5,O6,O7,O8,O9,O10,O11,O12,O13,O14,O15,O16,O17,O18,O19,O20,OpsHome ops
    class S1,S2,S3,S4,S5,S6,S7,S8,S9,SupHome sup
    class T1,T2,T3,T4,T5,T6,T7,T8,T9,T10,T11,T12,T13,T14,T15,T16,T17,T18,T19,T20,T21,T22,TechHome tech
    class AU1,AU2,AU3,AU4,AU5,AU6,AuditHome audit
    class M1,M2,M3,TG async
```

---

## Diagram 2 — Screen Inventory by Role (Sitemap)

```mermaid
flowchart LR
    App[Atlas App]

    App --> AdminRole[Admin / Installer]
    App --> OpsRole[Operations Manager]
    App --> SupRole[Supervisor]
    App --> TechRole[Technician PWA]
    App --> AuditRole[Auditor]

    AdminRole --> ADM1[Site Setup Wizard]
    AdminRole --> ADM2[Edge Gateway Status]
    AdminRole --> ADM3[Brain Connection]
    AdminRole --> ADM4[Tag Discovery & Mapping]
    AdminRole --> ADM5[Floor Plan Builder]
    AdminRole --> ADM6[Asset Placement Canvas]
    AdminRole --> ADM7[Dependency Graph Editor]
    AdminRole --> ADM8[Manual Library]
    AdminRole --> ADM9[SLA & Criticality]
    AdminRole --> ADM10[Policy YAML Editor]
    AdminRole --> ADM11[Shadow Mode Review]
    AdminRole --> ADM12[Baseline Tuning]
    AdminRole --> ADM13[Go-Live Checklist]
    AdminRole --> ADM14[User & Role Management]

    OpsRole --> OPS1[Command Center / Floor Plan]
    OpsRole --> OPS2[Active Incidents Queue]
    OpsRole --> OPS3[Asset Detail View]
    OpsRole --> OPS4[Telemetry Charts]
    OpsRole --> OPS5[Maintenance History]
    OpsRole --> OPS6[Natural Language Query]
    OpsRole --> OPS7[Risk Profile Reports]
    OpsRole --> OPS8[SLA Breach Dashboard]
    OpsRole --> OPS9[Dispatch Plan Preview]
    OpsRole --> OPS10[Pending Approvals Queue]
    OpsRole --> OPS11[Technician Locator Map]
    OpsRole --> OPS12[Parts Inventory View]

    SupRole --> SUP1[Approval Inbox]
    SupRole --> SUP2[Approval Detail]
    SupRole --> SUP3[Reasoning Trace Viewer]
    SupRole --> SUP4[Alternative Actions]
    SupRole --> SUP5[Approval History]
    SupRole --> SUP6[Telegram Bot - external]

    TechRole --> TEC1[Jobs List]
    TechRole --> TEC2[Job Detail & Navigation]
    TechRole --> TEC3[Voice + Camera Active]
    TechRole --> TEC4[Step-by-Step Guide]
    TechRole --> TEC5[Manual Section Display]
    TechRole --> TEC6[Historical Repair Summary]
    TechRole --> TEC7[Camera AR Overlay]
    TechRole --> TEC8[Part Number OCR]
    TechRole --> TEC9[Safety State Indicator]
    TechRole --> TEC10[Remote Expert Video]
    TechRole --> TEC11[Action Log Confirmation]
    TechRole --> TEC12[Escalation Request]
    TechRole --> TEC13[Approval Wait Indicator]
    TechRole --> TEC14[Close-Out Form]
    TechRole --> TEC15[Photo Documentation]
    TechRole --> TEC16[Settings & Profile]

    AuditRole --> AUD1[Ledger Search]
    AuditRole --> AUD2[Audit Record Detail]
    AuditRole --> AUD3[Hash Chain Verifier]
    AuditRole --> AUD4[Compliance Report Generator]
    AuditRole --> AUD5[Report Templates Library]
    AuditRole --> AUD6[Export Center]

    classDef admin fill:#EEEDFE,stroke:#534AB7,color:#26215C
    classDef ops fill:#E6F1FB,stroke:#185FA5,color:#042C53
    classDef sup fill:#FAEEDA,stroke:#854F0B,color:#412402
    classDef tech fill:#E1F5EE,stroke:#0F6E56,color:#04342C
    classDef audit fill:#F1EFE8,stroke:#5F5E5A,color:#2C2C2A

    class AdminRole,ADM1,ADM2,ADM3,ADM4,ADM5,ADM6,ADM7,ADM8,ADM9,ADM10,ADM11,ADM12,ADM13,ADM14 admin
    class OpsRole,OPS1,OPS2,OPS3,OPS4,OPS5,OPS6,OPS7,OPS8,OPS9,OPS10,OPS11,OPS12 ops
    class SupRole,SUP1,SUP2,SUP3,SUP4,SUP5,SUP6 sup
    class TechRole,TEC1,TEC2,TEC3,TEC4,TEC5,TEC6,TEC7,TEC8,TEC9,TEC10,TEC11,TEC12,TEC13,TEC14,TEC15,TEC16 tech
    class AuditRole,AUD1,AUD2,AUD3,AUD4,AUD5,AUD6 audit
```

---

## Diagram 3 — Incident Lifecycle Screens (The Demo Path)

This is the screen sequence the judges will see end-to-end.

```mermaid
flowchart TD
    Start([Telemetry drift detected]) --> D1[Command Center: Floor Plan]
    D1 -->|Asset flips red| D2[Anomaly Detail Panel slides in]
    D2 --> D3[Blast Radius lights up downstream nodes]
    D3 --> D4[Cascade Timeline overlay with countdowns]
    D4 --> D5[Recommended Action Panel: dispatch + bypass]

    D5 --> D6[Hermes Dispatch Plan Preview]
    D6 --> D7[Technician + parts + ETA shown on map]

    D7 -->|Bypass action triggers policy| D8[HITL Pending Screen]
    D8 -.->|Telegram push| D9[Supervisor Phone: Approval Card]
    D9 -->|Tap approve + note| D10[Audit Record Generated]
    D10 --> D11[Approval Confirmation appears in Command Center]

    D11 --> D12[Switch to Technician PWA]
    D12 --> D13[Job Detail with route]
    D13 --> D14[On-Site: Voice + Camera Active]
    D14 -->|Voice: start diagnosis| D15[Step-by-Step Guide opens]
    D15 -->|Voice: what happened last time| D16[Historical Repair Summary]
    D16 --> D17[Camera AR identifies asset]
    D17 --> D18[Safety State verified - green badge]
    D18 --> D19[Tech performs repair, voice logs each step]

    D19 --> D20[Voice: repair complete]
    D20 --> D21[Close-Out Form]
    D21 --> D22[Root Cause + Parts confirmed]
    D22 --> D23[Work Order Closed Receipt]

    D23 -.->|Async| D24[Mnemos: Training Tuple Captured toast]
    D24 -.->|Async| D25[Federated Contribution: 1 signature shared]

    classDef ops fill:#E6F1FB,stroke:#185FA5,color:#042C53
    classDef sup fill:#FAEEDA,stroke:#854F0B,color:#412402
    classDef tech fill:#E1F5EE,stroke:#0F6E56,color:#04342C
    classDef async fill:#FBEAF0,stroke:#993556,color:#4B1528

    class D1,D2,D3,D4,D5,D6,D7,D11 ops
    class D8,D9,D10 sup
    class D12,D13,D14,D15,D16,D17,D18,D19,D20,D21,D22,D23 tech
    class D24,D25 async
```

---

## Screen Priority for Hackathon Build

**Build first (demo critical):**
- Command Center / Floor Plan (D1)
- Anomaly Detail Panel + Blast Radius (D2-D4)
- Dispatch Plan Preview (D6-D7)
- HITL Pending Screen + Telegram approval (D8-D11)
- Technician PWA: Job Detail, Voice + Camera Active, Step-by-Step (D12-D19)
- Close-Out Form (D21-D23)
- Mnemos + Federated toasts (D24-D25)

**Build second (if time permits):**
- Asset Detail View with telemetry charts
- Natural Language Query bar in Command Center
- Pending Approvals Queue (web version)
- Audit Record Detail with hash chain

**Skip for hackathon (mention in voiceover):**
- All Phase 0–3 admin screens (site setup, brain connection, tag discovery, floor plan builder, dependency editor, shadow mode review)
- User & role management
- Compliance report generator
- Parts inventory view

---

## Routing Structure (Next.js App Router)

```
app/
├── (auth)/
│   └── login/
├── admin/                          # Admin / Installer
│   ├── setup/
│   ├── gateway/
│   ├── brain/
│   ├── tags/
│   ├── floor-plan/
│   ├── dependencies/
│   ├── manuals/
│   ├── slas/
│   ├── policies/
│   ├── shadow-mode/
│   └── go-live/
├── ops/                            # Operations Manager
│   ├── command-center/             # default landing
│   ├── incidents/
│   ├── assets/[id]/
│   ├── query/
│   ├── reports/
│   ├── approvals/
│   └── parts/
├── supervisor/                     # Supervisor
│   ├── inbox/
│   ├── approvals/[id]/
│   └── history/
├── tech/                           # Technician PWA (separate manifest)
│   ├── jobs/
│   ├── jobs/[id]/
│   ├── jobs/[id]/active/           # voice + camera screen
│   ├── jobs/[id]/close/
│   └── settings/
└── audit/                          # Auditor
    ├── ledger/
    ├── records/[id]/
    ├── verify/
    └── reports/
```
