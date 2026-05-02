## Goal

Update the three category cards ("I'm an Investor / Broker / Developer") on the home page so the icon tile matches the champagne sidebar tone, with a clean black/gold invert on hover.

## Scope

Single file: `src/components/home/CategorySelectorSection.tsx` (lines ~99–110, the icon tile `div` and its `<Icon />`).

Nothing else changes — card body, text, bullets, "Continue" row, and the locked homepage marquee all stay exactly as they are.

## Visual spec

**Default state**
- Icon tile background: champagne (`#F7F2EA`) — same tone as the vertical sidebar surface
- Tile border: subtle gold hairline (`#B89555` at ~40% opacity), no heavy gradient/shadow
- Icon color: solid black (`#1A1A1A`), strokeWidth 2.25, no white drop-shadow

**Hover state** (whole card already lifts via `whileHover={{ y: -4 }}` — keep that, plus invert the tile)
- Tile background: ink black (`#1A1A1A`)
- Tile border: gold (`#B89555`)
- Icon color: gold (`#B89555`)
- Smooth color transition (~200ms)

This gives the "floating + invert" effect the user described, picking option B (black fill, gold icon on hover) layered on top of the existing card lift.

## Technical change

Replace the current tile markup:

```text
<div class="w-12 h-12 rounded-xl bg-gradient-to-br from-[#D4AF37] ... shadow-[...]">
  <Icon style={{ color: "#FFFFFF", filter: "drop-shadow(...)" }} />
</div>
```

With a champagne-filled tile that inverts on group-hover:

```text
<div class="w-12 h-12 rounded-xl bg-[#F7F2EA] border border-[#B89555]/40
            flex items-center justify-center flex-shrink-0
            transition-colors duration-200
            group-hover:bg-[#1A1A1A] group-hover:border-[#B89555]">
  <Icon class="w-6 h-6 text-[#1A1A1A] group-hover:text-[#B89555] transition-colors duration-200"
        strokeWidth={2.25} />
</div>
```

Notes:
- The parent `<motion.button>` already has `className="group ..."`, so `group-hover:` works without further changes.
- Drop the inline `style={{ color, filter }}` on the icon so Tailwind `text-*` classes drive the color cleanly.
- Keep `flex-shrink-0`, sizing, and rounded corners identical so layout doesn't shift.

## Out of scope / locked

- Homepage hero marquee and `DeveloperPartnersMarquee` — untouched.
- Project listing cards, developer logos, payment-plan badges — untouched.
- Tagline text, bullets, "Continue" arrow row — untouched.
- No global token changes; this is a local restyle of one component.

## Verification

After implementing, visually confirm on `/`:
1. Default: tile reads as champagne with a black icon, matching the sidebar tone.
2. Hover: card lifts, tile flips to black, icon flips to gold, transition is smooth.
3. Focus ring (`focus-visible:ring-[#B89555]`) still visible for keyboard users.
