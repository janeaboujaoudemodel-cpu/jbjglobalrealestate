

# Fix Sticky Sub-Navigation on Project Detail Page

## Problem
The sticky shortcuts bar (Details, Gallery, Progress, Developer, Specs, Location, Brochure, AI Analyzer) disappears on scroll because:
1. The background uses `bg-card/98` (98% opacity) -- content behind bleeds through, making the bar visually disappear against similar-colored sections
2. The `top` offset values (`top-20 sm:top-24 md:top-28 lg:top-32`) don't consistently match the main header height, causing the bar to sit behind the header or leave a gap
3. `z-40` may be too low compared to other fixed elements

## Fix

**File: `src/components/project-detail/ProjectDetailLayout.tsx`** (lines 567-572)

### Change 1: Solid opaque background
Replace `bg-card/98 backdrop-blur-md` with a fully opaque background:
- Use `bg-black` (dark mode) to guarantee zero transparency
- Keep `border-b border-gold/30 shadow-lg` for visual separation

### Change 2: Fix top positioning to match header
Replace the multi-breakpoint `top-20 sm:top-24 md:top-28 lg:top-32` with values that match the actual header height:
- The header is `h-16` on mobile (64px = `top-16`) and `h-20` on desktop lg+ (80px = `top-20`)
- Use `top-16 lg:top-20` for precise alignment

### Change 3: Increase z-index
Change `z-40` to `z-[9999]` to ensure it always stays above other content (the main header uses `z-[11000]` per the navigation memory, so this sits just below it)

### Summary of line changes

**Line 568** -- Current:
```
className={`fixed top-20 sm:top-24 md:top-28 lg:top-32 left-0 right-0 z-40 transition-all duration-300 ${
```

**Line 568** -- New:
```
className={`fixed top-16 lg:top-20 left-0 right-0 z-[9999] transition-all duration-300 ${
```

**Line 572** -- Current:
```
<div className="bg-card/98 backdrop-blur-md border-b border-gold/30 shadow-lg">
```

**Line 572** -- New:
```
<div className="bg-black border-b border-gold/30 shadow-lg">
```

These three changes ensure the sticky nav is always visible, properly positioned below the header, and fully opaque so it never disappears on scroll.
