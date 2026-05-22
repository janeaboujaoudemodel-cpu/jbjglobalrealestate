# No-Photo → No-Publish Rule

A photoless project must never appear on the public site. Today this is enforced only by an admin button (`Approve` disabled when missing). It needs to be a hard rule at every layer, plus the existing data needs to be cleaned and surfaced for your review.

## Scope (verified against live DB)

- `projects` table (1,373 published) — already 0 published with truly no image, but the **rule is not locked**, so the next bulk import can re-publish photoless rows.
- `resale_listings` / `rental_listings` — currently empty, but same rule will apply preventively via a shared check.
- "Has a photo" means **any one of**: `cover_image_url`, `card_image_url`, or at least 1 row in `project_images` for that project.

## What changes

### 1. Database — hard lock (migration)

- Add `public.project_has_photo(project_id uuid)` SECURITY DEFINER function returning true when cover/card url is non-empty OR a `project_images` row exists.
- Add `BEFORE INSERT OR UPDATE` trigger on `projects` that, whenever `is_published` is being set to `true`, calls `project_has_photo()` and `RAISE EXCEPTION 'Cannot publish: project has no photo'` if false.
- Add the same check as a `BEFORE INSERT` trigger on `project_images` deletions: when the last image is deleted from a currently-published project, auto-flip `is_published=false` and write a row to `project_audit_logs` with action `auto_unpublished_no_photo`.
- Mirror trigger on `resale_listings`/`rental_listings`: block `status='active'` when `images` is null or empty.

### 2. Data backfill (same migration, single transaction)

- `UPDATE projects SET is_published = false WHERE is_published = true AND NOT project_has_photo(id)` — currently 0 rows, but executed defensively.
- For the 70 unpublished imageless projects: leave `is_published=false`, mark them in a new column `needs_photo boolean GENERATED ALWAYS AS (NOT project_has_photo(id)) STORED` — or, simpler, just rely on the existing media-status logic in the admin UI. **Recommendation: skip the generated column**, the admin tab in step 4 derives it live so we don't fight Postgres immutability.
- Insert one `project_audit_logs` row per backfilled project with reason `backfill_no_photo_lock` so you have an audit trail.

### 3. Frontend — defense in depth

In `src/hooks/useProjects.ts`, every query that already filters `is_published=true` (lines 214, 291, 314, 391, 406, 421) also adds:

```ts
.or('cover_image_url.not.is.null,card_image_url.not.is.null')
```

Plus a client-side `hasPhoto(p)` guard right before returning the list, so any race-condition row that lacks both URLs is hidden even if the DB trigger somehow accepted it (belt + braces). Gallery-only projects stay visible because their cover/card is hydrated by the existing media-management flow.

### 4. Admin panel — "Needs Photo" review queue

In `src/pages/admin/ListingsApproval.tsx`:

- Add a third tab `Needs Photo` alongside `Pending` / `Approved`, defaulting to the count badge.
- Query loads all projects (published OR not) where media-status === `missing`, ordered by `updated_at DESC`, limit 500.
- Each row shows the existing `MediaStatusBadge` + an `Add Photos` button that deep-links to `/listing-admin?project=<id>&tab=media` so you can paste/upload.
- `Approve` button stays disabled for missing-media rows (already implemented).
- Add a top-of-page banner: `N listings hidden from the public site because they have no photo. Review below.`

### 5. Memory + docs

- Append a new constraint memory `mem://constraints/no-photo-no-publish-rule` summarizing the trigger, the frontend guard, and the admin tab.
- Update the existing `mem://features/properties/search-integrity-standard` note to clarify: search still does not filter by photo presence, because the publish gate now guarantees every published row has one.

## Out of scope

- Validating that the URL actually resolves to an image (broken CDN links). That's a separate health-check job.
- Touching the `developer_project_submissions` draft flow — drafts are never public, so the gate only fires at the moment a submission is promoted into `projects`.

## Technical notes

- Trigger fires on every UPDATE; cheap because `project_has_photo` is a single index lookup on `(project_id)`.
- `project_images` should have an index on `project_id` — verify and add if missing.
- The frontend `.or(...)` filter is compatible with PostgREST and won't change pagination counts because counts are recomputed against the filtered set.
