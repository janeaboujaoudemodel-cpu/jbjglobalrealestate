
## Problem

Right now `ProjectCard` and `ReellyProjectCard` only render the developer logo overlay when `developers.logo_url` exists. **396 of 633 developers** in the database have no `logo_url`, so their cards render **nothing** — the client cannot see who built the project.

We will:

1. Guarantee attribution on every card with a branded **developer name plate** fallback.
2. Add an **admin "Missing Logos" queue** under /admin so you can review and upload real logos.
3. Add an **automated logo enrichment** edge function that uses Firecrawl (already configured) to find each developer's official logo from their website / search results, save it to the `developer-logos` storage bucket, and write it back to `developers.logo_url` — pending your approval.

The locked rules in `src/utils/developerLogo.ts` (no project photos, screenshots, WhatsApp images, etc. as logos) stay enforced — auto-enriched candidates go through the same allow-list and queue.

---

## What changes

### 1. UI — name-plate fallback (frontend only)

Add a third variant `nameplate` to `src/components/ui/DeveloperLogo.tsx`:

- Champagne tile (`#FDFBF7`) with a 1px gold hairline (`#B89555` / 45%) — matches `bare` variant dimensions (h-12 w-16) so layout doesn't shift.
- Renders the developer's **name** as a clean Inter wordmark, auto-fitted (1 line, `text-[10px]` to `text-xs`, tracking-tight, ink `#1A1A1A`).
- Drop-shadow so it reads cleanly on top of card photos.

Update `ProjectCard.tsx` and `ReellyProjectCard.tsx`:

- Replace `getDeveloperLogoUrl(...) && <DeveloperLogo .../>` with **always-render** logic:
  - If a valid `logo_url` exists → render `<DeveloperLogo variant="bare" />` (current behaviour).
  - Else if developer **name** is known → render `<DeveloperLogo variant="nameplate" name={...} />`.
  - Else → render nothing (no developer in DB at all — a true edge case).
- Fix the existing `top-[60px]` badge offsets to use the new "logo present" check (logo OR nameplate).
- No other card content moves; the strict "No Removal" policy is honoured.

### 2. Admin — "Missing Logos" queue

New tab in `/admin/developers` (or a new sibling route `/admin/developers/missing-logos`):

- Lists all developers where `logo_url IS NULL OR logo_url = ''` (currently 396 rows), sorted by # of published projects DESC so the highest-impact gaps are fixed first.
- Each row shows: developer name, slug, project count, last enrichment status, and three actions:
  - **Upload logo** (file input → uploads to `developer-logos` storage bucket → writes URL to `developers.logo_url`, status `approved`).
  - **Auto-find logo** (invokes the new edge function for just this developer; shows candidate previews; you pick one to approve).
  - **Mark as no logo available** (sets a `logo_status = 'unavailable'` flag so the row stops appearing in the queue but cards still get the nameplate fallback).
- Bulk action: "Auto-find logos for next 25" — runs the enrichment edge function in a batch.

### 3. Database — pending-logo workflow

New columns on `developers` (migration):

- `logo_status` text default `'missing'` — values: `missing | pending_review | approved | unavailable`.
- `logo_candidates` jsonb — array of `{ url, source, fetched_at }` proposed by the enrichment function. Owner picks one in the admin UI to promote to `logo_url`.
- `logo_last_attempt_at` timestamptz — so the queue can show "tried 2h ago".

Migration also backfills `logo_status = 'approved'` for the 237 developers that already have a valid `logo_url`.

RLS: read/write restricted to owner/admin (matches existing `developers` policies).

### 4. Edge function — `auto-find-developer-logos`

New function modelled on the existing `auto-find-developer-images`:

1. Pulls `batch_size` developers where `logo_status IN ('missing','pending_review')` ordered by published-project count.
2. For each:
   - Firecrawl **search** for `"{dev name} Dubai developer official site"` → take top 3 result URLs.
   - Firecrawl **scrape** with `formats: ['branding','links']` on the most likely official site (filter out aggregators like reidin / propertyfinder / bayut).
   - Collect candidate URLs in this priority order:
     1. `branding.logo` (Firecrawl's brand extractor).
     2. `branding.images.logo` / `branding.images.favicon`.
     3. Any `<link rel="icon">` from `links` that looks like a real logo (skip 16×16 favicons).
3. Run every candidate through `isValidDeveloperLogoUrl()` (existing allow-list) — anything matching the forbidden patterns (screenshots, project photos, WhatsApp, etc.) is dropped.
4. Download surviving candidates, re-upload them to the `developer-logos` Supabase storage bucket (so we own the asset), and store the public URLs in `developers.logo_candidates`.
5. Set `logo_status = 'pending_review'` and `logo_last_attempt_at = now()`. **Does NOT auto-promote** — owner approval in the admin UI is required (matches the "No Photo → No Publish" pattern of human gating).

The function uses `requireOwnerAuth` and is callable from the admin UI only.

### 5. Cron (optional, owner-gated toggle)

A `pg_cron` job that runs `auto-find-developer-logos` with `batch_size = 25` every 6 hours, until the queue is empty. Disabled by default; you enable it from the admin queue with a single toggle.

---

## Files to add / change

```text
src/components/ui/DeveloperLogo.tsx           (add `nameplate` variant)
src/components/ProjectCard.tsx                (always-render developer mark)
src/components/ReellyProjectCard.tsx          (same)
src/pages/admin/MissingLogosQueue.tsx         (new — admin queue UI)
src/routes/AdminRoutes.tsx                    (register /admin/developers/missing-logos)
src/pages/AdminDevelopers.tsx                 (add "Missing Logos (396)" tab link)
supabase/functions/auto-find-developer-logos/index.ts   (new)
supabase/migrations/<ts>_developer_logo_workflow.sql    (new columns + RLS + backfill)
```

No existing feature is removed — the locked `developerLogo.ts` allow-list and `DeveloperLogo` rules continue to govern what counts as a valid logo.

---

## Out of scope (explicit)

- No change to project cover/photo logic.
- No change to the existing Building2 fallback used in CRM/admin tiles.
- No public-facing "submit your logo" form — only owner/admin can promote a logo to `logo_url`.

Approve this plan and I'll start with the migration, then ship the UI nameplate, then the admin queue + edge function in that order so the cards stop looking blank immediately while the backfill catches up.
