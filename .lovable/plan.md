

# Session — Standard Preview Lock + Generated Design Sidebar Logic

## Current State Analysis

The architecture is already **80% correct**. The key primitives exist:
- `standardConcept` state (line 106) pins the working design
- `StampRightPanel` renders a "Standard Model" card at the top (lines 156-191)
- `handleSelectConcept` correctly swaps: old standard → concepts list, clicked → new standard (lines 591-633)
- Center preview is always driven by `activeStandard` (lines 862-865) — never by generated concepts directly
- `generateConcepts` already preserves `standardConcept` (only sets if `!standardConcept`, lines 539/554)
- No route changes during generation — right panel is already in-place

### Remaining Issues (4 specific bugs)

**Bug 1**: `generateConcepts` calls `setConcepts(newConcepts)` (lines 538, 553) which **replaces** all existing concepts. On regenerate, previous generated concepts are wiped.

**Bug 2**: `StampVariationsPanel` uses `absolute inset-0 z-20` (line 48) which overlays the **entire right panel**, covering the Standard Model card and creating a "full screen takeover" feel.

**Bug 3**: No status labels on center preview or right panel cards to indicate what the user is seeing (Active Preview, Standard Model, Generated Concept, Applied Concept).

**Bug 4**: No explicit "Lock as Standard" / "Save as Standard Base" action button. The user cannot manually protect their current design before generating.

## Implementation Plan

### 1. Fix Regenerate to Append, Not Replace (`StampGeneratorPage.tsx`)

In `generateConcepts`:
- Change `setConcepts(newConcepts)` → `setConcepts(prev => [...newConcepts, ...prev.filter(c => !newConcepts.some(n => n.id === c.id))])`
- Same for the client fallback path (line 553)
- This preserves previous generations while adding new ones at the top

### 2. Fix StampVariationsPanel Overlay (`StampVariationsPanel.tsx`)

- Remove `absolute inset-0 z-20 bg-white/95 backdrop-blur-sm` from the root div
- Replace with normal flow layout (`flex flex-col h-full`) since it's already inside a `TabsContent` container
- This keeps it contained within its tab without covering the entire panel

### 3. Add Preview State Labels

**Center preview** (`StampGeneratorPage.tsx`, above the stamp render):
- Show a small badge: "Active Preview" (always) or "Standard Model" if it matches `standardConcept`
- Show "Generating..." indicator that does NOT replace the preview

**Right panel concept cards** (`StampRightPanel.tsx`):
- Standard Model card already has a "Standard" badge — keep it
- Add "Applied" badge on the card matching `selectedId`
- Add "Generated" label on non-standard concept cards

### 4. Add "Lock as Standard" Action

**Center preview bottom toolbar** (`StampGeneratorPage.tsx`, line ~1123):
- Add a "Lock as Standard" button (Shield icon) that:
  - Calls `setStandardConcept(selectedConcept)` (which is already the active standard, so this is mainly a persistence action)
  - Saves the current SVG override to DB immediately
  - Shows toast "Design locked as Standard Base"
  - This gives the user explicit control before generating

**Right panel header** (`StampRightPanel.tsx`):
- Add "Set as Standard" option on each concept card's action row (already has Apply button which does this via `onSelect` — just add a label clarification)

### 5. Protect Standard from Deletion (`StampGeneratorPage.tsx`)

Line 1184 already blocks deletion of standard: `if (standardConcept?.id === c.id) return;` — this is correct. No change needed.

## Files Modified

| File | Changes |
|------|---------|
| `StampGeneratorPage.tsx` | Append-not-replace in generateConcepts, add preview status label, add Lock as Standard button |
| `StampVariationsPanel.tsx` | Remove absolute overlay positioning, use normal flow |
| `StampRightPanel.tsx` | Add Applied/Generated labels on cards |

## What Will NOT Change
- StampLeftPanel, StampProjectHeader, StampCanvasControls
- StampInteractivePreview, StampSVGRenderer
- Route structure
- Database schema
- Edge functions

