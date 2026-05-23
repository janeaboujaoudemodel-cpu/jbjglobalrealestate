
## What's broken right now

1. **Site Rebuild diff** — the "Proposed" column shows blanks/odd badges because the scraper only puts the fields the AI actually extracted into `after_jsonb`. Everything missing renders as "—", which reads as "the AI lost the data". Many fields are also never asked for (Instagram, LinkedIn, WhatsApp, office phone, projects count, years in market).
2. **Directory paging** — capped at 300 rows with `.limit(300)` and no scroll/pagination affordance. Many developers never appear.
3. **Logos** — when CDN logos break we show an icon; the scraper never re-tries other sources, so the same developers stay logo-less.
4. **Contact fields** — Instagram / LinkedIn / WhatsApp / phone / office address / Google Maps exist as columns but aren't surfaced consistently in admin and aren't clickable everywhere.
5. **Bulk visibility** — no UI to flip what's public vs owner-only across many developers at once.

## Fix plan

### 1. Diff that reads correctly
In `DeveloperEnrichmentQueue.tsx → DiffTable`:
- Expand `FIELDS` to: description, logo_url, founded_year, headquarters, ceo_name, specialization, notable_projects, instagram_url, linkedin_url, office_phone, whatsapp, office_address, google_maps_url, completed_projects, total_units_delivered, website_url (owner-only).
- When `after[field]` is missing, show the current value greyed out + label **"Kept"** (not "—") so it's obvious nothing was lost.
- When `after[field]` is present and differs, label **"Updated"** in gold.
- When `after[field]` is present and equals, label **"Confirmed"**.
- New rows (before empty, after set) → **"New"** in emerald.
- Render logo, Instagram/LinkedIn/site as clickable thumbnails / chips with the favicon-style hostname.

### 2. Deeper, more reliable scraper
Edit `supabase/functions/developer-site-rebuild/index.ts`:
- Scrape **3 pages** instead of 1: homepage, plus the two best-matching links from `branding.links` whose path includes `about|company|contact|projects`. Concatenate the markdown (cap 24k chars).
- Expand the AI extraction JSON schema with: `instagram_url`, `linkedin_url`, `whatsapp`, `office_phone`, `office_address`, `google_maps_url`, `completed_projects` (int), `total_units_delivered` (int), `years_active` (int), `notable_projects` (array of up to 20).
- For any field the AI returns null, keep the existing DB value (don't overwrite with null on apply).
- Logo fallback chain: branding.logo → `<link rel="icon">` from raw HTML → Clearbit `https://logo.clearbit.com/{hostname}`. Host whichever resolves to a non-broken image into the `developer-logos` bucket.

### 3. Apply-time merge
In `apply-developer-enrichment/index.ts`: on approve, merge `after_jsonb` onto the developer row using `COALESCE` semantics — never write `null` over an existing value.

### 4. Scrollable, complete Directory
In `DeveloperDirectory.tsx`:
- Remove the 300-row cap; switch to keyset pagination (Load more button, page size 60).
- Keep search/filters but run them through the new paged query.
- Always render the cards in a scrollable container, no fixed height.

### 5. Public profile contact visibility (owner-controlled)
- Add column `public_fields jsonb default '{}'::jsonb` on `developers` — keyed by field name (`instagram_url`, `linkedin_url`, `office_address`, `google_maps_url`, `office_phone`, `whatsapp`, `website_url`, `admin_email`), each value boolean.
- Default is `false` for everything (current behaviour: hidden).
- Public components (`DeveloperInfoCard.tsx`, developer profile page) check `public_fields[k] === true` before rendering each field as a clickable link (`mailto:`, `tel:`, `https://wa.me/…`, social URL, Google Maps URL).

### 6. Bulk Visibility panel in Directory
Add a new "Visibility access" button to the Directory header. Opens a sheet with:
- Checkboxes for the same field list (Instagram, LinkedIn, Office address, Google Maps, Office phone, WhatsApp, Website, Admin email).
- "Apply to N selected developers" / "Apply to all visible".
- Calls an edge function `developer-visibility-bulk-set` that updates `public_fields` for the selected developer IDs (owner-only).

### 7. Admin profile page polish
In `src/pages/admin/DeveloperProfilePage.tsx`: render every contact field as a clickable link with the same href schemes; show a small "Public" / "Owner-only" pill per field that reflects `public_fields[k]`.

## Files to touch

- `src/pages/developer-hub-admin/DeveloperEnrichmentQueue.tsx` — new FIELDS list, "Kept/Updated/New/Confirmed" labels, clickable cells.
- `src/pages/developer-hub-admin/DeveloperDirectory.tsx` — pagination + "Visibility access" sheet.
- `src/pages/developer-hub-admin/DeveloperVisibilitySheet.tsx` — new component.
- `src/pages/admin/DeveloperProfilePage.tsx` — clickable contacts + per-field public pill.
- `src/components/project-detail/DeveloperInfoCard.tsx` — render any field whose `public_fields[k]` is true as a clickable link.
- `supabase/functions/developer-site-rebuild/index.ts` — multi-page scrape, expanded AI schema, logo fallback chain.
- `supabase/functions/apply-developer-enrichment/index.ts` — COALESCE merge.
- New edge function `supabase/functions/developer-visibility-bulk-set/index.ts`.
- DB migration: add `public_fields jsonb` column.

## What I'm explicitly not changing
- Public profile still hides every contact field by default (per your prior rule). The bulk panel is opt-in per field per developer.
- Website URL stays owner-only in the diff label.
- No removals of existing features.

Reply "go" to build, or tell me which parts to drop / re-order.
