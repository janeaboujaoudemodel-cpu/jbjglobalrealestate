

# Stamp Generator Comprehensive Upgrade Plan

This is a large set of fixes and enhancements across the stamp generator module. I will organize by priority.

---

## Phase 1: Critical Bug Fixes

### 1A. Fix broken Live Preview (curved text overflowing circles, wrong monogram)
**Where:** `src/components/stamp-generator/LiveStampPreview.tsx`

**Problems:**
- Monogram auto-generates from `displayName.split(/\s+/).map(w => w[0])` which can produce wrong initials (e.g. "JJG" instead of "JBJ")
- Curved text overflows the circle boundary — no clip-path applied
- Arabic city field shows English city name + Arabic country (extraction issue)

**Fixes:**
- Fix monogram derivation: use first letter of each word but limit to 3, taking meaningful initials
- Add `clipPath` to constrain all text within the inner ring
- For bilingual mode: English on top arc, Arabic on bottom arc; add a "Reverse Languages" toggle that swaps them

### 1B. Fix Arabic city extraction
**Where:** `supabase/functions/ai-stamp-extract/index.ts` + `StampProjectWizard.tsx`

The prompt already asks for Arabic city, but the `arabic_city` field format instruction says "English city name, Arabic country". Fix the prompt to request **fully Arabic** city name (e.g. "دبي، الإمارات العربية المتحدة"). Also fix the client-side mapping in `StampProjectWizard.tsx` line 332-333 to always use the Arabic city name from the map, never the English fallback.

### 1C. Fix "Reg" abbreviation in density labels
**Where:** `StampProjectWizard.tsx` line 534

Change `'Name + Reg + City'` to `'Name + License + City'` and in templates change `REG:` prefix to just the number or `License No:`.

### 1D. Fix white color swatch visibility
**Where:** `StampGeneratorPage.tsx` color swatches

Add a gold border (`border-[hsl(var(--gold)/0.4)]`) around the white color swatch so it doesn't fade into the background.

### 1E. Fix preview hidden behind header when selecting stamp
**Where:** `StampPreviewModal.tsx`

The modal opens at `top: 0` with `fixed inset-0` but the header bar overlaps. Ensure the modal's z-index is above the header and starts below any sticky headers. Add proper `pt-0` and ensure the left panel starts at the correct offset.

### 1F. Fix envelope showing duplicate stamps
**Where:** `StampPreviewModal.tsx` envelope mockup (around line 332-370)

Review the envelope mockup SVG and ensure only one stamp instance is rendered, not two.

---

## Phase 2: Extraction & Upload Improvements

### 2A. Add drag-and-drop to license uploader
**Where:** `StampLicenseUploader.tsx`

Already partially implemented (has `onDragOver`/`onDrop`). Verify it works end-to-end. Add visual feedback (full-screen overlay like the WhatsApp-style standard).

### 2B. Improve AI extraction accuracy
**Where:** `supabase/functions/ai-stamp-extract/index.ts`

- Update the prompt to explicitly request **fully Arabic** city names
- Upgrade model from `gemini-2.5-flash-lite` to `gemini-2.5-flash` for better accuracy
- Add post-processing: if `arabic_city` contains English text, look it up in the city map

---

## Phase 3: Real-time Preview Reactivity

### 3A. All style changes must reflect in live preview instantly
**Where:** `StampGeneratorPage.tsx` + `LiveStampPreview.tsx`

Currently the live preview in the wizard (`StampProjectWizard.tsx`) uses `LiveStampPreview` which already reacts to form state. The generator page uses `StampSVGRenderer` on the generated SVGs. The issue is that typography, density, theme changes in the wizard don't regenerate until you click "Generate".

**Fix:** In the wizard, pass all style props to `LiveStampPreview` (already done). In the generator page, ensure the left panel controls (colors, fonts, ink mode) are already applied via `StampSVGRenderer` props (already done for colors/fonts). The missing piece is that **shape, border, theme, density** changes require regeneration — add a "Preview with current settings" that applies these to the live preview without full AI regeneration.

### 3B. Add "Reverse Languages" toggle for bilingual stamps
**Where:** `StampProjectWizard.tsx` + `LiveStampPreview.tsx` + `stampTemplates.ts`

Add a `languageReversed` boolean state. When true, Arabic goes on top arc and English on bottom. Pass this to both LiveStampPreview and the template generator.

---

## Phase 4: Monogram / Logo Options

### 4A. Add "Both" option for monogram + logo
**Where:** `StampProjectWizard.tsx` step 2 + `StampGeneratorPage.tsx` left panel

Add a 4th icon style: `'BOTH'` — shows monogram text overlaid on the uploaded logo, or logo with small monogram below. Also add "Skip" option that proceeds without center art.

