I will implement this as a global design-system correction, not isolated page patches.

Plan:

1. Lock the approved Emerald source of truth
- Use the existing approved emerald style shown on `View All Projects`, `Start exploring`, EOI, handover, Email/Call/Chat.
- Replace restricted green/lime/mint/bright emerald usages with the approved dark emerald ombre.
- Ensure every emerald-filled surface always has pure white text/icons/arrows/ticks at rest and hover.
- Remove white borders around emerald circles, badges, icon holders, and CTA surfaces.

2. Standardize global emerald primitives
- Add/repair reusable classes for:
  - emerald CTA button
  - emerald rectangular CTA, not pill-style
  - emerald icon circle
  - emerald label/badge
  - emerald checklist/tick circle
- Make these primitives win over conflicting CSS guards so champagne/light-surface rules cannot turn emerald text black.

3. Fix project cards and project page spacing globally
- Fix Project Cards, New Off Plan Projects, Dubai/Jebel Ali listing grids, favorites, search results, related projects, and comparison thumbnails to use the same image/card behavior.
- Add safe content padding so cards never touch phone, iPad, desktop, or 4K viewport borders.
- Keep only background bands full-width; cards and filter/header content stay inside the content track and never cross the vertical sidebar.

4. Fix project-card actions and badges
- Heart, shortlist, shortlist badge, ad/top badge, EOI/handover, payment-plan status, and all overlay badges use approved emerald only.
- Any icon inside those circles/badges is pure white.
- Remove restricted green and border artifacts.

5. Fix brochure / interest / branded presentation surfaces
- `Download Brochure`, `Register Interest`, and `Download Branded Presentation` become rectangular premium emerald CTAs with white icon/text, not pill-style.
- Brochure labels, Generate Presentation labels, Project Brochure / floor plan / layout / specification / payment-plan checklist ticks become emerald circles with white ticks/icons.
- Fix the Generate Presentation card contrast, label contrast, box color, and broken text hierarchy.

6. Fix AI Home Finder result/report entry surfaces
- Replace any remaining restricted greens in recommendation cards, badges, ranking chips, brochure actions, and presentation actions.
- Ensure selected chips, labels, CTA buttons, and icon circles use the same approved emerald + pure white content.

7. Fix Mortgage Calculator globally
- Replace light green in mortgage calculator, compared-to-bank-rate indicators, calculator icon cards, labels, and related CTA surfaces with approved emerald.
- `Request Mortgage Introduction` uses the darker emerald as normal state and the current lighter state only as hover if needed.
- Force title/text/icon inside that emerald CTA to pure white at rest and hover.

8. Fix Dubai Market Intelligence / Live Market Data
- `Download Report` buttons use approved emerald with pure white text/icon.
- Repair section/container layout so content does not cross or collide with the vertical sidebar and does not appear glued edge-to-edge.

9. Fix labels across public site and CRM
- Labels like `AI Powered`, CRM badges/labels, filter labels, tool labels, status labels, and metric labels use approved emerald styling when they are accent labels.
- White text/icons only when the label is emerald-filled.

10. Visual validation before completion
- Manually navigate as a user after implementation.
- Capture screenshot proof for the affected areas:
  - Home CTA reference and featured cards
  - Projects/New Off Plan grid
  - Project detail brochure/presentation/payment-plan areas
  - AI Home Finder results
  - Mortgage Calculator
  - Dubai Market Intelligence / Live Market Data
  - CRM label/badge surfaces
- Validate desktop, tablet, and mobile breakpoints for no broken contrast, no edge-touching cards, no sidebar overlap, no horizontal scroll, and no restricted green remnants.