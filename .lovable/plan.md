
# Global Sidebar + Backend Styling Cleanup

Scope: styling only. No layout, content, route, or logic changes. Every step ends with a Playwright screenshot before moving on.

## 1. Front-end vertical sidebar (`GlobalVerticalNav.tsx` + `SidebarModePortalBlock.tsx`)

- Widen sidebar from current ~200px to **236px** (collapsed stays 72px), bump container `border-radius` on the portal pill so "BROKER PORTAL" label fits on one line without truncation.
- Remove the emerald-filled background from **AI Home Finder, List Your Property, Careers, Resale Properties** nav rows. They must render as plain rows: emerald icon-tile + ink (#1A1A1A) label on champagne. Only the *currently active* route gets the dark emerald fill (same treatment as "My Account").
- Active row: keep the dark emerald gradient pill, force `color:#FFFFFF` on label + chevron + icon glyph (via existing emerald-surface white-fg guard; add the row selector if missing).
- All sidebar icons globally wrapped in the emerald `IconTile` with a white glyph. Add a CSS guard scoped to `[data-sidebar-root] .jj-icon-tile svg { color:#FFFFFF !important; stroke:#FFFFFF !important; }`.

## 2. Contact / Support / Collapse footer buttons

- "Contact Us" and "Support": outlined variant — `bg:transparent`, `border:1px solid #064E3B`, emerald text + emerald icon at rest. Hover → fill `var(--jj-emerald-ombre)`, text + icon flip to white.
- "Collapse": same outlined-emerald rest + emerald-fill hover; if a solid variant is required, keep emerald fill with white label + chevron.

## 3. Backend sidebars (Broker / Developer / Owner / Investor / Admin)

Files: `BrokerPortalSidebar.tsx`, `OwnerDashboardSidebar` (and its developer/investor/admin equivalents), `JBJSidebar.tsx`.

- Replace ad-hoc styling with the same primitives used by the front-end vertical sidebar:
  - Champagne surface `#F7F2EA`, gold hairline border, identical row radius/padding/spacing.
  - Every row icon wrapped in emerald `IconTile` with white glyph.
  - Active row = dark emerald pill with WHITE label + chevron + icon.
  - Footer buttons (Return to Site / Sign Out / Collapse / Back to JBJ Owner) follow the outlined-emerald → emerald-fill-on-hover rule.

## 4. Backend page surfaces

Global CSS additions only (no per-page rewrites):

- Enforce champagne page background (`#FDFBF7`) on all backend route shells already using `data-surface="champagne"`.
- Small emerald accent cards/badges/tabs/section titles: any element with `data-emerald-fill` or `.jj-cta-emerald` / `.jj-badge-emerald` → text + svg locked to `#FFFFFF` at rest and hover (extend the existing emerald-white-fg guard with the few missing selectors).
- Form field borders, tab underlines, small internal cards: emerald accent `#064E3B` at 1px.

## 5. Guides/Reports, AI Tools, Careers, Book inner pages

- Apply the champagne shell wrapper + emerald accent tokens (no layout change).
- Book covers untouched. Inner book page: ensure the body content renders (existing data source) and the page chrome (header, breadcrumbs, CTA pill) uses the same champagne + emerald system.

## 6. Validation (mandatory before reply)

Drive Playwright headless on localhost:8080 and capture screenshots for:
- `/` front-end sidebar (expanded + collapsed)
- `/broker/portal` sidebar
- `/developers-portal` sidebar
- `/owner` sidebar
- `/investor-dashboard` sidebar
- `/guides` (or `/reports`) listing page
- `/tools`
- `/careers`
- One opened book inner page

Each screenshot reviewed; any remaining black-on-emerald, missing icon tile, or truncated "Broker Portal" label is patched and re-shot before declaring done.

## Files expected to change

- `src/components/navigation/GlobalVerticalNav.tsx`
- `src/components/navigation/SidebarModePortalBlock.tsx`
- `src/components/broker-portal/BrokerPortalSidebar.tsx` (+ layout file if widths change)
- `src/components/owner-dashboard/...Sidebar.tsx` (Owner + Developer + Investor + Admin variants)
- `src/components/jbj-broker/JBJSidebar.tsx`
- `src/index.css` (additive guard block; no removals)

No route, schema, content, or business-logic edits.
