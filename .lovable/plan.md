

## Fix Arc Spreads: Edge-to-Edge for All Arcs + Match Style Button

### Problem
- Arabic company name arc is not as expanded as English — it should match edge-to-edge fullness
- Location arc text is not spanning the full half-arc (edge to edge)
- No way to click one arc and "match" its style to the other language

### Changes

**1. `src/lib/stampOfficialTemplate.ts`**
- Change `ARC_SPREAD_LIMIT` from `0.88` to `0.98` (near-full semicircle = true edge-to-edge)
- Set default `arabicSpread` and `englishSpread` to both use `ARC_SPREAD_LIMIT` (0.98) so all arcs fill edge-to-edge by default
- Location arcs: add a dedicated `locationArcSpread` config field (default 0.98) so location text also spans edge-to-edge independently
- Ensure Arabic base font size matches English proportionally (both ~15px base for company arcs)

**2. `src/components/stamp-generator/StampProjectWizard.tsx`**
- Update defaults: `arabic_arc_spread: 98`, `english_arc_spread: 98`
- Add `location_arc_spread: 98` to form state
- Add a "Match Arabic ↔ English" button in the arc controls that copies spread, letter-spacing, and font-size settings from one language to the other

**3. `src/components/stamp-generator/StampGeneratorPage.tsx`**
- Update default `arabicArcSpread` from `0.88` to `0.98`
- Update default `englishArcSpread` from `0.88` to `0.98`
- Add `locationArcSpread` state (default 0.98)
- Pass "Match Style" callback to the editing panel

**4. `src/components/stamp-generator/StampInteractivePreview.tsx`** (or relevant toolbar)
- Add a "Match with English" / "Match with Arabic" button to the floating toolbar when an arc text element is selected
- Clicking it copies the spread, letter-spacing, and font weight from the opposite language arc

### Result
- All arcs (Arabic, English, location) default to edge-to-edge (0.98 spread)
- Users can click any arc and press "Match" to synchronize styles between languages
- Location arc fills the full half-circle by default

