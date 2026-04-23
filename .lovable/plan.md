

## Goal

Make each user mode visually distinct with a dedicated color across the **mode dropdown**, the **active header pill**, and the **footer mode indicator** — and guarantee the selected mode never silently changes.

## Color assignment (one per category)

Lock these semantic colors to each mode and reuse them everywhere the mode is shown:

| Mode | Color | Token |
|---|---|---|
| Investor | Emerald | `emerald-500` |
| Broker | Blue | `blue-500` |
| Investor + Broker | Purple | `purple-500` |
| Developer | Amber | `amber-500` |

Each color gets a consistent triple: `bg-{color}/10`, `border-{color}/40`, `text-{color}`. Already partially defined in `MODE_CONFIG` in `src/components/ModeSwitcher.tsx` — will be normalized and reused.

## Changes

### 1. `src/components/ModeSwitcher.tsx` — dropdown clarity

- **Every row** in the dropdown renders in its own mode color (icon tile, label text, hover state) — not just the active one. So the user can scan and instantly associate color ↔ mode.
- **Active row**: stronger fill (`bg-{color}/15`), full colored border, colored check icon, and a subtle ring so the current selection is unmistakable while open.
- **Trigger pill (header)**: already uses `currentConfig.bgColor` + `currentConfig.color`. Will tighten so the icon, label, and chevron all inherit the same mode color → the closed pill matches the highlighted row in the dropdown 1:1.
- Remove any neutral gray hover that currently overrides the mode color on inactive rows.

### 2. Footer mode indicator — consistent color

Audit footer for any mode display. Two cases:

- **If `ModeSwitcher` is already rendered in the footer**: it will inherit the new colored styling automatically.
- **If the footer shows mode via separate markup** (e.g. a "Mode: Investor" label): wire it to `useUserModeContext()` and apply the same `MODE_CONFIG` color triple so footer ↔ header ↔ dropdown all match.

I'll locate the footer mode display during implementation and align it.

### 3. Mode stability — never auto-change

Reinforce the existing rule from `mem://architecture/state/user-mode-persistence-standard`:

- `UserModeContext` already protects local selection from being overwritten by DB sync (only adopts DB mode when localStorage is empty). Will verify no other code path calls `setMode` automatically.
- Audit `useUserMode`, `useUserRole`, `Dashboard.tsx` redirects, and any `useEffect` that might call `setMode(...)` without explicit user action. Any auto-set found gets removed.
- Add a small guard log when mode changes so future regressions are visible: `console.info('[UserMode] setMode by user:', newMode)` only inside the `setMode` callback (which is only invoked from the dropdown click handler).

### 4. No removal

Per the No-Removal policy: no rows, modes, descriptions, or footer links are removed. Only colors/styles change and the footer mode badge gets wired to context if not already.

## Files touched

- `src/components/ModeSwitcher.tsx` — dropdown + trigger color polish
- `src/components/Footer.tsx` (or whichever file renders the footer mode indicator — confirmed during implementation) — color-sync mode badge
- `src/contexts/UserModeContext.tsx` — verify no automatic `setMode` paths; add safety log only

## Out of scope

- No changes to mode logic, role gating, routing, or the 4 mode definitions themselves.
- No new modes, no removed modes, no copy changes.

