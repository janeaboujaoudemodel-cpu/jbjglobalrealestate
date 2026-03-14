

## Plan: Color Palette System, Monogram Letter Color Editing & Export Color Options

### Current State

**Generator page** (`StampGeneratorPage.tsx`): Has a 3-stop color system (primary/secondary/accent), 8 palette presets, 11 quick color swatches, a "My Colors" section (up to 5 custom saved colors in localStorage), and a "Reset to Standard (Ink Blue)" button. Default primary is `#1B3A8C`.

**Export page** (`StampExportPage.tsx`): Has its own 3-stop color system, 9 `PACK_COLORS`, a "Quick Download in Color" section (click any color → instant PNG), and a "Multi-Color Pack" ZIP feature (up to 5 colors). Missing: the 5 mandatory standard export colors (white, black, navy, primary brand, gold) are not enforced as always-present.

**Monogram coloring**: The `injectCenterArt` function injects monogram text with `fill="currentColor"`. No per-letter color control exists.

### What Needs to Change

#### 1. 5-Color Palette System (Tasks 1, 2, 3)

The generator already has 5 custom color slots + presets + reset button. Refinements needed:

- **Add "Standard Export Colors" section** — a locked row of 5 always-visible swatches: White (`#ffffff`), Black (`#0d0d0d`), Navy Ink (`#1B3A8C`), Brand Primary (from project/palette context), Gold (`#B8860B`). These cannot be removed.
- **Saveable palettes to database** — currently custom colors are in localStorage only. Add save/load to `user_color_palettes` table (already exists) so palettes persist across devices.
- **Reset to Standard** — already exists but only resets the 3 color stops. Enhance to also clear any per-letter monogram colors back to default.

**Files**: `StampGeneratorPage.tsx` (add standard colors row, palette save/load), `StampExportPage.tsx` (add standard colors section)

#### 2. Monogram Letter-by-Letter Color Editing (Task 4)

Create a new component `MonogramColorEditor` that:
- Parses the monogram text (up to 3 characters)
- Displays each letter as a large clickable swatch
- On click, opens a color picker for that specific letter
- Stores per-letter colors in state: `monogramLetterColors: Record<number, string>`
- Updates `injectCenterArt` to apply individual `fill` colors per `<tspan>` instead of a single `fill="currentColor"`
- Also supports coloring the divider/accent line in the center

**Files**: New `src/components/stamp-generator/MonogramColorEditor.tsx`, modify `injectCenterArt` in `StampGeneratorPage.tsx`, wire into the "Art" tab

#### 3. Export Color Options (Tasks 5, 6)

Update `StampExportPage.tsx`:
- Add a **"Standard Export Colors"** section at the top of the export panel showing 5 mandatory colors with one-click download for each
- The `generateBundle` function should automatically include all 5 standard colors as sub-folders in the ZIP when the user downloads
- Custom user colors (from the generator's palette) should also appear alongside
- Ensure the "Multi-Color Pack" pre-selects the 5 standard colors by default

**Files**: `StampExportPage.tsx` (add standard colors, enhance ZIP generation)

#### 4. Preview Always Opens in Navy Ink (Task 5)

The generator default `primaryColor` is already `#1B3A8C` (navy ink). The export page defaults to `#1a2744` (dark navy). Align the export page default to `#1B3A8C` to match the standard.

### Files Summary

| File | Change |
|------|--------|
| `StampGeneratorPage.tsx` | Add "Standard Export Colors" locked row, palette save to DB, per-letter monogram color state, wire MonogramColorEditor into Art tab |
| `StampExportPage.tsx` | Add standard colors section, pre-select 5 mandatory colors in ZIP, align default to `#1B3A8C` |
| New: `MonogramColorEditor.tsx` | Letter-by-letter color picker for monogram center content |
| `injectCenterArt` function | Support per-letter `fill` via `<tspan>` elements |

### Implementation Order

1. MonogramColorEditor component + injectCenterArt update
2. Standard Export Colors in generator (locked 5-color row)
3. Standard Export Colors in export page + enhanced ZIP
4. Palette save/load to database
5. Align navy ink defaults

