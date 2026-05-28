# 01 — Product Frontend Principles

## What ATLAS is

ATLAS is a mission-critical infrastructure command center.

The frontend must communicate that the system understands:

- physical location
- device state
- dependency relationships
- operational consequence
- technician action
- human approval
- auditability

## What ATLAS is not

ATLAS is not:

- a generic analytics dashboard
- a React Flow diagram of devices
- a toy digital twin
- a chatbot UI
- a CMMS ticket table with AI branding
- a collection of unrelated cards

## Design goal

The frontend should make the user feel:

```txt
I am looking at a live operational model of the facility.
```

Not:

```txt
I am looking at a dashboard that lists assets.
```

## Core visual story

The product’s main visual story is cascade awareness.

A single asset failure should immediately show:

1. the root asset
2. the dependency path
3. affected downstream assets
4. time-to-impact
5. severity
6. recommended action

## Priority order

When making frontend tradeoffs, prioritize:

1. clarity of physical relationships
2. clarity of active incident state
3. operational seriousness
4. speed of demo comprehension
5. visual polish
6. feature quantity

## Frontend architecture principle

Separate these views:

```txt
Physical View:
  Mapbox floor plan, devices, dependencies, incident propagation.

Logical View:
  React Flow for agents, workflows, implementation pipeline.

Operational View:
  incidents, work orders, approvals, dispatch, audit trail.
```

Do not use React Flow as the main physical floor-plan UI.

## MVP standard

The MVP frontend is successful if a judge can understand this in under 10 seconds:

```txt
This asset is failing.
These assets depend on it.
This is where the impact spreads.
This is how much time we have.
This is the action ATLAS recommends.
```
