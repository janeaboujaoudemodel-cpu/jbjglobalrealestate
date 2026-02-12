

## Multiple Fixes: Divider, Edge-to-Edge Layout, Filter Rearrangement, DLD Widget, AI Analyzer Performance, and Gold Names

### 1. Add SectionDivider between "Explore All Projects" and DLD Market Widget (Developer Page)

**File: `src/pages/DeveloperDetail.tsx`**
- Import `SectionDivider` from `@/components/ui/section-divider`
- Insert `<SectionDivider fullWidth />` between the end of the projects grid section (after the "Explore All X Projects" button, line ~455) and the `<DLDMarketWidget />` (line ~458)

### 2. Add DLDMarketWidget to Project Detail Page

**File: `src/components/project-detail/ProjectDetailLayout.tsx`**
- Import `DLDMarketWidget` from `@/components/shared/DLDMarketWidget`
- Add `<SectionDivider />` and `<DLDMarketWidget />` after the AI Analyzer section (after line ~995) and before the Brochure section
- Also add a `<SectionDivider />` between "Explore All Projects" button and DLD widget for visual separation

### 3. Edge-to-Edge Layout for Sections Above "Ready to Get Started"

On the Developer page, Area page, and Project page, all content sections above the "Ready to Get Started" CTA should be full-width (edge-to-edge), removing the black gap on the sides so the header color connects seamlessly with section backgrounds.

**Files affected:**
- `src/pages/DeveloperDetail.tsx`: The content wrapper `jj-layer-2` (line 212) currently adds responsive margins. Change sections above "Ready to Get Started" to use full-width containers. The sticky fixed filter bar already uses `mx-1 sm:mx-2` margins -- make the content sections match so the background fills edge-to-edge.
- `src/components/project-detail/ProjectDetailLayout.tsx`: The main content section (line 636) uses `jj-section-champagne` with `container mx-auto px-4`. Change to full-width with inner padding, so the champagne background spans edge-to-edge with no black lines on the sides. Keep the internal content container for readability.
- Area pages: Similar adjustment to ensure consistent edge-to-edge rendering.

### 4. Rearrange FilterShortcutBar Rows

**File: `src/components/filters/FilterShortcutBar.tsx`**

Current layout:
- Row 1 Left: Map, Saved, Currency, Mode | Right: Newest, Low-High, High-Low, A-Z, Hide Sold, Save
- Row 2: Price, Payments, Handover, Property Type, Bedrooms, Status, Construction, Reset All

New layout requested:
- Row 1 Left: Map, Saved, Currency, Mode (keep) | Right: Sort pills (Newest etc.) -- move Map before Newest in the sort row
- Row 2: Price, Payments, Handover, Property Type, Bedrooms, Status, Construction, **Save**, **Hide Sold**, Reset All
- Move "Hide Sold" and "Save" from Row 1 to the end of Row 2 (after Construction, before Reset All)
- Move "Map" to Row 1 right side, before "Newest"
- Row 1 left keeps: Investor/Broker mode toggle, Saved filters, Currency

### 5. Register Interest Button -- Premium Gold Champagne

**File: `src/components/project-detail/ProjectDetailLayout.tsx`** (line ~621-628)
- Change the "Register Interest" button from the flat gold gradient to a premium champagne-gold style matching the brand: `bg-gradient-to-r from-[#F5EBD7] via-[#EDE0C8] to-[#D4C4A8] text-black border-2 border-gold/50` with a subtle glow, replacing the current `from-gold to-gold-dark`

### 6. AI Analyzer -- Gold Project/Developer Names with Clickable Links

**File: `src/components/project-detail/ProjectAIAnalyzer.tsx`** (line 139-142)
- Change the project name from `text-black` to `text-gold font-semibold` 
- Change the developer name from `text-black` to a clickable gold `<Link>` pointing to `/developer/{slug}` with hover underline
- Add `developerSlug` prop to the component interface
- Update the component usage in `ProjectDetailLayout.tsx` to pass `developerSlug={project.developer?.slug}`

### 7. AI Analyzer Performance -- Lazy Load and Reduce Blocking

The AI Analyzer auto-triggers when scrolled into view via IntersectionObserver, which is correct. However, the 30-second timeout and the edge function call can feel slow. Improvements:

**File: `src/components/project-detail/ProjectAIAnalyzer.tsx`**
- Reduce initial timeout from 30s to 15s for faster user feedback
- Add a manual "Analyze" button as the default state instead of auto-triggering, so the page loads instantly and users opt-in to the AI analysis (eliminating perceived slowness)
- The auto-trigger approach is causing the "slow page" perception because it fires network requests as users scroll

**File: `src/components/project-detail/ProjectDetailLayout.tsx`**
- Wrap the AI Analyzer in `React.lazy` / `Suspense` to code-split it from the main bundle, reducing initial page load weight

### 8. Page Navigation Speed

The perceived slowness when clicking between pages (e.g., logo to homepage) is likely caused by the large number of components being rendered on each page. 

**File: `src/components/project-detail/ProjectDetailLayout.tsx`**
- Lazy-load heavy sections: `MortgageCalculator`, `ProjectAIAnalyzer`, `PaymentPlanVisualization`, `ProjectLocationMap`, `ImageCarousel` using `React.lazy` with `Suspense` fallbacks
- This reduces the JS parsed on initial route change, making navigation feel snappier

### Summary of Files to Change

| File | Changes |
|------|---------|
| `src/pages/DeveloperDetail.tsx` | Add SectionDivider before DLDMarketWidget; edge-to-edge layout above "Ready to Get Started" |
| `src/components/project-detail/ProjectDetailLayout.tsx` | Add DLDMarketWidget + SectionDivider; edge-to-edge layout; premium Register Interest button; lazy-load heavy components; pass developerSlug to AI Analyzer |
| `src/components/filters/FilterShortcutBar.tsx` | Move Save + Hide Sold to Row 2 after Construction; rearrange Row 1 utility buttons |
| `src/components/project-detail/ProjectAIAnalyzer.tsx` | Gold + clickable project/developer names; add developerSlug prop; change to manual trigger with "Analyze" button; reduce timeout to 15s |
| `src/pages/AreaDetail.tsx` | Edge-to-edge layout consistency |
