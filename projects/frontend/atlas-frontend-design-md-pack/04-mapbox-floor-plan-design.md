# 04 — Mapbox Floor Plan Design

## Purpose

The Mapbox floor plan is the physical command surface for ATLAS.

It must visualize physical infrastructure relationships, not just locations.

## Technology

Use:

- Mapbox GL JS
- GeoJSON sources
- Mapbox layers
- React
- TypeScript
- Tailwind CSS

Do not use React Flow for this view.

## Floor-plan approach

For MVP, use a synthetic indoor facility represented by GeoJSON.

Use fake lng/lat coordinates if needed.

Example conceptual layers:

```txt
facility-boundary
zones-fill
zones-outline
asset-points
asset-labels
dependency-lines
active-incident-lines
blast-radius-highlight
selected-asset-ring
```

## Map style

Use a dark Mapbox base style or a minimal custom style.

If the base map is visually noisy, reduce it.

The floor plan should feel like an indoor command map, not a street map.

## Facility bounds

Constrain the map to the facility area.

The user should not accidentally pan across the world.

Use:

- maxBounds
- fixed zoom range
- sensible initial center
- sensible pitch/bearing if using 3D-like view

## Coordinate strategy

For synthetic indoor maps:

- define a small fake coordinate area
- map facility x/y coordinates to lng/lat
- keep conversion utilities in `mapUtils.ts`

Example utility:

```ts
export function facilityToLngLat(x: number, y: number): [number, number] {
  const originLng = 23.7275;
  const originLat = 37.9838;
  const scale = 0.00001;

  return [originLng + x * scale, originLat + y * scale];
}
```

## Zones

Zones should be polygons.

Zone types:

```txt
hall
row
electrical
cooling
restricted
corridor
```

Visual treatment:

- hall: very subtle fill
- rows: slightly stronger fill
- electrical: warm border
- cooling: cool border
- restricted: red dashed border
- corridor: minimal fill

## Assets

Assets can be rendered as:

- circle layers
- symbol layers
- HTML markers only if necessary

Prefer Mapbox layers for performance and styling.

Asset size should reflect:

- type
- criticality
- selected state
- incident state

## Dependencies

Dependencies should be line layers.

Each dependency edge should have:

- source asset
- target asset
- resource type
- edge type
- criticality
- activeInIncident state

Inactive edges should be subtle.

Active incident edges should be obvious.

## Labels

Labels should be optional.

Label rules:

- show labels for selected asset
- show labels for critical assets
- allow global label toggle
- avoid clutter
- do not label every asset at all zoom levels

## Incident rendering

When incident simulation starts:

1. root asset status changes to critical
2. active edges become highlighted
3. affected assets update status
4. impact list populates
5. map optionally eases to root asset
6. selected asset becomes root asset

## Map interactions

Required:

- hover asset
- click asset
- click empty area clears selection
- layer toggles
- critical path filter
- reset simulation

Optional:

- fit bounds to incident path
- zoom to selected asset
- popup on hover

Prefer side panel over popups for detailed data.

## Performance

Avoid:

- adding/removing sources on every render
- duplicating layers
- using thousands of DOM markers
- excessive React state tied to map movement

Use:

- stable source ids
- `setData` for GeoJSON updates
- layer visibility changes
- memoized data transforms
