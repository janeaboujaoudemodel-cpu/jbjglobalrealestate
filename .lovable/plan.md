
## Comprehensive Fix Plan: Filter Bar, Map, Divider, and AI Analyzer

### Issues Identified

1. **Filter bar shows 3 rows instead of 2** -- `ProjectFilters` renders Row 1 (Search + Developer + Currency + Emirates + sqft/sqm + Filters button), then `FilterShortcutBar` renders Row 2 (Map + Saved + Currency + Mode + Filter) and Row 3 (Price + Payments + Handover + ... + Sort). This is 3 visible rows. User wants only 2.
2. **Map scroll zoom still triggers on two-finger scroll** -- `ProjectLocationMap` has the "click to enable" overlay, but `AreaMapSection` and `DeveloperProjectsMap` still have `scrollWheelZoom={true}`. Also, the overlay pattern doesn't distinguish between "two-finger scroll to navigate page" vs "pinch to zoom map".
3. **Divider between "Explore All Projects" and "Dubai Market Intelligence"** -- The champagne `SectionDivider` exists on line 460 of `DeveloperDetail.tsx` but it sits inside the same `<section>` tag, so it may not be visually distinct enough. Needs verification and possible adjustment.
4. **AI Developer Intelligence is slow** -- The edge function calls `callLovableAI` which is synchronous. The 30s timeout shows it regularly takes a long time. Can be improved with caching and a faster model.

---

### Fix 1: Merge ProjectFilters Row into FilterShortcutBar (3 rows to 2 rows)

**Goal:** Eliminate `ProjectFilters` from the DeveloperDetail page and absorb its key controls (Search, Developer dropdown, Emirates dropdown) into `FilterShortcutBar` Row 1. The result is exactly 2 rows:
- Row 1: Search (compact) + Developer + Emirates + Map + Saved + Currency + Mode + Filter
- Row 2: Price + Payments + Handover + Property Type + Bedrooms + Status + Construction + Hide Sold + divider + Newest + Low-High + High-Low + A-Z

**Files:**
- `src/pages/DeveloperDetail.tsx` -- Remove `<ProjectFilters>` from both inline and fixed-portal positions. Pass the search, developer, and emirate controls as `searchSlot` into `FilterShortcutBar`, or add new props (`developerSlot`, `emirateSlot`) to FilterShortcutBar.
- `src/components/filters/FilterShortcutBar.tsx` -- Add optional `developerSlot` and `emirateSlot` props. Render them in Row 1 after the search input. This keeps the component generic while allowing pages to inject their own dropdowns.

**Same fix applies to:**
- `src/pages/DeveloperDetail.tsx` (fixed portal too)
- Any other page using both ProjectFilters + FilterShortcutBar together

---

### Fix 2: Map Two-Finger Scroll Behavior

**Problem:** Normal two-finger trackpad/touchpad scrolling triggers map zoom. User wants: normal page scrolling preserved; only deliberate pinch-to-zoom on the map should zoom.

**Solution:** All maps should use `scrollWheelZoom={false}` and add the "click to enable" overlay pattern. This is already done in `ProjectLocationMap.tsx` but missing from:
- `src/components/area-detail/AreaMapSection.tsx` (line 157: `scrollWheelZoom={true}`)
- `src/components/developer/DeveloperProjectsMap.tsx` (line 128: `scrollWheelZoom: true`)
- `src/components/maps/PropertiesMapView.tsx` (line 124: `scrollWheelZoom={true}`)

**Changes:**
- Set `scrollWheelZoom={false}` on all maps
- Add the same "click to enable map interaction" overlay pattern from `ProjectLocationMap.tsx` to `AreaMapSection.tsx` and `DeveloperProjectsMap.tsx`
- For `PropertiesMapView.tsx` (dedicated map mode), keep `scrollWheelZoom={true}` since the user explicitly opened map view

---

### Fix 3: Divider Between "Explore All Projects" and "Dubai Market Intelligence"

**Current state:** `SectionDivider variant="champagne"` on line 460 of `DeveloperDetail.tsx` exists but is inside the same parent `<section>` and `<div>` container. The projects grid wrapper (lines 401-424) has a champagne background, and the divider sits between it and `DLDMarketWidget`.

**Fix:** Ensure the divider has proper visual separation by:
- Closing the projects wrapper `<div>` before the divider
- Adding explicit padding/margin around the divider
- Ensuring `DLDMarketWidget` starts in its own visual container

---

### Fix 4: Speed Up AI Developer Intelligence

**Current:** Uses `callLovableAI` (likely `google/gemini-2.5-pro` or similar) with no caching. Each page visit re-triggers analysis.

**Fix:**
1. **Cache results in database** -- Create a `developer_ai_cache` table (developer_slug, analysis_text, generated_at). Before calling AI, check cache; if less than 24h old, return cached result.
2. **Use a faster model** -- Switch to `google/gemini-2.5-flash` or `google/gemini-2.5-flash-lite` for developer analysis (the prompt is straightforward, doesn't need the most powerful model).
3. **Client-side cache** -- Store the analysis in `sessionStorage` so navigating back doesn't re-trigger.

**Files:**
- `supabase/functions/ai-developer-analyzer/index.ts` -- Add DB cache lookup before AI call, save result after. Switch model to `gemini-2.5-flash`.
- New migration: `developer_ai_cache` table
- `src/components/developer/DeveloperAIAnalyzer.tsx` -- Add sessionStorage check before triggering the edge function

---

### Summary of All Changes

| Issue | File(s) | Change |
|-------|---------|--------|
| 3 rows to 2 rows | `FilterShortcutBar.tsx`, `DeveloperDetail.tsx` | Remove ProjectFilters, absorb Search/Developer/Emirates into FilterShortcutBar Row 1 |
| Map scroll zoom | `AreaMapSection.tsx`, `DeveloperProjectsMap.tsx` | Set `scrollWheelZoom={false}`, add "click to enable" overlay |
| Divider gap | `DeveloperDetail.tsx` | Restructure section boundaries around divider |
| AI speed | `ai-developer-analyzer/index.ts`, new migration, `DeveloperAIAnalyzer.tsx` | Add DB + session cache, use faster model |

### Database Migration

```text
developer_ai_cache (
  id uuid PK DEFAULT gen_random_uuid(),
  developer_slug text UNIQUE NOT NULL,
  analysis_text text NOT NULL,
  generated_at timestamptz DEFAULT now()
)
```

RLS: Allow anonymous reads (public data), restrict writes to service role only (edge function uses service key).
