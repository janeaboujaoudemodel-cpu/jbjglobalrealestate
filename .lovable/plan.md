

# Fix Developer Card Logos, Quick Filter Chips, Developer Name Color, and Project Loading

## Changes Summary

### 1. Reduce Developer Card Logo Size (DeveloperCard.tsx)
The logo container on the developers page is currently `w-24 h-24` (96px) which covers nearly half the card photo (220px height). The homepage FeaturedListings uses `w-10 h-10` (40px) which is too small.

**Fix:** Change the logo container in `DeveloperCard.tsx` from `w-24 h-24` to `w-14 h-14` (56px). This is a balanced size -- bigger than the homepage's 40px but much smaller than the current 96px. The logo stays `object-fill` inside the container (no padding changes). The container size is uniform for all developers.

**File:** `src/components/DeveloperCard.tsx` line 85
- Change: `w-24 h-24` to `w-14 h-14`

### 2. Reduce Logo Size on ProjectCard and ReellyProjectCard
These cards currently use `w-12 h-12` (48px) which is acceptable, but should be consistent. Keep them at `w-12 h-12` -- no change needed since they are already smaller than the developer cards.

### 3. Fix "Beyond" Logo Readability
The Beyond logo is rectangular/wide and gets distorted with `object-fill` on a square container. However, the user explicitly wants logos to fill the box without white space. The fix is that by making the container smaller (from 96px to 56px), the stretching effect is reduced and the logo becomes more readable. The `object-fill` stays locked per user mandate.

### 4. Quick Filter Chips -- Premium Styling (ProjectFilters.tsx)
The `QuickFilterChip` component (line 1092-1108) currently uses:
- Active: `bg-white text-black` (plain white)
- Inactive: `bg-zinc-900 text-zinc-300` (dark/muted)

These need the premium champagne treatment.

**Fix:** Update the QuickFilterChip styling:
- Active: `bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] text-black border-2 border-gold shadow-sm`
- Inactive: `bg-white/90 text-zinc-700 border border-gold/30 hover:border-gold/50`

**File:** `src/components/ProjectFilters.tsx` lines 1100-1104

### 5. Developer Name in Gold on All Listing Cards
- **ProjectCard.tsx**: Already uses `DeveloperLink` component which renders developer names in gold gradient text. No change needed.
- **ReellyProjectCard.tsx**: Already uses `text-gold font-medium` for developer name (line 265). No change needed.
- Both cards are already correct per the user's request.

### 6. Project Detail Hero -- Missing Photos
Some project detail pages open without a hero photo showing. This is likely because `cover_image_url` is null and the fallback to `project_images` isn't working properly, or the high-res image URL utility returns a broken URL.

**Fix:** In `src/components/project-detail/ProjectDetailLayout.tsx` (or the hero section component), ensure there's a proper fallback chain: `cover_image_url` then first `project_images` entry, then a placeholder gradient. Also ensure the image uses `loading="eager"` for the hero.

**File:** Need to check `ProjectDetailLayout.tsx` for the hero image logic -- will verify and fix the fallback chain.

### 7. Improve Project Loading Speed
- **Logo loading:** Add `loading="eager"` for logos in the first 6-8 visible cards (already done via `isEager` in DeveloperCard, but ProjectCard and ReellyProjectCard don't have this optimization).
- **Query staleTime:** The `useProjectsByDeveloper` hook may have a long stale time. Reduce it to improve perceived loading speed.

---

## Technical Summary

| File | Changes |
|---|---|
| `src/components/DeveloperCard.tsx` | Reduce logo container from `w-24 h-24` to `w-14 h-14` |
| `src/components/ProjectFilters.tsx` | Update QuickFilterChip active/inactive styles to premium champagne theme |
| `src/components/project-detail/ProjectDetailLayout.tsx` | Fix hero image fallback chain to prevent blank heroes |

## Execution Order
1. Reduce DeveloperCard logo container size (highest visibility fix)
2. Update QuickFilterChip styling to premium champagne
3. Fix project detail hero image fallbacks

