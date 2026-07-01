## Goal

Rebuild the filter + list layout on **Projects (Properties/Off-Plan)**, **Areas / Area Detail**, and **Resale Properties** to match the Bayut and Property Finder filter model (density, controls, hierarchy), keep every existing JBJ-only filter that isn't on those portals, and render everything in our champagne + emerald palette. The horizontal utility bar in the header is out of scope.

## What stays untouched

- `src/components/navigation/HorizontalUtilityBar.tsx` (search / views / heart / sq ft-m / currency / mode / avatar).
- Global sidebar, header, mode picker, tokens in `index.css`.
- Data sources, RLS, edge functions. Frontend/presentation only.

## Filter model (merged: Bayut ∪ PropertyFinder ∪ JBJ)

One reusable panel + one sticky results toolbar, shared by all three pages. Fields:

```text
Primary row (always visible, sticky):
  Purpose (Buy / Rent / Off-Plan)   — page-scoped
  Location (multi-chip: city → community → sub-community, searchable)
  Property Type (multi: Apartment, Villa, Townhouse, Penthouse, Plot, Building, Office, Retail, Warehouse, Hotel Apt)
  Beds (Studio, 1–7+, multi-select pills)
  Baths (1–7+, multi-select pills)
  Price (min–max, currency-aware via existing currency store) + "Any"
  Area size (min–max, unit-aware sq ft/sq m via existing store)
  [More filters] button → full panel

More filters panel (drawer/sheet on mobile, popover on desktop):
  Completion status (Ready / Off-Plan / Under Construction)  [Bayut+PF]
  Handover date range                                        [JBJ – keep]
  Payment plan slider (post-handover %)                      [JBJ – keep]
  Furnishing (Furnished / Semi / Unfurnished)                [Bayut+PF]
  View (Sea / Marina / Burj / Park / Golf / Community)       [PF]
  Amenities (multi-chip; pool, gym, parking, maid, study…)   [Bayut+PF]
  Developer (multi, searchable)                              [PF+JBJ]
  Project / Tower (multi, searchable)                        [JBJ – keep]
  Sale status (Available / Reserved / Sold)                  [JBJ – keep]
  Verified only toggle                                       [Bayut]
  Virtual tour only toggle                                   [Bayut+PF]
  Floor range (min–max)                                      [PF]
  Year built / Handover year                                 [PF]
  Rental frequency (Yearly/Monthly/Weekly/Daily)             [Rent only]
  Keyword (free text, e.g. "vacant on transfer")             [Bayut+PF]

Sticky results toolbar:
  Result count + active-filter chips (removable) + Save search
  Sort (Newest, Price ↑/↓, Beds, Size, Handover, Popularity)
  View toggle (Grid / List / Map) — Map only where a map exists
```

Behavior: URL-synced query params, chip-based active filters (Bayut pattern), "Reset all", auto-count refresh, mobile bottom-sheet with sticky Apply/Reset (Property Finder pattern).

## Layout model (per page)

```text
┌───────────────────────────────────────────────────────────────┐
│ Page hero (compact, champagne band, black ink title)         │
├───────────────────────────────────────────────────────────────┤
│ Sticky primary filter row  (emerald pills, white ink)        │
│ [Purpose][Location][Type][Beds][Baths][Price][Area][More▾]   │
├───────────────────────────────────────────────────────────────┤
│ Active-chip strip · result count · Save · Sort · View toggle │
├──────────────┬────────────────────────────────────────────────┤
│ (Desktop)    │  Result grid / list / map                      │
│ Left rail    │  Cards keep existing JBJ card component        │
│ Facet groups │                                                │
└──────────────┴────────────────────────────────────────────────┘
```

- Desktop ≥1280px: optional left facet rail (collapsible) mirroring Bayut. Below: full-width results.
- Tablet/mobile: no rail; primary row + [More filters] bottom sheet.

## Files to add

- `src/components/filters/UnifiedFilterPanel.tsx` — merged panel used by all three pages.
- `src/components/filters/UnifiedFilterBar.tsx` — sticky primary row.
- `src/components/filters/ActiveFilterChips.tsx` — Bayut-style removable chip strip.
- `src/components/filters/FacetRail.tsx` — collapsible desktop left rail.
- `src/components/filters/useUnifiedFilters.ts` — URL-synced state, currency/unit-aware, replaces per-page ad-hoc state.
- `src/components/filters/filterSchema.ts` — single source of truth for fields, options, labels, palette bindings.

## Files to edit

- `src/pages/Properties.tsx` (Off-Plan / Projects) — swap ad-hoc filters for `UnifiedFilterBar` + `UnifiedFilterPanel`. Preserve existing card grid, empty state, and JBJ-only extras (sale status, handover, payment plan).
- `src/pages/ResaleProperties.tsx` — same swap; keep "verified investor" and resale-only extras; hide off-plan-only fields (handover, payment plan post-handover).
- `src/pages/AreaGuides.tsx` + `src/pages/AreaDetail.tsx` + `src/components/area-detail/AreaProjectsGrid.tsx` — apply the same bar/panel, scoped to the area (Location pre-filled, disabled).
- `src/pages/PropertiesReelly.tsx`, `src/pages/PropertyMap.tsx` — align sticky bar and chip strip; keep map-specific behavior.
- `src/components/filters/AdvancedFilterPanel.tsx`, `FilterShortcutBar.tsx` — become thin wrappers around the unified components (no duplicate logic), so existing tests keep passing.

## Palette + contrast rules (non-negotiable)

- Page background: `#FDFBF7`. Panels/cards: `#F7F2EA` with `#B89555` 1px hairline (accent only, never fill).
- Primary pill / active state: `.jj-pill-emerald-metallic` (emerald metallic) + `#FFFFFF` text & icons.
- Inactive pill: champagne fill + `#1A1A1A` ink; hover raises to raised champagne `#EFE6D6`.
- Chips: emerald outline when active, champagne fill when neutral. Remove-x always visible.
- No restricted green (`#10B981`). No gold as a fill. No raw gray dividers — separation is tone step.
- Titles use `<SectionTitle />` (ink black). Prices use `<PricePill />`. Developer names use `<DeveloperLink />`.

## Validation

- Playwright sweep (desktop 1440, iPad 1024, mobile 390) on `/properties`, `/resale-properties`, `/areas`, `/areas/:slug` — screenshots before/after, zero horizontal overflow, zero restricted-green hex, active-chip round-trip via URL, More-filters sheet opens/closes and applies.
- Vitest: extend `src/components/filters/__tests__` to cover Unified panel selection, chip removal, reset all, URL sync.
- Contrast audit on emerald pill (white ink ≥ 7:1) and champagne pill (black ink ≥ 7:1).

## Out of scope (explicit)

- Horizontal header utility bar and its dropdowns.
- Card component redesign, PDP layout, backend/schema, listing ingestion.
- Any tool page, portal shell, or CRM view.

Approve and I'll implement in this order: schema → hook → panel/bar/chips → wire Projects → Resale → Areas → tests + Playwright.
