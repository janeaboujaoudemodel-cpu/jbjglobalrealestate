
Goal: Fix Business Card editor so it behaves like a real editable canvas (no duplicate “new” fields), supports reusable saved card info, reliably keeps typed data, and makes Front/Back actions visibly work.

What I found (root causes):
1) Edit Layout is currently dragging separate placeholder overlays (`≡ Name/Title/Company`) in `BusinessCardPreview.tsx` instead of the actual rendered text, which is why it feels like “new fields” are appearing.
2) `Set Front` / `Set Back` in `BusinessCardCenterPanel.tsx` set template values but do not switch active editing side or show clear active-state feedback per click, so users think nothing changed.
3) Typing instability comes from fragmented update paths (left inputs, inline editor, restore actions) with no draft guard/autosave recovery flow; there is no persistent draft buffer for active typing.
4) Typography controls are mostly global and partly disconnected from real per-field rendering, so section-by-section editing is incomplete.
5) Card info “presets/profiles” are not implemented as reusable user profiles.

Implementation plan

1) Stabilize state model for card text editing and prevent wipe-outs
- File: `src/components/corporate-suite/useBusinessCardState.ts`
- Introduce a single update API for card fields (e.g. `updateCardField(field, value)`), used by both left-panel inputs and inline editor.
- Add guarded draft persistence:
  - local draft key (business-card specific) with throttled autosave while typing
  - safe hydrate-on-mount only once (no re-hydrate during active typing)
- Add rollback-safe profile save/update/delete handlers (optimistic UI + rollback on error).
- Add `selectedField` + per-field config state (position/locked/hidden/deleted + style overrides) so edits are field-level, not global-only.
- Expand save/restore metadata to include new field config + typography/layout settings so saved cards reopen exactly as edited.

2) Add reusable “Card Info Profiles” (ready initials/info presets)
- Files:
  - `src/components/corporate-suite/useBusinessCardState.ts`
  - `src/components/corporate-suite/BusinessCardLeftPanel.tsx`
- Reuse existing authenticated `design_assets` storage (no new table required):
  - store profile rows as `asset_type = "business_card_profile"` with metadata containing card data + optional field style defaults.
- Left panel UI additions:
  - profile dropdown (Load profile)
  - Save New Profile
  - Update Current Profile
  - Delete Profile
  - Quick “New Blank” reset
- Applying a profile updates the live card immediately (automatic reflection).

3) Remove duplicate “new fields” in Edit Layout and drag real content
- File: `src/components/corporate-suite/BusinessCardPreview.tsx`
- Replace current draggable placeholder labels with draggable controls tied to actual text fields.
- In edit mode, show selection outlines/handles on existing rendered text blocks (not separate fake labels).
- Respect per-field lock/hidden/deleted:
  - locked = cannot drag/edit
  - hidden/deleted = not rendered
  - restore action re-enables field
- Keep logo drag behavior, but align it with same lock/edit model.

4) Make per-field style editing real (section-by-section)
- Files:
  - `src/components/corporate-suite/BusinessCardRightPanel.tsx`
  - `src/components/corporate-suite/BusinessCardPreview.tsx`
  - `src/components/corporate-suite/businessCardTypes.ts`
- Add “Field Inspector” in Typography panel:
  - choose field (name/title/company/phone/email/website/address)
  - edit color, size, weight, style, letter spacing, line height, alignment, underline per field
  - lock/hide/delete/restore controls per field
- Apply style overrides in renderer with fallback to global typography settings.

5) Fix Set Front / Set Back behavior and highlighting
- File: `src/components/corporate-suite/BusinessCardCenterPanel.tsx`
- On `Set Front` click:
  - set front template
  - also set active side to `front`
  - show active visual state
- On `Set Back` click:
  - set back template
  - also set active side to `back`
  - show active visual state
- Improve mobile/touch UX by making front/back assignment feedback always visible (not hover-only dependent).

6) Wire all edit inputs to same stable mutation path
- Files:
  - `BusinessCardLeftPanel.tsx`
  - `BusinessCardCenterPanel.tsx`
  - `useBusinessCardState.ts`
- Left-panel typed inputs and inline preview editor both call the same updater.
- Add lightweight debounce for expensive persistence only (not for on-screen typing), so typing stays instant and no “value bouncing”.

7) Keep save/export consistency
- File: `useBusinessCardState.ts` (+ if needed `businessCardExport.ts`)
- Ensure `handleSaveCard` stores full editable model (field configs + styles + profile linkage).
- Ensure restored cards match current preview layout/styling (no lost positions/styles after reload).

Technical details
- No backend schema migration is required for this scope; we can reuse existing `design_assets` table + current RLS (user-scoped).
- New profile asset payload will be versioned in metadata (`schema_version`) to keep backward compatibility with already saved card assets.
- Field config structure will be centralized in `businessCardTypes.ts` defaults to avoid scattered magic values.
- Drag system will be pointer-safe (mouse + touch), and lock-state checked before movement.

Acceptance checklist
1) Edit Layout no longer shows fake “new” company/title/name placeholders.
2) Dragging moves real visible text, and lock/hide/delete/restore works per field.
3) Front/Back buttons visibly switch and highlight the active side immediately.
4) Typing name/email/other fields does not clear or reset while editing.
5) User can save card info profile, load it later, edit and resave, or start new.
6) Saved card reload reproduces layout + typography + field-level customizations.
