
# Emerald Polish — Final Pass

Apply the existing `jj-emerald-metallic` animated ombre (deep emerald #064E3B → #042c1c with sweep animation, white text/icons) consistently to every surface called out below. Restore the Contact us tag. Validate each with a screenshot.

## 1. Header sq ft / sq m toggle (HorizontalUtilityBar)
- Active segment must use `jj-emerald-metallic` shimmer (same ombre + sweep keyframes as the gold version had), not flat dark green. Inactive segment stays transparent on champagne pill with ink text.

## 2. Property card Email / Call / Chat pills (ProjectCard + ReellyProjectCard)
- Replace per-button styling with a single locked class `jj-pill-emerald-metallic` that:
  - applies the animated emerald ombre fill
  - forces white text + white icon at idle/hover/focus/active via `data-allow-dark-cta` + `data-on-dark` + `allow-white`
  - keeps current rounded pill shape
- Add a PASS 35 CSS block in `index.css` that wins against every contrast guard for `.jj-pill-emerald-metallic` (and `[data-emerald-pill]`).

## 3. Top Areas in Dubai (AreasWeCover)
- "TOP AREAS" eyebrow, "TRENDING" + "HIGH DEMAND" chips, and per-card "EXPLORE →" CTA all use `jj-emerald-metallic` with white text + white arrow.
- Explore button must be one single pill (icon + label + arrow inside one element, no split background).

## 4. Mortgage Calculator (MortgageCalculator.tsx)
- All section cards (Residency & LTV, Affordability, One-time Fees, Compare Two Bank Rates, Amortization) re-skinned: champagne raised surface with 1px gold hairline + emerald metallic headers/labels for KPI rows.
- Compare Two Bank Rates: the comparison slider becomes the emerald metallic track + emerald thumb; fix the broken drag interaction (ensure the `<input type="range">` is not covered by an overlay and `pointer-events: auto` + `touch-action: none` on track).
- Equalize card heights via grid `auto-rows-fr` so cards align (the screenshot shows a stretched One-time Fees card).
- Bottom CTAs ("Try Our AI Mortgage Calculator", "Connect With Mortgage Partners") → emerald metallic with white labels/icons.

## 5. Get In Touch / Ready to get started card (CTABand or footer CTA)
- Reduce overall padding (py-12 → py-8, max-w shrunk) and tighten the three WhatsApp/Call/Email tiles.
- "GET IN TOUCH" eyebrow + the three contact tiles use `jj-emerald-metallic` (already close — re-lock to the canonical class).
- Stay In The Loop email input: add the same rotating placeholder typing animation used by the hero search bar (reuse the hook/component from HomeHeroSearch).

## 6. Footer
- Replace any flat green (`bg-emerald-700`, etc.) with `jj-emerald-metallic` for the contact tiles, send button, and the Privacy/Cookies/Sitemap link row hover.

## 7. Filter sheet (NewOffPlanProjects modal)
- Restyle inputs, selects, sliders, toggles, heart, "Clear all", search icon to the emerald system:
  - Selects + search input: champagne surface, 1px gold hairline, ink text, emerald focus ring.
  - Slider track: emerald metallic fill, emerald thumb.
  - "Post handover plans only" toggle: emerald metallic when on.
  - Heart icon: emerald outline → emerald metallic fill when active.
  - "Show 813 projects" CTA: already dark — re-lock to `jj-emerald-metallic`.
  - "Clear all": outline ghost with emerald hover.

## 8. Collapsed vertical sidebar — collapse/expand button
- When `.jj-vertical-nav-collapsed` is active, the chevron tile must render emerald metallic with white icon at idle AND hover (no gold/champagne flip, no white-on-light). Override the legacy gold rule from previous passes and the `:hover` contrast guard.

## 9. Restore Contact us vertical tag (SupportLauncher)
- The "Contact us" rotated tag was removed. Re-mount the right-edge vertical pill (the phone button stays separate). Use `jj-emerald-metallic` ombre.

## Implementation files
- `src/index.css` — add PASS 35 block: `.jj-pill-emerald-metallic`, locked sidebar collapse rule, filter-sheet field overrides, footer green→emerald remap, white-text/icon enforcement for all `[data-emerald-pill]`.
- `src/components/navigation/HorizontalUtilityBar.tsx` — sq ft / sq m active class.
- `src/components/ProjectCard.tsx` + `src/components/ReellyProjectCard.tsx` — swap Email/Call/Chat classes.
- `src/components/home/AreasWeCover.tsx` — chips + Explore pill unification.
- `src/components/MortgageCalculator.tsx` — card grid, slider fix, CTA classes, comparison slider rebuild.
- `src/components/home/CTABand.tsx` (Ready to get started + Stay in the Loop) — compact sizing + animated placeholder + emerald lock.
- `src/components/home/HomepageBookMarquee.tsx` or footer component — green→emerald.
- Filter modal component (find via `New Off Plan Projects` string).
- `src/components/support/SupportLauncher.tsx` — restore Contact us tag.
- Sidebar collapse component (GlobalVerticalNav or SidebarModePortalBlock).

## Validation
After each group of edits, use browser--view_preview + screenshot:
1. Header toggle (top-right)
2. Property card row
3. Top Areas section
4. Mortgage Calculator (full page incl. Compare Bank Rates + slider drag)
5. Footer CTA
6. Filter modal (open it)
7. Sidebar collapsed + hovered
8. Contact us tag visible on right edge

Reject and re-fix any group whose screenshot does not show emerald metallic + white text/icons + the requested layout change.
