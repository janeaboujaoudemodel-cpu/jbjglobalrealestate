

## Fix AI Analyzer, Filter Styling, and Add Reelly Corner Utility Buttons

### Issue 1: AI Developer Intelligence Not Analyzing

The network logs confirm the `ai-property-analyzer` edge function IS returning a successful 200 response with full analysis data for Binghatti. The issue is likely a UI rendering race condition -- the component auto-triggers on scroll visibility via `IntersectionObserver`, but if the user navigated away and back, the `hasTriggered` ref may already be set to `true`, preventing re-analysis. Additionally, the section parsing uses "Area Overview" as a key name (inherited from the area analyzer template), which may cause empty section extraction when the response uses slightly different formatting.

**Fix in `src/components/developer/DeveloperAIAnalyzer.tsx`:**
- Reset `hasTriggered.current = false` when `developerName` changes (add to dependency)
- Add a manual "Analyze" button fallback so users can always trigger it
- Make section extraction more resilient by adding fallback keys (e.g., "Overview" in addition to "Area Overview")

### Issue 2: Handover Year Selects Cropped

The year `select` elements in the Handover popover are too narrow (`flex-1` inside a tight container). The popover width of `w-72` with two columns creates very small selects.

**Fix in `src/components/filters/FilterShortcutBar.tsx`:**
- Widen the Handover popover from `w-72` to `w-80`
- Add `min-w-[60px]` to year selects so they are never cropped
- Increase padding on selects for better readability

### Issue 3: Active Pill Color -- Change from Black to Champagne Gold

Currently, active/selected pill buttons turn solid black with white text. The user wants a premium champagne gold active state instead.

**Fix in `src/components/filters/FilterShortcutBar.tsx`:**
- Change `pillActive` (light variant) from `bg-black text-white border-black` to a champagne gold gradient: `bg-gradient-to-r from-[#C8A766] to-[#B8944A] text-white border-[#C8A766]`
- Change `togglePillOn` from `border-black bg-black text-white` to `border-[#C8A766] bg-gradient-to-r from-[#C8A766] to-[#B8944A] text-white`
- Change the `CountBadge` from `bg-gold text-black` to a deeper champagne: `bg-gradient-to-r from-[#D4C4A8] to-[#C8A766] text-white` for a premium look

### Issue 4: Add Reelly-Style Corner Utility Buttons

The Reelly reference images show a row of small utility buttons in the top-right corner of the search area: Map, Saved, AED (currency), sqft (area unit), Client Mode, and Settings. These need to appear across ALL search bars.

**Add to `FilterShortcutBar.tsx`:**
- Add a right-aligned group of small utility icons/buttons after the filter pills:
  - **Map** icon button (toggles map view -- links to `/properties?view=map`)
  - **Saved** (heart icon -- links to saved filters from localStorage)
  - **AED** (currency selector -- compact dropdown)
  - **sqft** (area unit toggle -- sqft/sqm)
  - **Client Mode** (user icon -- toggle investor/broker mode)
  - **Settings** (gear icon -- opens filter preferences)
- These render as a compact, right-aligned cluster separated from the main pills by a vertical divider
- Styled consistently: light variant uses champagne pills, dark variant uses glass pills

Since `FilterShortcutBar` is already used across all pages (Homepage, Properties, Developer, Area), adding these utility buttons there will automatically propagate everywhere.

### Files Summary

| File | Action |
|------|--------|
| `src/components/developer/DeveloperAIAnalyzer.tsx` | Fix re-trigger logic when developer changes; add manual analyze button; improve section parsing |
| `src/components/filters/FilterShortcutBar.tsx` | Fix handover select width; change active colors to champagne gold; add Reelly-style corner utility buttons (Map, Saved, AED, sqft, Client Mode, Settings) |

