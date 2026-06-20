# Auto-enrich every project in the background

## What you'll see
- The "Enrich bedrooms" button and dialog on the owner provenance card disappear completely. No more one-by-one prompts.
- Enrichment runs silently 24/7 in the background and keeps every project topped up — images, documents, amenities, payment plans, POIs, videos, floor plans, unit types, service charge, descriptions, highlights, ROI **and** bedrooms (min/max + types).
- Only approved sources are used: developer-direct (Reelly partner API + developer websites) and Provident. Property Finder / Bayut / Dubizzle are removed entirely.

## Changes

### 1. Remove the bedroom-enrich UI (no feature loss, the work moves to the background)
- `src/components/project-detail/owner/OwnerProvenanceCard.tsx` — drop the "Enrich bedrooms" button, the `EnrichBedroomsDialog` import and state.
- `src/components/project-detail/owner/EnrichBedroomsDialog.tsx` — delete file.
- Memory file `bedroom-enrichment.md` — update to reflect background-only flow.

### 2. Fix the source-allowlist violation in `enrich-project-bedrooms`
Current function scrapes Property Finder + Bayut — banned by the no-secondary-source-scraping rule.
- Rewrite `supabase/functions/enrich-project-bedrooms/index.ts` to read **only** from Reelly (`reelly_raw_data.typical_units` / `unit_blocks`) and Provident HTML (already whitelisted). No Firecrawl on PF/Bayut.
- Keep it as a helper called by the background runner, not exposed to UI.

### 3. Extend the background runner to do **full** enrichment, including bedrooms
File: `supabase/functions/background-enrichment-runner/index.ts`
- Add bedroom extraction from `typical_units` → write `bedrooms_min`, `bedrooms_max`, `bedroom_types` (Studio = 0) when missing.
- Broaden candidate query: include projects WHERE `reelly_id IS NOT NULL` OR `source_url ILIKE '%provident%'` OR `data_source = 'developer_direct'`. Skip anything blocked by `supabase/functions/_shared/sourceAllowlist.ts`.
- Re-run pass: drop the `!p.reelly_raw_data` filter — instead re-process projects where `detail_fetched_at` is null OR older than 30 days, so already-touched projects still get newly published fields.
- Keep the existing rate-limit (500 ms) and 200-line log cap.

### 4. Make it run automatically (no manual button click)
- New migration: enable `pg_cron` + `pg_net` (if not already), then schedule a cron job every 6 hours that POSTs to `background-enrichment-runner` with `{action:"start"}`. The function already no-ops when a job is already running, so overlap is safe.
- Add an "auto-trigger on publish" hook: a lightweight DB trigger on `projects` that, when `is_published` flips to true, calls `net.http_post` to the same edge function so newly published projects get enriched within minutes instead of waiting for the next cron tick.

### 5. Owner visibility (kept, not removed)
- `EnrichmentCenter` page stays as a read-only monitor: progress, counts, last run, errors. No "Enrich one project" actions surfaced anywhere on the listing pages.
- The owner notifications it already emits every 50 projects + on completion remain.

## Technical notes
- Approved-source guard lives in `supabase/functions/_shared/sourceAllowlist.ts` — every fetch path in the background runner and the rewritten bedrooms helper must call it before issuing a request.
- Cron SQL goes through the **insert** tool (contains project URL + anon key); schema changes (trigger function + extensions) go through the migration tool.
- No DB grants needed beyond the existing `enrichment_jobs` policies.
- `admin_edit_log` rows still get written for every applied field so Undo continues to work.

## Files touched
- delete `src/components/project-detail/owner/EnrichBedroomsDialog.tsx`
- edit `src/components/project-detail/owner/OwnerProvenanceCard.tsx`
- rewrite `supabase/functions/enrich-project-bedrooms/index.ts`
- edit `supabase/functions/background-enrichment-runner/index.ts`
- new migration: pg_cron + pg_net extensions, publish-trigger function
- insert: cron schedule row
- edit memory file `bedroom-enrichment.md`
