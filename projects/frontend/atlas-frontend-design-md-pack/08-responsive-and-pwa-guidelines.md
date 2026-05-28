# 08 — Responsive and PWA Guidelines

## Desktop-first command center

The command center is primarily a desktop/tablet interface.

Optimize first for:

```txt
1440px desktop
MacBook screen
large external monitor
```

## Responsive behavior

### Large desktop

Show full layout:

```txt
left rail + map + right panel + bottom timeline
```

### Medium screens

- left rail can shrink
- right panel remains visible
- bottom timeline can be shorter

### Tablet

- left rail becomes collapsible
- right panel becomes drawer
- map remains primary

### Mobile

Mobile is not the full command center.

Mobile should be reserved for technician PWA flows.

For `/command-center` on mobile:

- show map
- use bottom sheet for details
- hide heavy sidebars
- keep layer controls behind a button

## Technician PWA direction

Separate route:

```txt
/technician
```

Should focus on:

- assigned work order
- asset info
- step-by-step procedure
- voice interaction
- approval status
- notes
- completion

Do not cram the full command center into mobile.

## Touch interactions

For tablet/mobile:

- markers need larger hit areas
- side panel should become bottom sheet
- avoid tiny toggles
- keep critical action buttons large

## Performance

- avoid thousands of DOM markers
- prefer Mapbox layers
- avoid unnecessary React re-renders
- debounce high-frequency updates
- keep seed data small for MVP

## Offline/degraded mode

For PWA later:

- cache current work order
- cache manual snippets
- allow local notes
- sync when connection returns

Not required for the first Mapbox command-center MVP.
