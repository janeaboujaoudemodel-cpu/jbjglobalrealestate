

# Fix: Search Must Show Real Projects, Developers, and Areas

## Problem

The search bar only searches a **static index of pages** (globalSearchIndex.ts). When typing "emaar", it only finds the generic "Developers" page -- not the actual Emaar developer record from the database. The search needs to query real data from the `projects`, `developers`, and `areas` tables.

## Changes

### 1. Add Live Database Search to GlobalSearchModal

**File:** `src/components/GlobalSearchModal.tsx`

Add three Supabase queries that fire when the user types (debounced ~300ms):

- **Developers:** `select id, name, slug, logo_url from developers where name ilike '%query%' and status = 'active' limit 5`
- **Projects:** `select id, name, slug, main_image_url from projects where name ilike '%query%' and status = 'active' limit 5`
- **Areas:** `select id, name, slug, image_url from areas where name ilike '%query%' and status = 'active' limit 5`

Display results grouped by category (Developers, Projects, Areas) above the static page results. Each result links to its detail page (`/developer/{slug}`, `/project/{slug}`, `/area/{slug}`).

Result items will show:
- Developer logo (or Building2 icon fallback) for developers
- Project thumbnail (or Building2 fallback) for projects  
- Area image (or Map fallback) for areas

### 2. Add More Popular Pages (One Extra Per Column)

**File:** `src/components/GlobalSearchModal.tsx`

The Popular Pages grid has 6 items in a 3-column layout (2 rows). Add 3 more items to make it 9 (3 rows of 3):

Add these to the `POPULAR_PAGES` array:
- `{ label: "About Us", route: "/about", icon: Building2 }`
- `{ label: "News", route: "/news", icon: Newspaper }`
- `{ label: "AI Home Finder", route: "/quiz", icon: Sparkles }`

This adds one more row, effectively one more page per column.

### 3. Fix Divider Between Popular Pages Columns

**File:** `src/components/GlobalSearchModal.tsx`

Currently, the Popular Pages grid uses `border-r border-gold/20` on items that aren't the last in a row, creating vertical lines between columns. The user says it looks like "two lines" and wants a single clean divider.

**Embedded mode (line 221):** Remove the `border-r` approach entirely. Instead, use a simpler visual separator -- just remove the dividers between individual items in the grid. The grid gap itself provides visual separation.

**Full modal mode (line 373):** Same fix -- remove any double-line dividers and rely on the grid gap for clean separation.

### 4. Search Results Display for Database Items

In both embedded and full modal modes, when the user types a query:

1. Show **database results first** (grouped: Developers, Projects, Areas) with small thumbnails
2. Show **static page results** below under "Pages & Tools" heading
3. If no results at all, show "No results found"

Each database result item will be a button that navigates to the detail page with the same styling as existing search results but with a small image/logo thumbnail instead of a generic icon.

## Technical Details

- Use `useQuery` with the search query as key, enabled only when `query.length >= 2`
- Debounce with a 300ms delay using a `useEffect` + `setTimeout` pattern
- Combine static index results and database results into a unified display
- Database queries use `.ilike('name', '%query%')` for fuzzy matching

## Files Modified

| File | Change |
|------|--------|
| `src/components/GlobalSearchModal.tsx` | Add live DB search, more popular pages, fix dividers |
