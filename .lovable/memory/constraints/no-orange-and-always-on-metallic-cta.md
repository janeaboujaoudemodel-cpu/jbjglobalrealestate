---
name: No Orange — Metallic Champagne-Gold Replacement
description: All orange handover/status pills, recommended badges, and "Ready" indicators on listings/projects are retired. Replace with metallic champagne-gold via `.jj-cta-gold-metallic` or `HandoverPill`. Phone country-code trigger is champagne (never black). Inside-page primary CTAs (Register Interest / Request Consultation / Request a Call Back / Submit Report / Download/Request Brochure) MUST use `.jj-cta-gold-metallic` with continuous shimmer + sheen animation at rest (hover only intensifies).
type: constraint
---

# No Orange + Always-On Metallic CTA

## Banned
- `bg-orange-*`, `text-orange-*`, `border-orange-*`, `#F97316`, `#EA580C` on any project/listing card, handover pill, recommended-project badge, or status indicator.
- Black (`#0A0A0A`/`#1A1A1A`/`bg-black`) fills on the phone country-code trigger (`[data-phone-code-trigger]`) or any form input border.
- Hover-only metallic animation on `.jj-cta-gold-metallic` — the shimmer + sheen MUST run continuously at rest.

## Required
- `HandoverPill` renders `.jj-cta-gold-metallic` (metallic champagne-gold), never orange.
- Legacy `.handover-orange` CSS in `src/index.css` resolves to the metallic champagne-gold treatment.
- `[data-phone-code-trigger]` global locks (in `src/index.css`, `src/styles/theme-tokens.css`) use champagne fill (`#FDFBF7` → `#F7F2EA`), 1px gold hairline, ink text/icons.
- All JBJ form inputs/triggers/dropzones use soft gold hairline `rgba(184,149,85,0.55)` — never black borders.
- `.jj-cta-gold-metallic` runs `jj-cta-gold-shimmer` (4.5s) + `jj-cta-gold-sheen` (3.8s) infinite at rest; hover shortens to 2.2s / 1.6s.

## Apply to
Register Interest · Request Consultation · Request a Call Back · Submit Report · Download Brochure · Request Brochure · Request Floor Plan · Request Payment Plan — wherever they appear on project / listing / developer / area pages.
