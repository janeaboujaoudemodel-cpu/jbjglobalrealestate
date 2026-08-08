# Complete Developer Card Media: Logo + Master-Plan Photo for Every Developer

## Verified current state (measured now, not assumed)

The public developer directory renders **630 developer records** (all visible rows, paginated). Measured against the live database:

- **419 of 630** have no logo at all (`logo_url` and `logo_url_processed` both empty).
- **388 of 630** have no usable card photo — no project cover/card/gallery image on any of their projects and no `feature_image_url`. These are the cards showing the emerald blueprint field instead of real master-plan photography.
- Only **211 of 630** have an official `website_url` stored, so for most missing records the official source must first be discovered before any media can be pulled.

Card hero media is sourced in this order (`DeveloperCard.tsx`): curated official flagship map → project photos from `useDeveloperProjectStats` (project `cover_image_url` / `card_image_url` / `gallery_start_image_url`) → `developers.feature_image_url`. Logos come from `DeveloperLogo` (curated white artwork → `logo_url_processed` → `logo_url` → white wordmark fallback).

## Goal

Every developer card in the directory shows (a) the developer's real logo and (b) a real photograph or render of one of that developer's flagship developments. No blueprint fallbacks and no wordmark-only plates left behind, except where no official source exists on the entire public web — those are reported explicitly, never faked.

## Approach

Rather than hand-patching a hardcoded map (which is how earlier partial fixes regressed), this work fixes the data and keeps a durable, auditable pipeline.

### 1. Build the authoritative gap list
Produce a single worklist of all 630 developers with: has-logo, has-photo, website, project count, DLD name. Sort by directory impact (project count, then rank, then A–Z) so the largest brands are resolved first, but the run does not stop until all 630 rows are decided.

### 2. Resolve the official source per developer
For each developer without a stored website, find the official site (web search on exact registered name + "Dubai developer"), and record it to `developers.website_url` only when the site clearly belongs to that brand. No guessing between similarly named companies.

### 3. Pull verified media from the official source
For each developer, from its own website only:
- **Logo**: brand logo asset; processed to a transparent white knockout when the source is dark, stored in `logo_url_processed` with `logo_source` set to the official page and `logo_verified` / `logo_verified_at` recorded.
- **Flagship photo**: the hero/render of the developer's largest or most recognised project, stored in `feature_image_url`. Never a wordmark, share image, screenshot, favicon or square social crop — the existing `isUsableProjectMedia` guard is extended into the ingest step so bad artwork can't enter the database at all.

### 4. Validate every ingested asset before accepting it
Each candidate URL is fetched and checked for: HTTP 200, real image bytes, minimum dimensions, aspect ratio consistent with photography (rejecting logo-shaped and tiny assets), and non-blank content. Only assets that pass are written.

### 5. Persist, never patch in code
All results land in the `developers` table so cards, project cards, developer detail, picker rows and "Explore Developers" rails all improve from one source. The curated in-code maps are reduced to what genuinely needs a hand-made white knockout.

### 6. Visual validation, one by one
Screenshot the directory across **all pages of results** (desktop and mobile), and assert per card that a photo is loaded (not the blueprint field) and a logo plate is rendered. Iterate until the failing set is empty or provably unsourceable. A final table reports, per developer, the media source URL and pass/fail.

### 7. Report what is genuinely unsourceable
Small DLD-registered entities with no website, no social presence and no delivered project will be listed explicitly with evidence of the search performed, so you can decide whether to hide them from the public directory. Nothing is invented to fill those slots.

## Guardrails honoured
- Owner-uploaded project media, covers and documents are never touched, reordered or replaced.
- No generated/AI imagery and no bucket-scan backfill as developer media.
- No duplicate photo rows created; no project records modified.
- Emerald/white contrast and logo-plate standards unchanged.

## Technical notes
- Batched research/ingest runs via parallel sub-agents over the worklist, with per-batch DB writes through migrations/inserts and a per-developer audit row so every change is traceable and reversible.
- Touched surfaces: `developers` table rows; `src/components/DeveloperCard.tsx` and `src/components/ui/DeveloperLogo.tsx` only to trim now-unneeded curated overrides.
- Scale note: this is ~400 logo lookups and ~390 photo lookups with per-asset verification, so it runs in sequenced batches rather than one pass; progress is reported per batch until all 630 are decided.
