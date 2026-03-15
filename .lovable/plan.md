

## Fix Stamp Arc Controls: Complete Arabic Section + Fix Spread Bug

### Critical Bug Found
`LiveStampPreview.tsx` has a **broken value mapping** for arc spreads. The state stores values as `0.0-1.0` (e.g. `0.98`), but `LiveStampPreview` applies a formula `0.30 + (value - 20) / 80 * 0.70` meant for a `20-100` range. So `0.98` produces garbage (`~0.13`). This is why arcs never reach edge-to-edge despite showing "98%" in the UI.

### Changes

**1. `src/components/stamp-generator/LiveStampPreview.tsx`** — Fix the spread mapping
- Remove the broken `20-100 → 0.30-1.00` formula for `arabicArcSpread`, `englishArcSpread`, and `locationArcSpread`
- Pass these values directly to the template config (they're already in 0-1 range)

**2. `src/components/stamp-generator/StampGeneratorPage.tsx`** — Add `arabicFontSize` state
- Add `arabicFontSize` state (default `null` = auto, like English)
- Pass it to `StampLeftPanel` and `LiveStampPreview`

**3. `src/lib/stampOfficialTemplate.ts`** — Add `arabicFontSize` override
- Add `arabicFontSizeOverride` to `OfficialStampConfig`
- Use it in bilingual and AR-only modes to override `safeArcFontSize` result when set

**4. `src/components/stamp-generator/StampLeftPanel.tsx`** — Complete Arabic section
Add missing controls to Arabic Typography to match English:
- **Font Size** slider (6-24, step 0.5) with Auto button — currently missing
- **Italic** toggle — currently missing (Arabic has only Bold/Normal, English has Bold + Italic)
- Update the "Match" buttons to also sync font size between sections

**5. `src/components/stamp-generator/LiveStampPreview.tsx`** — Pass `arabicFontSize`
- Accept and forward `arabicFontSize` to the template config

### Result
- All arc spreads actually work (bug fix — values reach the template correctly)
- Arabic Typography section has identical controls to English
- Font size is independently controllable per language
- Match buttons sync all settings including font size

