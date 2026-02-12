

## Three Fixes for Premium Project Detail Experience

### 1. Replace Gold Spinner with JBJ Logo Fill Animation

**Problem:** When navigating to a project page (e.g., from the map), the loading state shows plain skeleton placeholders. The user wants a branded loading experience with the JBJ logo that "fills up" while waiting.

**Solution:** Create a new `BrandedLoader` component that displays the JBJ monogram logo with a vertical fill animation (the logo starts empty/faded and fills with gold color from bottom to top). Use this in `ProjectDetail.tsx` as the loading state.

**File changes:**
- **New file: `src/components/ui/BrandedLoader.tsx`** -- A reusable loader that shows the JBJ monogram (`jbj-monogram-light-bg.png`) with a CSS clip-path or mask animation that fills the logo from bottom to top, creating a "pouring" effect. Includes a subtle shimmer and "Loading..." text below.
- **`src/pages/ProjectDetail.tsx`** -- Replace the current Skeleton-based loading state (lines 226-236) with the new `BrandedLoader` component.

---

### 2. Auto-Analyze Projects (Remove "Click to Analyze" Button)

**Problem:** The `ProjectAIAnalyzer` currently shows a "Click below to generate an AI-powered investment analysis" prompt with an "Analyze" button (lines 158-166). The user wants analysis to start automatically when the section scrolls into view.

**Solution:** Re-enable the auto-trigger logic using the existing `IntersectionObserver` that is already set up (lines 100-108). The component already has `isVisible`, `hasTriggered`, and the observer -- it just needs the `useEffect` that connects them (which is currently commented out at line 110).

**File changes:**
- **`src/components/project-detail/ProjectAIAnalyzer.tsx`** -- Replace line 110 (`// Manual trigger only - no auto-analyze on scroll`) with a `useEffect` that calls `handleAnalyze()` when `isVisible` becomes true and analysis hasn't been triggered yet. Remove the manual "Click to Analyze" button UI (lines 158-166) and replace with the loading spinner state, so the user sees the analysis generating immediately upon scroll.

---

### 3. Fix Black Section Divider to Match Champagne Background

**Problem:** The `SectionDivider` between the AI Analyzer and the DLD Market Widget uses the default `variant="default"` which renders with `bg-black` background. This creates a jarring black band between two champagne-themed sections.

**Solution:** Switch to `variant="champagne"` so the divider uses a champagne gradient background that matches the surrounding sections, keeping only the elegant gold line and sparkle icon.

**File changes:**
- **`src/components/project-detail/ProjectDetailLayout.tsx`** -- Change line 1001 from `<SectionDivider />` to `<SectionDivider variant="champagne" />`.

---

### Summary of All File Changes

| File | Change |
|------|--------|
| `src/components/ui/BrandedLoader.tsx` | New component: JBJ logo with fill animation |
| `src/pages/ProjectDetail.tsx` | Use `BrandedLoader` instead of Skeletons for loading |
| `src/components/project-detail/ProjectAIAnalyzer.tsx` | Auto-trigger analysis on scroll, remove manual button |
| `src/components/project-detail/ProjectDetailLayout.tsx` | Change `SectionDivider` to `variant="champagne"` |

