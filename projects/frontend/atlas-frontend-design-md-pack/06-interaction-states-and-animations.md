# 06 — Interaction States and Animations

## Interaction philosophy

Interactions should feel operational, not playful.

Every animation must communicate state.

## Required states

### Default state

- all zones visible
- assets visible
- inactive edges low opacity
- no side panel selection or site overview shown

### Hover asset

On hover:

- cursor becomes pointer
- asset slightly brightens
- small label or tooltip may appear
- related direct edges can subtly increase opacity

### Select asset

On click:

- selected ring appears
- right panel shows details
- upstream/downstream dependencies are emphasized
- selected asset label remains visible

### Clear selection

Clicking empty map area:

- clears selected asset
- right panel returns to site overview unless incident is active

### Layer toggle

Toggling layers:

- changes map layer visibility
- does not destroy state
- does not rebuild the map instance

### Simulate incident

On clicking simulation button:

1. root asset updates to critical
2. active incident appears in queue
3. related edges highlight
4. affected assets transition to warning/critical
5. right panel shows blast radius
6. bottom timeline receives events

### Reset incident

On reset:

- restore baseline statuses
- active edges become inactive
- incident queue clears or marks resolved
- selected asset can remain selected but should show baseline state

## Animation rules

Use animation for:

- pulsing critical root asset
- active dependency path
- panel transition
- timeline event insertion
- selected ring

Avoid animation for:

- every normal asset
- every edge
- decorative background effects
- continuous heavy map re-renders

## Timing

Suggested durations:

```txt
Panel slide/fade:        150–220ms
Marker status transition:200–300ms
Incident path highlight: 300–600ms
Timeline item insertion: 150ms
```

## Incident cascade timing

For demo, the cascade can be accelerated.

Example:

```txt
0.0s  CRAC-07 critical
0.5s  first cooling edge active
0.9s  Rack C12 warning
1.2s  Rack C13 warning
1.6s  Rack C14 critical
2.0s  blast radius list complete
```

Even if minutes-to-impact says 14 minutes, visual demo timing can be compressed.

## Sound

Do not add sound unless explicitly requested.

## Loading states

Map loading should show:

```txt
Loading facility model...
```

Missing token should show:

```txt
Mapbox token missing. Set NEXT_PUBLIC_MAPBOX_TOKEN in your environment.
```

Do not crash with blank screen.

## Error states

Show useful errors for:

- missing token
- failed map initialization
- invalid GeoJSON
- no assets available
