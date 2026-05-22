
# Plan: Developer Data Rebuild + Owner Developer Hub

## What I found (important — affects approach)

- **633 developers** in DB, **394 missing logos**, **34 duplicate names** (e.g. `Binghatti` exists at slugs `binghatti` AND `developed-by-binghatti`; same for Samana).
- **Cross-wired descriptions** (the bug you saw):
  - `Binghatti` (both rows) → description text is actually about **Al Habtoor Group**
  - `Samana Developers` (slug `samana-developers`) → description text is about **Binghatti**
  - This is a row-level data corruption from a past import, not a UI bug.
- **`/developer-hub` already exists** but it's the *public developer onboarding portal* (company registration, project wizard, launch events, CRM for the developer themselves). It is **not** an owner control surface and should not be repurposed. The content in `/admin/developers` (overview, briefings, deal close, missing-logos queue, profile editor) is owner-only and belongs on a new route.

## Scope

### Part A — Data integrity fix (Binghatti/Samana + duplicates)

1. Merge duplicate developer rows by canonical name. Keep the slug with the most relationships (projects, logo, website); migrate FKs from the duplicate to the canonical row; soft-delete the duplicate.
2. Null out the 5 cross-wired descriptions on `binghatti`, `developed-by-binghatti`, `samana-developers` so they re-fetch fresh in Part B (never silently keep wrong text).

### Part B — Full rebuild from official sites (Firecrawl + AI)

New edge function `enrich-developer-from-official-site` (owner-only, `requireOwnerAuth`):

- Input: `developer_id` (single) or `batch` (max 25/run to respect Firecrawl credits).
- Pipeline per developer:
  1. If `website_url` missing → Firecrawl **search** for `"<name>" Dubai developer official site` to find it.
  2. Firecrawl **scrape** homepage with formats `['markdown','branding','summary','links']` → extracts logo URL, primary brand color, summary, internal links.
  3. AI gateway (`google/gemini-3-flash-preview`) extracts structured `{ description, founded_year, hq, specialties[] }` from markdown.
  4. Firecrawl **map** `<site>/projects` (or detected projects subpage) → top 10 project names + URLs.
  5. Download logo → re-host in `developer-logos` storage bucket (champagne padding via sharp-style transform on read is already handled by existing logo standard).
  6. **Replace** `description`, `logo_url`, `website_url`, `founded_year`, `hq_location`, `specialties`. Upsert scraped projects into new `developer_scraped_projects` table — **never** touches existing published `projects` rows (no deletes, per project standard).
  7. Write before/after JSON to new `developer_enrichment_log` table for audit + rollback.

- New owner-only `/developer-hub-admin/enrichment` page (see Part C) drives this with batch progress, per-developer Preview → Approve → Apply workflow (so you stay in control rather than blind overwrite).

### Part C — Owner Developer Control Hub (new route)

Because `/developer-hub` is taken by the public dev portal, I'll add **`/developer-hub-admin`** (OwnerGuard, not under `/admin`). It will host everything currently at `/admin/developers/*`, expanded:

```
/developer-hub-admin                  → Overview (KPIs: total devs, missing logos, enrichment status, recent briefings, deals closed)
/developer-hub-admin/directory        → searchable list (= current AdminDevelopers)
/developer-hub-admin/profile/:slug    → full editor (= DeveloperProfilePage)
/developer-hub-admin/missing-logos    → queue (= MissingLogosQueue)
/developer-hub-admin/enrichment       → Firecrawl rebuild queue + before/after diff approval
/developer-hub-admin/briefings        → briefing requests inbox + replies
/developer-hub-admin/deals            → deal-close pipeline
/developer-hub-admin/calendar         → events + meeting bookings (Google Calendar connector already linked)
/developer-hub-admin/projects         → all developer-submitted projects, approval queue
```

`/admin/developers/*` routes become 301-style `<Navigate>` redirects so existing links keep working. Sidebar entry "Developers" in the owner nav repoints to `/developer-hub-admin`.

### Part D — Broken logo sweep (immediate quick win, runs before Part B)

While Part B is the proper fix, I'll also run a one-shot logo-only pass for the **most-referenced** developers first (Binghatti, Samana, Aldar, Emaar, Damac, Sobha, Nakheel, Meraas, Dubai Properties, Select Group, Ellington, Danube, Azizi, Tiger, Deyaar — ~20 top names) so the public site stops showing missing logos within minutes, not hours.

## What I will NOT do

- Will not delete any developer row, project row, or media. (Duplicate merges soft-delete only, with restore path.)
- Will not touch the public `/developer-hub` portal used by developers themselves.
- Will not auto-apply scraped descriptions in bulk without your approval — Part B writes to a staging table and the enrichment UI shows before/after diffs for one-click approve per developer (or "Approve all on this page").
- Will not change `/admin/developers` URLs to break — they'll redirect.

## Technical details

- New tables (migration):
  - `developer_scraped_projects (id, developer_id, name, url, image_url, status, scraped_at)`
  - `developer_enrichment_log (id, developer_id, before_jsonb, after_jsonb, source_url, status enum staged|approved|rejected|applied, created_at, applied_at, applied_by)`
  - RLS: owner-only.
- New storage bucket: `developer-logos` (public read, owner write).
- New edge functions (CORS + `requireOwnerAuth` + Zod input validation):
  - `enrich-developer-from-official-site`
  - `apply-developer-enrichment` (moves staged log → live row, after owner approval)
  - `merge-duplicate-developers`
- Firecrawl: uses linked `Firecrawl` connection (`std_01kfn6wppgfvfa3d05hympc604`); secret already in env. Rate-limited to 1 req/sec, max 25/run.
- AI extraction: Lovable AI Gateway, no extra key needed.
- Existing `IconTile`, `DeveloperLogo` champagne-padded container, and design tokens reused — no visual standard changes.

## Execution order

1. Migration: new tables + bucket + indexes (one approval).
2. Quick logo sweep edge function + run for top 20 devs (Part D) → immediate visible fix.
3. Cross-wire bug nulls + duplicate-merge migration (Part A).
4. Enrichment edge functions + staging UI at `/developer-hub-admin/enrichment` (Part B).
5. Owner Developer Hub shell + move all `/admin/developers/*` content + redirects + calendar/briefings/deals tabs (Part C).
6. Sidebar nav update.

Estimated: ~15 file changes, 1 migration, 3 edge functions. Roughly one large turn for scaffolding + your approval needed for each batch enrichment run.
