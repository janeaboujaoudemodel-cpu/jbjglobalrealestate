

# Stamp Generator: Arabic Arc, Centering, Click Highlight, Navigation & Monogram Fix

## Issues Identified

### 1. Arabic Arc Still Too Small
The `arabicArcSpread` default is `ARC_SPREAD_LIMIT` (0.88) but the wizard passes `arabic_arc_spread: 50` (slider default), which `LiveStampPreview` converts to `0.40 + (50-20)/60 * 0.55 = 0.675`. This is significantly less than the English spread of 0.88. The slider mapping formula compresses Arabic to 67% while English gets 88%.

**Fix**: Change the default `arabic_arc_spread` from 50 to 80 (maps to 0.95), and widen the slider range so the midpoint equals English spread. Also ensure that when `arabicArcSpread` is undefined in the template, both languages use the same `ARC_SPREAD_LIMIT`.

### 2. Location Text Not Centered Between Rings
In `generateRoundStamp`, the location text arc uses spread `0.70` (hardcoded at line 354-355), while company text uses `0.88`. Location text is pushed too close to the outer ring because the radius calculation doesn't center it properly between middle and inner rings.

**Fix**: Increase location arc spread from 0.70 to match company text spread (0.88). Ensure `clampedLocTextR` is truly the midpoint of middle-to-inner gap with equal clearance.

### 3. Company Name Not Aligned with Separator Center
The separators render at `clampedTextArcR` (the text arc radius) which is `(outerR + middleR) / 2`. The company name arc also uses this radius, so they should align. But the arc path geometry places text above/below the centerline differently depending on font metrics. 

**Fix**: Ensure both top arc, bottom arc, and separators all use exactly the same radius value. Add `dominant-baseline="central"` consistency to separator glyphs.

### 4. Click-to-Edit Shows Hand But No Highlight
The `LiveStampPreview` has `onElementClick` which switches tabs but doesn't visually highlight the clicked SVG element. The `StampInteractivePreview` component (used in the Studio page) already has full highlight + toolbar functionality, but the Wizard page doesn't use it.

**Fix**: Add a `selectedElement` state to `StampProjectWizard`. On element click, store the element ID and inject a highlight ring/glow around the matching `data-stamp-element` node via a CSS class or SVG overlay. Double-click opens inline edit.

### 5. Navigation: Desktop Frame Must Show at 1178px
At 1178px the breakpoint is `xl` (1280px), so the sidebar and utility bar are hidden and `GlobalHeader` is shown. User explicitly wants the desktop L-shaped frame on stamp pages regardless of width.

**Fix**: For stamp generator routes (`/toolkit/stamp-generator/*`), force the sidebar + utility bar visible by lowering the breakpoint back to `lg` (1024px) specifically for these routes. Use a route-aware class or conditional rendering in `MainLayout.tsx`.

### 6. Monogram Color Locked Brand Rule
Center monogram "JBJ": both J letters must match ink color, B letter + divider lines in gold (#B8860B). This should be the default and cannot be overridden.

**Fix**: In `renderCenterContent` when mode is `monogram`, detect the monogram text and apply per-letter coloring: letters at index 0 and 2 get ink color, letter at index 1 gets gold, divider gets gold.

---

## Implementation Plan

### File 1: `src/lib/stampOfficialTemplate.ts`
- **Arabic arc spread**: When `arabicArcSpread` is not provided, default to `ARC_SPREAD_LIMIT` (0.88) — same as English. Remove the separate tracking.
- **Location text spread**: Change hardcoded `0.70` to `ARC_SPREAD_LIMIT` for both EN and AR location arcs in BILINGUAL mode.
- **Location radius centering**: Recalculate `clampedLocTextR` as true midpoint: `(middleR + innerR) / 2` with `SAFE_ZONE` clamping on both sides.
- **Monogram brand rule**: In `renderCenterContent` for `monogram` mode, render each letter as a separate `<tspan>` with per-letter fill. Index 0,2 = ink color, index 1 = `#B8860B` (gold). Add gold divider line below monogram.

### File 2: `src/components/stamp-generator/LiveStampPreview.tsx`
- **Slider mapping fix**: Change the `arabicArcSpread` conversion formula so default 80 maps to 0.88 (matching English). Range 20-100 → 0.40-0.95.
- **Element highlight**: Add `selectedElement` state. After click, find the matching `[data-stamp-element]` DOM node and add a highlight effect (outline glow via inline style injection). Clear on next click outside.

### File 3: `src/components/stamp-generator/StampProjectWizard.tsx`
- **Default `arabic_arc_spread`**: Change from 50 to 80 (so it maps to ~0.88, matching English).
- **`handleElementClick` enhancement**: Store `selectedElement` in state. Apply visual highlight class to the SVG element. On double-click, open inline text edit.
- **Slider range**: Widen arc spread slider from `20-80` to `20-100` so user can go beyond English default.

### File 4: `src/components/MainLayout.tsx`
- **Route-aware breakpoint**: For `isToolkitGeneratorRoute`, render sidebar and utility bar at `lg` breakpoint (1024px) instead of `xl` (1280px). Keep `xl` for all other routes.
- Implementation: Add a second conditional block that renders sidebar/utility at `lg:block` specifically when on stamp routes, while keeping the existing `xl:block` for general routes.

---

## Validation Criteria
1. Arabic company name arc stretches edge-to-edge matching English arc width
2. Arabic and English location text centered between middle and inner rings
3. Company name text centered on the same horizontal line as separator dots
4. Clicking any element in the wizard preview highlights it with a gold glow
5. Sidebar + utility bar visible at 1178px on stamp generator pages
6. Monogram "JBJ": J letters in ink color, B + divider in gold — locked, not user-overridable

