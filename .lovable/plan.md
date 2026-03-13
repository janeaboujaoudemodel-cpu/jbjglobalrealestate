

# Logo Creator Major Upgrade Plan

## Issues Identified

After reviewing `LogoCreator.tsx` (587 lines), `logoCreatorTypes.tsx`, and the `ai-logo-generator` edge function, here are the problems and requested features:

### Bugs to Fix
1. **SVG download opens in browser** — `downloadSVG()` creates an `<a>` tag but doesn't append it to the DOM before clicking, which fails in some browsers
2. **Black bg download has white borders** — `svgToPng()` only sets background style but doesn't fill the full canvas properly when the SVG has transparent areas
3. **Color changes regenerate the logo** — the `useEffect` on line 94-103 auto-calls `generate()` when `colorPreset` changes, which calls the AI again instead of just recoloring
4. **Business card & letterhead mockups** — hardcoded single color, don't reflect selected palette, no layout options

### New Features Requested
5. **Full export kit** — social media sizes (Instagram 1080×1080, Facebook 820×312 cover, 180×180 profile), favicon ICO, PDF, PNG, JPG format options, multiple backgrounds (black, white, transparent, custom colors)
6. **Logo type selector** — wordmark only, monogram only, icon only, full logo (icon + text)
7. **AI refinement prompt** — text input to tell AI what to fix/change on the current logo
8. **Auto-contrast on dark bg** — when black bg is selected, invert logo text/fill colors so nothing disappears
9. **Advanced color picker** — HEX, RGB, HSL inputs (not just the basic color wheel)
10. **Website/Instagram URL color extraction** — paste a URL, AI extracts brand colors
11. **Letterhead mockup section** — add as a dedicated studio section with layout/color options
12. **Business card mockup customization** — selectable card layouts/styles reflecting chosen colors

---

## Implementation Plan

### Phase 1: Bug Fixes (Critical)

**File: `src/components/corporate-suite/logoCreatorTypes.tsx`**
- Fix `svgToPng()` — ensure canvas fills background color across entire area before drawing SVG
- Add `svgToJpg()` helper for JPG export

**File: `src/components/corporate-suite/LogoCreator.tsx`**
- Fix `downloadSVG()` — append anchor to DOM body before click, then remove
- Fix `downloadPNG()` — same anchor fix
- **Remove auto-regenerate on color change** — remove `colorPreset` from the useEffect dependency array on line 103. Color changes should only update the preview colors, not call the AI again
- Add a visible "Regenerate" button in the brand panel (currently buried in export panel)

### Phase 2: Color System Upgrade

**File: `src/components/corporate-suite/LogoColorPicker.tsx` (new)**
- Full color picker component with HEX input, RGB sliders (R/G/B 0-255), HSL sliders (H 0-360, S 0-100, L 0-100)
- Preset grid (existing presets)
- Website URL input field — calls edge function to extract palette
- Auto-contrast toggle: when bg is dark, suggest inverted color scheme

**File: `supabase/functions/ai-logo-generator/index.ts`**
- Add a `mode` parameter: `"generate"` (full new logo) vs `"refine"` (modify existing SVG based on prompt)
- Add `logoType` parameter: `"full"`, `"wordmark"`, `"monogram"`, `"icon"`
- For refine mode: include the current SVG in the prompt and the user's refinement instruction
- For color-only changes: add a `"recolor"` mode that takes existing SVG and swaps colors via string replacement (no AI call needed)

### Phase 3: Logo Type & AI Refinement

**File: `src/components/corporate-suite/LogoCreator.tsx`**
- Add `logoType` state: `"full" | "wordmark" | "monogram" | "icon"`
- Add logo type selector buttons in the Brand panel (4 options with icons)
- Add "Refine Prompt" textarea — user types what to change, sends current SVG + instruction to edge function in `"refine"` mode
- Color changes use client-side SVG color replacement (regex swap of hex values) instead of regenerating

### Phase 4: Enhanced Export Kit

**File: `src/components/corporate-suite/LogoCreator.tsx` — export panel rewrite**
- Organized export sections:
  - **Format**: SVG, PNG, JPG, PDF (checkboxes)
  - **Sizes**: Favicon (32×32, 16×16), Small (64), Medium (128, 256), Large (512, 1024), Instagram (1080×1080), Facebook Profile (180×180), Facebook Cover (820×312), LinkedIn Banner (1584×396)
  - **Backgrounds**: White, Black, Transparent, Brand Color, Custom color picker
  - **Download options**: Individual file or Full Kit ZIP
- Fix all download functions to properly trigger file saves (append `<a>` to DOM)

### Phase 5: Mockup Upgrades

**File: `src/components/corporate-suite/LogoCreator.tsx` — mockup sections**
- **Business Card Mockup**: 3-4 layout options (horizontal, vertical, centered, minimal), reflects all selected colors (primary bg, secondary text, accent dividers), selectable via thumbnails
- **Letterhead Mockup**: Add as a new studio section with:
  - 3 layout options (logo-left, logo-center, logo-right)
  - Color customization (header bar color, divider color, text color)
  - Shows logo, company name, placeholder address/contact
  - Download letterhead as PDF template

### Files Summary

| Action | File |
|--------|------|
| Create | `src/components/corporate-suite/LogoColorPicker.tsx` |
| Edit | `src/components/corporate-suite/LogoCreator.tsx` |
| Edit | `src/components/corporate-suite/logoCreatorTypes.tsx` |
| Edit | `supabase/functions/ai-logo-generator/index.ts` |

### Execution Order
1. Fix download bugs and remove auto-regenerate on color change
2. Build advanced color picker with HEX/RGB/HSL
3. Add logo type selector and AI refinement prompt
4. Expand export kit with all sizes and formats
5. Upgrade business card and letterhead mockups with layout options
6. Update edge function with refine/recolor/logoType modes

