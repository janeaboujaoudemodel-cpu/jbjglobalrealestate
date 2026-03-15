

# Session — Save System + Presets + Drafts + Brand Assets Integration

## Current State Analysis

The save system already has **significant infrastructure** in place:

1. **Save Project** (`saveProjectState`): Persists standard design + style overrides to `stamp_projects.layout_json` and `stamp_designs` table. Shows `StampSaveDialog` on success.
2. **Save Asset** (`saveCurrentAsBrandAsset`): Inserts into `brand_assets` table with `asset_type: 'stamp'`.
3. **Save Preset** (`handleSavePreset` in `StampLibraryPanel`): Saves to `stamp_presets` table with `config_json` containing SVG + template key. Owner-only.
4. **History**: Loads from `stamp_designs` with restore/compare/favorite/save-to-library actions.
5. **Library tab**: Shows Projects, Style Presets, Brand Assets — all DB-backed.

### What's Missing

**Bug 1**: No auto-save. If the session crashes, all unsaved work is lost. The `localStorage` persistence covers individual controls (color, font) but NOT the full design state (SVG overrides, standard concept, concepts list).

**Bug 2**: No "Save Draft" button distinct from "Save Project". The current "Save" button always opens the post-save dialog, implying finality. Users need a quiet "Save Draft" that just persists without ceremony.

**Bug 3**: The header has "Save" and "Save Asset" buttons but no "Save Preset" button — presets are hidden inside the Library tab only.

**Bug 4**: No type labels on the `StampSaveDialog` or header to distinguish what kind of save happened.

**Bug 5**: The `StampLibraryPanel` queries `stamp_presets` with `as any` casts and no `user_id` filter — all presets are visible to all users, violating owner-only privacy.

**Bug 6**: No search/filter in the Library tab.

**Bug 7**: No archive system — only soft-delete exists for `stamp_designs`.

## Implementation Plan

### 1. Auto-Save Draft to localStorage (StampGeneratorPage.tsx)

Add a debounced auto-save effect (every 30 seconds or on significant changes):
- Key: `stamp-autosave-${projectId}`
- Saves: `{ svgOverrides, standardConcept, concepts, selectedId, timestamp }`
- On page load, check for auto-save. If newer than DB data, show "Resume unsaved changes?" toast with Restore/Discard.
- Auto-save does NOT touch the database — it's a crash recovery mechanism only.

### 2. Split Save Actions in Header (StampProjectHeader.tsx)

Replace the single "Save" button with a dropdown that has 3 clear options:
- **Save Draft** — quiet save to DB (`saveProjectState` without dialog), shows "Draft saved" toast
- **Save Design** — full save with dialog confirmation (current behavior)
- **Save as Preset** — saves current config to `stamp_presets` (moves from Library tab to header)

Keep "Save Asset" as a separate button (already exists).

### 3. Save Draft vs Save Design (StampGeneratorPage.tsx)

Add `saveDraft` function:
- Same DB persistence as `saveProjectState` but skips `setShowSaveDialog(true)`
- Shows subtle toast "Draft saved" instead

Modify `saveProjectState` → rename to `saveDesign`:
- Keeps the dialog flow
- Adds a `save_type: 'design'` marker to the DB record

### 4. Fix Preset Privacy (StampRightPanel.tsx — StampLibraryPanel)

Add `user_id` filter to preset query:
```sql
.eq('user_id', user.id)
```
This ensures custom presets are private to the creating user.

### 5. Enhanced Save Dialog (StampSaveDialog.tsx)

Add save type indicator to the dialog:
- Show badge: "Draft", "Design", or "Preset" based on what was saved
- Add "Save as Asset" quick action in the dialog for converting the just-saved design into a brand asset

### 6. Search & Filter in Library (StampRightPanel.tsx — StampLibraryPanel)

Add a search input at the top of the Library tab:
- Filters Projects by `company_name`
- Filters Presets by `name`
- Filters Assets by `name`
- Client-side filtering on already-loaded data (no extra queries)

### 7. Archive Support (StampRightPanel.tsx — StampLibraryPanel)

For Projects and Assets, add "Archive" action:
- Sets `deleted_at` timestamp (soft-delete) — already exists in `stamp_projects` schema
- Add "Show Archived" toggle that reveals archived items with "Restore" option

### 8. Type Labels on All Library Cards

Add visual badges to every card in the Library:
- Projects: `Draft` badge (muted blue)
- Presets: `Preset` badge (gold)
- Assets: `Asset` badge (emerald)

## Files Modified

| File | Changes |
|------|---------|
| `StampGeneratorPage.tsx` | Add auto-save effect, split `saveDraft` / `saveDesign`, pass new props to header |
| `StampProjectHeader.tsx` | Replace single Save with dropdown (Save Draft / Save Design / Save as Preset) |
| `StampSaveDialog.tsx` | Add save type badge, add "Save as Asset" quick action |
| `StampRightPanel.tsx` | Fix preset privacy filter, add search input, add archive toggle, add type badges |

## What Will NOT Change
- Database schema (all tables already exist: `stamp_projects`, `stamp_designs`, `stamp_presets`, `brand_assets`)
- Edge functions
- Route structure
- StampLeftPanel, StampCanvasControls, StampInteractivePreview

## Known Limitations
- Auto-save uses localStorage, limited to ~5MB. For projects with many large SVG overrides, auto-save will store only the standard concept + selected SVG to stay within bounds.
- Cross-tool sync (Task 15 — updating stamps in letterheads when the asset changes) requires a notification system not currently built. This session will add the "Save Asset" integration but not the downstream sync notification. That is a separate future task.

