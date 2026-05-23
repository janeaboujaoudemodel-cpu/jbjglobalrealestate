## Goal
Make the Favorite, Shortlist, and "Add Badge" buttons invisible by default on all property listing cards, revealing them only when the user hovers over the card.

## Why
The user explicitly requested this to clean up the card UI — buttons should not clutter the card surface unless the user intends to interact with it.

## Files to change
1. `src/components/ProjectCard.tsx` — Main property card (local DB projects).
   - The top-right stacked container (lines 173–184) wrapping `<FavoriteButton />` and `<ShortlistBadgeButton />` currently has no visibility gating.
   - Add `opacity-0 group-hover:opacity-100 transition-opacity duration-200` to that container.

2. `src/components/ReellyProjectCard.tsx` — Reelly API property card.
   - Favorite button wrapper (line 131): currently `opacity-80 group-hover:opacity-100`. Change to `opacity-0 group-hover:opacity-100`.
   - Badge button wrapper (line 138): same change.

3. `src/components/ContinueSearching.tsx` — Recent browsing history / trending strip cards.
   - Favorite button wrapper (line 485): add `opacity-0 group-hover:opacity-100 transition-opacity duration-200`.

## What will NOT change
- QuizResults.tsx imports ProjectCard, so it inherits the fix automatically.
- No button behavior changes (click handlers, tooltips, gating) — only CSS visibility.
- No changes to stamp-generator pages or other non-property-card usages.

## Acceptance criteria
- On /properties grid, every card shows clean image + metadata with no overlay buttons.
- Hovering any card smoothly fades in the Favorite + Shortlist/Badge buttons within ~200 ms.
- Touch/mobile: buttons remain accessible (they appear on tap via the hover state or can be made visible; opacity-0 on mobile is acceptable because hover is not the primary interaction there, but we can add a media query if needed).