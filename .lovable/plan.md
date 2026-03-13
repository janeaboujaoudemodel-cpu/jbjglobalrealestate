

## Logo Creator — Font Decoupling, Upload & Layout Stability

### Issues Identified

1. **Font change triggers full AI regeneration** — Line 102-112 in `LogoCreator.tsx`: `useEffect` watches `[style, industry, font]` and calls `generate()` on any change. Font should apply client-side only (like colors do), not trigger regeneration.

2. **FONTS array mixes actual fonts with style tones** — "Editorial" and "Corporate" are not fonts, they're design tones. These should be separated: actual font families in the Font section, style tones stay in the Style section.

3. **No option to upload own logo** — User wants to upload an existing logo and refine it with AI prompts (e.g., "keep the monogram, improve the wordmark").

4. **Right panel causes layout shift** — `StudioShell` uses `AnimatePresence` with `initial={{ opacity: 0, x: 40 }}` on the right panel, keyed by `activeSection`. Every section switch causes the panel to animate out and back in, which shifts the center canvas. The canvas itself also re-renders because the `preview` prop depends on state that changes during transitions.

---

### Implementation

**File: `src/components/corporate-suite/LogoCreator.tsx`**

- **Remove `font` from the auto-regeneration useEffect** (line 112). Only `style` and `industry` trigger regeneration. Font changes apply client-side via a new `recolorAndRefontSVG` approach or by updating text elements in the SVG directly.
- **Add client-side font application**: Create a `refontSVG(svg, fontFamily)` function that replaces `font-family` attributes in the SVG without calling the AI. Apply it alongside `recolorSVG` in the `displayLogo` computation.
- **Add "Upload Logo" section** to the Brand panel: file input accepting SVG/PNG. For SVG uploads, inject directly as `logo.svgContent`. For PNG, wrap in an `<image>` SVG tag. Show the "Refine with AI" prompt below so users can describe desired modifications.
- **Separate FONTS from style tones**: Keep only actual font families in `FONTS`. Move "Editorial" and "Corporate" labels to the existing `STYLES` array (or create a new "Tone" subsection in the Style panel).

**File: `src/components/corporate-suite/logoCreatorTypes.tsx`**

- **Add `refontSVG` utility**: Replace all `font-family` CSS/attribute values in SVG string with the selected font.
- **Clean up FONTS array**: Remove duplicate entries (two "Georgia, serif" items). Add distinct font families (e.g., `'Playfair Display, serif'`, `'Inter, sans-serif'`, `'Roboto Slab, serif'`).

**File: `src/components/ui/StudioShell.tsx`**

- **Fix layout stability**: Remove the `key={activeSection}` from the right panel `motion.aside` so it doesn't unmount/remount on section change. Instead, use a crossfade on the inner content only, keeping the panel container static. This prevents the center canvas from shifting.
- Same fix for the mobile bottom sheet.

---

### Files to Modify
- `src/components/corporate-suite/LogoCreator.tsx` — remove font from auto-regen, add upload, separate tones
- `src/components/corporate-suite/logoCreatorTypes.tsx` — add `refontSVG`, clean FONTS array
- `src/components/ui/StudioShell.tsx` — stabilize right panel (no remount on section change)

