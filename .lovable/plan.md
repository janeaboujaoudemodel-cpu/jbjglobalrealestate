
# Fix Plan: Listing Admin Enrichment, Translation System, and Header Dropdown

This plan addresses three distinct issues: (1) improving the Listing Admin to do full link-based extraction, (2) fixing the translation system that only changes layout direction but not text, and (3) fixing the account dropdown flicker/flash behavior.

---

## Issue 1: Listing Admin -- Full Link-Based Extraction

### Current State
- The `listing-admin-chat` edge function can scrape URLs via Firecrawl but only generates text responses -- it does NOT automatically create/enrich project records in the database.
- The `enrich-project-test` edge function can enrich an existing project from Reelly API and Provident, but not from arbitrary URLs.
- Sunset Bay Grand (slug: `sunset-bay-grand-imtiaz-development-3003`, reelly_id: 3003) exists with description and amenities but has only 1 image, 0 documents, no unit types, no video, no payment plan.

### What Will Be Built

**A. New Edge Function: `extract-from-link`**
- Accepts a URL (any property portal, developer site, Google Drive folder link)
- Uses Firecrawl to scrape the full page content (markdown + links)
- Uses AI (gemini-2.5-flash) to parse the scraped content into structured project data: name, developer, location, description, amenities, USPs, unit types, floor plans, payment plans, images, documents
- For Google Drive links: extracts all file URLs, categorizes by project name/code using folder structure intelligence
- Returns structured JSON that maps to the `projects` table schema
- Can either preview or apply (write to DB) the extracted data

**B. Enhanced Listing Admin Chat**
- When the listing admin pastes a link, the chat will call `extract-from-link` instead of just scraping text
- The response will show a structured "Extraction Preview" card with Before/After data (like `enrich-project-test` does)
- An "Apply" button will write all extracted data to the project
- Smart project matching: uses the project code/name from the URL to find the existing project in the database and merge data

**C. Immediate Action: Enrich Sunset Bay Grand**
- Call `enrich-project-test` with `slug: "sunset-bay-grand-imtiaz-development-3003"` and `action: "apply"` to pull all available data from Reelly (reelly_id: 3003) and Provident
- This will populate images, documents, floor plans, unit types, FAQs, etc.

### Files Changed
- `supabase/functions/extract-from-link/index.ts` -- New edge function
- `supabase/functions/listing-admin-chat/index.ts` -- Enhanced to call extract-from-link and return structured data
- `src/components/listing-admin/ListingAdminChat.tsx` -- Add extraction preview cards with Apply button
- `src/components/listing-admin/ExtractionPreviewCard.tsx` -- New component showing Before/After enrichment data

---

## Issue 2: Translation System Not Working

### Current State
The `LanguageContext.tsx` translation system works correctly at the framework level:
- The `t()` function looks up keys in the current language dictionary and falls back to English
- All 15 language dictionaries have ~1,036 keys each
- RTL direction switching works (hence layout changes from LTR to RTL)

### Root Cause
Many UI components use **hardcoded English strings** instead of `t()` calls. For example, in `MegaMenuAccount.tsx`:
- "My Dashboard", "My Profile", "Favorites", "AI Tools" (lines 137-141) are all hardcoded
- "Owner Dashboard", "Admin Panel", "Customer Happiness Hub" (lines 329-369) are hardcoded
- "Edit Profile", "Select your mode" are hardcoded

The same pattern exists across many components: `GlobalHeader.tsx`, `Footer.tsx`, `DirectContactCTA.tsx`, page titles, section headers, button labels, etc.

### Fix
- Audit all major components and replace hardcoded strings with `t('key')` calls
- Add missing translation keys to all 15 language files
- Priority components (most visible to users):
  1. `MegaMenuAccount.tsx` -- Account dropdown labels
  2. `GlobalHeader.tsx` -- Navigation items and mega menu labels
  3. `Footer.tsx` -- Section titles, card labels, CTA text
  4. `DirectContactCTA.tsx` -- "Ready to Get Started?", button labels
  5. Page titles and section headers across major pages

### Files Changed
- `src/components/header/MegaMenuAccount.tsx` -- Replace ~20 hardcoded strings with t() calls
- `src/components/GlobalHeader.tsx` -- Replace hardcoded nav labels
- `src/components/Footer.tsx` -- Replace hardcoded section titles
- `src/components/DirectContactCTA.tsx` -- Replace hardcoded CTA text
- `src/translations/en.ts` -- Add ~40 new keys
- `src/translations/ar.ts` through all 14 non-English files -- Add matching keys

---

## Issue 3: Account Dropdown Flicker

### Current State
When hovering over the account icon, the MegaMenuAccount dropdown shows a flash of different content:
1. First flash: Shows fewer shortcuts (before `ownerLoading` resolves and `hasListingAdminAccess` query returns)
2. Badge flicker: Shows "Investor + Broker, 0 pts" then changes to "Explorer, Starter, 0 pts" as `tierProgress` and `isCombinedMode` data loads asynchronously
3. Name flicker: Shows email prefix first, then CRM display name

### Root Cause
Multiple async queries (`crmProfile`, `hasListingAdminAccess`, `tierProgress`, `ownerLoading`) resolve at different times, each causing a re-render with different content. The `staleTime: 60000` helps on subsequent opens but not the first load.

### Fix
1. **Pre-fetch on mount**: Move the critical queries (`crmProfile`, `hasListingAdminAccess`, tier data) to the `GlobalHeader` level so they're already cached before the dropdown opens
2. **Unified loading state**: Show a single skeleton state until ALL queries have resolved (not just `ownerLoading`)
3. **Prevent badge content shift**: Use `placeholderData` in the tier progress hook to show a stable default ("Explorer" for investor, "Starter" for broker) immediately, preventing the "Investor + Broker, 0 pts" -> "Explorer, Starter" flash
4. **Fixed layout dimensions**: The container already has `minHeight: 420px` and `minWidth: 600px`, but the content inside still shifts. Add skeleton placeholders for the badge area during loading.

### Files Changed
- `src/components/header/MegaMenuAccount.tsx` -- Add unified loading gate, stable defaults for badges
- `src/components/GlobalHeader.tsx` -- Pre-fetch account menu queries at header mount time
- `src/hooks/useTierProgress.ts` -- Add `placeholderData` for stable initial values

---

## Implementation Order

1. **Header Dropdown Fix** -- Smallest change, immediate visible improvement
2. **Translation System Fix** -- Add t() calls and missing keys to major components
3. **Sunset Bay Grand Enrichment** -- Call existing enrich-project-test to populate data now
4. **Extract-from-link Edge Function** -- New backend capability
5. **Listing Admin Chat Enhancement** -- Frontend integration with extraction previews

---

## Technical Notes

- The translation fix requires adding ~40 new keys across 15 language files. Only the most user-facing components will be addressed in this pass.
- The dropdown fix is primarily a timing/caching issue -- the queries themselves work correctly, they just need to be pre-fetched earlier.
- Sunset Bay Grand already has reelly_id=3003, so the existing `enrich-project-test` function should pull rich data from Reelly's detail API.
- The `extract-from-link` function will use Firecrawl for scraping and Gemini for structured data extraction from the scraped markdown.
