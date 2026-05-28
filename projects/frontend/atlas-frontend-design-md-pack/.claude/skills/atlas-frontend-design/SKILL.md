# ATLAS Frontend Design Skill

Use this skill when building or refining the ATLAS frontend.

Read the frontend design docs included in this pack. Follow these principles:

- ATLAS must look like a serious mission-critical infrastructure command center.
- The physical floor-plan view must use Mapbox GL JS, not React Flow.
- React Flow is only for logical workflows and implementation diagrams.
- The core demo moment is CRAC-07 failure cascade visualization.
- Use a dark, premium, technical visual language.
- Use color only for operational meaning.
- Build modular React/TypeScript components.
- Use local seed data first.
- Keep the implementation backend-replaceable.

Required command-center layout:

```txt
Top Bar
Left Rail: incident queue, layer controls, simulation controls
Center: Mapbox floor plan
Right Panel: selected asset details, dependencies, blast radius
Bottom Timeline: operational event log
```

Required demo behavior:

```txt
Simulate CRAC-07 Failure
→ CRAC-07 becomes critical
→ cooling edges highlight
→ affected racks turn warning/critical
→ blast radius appears with minutes-to-impact
→ timeline logs the event sequence
```

Use the detailed docs in `docs/frontend-design/` for exact visual and implementation instructions.
