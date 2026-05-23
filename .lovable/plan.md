## Goal

Replace the three pillars row in the hero (Premium Marketplace / AI-Powered Tools / Brokerage Services) with one premium search bar that works on every device (mobile, tablet portrait/landscape, desktop). No exceptions, no responsive hides.

## Context

`src/pages/Index.tsx` currently renders, inside the hero, in this order:
1. H1 headline
2. `<HomeHeroSearch />` — already a premium search bar wired to `GlobalSearchModal`
3. The three pillars block (lines ~292–318) ← the selected element
4. Book a Free Consultation CTA

So there are effectively two "search areas" planned if we just add another bar. To honor the request literally ("replace this with a search bar") and avoid duplication, I will:

- Delete the pillars block (mobile inline row + desktop 3-column grid).
- Keep the existing `<HomeHeroSearch />` as the single premium search bar in the hero. It is already always visible on all breakpoints (no `hidden md:*` toggles) and already routes typed queries into the global search engine (projects, developers, areas, tools).
- Tighten it slightly so it visually fills the space the pillars used to occupy on desktop (max-w-3xl → max-w-4xl, taller bar on lg).

## Changes

### `src/pages/Index.tsx`
- Remove the entire pillars `motion.div` (the block containing the mobile flex row and the desktop 3-column grid).
- Remove the now-unused `pillars` constant + its icon imports (only if not referenced elsewhere in the file).

### `src/components/home/HomeHeroSearch.tsx`
- Widen container: `max-w-3xl` → `max-w-4xl`.
- Bar height on large screens: `h-14 sm:h-16` → `h-14 sm:h-16 lg:h-[68px]`.
- Confirm there are no `hidden` / `md:hidden` wrappers — the bar must render on every breakpoint (it already does; just verifying).
- Keep quick-query chips, gold border, glow, and `GlobalSearchModal` wiring intact.

## Memory note

The current `mem://features/home/hero-and-portal-cta-standard` memory says "Hero = no eyebrow, no pills row, no search bar". This request directly overrides the "no search bar" + "mandatory 3 pillars" parts of that rule. After implementation I will update that memory to: "Hero = no eyebrow, no pills row, mandatory single premium search bar (always visible, all breakpoints); 3 pillars removed."

## Out of scope

- No changes to the Book a Free Consultation CTA, portal CTA, or anything below the hero.
- No new property-filter UI (location/price/beds dropdowns) — the existing search bar already opens the full Global Search experience where filters live. If you want a true multi-field property filter strip instead (Location · Type · Beds · Budget), tell me and I'll plan that variant.
