# ATLAS Frontend Design Instruction Pack

Drop this folder into your ATLAS repository as:

```txt
docs/frontend-design/
```

or copy the files into:

```txt
.claude/skills/atlas-frontend-design/
```

Use these files as instructions for Claude Code when building the ATLAS frontend.

## Recommended Claude Code prompt

```txt
Read docs/frontend-design/README.md and all files in docs/frontend-design. Use them as the frontend design system and implementation constraints for ATLAS. Build the command-center UI accordingly.
```

## Core frontend thesis

ATLAS must not look like a generic SaaS dashboard.

It must look like a serious command center for mission-critical physical infrastructure.

The main visual proof is the spatial asset graph:

```txt
CRAC-07 turns critical
→ cooling dependency edges highlight
→ downstream racks light up
→ side panel shows blast radius and minutes-to-impact
→ operator understands the facility-level consequence immediately
```

## File guide

```txt
01-product-frontend-principles.md
02-visual-design-system.md
03-command-center-layout.md
04-mapbox-floor-plan-design.md
05-asset-and-dependency-visual-language.md
06-interaction-states-and-animations.md
07-component-specification.md
08-responsive-and-pwa-guidelines.md
09-implementation-guardrails.md
10-claude-code-build-prompt.md
```
