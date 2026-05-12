## Plan — PAA Template v13: Leasing-aware fields, Approve & Lock, AI Co-Pilot, premium chrome, deep field audit

Five connected fixes for the JBJ Property Advertising Agreement editor and template. All work stays inside `src/templates/jbjPropertyAdvertisingAgreement.ts`, `src/pages/e-signature/EnvelopeDetail.tsx`, two new components, and one new edge function.

---

### 1. Leasing vs Selling — show only the relevant amount

The envelope already has a `category` column ("leasing" | "selling" | "other"). Wire it into the template:

- `buildPAAHtml` accepts a new `category` option (default `"leasing"`).
- When `category === "leasing"`: render **Rental Amount** only; never render Sales Amount even if a stale value exists; the `sales_amount` field is removed from the editor's Property Details group.
- When `category === "selling"`: render **Sales Amount** only; remove Rental Amount from the editor.
- `EnvelopeDetail.tsx` passes `envelope.category` into every `renderTemplateHtml` and `regenerate.mutateAsync` call (preview, auto-regen, save, hide/restore, blank download).
- `PAA_FIELD_GROUPS` becomes `getPaaFieldGroups(category)` so the editor mirrors the document.

### 2. Approve & Lock action (final-mode freeze + downloadable + AI handoff)

Add a new primary "Approve & Lock" button next to "Send for signature" in the action bar, visible while envelope is `draft` and all required fields are filled.

Behavior:
- Saves current `editValues` to DB.
- Re-renders the PDF using `renderMode: "final"` so the chip rows collapse to the chosen value only — no "OR UNTIL" placeholder, no parenthetical hints (`"6 Months  (Residential Sale or Commercial only)"` becomes `"6 Months"` via a `displayLabel` map), no `|` separator dots between chip groups.
- Removes the trailing dotted leaders/parens from `chipRow` in final mode (already mostly the case; explicitly strip the `(Residential Sale…)` suffix and the `|` divider on lines 379 of the current template).
- Persists `metadata.approved_at = now()` and `metadata.locked = true` so the editor moves into a read-only "Approved – ready to send" state.
- After approval the bar shows: `Download approved PDF`, `Send for signature`, `Open AI Co-Pilot`, `Unlock to edit`.

### 3. AI Co-Pilot drawer (lawyer + admin persona)

New right-side drawer launched from a persistent "AI Co-Pilot" button on the envelope page (visible at all times — blank, draft, approved, sent, signed).

Component: `src/components/e-signature/PAACopilotDrawer.tsx` using purple AI theme tokens.

Capabilities:
- Persistent chat thread per envelope (`paa_copilot_messages` table, RLS owner-only). System prompt frames it as: "You are JBJ's senior real-estate lawyer + agreement editor. You read, fill, and refine UAE property advertising agreements (Form A / PAA leasing & selling). You always preserve required clauses and never invent client signatures."
- Live preview is mirrored inside the drawer (small iframe of `previewSrcDoc`) so the user can ask the AI to fix what they see.
- Tool calls the AI may invoke (Vercel AI SDK `tool` definitions, server-side):
  - `set_fields({ updates: Record<PAAFieldKey, string> })` — patches `template_field_values`.
  - `hide_fields([keys])` / `restore_fields([keys])` — manipulates `metadata.hidden_fields`.
  - `set_chrome({ headerStyle, footerStyle, tagline, trn, license })` — restyles header/footer.
  - `extract_from_attachment({ attachment_id })` — triggers the existing `SmartFillDropzone` extractor on a file the user dropped into the drawer.
  - `regenerate_pdf()` — calls `useRegenerateEnvelopePdf` after changes.
- File uploads inside the drawer: user drops PDF / image / DOCX / scanned title deed → uploaded to `esign-uploads` storage → passed to `paa-copilot-extract` edge function which uses Lovable AI Gateway (`google/gemini-3-flash-preview`, vision when image) to OCR + extract → AI replies with structured field updates the user can accept (single click runs `set_fields` + `regenerate_pdf`).
- "Start blank + AI fill" entry point on the envelope list / new envelope screen: launches the drawer immediately on a brand-new empty envelope so the user can chat or upload before touching the form.
- Backend: new edge function `paa-copilot` (streamed `streamText` with Lovable AI Gateway, tool calls, owner JWT validation, `stopWhen: stepCountIs(50)`).

### 4. Premium header & footer (much larger, much more refined)

Update `headerHtml` (`monogram-wordmark` style) and `footerHtml` (`three-column`):

