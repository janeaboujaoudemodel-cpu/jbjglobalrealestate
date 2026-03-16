

## Plan: Remove Champagne Gap Line and Center Hero Content

### Problem 1: Champagne line visible below filter bar
The root `<div>` in MainLayout has `md:bg-[#E8DCC8]` (champagne). On the homepage, the hero is full-screen black but the main content has `md:pt-[88px]` padding, creating an 88px champagne strip behind the fixed header. Since the hero uses `jj-hero-fullscreen` (100vh), the top of the hero starts 88px down, and any sub-pixel gap between the fixed filter bar bottom (~88px) and the hero top reveals the champagne background as a thin visible line.

**Fix**: On the homepage (transparent header pages), remove the top padding entirely on desktop since the hero is full-screen and goes behind the fixed header. The `md:pt-[88px]` is already only applied when `needsHeaderSpacing` is true, but currently there's a fallback `md:pt-[88px]` for non-spacing pages too. Change the fallback from `md:pt-[88px]` to `md:pt-0` for transparent-header pages so the hero sits flush at the top with no champagne gap.

**File**: `src/components/MainLayout.tsx` line 268
- Change: `"md:pt-[88px] pt-0"` → `"md:pt-0 pt-0"` for the non-header-spacing case

### Problem 2: Buy · Sell · Rent should be centered in the hero
Currently the hero content is left-aligned (`items-start`, `justify-end`). User wants the Buy/Sell/Rent section centered.

**File**: `src/pages/Index.tsx`
- Line 200: Change `items-start justify-end` → `items-center justify-center text-center`
- Line 205: Change `max-w-4xl` wrapper to center its content with `text-center mx-auto`
- Line 212-216: Center the Buy · Sell · Rent text block

### Files to edit
- `src/components/MainLayout.tsx` — remove desktop top padding for transparent-header pages
- `src/pages/Index.tsx` — center the hero content

