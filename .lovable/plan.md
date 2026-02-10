

# Full Project Detail Audit and Data Enrichment Plan

## Summary of Issues Found

1. **Download doesn't auto-download** -- clicking Download on photos opens a new tab instead of saving the file (CORS blocks the fetch-blob approach for external URLs like Reelly CDN)
2. **Missing amenities/USP data** -- 1,809 out of 1,809 projects have NULL amenities and NULL USP bullets
3. **Missing location distances** -- not populated for most projects
4. **Date format wrong globally** -- dates display raw ISO format (`2026-01-02`) instead of human format (`02 Jan 2026`)
5. **Construction progress data incorrect** -- e.g., Palm Central shows 50% with start date Jan 2026 and completion 2029 (bad source data)
6. **Hero images blurry** -- Provident CDN images normalized to 464x312 (small); hero needs full-resolution
7. **Brochures/documents not auto-downloading** -- same `window.open` issue

---

## Part 1: Fix Auto-Download for Photos and Documents

**Problem:** `ImageCarousel.tsx` line 56-72 uses `fetch()` to get a blob, but external CDN URLs (Reelly, Provident) block cross-origin requests, so it falls back to `window.open()` which just opens the image in a new tab.

**Fix in `src/components/ImageCarousel.tsx`:**
- Use a hidden `<a>` tag with the `download` attribute
- For cross-origin images that can't be fetched as blob, route through the existing `download-file` edge function proxy which adds `Content-Disposition: attachment`
- Apply the same fix to `handleDocumentDownload` in `ProjectDetailLayout.tsx` (line 351-353) -- use the download proxy with `Content-Disposition: attachment` instead of `window.open`

**Fix in `supabase/functions/download-file/index.ts`:**
- Ensure the proxy sets `Content-Disposition: attachment; filename="..."` header so the browser auto-downloads instead of displaying

---

## Part 2: Fix Date Format Globally

**Problem:** Dates like `2026-01-02` display raw. User wants `02 Jan 2026` format (DD Mon YYYY).

**Create a shared date formatter utility:**

**New file: `src/utils/formatDate.ts`**
- Single function `formatDisplayDate(dateStr)` that:
  - Parses ISO dates (`2026-01-02`) and quarter strings (`Q1 2026`)
  - Returns formatted `02 Jan 2026` format
  - Handles edge cases (null, invalid)

**Apply in these files:**
- `ConstructionTimelineSection.tsx` -- lines 86, 100, 114 (construction started, expected completion, handover)
- `QuickFactsBar.tsx` -- line 63 already uses `toLocaleDateString("en-GB")` but needs consistency
- `ProjectDetailLayout.tsx` -- line 519 (hero handover date), line 622 (key facts handover)
- `RecommendedProjects.tsx` -- line 107 (handover badge)

---

## Part 3: Fix Construction Progress Data Accuracy

**Problem:** Palm Central shows `construction_start_date: 2026-01-02` with `construction_progress: 50%` -- impossible. The Reelly API returns this data; the construction_progress values from Reelly are unreliable for projects that haven't started yet.

**Fix in `ConstructionTimelineSection.tsx`:**
- Add a validation check: if `construction_start_date` is in the future, override progress to 0% and show "Pre-Construction" stage
- If progress is provided but mathematically impossible (e.g., started 1 month ago but shows 50% with 3+ years remaining), cap the displayed progress based on elapsed time vs total timeline

---

## Part 4: Fix Hero Image Quality (Blurry Photos)

**Problem:** `src/lib/imageUtils.ts` line 65 normalizes Provident CDN images to `464x312` -- this is fine for thumbnails but the hero section uses the same normalized URL, resulting in a blurry full-screen image.

**Fix in `src/lib/imageUtils.ts`:**
- Add a `normalizeProvidentImageUrl(url, size?)` parameter for target size
- Default remains `464x312` for cards/thumbnails
- Export a `getHighResImageUrl(url)` variant that uses a larger size like `1920x1080` for hero sections

**Fix in `ProjectDetailLayout.tsx`:**
- Line 238: Apply `getHighResImageUrl()` to `heroImage` instead of the default normalized size
- The cover_image_url from the database should also prefer the highest resolution available

---

## Part 5: Data Enrichment Test (One Project Before/After)

**Build a test enrichment flow in the admin panel:**

**New edge function: `enrich-project-test`**
- Accepts a project slug
- Fetches enrichment data from both Reelly API (via reelly_id) and Provident (via slug match)
- Returns a "before" snapshot and "after" preview showing:
  - Amenities found
  - USP bullets found
  - Location distances found
  - Documents/brochures found
  - Gallery images count
- Does NOT write to DB -- preview only

**New admin UI section in `ReellyImportPanel.tsx`:**
- "Test Enrichment" card with input for project slug
- Shows before/after comparison
- Links to the Reelly source and Provident source
- "Approve & Apply" button to write the enrichment

Once approved on one project, the same logic runs in bulk for all 1,809 projects.

---

## Part 6: Download Proxy Enhancement

**Fix in `supabase/functions/download-file/index.ts`:**
- Ensure `Content-Disposition: attachment` header is set on all proxied responses
- This makes brochure PDFs, floor plans, and images auto-download when clicked

---

## Files to Create/Modify

| File | Change |
|---|---|
| `src/utils/formatDate.ts` | NEW -- shared date formatter (DD Mon YYYY) |
| `src/components/ImageCarousel.tsx` | Route downloads through proxy for auto-save |
| `src/components/project-detail/ProjectDetailLayout.tsx` | Use proxy for document downloads; apply high-res hero image; use formatDisplayDate |
| `src/components/project-detail/ConstructionTimelineSection.tsx` | Validate progress vs dates; use formatDisplayDate |
| `src/components/project-detail/QuickFactsBar.tsx` | Use formatDisplayDate |
| `src/components/project-detail/RecommendedProjects.tsx` | Use formatDisplayDate for handover badge |
| `src/lib/imageUtils.ts` | Add getHighResImageUrl for hero sections |
| `supabase/functions/download-file/index.ts` | Ensure Content-Disposition: attachment |
| `supabase/functions/enrich-project-test/index.ts` | NEW -- test enrichment from Reelly + Provident |
| `src/components/listing-admin/ReellyImportPanel.tsx` | Add test enrichment UI section |

## Execution Order

1. Date formatter + apply globally (quick win, visible immediately)
2. Construction progress validation (fixes Palm Central issue)
3. Auto-download fix (proxy + Content-Disposition)
4. Hero image quality fix
5. Test enrichment edge function + admin UI
6. Test on one project, show before/after
7. Once approved, bulk enrichment for all projects

