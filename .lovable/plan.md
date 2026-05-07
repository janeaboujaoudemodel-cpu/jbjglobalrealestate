
# Broker Registry — Merge, Label & Dedup Upgrade

Builds on the existing `crm_brokerage_agents` + `crm_import_batches` + `BrokerBulkUploadDialog` already in the project. **No outreach/email code is touched** (BulkOutreachPanel, outreachIdentity, outreach-bulk-* edge functions stay exactly as-is).

---

## 1. Schema changes (one migration)

Extend the existing tables — no new parallel registry.

**`crm_import_batches`** — add:
- `specialty_label text` (`leasing | sales | leasing_sales | developer_relations | event_attendees | other`)
- `specialty_custom_label text` (filled when `other`)
- `source_name text`, `source_type text`, `notes text` *(notes already exists)*
- `upload_date timestamptz default now()`

**`crm_brokerage_agents`** — add:
- `specialty_labels text[] default '{}'` (combined, deduped)
- `source_batch_ids uuid[] default '{}'` (every batch this broker came from)
- `source_history jsonb default '[]'` (`[{batch_id, file, label, imported_at}]`)
- `phone_normalized text`, `whatsapp_normalized text`, `email_normalized text`
- `license_number text`, `rera_number text`, `nationality text`, `country text`, `city text`
- `first_imported_at timestamptz default now()`
- `merge_history jsonb default '[]'`
- Partial unique indexes on `(owner_id, phone_normalized)`, `(owner_id, email_normalized)`, `(owner_id, license_number)` where not null — used only for fast lookup, not a hard constraint (we resolve via app code so we can present the merge screen).

**New table `crm_broker_import_staging`** — holds parsed rows pending the duplicate-review screen:
- `id, batch_id, owner_id, raw jsonb, normalized jsonb, match_agent_id uuid?, match_confidence numeric, match_reasons text[], decision text` (`pending|merge|keep|skip|edit`), `edited jsonb`, timestamps.
- RLS: owner-only.

All new RLS mirrors existing `crm_brokerage_agents` policies (owner-only via `owner_id = auth.uid()`).

---

## 2. Normalization helpers (`src/lib/crm/brokerNormalize.ts` — new)

- `normalizePhone(raw, defaultCountry='AE')` → E.164 (`+971501234567`); strips spaces/dashes/parens; treats `0501234567` and `971501234567` as `+971501234567`.
- `normalizeEmail(raw)` → trimmed lowercase.
- `normalizeName(raw)` → collapsed whitespace, lowercase, strip diacritics for fuzzy compare.
- `nameSimilarity(a,b)` → token-set Jaccard (no extra deps).
- `combineSpecialties(existing[], incoming)` → dedup + auto-collapse `['leasing','sales']` → keep both as separate tags but compute a derived `'leasing_sales'` virtual filter (UI-side).

Same helpers re-used by edge function via copy in `supabase/functions/_shared/brokerNormalize.ts`.

---

## 3. Upload flow (rework `BrokerBulkUploadDialog.tsx`)

Three steps inside the existing dialog (no new modal):

**Step A — Files & metadata**
- Existing file picker stays.
- Replace the current `expertise` radio with **Specialty Label** dropdown: Leasing / Sales / Leasing + Sales / Developer Relations / Event Attendees / Other. If `Other`, show a custom-label input.
- Add: Source Name, Source Type, Notes (all optional except Specialty).
- Areas section stays (still useful, unchanged).

**Step B — Parse & match (client-side)**
- Parse all files with `xlsx` (already used).
- Normalize each row; call new edge function `crm-broker-match` with the normalized batch (in 500-row chunks). It returns `{ row, match_agent_id, confidence, reasons }`.
- Insert into `crm_broker_import_staging` with `decision='pending'` for any row with `confidence >= 0.6`; rows below threshold are auto-marked `decision='merge'` if confidence ≥ 0.95, else `decision='keep'` (= new broker) so the review list only shows real ambiguities.

**Step C — Merge confirmation screen** (new component `BrokerMergeReviewPanel.tsx`)
- Two-column comparison table with the exact fields the user listed: existing vs new (name, agency, phone, email, labels, source DB, confidence, recommended action).
- Per-row action: Merge / Keep Separate / Edit Before Merge / Skip. Bulk actions: Apply recommended, Merge all, Keep all.
- "Confirm import" calls edge function `crm-broker-import-finalize` which:
  - For `merge`: updates the matched agent — combines `specialty_labels`, appends to `source_batch_ids`, `source_history`, `merge_history`, fills any empty fields from the new row (never overwrites non-null), updates `updated_at`.
  - For `keep` / `edit`: inserts new row into `crm_brokerage_agents` with normalized fields and full source history.
  - For `skip`: marks staging row `decision='skip'`.
