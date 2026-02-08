

# Centering TrustBar Cards & Fixing Brand Name

## Issues Identified

### 1. TrustBar Cards Not Centered
**Location**: `src/components/home/TrustBar.tsx`  
**Current state**: Line 49 uses `flex flex-wrap items-center justify-center gap-4 md:gap-6 lg:gap-8`

The cards use `justify-center` which should center them, but the visual appearance may be off because:
- The gaps between cards are inconsistent at different breakpoints
- The container doesn't enforce equal spacing on all sides
- The parent section in `Index.tsx` (lines 191-200) has its own padding that may not align

### 2. Brand Name Incomplete
**Location**: `src/components/GuidedTour.tsx` - Line 299  
**Current state**: `"Welcome to JBJ Global"`  
**Should be**: `"Welcome to JBJ Global Real Estate"`

---

## Implementation Plan

### Phase 1 - Fix TrustBar Card Centering

**File**: `src/components/home/TrustBar.tsx`

**Changes**:
1. Update the container class to ensure true centering with equal distribution:
   - Change from: `flex flex-wrap items-center justify-center gap-4 md:gap-6 lg:gap-8`
   - Change to: `flex flex-wrap items-center justify-center gap-4 md:gap-5 lg:gap-6 max-w-[1200px] mx-auto`

2. Add consistent horizontal padding:
   - Update: `py-8 md:py-10 px-4` → `py-4 md:py-6 px-6 md:px-8`

3. Alternative approach - use a grid with auto-fit for better distribution:
   ```tsx
   <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-[1100px] mx-auto px-4">
   ```
   This ensures all 4 cards are evenly distributed with equal gaps.

**Result**: Cards will be perfectly centered with equal spacing on all sides.

---

### Phase 2 - Fix Brand Name

**File**: `src/components/GuidedTour.tsx`

**Change at line 299**:
- **Current**: `Welcome to JBJ Global`
- **Updated**: `Welcome to JBJ Global Real Estate`

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/home/TrustBar.tsx` | Update container class for true centering with max-width and auto margins |
| `src/components/GuidedTour.tsx` | Add "Real Estate" to the welcome title |

---

## Verification Checklist

1. **TrustBar centered**: All 4 trust cards appear equally spaced and centered on desktop, tablet, and mobile
2. **Brand name correct**: Guided Tour modal shows "Welcome to JBJ Global Real Estate" with full name
3. **Responsive**: Cards stack properly on mobile (2 per row) and display in a single row on desktop

