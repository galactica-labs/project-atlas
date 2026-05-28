# 07 — Component Specification

## Preferred structure

```txt
components/atlas-map/
  AtlasFloorPlanMap.tsx
  AssetDetailsPanel.tsx
  IncidentQueue.tsx
  LayerControls.tsx
  CommandCenterShell.tsx
  BottomTimeline.tsx
  mapData.ts
  mapTypes.ts
  mapStyles.ts
  mapUtils.ts
```

## Page route

Use:

```txt
app/command-center/page.tsx
```

or existing app structure equivalent.

## Component responsibilities

### `CommandCenterShell.tsx`

Responsible for page layout.

Includes:

- top bar
- left rail
- center map
- right panel
- bottom timeline

Should not contain low-level Mapbox logic.

### `AtlasFloorPlanMap.tsx`

Responsible for Mapbox rendering.

Handles:

- map initialization
- source creation
- layer creation
- click handlers
- hover handlers
- selected asset highlight
- edge visibility
- GeoJSON updates

Should avoid business logic where possible.

### `AssetDetailsPanel.tsx`

Responsible for selected asset details.

Shows:

- asset name
- type
- status
- zone
- criticality
- metadata
- upstream dependencies
- downstream dependencies
- blast radius if active

### `IncidentQueue.tsx`

Shows active incidents.

For MVP:

- CRAC-07 failure incident
- priority
- root asset
- first impact timing
- status

### `LayerControls.tsx`

Controls visibility of:

- power
- cooling
- network
- dependency
- labels
- critical path only

### `BottomTimeline.tsx`

Shows chronological operational events.

Example:

```txt
12:04:11 Sentinel flagged CRAC-07
12:04:12 Blast radius computed
12:04:14 Rack C12 marked warning
```

### `mapData.ts`

Contains local seed data.

Must include:

- zones
- assets
- dependency edges
- baseline statuses
- incident scenario

### `mapTypes.ts`

Contains TypeScript types.

No duplicate type definitions across files.

### `mapStyles.ts`

Contains:

- color constants
- Mapbox layer style helpers
- status-to-color functions
- dependency-to-color functions

### `mapUtils.ts`

Contains:

- coordinate conversion
- GeoJSON builders
- dependency lookup helpers
- blast radius computation from seed data
- asset status update helpers

## State model

Use local React state or Zustand.

Suggested state:

```ts
type CommandCenterState = {
  selectedAssetId: string | null;
  hoveredAssetId: string | null;
  visibleLayers: {
    power: boolean;
    cooling: boolean;
    network: boolean;
    dependency: boolean;
    labels: boolean;
    criticalPathOnly: boolean;
  };
  activeIncidentId: string | null;
  assetStatuses: Record<string, AssetStatus>;
  activeEdgeIds: string[];
};
```

## Required callbacks

```ts
onAssetSelect(assetId: string): void
onMapClearSelection(): void
onLayerToggle(layer: LayerKey): void
onSimulateIncident(): void
onResetIncident(): void
```

## Build quality requirements

- No massive 800-line component.
- No hardcoded rendering per device.
- No scattered color strings.
- No `any` unless impossible.
- No broken SSR.
- No unhandled missing token state.
