

## Global Edge Alignment - Remaining Sections

### Problem
The "Ready to Get Started?" section (`CombinedContactNewsletter`) and the `PreFooterSeparator` component still use wider/different margins than the `jj-layer-2` standard, causing misalignment with the footer, newsletter band, and project card layers.

### Changes

**1. CombinedContactNewsletter (`src/components/CombinedContactNewsletter.tsx`)**
- Current: `mx-4 sm:mx-6 md:mx-4 lg:mx-6 xl:mx-8`
- Change to: `mx-1 sm:mx-2 md:mx-3 lg:mx-4`
- This is the globally rendered "Ready to Get Started?" + contact cards + newsletter section in MainLayout

**2. PreFooterSeparator (`src/components/PreFooterSeparator.tsx`)**
- CTA variant current: `container mx-auto px-3 sm:px-4 md:px-6` with `max-w-[1200px]`
- Change to: `mx-1 sm:mx-2 md:mx-3 lg:mx-4` and remove `container`, `mx-auto`, and `max-w` constraints
- Simple separator variant: same update for its inner `container mx-auto px-6` wrapper
- Used on Market Intelligence, Philanthropy, and other pages

### Technical Notes
- Only outer margin/padding wrappers are touched; no inner content changes
- Both components will match the footer, newsletter band, DirectContactCTA, map section, and project card layers exactly
