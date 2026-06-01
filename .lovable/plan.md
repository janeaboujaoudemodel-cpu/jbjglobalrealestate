## Goal

Make property cards visually aligned across both sections, regardless of whether a card has bedrooms / square footage data, and make the Continue Searching strip look premium (no cheap border around developer name, single-line typography, gold-on-dark hierarchy).

## A. Handpicked For You + /properties cards (`src/components/ProjectCard.tsx`)

Problem: the bedrooms · size meta row is rendered conditionally, so on cards that don't have it the developer name jumps up and bottom rows misalign.

Fix:
- Always reserve the meta row slot with a fixed `min-h-[1.25rem]`, even when there are no unit types or sizes (render an empty placeholder so spacing is identical across all 6 cards).
- Keep the developer line locked to `min-h-[1.25rem]` (already done) so the "by Developer" line lands on the same baseline on every card.
- Keep title at `min-h-[2.75rem]`, location at `min-h-[1.25rem]`, price row pinned via `mt-auto` (already correct).

Result: title → location → meta (bedrooms · sqft, even when blank) → developer → hairline → price all align row-for-row across the entire grid.

## B. Continue Searching cards (`src/components/ContinueSearching.tsx`, `RecentCard3D`)

Problems:
- Developer subtitle sits in a bordered black pill (`bg-black/90 … border border-white/30`) — looks cheap.
- Developer and project name are the same white color, no hierarchy.
- Both can wrap and break alignment.

Fix inside the bottom content block (lines 496–513):
- Drop the bordered pill. Render developer as plain text, single line, `truncate`, uppercase micro-eyebrow, in gold `#E8C988` (lighter gold for AA contrast on the black plate) with `tracking-[0.14em]` and `text-[10px] font-semibold`.
- Strengthen the dark plate slightly (raise the inner solid layer from `bg-black/80` to `bg-black/85`) so gold + white pop cleanly without looking flat.
- Project name: keep white but force single-line `truncate` (replace `line-clamp-2`) so every card's title sits on exactly one baseline; size stays `text-[15px] md:text-base` extrabold.
- Keep `min-h-[88px]` plate so all cards have identical footer height even if developer is missing.

Result: every Continue Searching card shows `BY DEVELOPER` (gold, one line) above `Project Name` (white, one line), no border boxes, premium hierarchy.

## Out of scope

- No changes to homepage layout, hero, header, sidebar, price color (stays ink as previously locked), or any other page.
- No changes to card image, badges, favorite button, or EOI/handover pills.

## Files

- `src/components/ProjectCard.tsx` — meta row slot reservation (~5 lines).
- `src/components/ContinueSearching.tsx` — `RecentCard3D` footer block restyle (~15 lines).
