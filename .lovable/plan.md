# Owner Admin Suite for Project Pages

Make the project page have a real owner control layer: a private "what changed and when" panel, a payment-plan workbench (upload / write / describe-with-AI), a per-section **Enrich with AI** button that only uses your uploaded brochures, and an admin-style AI assistant that can act on the page (toggle visibility, save edits, jump to changes). Every public visitor surface stays unchanged.

## 1. Hide the freshness chip from the public, replace with an Owner Provenance Card

Today `DataFreshnessIndicator` ("Updated 3 weeks ago · Verified") renders for everyone on the project page (`ProjectDetailLayout.tsx` line 808). It will become **owner-only** and grow into a richer card.

Public visitors: the chip disappears entirely. No "updated 3 weeks ago", no source badge.

Owner-only **Provenance Card** (top-right, same slot) shows:
- **Created**: date + source (`manual` / `provident` / `reelly` / `developer-portal` / `ai-enrichment`)
- **Last updated**: date + who (owner name, "Scraper", "AI Enrichment", "Developer self-edit")
- **Recent activity**: last 5 edits, each a row → `field changed · by · when · [View] [Undo]`
- Buttons: **View full history** (opens drawer with everything from `admin_edit_log`), **Re-run enrichment**

Gate with the existing `useIsAppOwner` hook so the card only renders for `owner`/`admin` roles.

## 2. Edit history, View Changes, and Undo

The `admin_edit_log` table already exists (entity_type, entity_id, user_id, action, changed_fields, summary, created_at). We will:

- Write to it on every owner save path (`OwnerSectionEditor`, `InlineEditable`, image upload, doc upload, AI enrichment, scraper writes). The log row stores `before` and `after` JSON for the changed fields (new `before_values jsonb` + `after_values jsonb` columns added via migration so undo is possible).
- **View changes**: clicking the eye icon on a log row scrolls the page to the affected section (using the existing section refs: `detailsRef`, `mortgageRef`, etc.) and pulses a gold ring around the changed block so the owner sees exactly what moved.
- **Undo**: clicking undo on a row writes `before_values` back to the row, then logs a new `action='undo'` entry that points to the original log id. Undo is available for the latest N edits per field; once a newer edit on the same field exists, undo is disabled and the row shows "superseded".

## 3. Payment Plan workbench (owner-only, inside the Payment Plan section)

The Payment Plan card today only shows the existing `projects.payment_plan` text + `payment_breakdown` json. Add an owner toolbar above it with three entry points:

1. **Upload payment plan file** — drops into the existing `OwnerDocDropzone` flow, categorised as `payment_plan`, surfaced as a downloadable card.
2. **Write manually** — opens the existing `OwnerSectionEditor` for the payment plan fields (`payment_plan`, `down_payment_percent`, `payment_breakdown` rows).
3. **Describe with AI** — opens the AI Enrichment dialog (see §4) pre-scoped to the Payment Plan section. Owner pastes/types/uploads a description; AI parses milestones (`On Booking 10%`, `On Handover 40%`, …) into `payment_breakdown` and a clean `payment_plan` summary. Owner approves before save.

## 4. "Enrich with AI" — per-section + per-project

Every owner-editable section (Details, Amenities, Location, Payment Plan, Specs, FAQ, Floor Plans) gets a small **Describe with AI** pill next to the existing edit pencil. A project-level **Enrich with AI** button lives in the Provenance Card.

Behaviour:
- Owner pastes free text and/or uploads documents (brochure, fact sheet, payment plan PDF, location map). Documents go through the existing `parse_document` flow.
- A new edge function `ai-enrich-project` (Lovable AI Gateway, `google/gemini-3-flash-preview`) receives the source text + a strict system prompt:
  - "Only use facts present in the provided documents/text. If a field is not present, return `null` and add it to `missing[]`. Never invent prices, dates, amenities, or images."