- Monogram size **148 → 220px** (header) and **none → 96px** (footer left column, faintly inked at 70% opacity).
- New header structure:
  - Row 1: large monogram (left) · doc number + date stamp + RERA permit (right).
  - Row 2: 1px gold hairline.
  - Row 3: centered legal company in 14px tracked uppercase.
  - Row 4: `PROPERTY ADVERTISING AGREEMENT — LEASING` (or `SELLING` based on `category`) in 18px serif-tight uppercase with a thin gold underline that spans only the title width.
- Footer rebuild (still pure contact, still no DCCI/CR/Trade Licence credentials):
  - Left: 96px monogram + JBJ legal name in 9px tracked caps, phone underneath.
  - Middle: office address (centered, two lines).
  - Right: contact email + gold website link.
  - Top hairline becomes a 2px gradient (`gold → champagne → gold`) for a subtle premium edge.
  - Page-bottom microline: `Page 1 of 1 · Generated <date> · {{doc_number}}`.
- Bump `PAA_LAYOUT_VERSION` to **13** so existing drafts auto-regen on next open.

### 5. Deep field audit — add Property Finder Form A fields that were missing

New keys added to `PAAFieldKey`, `PAA_DEFAULT_VALUES`, `PAA_FIELD_GROUPS`, and the rendered HTML body (each printed only when filled, so unsigned drafts stay clean):

- **Title Deed**: `title_deed_number`, `title_deed_date`
- **Off-plan**: `oqood_number`, `oqood_date`, `expected_handover`
- **DLD / DEWA**: `dewa_premise_number`, `makani_number`
- **Tenure**: `tenure` (Freehold / Leasehold / Common-hold), `usage` (Residential / Commercial)
- **Tax / fees**: `owner_trn`, `service_charge_per_sqft`, `maintenance_fee_aed`
- **Sale terms** (selling only): `commission_pct`, `chain_free` (Yes/No), `mortgage_status`
- **Lease terms** (leasing only): `cheques_per_year`, `notice_period_days`, `current_tenancy_end`
- **POA**: `poa_holder_name`, `poa_number` (rendered as a separate "Power of Attorney" sub-block when filled)
- **Documents attached**: `documents_attached` (multi-select chips: Passport, Emirates ID, Title Deed, NOC, POA, Tenancy Contract, Cheque copy)
- **JBJ side**: `rera_permit_number` (displayed in header doc badge area)

The editor groups them into clearer sections: `Owner & Identity`, `Property Identifiers`, `Property Specs`, `Pricing & Fees`, `Terms`, `Power of Attorney`, `Documents Attached`. All fields stay optional; nothing renders to PDF unless filled, preserving the No-Removal policy.

---

### Technical details

- New table (migration):
  ```sql
  create table paa_copilot_messages (
    id uuid primary key default gen_random_uuid(),
    envelope_id uuid not null references esign_envelopes(id) on delete cascade,
    owner_user_id uuid not null,
    role text not null check (role in ('user','assistant','tool','system')),
    parts jsonb not null,
    created_at timestamptz not null default now()
  );
  alter table paa_copilot_messages enable row level security;
  create policy "owner can read" on paa_copilot_messages for select using (auth.uid() = owner_user_id);
  create policy "owner can insert" on paa_copilot_messages for insert with check (auth.uid() = owner_user_id);
  ```
- New edge function: `supabase/functions/paa-copilot/index.ts` (Vercel AI SDK + `@ai-sdk/openai-compatible` against `https://ai.gateway.lovable.dev/v1`, `LOVABLE_API_KEY`).
- New extractor: `supabase/functions/paa-copilot-extract/index.ts` (vision-capable model, returns `{ fields: Record<PAAFieldKey,string> }`).
- New components:
  - `src/components/e-signature/PAACopilotDrawer.tsx` — slide-over with chat (`useChat` + AI Elements `Conversation` / `Message` / `Tool` / `PromptInput`), live preview, attachment dropzone, "Apply suggestions" buttons.
  - `src/components/e-signature/PAACopilotLauncher.tsx` — floating button + unread badge.
- `EnvelopeDetail.tsx`:
  - Pass `category` everywhere `ownerSignatureUrl` is passed.
  - Add Approve & Lock button + locked-state UI.
  - Mount `<PAACopilotLauncher envelopeId={id} />`.
  - When `metadata.locked === true`: hide chip-edit affordances in the iframe and disable "Edit fields" until Unlock.
- `jbjPropertyAdvertisingAgreement.ts`:
  - Add `category`, `locked`, displayLabel map for chips, larger monogram, footer rebuild, new field renderers, `PAA_LAYOUT_VERSION = 13`.
- AI Co-Pilot UI uses the existing AI premium purple theme tokens (no new colors).

### Out of scope
- No changes to send-for-signature email pipeline.
- No changes to public signing page.
- No autofill of any signature, printed name, or date — that rule remains absolute.