

## Restructure Header + Sidebar Color System

### Current State
- **Header** (`HorizontalUtilityBar`): Starts at `left-[200px]`, offset by sidebar width. Uses champagne gradient `#F5EBD7 → #E8DCC8 → #D4C4A8`.
- **Sidebar header** (88px tall): Contains logo + "JBJ GLOBAL" + collapse button. Same champagne gradient.
- **Sidebar body**: Very light `#FDFBF7 → #F5F0E6 → #EDE4D3`.
- **FilterBar**: Starts at `left-[200px]`, `top-[48px]`.

### What Changes

#### 1. Header becomes full-width with logo integrated
**File: `HorizontalUtilityBar.tsx`**
- Change `left-[200px]` → `left-0` (full width from edge)
- Add left section (200px wide when sidebar expanded, 48px when collapsed): Logo + "JBJ GLOBAL REAL ESTATE" + collapse/expand button
- Left section background: Sidebar TOP color (`#F5EBD7 → #E8DCC8 → #D4C4A8`) — light premium gold
- Right/center section background: Sidebar BODY color (new darker shade: `#E8DCC8 → #DCCFB5 → #D4C4A8`)
- Fixed, `top-0`, `z-[9998]`, no changes on scroll

#### 2. Sidebar loses its header, body gets darker
**File: `GlobalVerticalNav.tsx`**
- **Remove** the 88px header block (logo area) from both expanded and collapsed states — logo now lives in the horizontal header
- Sidebar starts rendering from `top-[48px]` (below the header)
- Sidebar body gradient changes from very-light (`#FDFBF7 → #F5F0E6 → #EDE4D3`) to darker (`#E8DCC8 → #DCCFB5 → #D4C4A8`)
- Nav item text colors adjusted for darker background (keep gold icons, adjust text contrast)
- Collapsed sidebar: same darker body color, no header strip

#### 3. FilterBar alignment
**File: `GlobalFilterBar.tsx`**
- Keep `left-[200px]` (still starts after sidebar, not full-width)
- Background matches header center section color (`#E8DCC8 → #DCCFB5 → #D4C4A8`)

#### 4. MainLayout sidebar positioning
**File: `MainLayout.tsx`**
- Sidebar container: add `top-[48px]` and adjust height to `h-[calc(100vh-48px)]` so it sits below the new full-width header

### Color Map (HEX)
```text
┌──────────────────────────────────────────────────┐
│ LOGO + JBJ GLOBAL + ≪  │  Back Search Buy Rent … │  ← Header (full width, fixed)
│ #F5EBD7→#D4C4A8        │  #E8DCC8→#D4C4A8        │
├─────────────────────────┼────────────────────────-│
│  My Shortcuts           │                         │
│  Properties             │   PAGE CONTENT           │
│  Services               │                         │
│  #E8DCC8→#D4C4A8        │                         │  ← Sidebar body (darker)
│  (same as header center)│                         │
└─────────────────────────┴─────────────────────────┘
```

### Files Modified
1. `src/components/navigation/HorizontalUtilityBar.tsx` — full-width, logo section added, two-tone bg
2. `src/components/navigation/GlobalVerticalNav.tsx` — remove header block, darker body, top offset
3. `src/components/navigation/GlobalFilterBar.tsx` — match center section color
4. `src/components/MainLayout.tsx` — sidebar container top offset

### No Changes To
- Footer, index.css, page sections, typography, other components

### Database Changes
None.

### Testing Steps
1. Verify header spans full width with logo on left, nav controls on right
2. Verify header left section matches sidebar TOP champagne tone
3. Verify header center/right matches darker sidebar body tone
4. Verify sidebar has no duplicate logo area, starts below header
5. Verify collapsed sidebar state works (logo in header shrinks to icon, sidebar narrow)
6. Verify fixed header on scroll — no color/size change
7. Verify "JBJ GLOBAL REAL ESTATE" text never shrinks or wraps
8. Verify filter bar aligns correctly below header

