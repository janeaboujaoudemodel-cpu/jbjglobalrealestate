
# Amra project page — cleanup batch

Scope: every item is on the Amra project detail page. All changes verified with Playwright screenshots on `/project/amra-the-first-integrative-wellness-resort-mr9hh3ia` before I claim done. No fake photos, no fake documents, no fake developer names.

Global rule locked in this turn: **"Citi Buddy" (never "City Buddy") and developer is always "Citi Developers"** — added as a lint-style guard in the Citi Buddy card + Developer Landscape.

## 1. Amenities section with real photos + grouped tabs

- New `AmenitiesShowcase` component replacing the current text-only amenities block.
- Tabs across the top: `View all · Wellness · Fitness · F&B · Business · Leisure · Lifestyle` (categories derived from the Amra fact sheet / brochure).
- Card size unchanged from today's grid; each card = photo + amenity name + short one-liner.
- Photo source order (strict):
  1. Existing images in `project_gallery` for Amra (matched by amenity keyword).
  2. Cropped regions from the uploaded Amra brochure/fact-sheet PDFs.
  3. Only if neither exists **and only for Amra**, generate a matching-palette photo (emerald + champagne, resort-wellness style).
- Amenity list seeded from the Amra brochure (helipad, air-taxi vertiport, wellness clinic, spa, cryotherapy, gym, yoga deck, private beach, infinity pools, F&B outlets, kids club, co-working, concierge lounge, etc. — full list mapped from the fact sheet).

## 2. Nearby-projects map fixes (`ProjectNearbyPropertiesMap.tsx`)

- Kill the red highlight blob around the current project — replace with a soft emerald ring on the pin only.
- Price pills: white text only, remove the white border/background, use the emerald pill used on `/properties` map.
- Remove the auto-pan arrow + click-arrow-then-fly behaviour (root cause: `flyTo` fired on marker hover). Hovering now only opens the popover.
- Popover card = same component used on the main properties map: 80% photo / 20% info (name, price, beds). Reuse `PropertyMapHoverCard`.

## 3. Payment plan panel (`PaymentPlanVisualization.tsx`)

- Active tab (`Payment Plan (70/30)` / `100% Payment`): icon forced to `#FFFFFF`, not the emerald token that currently renders black on the active dark chip.
- `Post-Handover (36 months) · Due by 2031-12-01` chip: text + clock icon pure white.
- 70/30 card: content redistributed across full card width (grid `2fr 1fr` → `1fr 1fr`, right column populated with the post-handover timeline card so the right side is no longer empty). Card size untouched.
- Handover strap (already written last turn) kept as-is.

## 4. Brochure card (`PremiumBrochureCard.tsx`)

- JBJ monogram + `JBJ GLOBAL REAL ESTATE` wordmark = full-width header bar at the top of the card, larger, edge-to-edge.
- Bottom title panel (project name + location) → thinner, more transparent (`bg-black/35 backdrop-blur-md` instead of the current solid emerald), so more of the cover photo shows.
- Cover photo occupies ~70% of card height now vs ~45% today.

## 5. Generate Presentation card (`GeneratePresentationCard.tsx`)

- Monogram position unchanged.
- `CLICK TO START · Generate Presentation · Custom PDF deck · ~30 seconds` block shifted up ~16px so it sits closer to the monogram, removing the current bottom gap.

## 6. Project Documents library (`BookStyleDocuments.tsx`)

- Robot image replaced with the real Citi Buddy robot cropped from the uploaded Amra Citi Buddy PDF page (Lovable Assets pointer, no fake robot).
- Card label logic rewritten by document `kind`:
  - `citi_buddy` → label "Citi Buddy" (never "Brochure").
  - `fact_sheet` → label "Fact Sheet".
  - `payment_plan` → label "Payment Plan".
  - `spa` → label "SPA".
  - `floor_plan` → label "Floor Plan".
  - `brochure` → label "Brochure" **only if a real brochure file exists**.
- No auto-created "Brochure" card when the project only has a fact sheet. In that case the top Brochure section pulls the fact sheet PDF, but the Documents grid shows only real uploaded documents.
- Card typography: title centred vertically between photo bottom edge and the `View / Save` buttons. Remove the repeated "Amra The First…" project-name line (title = document type only). Kind label chip reduced ~50% in size.

## 7. Buyer Nationality / Market Intelligence (`BuyerNationalityInsights.tsx`)

Reorder + rescope, no new fake data:

1. **This project** — "Who's buying in Amra" (empty state today, ready to accept upload — no fake fill).
2. **This area** — Al Raudah / Umm Al Quwain nationalities sourced from UAQ Real Estate authority feed (not DLD). If unavailable, show a labelled empty state, never Dubai substitutes.
3. **UAE cash-vs-mortgage / off-plan-vs-ready** — kept, but explicitly labelled "UAE-wide (DLD sample, Dubai-dominant)".
4. **Dubai top nationalities** — pushed to the bottom under "Dubai market intelligence (reference)".

## 8. Naming / developer lock

- Global find-and-replace `City Buddy` → `Citi Buddy` and `City Developers` → `Citi Developers` across strings and comments.
- Developer name for Amra pinned server-side + client-side to `Citi Developers` (guard in `useUnifiedProject`).

## 9. Backlog audit from prior turns

I will re-scan every earlier message in this thread and, in the same turn, print a checked/unchecked list of every task ever raised (amenities, videos, sale_status selector, Airbnb, phase 1/2 payments, three-tab Other Projects, price/sqft justification, Reelly-style deck, auto-flip handover cron, Al Hamra Village auto-photo, search exact-match ordering, etc.) — each item either ✅ shipped with the file path, or ⏳ queued with the next-turn owner. No item silently dropped.

## Validation

For each of sections 1–7 I run Playwright against the real Amra route, wait for the section to mount, screenshot the exact section, and view the screenshot before marking done. If a section fails to render I fix the mount issue first — no more "local headless renders only the shell" excuses.

## Technical notes

- Files touched: `AmenitiesShowcase.tsx` (new), `ProjectNearbyPropertiesMap.tsx`, `PropertyMapHoverCard.tsx` (reused), `PaymentPlanVisualization.tsx`, `PremiumBrochureCard.tsx`, `GeneratePresentationCard.tsx`, `BookStyleDocuments.tsx`, `BuyerNationalityInsights.tsx`, `ProjectAIAnalyzer.tsx`, `useUnifiedProject.ts`, plus one migration for `project_amenities.category` + a Citi-Buddy asset pointer.
- No schema drop, only additive columns + GRANTs.
- No new external APIs; UAQ feed is a placeholder read that gracefully empties when absent.
