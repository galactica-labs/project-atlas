# 05 — Asset and Dependency Visual Language

## Asset types

Represent these asset types clearly:

```txt
rack
pdu
ups
crac
sensor
generator
switch
cooling_unit
```

## Asset status

Every asset has one visible status:

```txt
normal
warning
critical
offline
```

Status must be visible on the map and in the side panel.

## Asset visual hierarchy

Visual priority:

1. critical selected asset
2. active incident affected assets
3. warning assets
4. normal criticality-high assets
5. normal low-criticality assets
6. offline assets

## Asset marker design

Use simple, serious markers.

Suggested:

```txt
Normal:   small circle/dot
Warning:  dot with amber ring
Critical: larger red dot with pulse/ring
Offline:  gray dimmed dot
Selected: white outer ring
```

Avoid cartoon icons.

## Asset labels

Label format:

```txt
CRAC-07
Rack C12
PDU-01
```

Do not use verbose labels on the map.

Full details belong in the side panel.

## Dependency types

Dependency edge resources:

```txt
power
cooling
network
dependency
```

Edge relationship types:

```txt
FEEDS
DEPENDS_ON
CONNECTED_TO
```

## Edge styling

Suggested:

```txt
Power:
  yellow line, medium opacity

Cooling:
  cyan/blue line, medium opacity

Network:
  purple line, dashed if possible

Dependency:
  orange line, low opacity unless active
```

Inactive edges:

```txt
opacity: 0.12–0.25
width: 1–1.5px
```

Active incident edges:

```txt
opacity: 0.9–1
width: 3–5px
glow or bright color allowed
```

## Avoid edge spaghetti

Do not show every edge at full strength.

Use:

- layer filters
- critical path only toggle
- low opacity inactive edges
- selected asset neighborhood focus
- active incident highlight

## Selected asset behavior

When an asset is selected:

- marker gets selected ring
- direct upstream/downstream edges become more visible
- side panel opens
- dependencies list updates
- map may ease to asset, but do not overdo camera movement

## Blast radius behavior

Blast radius should show sequence.

Example:

```txt
T+0    CRAC-07 critical
T+14   Rack C12 cooling loss
T+16   Rack C13 cooling loss
T+21   GPU Cluster A throttle risk
T+29   Rack C15 emergency shutdown risk
```

On map:

- root asset red
- affected warning assets amber
- affected critical assets red
- active path highlighted
- optional numbered badges or countdown labels

## Critical path only

When enabled:

- hide unrelated edges
- show only root-to-affected dependency path
- preserve selected asset and affected nodes
