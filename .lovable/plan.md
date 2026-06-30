## Goal
Rebuild every page reachable from the **Insights** branch of the vertical sidebar so it conforms to the locked brand contract (champagne surfaces, emerald CTAs, white-on-emerald, ink-on-champagne, gold hairline only as corners, IconTile, PremiumSectionCard, full-bleed bands, no gray, no white-svg-on-light, white-svg-on-emerald). Consolidate the duplicate "Guides Library" / "Books Library" into a single canonical page. Then sweep any pages reachable from the sidebar that I find drifted from the contract.

## Step 1 — Audit (one turn, no UI changes)
- Map every Insights route in `GlobalVerticalNav.tsx` to its component.
- Diff the route list against `src/pages/*` to flag orphan pages that are linked from nav but missing, or built but unlinked.
- Identify the canonical file for each of the 17 targets and note which currently violate the contract.
- Decide: **keep "Guides Library" as canonical, redirect "Books Library"** (or vice versa — confirm with you below).

Deliverable: a short table (route → component → status → planned action) posted back in chat, no commits.

## Step 2 — Shared primitives (one turn)
Before touching pages, lock the shared scaffolding so each page rebuild is a small edit, not a bespoke redesign:
- `InsightsPageShell` — full-bleed champagne band, hero with IconTile + eyebrow + title (ink #1A1A1A) + lede, breadcrumb, `<PremiumSectionCard>` children slot.
- `InsightsHero` variant of the shell with emerald CTA pair (`jj-pill-emerald-metallic` primary, champagne+emerald-ink secondary).
- `GuideCard`, `ReportCard`, `FAQAccordion` primitives so Buyer/Seller/Tenant/Landlord/Investor/Golden-Visa guides all render through the same component.

## Step 3 — Page rebuilds, in waves
Each page = (1) refactor to shared primitives, (2) Playwright screenshot at 1280×1800, (3) zoom-inspect hero + one card grid + one CTA, (4) post the screenshot, (5) only then move on. If a page fails inspection I patch and re-shoot before advancing.

**Wave A — Intelligence (5):** Market Intelligence · Market Overview · Market Report · Area Intelligence · Reports Archive
**Wave B — Editorial (2):** News · Methodology
**Wave C — Guides hub + buyer/seller side (4):** Guides Library (canonical, absorbs Books Library) · Buyer's Guides · Seller's Guides · Golden Visa Guide
**Wave D — Rental side + education (4):** Rental Guides · Tenant Guide · Landlord Guide · Investor Education
**Wave E — Help (1):** FAQ Hub
**Wave F — Orphan sweep:** any sidebar-linked page from Step 1 that isn't one of the 17 but drifts from contract gets the same shell treatment.

Books Library route is kept as a 301-style redirect to Guides Library so existing links don't 404.

## Step 4 — Final verification
- Playwright pass over every rebuilt route, full-page screenshot, posted as a contact-sheet.
- Run `src/test/global-x-overflow.regression.test.ts` adding the new routes.

## Technical details
- No business logic / data-fetching changes — visual + structural only, per your standing rule.
- All color values come from existing tokens / `index.css` utilities (`jj-band`, `jj-pill-emerald-metallic`, `jj-corner-card`, `PremiumSectionCard`, `IconTile`, `SectionEyebrow`). Zero new hex.
- `data-no-contrast-guard` only where a token surface legitimately demands an override (e.g. emerald CTA inside a champagne card).
- Guides/Books consolidation: keep `/guides-library` (or whichever route you confirm), delete the duplicate page component, add a `<Navigate replace>` in `App.tsx` for the retired path.

## Two quick confirmations before I start Step 1
1. **Canonical name** — keep **Guides Library** and retire Books Library, or the reverse?
2. **Validation cadence** — screenshot + post **every** page (17 round-trips), or screenshot every page but batch-post per wave (5 round-trips)? Batched is ~3× faster with the same coverage.

Reply with the two answers and I'll start Step 1 immediately.