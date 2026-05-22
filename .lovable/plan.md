## Change

In `src/components/ui/developer-link.tsx`, restyle the developer name itself to canonical brand gold (`#B89555`) and give it a clear hover affordance everywhere it appears:

- Default: `text-[#B89555]` (the same gold token used for hairlines/borders site-wide), `font-semibold`, `underline underline-offset-4 decoration-[#B89555]/50`.
- Hover/focus: `text-[#8E6E36]` (darker gold for AA contrast on champagne), `decoration-[#B89555]` (full-strength underline), subtle `cursor-pointer` (Link already provides), small `transition-colors duration-150`.
- "by " prefix stays ink (`#1A1A1A`) so the brand wordmark reads as the gold accent on a champagne card.
- Same treatment in the no-slug branch (gold styled text, no Link), so unlinked names still read as the brand mark — but without hover state.

Because `DeveloperLink` is the single source used by `ProjectCard`, `ReellyProjectCard`, `FeaturedListings`, and every other consumer, the change propagates everywhere automatically — no component-level edits needed.

## Technical notes

- One file edited: `src/components/ui/developer-link.tsx`.
- Brand gold `#B89555` is the project's canonical accent token. It is NOT one of the banned "muddy" faded-gold hexes (`#5A4A2E`, `#3A2D1D`, `#6B5A3E`, `#7A6747`, `#8A7556`), so CI `check-faded-gold` will pass.
- The "no gold fills" rule is preserved: gold is used only as text color + 1px underline, never as a background fill.
- Click behavior (`stopPropagation`, link to `/developer/:slug`) stays identical.
