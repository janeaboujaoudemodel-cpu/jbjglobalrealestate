

# Stamp Generator — Separated Controls + Enhanced Click-to-Edit + Arabic Arc Fix

## Problem Summary
1. **Controls are split across separate accordion sections** — user wants one section for Arabic, one for English, and one "Both" section that syncs them together
2. **Click-to-edit granularity** — single-click should select a letter; double-click should select the full word/company name; selection should auto-open ONLY the relevant editing section (Arabic or English)
3. **Arabic arc curvature is insufficient** — Arabic text is not arcing as much as English text, looks nearly flat instead of matching the full semicircular arc of the English text

---

## Plan

### 1. Restructure StampLeftPanel Spacing & Typography Sections

Replace the current separate "English Typography", "Arabic Typography", and "Spacing & Layout" accordion items with **three new grouped sections**:

- **Arabic Controls** — Arabic font family, font size, weight, italic, letter spacing, arc spread (all existing Arabic props consolidated)
- **English Controls** — English font family, font size, weight, italic, letter spacing, arc spread (all existing English props consolidated)
- **Both (Sync Controls)** — Unified sliders for font size, letter spacing, arc spread that update BOTH languages simultaneously. Includes "Match AR→EN" and "Match EN→AR" quick buttons. Also keeps shared layout controls: ring gap, separator distance, location arc spread, center content size, company/location arc offsets.

Each section gets a colored indicator (e.g., 🇦🇪 Arabic, 🇬🇧 English, 🔗 Both).

### 2. Enhance Click-to-Edit Interaction in StampInteractivePreview

Currently the interactive preview works at the element level (whole arc). Enhance it:

- **Single click on a text element** → select the individual letter closest to the click position (highlight that letter, show letter-level editing: color, size, nudge)
- **Double click on a text element** → select the entire arc/word (current behavior), auto-open the corresponding sidebar section (Arabic or English based on `data-stamp-element` id — `top-arc` = Arabic in bilingual, `bottom-arc` = English)
- **Event dispatch refinement** — Instead of generic `stamp-open-text-panel`, dispatch `stamp-focus-arabic` or `stamp-focus-english` events that open ONLY the matching accordion section and collapse others
- The floating toolbar adapts: letter-selected shows letter controls; word-selected shows arc-wide controls

### 3. Fix Arabic Arc Geometry

In `src/lib/stampOfficialTemplate.ts`, the `renderTopArcTextPath` function creates the arc path:
```
M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy}
```
This is a standard semicircular arc for both Arabic and English. The issue is likely in the `safeArcFontSize` function — Arabic gets a different spread limit calculation due to different `avgCharWidth` for Arabic (0.7 vs 0.55 for English), which results in smaller font sizes and tighter letter spacing, making the text appear less spread/arced.

**Fix**: Ensure Arabic arc spread uses the same `ARC_SPREAD_LIMIT` (0.98) as English by default. Adjust the `safeArcFontSize` to give Arabic text wider letter spacing to fill the arc edge-to-edge, matching the visual fullness of English text. The key change is in the `computeArcLetterSpacing` function — increase the minimum spacing for Arabic and ensure the font size doesn't get overly reduced.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/stamp-generator/StampLeftPanel.tsx` | Restructure accordion: Arabic section, English section, Both/Sync section |
| `src/components/stamp-generator/StampInteractivePreview.tsx` | Add single-click letter selection, double-click word selection, dispatch language-specific events |
| `src/lib/stampOfficialTemplate.ts` | Fix Arabic arc letter spacing and font sizing to achieve visual parity with English arc fullness |

