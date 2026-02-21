

# Comprehensive Fix: Projects Performance, Unit Types, Listing Portal, Price Predictor, and Client Database

## Overview
This plan addresses all reported issues across the Projects section, Listing Portal, and backend systems. It covers performance optimization, data completeness, listing workflow improvements, and a new client investor database.

---

## 1. Projects Loading Performance

**Problem:** Projects page loads slowly because it fetches from both the database (batch 5000) AND the Reelly API simultaneously, with the API being the bottleneck.

**File: `src/pages/PropertiesReelly.tsx`**
- Remove the `useReellyProjects()` API call entirely — the database already has 1,849+ published projects mirrored locally
- Use only `useProjectsListing()` (local database) as the data source
- This eliminates the slow edge function round-trip and reduces load time from ~5-8s to under 1s
- Keep the merge logic but make it DB-only: remove lines 155-163 (API fetch) and simplify `mergedProjects` to use `dbProjectsMapped` directly

---

## 2. Unit Types Data Enrichment

**Problem:** `unit_types` data exists for only 214 of 1,849 projects, and the data that exists is poorly structured (just `{type: "Unit", bedrooms: X}` with no sizes or prices). The UnitInventorySection shows empty because the raw data lacks `size_from`, `size_to`, `price_from`, `price_to`.

**Fix: Transform raw unit_types into grouped, displayable data**

**File: `src/pages/ProjectDetail.tsx` (asUnitTypes function, line 83-99)**
- Enhance `asUnitTypes` to aggregate raw unit entries: group by bedroom count, generate proper labels ("Studio", "1 Bedroom", "2 Bedrooms", etc.), and calculate unit counts per type
- Use project-level `price_from`/`price_to` and `size_min`/`size_max` as fallback values when individual unit prices/sizes are missing
- This ensures UnitInventorySection renders meaningful cards even with minimal raw data

**New backend function: `reelly-enrich-unit-types`**
- Create an edge function that iterates projects with missing/incomplete `unit_types` and queries the Reelly API detail endpoint for richer unit data (sizes, prices per unit type)
- Run as a one-time enrichment job, then schedule as part of the daily sync

---

## 3. AI Project Intelligence Loading Logo

**Problem:** The monogram shows with a white box/background during the loading state.

**File: `src/components/project-detail/ProjectAIAnalyzer.tsx` (lines 256-266)**
- The component already imports `jbj-monogram-nobuffer.png` which should be transparent
- Verify the image file is truly transparent (no white background baked in)
- If the PNG has a white background, switch to `jbj-monogram-transparent.png` from `BrandMonogram.tsx`
- Add explicit `mix-blend-mode: multiply` or ensure the `<img>` has no background container that adds white

---

## 4. Listing Portal: Auto-Label Sale/Rent from URL

**Problem:** The `?purpose=sale` or `?purpose=rent` URL parameter is passed but never read in `ListingPortalSubmit.tsx`. The listing type is not synchronized with the category or filters.

**File: `src/pages/ListingPortalSubmit.tsx`**
- Add `useSearchParams` import and read the `purpose` parameter
- Initialize `form.listing_type` from the URL: `sale` or `rent`
- Auto-select the correct `listingCategory` based on purpose:
  - `purpose=rent` maps to `rental` category
  - `purpose=sale` maps to `secondary_offplan` category
- Show a visual badge ("For Sale" / "For Rent") in the header to confirm the listing type
- Sync the listing type with the portal filters on the ListingPortal page

---

## 5. Price Predictor Fix

**Problem:** The price predictor calls `property-evaluation` edge function which requires authentication and has rate limiting. It's timing out or erroring.

**File: `supabase/functions/property-evaluation/index.ts`**
- The function has aggressive rate limiting and IP blocklist checks
- Add better error messages returned to the client so the UI can display actionable feedback
- Increase the timeout tolerance and add a fallback calculation path that doesn't require AI (use the local `communityPrices` data directly)

