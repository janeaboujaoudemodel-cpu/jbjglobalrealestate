## Scope

A long backlog from earlier turns + new bugs you raised today. I've grouped everything into 5 phases. Each phase ships independently so you see fixes land continuously instead of waiting for the whole batch.

---

## Phase A — PAA preview & download bugs (today's blockers)

### A1. Blank space under footer in PAA preview
**Symptom:** `DocumentPreviewSummary` sometimes renders a tall blank page under the footer; even after it self-fixes there's a ~2 cm white strip under the footer.

**Cause:** The PDF-page canvas (`PdfPageCanvas.tsx`) keeps a fixed-height placeholder while pages are still being rendered, and the wrapper has unconditional bottom padding.

**Fix (preview only — download/email PDF untouched):**
- Collapse the placeholder height to `0` once `rendered === true`.
- Remove the trailing `pb-*` on the preview scroll container; replace with a single `mb-0` on the last page card.
- Wrap the preview in `overflow-y-auto` with `min-h-0`, so the parent's flexbox doesn't reserve unused space.

### A2. "Download PDF" link — remove arrow, make premium, never blocked
**Symptom:** Arrow/external-link icon next to the button looks cheap; opening on desktop is blocked by Chrome/ad-blockers because the link points straight to `*.supabase.co`; opening on phone shows raw `mdafrewy…supabase.co` in the URL bar and a "from supabase" message at the bottom of the save dialog.

**Fix:**
- Audit every place that renders the signed PDF link in `DocumentsFormsHub.tsx`, `DocumentPreviewSummary.tsx`, the right-rail card on `/e-signature/:id`, the row actions in the Documents/Sent/Signed tabs, and the inbox attachment chip.
- Replace each `<a href={signed_document_url}>` with `safeOpenHref(url, filename)` so every link routes through `https://jbj.ae/d?u=…` (which is the already-built branded proxy `DownloadProxy.tsx`).
- Replace the `ExternalLink` icon with the existing `FileDown` icon and re-label to **"Download document"** (cap-tracking spacing matches the rest of the premium buttons in the hub).
- Verify `DownloadProxy.tsx` always uses the streaming proxy (`maybeProxyStorageUrl(..., { disposition: "attachment" })`) so the underlying request never reaches `*.supabase.co` from the client — this removes both the URL-bar branding leak and the desktop block.

### A3. DownloadProxy landing page polish
The page already exists at `/d` but the user is seeing it look "blank/cheap" on the first paint because the auto-download starts before paint completes.

**Fix:**
- Delay auto-download by 600 ms so the branded card paints first.
- Show the filename, file size (read from the blob), and a **"Open in browser"** secondary button in addition to **"Download document"**.
- Add the JBJ monogram + tagline (`JBJ GLOBAL REAL ESTATE LLC SOC · Secure document delivery`) above the title — same wordmark used in emails.

---

## Phase B — Signature picker bugs (today's blockers)

### B1. Blue hover/border in Send-via-email signature picker
**Symptom:** On `/e-signature/:id → Send via email`, the signature `<Select>` shows a blue focus ring and blue item hover, and the surrounding field's border turns blue on focus.

**Fix in `SendViaEmailDialog.tsx`:**
- Trigger className additions: `focus:ring-[#B89555]/40 focus-visible:ring-[#B89555]/40 focus:border-[#B89555] focus-visible:border-[#B89555] focus:outline-none`.
- Select item className additions: explicit `data-[highlighted]:bg-[#EFE6D6] data-[highlighted]:text-[#1A1A1A] aria-selected:bg-[#EFE6D6]` to override Radix defaults.
- Wrap the surrounding `<div>` so its `:focus-within` ring is gold, not the browser-default blue.

### B2. Selecting one signature renders all signatures stacked
**Symptom:** Choosing "JBJ Front Desk" shows Front Desk + Help Desk + Support concatenated in the preview/email.

**Cause:** `selectedSigHtml` is being derived from a `.map(...).join("")` instead of `.find(s => s.id === selectedSigId)` somewhere in the right-pane email-preview composition path. There is also a fallback in `buildEnvelopeEmailHtml` that appends every preset when `signature_html` is empty.

**Fix:**
- In `SendViaEmailDialog.tsx`, hard-guarantee that `selectedSigHtml = selectedSig ? renderSignatureHtml(selectedSig) : ""` and never falls back to "all".
- In `buildEnvelopeEmailHtml.ts`, remove the legacy "if no signature, stitch all presets" branch.
- Also fix `esign-send-for-signature/index.ts` so the function ignores `signatures[]` and only uses the single `signature_html` field sent from the dialog.