- Returns the **bulk import summary** (total, new, merged, skipped, dup warnings, missing phone/email counts, labels applied, batch id) and shows it in-dialog.

---

## 4. Duplicate detection rules (server, in `crm-broker-match`)

Confidence = max of:
- 1.00 → exact match on normalized phone OR normalized whatsapp OR normalized email OR license/RERA number.
- 0.85 → same normalized phone last 9 digits + same agency.
- 0.75 → name similarity ≥ 0.85 + same agency.
- 0.60 → name similarity ≥ 0.9 alone.

Reasons array surfaces in the review screen (e.g. `['phone match', 'same agency']`).

---

## 5. Broker Registry view (rework existing list on `/owner/crm/relationships`)

The Brokerage tab already renders `ExcelGridView`. Replace its agents sub-grid with a unified **Broker Registry grid** (`BrokerRegistryGrid.tsx`):

- Columns: Name, Agency, Mobile, WhatsApp, Email, Specialty (chip list), Source DBs (chip list), Country, BRN/RERA, Status, Last Updated, Actions.
- All cells editable inline (reuses `ExcelGridView` editable + status pattern).
- Row actions: Split (undo a merge using `merge_history`), Delete, View profile drawer.
- Toolbar:
  - Filters: Specialty multi-select (Leasing / Sales / Leasing+Sales virtual / Developer Relations / Event Attendees / Other), Source Database, Upload Batch, Agency, Country, Registration Status, Attendance Status.
  - Search box (name/phone/email).
  - Bulk update labels button (applies to current filter selection).
  - Export filtered → reuses `exportRowsToXlsx`.
  - "Upload more" button → opens the same upgraded dialog and merges into the same registry.
- Manual "Add broker" button + manual "Merge selected" / "Split" actions.

Agency profile cards get four computed counts (active / leasing / sales / both) derived from `specialty_labels` — no schema work needed.

---

## 6. AI-assisted cleaning (`crm-broker-ai-clean` edge function — new)

One endpoint, called from a "Clean & Suggest" button on the registry toolbar. Uses Lovable AI Gateway (`google/gemini-2.5-flash`) with structured output to:

- Re-normalize phones the regex missed.
- Suggest agency-name canonicalization (`"Allsopp & Allsopp LLC"` ≈ `"Allsopp and Allsopp"`).
- Suggest country canonicalization.
- Surface candidate duplicate pairs the rule engine missed.
- Suggest filling empty fields **only** from another duplicate record — never invented.

All suggestions land in a side panel as accept/reject; nothing auto-writes.

---

## 7. Out of scope (explicitly untouched)

- `outreachIdentity.ts`, `BulkOutreachPanel`, `outreach-bulk-*` edge functions, `email_send_log`, locked subject/template flow, sender/CC enforcement.
- Existing `BulkUploadDialog` for **brokerages** (companies) — only the **broker** (individual agents) flow is upgraded.
- Lead/CRM contact import (`CRMImportModalV3`) — separate domain.

---

## 8. Final delivery (what you'll see)

- **Upload entry**: existing "Upload broker database" button on `/owner/crm/relationships` → upgraded dialog with Specialty selector.
- **Duplicate review**: Step 3 of the same dialog before final commit.
- **Registry**: same Brokerage tab on `/owner/crm/relationships`, now backed by the merged registry grid with specialty/source filters.
- **Agency profile**: existing brokerage drawer, with the new specialty counts + source-history chips.
- **AI clean**: button on the registry toolbar.
- **Import summary**: shown inline at the end of every upload.

---

## Technical file list

New:
- `supabase/migrations/<ts>_broker_registry_dedup.sql`
- `src/lib/crm/brokerNormalize.ts` + `supabase/functions/_shared/brokerNormalize.ts`
- `supabase/functions/crm-broker-match/index.ts`
- `supabase/functions/crm-broker-import-finalize/index.ts`
- `supabase/functions/crm-broker-ai-clean/index.ts`
- `src/components/crm/BrokerMergeReviewPanel.tsx`
- `src/components/crm/BrokerRegistryGrid.tsx`

Edited:
- `src/components/crm/BrokerBulkUploadDialog.tsx` (specialty selector + 3-step flow + staging insert).
- `src/pages/CRMRelationships.tsx` (mount `BrokerRegistryGrid` in the Brokerage tab; pass filters).
- `src/integrations/supabase/types.ts` regenerates automatically after migration.
