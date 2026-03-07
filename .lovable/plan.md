

# Fix Plan: Multiple Project Detail & Homepage Issues

## Issues Identified

### 1. Homepage "Continue Searching" shows only Amra + blue title
- The `ContinueSearching` component correctly pulls from `localStorage` — it only shows Amra because that's the only recently viewed project. This is working as designed.
- **Title color issue**: The `h2` uses `text-foreground` which in the dark `bg-black` section renders differently. On the homepage it's rendered with `className="bg-black"`, so `text-foreground` resolves to white/light. Need to verify and ensure it's **black text with gold icon** as requested — but since it's on a black background, it needs to be **white** text there. The user said "black + gold" which works on light backgrounds. Will use `text-white` on the homepage dark background version.

**Fix**: In `ContinueSearching.tsx`, change `text-foreground` to `text-white` when className includes `bg-black`, or pass a `dark` prop. Simpler: since the component is always used on black backgrounds on homepage, just set title to `text-white` (it already is `text-foreground` which should be white on dark themes). Check if the issue is actually something else — possibly the dynamic title containing a link or styled element.

Looking closer: the title `sectionTitle` is a plain string concatenation — no blue styling in the code. The `text-foreground` class on the homepage `bg-black` section should render white. This suggests the issue might be in dark mode CSS or the `text-foreground` variable. Will explicitly set `text-white` for the dark variant.

### 2. Duplicate photos in Amra gallery
- DB has 2 rows with **different URLs** (different upload timestamps: `1772829717579` vs `1772836146068`) — same physical photo uploaded twice via the extraction pipeline. The `filterValidImages` dedup normalizes by `host + pathname` but these are different pathnames.
- **Root cause**: The extraction re-uploaded the same file twice, creating two distinct storage URLs for the same image.
- **Fix**: Add content-based dedup at the `ProjectDetail.tsx` mapping level — strip the timestamp prefix from filenames to detect same-named files. Also add a filename-based normalization to `normalizeUrlForDedup` that strips leading numeric prefixes.

### 3. Payment plan not showing detailed structure
- DB has 15 detailed milestones in `payment_breakdown` array. The `PaymentPlanVisualization` component shows them when `isDetailedBreakdown && detailedMilestones.length >= 2`.
- **Issue**: In `ProjectDetail.tsx` line 230, `asPaymentBreakdown()` only handles legacy object format `{down_payment, during_construction, on_completion}` — it returns `null` for arrays! The detailed array data is being lost at mapping time.
- **Fix**: Update `ProjectDetail.tsx` to pass array `payment_breakdown` directly when it's an array, not just legacy objects.

### 4. Section order not matching request
Current order: Brochure → Books → Payment → DLD Market + AI → Mortgage → Investment → FAQ → Report → Inquiry

**Requested (Order B)**: Payment Plan + Brochure first → Mortgage → JBJ AI Analyzer → Dubai Market Intelligence → Investment → FAQ → Report → Inquiry

**Fix**: Reorder sections in `ProjectDetailLayout.tsx` lines 1046-1210.

### 5. Investment rating showing 5/10
- The rating comes from the AI edge function response. The prompt already has instructions for 8.5-9.8 ratings for premium projects, but the AI may still return low ratings.
- **Fix**: Add a client-side floor — if the developer is from the tier-1 list, enforce a minimum rating of 8.0. The `ProjectAIAnalyzer` component extracts the rating from the AI text, so we can add a post-processing step.

### 6. Brochure background photo should sync with project's main image
- Currently hardcoded to `BROCHURE_BG_URL` (Downtown Dubai photo).
- **Fix**: In `PremiumBrochureCard.tsx`, use `projectImageUrl` prop (which is already passed) as the background when available, falling back to `BROCHURE_BG_URL`.

### 7. DLD Market Intelligence daily updates
- Currently stored in `dld_market_data` table, last updated March 4. No automated daily update function exists.
- **Fix**: Note this — no edge function currently updates this table automatically. Will flag for future task but not block this batch.

---

## Implementation Plan

### File 1: `src/pages/ProjectDetail.tsx`
- Fix `asPaymentBreakdown` or bypass it — pass `payment_breakdown` directly when it's an array (the DB stores it as a JSONB array of milestones). Lines ~59-69 and ~230.

### File 2: `src/lib/imageUtils.ts`
- Enhance `normalizeUrlForDedup` to strip leading numeric timestamps from Supabase storage filenames (pattern: `/\d{13,}-\d+-/` before the actual filename).

### File 3: `src/components/ContinueSearching.tsx`
- Force title to `text-white` when on dark backgrounds (the component receives `className` with `bg-black`).

### File 4: `src/components/project-detail/ProjectDetailLayout.tsx`
- Reorder sections to: Payment Plan + Brochure → Books → Mortgage → JBJ AI Analyzer → Dubai Market Intelligence → Investment → FAQ → Report → Inquiry.

### File 5: `src/components/project-detail/ProjectAIAnalyzer.tsx`
- Add post-processing: if the parsed `ratingScore` is below 8.0 for known tier-1 developers, clamp it to minimum 9.0.

### File 6: `src/components/project-detail/PremiumBrochureCard.tsx`
- Use `projectImageUrl` as background image instead of hardcoded `BROCHURE_BG_URL`. Keep fallback to `BROCHURE_BG_URL`.

---

## Files to Modify
1. `src/pages/ProjectDetail.tsx` — fix payment_breakdown array passthrough
2. `src/lib/imageUtils.ts` — filename-based dedup for same-image re-uploads
3. `src/components/ContinueSearching.tsx` — title color fix
4. `src/components/project-detail/ProjectDetailLayout.tsx` — section reorder
5. `src/components/project-detail/ProjectAIAnalyzer.tsx` — rating floor
6. `src/components/project-detail/PremiumBrochureCard.tsx` — sync project photo

