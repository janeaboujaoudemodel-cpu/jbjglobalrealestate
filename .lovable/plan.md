
## Fix Plan: Real Area Photos + Unified Filters + Single-Project Enrichment

### Issue 1: Area Photos Are AI-Generated (Fake)

**Problem:** The `enrich-area-images` edge function falls back to Gemini AI image generation when no project images exist. This creates fake/AI photos of communities. Areas like "Dubai Islands", "Arjan", "JVT" currently show unsplash stock photos as hero images.

**Fix:** Replace the AI image generation fallback with a Firecrawl web search approach (same pattern as `auto-find-developer-images`). The system will:
1. First try to find a project image from projects in that area (existing behavior, keep)
2. If no project image, use **Firecrawl Search** to find real community/aerial photos of the area on the web
3. Use **Gemini AI** to pick the best community-level photo (NOT a building, NOT an apartment -- must be an aerial/panoramic community view)
4. Also update existing areas that have unsplash/pexels/AI-generated hero images to replace them with real photos

**File:** `supabase/functions/enrich-area-images/index.ts`

Changes:
- Remove the Gemini image generation block (lines 94-146)
- Add Firecrawl Search step: search for `"{area.name} Dubai community aerial view real estate"` 
- Collect all image URLs from search results (same extraction logic as `auto-find-developer-images`)
- Use Gemini text model to pick the best community/aerial photo URL from candidates
- AI prompt will emphasize: "Must be a real photo of the COMMUNITY/NEIGHBORHOOD, showing the overall area view, skyline, or master plan -- NOT a single building or apartment interior"
- Update the query to also target areas with unsplash/pexels hero images (not just null)

---

### Issue 2: Unified Filter Bar Across All Pages

**Problem:** The FilterShortcutBar is only on Properties and Areas pages. Other pages (Developers, detail pages) have their own separate filter implementations.

**Fix:** Add the same sort options (Newest, Low-High, High-Low, A-Z) to the Areas page search bar and standardize the filter layout across pages.

**Changes to `src/pages/AreaGuides.tsx`:**
- Make the search input wider with better placeholder text: "Search area, project or keyword..."
- Add sort pills (Newest, Price Low-High, Price High-Low, A-Z) inline next to the search bar in the filter section
- Replace the current 3-icon sort toggle (Building2, Flame, A-Z) with the standard sort pills
- Move "Hide Sold" to end of Row 2

**Changes to `src/pages/Developers.tsx`:**
- Add sort pills (Newest, A-Z, Most Projects) to the developer search/filter area

---

### Issue 3: Single-Project Provident Enrichment (Not Batch)

**Problem:** The Provident enrichment section has "Extract Batch (10)" and "Full Extraction (All)" buttons. User wants single-project enrichment first to verify quality before bulk.

**Fix in `src/components/listing-admin/ReellyImportPanel.tsx`:**
- Change "Extract Batch (10)" button to "Extract Single (1)" with `batch_size: 1`
- The "Test Project Enrichment" section already supports single-slug testing -- make it more prominent
- Project listing links should open in same tab (change `target="_blank"` to same-tab navigation using `navigate()`)

---

### Issue 4: Enrichment Checklist Premium Design + Same-Tab Navigation

**Problem:** The enrichment test result checklist uses tiny emoji text. Project links open in new tab instead of same tab.

**Fix in `src/components/listing-admin/ReellyImportPanel.tsx`:**
- Upgrade the checklist (lines 1045-1059) from tiny emoji text to a premium grid with proper icons, green/red status indicators, and larger text
- Change all `target="_blank"` project links to use `navigate()` for same-tab navigation (lines 1009, 1016-1017, 1037, 1042, 1110)
- Make the project name/image clickable to navigate to the project detail page in the same tab

---

### Summary of File Changes

| File | Change |
|------|--------|
| `supabase/functions/enrich-area-images/index.ts` | Replace AI image generation with Firecrawl Search + AI selection for real community photos; also target areas with unsplash/pexels hero images |
| `src/pages/AreaGuides.tsx` | Wider search input with better placeholder; replace icon sort toggles with standard sort pills (Newest, Price Low-High, Price High-Low, A-Z) |
| `src/pages/Developers.tsx` | Add sort pills to developer filter section |
| `src/components/listing-admin/ReellyImportPanel.tsx` | Change batch to single (batch_size: 1); premium checklist design; same-tab navigation for project links |

### Technical Details

**Area image search query pattern:**
```text
"{area_name} Dubai community aerial panoramic view neighborhood"
```

**AI selection prompt (for area images):**
```text
Find a REAL photo of the {area_name} community/neighborhood in Dubai, UAE.
Must show: aerial view, community panorama, neighborhood skyline, or master plan view.
Must NOT show: single building interior, apartment, or render/CGI.
Pick the best community-level photo URL from the candidates.
```

**Firecrawl query filter:** Same image extraction logic from `auto-find-developer-images` -- collect all image URLs from markdown, links, and metadata, deduplicate, then use AI to select the best community photo.

**Enrichment single-project change:** The batch size parameter in the Provident enrichment button changes from 10 to 1. The existing "Test Project Enrichment" slug input remains for targeted testing.
