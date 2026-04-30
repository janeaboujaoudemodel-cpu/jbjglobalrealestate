## Problem

In the Owner Dashboard shell (and similar shells across the site), the horizontal header containing **"Founder & CEO / Jane Bou Jaoude — Executive Command Center"** does not align with the sidebar's first divider (the line under **"JBJ Owner"**). The "Founder & CEO" title sits visually lower than the sidebar's logo divider, breaking the L-shaped frame standard.

Both bars are nominally `h-16` (64px), but a small gap appears at the top of the right-hand header, causing the bottom borders to be misaligned. The same alignment issue likely repeats in other shell layouts.

## Root cause

- The sidebar logo block uses `h-16` with no internal padding shift.
- The main `<header>` is `h-16 sticky top-0`, but its content (`<h1>` + `<p>`) is centered with `items-center`, and the dual-line text combined with `tracking-wide` lifts the visual baseline. Combined with the `backdrop-blur` and shadow, the perceived border position drifts a few pixels.
- More importantly, there is no shared height token — sidebar header, top header, and any banner offsets are hard-coded `h-16` in multiple files, so they drift independently when one is touched.

## Fix

### 1. Lock header alignment in `OwnerDashboardShell.tsx`

- Both the sidebar logo block and the main `<header>` will use the exact same height class and box model: `h-16 min-h-16 max-h-16` and identical `border-b border-[#B89555]/30`.
- Remove any padding/margin that pushes the title down. Title block becomes `flex flex-col justify-center leading-tight` so the two lines stay vertically centered without overflow.
- Confirm `<main>` has no `pt-*` / no implicit margin; the sticky `<header>` sits flush at `top-0`.

### 2. Introduce a shared header-height token

Add `--shell-header-h: 64px` to `src/index.css` under the existing design-tokens block, and replace the hard-coded `h-16` in:

- `src/pages/OwnerDashboardShell.tsx` (sidebar logo + top header)
- `src/pages/JBJBrokerDashboard.tsx` shell header (broker dashboard)
- `src/pages/InvestorDashboard.tsx` shell header
- `src/components/jbj-broker/JBJSidebar.tsx` (logo block)

Each becomes `style={{ height: 'var(--shell-header-h)' }}` (or a Tailwind arbitrary class `h-[var(--shell-header-h)]`), guaranteeing every shell's logo block + top header are pixel-identical.

### 3. Title block tightening

In each shell header where a two-line title appears:

- Container: `flex flex-col justify-center leading-tight gap-0`
- Title `<h1>`: `text-sm md:text-base font-semibold tracking-wide`
- Subtitle `<p>`: `text-xs text-[#5A4A2E]`

This removes the perceived top gap above "Founder & CEO" so its baseline matches the sidebar divider.

### 4. Memory update

Update `mem://ui-ux/navigation/header-sidebar-alignment-standard-v11-locked` (already exists) with the `--shell-header-h` token rule so future shells inherit the lock automatically.

## Files to edit

- `src/index.css` — add `--shell-header-h: 64px` token
- `src/pages/OwnerDashboardShell.tsx` — apply token + title tightening
- `src/pages/JBJBrokerDashboard.tsx` — same
- `src/pages/InvestorDashboard.tsx` — same
- `src/components/jbj-broker/JBJSidebar.tsx` — apply token to logo block
- `mem://ui-ux/navigation/header-sidebar-alignment-standard-v11-locked` — add token rule

## Out of scope

- No restructure of sidebar nav, no color changes, no removal of any feature (per No-Removal policy).
- Mobile sheet header keeps current behavior; only the desktop shell alignment is being locked.