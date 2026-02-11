

# Fix Plan: Featured Listings Card Spacing, Brochure Logo, and Mortgage Calculator Numbers

## 1. Featured Listings Card Spacing and Content Fix

**Problem:** In some cards (e.g., Palm Jebel Ali), the project title is too close to the "by Developer" and description section. The price is duplicated (on the photo badge AND in the card bottom). The "...more" text needs the word "more" explicitly visible. Developer name needs underline on hover.

**File:** `src/components/home/FeaturedListings.tsx`

**Fixes:**
- **Title spacing:** Change `mb-0.5` on the title `<h3>` (line 221) to `mb-2` to add consistent space between title and developer name
- **Remove bottom price:** Remove the price section from the bottom of the card (lines 253-261) since price is already shown on the photo badge. Keep only the handover date at the bottom-right
- **"...more" text:** The current code shows `...more` -- ensure it reads `...more` with the word "more" always visible (already has it but confirming the slice + span pattern)
- **Developer name underline on hover:** Add `hover:underline` to the developer Link className (line 231)

## 2. Brochure Card Logo -- Full Fit

**Problem:** The JBJ monogram in PremiumBrochureCard is cropped inside its circular container.

**File:** `src/components/project-detail/PremiumBrochureCard.tsx` (line 149-154)

**Fix:** The container is `w-11 h-11` with `overflow-hidden` and the image uses `object-contain`. The issue is the circular container (`rounded-full`) clips square logos. Change to use `p-1` inside to give breathing room, or increase the container size slightly to `w-14 h-14` so the logo has more space and isn't clipped by the circle boundary.

## 3. Mortgage Calculator Cards in Project Detail -- Numbers on One Line

**Problem:** In the project detail page, the full mortgage calculator (non-compact, `lg:grid-cols-3`) shows 6 summary cards where AED numbers break to a second line because the left input panel takes too much space.

**File:** `src/components/MortgageCalculator.tsx` (lines 214, 350-392)

**Fixes:**
- Change the main grid from `lg:grid-cols-2` (line 214) to `lg:grid-cols-[2fr_3fr]` so the results section (with the 6 cards) gets more width
- On the 6 summary cards, add `whitespace-nowrap` to the price `<p>` elements to prevent line breaks, and reduce font size slightly if needed: change `text-xs lg:text-base xl:text-lg` to `text-xs lg:text-sm xl:text-base`

## Summary of Files to Change

| File | Change |
|------|--------|
| `src/components/home/FeaturedListings.tsx` | Add spacing after title; remove duplicate price; add hover:underline to developer link |
| `src/components/project-detail/PremiumBrochureCard.tsx` | Increase monogram container size for full fit |
| `src/components/MortgageCalculator.tsx` | Widen results column; prevent number line breaks in 6 cards |