### 4B. Allow user to toggle trade license number visibility
**Where:** `StampProjectWizard.tsx` + `StampGeneratorPage.tsx`

Add a toggle/checkbox: "Show license number on stamp" (default: on). When off, `registration_number_optional` is excluded from the stamp SVG generation.

---

## Phase 5: Size Controls & Lock

### 5A. Add element size controls in preview
**Where:** `StampPreviewModal.tsx`

Already has a `logoScale` slider. Extend this to allow scaling individual elements (monogram size, text size). Add a "Lock" button that freezes the current scale. When locked, the slider is disabled and shows a lock icon. Click "Unlock" to re-enable.

---

## Phase 6: Download Kit Enhancement

### 6A. Download all variants in one kit
**Where:** `StampExportPage.tsx` or `StampGalleryPage.tsx`

When downloading, generate a ZIP containing:
- English-on-top bilingual variant (PNG, SVG, PDF)
- Arabic-on-top bilingual variant (PNG, SVG, PDF)
- Transparent background PNG versions of both
- A README.txt

This extends the existing batch export ZIP logic.

---

## Phase 7: Edit Text scroll behavior

### 7A. Auto-scroll to text editor on "Edit Text" click
**Where:** `StampGalleryPage.tsx` + `StampPreviewModal.tsx`

When user clicks "Edit Text Elements", scroll the panel down so the text editor section is visible.

---

## Phase 8: Letterhead, Business Card, Stationery Enhancements

### 8A. Add color palette from stamp to all mockups
**Where:** `StampPreviewModal.tsx`

Use the user's selected `tintColor`/`secondaryColor`/`accentColor` as the color palette for letterhead header/footer, business card background, envelope accents. Already partially done — extend to allow user to pick from their palette for each mockup section.

### 8B. Add user-saveable color palette
**Where:** New component or extend `StampColorWheel.tsx`

Allow users to save a custom color palette (up to 8 colors) to `sessionStorage` or DB. This palette is then available across stamp, letterhead, business card, and all stationery sections.

### 8C. Fix wax seal impression
**Where:** `StampPreviewModal.tsx` wax seal section

Update the wax seal to use the user's primary color (not just yellow/gold), make the inner circles larger and more detailed, add a premium embossed effect with proper shadows.

### 8D. Add letterhead header/footer customization
Allow selecting header style and footer style. Add signature area placeholder. Use the stamp's color palette.

### 8E. Add book cover generator section
Add a new mockup view "Book Cover" that lets users select a size (A4, A5, US Letter) and generates a cover with their stamp, company name, and color palette.

---

## Phase 9: Link E-Signature with Stamp

### 9A. Add stamp to e-signature flow
**Where:** Integration between stamp generator and e-signature module

Add a button "Use this stamp in E-Signature" that saves the selected stamp design to the user's e-signature profile, making it available when signing contracts.

### 9B. Link to AI Contract Reviewer
Add a flow: Upload contract → AI reviews it → Add stamp → Sign → Send to counterparty.

---

## Phase 10: Creative Suite Integration

### 10A. Add stamp tools to Creative Suite
Ensure the stamp generator, letterhead creator, and stationery tools are accessible from the Creative Suite project creation flow.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/stamp-generator/LiveStampPreview.tsx` | Fix monogram, clip-path, reverse languages toggle |
| `src/components/stamp-generator/StampProjectWizard.tsx` | Fix "Reg" label, add show/hide license toggle, add "Both" icon style, fix Arabic city |
| `src/components/stamp-generator/StampGeneratorPage.tsx` | White swatch border, reverse languages, element size lock |
| `src/components/stamp-generator/StampPreviewModal.tsx` | Fix header overlap, fix envelope duplicate stamp, enhance wax seal, add color palette, add book cover, scroll-to-editor |
| `src/components/stamp-generator/StampGalleryPage.tsx` | Auto-scroll on edit, kit download with both language variants |
| `src/components/stamp-generator/StampExportPage.tsx` | Include both language variants in export |
| `src/lib/stampTemplates.ts` | Fix REG prefix, support `languageReversed`, support `BOTH` icon style |
| `supabase/functions/ai-stamp-extract/index.ts` | Fix Arabic city prompt, upgrade model |
| `src/components/stamp-generator/StampLicenseUploader.tsx` | Enhance drag-drop UX |

---

## Implementation Order
1. Critical bug fixes (monogram, clip-path, Arabic city, envelope, header overlap, white swatch, "Reg" label)
2. Extraction accuracy + drag-drop
3. Reverse languages + real-time reactivity
4. Monogram/logo "Both" + license toggle
5. Size controls + lock
6. Download kit with all variants
7. Wax seal, letterhead, stationery, book cover
8. E-signature + Creative Suite integration

