

## Plan: Replace Chat with Listing Portal-Style Generator in /listing-admin

### Problem Analysis

The current `ListingAdminChat` has several issues:
1. **Slow extraction**: Files upload to storage → Firecrawl tries to read PDFs as text (often fails for PDFs with images) → AI extracts from text → saves. This chain takes 40+ seconds and often misses data from image-heavy PDFs/brochures.
2. **Duplicate failures**: `pending_project_imports_source_url_unique` constraint causes hard crashes instead of offering merge/replace options.
3. **Incomplete extraction**: PDFs sent through Firecrawl lose visual content (floor plans, renders, payment plan graphics). The AI only sees text, missing critical visual information.
4. **No structured flow**: Chat UX makes it unclear what inputs are needed and what the output will be.

### Solution: Listing Generator Tab

Replace the chat view with a structured **Listing Generator** — a multi-step form inspired by the existing `ListingPortalSubmit` but adapted for admin use. The key improvement: send documents as **images directly to vision AI** (gemini-2.5-pro) instead of extracting text first, so floor plans, payment graphics, and renders are fully understood.

---

### Implementation

#### 1. New Component: `ListingGenerator.tsx`
**File:** `src/components/listing-admin/ListingGenerator.tsx`

A 4-step flow:

**Step 1 — Input** (Upload + URL + Description)
- Drag & drop zone for documents (PDFs, images, brochures)
- URL input field for project webpage
- Optional text area for pasting additional project description
- "Generate Listing" button

**Step 2 — Processing**
- Upload files to storage
- Send images/PDFs as base64 to a new edge function (`generate-listing`) that uses **gemini-2.5-pro with vision** for exhaustive extraction
- If URL provided: Firecrawl scrapes it and appends content
- Show real-time progress

**Step 3 — Duplicate Check**
- Query `projects` and `pending_project_imports` by slug/name similarity
- If match found: show dialog with 3 options:
  - **Merge** — combine new data with existing (adds missing fields, merges media)
  - **Replace** — overwrite existing pending import
  - **Save as New** — create separate pending import
- If no match: proceed directly

**Step 4 — Preview & Approve**
- Show full extracted listing preview (inline, not a separate page)
- All sections visible: description, amenities, payment plan, unit types, floor plans, gallery, location, nearby landmarks
- Edit capability for any field before saving
- "Save to Pending" button

#### 2. New Edge Function: `generate-listing`
**File:** `supabase/functions/generate-listing/index.ts`

Key differences from `extract-listing-from-link`:
- **Vision-first**: Sends PDFs/images as base64 image_url content parts to `gemini-2.5-pro` (not text extraction)
- **Single AI call**: One comprehensive call with ALL documents as images + any scraped URL text
- **Max 80K context**: Aggregates all inputs into one prompt
- **Exhaustive schema**: Same tool-calling schema as current but enforced with vision model
- **No async queue**: Synchronous response (vision model is fast enough for 5-10 documents)
- **Duplicate detection built-in**: Returns matching projects from DB before insert
- **Returns structured data without inserting**: The frontend handles merge/replace/new logic

#### 3. Update `ListingAdmin.tsx`
- Replace `ListingAdminChat` import with `ListingGenerator`
- The 'chat' view becomes 'generator' view
- Nav button label changes from "Sarah AI" to "Generate Listing"
- Keep all existing data-ops tabs untouched

#### 4. Duplicate Resolution Logic
**In `ListingGenerator.tsx`:**
- After extraction, query:
  ```sql
  SELECT id, name, slug, source_url, status FROM pending_project_imports 
  WHERE slug = :slug OR name ILIKE '%:name%' LIMIT 5
  ```
  ```sql
  SELECT id, name, slug FROM projects 
  WHERE slug = :slug OR name ILIKE '%:name%' LIMIT 5
  ```
- Show matches with options: Merge / Replace / Save New
- **Merge**: PATCH existing record, merge images/documents arrays
- **Replace**: DELETE old + INSERT new
- **Save New**: INSERT with unique slug suffix

#### 5. Config Update
**File:** `supabase/config.toml`
- Add `[functions.generate-listing]` with `verify_jwt = false`

---

### Files Modified/Created
- **Create** `src/components/listing-admin/ListingGenerator.tsx` — the new multi-step generator
- **Create** `supabase/functions/generate-listing/index.ts` — vision-first extraction function
- **Edit** `src/pages/ListingAdmin.tsx` — swap chat for generator, update nav
- **Edit** `supabase/config.toml` — add new function entry

### What This Fixes
- **Speed**: Vision model processes documents in one call (~15-20s vs 40+s)
- **Completeness**: AI sees actual images of floor plans, payment graphics, amenity icons
- **Duplicates**: Structured merge/replace/new flow instead of constraint crashes
- **UX**: Clear step-by-step flow instead of ambiguous chat