**File: `src/pages/ListingPortalSubmit.tsx` (runPricePredictor, lines 263-303)**
- Add a timeout wrapper (15s) with graceful fallback
- If the edge function fails, calculate a basic estimate client-side using community average prices
- Show a "Basic Estimate" badge vs "AI Predicted" badge to indicate the quality level
- Fix the bedrooms field: when AI extracts "1" bedroom, ensure it maps to the form correctly (currently the issue is bedrooms showing "N/A" because the value isn't being read from extracted data properly)

---

## 6. Listing Photos: Save and Project Enrichment Pipeline

**Problem:** When users upload photos for their listing, the photos need to be (a) saved with the listing, (b) matched to existing projects, and (c) presented to the admin as enrichment suggestions.

### 6A. Photo Persistence
**File: `src/pages/ListingPortalSubmit.tsx`**
- Photos are already being uploaded to the `listing-documents` storage bucket and URLs saved to `uploadedImageUrls`
- These are already saved to `portal_listings.images` and `portal_listings.gallery_images`
- Verify this flow works end-to-end (it appears correct in the code)

### 6B. Project Matching and Enrichment Suggestions
**New table: `listing_enrichment_suggestions`**
```sql
CREATE TABLE listing_enrichment_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES portal_listings(id),
  project_id UUID REFERENCES projects(id),
  project_name TEXT,
  suggestion_type TEXT, -- 'photos', 'amenities', 'details'
  before_data JSONB,
  after_data JSONB,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  created_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID
);
```

**New edge function: `listing-enrichment-matcher`**
- Triggered after listing submission (non-blocking)
- Matches `project_name` from the listing to existing projects in the database using fuzzy name matching
- If match found: creates an enrichment suggestion with before/after data (existing photos vs new photos, existing amenities vs AI-extracted amenities)
- Flags sensitive documents (SPA, reservation agreements, personal data) as "private" — stored but never suggested for public enrichment

### 6C. Admin Panel: Enrichment Review
**File: `src/pages/Admin.tsx` or new component**
- Add a notification/section in the admin panel showing pending enrichment suggestions
- Display before/after comparison cards: existing project data vs proposed updates
- "Approve" button applies the changes to the project record
- "Reject" button dismisses the suggestion

---

## 7. Client/Investor Database from Documents

**Problem:** User wants to extract client information from uploaded SPAs, reservation agreements, and other documents to build a client database with handover alerts.

### 7A. New Database Table
```sql
CREATE TABLE client_investors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT,
  email TEXT,
  phone TEXT,
  home_address TEXT,
  date_of_birth DATE,
  project_name TEXT,
  project_id UUID REFERENCES projects(id),
  unit_number TEXT,
  unit_type TEXT, -- '1BR', '2BR', etc.
  unit_size_sqft NUMERIC,
  purchase_price NUMERIC,
  purchase_date DATE,
  handover_date DATE,
  payment_plan TEXT,
  source_document_type TEXT, -- 'spa', 'reservation', 'booking_form'
  source_listing_id UUID REFERENCES portal_listings(id),
  notes TEXT,
  handover_alert_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
-- RLS: Owner-only access
ALTER TABLE client_investors ENABLE ROW LEVEL SECURITY;
```

### 7B. AI Document Extraction Enhancement
**File: `supabase/functions/ai-listing-extractor/index.ts`**
- Enhance the AI prompt to also extract client/buyer information when documents contain SPAs or reservation agreements
- Add a separate `client_data` field in the response: `{ client_name, email, phone, home_address, unit_number, purchase_price, purchase_date, date_of_birth }`
- This data is saved to `client_investors` but flagged as sensitive (never published)

### 7C. Handover Alert System
**New edge function: `handover-alerts`**
- Scheduled daily via pg_cron
- Queries `client_investors` where `handover_date` is within 30 days, 14 days, 7 days, or today
- Creates alert entries in a `handover_alerts` table
- Displays in the admin panel as notifications

---

## 8. Listing Edit, Delete, and Restore

**Problem:** Users need to edit listings post-submission (re-triggers approval), delete with confirmation and soft-delete for restoration.

### 8A. Database Changes
```sql
ALTER TABLE portal_listings ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE portal_listings ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE portal_listings ADD COLUMN IF NOT EXISTS edit_count INTEGER DEFAULT 0;
```

### 8B. My Listings Page Enhancement
**File: `src/pages/ListingPortalMyListings.tsx`**
- Add "Edit" button that navigates to `/listing-portal/submit?edit=<listing_id>`
- Replace `confirm('Delete this listing?')` with a proper confirmation dialog (AlertDialog component)
- Soft-delete: set `deleted_at = now()` instead of hard delete
- Add a "Recently Deleted" tab showing soft-deleted listings with "Restore" button
- Restore: clears `deleted_at`, sets status back to previous state

### 8C. Edit Flow
**File: `src/pages/ListingPortalSubmit.tsx`**
- Read `?edit=<id>` from URL params
- If editing: load existing listing data, pre-fill all form fields
- On submit: update instead of insert, increment `edit_count`, reset `approval_status` to 'pending'
- Re-create approval workflow entries

### 8D. Paid Listing Expiration
- When `contact_mode === 'direct'` (paid), set `expires_at = now() + 30 days`
- Show a countdown badge on the listing card
- A daily cron job marks expired listings as `status = 'expired'`

---

## 9. Amenities Section Cleanup

**File: `src/components/project-detail/AmenitiesWithPhotos.tsx`**
- The amenities photo mapping uses stock/placeholder images. "Conference Halls" likely maps to a missing photo URL
- Add fallback icons (Lucide) for amenities without photos
- Clean up the grid layout for a more polished look

---

## Execution Order

1. **Projects performance** — Remove API fetch, use DB-only (immediate speed fix)
2. **URL purpose parameter** — Auto-label sale/rent in ListingPortalSubmit
3. **Price predictor fix** — Add timeout, fallback calculation, fix bedrooms mapping
4. **AI loading logo** — Fix transparent monogram
5. **Unit types aggregation** — Enhance asUnitTypes for better display
6. **Database migrations** — Create `client_investors`, `listing_enrichment_suggestions`, add soft-delete columns
7. **Listing edit/delete/restore** — Full My Listings workflow
8. **Enrichment pipeline** — Project matching edge function + admin review UI
9. **Client extraction** — Enhanced AI extractor + handover alerts
10. **Amenities cleanup** — Photo fallbacks

---

## Technical Summary

| # | Component | Change |
|---|-----------|--------|
| 1 | PropertiesReelly.tsx | Remove API fetch, DB-only for speed |
| 2 | ListingPortalSubmit.tsx | Read `?purpose=` param, auto-label sale/rent |
| 3 | property-evaluation/index.ts | Better error handling, fallback path |
| 4 | ProjectAIAnalyzer.tsx | Fix monogram white background |
| 5 | ProjectDetail.tsx | Aggregate unit_types for display |
| 6 | Database | New tables: client_investors, listing_enrichment_suggestions |
| 7 | ListingPortalMyListings.tsx | Edit, soft-delete, restore, expiration |
| 8 | listing-enrichment-matcher (new) | Match listings to projects, suggest enrichment |
| 9 | ai-listing-extractor/index.ts | Extract client/buyer PII from documents |
| 10 | handover-alerts (new) | Daily cron for handover reminders |
| 11 | AmenitiesWithPhotos.tsx | Photo fallbacks, cleaner grid |

