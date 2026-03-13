

## Plan: Property Map Overhaul + Generate Listing Speed + Developer Management

### Issues Identified

**Property Map (`src/pages/PropertyMap.tsx`):**
1. **Touching header**: Map uses `pt-14` (56px) but the Founder/CEO header + utility bar is taller. Needs proper offset.
2. **Shows Arabic by default**: `mapLang` state initialized as `"en"` but there's a language toggle button — the issue is the map uses its own language state instead of the global `LanguageContext`. Will hardcode to English-only, remove the local language toggle entirely.
3. **Only 992 properties**: Uses `useProjects()` which has no `is_published` filter and hits Supabase's default 1000-row limit. Must switch to `useProjectsListing()` which paginates past the 1000 limit and filters `is_published=true`.
4. **Blue map / no satellite**: Uses OpenStreetMap TileLayer hardcoded. No view toggle exists. Must add satellite as default + view switcher (satellite/street/terrain) like `ProjectLocationMap.tsx` already does.
5. **Scroll zoom too aggressive**: `scrollWheelZoom={true}` causes multi-step zoom. Must disable by default, enable on click (like ProjectLocationMap), and add `wheelDebounceTime` + `wheelPxPerZoomLevel` to throttle zoom steps.
6. **Filter is a side Sheet, not horizontal**: Must replace the Sheet-based filter with the unified `FilterShortcutBar` component used on Properties/Developers/Areas pages, fixed on scroll.

**Generate Listing (`supabase/functions/generate-listing/index.ts`):**
7. **Slow**: Uses `gemini-2.5-pro` with 55s timeout, batch size 4. Upgrade to `google/gemini-3-flash-preview` for speed (keep pro as fallback for single-file retries). Reduce timeout, increase batch size.
8. **Extraction incomplete**: System prompt and schema already comprehensive — main bottleneck is model speed.

**Admin Developers (`src/pages/AdminDevelopers.tsx`):**
9. **Missing project counts per developer**: Need to add project count, last updated timestamp, and who updated.
10. **Missing alert notes / change request visibility**: Need section showing developer representative actions (uploads, corrections, deletion requests).
11. **Developer Portal registration flow**: After selecting developer name, should show existing projects for review/update before publishing new ones.

---

### Implementation

#### 1. Property Map — Full Overhaul

**File: `src/pages/PropertyMap.tsx`**

- Remove the entire `mapTranslations` object and `mapLang` state — hardcode English only
- Remove the language toggle button from header
- Replace `useProjects()` with `useProjectsListing()` for proper pagination past 1000 and published-only filter
- Replace hardcoded OSM `TileLayer` with satellite default using Esri World Imagery + a `MapViewToggle` component (reuse pattern from `ProjectLocationMap.tsx`)
- Add `scrollWheelZoom={false}` with click-to-enable overlay (same pattern as `ProjectLocationMap.tsx`)
- Add `wheelDebounceTime={100}` and `wheelPxPerZoomLevel={120}` to throttle zoom steps
- Replace the Sheet-based filter sidebar with `FilterShortcutBar` component (horizontal, fixed on scroll, same as Properties page)
- Fix top offset to account for utility bar (48px) — use `pt-[48px]`
- Add `MapViewToggle` inline component for satellite/street/terrain switching (top-left controls like ProjectLocationMap)

#### 2. Generate Listing — Speed Upgrade

**File: `supabase/functions/generate-listing/index.ts`**

- Change primary model from `google/gemini-2.5-pro` to `google/gemini-3-flash-preview` (lines 359, 389, 452)
- Keep `gemini-2.5-pro` only as final fallback for complex single-file retries
- Reduce `AI_FETCH_TIMEOUT_MS` from 55000 to 40000 (flash is faster)
- Increase `BATCH_SIZE` from 4 to 6 for fewer round trips
- Deploy updated function

#### 3. Admin Developers — Project Stats + Activity Log

**File: `src/pages/AdminDevelopers.tsx`**

- Add a new "Developer Overview" tab/section showing:
  - Project count per developer (query `projects` grouped by `developer_id`)
  - Last updated project timestamp and name
  - Sales representative who last uploaded/updated (from `project_audit_logs` or `project_change_requests`)
  - Alert notes from change requests (deletion requests, correction reports)
- Add "Uploaded by" / "Updated by" attribution column in developer project lists

#### 4. Developer Portal Registration Flow Enhancement

**File: `src/pages/DeveloperPortal.tsx`**

- After developer selects their developer name, show existing published projects for that developer
- Prompt to review/update: logo, description, developer details
- Then show option to publish new projects
- Add project-level edit forms that create change requests (already partially built in `DeveloperProjectReview.tsx`)

#### 5. FilterShortcutBar Global Consistency

Ensure PropertyMap uses the same `FilterShortcutBar` with `priorityFilter="map"` — consistent with Properties, Developers, Areas, Communities pages. Fixed position below utility bar.

---

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/PropertyMap.tsx` | Full rewrite: English-only, satellite default, FilterShortcutBar, scroll zoom fix, pagination |
| `supabase/functions/generate-listing/index.ts` | Model upgrade to gemini-3-flash-preview, batch size increase |
| `src/pages/AdminDevelopers.tsx` | Add project stats, activity log, representative attribution |
| `src/pages/DeveloperPortal.tsx` | Registration flow: show existing projects first for review |

### Edge Functions to Deploy

- `generate-listing` (model upgrade + speed optimization)

