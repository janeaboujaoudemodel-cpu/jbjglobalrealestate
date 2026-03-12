

## Fix: Duplicate Projects in Recently Searched

### Root Cause

The same project can appear multiple times because:
1. **`loadItems()` in `useRecentSearches.ts`** loads from localStorage without any deduplication — if corrupted/legacy data has duplicates, they persist forever.
2. **`trackView` deduplicates by `id + type`**, but the same project can have different IDs across sources (Reelly vs local DB), yet share the same `slug`. So two entries for the same project with different IDs both survive.
3. **`ContinueSearching.tsx`** already has slug-based dedup (lines 84-91), but it only runs at render time — the underlying data still has duplicates, meaning other consumers of `useRecentSearches` also see them.

### Fix

**File: `src/hooks/useRecentSearches.ts`**

1. **`loadItems()`** — Add deduplication after normalization, using `${type}-${slug}` as the unique key (keeps the most recent entry since items are sorted by `viewedAt` desc).

2. **`trackView()`** — Change the duplicate filter from matching only `id + type` to matching **either** `id + type` **or** `slug + type`. This prevents the same project from being tracked twice under different IDs.

Both changes are small (2-3 lines each) and fix the problem at the data layer so all consumers benefit.

