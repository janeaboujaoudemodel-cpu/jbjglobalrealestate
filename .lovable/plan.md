# Backend Rebuild Plan — Enrichment, Developer Profile, CRM Quick-Add

Scope is large. I'll batch it into four phases, all landing in the emerald Hub shell with white-on-emerald contrast, no gold/champagne, no highlight halos, no page redirects.

## Phase 1 — Enrichment Review page (card-by-card rebuild)

Problems observed:
- Emerald pills (DEVELOPER / PENDING / Approve) render black text on emerald.
- Raw JSON (custom_fields) leaking as unformatted HTML/text inside cards.
- Pending/Approve counters mismatched; duplicate suggestion rows for the same source.
- Layout inconsistent, background highlight halos behind cards.

Fix:
- Rewrite `EnrichmentReviewPage.tsx` + `EnrichmentSuggestionCard.tsx`:
  - Header row: entity badge (DEVELOPER), model chip, status pill — all `bg-emerald-900 text-white` with `!important` locks.
  - Deduplicate by `(entity_id, field_name)`, keep newest suggestion only.
  - Render JSON fields via a `<FieldDiff>` component: labeled key/value rows, no raw braces. Long text truncates to 6 lines with expand.
  - Reject / Approve buttons: emerald filled + emerald outline, both white text, matched height.
  - Remove card `bg-muted` halo; use flat `bg-white border border-emerald-900/10`.
- Fix Pending count = suggestions with status='pending' AND fill_count > 0. "Approve (fill 0)" rows get filtered out or show "Nothing to fill" state.

## Phase 2 — Developer Profile rebuild

Problems: Contacts & Reps tab is minimal; no live preview; no filter/search on reps; contract upload missing; highlight halos behind "Developer contact" / "Registered sales representatives".

Fix:
- **Live Preview strip** at top of profile: pill row linking to public pages:
  - Developer page · Projects · Emirates · Areas · Communities · Locations
  - Each opens in a new tab to the front-end route (read-only preview).
- **Portfolio tab** — each project card gets a "View public page ↗" link to `/projects/:slug`.
- **Contacts & Reps rebuild** (`DeveloperRepsSection.tsx`):
  - Add-rep dialog inline (no redirect): name, position, country dial-code dropdown, phone, WhatsApp, email, nationality, languages (multi), notes, photo upload.
  - Filter bar: search + facets (position, country, nationality, language).
  - List view with avatar, contact chips, edit/delete inline.
- Remove `bg-muted/bg-accent/50` halos from section wrappers globally in `crmShell.css`.

## Phase 3 — Enrichment content extraction

- Extend `extract-developer-content` edge function to crawl developer site's e-catalogue pages (Amra, Allura, Arya, Aveline, Agua) per developer.
- For each project found: create/update `projects` row with location, emirate, community, area, handover, units, brochure links.
- Auto-link projects → developer, emirate, area, community entities so profile cards show correct list (fixes "wrong projects for Citi").
- Download any PDF brochures/materials to `developer-brochures` bucket; run text extract into `project_documents` for AI enrichment.
- Dedupe projects by `(developer_id, normalized_name)` — resolves duplicate project cards.

## Phase 4 — CRM inline quick-add

Problem: "Register Meeting / Deal / Event" opens new page and redirects to CRM.

Fix:
- Replace the header CTA with a `QuickAddPopover` (radix Popover), same pattern as the "+" button:
  - Options: Log Call · Meeting · Task · Deal · Event · Note.
  - Each opens an inline `<Sheet>` on the same page with the form, saves via existing mutations, no navigation.
- Same component reused across CRM, JBJ Hub, Developer profile, Broker profile.

## Contrast / structural guarantees (applied in all phases)

- `crmShell.css`: 
  - `.emerald-pill, [data-status], [data-badge]` → `bg-emerald-900 !text-white`.
  - Remove `background-color` from `.card-halo, [data-card-bg]` wrappers.
  - Enforce `#064E3B` (not tailwind `green-*`) across every button variant used in Hub.
- No route inside Owner Backend may `navigate()` to a champagne path; add router guard.

## Verification

Playwright E2E on:
1. `/owner/enrichment-review` — screenshot each card state (pending, approve>0, approve=0, rejected).
2. `/owner/developer-profiles/citi-developers` — screenshot Overview, Portfolio (live links), Contacts & Reps (add + filter).
3. `/owner/crm` — click Register Meeting → confirm popover opens same page, submit meeting, confirm no navigation.
4. Assert computed color of every status pill = `rgb(255,255,255)` on emerald bg.

All screenshots saved to `/tmp/browser/rebuild/` and reviewed before I report back.

## Out of scope for this pass

- Zoho-mirrored pages (untouched per prior rule).
- Front-end public pages (only linked to, not restyled).
