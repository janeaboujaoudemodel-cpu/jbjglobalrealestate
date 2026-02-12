

## Global Edge Alignment Plan

### Goal
Align all major page sections (CTA band, Newsletter band, Footer, Map, and the fixed filter bar) to match the same left/right edge margins as the `jj-layer-2` content wrapper used on the Developer Detail page.

### Reference Standard
The `jj-layer-2` CSS class defines the correct edge spacing:
- Mobile: `mx-1` (4px)
- sm: `mx-2` (8px)  
- md: `mx-3` (12px)
- lg: `mx-4` (16px)

All sections below will adopt this same margin pattern.

### Changes Required

**1. DirectContactCTA (`src/components/DirectContactCTA.tsx`)**
- Current inner div: `mx-4 sm:mx-6 md:mx-4 lg:mx-6`
- Change to: `mx-1 sm:mx-2 md:mx-3 lg:mx-4`

**2. NewsletterBand (`src/components/NewsletterBand.tsx`)**
- Current inner div: `mx-0.5 md:mx-2 lg:mx-4 xl:mx-6 2xl:mx-8`
- Change to: `mx-1 sm:mx-2 md:mx-3 lg:mx-4`

**3. Footer (`src/components/Footer.tsx`)**
- Current content wrapper: `px-3 sm:px-4 md:px-6 lg:px-8`
- Change to: `px-1 sm:px-2 md:px-3 lg:px-4` to match the `jj-layer-2` margins

**4. Fixed Filter Portal (DeveloperDetail.tsx)**
- Current: `container mx-auto px-4` wrapper
- Change to: `mx-1 sm:mx-2 md:mx-3 lg:mx-4` (removing the `container` class) so the fixed bar matches the inline filter width exactly

**5. AreaMapSection (`src/components/area-detail/AreaMapSection.tsx`)**
- Current: `container mx-auto px-4`
- Change to: `mx-1 sm:mx-2 md:mx-3 lg:mx-4` to match global edge alignment

### Technical Details

- The `jj-layer-2` class in `src/index.css` is the single source of truth for edge margins
- Only the margin/padding values on the outermost wrappers are changed; no inner content, styling, or functionality is touched
- The fixed filter portal will drop the `container` constraint so it spans the same width as the inline card layer beneath it

