

# Element Selection + Edit Panel Wiring — Implementation Plan

## Root Cause Analysis

After reading all core files, the fundamental problem is clear:

**The sidebar controls are disconnected from the SVG rendering pipeline.** Here is how:

1. **Layout controls are dead wires.** `circleGap`, `separatorDistance`, `arcTextSpacing`, `englishArcSpread`, `arabicArcSpread`, `arabicLetterSpacing`, `companyArcOffset`, `locationArcOffset`, `centerContentSize`, `locationArcSpread` — all stored as React state, displayed as sliders, but **never passed back to `generateOfficialStampSVG()`** to re-render the SVG. Moving these sliders updates React state and localStorage but produces zero visual change.

2. **Font controls cross-contaminate.** `StampSVGRenderer` applies `fontFamily`, `fontWeight`, `fontStyle`, `fontSize` via global regex replacement (`font-family="[^"]*"` → new value). This replaces ALL font-family attributes in the SVG — both Arabic and English text. The separate Arabic font controls (`arabicFont`, `arabicFontWeight`, `arabicFontItalic`, `arabicFontSize`) exist as state but are never applied to the SVG at all.

3. **T0 generation ignores user overrides.** In `stampTemplates.ts` line 957-974, the `stdConfig` passed to `generateOfficialStampSVG()` hardcodes defaults and never includes user-set `circleGap`, `arabicFont`, `englishArcSpread`, etc.

4. **No live re-render pipeline.** There is no `useEffect` or callback that re-generates the SVG when layout/typography controls change. The SVG is generated once and only modified via direct text mutations (`StampTextEditor`) or color regex replacements (`StampSVGRenderer`).

## Implementation Plan

### 1. Create a Live SVG Re-render Pipeline (`StampGeneratorPage.tsx`)

Add a `useEffect` that watches all layout/typography control values and re-generates the standard model SVG via `generateOfficialStampSVG()` whenever any control changes:

```
Watched deps: circleGap, separatorDistance, arcTextSpacing, englishArcSpread, 
arabicArcSpread, arabicLetterSpacing, arabicFont, arabicFontWeight, arabicFontSize,
fontFamily, fontBold, manualFontSize, companyArcOffset, locationArcOffset,
locationArcSpread, centerContentSize, localIconStyle, localMonogramText
```

This effect builds a full `OfficialStampConfig` from current state + project data and calls `generateOfficialStampSVG()`. The result is stored in `svgOverrides[standardConcept.id]`, which is what the center preview reads.

This makes every slider immediately live-wired to the preview.

### 2. Fix Arabic vs English Font Isolation (`StampSVGRenderer.tsx`)

The current `StampSVGRenderer` does global regex font replacement — this is the cross-contamination source. Fix:

- **Remove** the global `font-family` regex replacement from `StampSVGRenderer`
- Font family is already baked correctly into the SVG by `generateOfficialStampSVG()` (which uses `enFont` for English text paths and `arFont` for Arabic text paths via `data-stamp-element` attributes)
- The re-render pipeline (step 1) handles all font changes by regenerating the SVG with the correct per-language fonts

Alternatively, make `StampSVGRenderer` font replacement **element-aware**: only replace font-family on elements matching `data-stamp-element="bottom-arc"` or `"loc-bottom"` for English, and `"top-arc"` or `"loc-top"` for Arabic. But since we now have a live re-render pipeline, the simpler approach is to remove the regex replacement and let the template engine handle it.

### 3. Element Selection State + Contextual Panel Wiring (`StampGeneratorPage.tsx` + `StampLeftPanel.tsx`)

Add a `selectedElement` state to `StampGeneratorPage`:

```typescript
type SelectedElement = {
  id: string;  // e.g. 'top-arc', 'bottom-arc', 'separator-left', 'center', 'border-outer'
  type: 'arabic-company' | 'english-company' | 'arabic-location' | 'english-location' 
      | 'monogram' | 'logo' | 'separator-left' | 'separator-right' 
      | 'outer-ring' | 'middle-ring' | 'inner-ring' | 'registration';
} | null;
```

