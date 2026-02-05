
# Fix Homepage Hero Search Bar: Rounded Corners and Currency Dropdown

## Issues Identified

### 1. Search Button Left Corner Not Rounded
**Current State (lines 912-921):**
```jsx
<div className="p-1">
  <Button
    onClick={handleSearch}
    className="h-10 px-5 py-2.5 bg-gold hover:bg-gold-dark text-black font-bold text-sm rounded-xl transition-all duration-300"
  >
    <Search className="w-4 h-4 mr-1.5" />
    Search
  </Button>
</div>
```

**Problem:** The search button is inside a container with `overflow-hidden` (line 617). While the button has `rounded-xl`, the container's structure may be clipping or obscuring the left rounded edge. The user wants the Search button to appear as a fully rounded pill shape with both sides equally curved.

**Solution:** 
- Change `rounded-xl` to `rounded-full` for a perfect pill shape
- Increase horizontal padding for better visual balance

### 2. Currency Dropdown Not Opening Upward Properly
**Current State (lines 546-552):**
```jsx
<PopoverContent 
  className="w-48 p-2 ... max-h-64 overflow-y-auto overscroll-contain"
  side="top"
  align="start"
  sideOffset={4}
  avoidCollisions={false}
  onWheelCapture={(e) => e.stopPropagation()}
>
```

**Problem:** Despite having `side="top"` configured, the dropdown may still open downward due to browser collision detection or the `avoidCollisions={false}` not being respected. Also, the Radix Popover might need explicit collision boundary settings.

**Solution:**
- Keep `side="top"` and `avoidCollisions={false}`
- Add `collisionPadding={0}` to ensure no automatic repositioning
- Ensure proper z-index stacking

---

## Implementation Changes

### File: `src/components/home/HeroSearchBar.tsx`

#### Change 1: Make Search Button Fully Rounded (Pill Shape)

**Lines 912-921 - Before:**
```jsx
{/* Search Button - Rounded on both sides with small gap */}
<div className="p-1">
  <Button
    onClick={handleSearch}
    className="h-10 px-5 py-2.5 bg-gold hover:bg-gold-dark text-black font-bold text-sm rounded-xl transition-all duration-300"
  >
    <Search className="w-4 h-4 mr-1.5" />
    Search
  </Button>
</div>
```

**After:**
```jsx
{/* Search Button - Fully rounded pill shape */}
<div className="p-1.5">
  <Button
    onClick={handleSearch}
    className="h-10 px-6 py-2.5 bg-gold hover:bg-gold-dark text-black font-bold text-sm rounded-full transition-all duration-300 shadow-lg hover:shadow-gold/30"
  >
    <Search className="w-4 h-4 mr-1.5" />
    Search
  </Button>
</div>
```

**Changes:**
- `p-1` → `p-1.5` (slightly more padding around button)
- `px-5` → `px-6` (more horizontal padding for pill shape)
- `rounded-xl` → `rounded-full` (perfect pill/capsule shape)
- Added `shadow-lg hover:shadow-gold/30` for premium glow effect

#### Change 2: Ensure Currency Dropdown Opens Upward with Scrolling

**Lines 546-552 - Before:**
```jsx
<PopoverContent 
  className="w-48 p-2 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 z-[9999] max-h-64 overflow-y-auto overscroll-contain"
  side="top"
  align="start"
  sideOffset={4}
  avoidCollisions={false}
  onWheelCapture={(e) => e.stopPropagation()}
>
```

**After:**
```jsx
<PopoverContent 
  className="w-48 p-2 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 z-[9999] max-h-60 overflow-y-auto overscroll-contain"
  side="top"
  align="start"
  sideOffset={8}
  avoidCollisions={false}
  collisionPadding={0}
  onWheelCapture={(e) => e.stopPropagation()}
  onPointerDownOutside={(e) => e.preventDefault()}
>
```

**Changes:**
- `max-h-64` → `max-h-60` (slightly shorter to ensure it fits above the bar)
- `sideOffset={4}` → `sideOffset={8}` (more visual separation from trigger)
- Added `collisionPadding={0}` (prevents automatic repositioning)
- Added `onPointerDownOutside` handler to improve UX

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/home/HeroSearchBar.tsx` | Lines 912-921 (Search button rounding), Lines 546-552 (Currency popover) |

---

## Expected Results

1. **Search Button:** Will appear as a perfect pill/capsule shape with both left and right sides equally rounded, matching the premium aesthetic
2. **Currency Dropdown:** Will consistently open upward with internal scrolling, preventing the main page from scrolling when navigating through currency options

---

## Visual Reference

**Before:**
```text
┌─────────────────────────────────────────────────┬──────────┐
│ 🔍 Area, project or community  │ Beds ▾ │ Price ▾ │▌SEARCH ▌│
└─────────────────────────────────────────────────┴──────────┘
                                                   ↑ square left edge
```

**After:**
```text
┌─────────────────────────────────────────────────┬──────────────┐
│ 🔍 Area, project or community  │ Beds ▾ │ Price ▾ │ (SEARCH) │
└─────────────────────────────────────────────────┴──────────────┘
                                                     ↑ pill shape
```
