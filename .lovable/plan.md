## What I found

The current failures are not random page bugs; they come from two still-conflicting contrast layers:

1. **`src/styles/theme-tokens.css` is imported before `src/index.css`, so later `index.css` rules can still win.**
2. **Careers `/join` has a local broad repaint conflict:**
   - `.careers-card-navy :is(..., span, div)` forces all text inside the navy section to white.
   - Later `.careers-card-navy .careers-card-strong ...` forces all text in job cards to ink.
   - Then `.careers-navy-cta` tries to force Apply buttons white.
   - This competing stack is why the screenshot shows normal/rest button text wrong while hover can look correct.
3. **Owner sidebar screenshot issue is local component conflict, not the vertical nav exception:**
   - `OwnerDashboardShell.tsx` Sign Out button uses inline `style={{ color: "#1A1A1A" }}` and no protected destructive contrast attributes/classes.
   - That allows white/incorrect inherited text on champagne states in the expanded owner shell.
4. **There are still broad legacy “force all descendants” selectors in the contrast architecture**, especially page/section scoped selectors that repaint `span/div/*` rather than only primitives. These are the rules that keep beating component intent.

## Fix plan

1. **Clean existing contrast rules only — no new contrast system**
   - In `src/styles/theme-tokens.css`, remove/narrow the broad descendant repaint selectors that target every `span/div` inside `.careers-card-navy` and `.careers-card-strong`.
   - Keep only explicit element/primitive locks:
     - navy section headings/copy = white
     - champagne job card content = ink
     - `.careers-navy-cta` button and its direct label/icon = white at rest, hover, focus, active
   - Remove duplicated careers CTA/button override blocks that compete with each other.

2. **Fix the proven `/join` rest-state button bug**
   - Update `PremiumJobCard.tsx` Apply button to use the locked CTA primitive consistently (`jj-cta-dark` / `careers-navy-cta`) and remove inline child-only color hacks that depend on ancestor rules.
   - Update the “View all positions” button so it is either champagne+ink or navy+white consistently, not caught between outline/default/global styles.

3. **Fix the proven `/owner` Sign Out bug without touching the collapsed vertical sidebar exception**
   - Update only `OwnerDashboardShell.tsx` bottom Sign Out button so it is destructive red-on-champagne at rest and hover, matching the protected `data-signout-action` pattern already used in `GlobalVerticalNav.tsx`.
   - Do not change the collapsed vertical sidebar gold label exception.

4. **Audit/remove remaining winning broad selectors in CSS**
   - Check `index.css` and `theme-tokens.css` for selectors that repaint broad descendants such as `*`, `span`, `div`, or all text inside a surface.
   - Keep only scoped primitive locks already defined by the architecture: `.jj-cta-dark`, `.jj-cta-champagne`, `.jj-pill-active`, `.jj-cta-outline`, phone trigger, signout action, and specific hero/video locks.

5. **Visual validation before saying fixed**
   - Use browser screenshots after implementation on:
     - `/join` at the open positions section: Apply buttons and View all positions at rest and hover.
     - `/owner`: expanded sidebar Sign Out and main owner content.
     - `/` and one marketing page: ensure no regression to white-on-champagne or ink-on-navy.
   - Only report complete if screenshots/computed styles confirm no black/blue text on navy buttons and no white text on champagne/gold buttons.

## Files to edit

- `src/styles/theme-tokens.css`
- `src/components/careers/PremiumJobCard.tsx`
- `src/pages/JoinApplication.tsx`
- `src/pages/OwnerDashboardShell.tsx`
- `src/index.css` only if the final audit finds another broad winning selector that must be removed/narrowed