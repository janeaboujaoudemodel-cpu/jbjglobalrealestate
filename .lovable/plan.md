

## Plan: Nav Color Softening, Resale Filters Parity, and Mobile Mirror

### 1. AI Tools Hub — Change from Red to Soft Orange

The `getItemStyle` and `getIconStyle` in `GlobalVerticalNav.tsx` already have orange for `/ai-hub` (lines 606-609). If it's currently rendering red, it's a bug. Verify and ensure the inactive state uses `bg-orange-500/8 text-orange-600 border-orange-300/20` (soft premium orange, not red).

### 2. Soften All Hub Highlight Border Visibility

Make borders more subtle across all highlighted hubs. Change border opacities from `/20` to `/15` for a more refined look:

| Hub | Current Border | New Border |
|-----|---------------|------------|
| AI Tools Hub | `border-orange-300/20` | `border-orange-200/15` |
| AI Home Finder | `border-purple-400/20` | `border-purple-200/15` |
| List Your Property | `border-blue-300/20` | `border-blue-200/15` |
| Careers | `border-teal-400/20` | `border-teal-200/15` |
| Resale Properties | `border-emerald-300/20` | `border-emerald-200/15` |

Also soften text colors: use `/500` instead of `/600-700` for a lighter, more premium feel.

### 3. List Your Property — Lighter Blue

Change from `text-blue-600` / `bg-blue-500/8` to `text-sky-500` / `bg-sky-500/8` — sky blue is a much lighter, more premium tone than the current navy-ish blue.

### 4. AI Home Finder — Lighter Purple

Change from `text-purple-600` / `bg-purple-500/8` to `text-violet-400` / `bg-violet-500/6` — softer violet tone.

### 5. Mirror All Changes on Mobile Header

**File: `GlobalHeader.tsx` (lines 735-746)**

Update the mobile "My Shortcuts" section to match the exact same softened colors from the desktop nav. Currently hardcoded inline styles — update them to match.

Also update mobile support section (lines 1013-1018) to use the same red styling with softened borders.

### 6. Resale Properties — Add Missing Filters (Match Project Page)

**File: `ResaleProperties.tsx`**

The project page `FilterShortcutBar` has these filters that the resale page is missing:
- **Developer** filter (text search/select)
- **Emirates** filter (Dubai, Abu Dhabi, etc.)
- **Size range** (sqft min/max)
- **Sort** (Newest, Price Asc/Desc, Alphabetical)
- **Views** filter (Sea view, City view, etc.)

Add these to `ResaleProperties.tsx`:
- Add `developerFilter`, `sortBy`, `sizeMin`, `sizeMax` state variables
- Add developer Select dropdown (query `resale_listings` for distinct `developer_name` values)
- Add Sort dropdown with options: Newest, Price Low→High, Price High→Low
- Add Size Range inputs (min/max sqft)
- Apply these filters in the query and client-side filtering

### Files to Edit

| File | Changes |
|------|---------|
| `src/components/navigation/GlobalVerticalNav.tsx` | Soften all hub colors/borders, lighter blue/purple |
| `src/components/GlobalHeader.tsx` | Mirror softened colors on mobile shortcuts + support |
| `src/pages/ResaleProperties.tsx` | Add developer, sort, size filters to match project page |

