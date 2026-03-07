

# Fix: Tooltip Clipped in Continue Searching Cards, Amra Payment Plan Accuracy, and Listing Generator Robustness

## Issue 1: Tooltip Hidden Under Card (Continue Searching)

**Root cause**: The card link element at line 190 of `ContinueSearching.tsx` has `overflow-hidden` via `rounded-xl overflow-hidden`. The Radix Tooltip uses a portal by default, but the `FavoriteButton` is positioned inside a container with `z-20` and `translateZ(30px)` — the tooltip renders correctly via portal, but its white background blends with the card's gold shimmer border and gradient, making it nearly invisible against the dark card.

**Fix in `FavoriteButton.tsx`**:
- Add explicit styling to the `TooltipContent` for dark-themed contexts: `className="z-[100] bg-black/90 text-white border-gold/30 text-xs"` to ensure visibility against dark cards.
- Alternatively, add `sideOffset={8}` to push the tooltip further away from the card boundary so it's clearly above.

## Issue 2: Amra Payment Plan Data Incorrect

**Current DB state**: The Amra project has 15 milestones stored in `payment_breakdown`. However, the percentages are wrong — several milestones show `1%` for "Pre-Handover Installments 1-5" as a single entry (should be 5 entries at 1% each = 5%, or one entry at 5%). The total adds up but the milestone labels don't match the granularity correctly. The summary visualization collapses everything into 3 buckets (10% booking, 60% construction, 30% handover) which may not reflect the actual document.

**Fix — Two-pronged approach**:

### A. Improve AI extraction prompt (in `generate-listing/index.ts`)
Strengthen the payment plan extraction instructions in the system prompt (line 241-260):
- Add explicit instruction: "For payment plans, list EVERY individual milestone exactly as shown in the document. Each installment must have its own row with exact percentage. Do NOT group installments (e.g., 'Installments 1-5 at 1% each' should be 5 separate entries). Copy milestone names, percentages, and timing VERBATIM."
- Add instruction to calculate and verify the total equals 100%.

### B. Fix Amra's data via SQL migration
Run a migration to update Amra's `payment_breakdown` with corrected milestones that match the actual DAMAC Amra payment plan document. Since we can't re-read the original uploaded document, we'll re-extract by looking at the stored data and correcting the structure to properly represent each installment individually.

## Issue 3: Listing Generator Speed and Extraction Accuracy

**Current bottlenecks**:
- `BATCH_SIZE = 2` means many sequential AI calls for multi-file uploads
- 55-second timeout per batch with retry logic adds latency
- The merge logic (line 162-193) uses Set dedup on arrays which loses payment breakdown ordering

**Fixes in `generate-listing/index.ts`**:

1. **Increase batch size**: Change `BATCH_SIZE` from 2 to 4 — reduces total AI calls by half.
2. **Fix merge logic for payment breakdown**: The `mergeExtractedProjects` function at line 175 uses `new Set()` spread on `paymentBreakdown` array, which breaks because objects aren't deduped by Set correctly. Change to: for `paymentBreakdown`, prefer the longer/more detailed array instead of merging.
3. **Strengthen extraction prompt**: Add emphasis on verbatim payment plan extraction with percentage verification.
4. **Use `google/gemini-2.5-pro`** for the primary extraction instead of `flash` — better accuracy for complex document analysis, especially payment plan tables.

## Files to Modify

### `src/components/FavoriteButton.tsx`
- Update `TooltipContent` styling to use dark background with gold border for visibility on dark cards
- Add `side="top"` and `sideOffset={8}` to push tooltip above the card boundary

### `supabase/functions/generate-listing/index.ts`
- Increase `BATCH_SIZE` to 4
- Fix `mergeExtractedProjects` to preserve payment breakdown ordering (prefer longer array)
- Strengthen system prompt with explicit per-milestone extraction rules
- Upgrade model to `google/gemini-2.5-pro` for higher accuracy

### Database Migration
- Update Amra's `payment_breakdown` JSONB with corrected milestone data

