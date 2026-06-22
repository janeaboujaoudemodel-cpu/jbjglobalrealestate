
# Global Emerald Lockdown + Layout Padding Fix

You've identified that multiple shades of "green" are still leaking across the site (lime/light green on Mortgage Calculator, restricted green on heart/shortlist/award badges, payment plan "TBD", Download Report, etc.) and that cards are touching the sidebar/screen edges on /properties. This plan fixes everything at the **token + primitive** level so it can never drift again, then validates each surface visually.

## The single source of truth

One canonical emerald = the "View All Projects" / "Start Exploring" emerald (deep `#064E3B → #047857 → #059669`, white text + white SVG, **no border**). Every other green must be replaced by this token. No light green, no lime, no `bg-green-*`, no `bg-emerald-400/500`, no white border rings on emerald circles.

## Tasks (executed in order, each visually verified)

### 1. Lock the token + kill all other greens globally
- Add `--jj-emerald-canonical` and `--jj-emerald-canonical-hover` (darker) to `src/index.css` mapped to the exact gradient used by `.jj-cta-emerald-metallic` / View All Projects.
- Add a high-specificity global CSS sweep that:
  - Rewrites any element with `bg-green-*`, `bg-emerald-300/400/500/600`, `from-green-*`, `from-emerald-300/400/500`, `text-green-*`, `border-emerald-*` to the canonical emerald fill + white foreground + **no border**.
  - Removes `border`/`ring`/`outline` on every `[data-surface="emerald"]`, `.jj-favorite-trigger`, `.jj-pill-emerald*`, `.jj-cta-emerald*` (no white rings around circles).
  - Forces hover to use the **darker** canonical emerald and idle to use the lighter canonical emerald (swap direction the user described on Mortgage Advisor cards).
- Extend `scripts/contrast/check-no-blue.mjs` pattern with a new `check-no-light-green.mjs` to fail CI if `bg-green-*` or `bg-emerald-[3-5]00` ever return.

### 2. Heart / Shortlist / Award badge — canonical emerald, no white border
- `FavoriteButton.tsx`, `ShortlistBadgeButton.tsx`, `DesignFavoriteButton.tsx`: switch inline `backgroundImage` to `var(--jj-emerald-canonical)`, remove `borderColor: "rgba(255,255,255,0.35)"` and `border` classes. Keep white glyph.

### 3. Payment plan "TBD" pill → canonical emerald
- Audit `PaymentPlanLine.tsx` and any `payment_plan` chip renderer. Replace lime/green fill with canonical emerald + white text.

### 4. Project detail page CTAs
- **Download Brochure / Register Interest / Download Branded Presentation**: per your instruction, **remove pill style** — render as flat white premium row (champagne surface, ink text, emerald icon tile only). No emerald pill background.
- **Checklist ticks** (Project Brochure / Floor Plan / Layout / Specs / Payment Plan): circle = canonical emerald fill, tick = pure white, no border.
- **Auto Plus Amenities / Generate Presentation section**: same circle+tick treatment; fix the broken "Click to start / 30 seconds" card contrast (give it canonical emerald background OR a real brochure illustration, white text).

### 5. Mortgage Calculator page
- Replace every light-green surface (Compare to Bank Rates, Try Our Mortgage Calculator, hero icon tile, card icons) with canonical emerald + white glyph.
- **Preferred Mortgage Advisor / Request Mortgage Introduction** cards: title must be white (force via `data-surface="emerald"`); swap idle/hover so darker emerald = idle, lighter = hover.

### 6. Dubai Market Intelligence
- **Download Report** button → canonical emerald, white text+icon.
- Fix horizontal header bars (Price / Payment / Handover / Property Type and Location / Brochure / Payment Plan rows) that currently bleed across the vertical sidebar.

### 7. Card-edge padding (global, all breakpoints)
- The `MainLayout` content area must always provide inner padding so cards never touch the sidebar or right viewport edge:
  - Mobile: `px-4`
  - Tablet: `sm:px-6`
  - Desktop: `lg:px-8`
- Audit and fix every `w-full px-0` / `full-bleed` grid wrapper on `/properties`, `/projects/*`, market intelligence, mortgage. Background bands stay full-bleed; **grid containers** receive padding.
- Remove the `w-full px-3 sm:px-5 lg:px-8` from `FeaturedListings` if it still allows cards to kiss the edge under the sidebar — replace with `container mx-auto px-4 sm:px-6 lg:px-8`.

### 8. Global "label" primitive
- Every label chip across the site (top-area chips, "AI Powered", CRM status labels, etc.) routed through a single `<EmeraldLabel />` primitive = canonical emerald + white text, no border. Codemod existing `inline-flex … rounded-full` label chips to this primitive.

### 9. Visual validation (Playwright, headless, 1280×1800)
Capture and review screenshots for every surface above:
- `/` (hero, Featured cards, AI comparison widget, Start Exploring)
- `/properties` (grid padding on desktop + 390×844 mobile + 820×1180 tablet)
- `/project/:slug` (CTAs, checklist ticks, Generate Presentation, Auto Amenities)
- `/mortgage-calculator` (all green surfaces, advisor cards idle+hover)
- `/market-intelligence` (Download Report, header bars vs sidebar)
- Heart/shortlist/award badge zoom crops on a card

Each screenshot must show: **canonical emerald, pure white glyph, no border, no light-green leak, cards padded off the edges**. I will only report success after attaching the screenshots.

## Technical notes
- All color changes happen in `src/index.css` tokens + 6-8 component files. No business logic touched.
- Border removal is enforced by CSS, not per-component, so future code can't reintroduce rings.
- Hover/idle swap is done via the `.jj-cta-emerald-metallic:hover` rule, not per-page.
- Padding fix is done at `MainLayout` + the few `full-bleed` grids, not by editing every card.

Approve and I'll execute tasks 1-9 in order with screenshots after each.
