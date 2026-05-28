# 10 — Claude Code Build Prompt

Copy and paste this into Claude Code.

```txt
Read all files in docs/frontend-design and treat them as the frontend design system and implementation constraints for ATLAS.

Build the `/command-center` frontend using Mapbox GL JS.

The goal is to create a serious mission-critical infrastructure command-center floor plan, not a generic dashboard and not a React Flow diagram.

Core requirements:
1. Use Mapbox GL JS for the physical floor-plan view.
2. Do not use React Flow for the floor plan.
3. Render a synthetic data-center facility using GeoJSON.
4. Show zones/rooms/rows as polygons.
5. Show devices/assets as interactive map features.
6. Show dependency relationships as line layers.
7. Support dependency resources: power, cooling, network, dependency.
8. Add layer toggles for each dependency resource and labels.
9. Add asset selection and a right-side asset details panel.
10. Add incident queue and simulation controls on the left.
11. Add bottom timeline/event log.
12. Add a deterministic “Simulate CRAC-07 Failure” button.
13. When simulation starts:
    - CRAC-07 becomes critical
    - cooling edges from CRAC-07 highlight
    - downstream racks become warning/critical
    - right panel shows blast radius and minutes-to-impact
    - bottom timeline logs the sequence
14. Add a reset simulation button.
15. Use local seed data first. Do not block on backend integration.
16. Keep the code modular, typed, and production-quality.

Preferred structure:
components/atlas-map/
- CommandCenterShell.tsx
- AtlasFloorPlanMap.tsx
- AssetDetailsPanel.tsx
- IncidentQueue.tsx
- LayerControls.tsx
- BottomTimeline.tsx
- mapData.ts
- mapTypes.ts
- mapStyles.ts
- mapUtils.ts

Route:
- app/command-center/page.tsx
or the equivalent route structure used by this repo.

Implementation constraints:
- Initialize Mapbox only on the client.
- Avoid SSR crashes.
- Import Mapbox CSS.
- Use NEXT_PUBLIC_MAPBOX_TOKEN.
- If the token is missing, show a useful error state.
- Clean up the map instance on unmount.
- Use GeoJSON sources and Mapbox layers where possible.
- Avoid unnecessary dependencies.
- Avoid huge components.
- Avoid hardcoded rendering logic per device.
- Run available lint/typecheck/build commands and fix errors.

Visual direction:
Dark, premium, technical command center.
Think Palantir + Vercel + industrial SCADA + Google Maps indoor.
Use color only for operational meaning.
Critical states should stand out.
Inactive edges should be subtle.
Active incident edges should be obvious.

The visual success condition:
A user should understand in under 10 seconds that CRAC-07 is failing, which racks depend on it, how the failure propagates, and how much time remains before impact.
```
