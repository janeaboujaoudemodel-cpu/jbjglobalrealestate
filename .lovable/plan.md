

# Fix Enrichment Tester, Backfill Numbers, and Lead Popup Enhancement

## Issues Found

### Issue 1: Enrichment Test Shows All Zeros (Root Cause Found)
The `enrich-project-test` edge function uses the **wrong authentication header** for the Reelly API:
- **Current (broken):** `Authorization: Bearer ${apiKey}` (line 21)
- **Correct (used everywhere else):** `X-API-Key: ${apiKey}`

This causes every Reelly API call to fail silently, returning `null`, so before and after are identical (all zeros).

Additionally, the Provident URL is wrong -- it appends the full slug (e.g., `binghatti-titania-binghatti-3012`) but Provident URLs don't include the Reelly ID suffix. The function should strip `-{reellyId}` from the slug.

### Issue 2: Fetch Missing Details Shows Zeros
The `reelly-fetch-details` function operates on the `pending_project_imports` table, not the `projects` table. If there are no pending imports (all were already approved), it correctly returns zero. This is a legacy function. The actual detail fetching for approved projects is done by `reelly-backfill-projects`. The UI needs to either call the correct function or be labeled accurately.

### Issue 3: Backfill Numbers Inconsistent
The backfill UI shows "processed 1200, remaining 999" because it accumulates from previous runs stored in `sync_jobs`. The total (1200 + 999 = 2199) exceeds the actual project count (~1805) because it's double-counting previous progress. The remaining count comes from the API response but the processed count sums across sessions.

### Issue 4: No Listing Card Preview
The enrichment test only shows numeric before/after comparisons. The user wants to see an actual rendering of the project card and listing page before and after enrichment.

### Issue 5: Lead Popup Needs More Fields
Current popup has: Name, Email, Phone, Interest (buying/selling/renting/investing/exploring).
Needs: Nationality, Preferred Language, Preferred Contact Time, and Services category with subcategories.

### Issue 6: Lead Popup Insert Broken
The `crm_leads` table no longer has `email`, `phone`, or `status` columns. The correct columns are `email_lower`, `phone_e164`, and `pipeline_stage`. The popup insert is silently failing.

### Issue 7: Select Dropdown Hover Shows Blue
The native `<select>` and `<option>` elements show default blue highlight on hover/focus. This needs CSS override to match the gold/champagne theme.

---

## Fixes

### Fix 1: Repair `enrich-project-test` Edge Function
**File:** `supabase/functions/enrich-project-test/index.ts`

- Line 21: Change `Authorization: Bearer ${apiKey}` to `X-API-Key: ${apiKey}` (matching all other Reelly functions)
- Line 29: Fix Provident URL to strip the Reelly ID suffix from slug: extract base slug by removing `-{reellyId}` pattern
- Add listing card data to the response (cover image, developer name, area, price) so the UI can render a card preview

### Fix 2: Add Listing Card Preview to Enrichment UI
**File:** `src/components/listing-admin/ReellyImportPanel.tsx` (lines 2606-2710)

Add two visual card previews side-by-side in the enrichment results:
- **Before card**: Shows the project as it currently appears (cover image, name, developer, area, price, amenity count)
- **After card**: Shows how it would look after enrichment (same layout but with enriched data highlighted)
- Include the cover image, not just numbers

### Fix 3: Fix Backfill Progress Math
**File:** `src/components/listing-admin/ReellyImportPanel.tsx` (lines 740-800)

The aggregation logic double-counts by adding previous job stats to new API response stats. Fix: Use the API's `remaining` count as the single source of truth for what's left. Show `total = updated + failed + remaining` instead of accumulating across sessions.

### Fix 4: Fix "Fetch Missing Details" to Use Correct Function
**File:** `src/components/listing-admin/ReellyImportPanel.tsx` (line 628)

Change `handleFetchMissingDetails` to invoke `reelly-backfill-projects` with `mode: "batch"` instead of `reelly-fetch-details`, since the latter only works on `pending_project_imports` (legacy). Or alternatively, update `reelly-fetch-details` to also operate on the `projects` table.

### Fix 5: Enhance Lead Capture Popup
**File:** `src/components/LeadCapturePopup.tsx`

Add new fields while keeping the existing champagne/gold styling locked:
- **Nationality** dropdown (common nationalities: UAE, India, UK, Pakistan, Russia, China, etc.)
- **Preferred Language** dropdown (English, Arabic, Hindi, Russian, Chinese, French)
- **Preferred Contact Time** dropdown (Morning, Afternoon, Evening, Anytime)
- Change "Interest" label to **"Services"** with subcategories: Buying, Selling, Renting, Investing, Property Management, Mortgage Advisory, Legal Services, Partnerships

Fix the insert to use correct column names:
- `email` becomes `email_lower` (lowercased)
- `phone` becomes `phone_e164`
- `status: "new"` becomes `pipeline_stage: "new"`

### Fix 6: Fix Dropdown Hover Color
**File:** `src/components/LeadCapturePopup.tsx`

Replace native `<select>` with a styled Radix `Select` component that uses gold/champagne colors for hover states instead of browser-default blue. All option hover states use `bg-gold/20 text-black` instead of the default blue.

---

## Technical Summary

| File | Changes |
|---|---|
| `supabase/functions/enrich-project-test/index.ts` | Fix auth header from `Bearer` to `X-API-Key`; fix Provident URL; add card data to response |
| `src/components/listing-admin/ReellyImportPanel.tsx` | Add before/after card previews; fix backfill math; fix fetch details to use correct function |
| `src/components/LeadCapturePopup.tsx` | Add nationality, language, contact time, services fields; fix DB column names; replace native select with styled Radix Select |

## Execution Order
1. Fix `enrich-project-test` auth header and Provident URL (root cause of all-zeros)
2. Deploy and verify enrichment returns real data
3. Add card preview UI to enrichment results
4. Fix backfill progress counting
5. Fix "Fetch Missing Details" function call
6. Enhance lead popup with new fields and correct DB columns
7. Replace native selects with themed Radix Select components
