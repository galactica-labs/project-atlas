# 02 — Visual Design System

## Design direction

ATLAS should feel like:

```txt
Palantir + Vercel + industrial SCADA + Google Maps indoor
```

It should be dark, sharp, technical, and restrained.

## Avoid

- generic blue SaaS dashboards
- childish 3D visuals
- random gradients
- excessive glow
- oversized cards
- noisy chart walls
- cartoon icons
- dashboard templates
- colorful UI without meaning

## Color philosophy

Color must carry operational meaning.

Do not use color decoratively.

### Base palette

```txt
Background primary:   #05070A
Background secondary: #0A0D12
Panel background:     #0E1218
Panel elevated:       #121821
Border subtle:        #202A36
Border strong:        #334155
Text primary:         #F8FAFC
Text secondary:       #CBD5E1
Text muted:           #64748B
```

### Status colors

```txt
Normal:   #22C55E
Warning:  #F59E0B
Critical: #EF4444
Offline:  #6B7280
Unknown:  #94A3B8
```

### Dependency colors

```txt
Power:      #FACC15
Cooling:    #38BDF8
Network:    #A78BFA
Dependency: #F97316
Containment:#94A3B8
```

### Incident colors

```txt
Root failure:       #EF4444
Affected warning:   #F59E0B
Affected critical:  #DC2626
Active path:        #FB7185
Countdown emphasis: #FDE68A
```

## Typography

Use clean, technical typography.

Recommended:

```txt
Font: Inter, Geist, Helvetica Neue, system-ui
```

Text style:

```txt
Page title:        18–22px, semibold
Section heading:   12px, uppercase, tracking-wide
Body:              13–14px
Metadata:          11–12px
Map labels:        10–11px, medium
```

Use uppercase sparingly for operational labels:

```txt
INCIDENT QUEUE
ASSET STATUS
DEPENDENCIES
BLAST RADIUS
```

## Spacing

Use compact enterprise spacing.

```txt
Panel padding: 16px
Dense rows:    8–10px vertical
Card gap:      12px
Page gap:      16px
```

## Borders and surfaces

Use thin borders, not heavy shadows.

```txt
border: 1px solid #202A36
border-radius: 12px or 16px
```

Avoid huge rounded corners. This is not a consumer wellness app.

## Icons

Use icons only when they clarify meaning.

Recommended icon style:

- thin stroke
- monochrome by default
- status color only when operationally meaningful

## Motion

Motion should communicate state transitions:

- incident started
- edge activated
- asset status changed
- panel opened
- selection changed

Avoid decorative motion.
