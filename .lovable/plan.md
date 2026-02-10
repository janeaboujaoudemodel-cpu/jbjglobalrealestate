

# Fix Sold Out Badge and Status Label on Project Cards

## Problem

The "Sold Out" status badge logic was broken by conflicting conditions in both `ProjectCard.tsx` and `ReellyProjectCard.tsx`:

1. The `getSaleStatusBadge()` function catches "sold" statuses (line 85-86) and returns a badge object
2. The dedicated red "Sold Out" badge (line 282) only renders when `!saleStatusBadge` -- so when getSaleStatusBadge already matched "sold", the red badge is skipped
3. Instead, a generic sale status badge renders at line 268 with `bg-destructive` styling -- losing the distinct red "Sold Out" design the user specified

The user's requirement (from memory): "Sold Out" badge should be a red badge positioned top-left (top-3 left-3), offset below developer logo if present. "Sold" text (red) should show in the price area for sold-out projects without a price.

## Fix

### File: `src/components/ProjectCard.tsx`

1. **Remove "sold" from `getSaleStatusBadge()`** -- The sold status should NOT be treated as a regular sale status badge. It has its own dedicated rendering path (the red "Sold Out" badge at top-left). Remove lines 85-86 from the function so sold projects fall through to the dedicated badge.

2. **Fix the "Sold Out" badge condition** -- Remove the `!saleStatusBadge` guard from line 282 so the red "Sold Out" badge renders based only on `is_sold_out` or status containing "sold". This ensures it always appears top-left as designed.

3. **Add exclusion on the sale status badge (line 268)** -- Add a check so the generic sale status badge doesn't render for sold-out projects (since they get the dedicated red badge instead).

### File: `src/components/ReellyProjectCard.tsx`

Apply the same fix: remove "sold" from `getSaleStatusBadge()` and ensure the sold-out rendering path is not blocked.

## Result

- "Sold Out" red badge always appears top-left on sold projects (offset below developer logo)
- Other sale statuses (On Sale, Announced, Presale) continue to show as colored badges top-left
- Price area shows "Sold" in red for sold projects without price data
- No duplication of sold badges

## Technical Details

### Changes to `getSaleStatusBadge()` in both files:

Remove this block:
```
if (normalizedStatus.includes('sold') || normalizedStatus.includes('out of stock')) {
  return { label: 'Sold Out', className: 'bg-destructive text-destructive-foreground' };
}
```

### Changes to sold badge condition in ProjectCard.tsx:

Line 282: Remove `&& !saleStatusBadge` so the condition becomes:
```
{(project.is_sold_out || project.status_label?.toLowerCase().includes('sold')) && (
```

Line 268: Add sold-out exclusion:
```
{saleStatusBadge && !project.is_sold_out && !project.status_label?.toLowerCase().includes('sold') && (
```

### Files Modified

| File | Change |
|------|--------|
| `src/components/ProjectCard.tsx` | Remove "sold" from getSaleStatusBadge, fix badge conditions |
| `src/components/ReellyProjectCard.tsx` | Same fix applied consistently |
