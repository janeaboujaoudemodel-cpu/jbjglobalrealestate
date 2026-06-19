---
name: Project Bedroom Enrichment
description: Owner-only Firecrawl+AI scrape of Property Finder/Bayut/Provident/Driven to backfill projects.bedrooms_min/max and bedroom_types; Before/After preview, never auto-applies.
type: feature
---
- Edge function: `supabase/functions/enrich-project-bedrooms/index.ts`. Auth-gated to `user_roles.role IN ('owner','admin')`. Two modes: preview (default) returns `{before, proposed, citations, hasFinding}`; `apply:true` writes update and inserts `admin_edit_log` row (`action='ai_enrich_bedrooms'`) so the existing Undo flow works.
- Sources are searched in order (Property Finder, Bayut, Provident, Driven). Aggregated markdown is regex-parsed first, then refined by Lovable AI gateway (`google/gemini-2.5-flash`, JSON mode) — only used to refine, never to invent.
- UI: `<EnrichBedroomsDialog>` triggered from `OwnerProvenanceCard` "Enrich bedrooms" button. Shows Before vs After grid + source citations + Apply/Re-run.
- Never overwrite manually-set values without explicit Apply click. Studio = 0 in `bedroom_types`.
