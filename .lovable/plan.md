
This is a large, multi-domain rebuild. I'll deliver it in **4 sequential phases** so each layer is validated before the next. Nothing will be marked "done" without Playwright screenshot proof at the end of each phase.

Before I start, one scope question at the bottom — please answer so Phase 1 lands correctly.

---

## Phase 1 — Ingestion engine (website + brochure + bulk link)

New edge function `developer-intel-extract` running on every upload:

Inputs accepted in one drop zone at the top of the developer page and inside "Add a project":
- Company profile PDF (already works)
- **New: Developer website URL field** (right next to the PDF drop zone)
- **New: Bulk link field** — Google Drive / Dropbox / OneDrive / public URL. Server-side fetch, list children, download each file (PDF/image/doc), OCR + parse.

Extraction (Lovable AI Gateway, Gemini for vision + long context):
1. **Developer profile fields** — CEO, founded year, HQ, specialization, website, LinkedIn, socials, parent company, portfolio size (# projects, # units, AED GDV). Written back as *verified* only when found in two sources (website + brochure) — otherwise stays flagged.
2. **Premium bio rewrite** — replaces the current cliché copy. Prompt forces third-person magazine-bio tone: founding story, operating model, notable completed projects, portfolio scale, signature areas. No "trust is the foundation" filler. Regenerable from a button on the page.
3. **Project extraction** — for each project detected, extract name, location (emirate + area), handover date, unit count, bedrooms, price from, description, amenities, payment plan, and all images/brochures/floor plans. Files that don't belong to any project stay in a developer-level "Unassigned" tray until the owner assigns them.
4. **Area auto-creation** — for every new (emirate, area) pair we haven't seen, create `/emirate/umm-al-quwain` and `/area/al-rawda` pages via the existing `areas` + `emirates` tables. Project links to both. Area page shows: all projects in area, developers active there, related areas.

## Phase 2 — Dedup + project management

Deterministic + LLM-scored dedup on every ingest:
- Normalized name similarity (Amra ≡ Amra Residences ≡ Amra The First Integrated Wellness Resort when same developer + same emirate + same area).
- Merge rule: **enrich the richest record, delete the thinner duplicates**. Richest = has cover image + handover + description. All media/files from duplicates merged in.
- Placeholder flag detection: British/US flag as "logo", missing cover, "TBD" handover, "— units" — auto-flagged as `needs_enrichment`, re-run through the extractor.

Project list on developer page:
- Row-level **Edit** button opens the full backend edit page (`/owner/projects/:id/edit`) — same form as "Add a project", not a lightweight modal.
- Bulk actions: delete, duplicate, hide, archive, mark available/sold-with-developer.
- **Availability control** per project: `available_with_developer` | `sold_with_developer` | `resale_only`. When `sold_with_developer`, listing card shows "Sold with developer — check resale" with a link to matching resale units (query `resale_listings` by project_id).

## Phase 3 — Portal layout rebuild (premium)

Rebuild `DeveloperPortal.tsx` with a single tabbed shell inside `/owner/developers/:slug`:

```text
[ Overview | Projects | Media Hub | Contacts & Reps | Briefings | Files | Activity ]
```

- **Media & Files removed from top-level nav** as separate developer-wide tabs. Every media/file upload now happens *inside a project*. The developer-level "Media Hub" is only the **bulk ingest engine** (one drop zone + one link field) that routes files down to the correct project automatically.
- **Sales Reps + Briefings sidebar items removed from `GlobalVerticalNav`** and folded in as tabs of the developer page.
- Contrast fix on the emerald "Smart brochure extract" card — white text on emerald, layout rebuilt to full-width above the form (kills the broken side-by-side with "Listing preview").
- Every button, chip, dropdown honors the locked emerald/champagne tokens — no black-on-emerald.

## Phase 4 — Contacts, Briefings & Broker Survey

**Contacts & Reps tab:**
- "Add contact" modal with country-code picker (reuse `LightSearchableSelect` + flag data from signup), position dropdown (Admin, Owner, Sales Manager, Channel Manager, Marketing, Other → free text).
- Row bulk actions: delete, archive, hide, duplicate, edit.

**Briefings tab:**
- "Log a briefing" — date, sales rep from this developer, notes, attendee list.
- Attendees: search brokers from CRM (Zoho + local `brokers` table). If not found, "Register new broker" inline — full profile form, part-time/full-time toggle, saved to `brokers` and pushed to Zoho.
- After a briefing is saved, a survey link is emailed to each attendee (Brevo template). Survey scores the sales rep on: knowledge, responsiveness, timing, follow-up, overall. Broker can attach photo proof of self-attended briefing.
- Ratings roll up per sales rep and show next to their name in Contacts & Reps.

**Activity tab:**
- Timeline of every ingest, edit, briefing, survey response — the existing `user_journey_events` feed filtered to `entity_type='developer' AND entity_id=:id`.

---

## Technical section

- New tables: `developer_ingest_batches`, `developer_unassigned_files`, `briefings`, `briefing_attendees`, `briefing_surveys`, `sales_rep_ratings`, `project_availability_state` (enum column on `projects`). All with GRANTs + RLS scoped by developer ownership + admin role.
- New edge functions: `developer-intel-extract` (website + brochure + bulk link → structured JSON), `dedup-projects`, `send-briefing-survey`, `submit-briefing-survey`.
- AI model: `google/gemini-3.5-flash` for extraction + rewrite (long context, cheap), `google/gemini-3-pro` fallback for hard PDFs. Bio rewrite pinned to Gemini 3 Pro for quality.
- Bulk link fetcher: server-side, follows Google Drive folder API (public share) and generic HTML crawl for shared sites. Files streamed into `developer-documents` bucket, `is_public=false` by default.
- Storage: per-project media lives at `project-media/:project_id/*`. Unassigned files at `developer-unassigned/:developer_id/*`.
- Removed from `GlobalVerticalNav`: `Sales Reps`, `Briefings` — folded into developer page tabs.
- Contrast + layout: `SmartExtractCard` rebuilt with `bg-emerald-950 text-white`, full-width, no side card. Placeholder "Listing preview" is repositioned below the form on desktop, not next to it.

---

## Deliverable per phase

Each phase ends with:
1. Playwright screenshots at 1440 / 1180 / 390 widths of the developer page for Citi Developers, plus the Add-a-project flow.
2. Console/network clean.
3. Short changelog message. No claims without screenshots.

---

## One question before I start Phase 1

**Bulk-link ingest scope:** Google Drive folder links only, or do you also need Dropbox + OneDrive + generic public URLs in the first pass? Drive-only ships in Phase 1; the others add ~1 phase of work each because every provider has its own auth + listing API.
