## Objective
Restyle the JBJ Royal Tools Hub section on the homepage so all tool cards and CTA buttons use a unified premium champagne-gold aesthetic (no black fills), and ensure exactly 8 tools render in a 4-per-row, 2-row grid.

## Current State
- `ToolkitShowcaseCard.tsx` renders tool cards with per-tool colorful icon tones (blue, emerald, purple, etc.) and black CTA buttons (`bg-[#1A1A1A]` / white text).
- The "Explore All" button is also black.
- `APPROVED_PUBLIC_TOOLS` contains 7 tool IDs, so only 7 tools display publicly after filtering.
- Grid uses `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4` which on large screens gives 4 per row, but with 7 items the last row is incomplete.

## Changes Required

### 1. Expand approved public tools to 8
- Add `interior-design` to `APPROVED_PUBLIC_TOOLS` in `src/config/publicToolAccess.ts` so 8 tools pass the filter.
- Ensure the `royalTools` array in `ToolkitShowcaseCard.tsx` already contains the matching 8 entries (it does).

### 2. Unify tool card icon styling to champagne-gold premium
- Replace the per-tool `TONE_STYLES` colorful circles with a single premium champagne palette:
  - Icon container background: `bg-[#EFE6D6]` (raised surface)
  - Icon color: `text-[#B89555]` (gold accent) 
  - Hover ring: `group-hover:ring-[#B89555]/40`
- Remove the `tone` property mapping from the card rendering loop.

### 3. Premium CTA buttons inside cards
- Replace black button with champagne premium:
  - Background: `bg-[#FDFBF7]` (page surface)
  - Text: `text-[#1A1A1A] font-bold`
  - Border: `border border-[#B89555]/60`
  - Hover: `hover:bg-[#EFE6D6] hover:border-[#B89555]` with slight lift shadow
  - Keep arrow icon; arrow color should be `text-[#B89555]`

### 4. Premium "Explore All Our Tools Now" button
- Replace black button with premium champagne:
  - Background: `bg-[#FDFBF7]` or `bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6]`
  - Border: `border border-[#B89555]/60`
  - Text: `text-[#1A1A1A] font-bold`
  - Crown icon: keep gold color
  - Hover: lift + intensified gold border + subtle shadow

### 5. Card container refinement
- Keep current card background `bg-[#F7F2EA]` and border `border-[#B89555]/30`
- Add `hover:border-[#B89555]/60` for stronger hover border
- Ensure the grid stays `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4` so on desktop = 4 columns = exactly 2 rows for 8 items

## Files to Edit
1. `src/config/publicToolAccess.ts` — add interior-design to approved list
2. `src/components/home/ToolkitShowcaseCard.tsx` — restyle cards, buttons, icons, and tone mapping

## Acceptance Criteria
- Exactly 8 tools display on the homepage in the Royal Tools Hub
- Desktop shows 4 tools per row (2 complete rows)
- No black-filled buttons anywhere in the section
- All icon circles use unified champagne/gold tones
- All CTA buttons use champagne surface + gold border + ink text
- Hover states are cohesive and premium (no white-on-white or black-on-black contrast issues)