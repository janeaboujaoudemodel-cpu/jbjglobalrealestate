## Goal

Auto-fill the 396 missing developer logos using Firecrawl + Google search, with strict "lock-and-don't-touch" protection for the 237 already-approved logos.

## Core rule: lock approved logos

Add a DB-level guard so nothing — not this function, not any cron, not any bulk script — can ever overwrite a logo that has `logo_status = 'approved'` unless the change comes from a manual owner action.

- Trigger `trg_protect_approved_logos` on `developers` BEFORE UPDATE of `logo_url`/`logo_status`:
  - If `OLD.logo_status = 'approved'` and the session is not the owner (checked via `has_role(auth.uid(),'owner')`), `RAISE EXCEPTION`.
  - Edge function gets a one-time bypass by setting `SET LOCAL app.allow_logo_overwrite = 'true'` only for rows where `OLD.logo_status <> 'approved'`. Approved rows are never touched, period.

## Edge function: `auto-find-developer-logos`

New function (does not modify existing `ai-find-developer-logos` or `find-developer-logos-v2` — those stay as fallback tools).

Pipeline per developer (batch of 25, hard filter `logo_status = 'missing'`):

1. **Firecrawl search** — query `"{developer name} Dubai real estate official site"`, take top 3 candidate domains, prefer `.ae` / brand-matching domains, exclude competitor portals (per existing `competitor-source-exclusion` standard).
2. **Firecrawl scrape with `formats: ['branding']`** on the chosen domain → returns `branding.logo` + `branding.images.logo` + favicon.
3. **Validation gate (100% match enforcement)** — a candidate is accepted only if ALL pass:
   - URL passes existing `isValidDeveloperLogoUrl()` allow-list
   - HEAD request returns 2xx, `content-type` is `image/png|svg+xml|webp|jpeg`, size between 2 KB and 2 MB
   - Image dimensions ≥ 64 px on the shorter side (downloaded + checked)
   - Domain root matches one of: developer's known website, `{slug}.ae`, `{slug}.com`, or the Firecrawl-returned canonical domain
   - Filename or `alt` contains a normalized token of the developer name (Levenshtein ≥ 0.8 against `slug`)
   - If any check fails → mark `logo_status = 'unavailable'`, `logo_last_attempt_at = now()`, move on. Never guess.
4. **Download & store** — fetch bytes, upload to `developer-logos` bucket at `{slug}/auto-{timestamp}.{ext}`, get public URL.
5. **Auto-approve write** — single UPDATE: `logo_url = <public_url>`, `logo_status = 'approved'`, `logo_last_attempt_at = now()`. Trigger allows it because `OLD.logo_status = 'missing'`.

Returns `{ processed, approved, unavailable, still_missing }`.

## Admin UI wiring (`/admin/developers/missing-logos`)

Already-built `MissingLogosQueue.tsx` gains:

- **"Auto-find next 25" button** → invokes `auto-find-developer-logos` with `batch_size: 25`, shows live counter, refreshes the queue.
- **"Auto-find ALL (run continuously)" toggle** → loops batches of 25 with 3-second spacing client-side until `still_missing = 0` or owner cancels.
- **"Missing Logos (N)" link button** added to `AdminDevelopers.tsx` header that deep-links to the queue and shows the live missing count badge.

## Optional cron (default OFF)

Owner-only toggle in queue page header: enable/disable a `pg_cron` job running `auto-find-developer-logos` every 6 hours with `batch_size: 25`. Stored as `app_settings.auto_logo_cron_enabled` boolean. Default off — user opts in.

## What is explicitly NOT touched

- The 237 rows with `logo_status = 'approved'` — DB trigger refuses any overwrite from any automated path. Only manual owner UI uploads (which set `app.allow_logo_overwrite = 'true'` explicitly and only when owner JWT is present) can change them.
- Existing functions `ai-find-developer-logos`, `find-developer-logos-v2`, `fix-developer-photos`, etc. — left as-is for manual fallback use.
- `DeveloperLogo.tsx` / `ProjectCard.tsx` nameplate fallback — already shipped, no changes.

## Files

- New: `supabase/functions/auto-find-developer-logos/index.ts`
- New migration: `trg_protect_approved_logos` trigger + function, `app_settings.auto_logo_cron_enabled` column
- Edit: `src/pages/admin/MissingLogosQueue.tsx` (add Auto-find + Run-all buttons + cron toggle)
- Edit: `src/pages/AdminDevelopers.tsx` (add Missing Logos link with live count)

## Acceptance

- Running the function on a missing developer either writes an approved real logo (100% validated) OR marks `unavailable` — never guesses.
- Attempting to UPDATE any `approved` row from the function raises `permission denied: approved logo is locked`.
- After full run, all 396 are either `approved` (real scraped logos) or `unavailable` (where no verified logo could be found — these keep showing the nameplate fallback).