

## Unified Header Block + Sidebar Logo Restoration

### Current State
- **HorizontalUtilityBar**: Single 48px row at `top-0`, full-width. Contains logo+brand on left, nav controls on right.
- **GlobalFilterBar**: Separate 40px row at `top-[48px]`, offset by sidebar width. Has `border-b border-gold/20`.
- **Sidebar**: Starts at `top-[48px]`, no logo header (removed in previous refactor).
- **Result**: Two visually separate horizontal bars with a border between them. Sidebar has no logo area.

### What Changes

#### 1. Merge both rows into ONE unified header container
**File: `HorizontalUtilityBar.tsx`**
- Remove the logo/brand/minimizer from the left section (it goes back to sidebar)
- Change from `h-[48px]` to `h-[88px]` (48px + 40px combined)
- Internal layout: two stacked rows inside ONE container, NO border/divider between them
  - Row 1 (48px): Back, Search, Buy, Rent, Sell, Favorites, ft²/m², Language, Currency, Filter + right-side controls
  - Row 2 (40px): FilterShortcutBar (currently in GlobalFilterBar)
- Same background across both rows: `bg-gradient-to-r from-[#E8DCC8] via-[#DCCFB5] to-[#D4C4A8]`
- Remove `border-b` from outer container (use only one at the bottom of the unified block)
- Starts at `left-[200px]` (or `left-[48px]` collapsed) — NOT full-width, since logo is back in sidebar
- Fixed, `top-0`, `z-[9998]`

#### 2. Remove GlobalFilterBar as a separate component render
**File: `MainLayout.tsx`**
- Remove the separate `<GlobalFilterBar />` render block (lines 260-264)
- The filter bar content is now embedded inside `HorizontalUtilityBar`

**File: `GlobalFilterBar.tsx`**
- Keep the file but it will no longer be rendered from MainLayout
- OR: Import and embed FilterShortcutBar directly into HorizontalUtilityBar

#### 3. Restore sidebar logo header
**File: `GlobalVerticalNav.tsx`**
- Re-add the 88px logo header block at the top of both expanded and collapsed sidebar states
- Expanded: Logo + "JBJ GLOBAL REAL ESTATE" + collapse button, champagne gradient `from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8]`
- Collapsed: Just logo icon centered, same gradient
- Sidebar starts at `top-0` again (not `top-[48px]`)
- Logo header height = 88px = matches the unified horizontal header height exactly

#### 4. MainLayout sidebar positioning
**File: `MainLayout.tsx`**
- Change sidebar container from `top-[48px] h-[calc(100vh-48px)]` back to `top-0 h-full` (or `h-screen`)
- Main content `pt` values: `md:pt-[88px]` to account for the taller unified header

#### 5. Remove all dividers between rows
- No `border-b` on row 1
- No `border-t` on row 2
- Single `border-b border-[hsl(var(--gold)/0.2)]` only on the outer 88px container

### Color Map
```text
┌─────────────────────────┬──────────────────────────────────┐
│ LOGO + JBJ GLOBAL       │  Row 1: Back Search Buy Rent …   │ 48px
│ #F5EBD7→#D4C4A8         │  #E8DCC8→#D4C4A8                 │
│                          ├──────────────────────────────────│ NO DIVIDER
│ [collapse btn]           │  Row 2: Search Price Payment …   │ 40px
│                          │  #E8DCC8→#D4C4A8 (same bg)       │
├─────────────────────────┼──────────────────────────────────│
│  My Shortcuts            │                                  │
│  Properties              │   PAGE CONTENT                   │
│  #E8DCC8→#D4C4A8         │                                  │
└─────────────────────────┴──────────────────────────────────┘
```

### Files Modified
1. `src/components/navigation/HorizontalUtilityBar.tsx` — merge both rows, remove logo, 88px height
2. `src/components/navigation/GlobalVerticalNav.tsx` — restore 88px logo header
3. `src/components/MainLayout.tsx` — remove GlobalFilterBar render, fix sidebar top, update content padding
4. `src/components/navigation/GlobalFilterBar.tsx` — no longer rendered (kept for reference)

### No Changes To
- Footer, index.css, page sections, typography, colors (no new colors added)

### Database Changes
None.

