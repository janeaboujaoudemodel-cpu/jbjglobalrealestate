# Premium gold treatment for vertical-sidebar mega-menus

The vertical sidebar's pop-out panels (Properties, Sell, Rent, Developers, Areas, Insights, Guides, Services, Partners, Broker, Investor, Company, Legal, Productivity, My Account, Suites, Shortcuts) currently render with a pale cream body, a faint gold rim, and link rows that fall back to flat black-on-cream — they read as "gray" and lose the JBJ premium tone. This plan upgrades all of them in one place: `src/components/navigation/GlobalVerticalNav.tsx`, inside `renderMegaMenu()` (lines ~834–1058).

## What changes — visual

1. **Panel shell — true premium frame**
   - Crisper single-stroke gold border (`border border-gold/70`) instead of the current fuzzy `border-2 border-gold/40`.
   - Add an inner gold halo via `shadow-[0_24px_60px_-18px_rgba(0,0,0,0.45),0_0_0_1px_rgba(217,194,146,0.35)_inset]` so the frame reads luxurious, not flat.
   - Deepen the background to true champagne (`from-[#FFFCF6] via-[#F7EFDF] to-[#EFE3C9]`) so it stops looking like grey paper.
   - Add a 3px solid gold accent strip down the left edge of every panel for a "premium drawer" cue.

2. **Panel header**
   - Replace the half-transparent strip with a solid champagne bar (`bg-gradient-to-r from-[#EADBB6] to-[#D8C7A6]`) plus a 1px gold hairline below.
   - Title icon (Sparkles / Building / MapPin / Zap) sits inside a 28px gold-filled badge (`bg-gradient-to-br from-gold to-gold-dark`) with a white icon — same badge language already used in ModeSwitcher.
   - Close (X) becomes a filled gold disc with a white X (currently `bg-gold/10` with gold X — too faint).

3. **Link rows — uniform premium chip with gold border**
   - Inactive: `bg-white/70 border border-gold/25 text-black/85`, with `hover:bg-gold/15 hover:border-gold/60`. Adds the hairline gold border the user explicitly asked for, on every row.
   - Active: solid gold gradient `bg-gradient-to-r from-gold to-gold-dark text-white border border-gold` with white icon and white chevron — strong selected state, no more washed-out cream.
   - Icons render in gold on inactive, white on active. Chevron mirrors the same.
   - Standardize row geometry: `rounded-xl px-3 py-2.5` across all three branches (default, developers/areas, shortcuts) so spacing is identical everywhere.

4. **Shortcut groups (the colored category pills inside the Shortcuts panel)**
   - Keep their per-category color accents (those are intentional taxonomy colors, not "gray"), but wrap each group in `border border-gold/25 bg-white/60` so the whole panel still reads gold-framed and premium.

5. **"View All" CTA (developers / areas panel)**
   - Promote from outline-only to filled gold (`bg-gradient-to-r from-gold to-gold-dark text-white border border-gold`, white icons) so it stops vanishing into the cream.

6. **Scrollbar:** already `jj-scrollbar-gold` — no change.

## What changes — code

All edits are in `src/components/navigation/GlobalVerticalNav.tsx` inside the three branches of `renderMegaMenu()`:
- Shortcuts branch (~lines 840–909)
- Developers / Areas branch (~lines 912–999)
- Default branch (~lines 1002–1057)

The same className recipe is applied in all three so the panels are visually identical except for content. No new components, no new files. Hover/active logic, click-to-close, route highlighting, and animations are preserved.

## Out of scope

- The sidebar rail itself (logo header, section accordion, bottom support strip) already uses the gold treatment and matches the JBJ palette — the user's complaint is about the *opened* panels, so the rail is not touched.
- `PropertiesVerticalNav.tsx` is the map-page rail, unrelated to the global sidebar dropdowns; not modified.
- Mega-menu *content* (which links live in which panel) is unchanged.
