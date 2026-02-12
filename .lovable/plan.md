
## Fix Build Error + Incomplete Tasks

### Critical: Build Error (520MB exceeds 512MB limit)

The project bundle is 520MB, exceeding the 512MB build limit. This is caused by unused video files in `src/assets/videos/` and `src/assets/`. Removing them will bring the build under the limit.

**Unused video files to delete:**
- `src/assets/dubai-hero-video.mp4` (no imports found)
- `src/assets/videos/why-dubai-burj-al-arab.mp4` (no imports found)
- `src/assets/videos/why-dubai-dubai-frame.mp4` (no imports found)
- `src/assets/videos/jbj-company-intro.mp4` (no imports found)

This should free ~30-50MB and bring the build under 512MB.

---

### Incomplete Tasks Identified

#### 1. Vertical Sidebar Navigation Not Showing on Properties Page
The `PropertiesVerticalNav` component exists and is imported, but it only renders inside map mode when the filter bar is fixed (`isFilterFixed`). It should be visible in both list and map modes whenever the user scrolls past the filter sentinel. 

**Fix**: Show the vertical nav alongside the standard grid view too (not just map mode), when the filter bar becomes fixed.

#### 2. Map Button Behavior (Split-Screen Toggle)
The map toggle exists in `FilterShortcutBar` and switches `isMapMode`. The split-screen code at line 1153 in Properties.tsx already implements the correct behavior (cards left, map right). The issue is that with zero projects loading, it showed nothing. The `useProjectsListing()` fix from the previous plan should resolve this. The button label should toggle between "Map" and "List" -- need to verify this is wired in `FilterShortcutBar`.

#### 3. Developer AI Analyzer -- More Informative Overview with Charts
The current Developer Overview section is a plain text card. Make it more premium and informative:
- Add a "Key Highlights" row with icon badges (Founded, HQ, Units, Active Projects) inside the overview card
- Add a small portfolio distribution donut chart showing project type breakdown (parsed from AI text)
- Improve the overview card with a gradient header bar and developer logo

**File**: `src/components/developer/DeveloperAIAnalyzer.tsx`

#### 4. Header Color and Size Issues
Need to check what specific header the user refers to. The `FilterShortcutBar` header and Properties filter section use champagne gold gradients. Without more specific direction on what color/size changes are needed, I will ensure:
- The fixed filter bar uses the correct champagne gradient background
- Proper sizing of filter elements

#### 5. Shortcut Buttons Placement
The `FilterShortcutBar` renders inside the filter section. Need to verify the Row 1 (Map, Saved, Currency, Mode) and Row 2 (Price, Payments, etc.) layout matches the specification from the memory context.

---

### Technical Changes

| File | Change |
|------|--------|
| `src/assets/dubai-hero-video.mp4` | DELETE (unused, frees bundle space) |
| `src/assets/videos/why-dubai-burj-al-arab.mp4` | DELETE (unused) |
| `src/assets/videos/why-dubai-dubai-frame.mp4` | DELETE (unused) |
| `src/assets/videos/jbj-company-intro.mp4` | DELETE (unused) |
| `src/pages/Properties.tsx` | Show `PropertiesVerticalNav` in list mode too (when filter is fixed), not just map mode |
| `src/components/developer/DeveloperAIAnalyzer.tsx` | Enhance Developer Overview card with gradient header, icon highlights row, and a portfolio distribution mini-chart |
| `src/components/filters/FilterShortcutBar.tsx` | Verify Map/List label toggle works correctly |

### Result
- Build succeeds (under 512MB limit)
- Vertical sidebar shows when scrolling on Properties page
- Map split-screen works with loaded projects
- Developer AI analyzer has a more premium, chart-enhanced overview section
