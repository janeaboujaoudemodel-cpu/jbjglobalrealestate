I'm going to fix every item you listed, grouped into 5 gates. After each gate I'll take Playwright screenshots and only proceed once visually confirmed.

## The canonical emerald (single source of truth)
The ONE allowed emerald is the deep ombre already used by EOI / Handover / email/call/chat:
- Fill: `var(--jj-emerald-ombre)` (#064E3B → #042c1c → #000)
- Hover (darker): `var(--jj-emerald-ombre-hover)` — currently it's lighter; **I will swap these tokens** so the lighter shade becomes the rest state and the darker becomes hover, per your instruction on the Mortgage CTA.
- Foreground: pure white, no border. I'll strip every `border border-white/25` on emerald circles.

Any other green (Tailwind `bg-green-*`, `bg-emerald-500/600`, `#10b981`, `#16a34a`, neon `#34D399` as fill) is banned and replaced.

## Gate 1 — Heart, Shortlist, AD/badge pills (global)
Files: `FavoriteButton.tsx`, `DesignFavoriteButton.tsx`, `ShortlistBadgeButton.tsx`, any `AdBadge`/sale-status pill.
- Remove `border border-white/25` and shadow ring.
- Force `background-image: var(--jj-emerald-ombre)` (canonical) + white svg/text.
- Match the header search/filter/heart visual exactly (clean rounded fill, no border).

## Gate 2 — Project-detail hero CTAs (un-pill)
File: `ProjectDetailLayout.tsx` lines ~770–815, ~865.
- "Download Brochure", "Register Interest", "Download branded presentation" → switch from emerald pill to **white premium** style (champagne/white fill, ink text, gold hairline, no pill chrome). Keep functionality.

## Gate 3 — Project-detail body contrast
- Brochure card (`PremiumBrochureCard.tsx` + `ProjectDetailLayout.tsx` 1445–1480): checklist tick circles become emerald fill + white tick (like header search icon). "Download Brochure" inside card → emerald with white text/icon at rest AND hover.
- `GeneratePresentationCard.tsx`: tick circles emerald+white; rebuild the Generate Presentation button card (Click to start / Generate Presentation / Custom PDF deck) with proper contrast — emerald surface, all text/icons pure white, no broken stacking.
- `BookStyleDocuments.tsx` "Brochure" label chip → emerald+white.
- "Payment Plan (TBD)" tab badge → canonical emerald.

## Gate 4 — Mortgage + DLD widgets
- `MortgageCalculator.tsx`: title icon tile, "Compared to bank rate" pill, all green→canonical emerald; "Request Mortgage Introduction" anchor — title pure white at rest, swap hover/rest so darker shade is rest, lighter shade is hover. Same swap applied globally via the token reorder above.
- `DLDMarketWidget.tsx` "Download Report" → white text/icon on emerald at rest+hover.

## Gate 5 — Project page layout (no edge-touching, no sidebar crossing)
- The L-shaped frame fix: sticky sub-nav bars (filter row "Price/Payments/Handover…" and tabs "Details/Gallery/…/Register Interest") currently render full-bleed and overlap the 88px sidebar. I'll constrain them to `left: var(--sidebar-w)` / `padding-left` so they stop at the sidebar, with inner content padding so cards never touch the frame on any breakpoint (mobile/tablet/desktop).
- Property cards grid inside project page: add `px-4 sm:px-6 lg:px-8` wrapper so cards never reach the edge.
- DLD widget: fix the broken full-bleed crossing the sidebar same way.

## Validation
After each gate I run Playwright at 1280×1800 against `/project/distrikt-majid-al-futtaim-city-of-arabia`, `/properties`, `/`, capture zoomed crops of each fixed element, and confirm: emerald is the canonical deep ombre, no white borders on circles, white glyphs on every emerald surface, no sidebar overlap, cards have safe padding.

Approve and I'll execute Gate 1 → 5 back to back.