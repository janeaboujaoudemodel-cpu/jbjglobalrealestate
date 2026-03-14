

## Session 9 — AI Generation Engine + Standard Preview Protection

### Analysis of Current Issues

After reviewing `StampGeneratorPage.tsx` (978 lines) and `StampRightPanel.tsx` (445 lines), the core problems are:

1. **No "Standard Model" concept** — There's no persistent T0 reference. `selectedId` picks any concept, and `generateConcepts()` calls `setConcepts(clientConcepts)` which replaces the entire list, losing the current preview.
2. **Generation replaces preview** — `generateConcepts()` sets `generating=true` which shows a spinner in the center canvas, hiding the current design. Line 710-714: the center shows `<Loader2>` when `generating` is true.
3. **No standard pinned in right panel** — The concepts grid treats all designs equally. No pinned "Standard" card at position 0.
4. **Selection swap logic missing** — When clicking a generated design, it just sets `selectedId`. There's no mechanism to preserve the previous preview as the new "Standard" reference.
5. **Navy ink not enforced** — Generated concepts use whatever `primaryColor` is set to, but there's no enforcement that new generations start at `#1B3A8C`.

### Implementation Plan

#### 1. Introduce `standardConcept` state

Add a dedicated `standardConcept: StampDesignConcept | null` state that holds the T0 (first generated) design. This is the "working design" and is **never cleared** by generation.

- On first load / initial generation, set `standardConcept = concepts[0]` (the owner-official-standard T0)
- `selectedId` defaults to `standardConcept.id`
- The center preview always shows `standardConcept` unless the user explicitly selects a different concept

#### 2. Fix generation to not replace preview

Modify `generateConcepts()`:
- Set a separate `generatingInPanel` flag instead of `generating` for the right panel skeleton loaders
- **Do not** show spinner in center canvas during regeneration — keep showing the current `standardConcept`
- Append new concepts to the list rather than replacing
- After generation completes, the standard remains in the center; new designs appear in the right panel

#### 3. Pin Standard in right panel

Modify `StampRightPanel` Concepts tab:
- Always render the standard concept as the **first card** with a "Standard" badge and distinct gold border
- The standard card is not deletable
- Remaining concepts follow in the paginated grid

Add a new prop `standardConcept` to `StampRightPanel`.

#### 4. Selection swap logic

When user clicks a generated design card ("Apply" / click):
- The clicked design becomes the new center preview (`selectedId = clicked.id`)
- The **previous** `standardConcept` moves into the concepts list (if not already there)
- The clicked design becomes the new `standardConcept`
- Toast: "Design applied as Standard"

This ensures the user never loses their previous working design.

#### 5. Download always exports Standard by default

The export button and `confirmSelectAndExport` use `standardConcept` as the default:
- If no explicit selection override, export `standardConcept`
- If user explicitly selected a different concept in the right panel, export that one

#### 6. Navy ink enforcement on generation

In `generateConcepts()` and `generateVariations()`:
- All generated SVGs use `#1B3A8C` as the base color token
- The user's current `primaryColor` is applied via the renderer, not baked into generated SVGs

#### 7. Full editability of applied designs

Already works — once a design is selected via `setSelectedId`, the `StampInteractivePreview` renders it with all editing capabilities. No changes needed here, just verify the swap logic passes the correct SVG.

### Files to Modify

| File | Change |
|------|--------|
| `StampGeneratorPage.tsx` | Add `standardConcept` state, split `generating` into center vs panel flags, implement swap logic, enforce navy ink on generation, fix export default |
| `StampRightPanel.tsx` | Add `standardConcept` prop, render pinned Standard card first with badge, prevent deletion of standard |

No new files. No database changes.

