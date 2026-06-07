---
name: WebDev Versioning + Before/After + Restore Standard
description: Per-override version history with preview overlay and one-click restore for the owner WebDev dock
type: feature
---
# WebDev Versioning + Before/After + Restore

## Storage
- `public.owner_ui_override_versions` snapshots every change to `owner_ui_overrides` (selector, css, label, route_pattern, status, version_number, created_by, created_at, restored_from_version_id).
- Trigger `trg_snapshot_owner_ui_override` (AFTER INSERT/UPDATE) appends a row only when css/selector/route/label actually changed. Backfilled v1 for every existing override.
- RLS: owner/admin-only read+write (`has_role` check). authenticated grant; no anon access.

## UI surface
- `src/components/owner-webdev/WebDevVersionHistory.tsx` renders inside each request card in `WebDevDock` behind a collapsible "History" toggle.
- Per version row: version number, "current" badge on latest, relative time, first 6 CSS lines.
- **Preview**: temporarily injects the historical CSS via the existing `jbj:override-preview` event channel that `OwnerOverrideLoader` listens to. Cleared on toggle off, restore, or unmount.
- **Restore**: updates the live `owner_ui_overrides` row with the chosen version's css/selector/route/label and forces `status='approved'`. The snapshot trigger automatically records the restore as a new version. Dispatches `jbj:webdev-refresh` so the dock list reloads.

## Constraints
- Never bypass the trigger — always go through `owner_ui_overrides` updates so history stays append-only and auditable.
- Preview rows must use a synthetic `id: "preview-<versionId>"` so they can't be confused with live pending overrides.
- Owner-gating is inherited from the dock's existing `isOwnerEmail + authIsOwner + roleIsOwner` check; the history component is never mounted for non-owners.
