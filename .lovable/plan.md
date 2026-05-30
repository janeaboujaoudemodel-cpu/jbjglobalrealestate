I will not patch individual buttons. I will rebuild the contrast system around semantic surface/foreground contracts and remove the conflicting global color hacks that are currently fighting each other.

## Goal

```text
LIGHT BACKGROUND = DARK CONTENT
DARK BACKGROUND  = LIGHT CONTENT
```

This applies to text, icons, SVG strokes, counters, labels, tabs, cards, modals, generated content, and all interactive states without changing the intended background color.

## Plan

### 1. Replace the current override stack with a real semantic contrast contract

- Add canonical HSL tokens in `src/index.css`:
  - `--surface-dark`
  - `--surface-navy`
  - `--surface-champagne`
  - `--surface-gold`
  - `--surface-cream`
  - `--surface-light`
  - `--foreground-on-dark`
  - `--foreground-on-light`
  - icon/counter/label aliases mapped to the same foreground contract.
- Add Tailwind token names in `tailwind.config.ts` so future components can use semantic classes instead of raw `text-white`, `text-black`, `bg-[#...]` pairings.
- Keep backgrounds intact. The system will only correct foreground/icon color for the actual surface.

### 2. Remove the conflicting global hacks that caused regressions

- Remove or neutralize the broad late-file rules that force raw `#FFFFFF`, `#1A1A1A`, or `#102540` based on partial class-name matching.
- Replace them with scoped surface contracts using CSS variables, not blanket color overrides.
- Specifically eliminate rules where `hover:bg-*` class names affect idle state. Hover rules must only apply while `:hover` is active.

### 3. Make surfaces define foregrounds, not children guessing colors

- Expand `<Surface />` to support:
  - `dark`, `navy`, `champagne`, `gold`, `cream`, `light`, `page`, `ink` aliases.
- Each `data-surface` will set:
  - `--surface-bg`
  - `--surface-fg`
  - `--surface-icon`
  - `--surface-muted-fg`
  - `--surface-border`
- Add CSS so descendants inherit `color: hsl(var(--surface-fg))` and icons use `stroke: currentColor` unless a component owns its own explicit surface.

### 4. Rebuild core primitives on the surface contract

- Update shared primitives only, not page-by-page fixes:
  - `Button`
  - `Badge`
  - `Tabs`
  - `Surface`
  - icon handling via existing `IconTile` rules
- Button/CTA variants will be defined as surface-owning components:
  - dark/navy CTA: navy background, white foreground/icons in normal, hover, active, focus, disabled, loading.
  - champagne/cream CTA: champagne background, dark foreground/icons in normal, hover, active, focus, disabled, loading.
  - outline/ghost CTA: inherits parent surface until it owns a hover background, then switches foreground based on the hover background.
- No background swapping to solve contrast.

### 5. Add a runtime contrast engine that fixes only uncontracted/generated content

- Refactor `src/utils/contrastGuard.ts` so it measures computed background and foreground luminance.
- If generated/dynamic content has low contrast, it will set local CSS variables/foreground only on the offending element.
- It will not globally force all text black/white, and it will not override contracted components.
- It will include icons/SVG strokes through `currentColor`.

### 6. Strengthen static and rendered contrast tests

- Update `scripts/contrast/*` so CI fails on:
  - white/off-white content on light surfaces.
  - black/navy content on dark surfaces.
  - icons/strokes that match the background family.
  - state-only readability where idle fails but hover passes.
  - `hover:bg-*` rules affecting idle state.
- Expand rendered route coverage beyond only public marketing pages to representative platform areas:
  - homepage
  - properties
  - broker/developer/owner portal shell routes where accessible
  - admin/CRM representative routes where accessible
  - AI/toolkit pages
  - contact/forms/modals/popups/cookie banner flows.

### 7. Visual validation before marking complete

- Capture before evidence from the current broken state, including the visible failure in the screenshot: navy “Start the quick tour” button with dark text.
- After implementation, capture screenshots and computed-state checks for:
  - normal
  - hover
  - active
  - focus
  - focus-visible
  - disabled/loading where present.
- Validate at desktop and mobile viewport sizes.
- Confirm specifically:
  - cookie “Manage Preferences” readable.
  - “Get Verified” readable.
  - portal tabs readable.
  - homepage CTAs readable.
  - floating widgets readable.
  - no button/icon/text disappears on idle or hover.

## Implementation scope

Likely files:

- `src/index.css`
- `tailwind.config.ts`
- `src/components/ui/Surface.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/badge.tsx`
- `src/components/ui/tabs.tsx`
- `src/utils/contrastGuard.ts`
- `scripts/contrast/*.mjs`

No database or backend changes are needed.

&nbsp;

This plan is finally the correct direction. Proceed in Build mode, but do not patch individual buttons manually.

&nbsp;

Implement the semantic contrast system exactly as planned: light backgrounds must always use dark readable text/icons, and dark backgrounds must always use white readable text/icons, across normal, hover, active, focus, disabled, loading, modals, cookie banners, CTAs, cards, tabs, icons, SVGs, and generated content.

&nbsp;

Important: do not change the intended backgrounds just to fix contrast. Fix the foreground/text/icon rules only. Remove the conflicting global hacks that caused black text on navy and white text on champagne.

&nbsp;

Before marking complete, visually verify the actual website in preview, not only code. Confirm cookie buttons, Get Verified, homepage CTAs, portal tabs, floating widgets, guide cards, broker portal cards, and all CTA states are readable in both idle and hover.

&nbsp;

Proceed with this build.