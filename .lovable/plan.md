

# Plan: Listing Generator Fixes, AMRA Document UI, Scroller, Views, Cons, and Monogram Rounding

## 10 Issues to Fix

### 1. Cancel Button for Listing Generator (during processing)
**File**: `src/components/listing-admin/ListingGenerator.tsx`
- Add a `handleCancel` function that:
  - Updates `ai_job_master` row to `status: "cancelled"` via `supabase.functions.invoke("generate-listing", { body: { action: "cancel", job_id: currentJobId } })`
  - Clears the processing state and resets to input step
- Add a visible "Cancel Generation" button in the processing step (line ~856-890), right below the progress bar

**File**: `supabase/functions/generate-listing/index.ts`
- Add a new `action === "cancel"` handler that updates `ai_job_master.status` to `"cancelled"`
- In `runExtraction`, check `ai_job_master.status` before each batch — if `"cancelled"`, abort immediately

### 2. Stop Auto-Generating Fake Project Website URLs
**File**: `supabase/functions/generate-listing/index.ts`
- Review the AI system prompt (line ~241-257) — currently says "Extract ONLY facts explicitly present" which is correct
- The issue is `source_url` in `ListingGenerator.tsx` line 636 maps the user-typed URL to the listing record — this is fine, it stores the source
- The actual `website_url` field for the project record comes from the project table, not from extraction. If the extracted data includes a fake `websiteUrl`, we need to strip it.
- Add explicit instruction to the AI prompt: "NEVER generate or infer a website_url for the project. Only extract if explicitly present as an official developer website link."
- In the save handler, do NOT set `website_url` unless it was manually provided by the user

### 3. Large File Uploads (200MB Cap)
**File**: `src/components/listing-admin/ListingGenerator.tsx`
- Change `isOverSizeLimit` from 50MB to 200MB (line 385)
- Update all size limit UI text (lines 490, 830) to show 200MB
- The storage-first approach already handles large files — files go to `listing-staging` bucket via `uploadFilesToStorage()`
- The edge function fetches from storage URLs, never receives the file directly

### 4. AMRA Document Viewer — Black Screen + Square Corners
**File**: `src/components/project-detail/BookStyleDocuments.tsx`
- The PDF viewer modal (line 176-203) uses `DialogContent` with `bg-black` — this is the "black screen"
- Fix: Change `bg-black` to `bg-card` for proper themed background
- Add `rounded-xl overflow-hidden` to the modal content
- For the iframe area, use `bg-zinc-900` (dark but not pure black) with rounded corners
- The header bar already has proper styling — keep it

### 5. Download Button Active Color (Gold Champagne)
**File**: `src/components/project-detail/BookStyleDocuments.tsx`
- The download button in the viewer (line 183-189) uses `bg-gold text-black` — update to use the premium champagne active gradient: `bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] text-black border border-[#C8A766]/60 font-semibold`

### 6. Double Download Fix
**File**: `src/components/project-detail/ProjectDetailLayout.tsx`
- `handleDocumentDownload` (line 408-436) creates a hidden `<a>` tag and clicks it — this should be fine for a single download
- The BookStyleDocuments `onDownload` callback calls `handleDocumentDownload` again — but the modal download button calls `onDownload(viewerUrl, viewerFilename)` where `viewerUrl` is already proxied. Then `handleDocumentDownload` proxies it again via `maybeProxyStorageUrl`, creating a double proxy situation
- Fix: In `BookStyleDocuments.tsx`, the download button in the modal should do its own blob download directly (like `PremiumBrochureCard` does) instead of calling `onDownload` which double-proxies and double-triggers

### 7. Payment Plan — Strict Document-Only Extraction
**File**: `supabase/functions/generate-listing/index.ts`
- Strengthen the AI prompt to explicitly say: "Payment plan milestones and percentages MUST be extracted VERBATIM from the source document. Do NOT infer, calculate, or generate payment breakdown percentages. If a payment plan document is not provided or the information is not explicitly stated, set paymentBreakdown to an empty array and paymentPlan to null."
- Add: "NEVER alter, recalculate, or adjust prices, locations, or amenities. Report EXACTLY as found in the documents."

### 8. Add Missing View Options
**File**: `src/constants/filterConfig.ts`
- Add to `VIEWS_OPTIONS` array (after line 148):
  - `{ value: "lagoon_view", label: "Lagoon View" }` — already exists, good
  - `{ value: "ras_al_khor_view", label: "Ras Al Khor View" }` — NEW
  - `{ value: "wildlife_sanctuary_view", label: "Wildlife Sanctuary View" }` — NEW  
  - `{ value: "dubai_skyline_view", label: "Dubai Skyline" }` — NEW (currently `skyline_view` exists but not "Dubai Skyline" specifically)

**File**: `src/components/ProjectFilters.tsx`
- Add "Ras Al Khor View", "Wildlife Sanctuary View", "Dubai Skyline" to `VIEW_OPTIONS` array (line 126-148)

### 9. Premium Scroller — Remove Gray, Enlarge Gold
**File**: `src/components/ui/PremiumHorizontalScrollHint.tsx`
- Increase arrow button sizes: `sm` from `w-6 h-6` to `w-8 h-8`, icons from `w-3 h-3` to `w-4 h-4`
- Increase gold rail thickness from `h-[3px]` to `h-[5px]` (line 85)
- Increase thumb from `h-full` to match

**File**: `src/components/project-detail/ProjectDetailLayout.tsx`
- Remove `scrollbar-hide` from the tab nav container (line 662) to let our custom rail be the only scroll indicator
- The `scrollbar-hide` class is what shows the browser gray scrollbar during active scroll on some devices — removing it plus having our gold rail gives the premium-only experience

**File**: `src/components/filters/FilterShortcutBar.tsx`
- Confirm `scrollbar-hide` is removed from the filter rows where `PremiumHorizontalScrollHint` is used

### 10. AMRA Cons — Remove 2 Keep 1
The cons come from the AI analyzer (`ProjectAIAnalyzer.tsx`) — they are **dynamically generated** by the `ai-property-analyzer` edge function each time. Not hardcoded.

**File**: `supabase/functions/ai-property-analyzer/index.ts`
- Add to the system prompt: "When analyzing AMRA by AHS Properties: Do NOT list 'limited historical market data' or 'unproven developer track record for UAE' as cons — AHS has strong demand and sold-out projects in the UAE. The AI companion is a free gift, so do not present it as a risk. Focus on genuine market-based risks only."
- This ensures the AI doesn't generate those specific incorrect cons

### 11. Recommended Projects — Reduce Monogram Logo Rounding
**File**: `src/components/project-detail/RecommendedProjects.tsx`
- Line 129: Developer logo uses `rounded-xl` — reduce to `rounded-lg` for less rounded corners

## Files to Create/Modify

1. `src/components/listing-admin/ListingGenerator.tsx` — Cancel button + 200MB limit
2. `supabase/functions/generate-listing/index.ts` — Cancel action + prompt fixes (no fake URLs, strict payment plans)
3. `src/components/project-detail/BookStyleDocuments.tsx` — Fix black screen, rounded corners, download button styling, prevent double download
4. `src/constants/filterConfig.ts` — Add missing view options
5. `src/components/ProjectFilters.tsx` — Add missing view options
6. `src/components/ui/PremiumHorizontalScrollHint.tsx` — Enlarge arrows + gold rail
7. `src/components/project-detail/ProjectDetailLayout.tsx` — Remove gray scrollbar
8. `supabase/functions/ai-property-analyzer/index.ts` — Fix AMRA cons
9. `src/components/project-detail/RecommendedProjects.tsx` — Reduce logo rounding

