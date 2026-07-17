# Fix plan — Developer Portal (4 phases)

Delivered in order. Each phase ends with Playwright screenshot proof before moving on.

## Phase 1 — Portfolio dedupe + missing Allura (FIRST)

**Problem (from your annotated screenshot):** Citi Developers Portfolio shows duplicates — Amra + Amra Residences, Arya + Arya Residences, Agua + AGUA + Agua Residences — and Allura is missing entirely even though it exists on citideveloper.com.

**What I'll do:**
1. Merge duplicates by normalized name (lowercase, strip "Residences/Tower/The", collapse whitespace). For each cluster, keep the row with the most fields filled (cover image, handover date, units, description, coordinates) and delete the thin duplicates. Log every merge to `developer_merge_log`.
2. Add a "Rescan developer website" button on the Portfolio tab that calls Firecrawl on `citideveloper.com` (and the `/projects` / `/portfolio` paths), extracts every project card (name, image, area, status, link), and inserts anything missing — Allura will land here.
3. Every project card in Portfolio gets: cover image, name, community/emirate, status pill, handover, unit count, and a direct link to the source page. Cards missing an image fetch og:image from the source URL.
4. Run the dedupe + rescan once on Citi Developers so you can verify.

## Phase 2 — Briefing survey redesign

**Problem:** "Add new briefing" currently shows "Register broker survey" — wrong. Owners don't register surveys; surveys are triggered automatically and filled from email.

**What I'll do:**
1. Remove the "Register broker survey" form entirely.
2. When a briefing is marked "Completed", the system auto-sends two email templates via Resend:
   - **To you (owner):** rate the developer's sales rep (stars 1–5 on knowledge, professionalism, follow-up, plus free-text).
   - **To each attending broker:** rate the briefing (stars on content quality, developer transparency, would-recommend, plus free-text).
3. Each email contains a signed one-time link → hosted survey page (no login required) → response saves to `developer_rep_ratings` and links back to the sales rep + briefing.
4. On the sales rep profile: new "Ratings & feedback" section showing every response, with per-row Hide/Show toggle and Delete (owner only).

## Phase 3 — Profile Rebuild queue overhaul

**Problem:** "Rebuild 25 broken" cap, no logo scraping, current-vs-proposed shows identical values as "changes", many rows say "no website found".

**What I'll do:**
1. Replace "Rebuild 25 broken" with **"Rebuild all"** + a continuous background job (pg_cron every 6h) that re-scrapes every developer whose data is >7 days stale or has missing fields.
2. Website resolution step: if a developer has no website, search Google (via Firecrawl search) for `"<developer name>" Dubai real estate site` and take the first branded domain — fixes "Palladium Prime Development / no website found".
3. Scrape logo from `<link rel="icon">`, og:image, `/logo*.svg|png` paths, and Instagram profile picture (via public profile URL). Upload to `developer-logos` storage; only propose if different from current (hash compare).
4. Fix the diff: compare normalized strings (trim, lowercase, strip punctuation). If normalized values are equal, show "No change" instead of a fake diff row. Binghatti will stop showing identical Current/Proposed.

## Phase 4 — Excel/CSV upload to fix profiles

**What I'll do:**
1. New "Bulk enrichment" panel on `/owner/developers` accepting `.xlsx` / `.csv`.
2. Parse headers, fuzzy-match to developer fields (name, website, founder, license, logo URL, areas, phone, projects list).
3. For each row: match to existing developer by name OR website; show a preview diff table (Current | From file | Action: Fill blank / Overwrite / Skip).
4. On Apply, write to `developers` + `developer_activity_log`. Failed matches go to a "Needs review" list.

## Technical notes

- Firecrawl connector: already linked. Use direct-API mode (fc- key).
- New tables: `developer_rep_ratings` (rep_id, briefing_id, respondent_type, respondent_email, scores jsonb, comment, hidden, created_at). Signed survey links via `crypto.randomUUID()` + expiry column.
- Cron job: pg_cron calling `rebuild-developer-profiles` edge function.
- Excel parsing: `xlsx` npm package in a new edge function `bulk-enrich-developers`.
- All 4 phases proven with Playwright screenshots before I mark them done.

**Starting with Phase 1 now on approval.**