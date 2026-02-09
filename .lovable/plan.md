

# Reelly Price Data Sync - Complete Fix Plan

## Issue Analysis

Based on my investigation, I found the following:

### Current Data State
| Category | Count |
|----------|-------|
| Projects with prices | 1,181 |
| Projects missing prices | 614 |
| Missing prices that are "Sold Out" | **602** |
| Missing prices that are "On Sale" | **6** |
| Missing prices that are "Presale" | 3 |
| Missing prices that are "Announced" | 2 |

### Root Cause
The issue is **mostly working correctly**:
- 602 out of 614 missing-price projects are **"Sold Out"** - Reelly API removes prices from sold-out projects (expected behavior)
- Only **6 projects** marked "On Sale" are genuinely missing prices
- Only **3 presale** and **2 announced** projects are missing prices (expected - prices not yet set)

### Creek Vista Heights Status
Creek Vista Heights already has correct data:
- **price_from**: AED 893,919
- **price_to**: AED 1,040,270
- **status_label**: "Sold Out"

The display logic for "Sold Out" projects is already correct - showing "Sold Out" instead of price when applicable.

---

## What Needs Fixing

### 1. Run Full Price Backfill for 6 Missing "On Sale" Projects

These 6 projects should have prices but don't:
- Arabian Hills Estate
- Marquis Horizon
- Masaar 2 Anber
- Nad Al Sheba Gardens Phase 9
- Rabdan Square
- Stamn Mia Tower

**Action**: Call `reelly-backfill-projects` with `force_refresh: true` to re-fetch prices from Reelly API.

### 2. Sync All Missing Amenities/Floor Plans (1,795 projects)

The backfill stats show 1,795 projects need complete data:
- Missing floor plans: 1,795
- Missing amenities: 1,795
- Missing documents: 1,000

**Action**: Run full backfill in batches to complete all project data from Reelly API.

### 3. Enhance Price Display Logic in UI

**Current behavior (correct)**:
- Shows actual price if available
- Shows "Sold Out" in red if `status_label` includes "sold" 
- Shows "POA" for other cases without price

**No UI changes needed** - the logic is already correct.

---

## Technical Implementation Steps

### Step 1: Immediate Price Backfill for Active Projects

```typescript
// Call reelly-backfill-projects to fetch latest prices
{
  mode: "all",
  batch_size: 100,
  force_refresh: true  // Re-fetch even if some data exists
}
```

This will:
1. Query Reelly API for each project's detail endpoint
2. Extract `min_price` and `max_price` from API response
3. Update `projects.price_from` and `projects.price_to`
4. Also sync: descriptions, handover dates, floor plans, amenities, etc.

### Step 2: Database Verification Query

After backfill, verify no "On Sale" projects are missing prices:

```sql
SELECT COUNT(*) 
FROM projects 
WHERE (price_from IS NULL OR price_from = 0)
  AND status_label IN ('On Sale', 'Start of Sales')
  AND reelly_id IS NOT NULL;
```

Expected result: 0

### Step 3: Schedule Regular Sync

Add automated daily sync to keep prices updated as Reelly data changes:

1. Morning: Run `reelly-api-sync` to detect new/updated projects
2. Night: Run `reelly-backfill-projects` to fill in any missing details

---

## Edge Cases Handled

| Scenario | Current Behavior | Correct? |
|----------|------------------|----------|
| Sold Out + No Price | Shows "Sold Out" in red | Yes |
| On Sale + Has Price | Shows formatted price | Yes |
| On Sale + No Price | Shows "POA" | Yes (but should be rare) |
| Presale + No Price | Shows "POA" | Yes (expected) |
| Announced + No Price | Shows "POA" | Yes (expected) |

---

## Files That Need No Changes

The current implementation is correct:
- `src/components/listing-admin/PendingImportCard.tsx` - Price display logic is correct
- `supabase/functions/reelly-backfill-projects/index.ts` - Already syncs prices correctly
- `supabase/functions/reelly-api-sync/index.ts` - Already extracts prices from API

---

## Action Required

**Run the price backfill** by calling the edge function:

```json
POST /reelly-backfill-projects
{
  "mode": "all",
  "batch_size": 100,
  "force_refresh": true
}
```

This will process all 1,795 projects in batches and fetch their complete data from Reelly, including prices.

---

## Verification Checklist

After running the backfill:
- [ ] Verify "On Sale" projects have prices: should be 0 missing
- [ ] Verify "Sold Out" projects show "Sold Out" label (not price)
- [ ] Verify POA only shows for "Announced" and "Presale" projects
- [ ] Check Creek Vista Heights displays correctly in listing admin