Pass this down to `StampLeftPanel` as a prop. When set, the left panel auto-opens the correct section:
- `arabic-company` / `arabic-location` → opens `arabic-controls`
- `english-company` / `english-location` → opens `english-controls`
- `separator-*` → opens `element-hierarchy` → Separators
- `monogram` / `logo` → opens `element-hierarchy` → Center Content
- `outer-ring` / `middle-ring` / `inner-ring` → opens `both-controls` (ring gap)
- `registration` → opens `element-hierarchy` → License/Registration

Replace the current custom event system (`stamp-focus-arabic`, `stamp-focus-english`, etc.) with this prop-driven approach — cleaner than window events.

### 4. Split Controls into Global vs Local Sections (`StampLeftPanel.tsx`)

Restructure the "Both / Sync Controls" section into two clear sub-groups:

**Global Controls** (affect entire stamp geometry):
- Ring Gap (`circleGap`)
- Separator Distance (`separatorDistance`)
- Center Content Size (`centerContentSize`)
- Company Arc Position (`companyArcOffset`)
- Location Arc Position (`locationArcOffset`)

**Local Controls** (per-language, already split into English/Arabic sections):
- Font Family
- Font Size
- Font Weight / Italic
- Letter Spacing
- Arc Spread

The "Both / Sync" section keeps the synced font size, letter spacing, and arc spread sliders + quick match buttons, but the layout controls (Ring Gap, Separator Distance, etc.) move to a new **"Global Layout"** group at the top of the panel.

### 5. Wire Generated Concepts to Controls

When a generated concept (not just T0) is selected as the active preview, the re-render pipeline must also apply. Currently only the standard model benefits from overrides.

Fix: Track which template the active concept uses (`templateKey`). For concepts generated by `generateOfficialStampSVG` (templateKey = `owner-official-standard`), the re-render pipeline applies. For legacy template concepts (T1-T11 from `stampTemplates.ts`), only color/font regex replacements apply (their geometry is baked differently).

Add a flag: `const isOfficialTemplate = activeStandard?.templateKey === 'owner-official-standard';` — when true, the full re-render pipeline fires. When false, fall back to the existing regex approach (with the cross-contamination fix from step 2).

---

## Files Modified

| File | Changes |
|------|---------|
| `StampGeneratorPage.tsx` | Add `selectedElement` state, add `useEffect` for live SVG re-render pipeline, pass `selectedElement` to left panel, build `OfficialStampConfig` from all control states |
| `StampLeftPanel.tsx` | Accept `selectedElement` prop, auto-open correct section based on it, reorganize into Global Layout + Language-specific sections |
| `StampSVGRenderer.tsx` | Remove global font-family regex replacement (handled by re-render pipeline); keep color replacement |
| `StampInteractivePreview.tsx` | Emit `selectedElement` type via `onElementSelect` callback instead of window events |

## What Will NOT Change
- `stampOfficialTemplate.ts` (already accepts all config params correctly)
- `stampTemplates.ts` (T0 generation stays the same; the re-render pipeline bypasses it for live updates)
- Right panel (Design Library)
- Database schema
- Save/Export flow

## Previously Broken Controls (to be fixed)
1. Ring Gap slider — dead (no visual effect)
2. Separator Distance slider — dead
3. Center Content Size slider — dead
4. Company Arc Position slider — dead
5. Location Arc Position slider — dead
6. Location Arc Spread slider — dead
7. English Arc Spread slider — dead
8. Arabic Arc Spread slider — dead
9. Arabic Letter Spacing slider — dead
10. Arabic Font Family selector — dead
11. Arabic Font Weight buttons — dead
12. Arabic Font Size slider — dead
13. English Font Family — cross-contaminates Arabic
14. English Bold/Italic — cross-contaminates Arabic

