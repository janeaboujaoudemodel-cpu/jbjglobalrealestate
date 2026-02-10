

# Fix Homepage "Handpicked For You" Section

## Problems Identified

1. **Developer distribution broken**: The selection logic tries to pick 1 from each of Emaar, ALDAR, Omniyat, Sobha, Nakheel, Dubai Properties + 2 Binghatti specials. But when `addOne()` fails for a developer (e.g., the `find` doesn't match), the "fill remaining" loop at lines 109-118 grabs more projects from the top of the `all` array -- which is sorted by `created_at DESC`, so it fills with extra Emaar (146 projects) and Sobha (50 projects).

2. **Binghatti logo unreadable**: The logo URL from Reelly (`api.reelly.io/vault/...`) renders as a tiny, hard-to-read image in the 40x40px container.

3. **Cards not the same size**: Card heights vary because some projects have area names, prices, or handover dates while others don't. The content section grows/shrinks based on available data, making cards uneven.

---

## Fix 1: Enforce Strict 1-Per-Developer Distribution

**File:** `src/components/home/FeaturedListings.tsx`

**Changes to selection logic (lines 64-120):**
- Change to a strict round-robin: 1 Emaar, 1 ALDAR, 1 Omniyat, 1 Sobha (prefer Pinnacle), 1 Nakheel, 1 Dubai Properties, 1 Binghatti Bugatti, 1 Binghatti Mercedes
- Add deduplication check inside `addOne()` so a project can't be added twice
- In the "fill remaining" logic, **exclude developers that already have a card** to prevent Emaar/Sobha domination
- If a specific project (Bugatti, Mercedes, Pinnacle) isn't found, fall back to any project from that developer, but never allow more than 1 card per developer (except Binghatti which gets 2)

**Result:** 8 cards, max 1 per developer (2 for Binghatti), no duplicates.

---

## Fix 2: Binghatti Logo Visibility + Monogram

**File:** `src/components/home/FeaturedListings.tsx`

**Changes to `ProjectCard` component (lines 155-171):**
- Increase the developer logo container from `w-10 h-10` to `w-12 h-12` for better readability
- For Binghatti specifically, add a small "B" monogram badge overlaid on or next to the logo
- If the Reelly logo URL fails to load (broken/unreadable), show a styled text fallback with the developer initial in gold

---

## Fix 3: Consistent Card Heights

**File:** `src/components/home/FeaturedListings.tsx`

**Changes to `ProjectCard` component (lines 130-214):**
- Set a fixed minimum height on the content section (`min-h-[140px]`) so all cards have the same visual footprint
- Ensure the image container uses the same `aspect-[4/3]` consistently (already done)
- For missing fields (no area name, no price, no handover), render invisible placeholder elements of the same height to maintain layout consistency
- The `flex-grow` spacer already exists at line 190 which helps, but add explicit `min-h` values on the location row and price row to prevent collapse

**Result:** All 8 cards render at identical heights regardless of which data fields are present.

---

## Technical Summary

| File | Changes |
|---|---|
| `src/components/home/FeaturedListings.tsx` | Fix developer distribution (max 1 per dev, 2 for Binghatti); enlarge and enhance Binghatti logo with monogram; enforce consistent card heights with min-heights and placeholders |

## Execution Order
1. Fix the selection logic to prevent Emaar/Sobha domination
2. Enhance Binghatti logo with larger container and monogram
3. Add fixed minimum heights to card content areas for visual consistency
