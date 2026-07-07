# Amra Fix Batch — Full Scope

## Patch 1 — Payment plan visual fix
- Replace label "30% On Handover" with "30% Post-Handover (36 months)" everywhere in Amra data + summary formatter
- Fix stage circle alignment so % marker matches its bar position (during construction circle currently overflows past 60%)
- Verify with Playwright screenshot

## Patch 2 — Mortgage rule lock (system-wide)
- Add helper `isMortgageEligible(project)`:
  - Ready → true
  - Off-plan + non-tier1 developer → false
  - Off-plan + tier1 developer (Emaar, DAMAC, Nakheel, Sobha, Aldar, Meraas, Dubai Properties) + construction_progress ≥ 50% → true
  - Else false
- Hide Mortgage tab/button on project detail + property cards when not eligible
- Amra = off-plan, Citi Developers → hide mortgage

## Patch 3 — Off-plan / off-sale status
- Add `sale_status` enum ('off_plan','ready','off_sale') to projects table + owner upload form select
- Mark Amra as `off_plan`
- Surface badge on card + detail

## Patch 4 — Project Intelligence rebuild
- Replace hardcoded "Al Rawda average" logic with area-scoped stats keyed on `project.area_name` + `project.emirate`
- Remove fake "Sobha Group / Sobha Siniya Island" from Developer Landscape — only allow entries verified against dev_registry
- For Amra: show Umm Al Quwain / Al Raudah stats (price/sqft area avg, price/sqft developer avg, typical service charge area, developer service charge). Empty state if unknown — never fabricate.
- Global sweep: null out AI-generated `developer_landscape`, `investment_metrics.commentary`, etc. that reference unverified competitors

## Patch 5 — Content extraction from brochure
- Add "Amra Airbnb property management" mention to Amenities/Services section
- Amenities: parse brochure PDF, list all amenity photos with titles in Amenities section (grid)
- Videos section: surface uploaded videos in dedicated "Videos" tab/section on project detail

## Patch 6 — Pros/Cons icon color + Map
- Pros title + thumbs-up → white on emerald card
- Map: use precise Amra coordinates (Umm Al Quwain, Al Raudah), enable smooth zoom, "Open in Google Maps" link that isn't blocked (target=_blank, noopener)

## Validation
- Playwright screenshots of: payment plan row/circles, hidden mortgage on Amra, off-plan badge, intelligence card (Umm Al Quwain stats), removed fake developer landscape, amenities grid, videos section, pros white icon, map with zoom + Open in Google Maps
- Save to /mnt/documents/amra-batch/
