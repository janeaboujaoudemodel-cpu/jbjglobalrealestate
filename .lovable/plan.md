

# Fix: Desktop/Mobile Navigation Hybrid Bug at Intermediate Widths

## Problem
At ~1083px viewport (e.g., when Lovable chat panel is open), the layout enters a broken hybrid state:
- **GlobalHeader** (mobile nav) is hidden at `lg:` (1024px+) — gone
- **HorizontalUtilityBar** (desktop bar) renders at ALL widths — shows but half-broken
- **GlobalVerticalNav** (sidebar) renders at `lg:` but may not have revealed yet (3s delay on homepage)

Result: user sees a truncated horizontal bar, no sidebar, no mobile header. A broken in-between state.

## Root Cause
The desktop breakpoint is `lg` (1024px), which is too low for the L-shaped navigation (sidebar 200px + utility bar + content). The HorizontalUtilityBar also lacks any breakpoint gate — it always renders.

## Fix: Raise Desktop Navigation Breakpoint to `xl` (1280px)

Below 1280px → clean mobile view (GlobalHeader only).  
At 1280px+ → full desktop view (vertical sidebar + horizontal utility bar).

### File 1: `src/components/MainLayout.tsx`
- Line 243: `lg:hidden` → `xl:hidden` (GlobalHeader visibility)
- Line 248: `hidden lg:block` → `hidden xl:block` (vertical nav visibility)
- Line 253-255: Wrap HorizontalUtilityBar in `hidden xl:block` div
- Line 259: Change all `lg:pl-[200px]`, `lg:pl-[48px]`, `lg:pt-[52px]` → `xl:` variants
- Line 270: Same `lg:pl-` → `xl:pl-` for footer wrapper

### File 2: `src/components/navigation/HorizontalUtilityBar.tsx`
- Line 107: `hidden lg:inline` → `hidden xl:inline` for label class
- Line 112: Change `lg:px-5`, `lg:pr-10` → `xl:px-5`, `xl:pr-10`

### File 3: `src/components/navigation/GlobalVerticalNav.tsx`
- No changes needed — it's already gated by the `hidden lg:block` wrapper in MainLayout

### What stays the same
- `useIsMobile` (768px) and `useIsTouchLayout` (1024px) hooks unchanged — they serve different purposes (component-level responsive behavior)
- All content `lg:px-8` padding unrelated to the nav system stays as-is
- Owner dashboard shell is unaffected (uses its own sidebar logic)

