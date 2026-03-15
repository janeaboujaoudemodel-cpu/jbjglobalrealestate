

# Session — AI Design Library Behavior + History + Restore + Favorites

## Current State

The right panel (`StampRightPanel.tsx`, 728 lines) already has 5 functional tabs: **Concepts, Favorites, Variations, Library, History**. Core mechanics work:
- Standard Model is pinned at top of Concepts with gold border and Shield badge
- Favorites toggle works via `toggleFavorite` with DB persistence
- Variations panel generates and displays AI variations
- Library loads Projects, Presets, Brand Assets from DB
- History loads `stamp_designs` versions with Use/Copy actions
- Regenerate appends (doesn't replace) concepts
- "Lock as Standard" button exists in bottom toolbar
- Labels ("Standard", "Applied", "Generated") exist on cards

### What's Missing

1. **No dedicated Standard tab** — standard is embedded in Concepts, not separately viewable
2. **No compare mode** — cannot side-by-side compare two designs
3. **History lacks restore/compare/save-to-library/favorite actions** — only has Use and Copy
4. **No visual hierarchy differentiation** — all concept cards look identical regardless of state
5. **ConceptCard has conflicting badge logic** — line 701 always shows a badge at `top-1 left-1`, overlapping with the heart button also at `top-1 left-1`
6. **History items lack source labels** (manual/generated/restored) and timestamps are minimal

## Implementation Plan

### 1. Add Standard Tab (StampRightPanel.tsx)

Add a 6th tab "Standard" as the first tab. Content:
- Full-size render of the standard model (larger than thumbnail)
- Label, template key, creation info
- Actions: Edit, Export, Duplicate, Compare
- "This is your locked reference design" explanatory text
- If no standard exists, show empty state with "Generate or lock a design first"

Tab order: Standard | Concepts | Favorites | Variations | Library | History

### 2. Fix Badge Overlap in ConceptCard (StampRightPanel.tsx)

The badge at line 701 (`absolute top-1 left-1`) overlaps with the heart button at line 682 (`absolute top-1 left-1`). Move the badge to `bottom-1 left-1` on the thumbnail area, and keep the heart at `top-1 left-1`.

### 3. Add Compare Mode (StampRightPanel.tsx + StampGeneratorPage.tsx)

Add a `compareDesign` state in StampGeneratorPage. When set, the center preview splits into two side-by-side renders:
- Left: current active preview (standard)
- Right: the design being compared
- Labels underneath each
- "Close Compare" button

Trigger compare from: History cards, Concept cards, Favorites cards via a new "Compare" button.

New prop to StampRightPanel: `onCompare: (concept: StampDesignConcept) => void`

### 4. Enhance History Tab (StampRightPanel.tsx — HistoryList component)

Add to each history card:
- **Restore** button (already "Use" — rename to "Restore" for clarity)
- **Compare** button → calls `onCompare` with this version
- **Save to Library** → saves as brand asset via `brand_assets` insert
- **Favorite** → toggles `is_favorite` on the `stamp_designs` row
- **Source badge**: show "Manual", "Generated", or "Restored" based on `template_key` heuristic
- **Better timestamps**: relative time ("2 hours ago") for recent, date for older

New props to HistoryList: `onCompare`, `onSaveToLibrary`, `onToggleFavorite`

### 5. Visual Hierarchy for Cards

Differentiate card borders/backgrounds:
- **Standard**: gold border-2, gold glow shadow (already done)
- **Applied/Active**: blue border-2, blue check
- **Favorite**: rose-tinted border
- **Generated**: default muted border
- **Historical**: dashed border style

### 6. Enhanced Card Actions

Add to ConceptCard's action row:
- Compare button (small icon)
- Save to Library button (small icon, calls `onSaveToLibrary`)

New props: `onCompare`, `onSaveToLibrary`

### 7. Empty States (already partially done, enhance)

- Standard tab: "No standard model yet. Generate concepts or lock your current design."
- History: Already has "No version history yet" — add icon + CTA
- Favorites: Already has empty state — good
- Variations: Already has empty state — good

## Files Modified

| File | Changes |
|------|---------|
| `StampRightPanel.tsx` | Add Standard tab, fix badge overlap, add compare/save-to-library actions to cards and history, visual hierarchy styles |
| `StampGeneratorPage.tsx` | Add `compareDesign` state, split center preview for compare mode, pass `onCompare`/`onSaveToLibrary` props to right panel |

## What Will NOT Change
- StampLeftPanel, StampProjectHeader, StampCanvasControls, StampInteractivePreview
- Database schema (uses existing `stamp_designs`, `brand_assets` tables)
- Route structure — everything stays in-place
- Edge functions

## Known Limitations
- History source detection (manual vs generated) uses a heuristic based on `template_key` since we don't currently store a `source` column. A future migration could add this field for precision.
- Compare mode is visual only (side-by-side renders). Pixel-diff or overlay comparison is not included in this scope.

