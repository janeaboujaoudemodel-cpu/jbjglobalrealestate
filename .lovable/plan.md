

# Bilingual Arc Engine + Alignment + Spacing Rules — Plan

## Root Causes Found

1. **`languageMode` missing from live-render config** (line 225-256 of StampGeneratorPage.tsx): The `OfficialStampConfig` built for the re-render pipeline never sets `languageMode`. It always falls back to `'BILINGUAL'`, making EN-only/AR-only mode impossible from the editor.

2. **Arabic glyphs clip because `charW = 0.54` is too narrow for Arabic** (line 149 of stampOfficialTemplate.ts): Arabic characters average ~0.65-0.70 character width vs English ~0.54. Using the same value causes Arabic text to overflow arcs, leading to letter disappearance.

3. **Text can touch rings** because arc text radius sits at the band edge: `compBandMin = middleR + SAFE_ZONE` and `compBandMax = outerR - SAFE_ZONE` only control the band offset, but font descenders/ascenders still overlap ring strokes. Need additional per-arc padding based on font size.

4. **No language mode toggle in the editor** — only set at wizard step, no way to switch in StampLeftPanel.

5. **Location arcs use same spread limit but different font sizes** (Arabic 12px, English 12px base), creating visual imbalance because Arabic glyphs render wider. Arabic location text appears compressed while English appears spread.

## Implementation

### 1. Fix Arabic Character Width (`stampOfficialTemplate.ts`)

Change `safeArcFontSize`:
- Arabic `charW` → `0.68` (instead of shared `0.54`)
- English `charW` → `0.54` (unchanged)
- Minimum font size for Arabic → `8` (up from `6.5`) to prevent invisible glyphs
- Minimum font size for English → `7` (up from `6.5`)

### 2. Add Ring Padding (`stampOfficialTemplate.ts`)

Increase `SAFE_ZONE` from `6` to `10` for company arcs, and add a font-size-aware padding:

```
const textPadding = fontSize * 0.3;  // 30% of font size as clearance
const effectiveArcR = clampedTextArcR - textPadding;
```

This ensures text never visually touches the outer or middle ring regardless of font size.

### 3. Mirror Arabic/English Arcs (`stampOfficialTemplate.ts`)

For BILINGUAL mode, ensure both arcs use the **same arc radius** but independent font sizing. Currently both use `clampedTextArcR` — this is correct. The visual imbalance comes from Arabic being under-sized due to wrong `charW`. Fixing charW (step 1) will resolve the mirroring issue.

For location arcs: apply the same Arabic charW fix. Both `locArSafe` and `locEnSafe` already use `clampedLocTextR` — the fix is automatic once charW is corrected.

### 4. Add Language Mode State + UI Toggle (`StampGeneratorPage.tsx` + `StampLeftPanel.tsx`)

Add `languageMode` as editable state in `StampGeneratorPage`:
```typescript
const [languageMode, setLanguageMode] = useState<'EN' | 'AR' | 'BILINGUAL'>(
  () => ssGet(ssKey('languageMode'), project?.language_mode || 'BILINGUAL')
);
```

Pass to live-render config: `languageMode: languageMode`.

Add to `StampLeftPanel` props and render a 3-button toggle (🇬🇧 English Only / 🇦🇪 Arabic Only / 🌐 Bilingual) at the top of the Element Hierarchy section.

### 5. Conditional Control Visibility (`StampLeftPanel.tsx`)

When `languageMode === 'EN'`:
- Hide Arabic Controls accordion section
- Hide Arabic arc nodes in hierarchy

When `languageMode === 'AR'`:
- Hide English Controls accordion section
- Hide English arc nodes in hierarchy

When `languageMode === 'BILINGUAL'`:
- Show all controls

### 6. Letter Visibility Protection (`stampOfficialTemplate.ts`)

Add a minimum letter spacing floor in `computeArcLetterSpacing`:
```typescript
// Never allow negative spacing — causes letter overlap/disappearance
const spacing = Math.max(0.5, extraSpace / gaps);
```

Add SVG `textLength` + `lengthAdjust="spacing"` to arc `<textPath>` elements as a fallback — if computed letter spacing would cause overflow, the browser auto-adjusts spacing to fit within the arc path.

## Files Modified

| File | Changes |
|------|---------|
| `src/lib/stampOfficialTemplate.ts` | Fix Arabic charW, increase SAFE_ZONE, add font-size padding, floor letter spacing, add textLength fallback |
| `src/components/stamp-generator/StampGeneratorPage.tsx` | Add `languageMode` state, pass to live-render config, pass to StampLeftPanel |
| `src/components/stamp-generator/StampLeftPanel.tsx` | Add language mode toggle UI, conditionally hide/show Arabic/English controls |

## What Will NOT Change
- StampRightPanel (Design Library)
- StampInteractivePreview (click-to-edit)
- Save/Export flow
- Database schema
- Color controls

