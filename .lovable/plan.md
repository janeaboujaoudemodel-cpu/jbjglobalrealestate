## Goal

Fix the real component-level defects identified in the Careers page (Explore Open Positions CTA, Meet Jessica panel, Open Positions panel, Job cards, Application form picker). No global CSS guards, no generic selector overrides, no resizing of header/sidebar/search controls.

## Scope (only these components)

1. `src/components/careers/PremiumCareersHero.tsx`
   - Replace the custom "Explore Open Positions" + "Chat with Jessica" buttons with the existing canonical CTA primitives so text/icon contrast is correct:
     - Primary → `.jj-pill-emerald-metallic` (white text + white icon, locked by index.css)
     - Secondary → `.jj-cta-emerald` champagne variant (emerald text on champagne)
   - Match heights/padding to homepage hero CTA.

2. `src/components/careers/JessicaAIPanel.tsx`
   - Rebuild "Start Conversation" using the same `.jj-pill-emerald-metallic` primitive (currently uses hand-rolled `bg-[#0A0A0A]` + manual white overrides — that's the contrast-fragile path).
   - Tighten avatar ring/spacing: use a single ring, consistent 80px circle, badge gap normalized.

3. Open Positions panel + Job cards (find file via grep — likely `CareersOpenPositions*` / `JobCard*` inside `src/components/careers/`).
   - LIVE ROLES pill → reuse existing emerald badge primitive
   - Search bar → reuse existing `SearchInput` style; fix internal padding, icon offset, and ensure counter "21" has `flex-shrink-0` + min-width on the badge ONLY (scoped to that component, not global)
   - `Apply` button → `.jj-pill-emerald-metallic`
   - `Selected` button → existing selected/active variant (emerald solid w/ check), not navy
   - `View all N positions` → primary emerald primitive
   - Category chips (Partner / Top Opportunity / Featured) → unify with existing `Chip` component

4. Application form "Applying for" card icon tile (square clipped to empty) → use `<IconTile tone="emerald">` with the role icon.

## What I will NOT touch

- index.css (no new guards, passes, overrides)
- Sidebar, header controls (filter/fav/sqft/sqm/currency/mode/profile), floating search button
- Any non-Careers page
- Owner Portal, Broker Portal, Market Intelligence, Resale (no defects from the screenshots that aren't on Careers — except market-intelligence "View Area Details" clipped pill, which I'll fix in its single source component if it's the same primitive issue)

## Market Intelligence (one targeted fix)

- Locate the "View Area Details" CTA in the area card component and swap to `.jj-pill-emerald-metallic` so text/icons render white correctly. Single component file edit only.

## Validation

1. `tsgo` for type safety.
2. Playwright headless: navigate `/careers` + `/market-intelligence`, screenshot the hero, Jessica panel, Open Positions panel, a job card, and an area card. Visually verify white-on-emerald text and pill geometry.
3. No `index.css` changes, no new global selectors — grep the diff to confirm.

## Out of scope

Anything not in the screenshots. No redesigns. No new primitives — only reuse `.jj-pill-emerald-metallic`, `.jj-cta-emerald`, `IconTile`, existing `Chip`/`SearchInput` primitives.
