

## Advanced Filter Panel + "Sold Out" Fix + Handover Extension to Q4 2035

### 1. Replace "Out of Stock" with "Sold Out" in All UI Labels

The label "Out of Stock" appears as a display label in one key location:

**File: `src/components/filters/FilterShortcutBar.tsx` (line 102)**
- Change `label: 'Out of Stock'` to `label: 'Sold Out'`

The internal value `'Sold Out'` is already correct in the database and filter config. The remaining "Out of Stock" references in other files are internal mapping logic (converting API values to "Sold Out") and filter exclusion logic (checking `.includes('out of stock')`) -- these must stay as-is to handle legacy API data.

### 2. Extend Handover Years to Q4 2035

**File: `src/components/filters/FilterShortcutBar.tsx` (line 119)**
- Change `YEARS` from `['2025', '2026', '2027', '2028', '2029', '2030']` to include every year up to 2035: `['2025', '2026', '2027', '2028', '2029', '2030', '2031', '2032', '2033', '2034', '2035']`
- Update `defaultShortcutFilters.handoverTo` to `{ quarter: 'Q4', year: '2035' }`

### 3. Build the Advanced Filter Panel (Full-Screen Sheet/Dialog)

Create a new component `src/components/filters/AdvancedFilterPanel.tsx` that opens as a scrollable `Sheet` (slide-in panel) styled with the gold/champagne theme. Based on the reference screenshots, it includes:

**Header:**
- Title: "New Off Plan Projects" with a gold live project count (fetched from the database)
- Search input: "Type a project, developer or district"
- Close (X) button

**Sections (scrollable body):**

| Section | UI Element | Data Source |
|---------|-----------|-------------|
| Location | Searchable multi-select dropdown with all 7 UAE Emirates | `EMIRATES_OPTIONS` from filterConfig |
| By Company | Searchable multi-select dropdown with developer logos | Fetch from `projects` table distinct developers |
| Projects Payment Plan | Slider 0-100% with pre-handover/post-handover inputs and toggle | Existing payment plan filter state |
| Property Price | Per unit / Per sqft / Per sqm tabs + Min/Max inputs with AED | Existing price filter state |
| Property Size | Min/Max sqft inputs with clear buttons | New filter fields added to `ShortcutFilterState` |
| Development Status | Toggle pills: Completed, Presale, Under Construction | Existing `constructionStatuses` |
| Unit Type | Toggle pills: Apartments, Villa, Townhouse, Duplex, Penthouse | Existing `propertyTypes` |
| Bedrooms | Toggle pills: Studio, 1 BR, 2 BR, 3 BR, 4 BR, 5+ BR | Existing `bedrooms` |
| Sales Status | Colored dot pills: Announced, Presale (EOI), Start of Sales, On Sale, **Sold Out** | Existing `statuses` |
| Project Handover By | From/To quarter+year selects (Q1 2025 to Q4 2035) | Existing `handoverFrom`/`handoverTo` |

**Footer (sticky at bottom):**
- "Clear all" button + Heart (save) icon
- "Show [X] projects" button (gold/champagne gradient) with live count

**Styling:** Gold champagne gradient background matching the sticky filter bar (`from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]`), `border-2 border-gold/40`, champagne-styled inputs and dropdowns.

**Live Count:** Query the database with a lightweight `SELECT COUNT(*)` filtered by the current advanced filter state, debounced by 500ms. The count updates as filters change.

### 4. Add "Advanced" Button to FilterShortcutBar Row 2

**File: `src/components/filters/FilterShortcutBar.tsx`**
- Add an "Advanced" pill button after "Construction" and before "Save"
- Clicking it opens the `AdvancedFilterPanel` sheet
- Import and render the new component

### 5. Update ShortcutFilterState Interface

**File: `src/components/filters/FilterShortcutBar.tsx`**
- Add new fields to `ShortcutFilterState`:
  - `sizeMin: string` (sqft)
  - `sizeMax: string` (sqft)
  - `emirates: string[]`
  - `developers: string[]`
  - `searchQuery: string` (for the advanced filter search box)
- Update `defaultShortcutFilters` with empty defaults

### Technical Summary

| File | Changes |
|------|---------|
| `src/components/filters/FilterShortcutBar.tsx` | Fix "Out of Stock" to "Sold Out"; extend YEARS to 2035; add Advanced button; expand `ShortcutFilterState` with new fields |
| `src/components/filters/AdvancedFilterPanel.tsx` | **NEW** -- Full advanced filter sheet with all sections, live count, champagne styling |
| `src/utils/applyShortcutFilters.ts` | Add filtering logic for new fields (emirates, developers, size range, search query) |

