

# Session 6 — Stamp Sidebar UX + Defaults + Options Depth

## Root Causes Found

### 1. "50% centered" defaults are WRONG
- `companyArcOffset` defaults to `0` (line 188), but the template engine interprets `50` as centered (`companyArcBandOffset ?? 50` at line 322). When the slider shows `0`, the text sits at the inner edge, not centered.
- `locationArcOffset` defaults to `0` (line 190), same problem — template expects `50` for midpoint (line 335).
- The slider UI for these shows raw values (`-20` to `20`) instead of the `0-100` range the template actually uses. The template clamps `companyArcBandOffset` to `0-100` where `50 = centered`.

### 2. Font lists have no visual preview
Font buttons show only text labels like "Trajan (Elegant)" with no sample rendering in the actual font. Users can't see what they're picking.

### 3. Color section is one monolithic accordion
Everything — swatches, palette presets, color wheel, ink mode, my colors, border color stops — is jammed into one "Colors" section. No distinct border color controls, no fill controls.

### 4. Section organization doesn't match required structure
Current: Element Hierarchy → English Controls → Arabic Controls → Global Layout → Both/Sync → Colors → My Stamp & Signature.
Required: Company → Style → Logo → Export → English Typography → Arabic Typography → Spacing & Layout → Separators → Colors → Circle Structure.

### 5. Slider ranges are inconsistent
- Ring Gap: `5-25` (shown as `%` but template uses `/ 100`). Default `13` is reasonable.
- Company Arc Position: `-20 to 20` — but template uses `0-100` with `50 = center`. Mismatch.
- Location Arc Position: same mismatch.
- Center Content Size: `20-60` — reasonable.

## Implementation Plan

### 1. Fix Default Values (`StampGeneratorPage.tsx`)

| Control | Current Default | Correct Default | Reason |
|---------|----------------|-----------------|--------|
| `companyArcOffset` | `0` | `50` | Template: `50 = centered between outer+middle rings` |
| `locationArcOffset` | `0` | `50` | Template: `50 = centered between middle+inner rings` |

Also fix the slider ranges in `StampLeftPanel.tsx`:
- Company Arc Position: change from `min={-20} max={20}` to `min={0} max={100}` with `50` as the labeled center. Add hint "50 = centered".
- Location Arc Position: same change.

### 2. Reorganize Sections (`StampLeftPanel.tsx`)

Replace current accordion structure with the required sections:

1. **Company** — Company name text editors (Arabic/English arcs, currently under Element Hierarchy > Company Name)
2. **Style** — Language mode toggle + border style selector + ink impression + separator style grid (pulled from current Element Hierarchy > Separators and Colors)
3. **Logo** — Center content controls: Monogram, Logo upload, No Art, License/Registration (currently under Element Hierarchy > Center Content)
4. **Export** — Signature overlay + Upload stamp + AI refine (currently "My Stamp & Signature")
5. **English Typography** — Font family (with preview), font size, bold/italic, letter spacing, arc spread (current "English Controls")
6. **Arabic Typography** — Same for Arabic (current "Arabic Controls")
7. **Spacing & Layout** — Ring gap, separator distance, company/location arc positions, center content size, location arc spread, arc text spacing (merge of current "Global Layout" + "Both/Sync")
8. **Separators** — Separator style grid + separator position slider + left/right text editors (currently nested under Element Hierarchy > Separators)
9. **Colors** — Split into sub-sections: Border Colors (primary/secondary/accent stops), Quick Colors swatches, Palette Presets, Monogram Colors, My Colors, Color Wheel. Add dedicated `native <input type="color">` pickers alongside swatches.
10. **Circle Structure** — Ring gap, border style, border widths. Ring-specific controls.

### 3. Add Font Preview (`StampLeftPanel.tsx`)

For each font option, render the label text IN that font using inline `style={{ fontFamily: f.value }}`:

```tsx
<button key={f.value} ...>
  <p className="text-[11px]" style={{ fontFamily: f.value }}>{f.label.split(' (')[0]}</p>
  <p className="text-[7px] text-muted-foreground">{f.label.match(/\((.+)\)/)?.[1]}</p>
</button>
```

For Arabic fonts, show a sample Arabic word (e.g., "شركة") rendered in that font.

### 4. Enhance Color Controls (`StampLeftPanel.tsx`)

- Add a `<input type="color" />` native picker next to each color stop (Primary, Secondary, Accent) for precise hex selection.
- Add labeled sections: "Border Colors", "Text Colors", "Background".
- Add a "Reset to Standard Ink Blue" button per stop (not just global reset).
- Show hex value next to each swatch with a copy button.
- Add border-specific color options: Outer Ring Color, Middle Ring Color, Inner Ring Color (these exist in `OfficialStampConfig` as `outerBorderColor`, `middleBorderColor`, `innerBorderColor` but are not exposed in the UI).

### 5. Quick Match Buttons Stay

Keep the "AR ← Match EN" and "EN ← Match AR" buttons but move them into the Spacing & Layout section under a "Sync" sub-group.

## Files Modified

| File | Changes |
|------|---------|
| `StampGeneratorPage.tsx` | Fix `companyArcOffset` default from `0` to `50`, fix `locationArcOffset` default from `0` to `50` |
| `StampLeftPanel.tsx` | Full section reorganization (10 sections), font preview rendering, enhanced color controls with native pickers, fix slider ranges for arc position (0-100), add "50 = centered" hints, add border-specific color controls |

## What Will NOT Change
- `stampOfficialTemplate.ts` (rendering engine)
- `StampRightPanel.tsx` (Design Library)
- `StampInteractivePreview.tsx`
- Edge functions
- Database schema

