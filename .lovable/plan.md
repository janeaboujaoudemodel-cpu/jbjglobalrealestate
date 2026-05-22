## What's wrong

`.price-pill-premium` has no fixed/min width, so "From AED 10.7M" is wider than "From AED 2.4M" — pills look inconsistent across the grid. They also read as horizontally long because of the side-by-side `From | value` layout with generous padding and a baseline-aligned eyebrow.

## Fix (CSS-only, single source)

Edit `src/index.css` → `.price-pill-premium` block:

- Stack eyebrow over value (column layout) instead of inline → instantly half the horizontal footprint.
- Set `min-width: 92px`, `justify-content: center`, `text-align: center` so every pill is the same width regardless of digits, but still grows for very long values (e.g. AED 125M).
- Tighten padding to `4px 10px` and reduce gap to `2px` between eyebrow and value.
- Eyebrow → `9px` uppercase tracked; value → `13px / 0.875rem`, tabular-nums (already on), `font-weight: 800`.
- Keep the orange ink, hairline border, scrim, blur, and shadow exactly as-is — no visual identity change.

That single block governs all three call sites (`FeaturedListings.tsx`, `ProjectCard.tsx`, `ReellyProjectCard.tsx`) — no component edits needed; the change propagates everywhere the pill is rendered (home featured, properties grid, all project listings).

## Technical notes

- Files touched: `src/index.css` only.
- No markup, no component, no schema change.
- Tabular-nums already present, so equal-width digits + fixed `min-width` guarantees identical pill size for typical AED 1M–999M range.
