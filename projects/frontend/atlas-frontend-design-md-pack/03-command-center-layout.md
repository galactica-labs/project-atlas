# 03 — Command Center Layout

## Primary route

Use:

```txt
/command-center
```

or the closest equivalent in the existing app.

## Layout structure

Use a three-column operational layout:

```txt
┌──────────────────────────────────────────────────────────────────────┐
│ Top Bar: ATLAS / Site / Mode / Global Status                         │
├─────────────────┬────────────────────────────────────┬───────────────┤
│ Left Rail       │ Center Map                         │ Right Panel   │
│ Incident Queue  │ Mapbox Floor Plan                  │ Asset Details │
│ Layer Controls  │ Asset + Dependency Visualization   │ Dependencies  │
│ Simulation      │ Blast Radius Overlay               │ Impact List   │
├─────────────────┴────────────────────────────────────┴───────────────┤
│ Bottom Timeline / Event Log / Audit Trail Preview                    │
└──────────────────────────────────────────────────────────────────────┘
```

## Top bar

The top bar should show:

- ATLAS logo/name
- current site
- operational mode
- global health summary
- current time
- optional environment badge: demo / simulation / live

Example:

```txt
ATLAS  |  Data Center Alpha / Hall B  |  SIMULATION MODE  |  1 Critical · 4 Warning
```

## Left rail

The left rail should contain:

1. Incident Queue
2. Layer Controls
3. Simulation Controls

### Incident Queue

Each incident row:

```txt
P1  CRAC-07 Thermal Risk
Hall B / Cooling Zone
First impact: 14 min
```

Row states:

- selected
- active
- resolved
- waiting approval

### Layer Controls

Toggles:

```txt
Power
Cooling
Network
Dependency
Labels
Critical Path Only
```

### Simulation Controls

For MVP/demo:

```txt
[Simulate CRAC-07 Failure]
[Reset Simulation]
```

## Center map

The center area is the main product surface.

It must show:

- floor zones
- asset markers
- dependency edges
- selected asset highlight
- active incident path
- labels
- hover state

The map should take most of the screen.

## Right panel

The right panel changes based on selection.

When no asset is selected:

```txt
Site Overview
- total assets
- critical assets
- active incidents
- open work orders
- highest-risk zones
```

When an asset is selected:

```txt
Asset Details
- name
- type
- status
- zone
- criticality
- anomaly score
- upstream dependencies
- downstream dependencies
- affected assets
- recommended action
```

When an incident is active:

```txt
Blast Radius
- root cause asset
- affected assets
- minutes-to-impact
- severity
- operational consequence
```

## Bottom timeline

Use this for:

```txt
12:04:11  Sentinel flagged CRAC-07
12:04:12  Blast radius computed
12:04:14  Rack C12 marked warning
12:04:16  Hermes dispatch recommended Nikos P.
12:04:20  HITL approval requested
```

This makes the system feel alive and auditable.

## Layout sizing

Suggested desktop layout:

```txt
Left rail:    280–320px
Center map:   flexible
Right panel:  340–420px
Top bar:      56–64px
Bottom bar:   96–140px
```

## Responsive behavior

For smaller screens:

- collapse left rail into drawer
- keep map primary
- right panel becomes slide-over
- bottom timeline becomes collapsible
