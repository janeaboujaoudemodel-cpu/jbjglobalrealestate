

## Stamp Generator — Complete Overhaul Plan

### Root Causes Identified

**1. Edge function generates completely different stamps than the live preview**
- `LiveStampPreview` uses `generateOfficialStampSVG()` from `stampOfficialTemplate.ts` (per-character bottom arc, bilingual, 3 rings)
- Edge function `ai-stamp-generator/index.ts` uses its own `buildSVG()` with old `bottomArcText` (textPath, upside-down), no bilingual arc layout, basic templates
- This is why "generation doesn't match preview" — they're two entirely separate renderers

**2. Secondary/Accent colors do nothing**
- `StampSVGRenderer` replaces `#2a3a5c` → secondary and `#8b6914` → accent
- But the edge function `buildSVG()` uses `#1a2744` for ALL elements — there's no `#2a3a5c` or `#8b6914` in the generated SVGs
- So tinting those stops has zero visible effect

**3. Rectangular stamps shown in circle frames**
- `ConceptCard` renders all stamps at 130px in `StampSVGRenderer` which is a square div — but the SVG itself has `viewBox="0 0 300 300"` with a rectangle inside, so it appears as a small rectangle inside a large empty square, visually appearing inside a "circle frame" due to the pearl background

**4. Gallery page gap and cropping**
- Gallery uses `min-h-screen` with `sticky top-0 lg:top-[48px]` — creates a gap under the main nav
- Color panel expands below the header and pushes content down, cropping stamps

**5. Smart Designer padding**
- Floating panel at `top: 80` doesn't account for the header properly
- "Replace Selected" requires a stamp to be selected first but error message is confusing

**6. No draft persistence across refresh**
- `sessionStorage` is used (clears on tab close)
- No localStorage draft with recovery prompt

### Implementation Plan (4 files)

**A. Rebuild edge function with proper stamp geometry** (`supabase/functions/ai-stamp-generator/index.ts`)
- Port `renderBottomArcText` (per-character) and `renderTopArcTextPath` from `stampOfficialTemplate.ts` into the edge function
- Rebuild all 8 templates to use:
  - Distinct color tokens: `#1a2744` (primary), `#2a3a5c` (secondary), `#8b6914` (accent) so StampSVGRenderer tinting works
  - Per-character bottom arc for readable English text
  - Bilingual layout (Arabic top arc, English bottom arc) for BILINGUAL/AR mode on all round templates
  - Company name, location, monogram, registration number properly placed
  - viewBox proportional to stamp shape: `0 0 300 300` for round, `0 0 380 200` for rectangle, `0 0 260 260` for square
- Upgrade model from `google/gemini-3-flash-preview` to `google/gemini-2.5-pro` for better ordering/refinement
- Add image upload support to refine action (accept base64 reference photo)

**B. Fix concept card frames** (`StampGeneratorPage.tsx`)
- Detect stamp shape from SVG: if `<rect` present and no `<circle`, render in rectangular container
- Remove fixed circle background for non-round stamps
- Increase card preview size from 130px to 160px
- Fix Smart Designer panel: top position to `60px`, add padding, better error for "Replace Selected"
- Add localStorage draft persistence: save project+concepts on change, show "Resume draft?" dialog on load

**C. Fix gallery layout** (`StampGalleryPage.tsx`)  
- Change root from `min-h-screen` to `h-[calc(100vh-52px)] flex flex-col overflow-hidden`
- Make header `flex-shrink-0` (not sticky)
- Make grid area `flex-1 overflow-y-auto`
- Reduce header gap

**D. Fix official template text positioning** (`stampOfficialTemplate.ts`)
- Push text arcs inward: increase gap between rings so company name sits more centered between them
- Narrow the location circle (push it further inside toward center)
- Add thin gap between location circle and center circle
- When `showLocation=false`, remove location circle entirely and expand center area
- When `showRegistration` toggles, adapt layout without breaking other elements
- Ensure text never touches any ring border (add 2px minimum clearance)

### Color System Explanation (for UI labels)
- **Primary**: Main ink color — outer ring, company name text, borders
- **Secondary**: Inner ring strokes, decorative accents, location text  
- **Accent**: Monogram/logo, center dividers, registration number

### Files to modify
1. `supabase/functions/ai-stamp-generator/index.ts` — complete rebuild of `buildSVG` with proper geometry + color tokens
2. `src/components/stamp-generator/StampGeneratorPage.tsx` — card frames, Smart Designer fixes, draft persistence
3. `src/components/stamp-generator/StampGalleryPage.tsx` — layout fix
4. `src/lib/stampOfficialTemplate.ts` — text positioning refinements, adaptive layout

