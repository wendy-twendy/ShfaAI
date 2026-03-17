# Design System — Prompt Injection Defense Dashboard

## Direction
Security operations workstation. Dark-first. The person using this is a security researcher toggling defense layers, selecting poisoned documents, and comparing outcomes. The feel: vigilant, methodical, data-dense — like a network traffic analyzer or firewall rule console.

## Palette
- **Background:** Deep slate with slight blue shift — `oklch(0.13 0.01 260)` — command center darkness
- **Surfaces:** Whisper-quiet elevation shifts — card `oklch(0.17 0.01 260)`, popover `oklch(0.19 0.01 260)`
- **Primary (safe/active):** Terminal green — `oklch(0.72 0.19 155)`
- **Destructive (threat/blocked):** Crimson — `oklch(0.65 0.2 25)`
- **Warning (flagged):** Amber — `oklch(0.78 0.14 70)`
- **Scanning (processing):** Steel blue — `oklch(0.65 0.15 260)`
- **Text:** Off-white `oklch(0.93 0.005 260)`, muted `oklch(0.55 0.01 260)`
- **Borders:** Low-opacity white `oklch(1 0 0 / 8%)` — edges, not lift

## Depth Strategy
**Borders-only.** No shadows. Terminal-like definition through edges. Higher elevation = slightly lighter surface. Sidebar and main content share the same background, separated by a border.

## Typography
- **Sans:** Geist Variable — technical, precise, not decorative
- **Mono:** GeistMono Variable — for data, model names, latency values
- **Sizes:** Dense — 10px for metadata/labels, 11px for section headers, 12px (text-xs) for most content, 13-14px for primary text

## Spacing
- **Base:** 4px
- **Component padding:** 8px (p-2) for compact items, 16px (p-4) for sections
- **Section gaps:** 24px (space-y-6) between sidebar sections
- **Item gaps:** 4px (space-y-1) between list items

## Radius
- **Base:** 0.5rem (8px) — slightly sharp, technical feel
- **Buttons/inputs:** radius-sm (0.3rem)
- **Cards:** radius-lg (0.5rem)

## Semantic Colors
Custom CSS variables available as Tailwind utilities:
- `text-safe` / `bg-safe` — terminal green, for allowed/active
- `text-threat` / `bg-threat` — crimson, for blocked/detected
- `text-warning` / `bg-warning` — amber, for flagged
- `text-scanning` / `bg-scanning` — steel blue, for processing

## Component Patterns

### Pipeline Layer Toggle
- Vertical stack with L1-L6 numbered indicators (green when active, muted when off)
- Green connector lines between active layers
- Each row: indicator → icon + name + latency → description → switch
- Active rows have subtle `bg-primary/5` highlight

### Document Checkbox Row
- Checkbox + truncated title + attack-type badge (destructive variant, first word only)
- Grouped by category with uppercase tracking-wider headers

### Section Headers
- 11px uppercase, tracking-wider, muted-foreground
- Optional leading icon (3x3)

### Tab Navigation
- Underline style (border-b-2 on active) — no background highlights
- Icons + labels, gap-1.5
- Transparent background for tabs list
