

# Plan: Premium Recent Search Cards + Developer Logo Fix + Listing Generator Improvements

## 3 Areas of Work

### 1. Premium "Continue Searching" Cards with 3D Walking Strip Effect

**Current state**: Flat cards in a grid with basic hover scale. Missing developer logos for 3 of 6 projects because when the project was viewed, the `developer` relation data wasn't cached in localStorage properly — the `developerLogo` field gets set from `(project?.developer as any)?.logo_url`, which works correctly. The issue is that these cards were stored in localStorage **before** the logo fix was deployed, so they have stale data with no `developerLogo`.

**Changes to `src/components/ContinueSearching.tsx`:**
- Replace the static grid with a **horizontal scrolling strip** (walking carousel) that auto-scrolls slowly like a conveyor belt, pauses on hover
- Add **3D perspective/tilt** on hover using CSS `transform: perspective(800px) rotateY()` with `transform-style: preserve-3d`
- Add a **premium glass/gold layered background** behind the cards — subtle gradient glow with gold reflections
- Add gold shimmer border animation on hover
- For the **missing developer logos**: when `developerLogo` is missing but the project has a `subtitle` (developer name), do a **live DB lookup** to fetch the developer's `logo_url` and update the localStorage entry. This is a one-time self-healing fix.

**File**: `src/components/ContinueSearching.tsx`
- Rewrite the cards grid to a horizontal auto-scrolling strip with 3D hover transforms
- Add a premium backdrop layer (dark gradient + gold accent line)
- Add a `useEffect` that checks items missing `developerLogo`, queries the `developers` table by name, and patches localStorage

**File**: `src/hooks/useRecentSearches.ts`
- Add a `patchItem` function that can update a single item's fields in storage (for the logo self-heal)

### 2. Developer Logo Self-Healing for Recent Searches

**File**: `src/components/ContinueSearching.tsx`
- On mount, for each item where `type === "property"` and `!developerLogo` and `subtitle` exists:
  - Query `developers` table: `.select("logo_url").ilike("name", subtitle).single()`
  - If found, update the item's `developerLogo` in localStorage via `patchItem()`
- This ensures all recent cards always show the developer monogram/logo

### 3. Listing Generator Improvements — Large Files & Comprehensive Extraction

**Current limitations identified:**
- File size limit is 50MB total (line 382) — fine for most use cases
- AI extraction uses `google/gemini-2.5-flash` with 12K max tokens — could miss data on large brochures
- System prompt asks to "extract ONLY facts explicitly present" which is correct
- Video extraction is not handled (no video URL field in schema)
- Schema lacks `videoUrl`, `views`, and `usps` fields

**Changes to `supabase/functions/generate-listing/index.ts`:**
- Add `videoUrl`, `views`, `usps` (unique selling propositions) fields to `projectSchema`
- Increase `max_tokens` from 12000 to 16000 for richer extraction
- Enhance system prompt to explicitly request: video links, property views, USPs, lifestyle features
- Add `views` and `usps` to the merge logic in `mergeExtractedProjects`
- For large PDFs: the batch-of-2 system already handles this, but add retry logic with `google/gemini-2.5-pro` as fallback for complex documents

**Changes to `src/components/listing-admin/ListingGenerator.tsx`:**
- Add `videoUrl`, `views`, `usps` fields to the `ExtractedData` interface
- Map these new fields to DB columns in the save handler: `video_url`, `views`, `usps`
- Show video URL, views, and USPs in the preview step
- Increase size limit display from 50MB to 100MB (with chunked upload for large files)

**Changes to the save record (lines 601-635):**
- Add `video_url: extracted.videoUrl`
- Add `views: extracted.views` (array of view types)
- Add `usps: extracted.usps` (array of selling points)

## Files to Modify
1. `src/components/ContinueSearching.tsx` — Premium 3D walking strip cards + developer logo self-heal
2. `src/hooks/useRecentSearches.ts` — Add `patchItem` function for updating individual items
3. `supabase/functions/generate-listing/index.ts` — Enhanced schema, prompt, video/views/USPs extraction
4. `src/components/listing-admin/ListingGenerator.tsx` — New fields in interface, preview, and save logic

