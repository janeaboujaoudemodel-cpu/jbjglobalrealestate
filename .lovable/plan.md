## Goal
Close the "published with broken image" gap by hardening the publish trigger to reject obviously invalid image URLs, and backfilling existing rows so anything currently published with a bad URL gets unpublished and surfaced in /admin → Needs Photo.

## Scope
- DB-only change (migration). No frontend code changes.
- Respects existing `trg_enforce_no_publish_without_photo` rule and "No Photo → No Publish" memory.
- Affects `projects` table (cover/card image columns) and `project_images` gallery rows used by the existing trigger.

## Changes

### 1. New SQL helper: `public.is_valid_image_url(text)`
Returns `false` when the URL is:
- NULL, empty, or whitespace-only
- Not starting with `http://` or `https://`
- Pointing to `localhost`, `127.0.0.1`, `0.0.0.0`, `::1`, or `.local`
- A known-dead/placeholder pattern: `example.com`, `placeholder`, `undefined`, `null`, `data:`, `blob:`, ends in `/`, or contains `via.placeholder`, `lorempixel`, `dummyimage` (kept conservative)
- Marked `STABLE` so it can be used in triggers safely.

### 2. Update `trg_enforce_no_publish_without_photo`
Replace the "string exists" check with `is_valid_image_url(...)` for:
- `cover_image_url`
- card image column
- any row in `project_images` for the project

Behavior unchanged otherwise: blocks `UPDATE`/`INSERT` that sets `is_published=true` without at least one valid image. Auto-unpublish on last-image delete continues to work (now keyed on valid URLs).

### 3. One-shot backfill (same migration)
- For every `projects` row where `is_published = true` AND no valid image exists across cover/card/gallery → set `is_published = false`.
- Log affected IDs into existing `audit_logs` (or equivalent) with action `auto_unpublish_invalid_image` so the change is traceable.
- These rows will then naturally appear in `/admin → Listings Approval → "Needs Photo"` tab (already wired to the same predicate).

### 4. No schema removals, no RLS changes, no edits to reserved schemas.

## Out of scope (explicitly)
- No live HTTP 404 probing in this migration (that's option b — separate job).
- No changes to ProjectCard / VerifiedMedia UI.
- No new admin tab — existing "Needs Photo" tab already covers it.

## Verification after apply
1. `SELECT count(*) FROM projects WHERE is_published AND NOT is_valid_image_url(cover_image_url) AND ...` → expect 0.
2. Try `UPDATE projects SET is_published=true WHERE id=<row with bad url>` → expect trigger error.
3. Open `/admin → Listings Approval → Needs Photo` → previously-broken listings now appear there.

## Risk / rollback
- Backfill is reversible by re-publishing once a valid image is attached (normal flow).
- Helper function is additive; trigger change is a single `CREATE OR REPLACE`, easy to revert via follow-up migration.

Confirm and I'll ship the migration.
