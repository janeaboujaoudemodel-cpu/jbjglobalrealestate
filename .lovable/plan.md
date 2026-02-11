

# Fix Plan: Multiple Homepage UI Issues

## 1. "...more" Next to Description in Featured Listings

**Problem:** The `...more` span is placed inside a `<p>` with `line-clamp-2`. CSS line-clamp uses `-webkit-line-clamp` which truncates with an ellipsis and hides overflow content -- meaning the gold "...more" span gets cut off or hidden entirely. It is not visually appearing next to the description text.

**File:** `src/components/home/FeaturedListings.tsx` (lines 240-248)

**Fix:** Remove `line-clamp-2` from the `<p>` tag. Instead, manually truncate the description text to ~100 characters in JS and append the "...more" as a visible inline `<span>`. This guarantees "...more" always shows next to the last word of the description.

Change from:
```
<p className="text-zinc-600 text-xs line-clamp-2 mb-2">
  {String(description).replace(/<[^>]*>/g, '').slice(0, 120)}
  <span className="text-gold font-medium ml-1">...more</span>
</p>
```

To:
```
<p className="text-zinc-600 text-xs mb-2">
  {String(description).replace(/<[^>]*>/g, '').slice(0, 100)}
  <span className="text-gold font-medium cursor-pointer">...more</span>
</p>
```

Key: Remove `line-clamp-2` so the "...more" is never hidden by CSS truncation. Reduce slice to ~100 chars so it stays around 2 lines naturally.

---

## 2. Golden Visa Background Image

**Problem:** The Golden Visa slide in the "Explore Our Services" slideshow uses a fake/AI-generated image (`golden-visa-bg.jpg`) that shows text like "Golden Visa and Passport" on a card, plus a duplicated Burj Khalifa in the background.

**File:** `src/assets/services/golden-visa-bg.jpg`

**Fix:** Generate a new, proper background image showing the Dubai skyline (single Burj Khalifa, Palm Jumeirah visible) with a subtle Emirates ID card concept -- no fake passport, no text on the card. Use the AI image generation model to create a clean, professional image and replace the file.

---

## 3. Mortgage Calculator Section -- Duplicate Title

**Problem:** In `src/pages/Index.tsx` (lines 646-652), there is a badge that says "Mortgage Estimate" and then a heading that says "Mortgage Calculator". The title appears duplicated because both mention "Mortgage" prominently.

**File:** `src/pages/Index.tsx` (lines 646-655)

**Fix:** 
- Change the badge text from "Mortgage Estimate" to just "Financial Tools" or remove it entirely
- Keep only the main heading "Mortgage Calculator" (black + gold split)
- Update the subtitle to be clearer: "Estimate your monthly payments and explore financing options." (remove "with licensed mortgage partners" from this line since it's in the disclaimer below)

---

## 4. Mortgage Calculator Cards -- 3 per Row Layout and Price Overflow

**Problem:** The 6 cards are in a single row on desktop (`lg:grid-cols-6`), making each card very narrow and causing long AED numbers to wrap to a second line. User wants 3 cards per row (2 rows of 3).

**File:** `src/components/MortgageCalculator.tsx` (line 102)

**Fix:** Change grid from `lg:grid-cols-6` to `lg:grid-cols-3`. This creates 2 rows of 3 cards, giving each card more width so numbers don't overflow.

---

## 5. Mortgage Disclaimer Text Clarity

**Problem:** The disclaimer reads "Estimates only. Introductions to independent licensed mortgage partners." which is unclear.

**File:** `src/pages/Index.tsx` (line 662)

**Fix:** Change to: "Estimates only. We connect you with independent licensed mortgage advisors for personalized guidance."

---

## 6. Contact Cards -- Email Card Hover Logic Reversal + Gold Phone Numbers

**Problem:** 
- The Email card currently shows a flat state on load and a highlighted state on hover. The user wants this reversed: the email card should look highlighted/3D by default and flatten on hover.
- WhatsApp and Call Us cards should show the phone number in gold color by default (not just on hover).

**File:** `src/components/CombinedContactNewsletter.tsx` (lines 21-93)

**Fix:**
- For the Email card: swap the default and hover border/shadow styles. Default state gets the highlighted border (`border-gold`) and shadow (`shadow-gold/20`). Hover state gets the muted border (`border-gold/40`) and no shadow.
- For WhatsApp and Call Us: change the value text color from `text-black` to `text-gold` (and `group-hover:text-black` for the reverse effect).
- For Email: reverse the text color animation too -- gold by default, black on hover.

This is a global component used on all pages, so this single file change applies everywhere.

---

## Summary of Files to Change

| File | Change |
|------|--------|
| `src/components/home/FeaturedListings.tsx` | Remove line-clamp-2, ensure "...more" is visible inline |
| `src/assets/services/golden-visa-bg.jpg` | Generate and replace with proper Dubai skyline + Emirates ID concept |
| `src/pages/Index.tsx` | Remove duplicate mortgage title; fix disclaimer text |
| `src/components/MortgageCalculator.tsx` | Change grid to `lg:grid-cols-3` for 2 rows of 3 |
| `src/components/CombinedContactNewsletter.tsx` | Reverse email card hover; gold phone numbers for WhatsApp/Call Us |