- Returns a **diff**: per section → proposed new values + which document/snippet they came from (cited).
- Owner sees a **Before / After preview** (the same Recommendations pattern already used in `global-recommendations-hub`) and can accept per-field or accept-all. Every accepted change writes to the project + logs into `admin_edit_log` with `action='ai-enrichment'` and the source citation.

**Hard rules baked into the prompt and the apply step:**
- Never overwrite an existing non-empty field unless the owner ticks "overwrite".
- Never auto-generate or fetch images. Amenity image search is restricted to images already attached to the project's brochure/floorplan PDFs (we extract them during `parse_document`).
- If an amenity from the brochure has no embedded image, the AI returns it as `missing_image: true` and the UI renders an **Upload photo for "Sauna"** dropzone in-line — never a generated placeholder.

## 5. Owner AI Assistant (admin-IT mode)

The on-page assistant becomes capable of acting, not just answering. Owner-only. Tools the assistant can call:
- `enrich_section(section, source_text|doc_ids)` — runs §4 with preview.
- `set_document_visibility(doc_id, visible)` — toggles a document in the Documents section.
- `apply_edit(section, field, value)` — same path as `OwnerSectionEditor` save, logged.
- `undo_last(entity_type, entity_id, scope?)` — calls §2 undo.
- `goto_section(section)` — scrolls page to that section ref.
- `list_recent_changes(limit)` — reads from `admin_edit_log`.

All tool calls go through a single edge function `owner-assistant` that `requireOwnerAuth` validates. Visitors can never reach it.

## 6. Public vs Owner — strict separation

- Public page: unchanged. No freshness chip, no "verified" badge, no edit pencils, no AI buttons, no provenance.
- Owner page: provenance card top-right, per-section pencil + "Describe with AI" pill, Payment Plan workbench, Assistant FAB. All gated by `useIsAppOwner`.

## Out of scope (intentionally)

- No new global toolbar; everything lives next to its section.
- No change to the public lead-capture or document gating.
- No change to scraper schedules; we just stamp `import_source` + log entries when they run.

## Technical notes

- **DB migration**:
  - `ALTER TABLE admin_edit_log ADD COLUMN before_values jsonb, ADD COLUMN after_values jsonb, ADD COLUMN section text, ADD COLUMN source_citation jsonb;`
  - New column `projects.created_source text` (default `'manual'`) backfilled from `import_source` so "created by" is distinct from "last updated by".
  - Indexes: `(entity_id, created_at desc)` already exists; add `(entity_id, section)`.
- **RLS**: owner/admin select on `admin_edit_log` already in place. New insert policy: any authenticated user can insert (we constrain `user_id = auth.uid()` in the policy check).
- **Edge functions** (all `requireOwnerAuth`):
  - `ai-enrich-project` — parse docs, call Lovable AI, return diff with citations.
  - `owner-assistant` — chat + tool calls listed in §5.
  - `apply-owner-edit` — single write path that updates the row and writes the matching `admin_edit_log` entry atomically (so undo is reliable).
- **Frontend**:
  - New: `OwnerProvenanceCard`, `EditHistoryDrawer`, `ChangeRowItem` (View / Undo), `AIEnrichDialog` (per-section + project-level), `OwnerAssistantPanel`.
  - Reuses: `OwnerSectionEditor`, `InlineEditable`, `OwnerDocDropzone`, `useIsAppOwner`, existing section refs in `ProjectDetailLayout`.
- **No-fake-data enforcement**: image apply step rejects any URL not present in `project_documents` extracted-image table; AI prompt cites doc id + page for every value; missing fields surface as upload prompts.

## Open questions

1. Should the AI enrichment **auto-apply** anything, or always preview-then-apply? (Default in this plan: always preview.)
2. Undo scope — undo only the most recent change to a field, or a stack of N? (Default: stack of 10 per field per project.)
3. Should the Owner Assistant be a floating panel on the project page only, or also accessible from `/owner` dashboard with project picker? (Default: project-page only for v1.)
