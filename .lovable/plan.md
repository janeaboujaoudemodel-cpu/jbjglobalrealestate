## What's wrong now

On `/project/:slug`, several sections that used to render are either visually missing or appearing in the wrong order, and one new insight you want (top buyer nationalities for the project + its area) doesn't exist yet.

After reading `src/pages/ProjectDetail.tsx`, `src/components/project-detail/ProjectDetailLayout.tsx` (1650 lines), `ProjectNearbyPropertiesMap.tsx`, and `src/components/shared/DLDMarketWidget.tsx`, here is what actually broke and what to fix.

## Fix plan

### 1. Restore the Brochure section so it ALWAYS renders
- The brochure block (lines 1424–1481) is currently gated only by the parent layout but `PremiumBrochureCard` becomes invisible on some projects because:
  - For Reelly projects, `documents: []` is hard-coded in `ProjectDetail.tsx` → no `brochurePrimary`, and `isLocked={!brochurePrimary || …}` collapses the card area visually.
  - When there are no `project.images`, the card has no cover and renders as an empty wrapper.
- Action: render the brochure two-column block unconditionally for every project (DB + Reelly). When no real brochure exists, show the "Request brochure" variant (lead-capture CTA) — never hide it.
- Always pass a cover image fallback (`cover_image_url || first image || developer logo || JBJ monogram tile`).

### 2. Restore the "Documents" library (fact sheet / floor plan / brochure)
- `BookStyleDocuments` (lines 1484–1497) only renders when `project.documents.length > 0`. For Reelly projects this is always empty, so the whole shelf disappears.
- Action:
  - Always render the section header "Project Documents".
  - When at least one doc exists, render the book-style strip exactly as before.
  - When none exist, render a champagne placeholder shelf with the three slots (Brochure · Fact Sheet · Floor Plan) each opening the existing `LeadCaptureModal` with the right `captureDocType`.
  - Keep `OwnerDocDropzone` visible only to owners.

### 3. Lock the section order (the order you've been asking for)
Render order inside `ProjectDetailLayout.tsx` for every project:

```text
Hero / gallery
Quick facts
House details
Floor plans
Amenities
Media (video / tour)
Location map + headline
"Other projects in this area" map  ← uses ProjectNearbyPropertiesMap
Points of interest
Master plan
Payment plan
Brochure (always)
Documents shelf (always)
Mortgage calculator
JBJ AI Analyzer (project-scoped)
DLD Market Widget (full-bleed band)  ← transactions, top areas, nationalities
Buyer Nationality Insights (new — project + area)  ← see step 5
Investment metrics
FAQs
More from this developer
Newsletter / CTA
```

### 4. "Other projects in this area" map under the location map
- Currently `ProjectNearbyPropertiesMap` is rendered only when `lat/lng || area_name` exists, and `MoreFromDeveloperStrip` sits right under the map — which is what you're seeing as "only more from my properties".
- Action:
  - Move `MoreFromDeveloperStrip` to the bottom of the page (above Newsletter), so it never visually replaces the area map.
  - Render `ProjectNearbyPropertiesMap` ALWAYS — when the project has no coords AND no area, fall back to the emirate centroid and query peers by `emirate`. Title becomes "Other projects in {area_name || emirate}".
  - Keep the red pin = current project, champagne pins = other developers nearby.

### 5. New "Buyer Nationality Insights" (project + area)
- Create `src/components/project-detail/BuyerNationalityInsights.tsx`.
- Two side-by-side cards on desktop, stacked on mobile:
  - Card A — "Top buyers in {project.name}" (project-level): top 5 nationalities buying in this project. Source: aggregate `dld_daily_snapshot` / `dld_market_data` filtered by project name match where available; when no project-level data, mark "Area proxy" badge.
  - Card B — "Top buyers in {area_name}" (area-level): top 5 nationalities buying in the surrounding area (e.g. Dubai Creek Harbour). Source: same DLD tables filtered by area.
- Each row: flag · nationality · share % · bar. Champagne surface, gold hairline, ink text — matches `DLDMarketWidget`.
- Add a small "Data: DLD · YTD {year}" caption and the existing investment disclaimer.
- Wire it into the page directly below `DLDMarketWidget`.

### 6. Verify visually before claiming done
For 3 representative projects (one DB project with brochure, one DB project without brochure, one Reelly project), screenshot the full page at desktop 1440 and mobile 390 and confirm:
- Brochure block visible (download or request variant)
- Documents shelf visible (real or placeholder)
- "Other projects in this area" map visible with at least 1 pin or empty-state message
- DLD widget present
- New Buyer Nationality Insights card visible with project + area columns
- JBJ AI Analyzer visible above DLD
- `MoreFromDeveloperStrip` only appears once, at the bottom

## Technical notes

- Files touched:
  - `src/components/project-detail/ProjectDetailLayout.tsx` (re-order + unconditional brochure + unconditional docs + always-on nearby map)
  - `src/components/project-detail/BookStyleDocuments.tsx` (add empty-state placeholder shelf)
  - `src/components/project-detail/PremiumBrochureCard.tsx` (image fallback chain)
  - `src/components/project-detail/ProjectNearbyPropertiesMap.tsx` (emirate-fallback query)
  - `src/components/project-detail/BuyerNationalityInsights.tsx` (new)
  - `src/pages/ProjectDetail.tsx` (no doc-array hard-empty for Reelly; still empty but the layout no longer hides on length 0)
- No DB migration required for steps 1–4. Step 5 reads from existing `dld_daily_snapshot` / `dld_market_data` (already in schema); if a query needs a new index it will be added in a follow-up migration.
- No removal of any existing feature — strict no-removal policy respected.
