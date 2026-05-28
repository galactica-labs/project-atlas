# 09 — Implementation Guardrails

## Hard constraints

Do not use React Flow for the physical floor-plan view.

React Flow is allowed only for:

- agent workflow
- implementation flow
- backend pipeline
- logical orchestration views

Use Mapbox GL JS for:

- physical facility map
- zones
- devices
- dependency lines
- incident paths

## Mapbox constraints

- Initialize only on client.
- Clean up map instance on unmount.
- Import Mapbox CSS.
- Use `NEXT_PUBLIC_MAPBOX_TOKEN`.
- Show error state if token is missing.
- Use stable source and layer ids.
- Avoid adding duplicate sources/layers.
- Use `setData` for updates.
- Avoid reinitializing map on every React render.

## TypeScript constraints

- Define shared types once.
- Avoid `any`.
- Use discriminated unions where useful.
- Keep asset statuses and resource types as strict unions.

## Data constraints

For MVP:

- use local seed data
- keep data realistic
- separate baseline data from simulation state
- structure data so API replacement is easy later

## UX constraints

- No generic dashboard template.
- No huge cards with vague metrics.
- No meaningless gradients.
- No cluttered edge spaghetti.
- No labels everywhere at once.
- No decorative animation.

## Component constraints

- Keep Mapbox imperative logic isolated.
- Keep panels declarative.
- Keep data transforms in utilities.
- Keep colors/styles centralized.
- Keep page route clean.

## Demo constraints

The demo must work without backend.

Required local simulation:

```txt
Simulate CRAC-07 Failure
Reset Simulation
```

The following must update:

- root asset status
- affected asset statuses
- active edge ids
- incident queue
- right panel
- bottom timeline

## Final validation

Before considering the task done, run available commands:

```txt
npm run lint
npm run typecheck
npm run build
```

If scripts differ, inspect `package.json` and run the closest equivalents.

Fix errors.

Do not leave the project in a broken state.
