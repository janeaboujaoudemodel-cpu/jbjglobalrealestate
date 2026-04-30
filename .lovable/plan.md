# Expand Dev Before/After Toggle to Show Full Pre-Refactor State

## Problem

The floating **DEV · Before / After** chip (bottom-right, owner-only, beneath the chat support button — `src/components/dev/DevStyleToggle.tsx`, hotkey Shift+B) flips `<html data-style-mode="before|after">`. The matching overlay (`src/styles/dev-before-overlay.css`) currently rewrites only ~8 rules:

- Body/list opacity 0.8
- Eyebrow tracking 0.05em
- H2 sized down to 1.5rem
- H3 weight 500
- Faded gold on chips
- White-on-image dimmed
- Drop-shadow stripped
- Hero composite reverted

But over the last several rollouts we changed *far* more: champagne surfaces, IconTile primitive, gold-active tabs/CTAs, price-orange, semantic data colors (emerald/red/blue/amber), adaptive hairlines, AI purple gradients, footer obsidian, header L-frame offsets, white→champagne backgrounds, gray→ink text, etc. None of that gets reverted when toggling Before, so reviewers only see a sliver of what actually changed.

## Goal

When the owner toggles **Before**, the page must visually match the pre-refactor build as closely as a CSS-only overlay can. Side-by-side review (current build in another tab/window with overlay off) then reflects the *full* diff of every rollout.

Scope: presentation only — no layout, structural, or routing changes. Owner-only; production gate (`import.meta.env.DEV` + owner check) stays.

## Plan

### 1. Audit what "before" should look like

Cross-reference recent memory entries to enumerate every visual rollout that needs reverting:

- Champagne surfaces: page #FDFBF7, surface #F7F2EA, raised #EFE6D6 → revert to plain white / `bg-background`
- IconTile primitive (gold/emerald/red/blue/amber/purple/rose/ink tones) → bare lucide stroke in `text-muted-foreground`
- Gold-active TabsTrigger (`bg-[#B89555] text-white`) → previous `bg-primary text-primary-foreground` look
- Gold CTA buttons → previous black/primary buttons
- `--price-orange` token on prices → previous `text-foreground`
- Semantic data colors on KPIs → previous neutral
- AI purple gradient surfaces → previous gold/teal cards
- Adaptive hairlines (`<AdaptiveHairline />`) → flat `border-t border-border`
- Footer obsidian + champagne hairline → previous mixed footer
- Headings (Inter weights, ink #1A1A1A) → previous lighter tracking
- Gray-to-ink swaps (`text-gray-*` removed, `text-[#1A1A1A]` applied) → revert to `text-zinc-500/600`
- White-on-light contrast guard wins → re-allow faded white
- Faded gold prohibition → re-allow `text-gold/60`

### 2. Rewrite `src/styles/dev-before-overlay.css`

Group rules into clearly-labeled sections. All rules are `!important`-scoped under `html[data-style-mode="before"]`. Use attribute selectors that match the literal classnames/tokens we've shipped, so the overlay catches them without touching JSX:

```text
/* SURFACES */
html[data-style-mode="before"] [class*="bg-[#FDFBF7]"],
html[data-style-mode="before"] [class*="bg-[#F7F2EA]"],
html[data-style-mode="before"] [class*="bg-[#EFE6D6]"] {
  background-color: #ffffff !important;
  background-image: none !important;
}

/* INK TEXT → muted gray */
html[data-style-mode="before"] [class*="text-[#1A1A1A]"] {
  color: #3f3f46 !important; /* zinc-700 */
}

/* GOLD ACTIVE TABS → pre-refactor primary */
html[data-style-mode="before"] [data-state="active"][class*="bg-[#B89555]"] {
  background-color: hsl(var(--primary)) !important;
  color: hsl(var(--primary-foreground)) !important;
}

/* GOLD CTAs → previous black */
html[data-style-mode="before"] button[class*="bg-[#B89555]"],
html[data-style-mode="before"] a[class*="bg-[#B89555]"] {
  background-color: #1a1a1a !important;
  color: #ffffff !important;
}

/* ICON TILES → bare icons */
html[data-style-mode="before"] [data-icon-tile] {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  padding: 0 !important;
  border-radius: 0 !important;
}
html[data-style-mode="before"] [data-icon-tile] svg {
  color: #71717a !important; /* zinc-500 */
}

/* PRICE ORANGE → neutral */
html[data-style-mode="before"] [style*="--price-orange"],
html[data-style-mode="before"] [class*="text-[hsl(var(--price-orange))]"] {
  color: #18181b !important; /* zinc-900 */
}

/* SEMANTIC DATA COLORS → neutral */
html[data-style-mode="before"] [class*="text-emerald-"],
html[data-style-mode="before"] [class*="text-amber-"],
html[data-style-mode="before"] [class*="text-blue-"],
html[data-style-mode="before"] [class*="text-red-"] {
  color: #52525b !important;
}

/* AI PURPLE → previous gold/teal */
html[data-style-mode="before"] [class*="from-violet-"],
html[data-style-mode="before"] [class*="to-purple-"],
html[data-style-mode="before"] [class*="bg-violet-"] {
  background-image: none !important;
  background-color: rgba(184, 149, 106, 0.08) !important;
}

/* ADAPTIVE HAIRLINES → flat */
html[data-style-mode="before"] [data-adaptive-hairline] {
  background: hsl(var(--border)) !important;
  opacity: 1 !important;
}

/* FOOTER OBSIDIAN → previous footer */
html[data-style-mode="before"] footer[data-footer="corporate"] {
  background-color: #ffffff !important;
  color: #3f3f46 !important;
}
```

(Rules above are illustrative; the implementation file will list each rollout with a comment header.)

### 3. Add a small data-attribute hook to `IconTile` and `AdaptiveHairline`

These primitives are unique opt-ins to the new design language, so we add `data-icon-tile=""` and `data-adaptive-hairline=""` to their root elements. This is a one-line, non-visual change per file and gives the overlay a precise selector instead of brittle classname matching.

Files:
- `src/components/ui/icon-tile.tsx` (add `data-icon-tile=""` on root)
- The component(s) implementing `<AdaptiveHairline />` (add `data-adaptive-hairline=""`)

### 4. Footer marker

Add `data-footer="corporate"` to the corporate footer root so the overlay can revert it without false positives. (One line in `src/components/Footer.tsx`.)

### 5. Keep the existing rules

Don't drop the current 8 rules — fold them into the new file under their own labeled section ("Typography (original v1)").

### 6. Visual badge & hotkey unchanged

Keep the floating "BEFORE" pill, Shift+B hotkey, collapse button, and localStorage persistence as-is.

## Files Changed

- `src/styles/dev-before-overlay.css` — rewritten with the full set of rollout-revert rules grouped by section
- `src/components/ui/icon-tile.tsx` — add `data-icon-tile=""`
- `src/components/Footer.tsx` — add `data-footer="corporate"`
- `src/components/ui/AdaptiveHairline.tsx` (or wherever it lives) — add `data-adaptive-hairline=""`

No JSX/structural changes elsewhere. No new components. No DB. Owner-only gate stays.

## Out of Scope

- Reproducing the *exact* pre-refactor pixel output (impossible from CSS alone)
- Reverting layout-level changes (header L-frame offset, sidebar widths). These are structural and not safe to flip via CSS.
- Adding the toggle to non-owner users.
