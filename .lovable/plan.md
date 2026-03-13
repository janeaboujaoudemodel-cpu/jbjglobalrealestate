

## Plan: Stamp Generator — STANDARD MODEL Core Structure

### Current State

The stamp system already has a foundation in `src/lib/stampOfficialTemplate.ts` with a 3-ring layout, Arabic-top/English-bottom arcs, separators, location arcs, and center content. However it needs significant upgrades to match the reference image's premium corporate stamp quality.

**Key gaps:**
- No "Standard Model" concept pinned as default first-load
- Ring thickness hierarchy is flat (outer 4px, inner 2px, center 1.2px) — needs bolder outer, wider premium gap between ring 1→2, tighter gap between ring 2→3
- Only 5 separator options (dot/star/dash/circle/none) — needs 10+
- Center content limited to monogram/logo/none — needs initials, icon, license number options
- Navy ink default exists in wizard but not enforced in generator studio page (defaults to `#1B3A8C` but labeled "Ink Blue" inconsistently)
- Safe zone margins exist but are minimal (5px) — need strengthening

### Implementation

#### 1. Upgrade `stampOfficialTemplate.ts` — Ring Geometry + Separators + Center

**Ring hierarchy (tapering thickness):**
- Outer ring: `strokeWidth = 6` (boldest, authoritative)
- Middle ring: `strokeWidth = 2.5` (medium, refined)
- Inner ring: `strokeWidth = 1.2` (thinnest, elegant)
- Gap between outer→middle: `~13%` of radius (premium wide gap)
- Gap between middle→inner: `~8%` of radius (tighter, refined)

**Expand `SeparatorStyle` type:**
```
'dot' | 'star' | 'square' | 'diamond' | 'line' | 'double-line' | 'triangle' | 'cross' | 'floral' | 'ornament' | 'none'
```
Add corresponding glyph rendering for each (Unicode/SVG paths for floral and ornament).

**Expand center content system:**
- Add `CenterContentMode` type: `'monogram' | 'initials' | 'logo' | 'icon' | 'license' | 'none'`
- Update `OfficialStampConfig` interface with `centerMode` field
- `initials` = first letter of each word (auto-derived, max 3)
- `icon` = preset corporate icons (shield, crown, building, globe)
- `license` = registration number displayed prominently in center

**Safe zone enforcement:**
- Minimum 7px clearance between text and ring strokes (up from 5px)
- Arc spread limit stays at 0.58 of semicircle

#### 2. Pin "Standard Model" as first concept in `stampTemplates.ts`

- Add a new template `T0: Owner Official Standard` at the top of `generateStampConcepts()`
- Uses `generateOfficialStampSVG()` with project data, always `unshift`ed to position 0
- Label: "Owner Official Standard" with tag `['standard', 'official', 'bilingual', 'premium']`
- This replaces the current T12 "Bilingual Logo Center" as the pinned first entry

#### 3. Update `StampGeneratorPage.tsx` — Default ink + reset button

- Default `primaryColor` changes from `#1B3A8C` to the `OFFICIAL_INK_BLUE` constant (same value but uses the shared constant)
- Ensure the "Reset to Standard (Ink Blue)" button resets all 3 color stops to navy ink values
- Label the first concept card with a "Standard" badge so users know it's the default model
- Auto-select the Standard Model concept on first load

#### 4. Update `StampProjectWizard.tsx` — Separator picker UI

- Expand the separator picker from 5 options to 10+ (matching the new `SeparatorStyle` type)
- Add visual preview swatches for each separator type
- Wire new separator styles through to `LiveStampPreview`

#### 5. Update `LiveStampPreview.tsx`

- Pass through the new separator styles and center content modes to `generateOfficialStampSVG()`
- Update the props interface with `centerMode` option

### Files Modified

| File | Change |
|------|--------|
| `src/lib/stampOfficialTemplate.ts` | Ring geometry, 10+ separators, center content modes, safe zones |
| `src/lib/stampTemplates.ts` | Pin Standard Model as T0 using official template |
| `src/components/stamp-generator/StampGeneratorPage.tsx` | Navy ink default constant, Standard badge, auto-select |
| `src/components/stamp-generator/StampProjectWizard.tsx` | Expanded separator picker UI |
| `src/components/stamp-generator/LiveStampPreview.tsx` | New props for center mode and separators |

### Spacing Logic (from reference image)

```text
┌─────────────────────────────────┐
│  OUTER RING (6px stroke)        │
│    ┌─── PREMIUM GAP (13%) ───┐  │
│    │  MIDDLE RING (2.5px)    │  │
│    │  ┌─ TIGHT GAP (8%) ─┐  │  │
│    │  │ INNER RING (1.2px)│  │  │
│    │  │  ┌─ CENTER ────┐  │  │  │
│    │  │  │  Monogram/  │  │  │  │
│    │  │  │  Logo/Init  │  │  │  │
│    │  │  └─────────────┘  │  │  │
│    │  │ Loc-AR ↑  Loc-EN ↓│  │  │
│    │  └───────────────────┘  │  │
│    │ AR Name ↑    EN Name ↓  │  │
│    │ ★ separators at 3&9 ★   │  │
│    └─────────────────────────┘  │
└─────────────────────────────────┘
```

- Text never touches rings (7px minimum clearance)
- Arabic arcs fill upper section proportionally (not thin/centered)
- English bottom reads left-to-right (character-by-character rotation)
- Default preview color: Navy Ink `#1B3A8C` everywhere

