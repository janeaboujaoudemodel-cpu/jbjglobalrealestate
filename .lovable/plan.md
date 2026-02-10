

# Homepage Fixes: Trust Bar Centering, Featured Listings Data & Cards

## 1. Trust Bar Section: Equal Spacing Above & Below

**Problem**: The gap between "Trusted By Thousands" divider and the Developer Partners marquee above is smaller than the gap between "Excellence Guaranteed" divider and the "Handpicked For You" section below.

**Root cause**: The trust-bar wrapper has `py-8 md:py-10`, but FeaturedListings has `py-12 md:py-16` which adds extra space below. The developer marquee above has no bottom padding equivalent.

**Fix in `src/pages/Index.tsx`**:
- Increase the trust-bar section padding to `py-12 md:py-16` to match FeaturedListings, creating equal visual breathing room on both sides
- Alternatively, add a spacer/padding between the developer marquee and trust bar to balance the gap

This ensures "Trusted By Thousands" and "Excellence Guaranteed" are visually centered between the Developer Partners strip and the Handpicked For You section.

---

## 2. Remove Fake Binghatti "B" Monogram Badge

**Problem**: The code at lines 181-184 and 194-198 in `FeaturedListings.tsx` adds a fake gold "B" circle next to the Binghatti logo. This is not the real Binghatti monogram.

**Fix in `src/components/home/FeaturedListings.tsx`**:
- Remove the `isBinghatti` variable and all the fake "B" badge JSX (lines 140, 181-185, 194-198)
- The developer logo from the database (`logo_url`) already contains the real Binghatti logo -- just display it as-is like all other developers
- Ensure the logo container uses `object-fill` in a square container per the project's developer logo styling standard

---

## 3. Replace Second DAMAC with a Different Developer

**Problem**: Lines 96-97 explicitly add 2 DAMAC projects. User wants only 1 DAMAC and wants Dubai Holdings added instead.

**Issue**: "Dubai Holding" exists in the developers table but has 0 published projects in the projects table. We need a fallback.

**Fix in `src/components/home/FeaturedListings.tsx`**:
- Remove `addOne('DAMAC', 'lagoons')` (the second DAMAC slot)
- Add `addOne('Meraas')` instead (Meraas is an Elite developer with projects in the database and is part of Dubai Holding's portfolio)
- Update `ELITE_DEVELOPERS` array: remove the duplicate DAMAC intent, add 'Meraas' if not already present
- Update the comment at the top of the file to reflect "1 per developer" consistently

---

## 4. Show "Price TBA" for Projects Without Starting Price

**Problem**: Palm Jebel Ali Villas and Binghatti Vintage have `price_from = NULL` in the database, so no price is shown on their cards.

**Fix in `src/components/home/FeaturedListings.tsx`**:
- In the price badge overlay (line 203), keep as-is (only show badge when price exists)
- In the content area (line 242-248), change the invisible placeholder to show "Price TBA" in a visible style:
```tsx
) : (
  <span className="text-zinc-500 font-medium text-xs">Price TBA</span>
)}
```

---

## 5. Enforce Uniform Card Heights

**Problem**: Cards with missing data (no price, no location) end up with different visual heights despite the `min-h-[140px]` content area.

**Fix in `src/components/home/FeaturedListings.tsx`**:
- The card already uses `flex flex-col h-full` and `min-h-[140px]` on content -- verify the `aspect-[4/3]` on images ensures all image areas are identical
- Ensure the grid uses `items-stretch` (default for grid) so all cards in a row match the tallest card
- The `flex-grow` spacer (line 232) already pushes bottom content down -- this should work correctly once all slots show visible text (Price TBA instead of invisible placeholders)

---

## Technical Details

### Files to modify

| File | Changes |
|------|---------|
| `src/pages/Index.tsx` (line 211) | Change `py-8 md:py-10` to `py-12 md:py-16` on trust-bar wrapper |
| `src/components/home/FeaturedListings.tsx` | Remove fake "B" badge, change DAMAC x2 to DAMAC + Meraas, show "Price TBA", verify card height consistency |

### Database note
No database changes needed. The missing prices for Palm Jebel Ali and Binghatti Vintage are legitimate -- those projects simply don't have pricing data in the source system. "Price TBA" is the correct display.