### B3. Default subject + body locked to "Signature Required" for PAA
The dialog already calls `normalizeSubject` which forces `Signature Required: …`. The bug is that the **stored** default for new envelopes still uses the old "Please sign" template, so the very first open shows the wrong subject until normalize runs.

**Fix:**
- Update the seed data in `paa-sync-listing/index.ts` and the envelope-create RPC so new envelopes start with `email_subject = "Signature Required: <doc name>"` and `email_message = NEW_DEFAULT_BODY_HTML`.
- Migration: `UPDATE esign_envelopes SET email_subject = ... WHERE email_subject ILIKE 'please sign%'` to back-fix the existing rows.

### B4. Subject duplicated inside the email body card
The current branded template prepends the subject as an H1 inside the card. Remove that — the subject already lives in the email header.

**Fix:** Strip the `<h1>{subject}</h1>` block from `buildEnvelopeEmailHtml.ts` body section. Only the header bar and the body content remain inside the card.

---

## Phase C — Signed-back intake + Applications tab (was "Phase 5")

The user replied to the envelope email with the signed PDF, but no thank-you arrived and the contract didn't surface in the back-end. Two things wired together:

### C1. Signed-back inbound classifier
- Audit `esign-inbound-autoreply/index.ts` and `gmail-inbox-sync/index.ts` — confirm the classifier flips `esign_envelopes.status → 'signed_returned'` and inserts a row in `esign_envelope_returns` when an inbound email matches:
  - reply-to/in-reply-to header references the envelope's outbound message-id, OR
  - the subject contains the envelope's `doc_number`, AND
  - has at least one PDF attachment.
- After the flip, invoke `esign-send-signer-thanks` with `{envelope_id}` so the client gets the thank-you mail you expected to receive but didn't.
- Add a database trigger that writes to `crm_action_logs` for audit.

### C2. New **"Applications"** tab in Forms & Agreements
A new bucket `submitted` already exists in the hub but is empty. Wire it:
- Query envelopes where `status IN ('signed_returned','approved','rejected')` and surface them in a dedicated tab with columns: Client · Property · Doc # · Submitted at · Status pill.
- Two row actions: **Approve** (`status → approved`, fires `esign-send-signer-thanks` with the "approved" variant) and **Reject** (`status → rejected`, opens a reason textarea, sends the rejection template).
- A right-rail panel shows the original PDF and the signed-back PDF side-by-side so you can verify in seconds.

### C3. Schema migration
```sql
ALTER TYPE esign_envelope_status ADD VALUE IF NOT EXISTS 'signed_returned';
ALTER TYPE esign_envelope_status ADD VALUE IF NOT EXISTS 'approved';
ALTER TYPE esign_envelope_status ADD VALUE IF NOT EXISTS 'rejected';

CREATE TABLE IF NOT EXISTS public.esign_envelope_returns (
  id uuid primary key default gen_random_uuid(),
  envelope_id uuid not null references esign_envelopes(id) on delete cascade,
  inbound_message_id text,
  signed_document_url text,
  received_at timestamptz default now(),
  reviewed_at timestamptz,
  reviewed_by uuid,
  decision text check (decision in ('approved','rejected','pending')),
  rejection_reason text
);
ALTER TABLE public.esign_envelope_returns ENABLE ROW LEVEL SECURITY;
-- Owner-only policies (already-defined helper `is_owner(auth.uid())`).
```

---

## Phase D — Unified Forms & Agreements hub (was "Phase 6")

You currently have three separate places: `/e-signature/:id`, `/owner/sign` (Adopt Signature Studio), and `/owner/documents-forms-hub` plus the AI document generator. Consolidate behind one route with inline sections, no full-page navigations.

### D1. Single hub at `/owner/forms`
- New top bar with section pills:
  **Templates · Drafts · Sent · Applications · Signed · Library · Signatures · Stamps · AI Tools**
- Each pill swaps the right pane without a route change. Deep links survive via `?section=…&id=…`.

### D2. Inline e-signature editor
- Pull the `/e-signature/:id` editor into a **right-rail panel** of `/owner/forms?section=drafts&id=…`. No route change when opening a draft.
- Keep `/e-signature/:id` as a permanent deep-link alias that internally redirects to `/owner/forms?section=drafts&id=:id` so existing links keep working.

