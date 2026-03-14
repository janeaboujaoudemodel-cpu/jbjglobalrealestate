

# Stamp Generator — Deep Bug Audit & Fix Plan

## Root Cause Analysis

### Bug 1: "Generate Concepts" Not Clickable / Not Working
The button calls `handleCreate()` which requires `user?.id` — if the user is not signed in, it shows "Please sign in first" and exits. The button is also disabled when `company_name` is empty. This is working as designed but the error feedback is poor and the auth requirement is blocking.

### Bug 2: Arabic Arc Too Small (English Stretches Full, Arabic Doesn't)
In `stampOfficialTemplate.ts` line 313-317, Arabic/English text positions are hardcoded — `topText = config.companyNameAr`, `bottomText = config.companyNameEn`. The `safeArcFontSize` function uses `charW = 0.50` for Arabic vs `0.54` for English, making Arabic compute a smaller spread. More critically, the `arabic_arc_spread` form field (user slider) is **never passed** to `generateOfficialStampSVG` — it's completely ignored.

### Bug 3: Style Controls Don't Affect Preview (Shape, Border, Theme, Typography, Spacing)
`previewProps` (line 382-392) does NOT pass these form fields to `LiveStampPreview`:
- `arabic_arc_spread`, `arabic_letter_spacing`, `arabic_font`, `arabic_font_weight`
- `arc_text_spacing`, `circle_gap`, `separator_distance`, `center_content_size`
- `government_mode`

Even if they were passed, `generateOfficialStampSVG` has no parameters for most of them. The template function ignores stamp shape for bilingual (always round), ignores style theme, and partially ignores border style.

### Bug 4: Ink Color Not Reflecting in Preview
`generateOfficialStampSVG` uses hardcoded color tokens (`#1a2744`, `#2a3a5c`, `#8b6914`) which are designed to be replaced by `StampSVGRenderer`. But `LiveStampPreview` renders SVG via `dangerouslySetInnerHTML` — it never passes through `StampSVGRenderer`. So the `inkColor` prop is received but the template's hardcoded tokens are never replaced with the user's chosen color.

### Bug 5: "Government Style Mode" Visible in UI
User explicitly said this label must never appear. It exists at line 748-760 of `StampProjectWizard.tsx`. The preset library also references it. Must be removed from UI but kept as internal data.

### Bug 6: Click-to-Edit on Preview Not Working
The preview renders raw SVG with `dangerouslySetInnerHTML`. There are no click handlers on SVG elements. The `data-stamp-element` attributes exist but nothing listens for clicks.

---

## Implementation Plan

### Phase 1: Wire All Form Controls to Preview (Critical)
**File: `src/components/stamp-generator/LiveStampPreview.tsx`**
- Add props for: `arabicArcSpread`, `arabicLetterSpacing`, `arabicFont`, `arabicFontWeight`, `arcTextSpacing`, `circleGap`, `separatorDistance`, `centerContentSize`
- Pass these through to `generateOfficialStampSVG`

**File: `src/lib/stampOfficialTemplate.ts`**
- Add corresponding fields to `OfficialStampConfig`: `arabicArcSpread`, `arabicLetterSpacing`, `arabicFont`, `arabicFontWeight`, `arcTextSpacing`, `circleGap`, `centerContentSize`
- Use `arabicArcSpread` to override `ARC_SPREAD_LIMIT` for Arabic text (scale 20-80% slider → 0.4-0.95 spread)
- Use `arabicLetterSpacing` to override computed letter spacing for Arabic arcs
- Use `arabicFont` to override `ARABIC_FONT` constant
- Use `circleGap` to adjust ring spacing proportionally
- Use `centerContentSize` to scale center content

**File: `src/components/stamp-generator/StampProjectWizard.tsx`**
- Update `previewProps` (line 382-392) to include all new props

### Phase 2: Fix Arabic Arc to Match English Full Width
**File: `src/lib/stampOfficialTemplate.ts`**
- Change Arabic `charW` from 0.50 to match English treatment
- Default `arabicArcSpread` to 0.88 (same as English `ARC_SPREAD_LIMIT`) so both arcs fill the full semicircle by default
- Ensure `safeArcFontSize` treats Arabic with the same spread limit as English unless overridden

### Phase 3: Fix Ink Color Actually Applying
**File: `src/lib/stampOfficialTemplate.ts`**
- Replace hardcoded `C_PRI`/`C_SEC`/`C_ACC` usage with the actual `config.inkColor` value
- Derive secondary and accent from the primary ink color (lighter/darker variants) or use the ink color directly
- This eliminates the need for `StampSVGRenderer` tinting in the live preview path

### Phase 4: Remove "Government Style Mode" from UI
**File: `src/components/stamp-generator/StampProjectWizard.tsx`**
- Remove the entire "Government Style Mode" section (lines 748-760) — the toggle, label, icon, and description
- Keep `government_mode` in `FormState` and `layout_json` for internal data persistence
- Rename any preset that says "Government" to "Premium Official" in `StampPresetLibrary.tsx`

### Phase 5: Fix "Generate Concepts" Button
**File: `src/components/stamp-generator/StampProjectWizard.tsx`**
- Allow generation without sign-in by saving to localStorage/sessionStorage and navigating to a preview page
- Or: show a clear auth prompt modal instead of a toast that gets missed
- Ensure the button is never silently disabled — show tooltip explaining why if disabled

### Phase 6: Replace Quick Start Presets with Smart Auto-Fill
**File: `src/components/stamp-generator/StampProjectWizard.tsx`**
- Remove `StampPresetLibrary` from the Company tab (lines 448-476)
- Move the "Smart Auto-Fill from Trade License" section to the top of the Company tab as the primary entry point
- Keep preset functionality in the Style tab instead, as style presets

### Phase 7: Add Color Palette & Branding Section
**File: `src/components/stamp-generator/StampProjectWizard.tsx`**
- Add a "Color Palette" section to the Style tab with:
  - Quick-pick swatches: White, Black, Navy (#1B3A8C), Brand Gold, Red, Green
  - Full color picker (already exists but needs visual swatches)
  - Reset to standard button (already exists)

### Phase 8: Click-to-Edit Preview Elements
**File: `src/components/stamp-generator/LiveStampPreview.tsx`**
- Instead of `dangerouslySetInnerHTML`, parse `data-stamp-element` attributes after render
- Add click handlers via `useEffect` + ref that detect which element was clicked
- On click, scroll the left panel to the relevant control and highlight it
- Elements: `top-arc` → Arabic name input, `bottom-arc` → English name input, `center` → Logo tab, `separator-*` → separator picker, `registration` → registration field

### Phase 9: Make Style Selections Reflect in Preview
Ensure these already-wired but non-functional controls actually change the output:
- **Shape** (Oval/Rectangle/Square): Currently bilingual always forces round. Add oval/rect rendering to the official template OR show a warning that bilingual only supports round
- **Border** (Single/Double/Ring/Dotted/Rope/Custom): Already partially wired but needs the template to respect all variants
- **Typography**: Pass `fontFamily` override from the selected typography to the template

---

## Validation After Implementation
1. Change ink color → preview updates immediately in the chosen color
2. Arabic arc text spans full width matching English arc
3. All sliders (letter spacing, arc spread, ring gap, etc.) visually update preview
4. No "Government" text visible anywhere in UI
5. Generate Concepts works (with auth) or shows clear guidance
6. Clicking on arc text in preview highlights the corresponding input field
7. Color palette swatches visible in Style tab
8. Shape/border/typography selections visually change the stamp preview

