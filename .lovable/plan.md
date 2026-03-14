

## Session 8 — Business/Legal Stamp Presets

### Current State

The system already has 12+ template variants (T0–T12) generated in `stampTemplates.ts`, including bilingual, rectangle, square, vintage, and official seal styles. The `StampProjectWizard.tsx` has style/theme/border/typography options but **no preset library** — users must manually configure every parameter.

**What exists:**
- Templates: owner-official-standard (T0), classic-double, modern-minimal, luxury-ring, bold-rectangle, vintage-ornate, bilingual-official, geometric-modern, square-premium, arabic-calligraphy, official-seal, embossed-medallion, art-deco-square, bilingual-logo-center
- Arabic font support via `Noto Naskh Arabic` 
- Separator styles (12 options)
- Border styles (6 options)
- Language modes (EN/AR/BILINGUAL)
- Registration number support
- Arc text spacing built into the SVG generation

**What's missing:**
1. **No preset library UI** — no way to pick "Notary stamp" or "Legal office" and auto-fill form
2. **No company license stamp template** — with license number prominently displayed
3. **No Arabic font picker** — only one Arabic font used, no letter spacing/arc spacing controls for Arabic
4. **No explicit spacing controls** — arc text spacing, circle gap, separator distance are hardcoded
5. **No government-style strict mode** — thicker outer ring, centered, minimal decoration

### Implementation Plan

#### 1. Create Preset Library (`StampPresetLibrary.tsx`)

New component displayed in the StampProjectWizard as a prominent section before the form tabs. Contains preset cards:

| Preset | Style | Border | Typography | Density | Stamp Type | Special |
|--------|-------|--------|------------|---------|------------|---------|
| Corporate Company | CLASSIC | DOUBLE | SERIF | 3 | ROUND | Standard layout |
| Legal Office | MODERN | RING | SANS | 4 | ROUND | "Licensed" text, reg number prominent |
| Real Estate | LUXURY | DOUBLE | SERIF | 3 | ROUND | Gold accent, monogram |
| Notary | BOLD | RING | GOTHIC | 4 | ROUND | Thick borders, "NOTARY PUBLIC" |
| Government Official | BOLD | RING | SERIF | 5 | ROUND | Thickest outer ring, minimal, centered |
| Official Seal | VINTAGE | ROPE | CALLIGRAPHY | 3 | ROUND | Ornate, dot ring |
| Company License | CLASSIC | DOUBLE | SERIF | 4 | ROUND | License # prominent, "LICENSED" label |

Each preset card shows a small SVG preview thumbnail and name. Clicking one auto-fills the wizard form with the preset values, then the user can customize further.

#### 2. Company License Stamp Template

Add a new template (T13) in `stampTemplates.ts`: `license-company` that:
- Places company name on top arc
- License number prominently in the center (large, bold)
- Location on bottom arc
- Optional registration number below license
- "LICENSED" or "TRADE LICENSE" label
- Generates when `show_license_number` is true OR when density >= 4

#### 3. Arabic Font Controls in StampLeftPanel

Add to the left panel's "Font Controls" accordion section:
- **Arabic Font selector** — dropdown with 4-5 Arabic web-safe fonts:
  - Noto Naskh Arabic (default)
  - Amiri
  - Cairo
  - Tajawal
  - Scheherazade
- **Arabic letter spacing** — slider (0–6px)
- **Arabic arc spread** — slider controlling `startOffset` for Arabic arc text (affects how spread out the text is on the arc)
- **Arabic font weight** — normal/bold toggle

These values get passed to `generateOfficialStampSVG` and the template functions via new config fields on the project/form state.

#### 4. Spacing Controls in StampLeftPanel

Add a new accordion section "Spacing & Layout" or extend the existing "Circle Structure" section:
- **Arc text spacing** — slider for `letterSpacing` on arc text paths (1–6px, default 2)
- **Circle gap** — slider for outer-to-middle ring gap (8–25% of radius)  
- **Separator distance** — slider for how far separators sit from center (affects the radius at which separators render)
- **Center content size** — slider for monogram/logo disc radius

These modify the rendering by passing spacing params into the SVG generation.

#### 5. Government Style Mode

Add a toggle/preset in the wizard or left panel that activates strict government formatting:
- Outer ring stroke: 6px → 8px
- Remove all decorative elements (gradients, ornaments, stars)
- Force centered layout
- Force bold serif typography
- Force single or double border (no rope/dotted)
- Minimal color: solid black or navy only
- Add "OFFICIAL" watermark-style text

This is implemented as a boolean flag `governmentMode` that modifies template generation.

#### 6. Template Customization Flow

Already mostly exists — users can start from any generated concept and:
- Edit text via StampTextEditor
- Change colors via StampColorWheel
- Change fonts via left panel
- Click-to-edit on canvas

Add: when a preset is selected, show a small badge "Based on: [Preset Name]" in the wizard header, and a "Save as Custom Template" button that saves the current form state to localStorage as a named custom preset.

### Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/stamp-generator/StampPresetLibrary.tsx` | NEW — Preset cards with thumbnails, auto-fill on click |
| `src/components/stamp-generator/StampProjectWizard.tsx` | Add preset library section, Arabic font fields, spacing fields, government mode toggle, custom preset save |
| `src/lib/stampTemplates.ts` | Add T13 license-company template, pass through spacing/arabic font params |
| `src/lib/stampOfficialTemplate.ts` | Add Arabic font/spacing config fields, government mode rendering adjustments |
| `src/components/stamp-generator/StampLeftPanel.tsx` | Add Arabic font controls, spacing sliders, government mode toggle to accordion |

### No Database Changes Required

All presets are client-side configurations. Custom presets saved to localStorage. The existing `stamp_projects` table and `layout_json` column already support storing arbitrary config.

