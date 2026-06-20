---
name: Project Bedroom & Full Auto-Enrichment
description: All projects auto-enrich (images, docs, amenities, payment plans, POIs, videos, units, floor plans, service charge, descriptions, highlights, ROI AND bedrooms) silently in the background from approved sources only (Reelly partner API + Provident + developer-direct). No per-project UI.
type: feature
---
- Background runner: `supabase/functions/background-enrichment-runner/index.ts` pulls from the Reelly partner API and writes any missing fields on `projects` (including `bedrooms_min`, `bedrooms_max`, `bedroom_types` derived from `typical_units[].bedrooms`; Studio = 0). Never overwrites manually-set values.
- Candidate query: published projects with `reelly_id` whose `detail_fetched_at` is null OR older than 30 days, oldest-first, batched 2000.
- Scheduling: pg_cron job `background-enrichment-runner-6h` (every 6h) + DB trigger `trg_enrichment_on_publish` on `public.projects` (fires when `is_published` flips to true) both POST to the edge function. The function no-ops if a job is already running.
- Per-project helper `supabase/functions/enrich-project-bedrooms/index.ts` is Reelly-only (NO Property Finder/Bayut/Driven scraping — that path was permanently removed per mem://constraints/no-secondary-source-scraping). Auth-gated to owner/admin; supports preview + apply with `admin_edit_log` for Undo.
- No UI: the "Enrich bedrooms" button on `OwnerProvenanceCard` was removed. Owners monitor progress on the read-only `EnrichmentCenter` page; +50 progress + completion notifications still fire.
- Approved sources are enforced by `supabase/functions/_shared/sourceAllowlist.ts`.
