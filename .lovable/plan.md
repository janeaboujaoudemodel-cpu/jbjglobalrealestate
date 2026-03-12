

## Plan: Premium Suite Headers, Corporate Suite Alignment, Compare Scoring, and Video Suite UI Overhaul

### Scope

This plan addresses the 4 main areas the user raised, scoped to what can be implemented in code changes.

---

### 1. Corporate Document Suite — Alignment & Premium Polish

**File: `src/pages/toolkit/CorporateSuite.tsx`**

- Rename to "Corporate Premium Suite" in header
- Fix card alignment: ensure all cards have equal height using `h-full flex flex-col` with description taking `flex-1`
- Fix CTA "Open Tool" alignment: pin to bottom of card with `mt-auto`
- Replace the old yellow-gold sparkle badge color with proper champagne-gold (`#B8943E` / `#C9A84C` tones)
- Fix divider color consistency: top border gradients should harmonize with the champagne palette
- Ensure all 12 tools are visible and properly listed

---

### 2. Property Intelligence Suite — Premium Color-Coded Tab Headers

**File: `src/pages/toolkit/PropertySuite.tsx`**

- Fix the gray/black header: replace with champagne-gold premium header matching the existing VideoSuite/CorporateSuite style
- Add distinct color per tab tool:
  - Home Finder → Purple accent
  - Evaluator → Blue accent  
  - Compare → Red/Rose accent
  - Rental Index → Green accent
  - Mortgage → Amber/Gold accent
- Each tab trigger gets its own color when active (not all gold)
- Add color-coded icon backgrounds in the tab bar

---

### 3. Compare Tool — Scoring System & Download Enhancements

**File: `src/pages/Compare.tsx`**

- Add numeric scoring (out of 10) alongside stars for: Location, Construction Quality, Amenities, Developer Quality, Payment Plan, Handover, Investment Potential
- Make project cards symmetrical (equal width/height in the comparison table header)
- Add "Save Results" button that stores comparison to database
- Enhance download report: before downloading, show a modal asking if user wants to merge favorites/shortlist into the report
- Show indicator per project: "In My Favorites ♥" or "Not in Favorites"

---

### 4. Creative Video Suite — Premium Header & UI Fix

**File: `src/pages/toolkit/VideoSuite.tsx`**

- Center the suite header content
- Add more tabs: Sound/Audio, Filters, Overlays, AI Agent, Project Integration (already exist as panels inside AIVideoStudio but not as suite-level tabs)

**File: `src/components/ai-video-studio/AIVideoStudio.tsx` and sub-components**

- Fix broken buttons (play, card, plan, sound +/- controls) — audit all button `onClick` handlers
- Fix export preset icons: replace cheap emoji/text icons for TikTok/YouTube/Instagram with proper SVG icons
- Fix color scheme: replace brown/orange/yellow buttons with champagne-gold palette
- Fix the settings/save/new/export quality/size/frame/captions sections with proper dividers
- Ensure preview updates immediately on any control change
- Add sound extraction feature (upload video → extract audio only)
- Fix chat support icon overlap with download/ZIP arrow

---

### Files Changed Summary

| File | Changes |
|------|---------|
| `src/pages/toolkit/CorporateSuite.tsx` | Rename, fix card alignment, fix CTA pinning, fix colors |
| `src/pages/toolkit/PropertySuite.tsx` | Color-coded tabs, premium header fix |
| `src/pages/Compare.tsx` | Add 10-point scoring, symmetric cards, save/merge-download modal |
| `src/pages/toolkit/VideoSuite.tsx` | Center header, add tabs |
| `src/components/ai-video-studio/AIVideoStudio.tsx` | Fix broken buttons, colors, export icons, dividers |
| Multiple AI Video Studio sub-components | Button/color/icon fixes |

