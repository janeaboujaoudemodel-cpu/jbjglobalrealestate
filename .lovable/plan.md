# Contrast Architecture — Final Cleanup

## Problem

`src/index.css` (4,272 lines) and `src/styles/theme-tokens.css` (1,177 lines) currently contain **826 `!important` declarations** and **131 hard-coded `color: white/#FFFFFF/#1A1A1A` overrides** competing with each other. Every "fix" so far has stacked another guard on top of the previous one instead of removing the conflicting rule, which is why hover-only bugs, label/pill mismatches, and white-on-champagne regressions keep reappearing in different places.

The Two-Rule Contrast Contract at the end of `index.css` (lines 4170–4267) is correct, but it is buried under ~30 legacy "GUARDS" / "PASSES" / "LOCKS" that were marked "NEUTRALIZED" in comments yet still ship `!important` color rules. They keep winning by specificity in specific DOM shapes — that is the conflict the user keeps seeing.

## Goal

Keep only **one** contract:

- **Rule A** — `data-surface="dark|navy|ink"` / `.surface-*` / `.jj-cta-dark` / `.jj-navy-cta` / `[data-hero-consultation-lock]` / `[data-photo-copy-lock]` → white text + icons.
- **Rule B** — `data-surface="page|light|champagne|cream|raised|gold"` / `.surface-*` / `.jj-cta-champagne` / `.jj-pill-active` / `.jj-cta-outline` / `.jj-favorite-trigger` → ink `#1A1A1A` text + icons.

Everything else that forces a text color is deleted. Background, border, ring, gradient, shadow, layout, and animation rules stay untouched.

## Scope

### 1. `src/index.css` — strip every legacy color-forcing block

Delete bodies (keep one-line "removed" comments) of these blocks, identified by the existing markers in the file:

- L60–70  signed-in-on-dark `color:#fff !important` block
- L620–625 generic `.text-on-dark` `!important` repaint
- L2030–2040 monochrome active-state white override
- L2500–2540 "MODERN CHAMPAGNE/GOLD CONTRAST GUARD" + "LEGACY LIGHT-SURFACE INTERACTIVE LABEL GUARD"
- L2630–2660 stray `color:#ffffff !important` pair (button/link forcers)
- L2850–2860 "stubbornly-dark surface" white override
- L2980–3080 "LEGACY PASS CONTRAST GUARDS" + "LEGACY ICON VISIBILITY COLOR GUARD" + "LEGACY TEXT/INTERACTIVE CONTRAST GUARD"
- L3290–3300 marketing-page surface remap remnants
- L3400–3420 white `!important` pair near CRM scope
- L3490–3590 "CRM-SCOPE NO-BLUE GUARD" color-forcing rules (keep background/border, drop `color:`)
- L3880–3900 "LEGACY NAVY ACCENT PASS"
- L4090–4160 duplicate own-box color rules + the global `transition-property` `!important` on every `:where(a,button,…)` (this rule fights hover restyles)
- L4154–4163 `[data-sidebar-gold-label]` hover ink override (move to component file if still needed; remove `!important`)
- L4246–4267 "LEGACY DARK-DEFAULT CLASS LIGHT-ANCESTOR GUARD" (the Two-Rule block already handles this via class additions on those components — see step 3)

Keep intact:
- Tailwind layer setup, `@font-face`, `:root` token definitions, keyframes, scrollbar, focus-ring, `.jj-band` system, `.jj-cta-*` background/border definitions, hero/photo locks (already part of Rule A), `.jj-favorite-trigger` (already Rule B).
- The Two-Rule Contract block at L4170–4239.

### 2. `src/styles/theme-tokens.css` — strip every `color:` `!important`

This file is supposed to be **tokens only** (CSS variables + base layer). Remove all 369 `!important` color overrides (lines 164, 182–190, 292–308, 340, 387–400, 465–466, 508–536, 550–613, 629–700, … through EOF). Keep:
- `:root`, `.dark`, `.surface-*` variable assignments
- Base reset (`*` border-color, `body` bg/text via `var(--foreground)` *without* `!important`)
- Token utility classes that only set background/border (no color forcing)

### 3. Migrate the few legitimate hard-coded labels to surface markers

The legacy guard at L4246 exists because some classes (`.jj-inactive-item`, `.jj-tab-inactive`, `.jj-sort-inactive`, `.jj-role`, `.jj-label`, `.jj-section-label`, `.jj-profile-role`, `.jj-gold-accent`) were authored white-by-default. Instead of guarding them globally:

- Change their base definition to `color: inherit` so they pick up whichever surface they land on.
- Components that still need an explicit gold accent keep `.jj-gold-accent` with `color: hsl(var(--jj-gold-border))` (no `!important`) — this is allowed because Rule B intentionally excludes gold-accent text via the `:not(.jj-gold-accent)` whitelist we add in step 4.

### 4. Tighten the Two-Rule block (single edit)

Add one `:not(.jj-gold-accent):not([data-allow-gold])` to both Rule A and Rule B selectors so:
- "by Developer Name" gold tokens, gold price tags, and gold hairline labels are preserved.
- Everything else collapses to white-on-dark / ink-on-light deterministically.

### 5. Re-verify the cases the user has flagged

After the cleanup, walk these viewports and confirm hover + idle states:
- `/founder` — founder hero, KPI tiles, command-center sections
- `/about` — feature cards (the recent regression)
- `/careers` — `PremiumJobCard` pill/label that started this thread
- `/property/:slug` — price pill, developer link, handover badge
- Header + sidebar — sign-out, mode chip, account dropdown
- Owner dashboard — CRM tabs, sort dropdown, segmented controls

For each: champagne sections must have ink text and gold accents; navy/ink boxes must have white text and white icons; gold pills stay champagne fill + ink text + 1px gold ring; nothing reverts on `:hover`.

## Out of Scope

- No component refactors beyond the class swaps in step 3.
- No changes to background colors, gradients, shadows, layout, animation timings.
- No changes to `tailwind.config.ts`, `backend.ts`, business logic, or routes.
- No removal of features, sections, or content (per the "No Removal" policy).

## Files Touched

- `src/index.css` — large deletion, no additions beyond the one `:not()` extension on the Two-Rule block.
- `src/styles/theme-tokens.css` — strip all `color: !important` rules; keep tokens.
- A handful of component CSS class definitions only if step 3 surfaces a class whose default needs to change from `text-white` to `color: inherit`.

## Risk & Validation

Risk is concentrated in dark heroes that previously depended on the legacy guards to force white text on raw children. Mitigation: every dark hero already carries `[data-surface="dark"]` or `[data-hero-dark]` or `[data-photo-copy-lock]`; the Two-Rule contract covers all three. Any hero that does not will be tagged in the same pass.

Validation steps:
1. Run `scripts/contrast/check-contrast-architecture.mjs` + `check-white-on-light.mjs` → expect 0 failures.
2. Visual sweep of the six viewports above at idle + hover.
3. Confirm the user's original example (label under "content creator / videographer" in `PremiumJobCard`) renders ink on champagne on the active pill.

Once approved I will execute the cleanup in build mode in a single pass.
