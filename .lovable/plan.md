# Plan: Gallery, Map, Brochure, Mortgage, Market Intel & Developer Section Upgrade

## 1. Gallery — De-duplicate & Fix "+N" Lightbox

**Problem:** Two near-identical photos (one low-res, one high-res) appear back-to-back. Clicking "+14" opens only one image instead of the full gallery.

- Add perceptual de-duplication in `ProjectMediaSection.tsx` image loader:
  - Normalize URLs (strip CDN size suffixes like `_thumb`, `?w=`, `/w_400/`) and group by base key.
  - When duplicates exist, keep the largest-resolution variant (use `getHighResImageUrl` + natural-size check on load).
  - Hash-fallback: load first 8KB and dedupe by SHA1 prefix for cases where URLs differ but bytes match.
- Apply globally on every project — not just Distrikt — so this never recurs.
- "+N" tile click: open the full-screen lightbox at index `visibleCount` with all photos paginated and arrow/keyboard navigation. Currently it only opens the single tile underneath.

## 2. Project Map — Show Nearby Projects

In the project's Location/Map section, render a single Mapbox/Google map containing:
- **Red pin** = current project.
- **Blue pins** = up to ~30 other projects within a radius (e.g. 5 km) queried from `projects` table by lat/lng bounding box, excluding leasing.
- Hover/click a blue pin → mini-card with cover image, name, developer, price-from, "View" link.
- Toggle filter chips (All / Same developer / Same area) above the map.

## 3. Brochure Readability Fixes

On the brochure cover thumbnail in **Project Brochure** card and the **Project Documents** library card:
- The "JBJ GLOBAL REAL ESTATE" wordmark + project name + "Brochure" label sit on a dark photo with no scrim → unreadable.
- Add a fixed gradient scrim (`linear-gradient(180deg, rgba(0,0,0,.1) 0%, rgba(0,0,0,.75) 100%)`) behind the title block.
- Increase title contrast: white text + subtle gold underline, project name in 22–24px semibold, wordmark in 11px tracked uppercase.
- Same treatment applied to the small "Brochure" badge chip on Project Documents tile (champagne pill, ink text, gold hairline — not faded translucent black).

## 4. Mortgage Calculator — Property Finder Parity ✅

Added `MortgageParityPanel` (rendered under both compact and full views) covering:
- Residency toggle (UAE National 85% / Expat 80% / Non-Resident 50%) with live LTV-vs-cap check.
- Affordability check: monthly income input, 50% DBR cap, ratio, pass/fail badge.
- One-time fees breakdown: DLD 4%, agency 2%, mortgage reg 0.25%+290, bank arrangement 1%, valuation, trustee, NOC + total upfront in price-orange.
- Side-by-side bank rate comparison with monthly delta.
- Collapsible yearly amortization schedule (principal/interest/balance).
- Preserves champagne+gold UI on default theme; auto-flips to navy glass when `themeVariant="navy"`.

## 5. Dubai Market Intelligence Upgrade

- **Daily refresh:** schedule cron edge function `refresh-dld-market` to pull latest DLD transactions daily; surface "Updated DD MMM YYYY" timestamp.
- **Headline KPIs:** Yearly transaction volume + Daily transactions, large premium tiles (ink + gold hairline + price-orange value).
- **Cash vs Mortgage donut:** swap green/brown for **black (#0A0A0A) + gold (#B89555)** primary, champagne secondary.
- **Top 10 Areas / Top 10 Buyers:** the right→left white sweep highlight is glitchy. Replace with a static champagne row hover + gold left-border accent; rank number in gold hairline circle.
- **"Notice something incorrect?" section:** lift from near-black slab to champagne raised band with ink text + gold hairline frame.
- **"Expert Consultation" section:** upgrade to a premium card — ink background, gold hairline, JBJ monogram, Amanda portrait, single dark CTA, supporting trust line.

## 6. Developer Section — More Projects + Inline Expansion

Above Dubai Market Intelligence on the project page, when developer = e.g. Ammar:
- Show "More projects by {Developer}" — grid of 3–4 per row × 2 rows (6–8 cards).
- **View more** button expands inline (no route change) into a paginated/lazy-loaded panel staying on the same project page.
- Add filter row inside the expanded panel: Area, Price range, Bedrooms, Handover, Status, Property type — same global filter chips used on /properties.

## 7. Behavior-Driven Recommendations

Continue the page with the existing sections (Request Consultation, Register Interest, Request Callback) and a new **Recommended for You** rail that adapts to user behavior:
- Track searches/filters used (developer, area, price, bedrooms) in `browsing_history` (already exists).
- Recommendation rules (priority):
  1. If last search was developer-led → recommend same developer.
  2. If area-led → same area.
  3. If price-led → ±15% price band.
  4. Fallback → trending.
- Same engine powers the existing recommendations pop-up so behavior follows the user across pages.

## 8. Validation

- Browser-test the project page as a normal user at desktop (1920) and mobile (390):
  - Confirm no duplicate gallery photos, +14 opens full lightbox.
  - Map shows red + blue pins with mini-cards.
  - Brochure titles legible at all states.
  - Mortgage calculator shows new residency + fees + amortization.
  - Market Intel: daily timestamp, black/gold donut, clean Top 10 hover, premium consultation card.
  - Developer "View more" expands inline with filters.
- Screenshot proof of each before/after for chat.

## Technical Notes

- Files likely touched: `ProjectMediaSection.tsx`, `ProjectMapSection.tsx` (new nearby query), `PremiumBrochureCard.tsx`, `ProjectDocumentsGrid` brochure card, `MortgageCalculator.tsx`, `OwnerMarketIntel.tsx` + public Market Intelligence page, `DeveloperMoreProjectsSection.tsx` (new), `RecommendedForYouRail.tsx` + `PropertyRecommendationPopup` reranker.
- New edge function: `refresh-dld-market` (cron daily).
- New DB read: `projects_near(lat, lng, radius_m)` RPC for map nearby pins.
- Honors champagne/gold theme, no white-on-light, no gold fills (hairline only), price uses `<PricePill />`, dev names via `<DeveloperLink />`.
