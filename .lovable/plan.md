

## Fix Location Arc Spread + Unify EN/AR Typography Controls

### Problem
1. **Location arcs** use company arc spreads (`arabicSpread`/`englishSpread`) — the location text (especially Arabic) doesn't fill the half-arc edge-to-edge
2. **Arabic Typography section** only has 4 controls (font family, letter spacing, arc spread, weight) — missing font size
3. **English controls** are scattered across "Font Controls" and "Spacing & Layout" — not a unified section matching Arabic
4. No dedicated location arc spread control

### Changes

**1. `src/lib/stampOfficialTemplate.ts`**
- Add `locationArcSpread` to `OfficialStampConfig` (default `0.98`)
- In `generateRoundStamp`, use `config.locationArcSpread ?? ARC_SPREAD_LIMIT` for location arcs instead of reusing `arabicSpread`/`englishSpread`
- This ensures location text always fills the full half-arc by default, independently from company name arcs

**2. `src/components/stamp-generator/StampLeftPanel.tsx`**
- Restructure the sidebar into two matching sections:
  - **English Typography** — font family, font size, bold/italic, letter spacing, arc spread, weight
  - **Arabic Typography** — font family, font size, bold/italic, letter spacing, arc spread, weight
- Each section gets a "Match with [other language]" button that copies: arc spread, letter spacing, font size, weight
- Add a **Location Arc Spread** slider (shared for both languages) in the Spacing & Layout section
- Move English arc spread from "Spacing & Layout" into the new "English Typography" section
- Move Arabic arc spread from "Arabic Typography" (already there, keep it)
- Add font size slider to Arabic section (currently missing)

**3. `src/components/stamp-generator/StampGeneratorPage.tsx`**
- Add `locationArcSpread` state (default `0.98`)
- Pass it through to the template config and the left panel
- Add `arabicFontSize` state for manual Arabic font size control

**4. `src/components/stamp-generator/LiveStampPreview.tsx`**
- Pass `locationArcSpread` through to the stamp config

### Result
- Location arcs (AR + EN) default to full edge-to-edge (0.98) independently
- Arabic and English sections have identical controls in sidebar
- "Match" buttons sync all typography settings between languages