### D3. Inline Adopt Signature studio
- Convert `/owner/sign` into an inline section under `/owner/forms?section=signatures`.

### D4. Inline AI Doc Generator + Stamp Manager
- Move `AIDocumentGeneratorPremium` and `StampManagerDialog` into hub sections.

---

## Phase E — Responsive overflow ("View" outside its button)

You showed the recipient list overflowing its container on small screens.

- Add `min-w-0` to every flex parent of a truncated label across `DocumentsFormsHub.tsx`, `EmailRecipientChips.tsx`, the inbox chat thread header, and `CRMLeadsTableV2.tsx` row toolbar.
- Replace the per-row "View" button label with an icon-only `<EyeIcon />` under `sm:`, and a labelled button on `≥ sm`.
- Add a global CSS guard: any element with `data-overflow-guard` enforces `max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;`. Apply it to recipient chips and row labels so a chip can never escape its row.
- Run the existing `scripts/a11y/keyboard-focus-probe.mjs` against `/owner/forms` at 360 px width to catch any remaining overflows.

---

## Phase F — AI command chat panel (was "Phase 6 AI")

A new right-rail chat under any Forms hub section that lets you drive everything by chat:

- Powered by the existing `ai-executive-assistant` edge function with a new tool list: `send_envelope`, `approve_application`, `reject_application`, `download_signed`, `resend_to_signer`, `mark_junk`.
- Streams responses, shows actions as inline pill buttons that fire the same RPCs the UI uses.
- Persists thread in `crm_chat_messages` with `scope='forms_hub'`.

---

## Phase G — Follow-up intelligence + fully wired bulk actions (was "Phase 7")

- **Follow-up intelligence:** background scan that nudges you on the 3rd, 7th, 14th day after a Sent envelope has no reply. Reuses `ai-followup-scheduler`. Surfaces in the Sent tab as a coloured chip ("Nudge sent 3d ago · awaiting reply").
- **Bulk actions:** in Sent and Applications tabs, header-row checkboxes + a sticky action bar: **Resend reminder · Mark approved · Archive · Export PDFs (zip)**.

---

## Phase H — Inbox redesign (Gmail-modify reflection + AI Suggestions)

- **Gmail-modify reflection:** when you read/star/archive in Gmail, the inbox UI updates within 5 s via the existing `gmail-inbox-sync` cron (currently 60 s). Drop interval to 10 s, add a Realtime channel on `crm_inbox_messages` for optimistic reflection.
- **AI Suggestions tab redesign:** replace the current dense list with a card-grid: each card = one thread, with a one-line AI summary, a confidence chip, two CTAs ("Use draft", "Edit & send"), and a swipe-to-dismiss gesture. Champagne/gold surfaces only — no blue.

---

## Verification

For each phase, the test scripts/commands are:

- **A1:** open three different PAA envelopes; preview must have no trailing whitespace > 12 px.
- **A2/A3:** click Download PDF from desktop Chrome with uBlock Origin enabled; URL bar must show `jbj.ae`, no block; mobile Safari "share" sheet must show `jbj.ae` as source.
- **B1:** keyboard-focus the Signature select and the recipient input — both rings are gold, never blue.
- **B2:** pick each preset in turn; preview right pane shows exactly one signature block, matching the picked preset.
- **B3:** open a brand-new envelope; Subject reads `Signature Required: <doc>` on first paint.
- **B4:** inspect the rendered preview HTML — no `<h1>` containing the subject inside the card.
- **C:** reply to a sent envelope with a PDF from `infoo.jane@gmail.com`; within 60 s the envelope appears in Applications, you receive a thank-you, and Approve flips its state.
- **D:** all three legacy routes redirect into `/owner/forms?section=…` and the right rail opens without a hard page transition.
- **E:** drag the preview to 360 px wide — no element extends past its parent in any of the tabs.
- **F:** "Approve the last application from Sarah" in the AI chat triggers the same Approve action.
- **G:** select 3 envelopes → Resend reminder → all three get a follow-up email.
- **H:** archive a thread in Gmail web → inbox UI reflects within 10 s without manual refresh.

---

## Order of delivery (so you see fixes immediately)

1. **Today, in this turn:** Phase A + Phase B + Phase E (all the user-facing blockers).
2. **Next turn after approval:** Phase C (signed-back intake + Applications tab — needs a migration round-trip).
3. **Following turn:** Phase D (route unification).
4. **Then:** Phases F → G → H.

Out of scope right now: any change to the downloaded PDF itself, the auth/email-template HTML, or pricing/billing UI.
