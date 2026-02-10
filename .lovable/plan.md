

# Fix "Details on Request" Across All Listings

## Problem

The `ReellyProjectCard.tsx` component shows **"Details on Request"** for every project with a null price -- it does NOT distinguish between sold-out projects and active ones. The previous fix only applied to `ProjectCard.tsx` but missed `ReellyProjectCard.tsx`.

**Data breakdown:**
- 1,194 projects have prices (working fine)
- 603 projects are sold out with no price -- should show **"Sold"**
- 12 active projects have no price -- these need price backfill from Reelly API

## Fix

### 1. Fix ReellyProjectCard.tsx price display (line 248-258)

Replace the current logic:
```
project.price_from ? "Starting from ..." : "Details on Request"
```

With the same three-way logic already in `ProjectCard.tsx`:
- Has price --> show formatted price
- No price + sold out --> show **"Sold"** in red
- No price + active --> show **"Price on Request"** in gold

### 2. Backfill prices for 12 active projects via Reelly API

Call the existing `reelly-backfill-details` edge function to re-fetch detail data for these 12 projects from the Reelly API. The API may have pricing data that was missed during the initial sync. The 12 projects are:

- Radisson Residences (reelly_id: 3169)
- Arabian Hills Estate (1261)
- Stamn Mia Tower (3001)
- Wadi Villas (1124)
- Masaar 2 Anber (2438)
- Nad Al Sheba Gardens Phase 9 (2911)
- Waldorf Astoria Residences (2335)
- The Ritz Carlton Al Wadi Desert Resort (1013)
- The Residences at Sheraton Al Marjan Island Resort (2902)
- Rabdan Square (3041)
- Marquis Horizon (3143)
- Fiori Residences (2942)

If the Reelly API still returns no price for some, those will correctly show "Price on Request" which is the standard real estate industry practice for pre-launch or unannounced pricing.

## Files Changed

- **`src/components/ReellyProjectCard.tsx`** (lines 248-258) -- Add sold-out check and "Price on Request" fallback, matching `ProjectCard.tsx` logic
- **Edge function call** -- Trigger `reelly-backfill-details` for the 12 active projects to attempt price backfill

## Result

After this fix:
- 603 sold-out projects show "Sold" instead of "Details on Request"
- 12 active projects show actual prices (if Reelly API has them) or "Price on Request"
- No project will show "Details on Request" anymore
