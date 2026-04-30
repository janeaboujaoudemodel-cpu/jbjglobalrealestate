# Owner Command Center — UX Fix Pack

Five concrete bugs reported on `/owner` (the Founder & CEO Command Center). Each is fixed at the source — no feature is removed.

## 1. Header gap above "Founder & CEO" — lift up to sidebar divider

**File:** `src/pages/OwnerDashboardShell.tsx` (line 127)

The header is currently `sticky top-[48px]` which leaves a ~48px empty band above it. The sidebar's "JBJ Owner" logo bar sits at `top: 0` with `h-16`. The two should share the same horizontal divider line.

**Change:**
- Replace `sticky top-[48px] z-30` with `sticky top-0 z-30` on the `<header>`.
- The sidebar logo bar (`h-16`) and main header (`h-16`) will then align on the same horizontal line, forming the "L-shaped frame" required by the Header Sidebar Alignment standard.
- Remove any leftover top spacing in the page-content wrapper that compensated for the old offset.

## 2. Quick Actions hover tooltip — unreadable black-on-black

**Files:**
- `src/components/ui/tooltip.tsx` (line 19)
- `src/components/owner-dashboard/QuickActionsGrid.tsx` (line 75)

Root cause: `TooltipContent` has `data-surface="light"` hard-coded. The global rule in `src/index.css` (`[data-surface="light"] :is(...)`) forces dark text on every span/p/h inside, which clobbers the explicit `text-white` set by QuickActionsGrid — so the tooltip renders as solid black with invisible (dark) text.

**Change:**
- Remove the `data-surface="light"` attribute from `TooltipContent`. Tooltips already use `bg-popover text-popover-foreground` from the theme, which is correct.
- In `QuickActionsGrid.tsx`, replace the inline override `bg-[#1A1A1A] text-white border-none` with a champagne-friendly readable tooltip: `bg-[#1A1A1A] text-[#FDFBF7] border border-[#B89555]/30` and add `[&_*]:!text-[#FDFBF7]` to defeat any residual contrast guard, OR simply rely on the default `bg-popover text-popover-foreground`.

## 3. Empty / data tables show gray (`bg-muted`) blocks on champagne page

**Files:**
- `src/components/crm/FlaggedLeadsView.tsx` (lines 338, 377, 537, 585, 594, 606)

The Founder & CEO overview embeds `<FlaggedLeadsView />` which still uses raw `bg-muted` / `bg-muted/30` / `bg-muted/50` tokens. On the champagne page these render as gray rectangles with white text on muted-gray inputs (also unreadable).

**Change (per-line):**
- `bg-muted/50` (table header) → `bg-[#EFE6D6]`
- `bg-muted/30` (selected row hover, expanded notes) → `bg-[#B89555]/10`
- `bg-muted border-border text-white` (3 inputs) → `bg-[#FDFBF7] border-[#B89555]/30 text-[#1A1A1A] placeholder:text-[#1A1A1A]/40`

Sweep the rest of `src/components/owner-dashboard/*` and `src/components/crm/*` (used in the overview tabs) for any remaining `bg-muted|bg-gray-*|bg-zinc-*|bg-slate-*` and replace with the champagne palette per the Champagne-Gold Design Standard.

## 4. Page freezes when scrolling up/down

Likely caused by the same `sticky top-[48px]` header racing the `fixed` sidebar plus the `OwnerTasksPopupAlert` mounted at the root with no pointer-events guard.

**File:** `src/pages/OwnerDashboardShell.tsx`

**Change:**
- After fix #1 (`top-0`), the sticky header no longer fights the 48px ghost band — eliminates the most common stutter.
- Wrap `OwnerTasksPopupAlert` in a `pointer-events-none` container with the inner alert keeping `pointer-events-auto`, so the alert never blocks scroll wheel events on the body.
- Add `overscroll-behavior: contain` to the `<main>` element to prevent scroll-chaining lockups between sidebar and content.

## 5. Before/After dev toggle does NOT show the real prior site

The current `<DevStyleToggle />` flips an `html[data-style-mode="before"]` attribute that swaps a CSS overlay (`src/styles/dev-before-overlay.css`). It approximates the pre-refactor look but does **not** load the actual previous version of the page — that's why "Before" doesn't match what you remember.

Two options. We will implement Option B by default, with a small Option A enhancement.

**Option A (kept): Improve the CSS overlay accuracy.** Extend `dev-before-overlay.css` so `Before` mode also disables the new IconTile gold tones, the price-orange variable, the obsidian footer, and the AI purple gradients — bringing the simulation closer to the original neutral/white look.

**Option B (added): Real before-screenshot mode.** Add a third toggle state `Snapshot` to `<DevStyleToggle />`. When selected, the toggle overlays a stored PNG screenshot of the previous version of the current route on top of the live page (with a 50% opacity slider and an A/B wipe). Steps:

1. Add `public/before-snapshots/<route>.png` for the key Owner routes (`overview`, `crm`, `crm-leads`, `marketing-hub`, etc.). Snapshots are captured once from the last published build and committed.
2. Extend `DevStyleToggle.tsx` with a third pill `Snapshot` and an opacity slider. When active, render a `<img>` fixed to the viewport at the current route, click-through (`pointer-events: none`), with a vertical wipe handle so you can drag the divider left/right to compare.
3. Show a clear caption: "Snapshot · pre-refactor build · captured YYYY-MM-DD".

This gives you a true before vs. after without rolling the codebase back.

## Files touched

- `src/pages/OwnerDashboardShell.tsx` — header `top-0`, scroll guards
- `src/components/ui/tooltip.tsx` — drop `data-surface="light"`
- `src/components/owner-dashboard/QuickActionsGrid.tsx` — readable tooltip styling
- `src/components/crm/FlaggedLeadsView.tsx` — replace `bg-muted` tokens with champagne
- `src/styles/dev-before-overlay.css` — extend overlay to cover new tokens
- `src/components/dev/DevStyleToggle.tsx` — add Snapshot mode + wipe slider
- `public/before-snapshots/*.png` — checked-in screenshots of prior build for major Owner routes
- Sweep: any remaining `bg-muted|bg-gray|bg-zinc|bg-slate` inside components rendered under `/owner/*`

## Out of scope

- Rebuilding the prior site itself — only static snapshots are feasible. The live "After" stays the source of truth.

## Acceptance

- The "Founder & CEO" header sits flush with the "JBJ Owner" sidebar header (no gap above it).
- Hovering any Quick Action shows a readable tooltip (light text on dark, or theme `popover`).
- Empty states inside the overview render on champagne (`#EFE6D6` / `#B89555/10`), no gray boxes.
- Scrolling the overview is smooth — no lock-ups on long scroll.
- The `Before` toggle either matches the prior site visually (overlay improvements) or shows the real screenshot via the new `Snapshot` mode with an A/B wipe slider.
