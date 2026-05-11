## Goal

Three deliverables in one shot:

1. **Lock in `infoo.jane@gmail.com` as the saved test-recipient** for every signing/preview send going forward — no extra login needed — and **redeploy + re-fire** the signing invite to that inbox so you actually receive it.
2. **Explain where to click "Agreement / e-signature"** and remove the "We're getting things ready" overlay you are seeing.
3. **Execute section D of the previous plan** (the queued follow-ups): Sell/Rent intake templates, default CC `info@janeagmail.com`, Resend sender `JBJ Global Real Estate <noreply@jbj.ae>`, AI-prefilled Leasing/Selling agreements with Approve / Approve & Send, and Relationship Hub cleanup.

---

## 1. Test recipient is already saved — just redeploy & fire

Findings from the code:

- `supabase/functions/esign-send-test-email/index.ts` already has `const TEST_RECIPIENT_DEFAULT = "infoo.jane@gmail.com";` — when no `test_recipient` is passed in the body, it sends there automatically.
- `src/config/ownerEmails.ts` already lists `infoo.jane@gmail.com` as one of your owner inboxes (it's excluded from CRM directories).

So the email is already saved. What's missing is:

1. A **persistent default** in localStorage / `user_preferences` (`owner_test_recipient = 'infoo.jane@gmail.com'`) so every "Send Test Email" button across CreateEnvelope / EnvelopeDetail / ContractReview pre-fills that address without you typing it.
2. **Redeploy** `esign-send-test-email` so the latest changes are live.
3. **Trigger the test send now** for the most-recent envelope you have in `esign_envelopes` (sender_id = you, latest by `created_at`) so the email lands in `infoo.jane@gmail.com`.

### Where to find "Agreement / e-signature"

In the running app you reach it three ways — all already wired, no new UI:

- **Top header → Owner menu → "E-Signature"** (route `/e-signature`)
- **Owner CRM sidebar → "Agreements"** subsection → "Open E-Signature"
- Direct URL: `https://www.jbj.ae/e-signature`

Once on `/e-signature` you see the dashboard (`ESignatureDashboard.tsx`). Click any envelope row → `EnvelopeDetail.tsx`, and the **"Send Test Email"** button is at the top-right of that page.

### Why you saw "We're getting things ready"

That overlay is **not a screen inside the app** — it is the Lovable preview shell's "page taking a moment to load" message. It appears when the dev sandbox is cold-booting and the first HTML response is delayed (>3 s). The agent code change we just shipped (`ownerLoading=false`, optimistic OwnerGuard) removed the **app-level** dark "Verifying access" splash, which was the actual app bug. The lighter "getting things ready" card is platform-level and goes away after the dev server warms up; we can speed it up by trimming the eager imports in `App.tsx` (currently 36) — covered in section 4 below.

---

## 2. Section D — full feature build

### 2.1 Resend brand sender + default CC

- Centralise outbound sender identity in `src/config/outreachIdentity.ts` (already exists). Set:
  ```ts
  export const OUTBOUND_FROM_NAME = "JBJ Global Real Estate";
  export const OUTBOUND_FROM_EMAIL = "noreply@jbj.ae";
  export const OUTBOUND_DEFAULT_CC = ["info@janeagmail.com"];
  ```
- Update every Resend-sending edge function to read these constants and always append `OUTBOUND_DEFAULT_CC` to the `cc` array (deduped vs primary recipient):
  - `esign-send-for-signature`
  - `esign-send-reminder`
  - `esign-send-signer-thanks`
  - `esign-send-test-email`
  - `send-locked` / `outreach-send-locked`
  - `send-branded-email` (if present)
- Apply the **Single-Agency Email Rule** guard already present (`requireOwnerAuth` + brokerage check).

### 2.2 Sell / Rent intake templates (Email Template Library)

Three new locked templates in the existing `email_templates` table (used by `useEmailTemplateLibrary.ts`). All branded HTML, all variables interpolated server-side:

| key | Purpose | Triggered from |
|---|---|---|
| `intake_sell_request_docs` | Asks seller for title deed, passport copy, Ejari/SPA, photos, asking price, availability | CRM lead → "Selling" pipeline |
| `intake_rent_request_docs` | Asks landlord for title deed, passport, current Ejari, photos, rent expectation, vacancy date | CRM lead → "Leasing" pipeline |
| `intake_buyer_brief` | Asks buyer/tenant for budget, area preferences, timeline, financing, decision-makers | CRM lead → "Buyer/Tenant" pipeline |

Each template:
- Subject auto-generated from template key + client first name.
- Body uses JBJ champagne brand HTML (Inter, gold hairline, no fills).
- Sender = `JBJ Global Real Estate <noreply@jbj.ae>`, CC = `info@janeagmail.com`, reply-to = active owner inbox.

### 2.3 AI-prefilled Leasing / Selling agreements with Approve / Approve & Send

New flow on `/e-signature` → "New Agreement":

1. **Pick type**: Leasing Authorisation / Selling Authorisation / Buyer Brokerage.
2. **Source data**: lookup the CRM lead → pull property + party fields → call `lovable-ai` (`google/gemini-2.5-flash`) with a structured prompt to draft the agreement using `src/templates/jbjListingAuthorisation.ts` as the skeleton.
3. **Two-button footer** in `CreateEnvelope.tsx`:
   - **Approve** → saves to `esign_envelopes` as draft, you can edit fields.
   - **Approve & Send** → locks via `outreach-lock-payload`, fires `esign-send-for-signature` to the client, CC's `info@janeagmail.com`, sender = `JBJ Global Real Estate <noreply@jbj.ae>`.

Backend pieces:
- New edge function `esign-ai-prefill-agreement` — uses Lovable AI Gateway, returns field values for the chosen template.
- Reuse the existing `outreach-lock-payload` + `outreach-send-locked` pipeline for byte-for-byte preview = sent guarantee (already memory-locked Locked-Send Outreach Standard).

### 2.4 Relationship Hub cleanup

- Remove the "red Gmail" badge from Relationship cards — the column is misleading because we now route everything through Resend.
- Remove the "breakfast booking" CTA from generic relationship cards (it was leaking from a one-off campaign). Keep it only inside the specific Breakfast Campaign view at `/owner/crm?section=campaigns&id=breakfast`.
- Restyle the contact-action row to the champagne IconTile standard: Call · WhatsApp (wa.me) · Email · Note · Task.

---

## 3. Performance fix for the "getting things ready" preview overlay

Reduce cold-start so the platform overlay never has time to appear:

- Convert the 7 route-bundle imports in `App.tsx` (`OwnerRoutes`, `AdminRoutes`, `AIToolRoutes`, `ToolkitRoutes`, `DeveloperHubRoutes`, `StandaloneRoutes`, `PublicRoutes`) from eager to `lazy()` + `<Suspense>`. Only `PublicRoutes` stays eager (it owns `/`).
- Defer non-critical providers (`PodcastVisibilityProvider`, `BrandPaletteProvider`) to mount after first paint via `useEffect`.
- Lazy-load heavy contexts (`LanguageProvider`'s translation cache) — gate the auto-translate engine on `requestIdleCallback`.

No memory rules are violated: header L-shape, design tokens, IconTile, content sanitization, and locked-send standards stay intact.

---

## 4. End-to-end QA checklist after build

- `/e-signature` opens with no dark splash and no "getting things ready" overlay on a warm preview.
- Click "Send Test Email" on the latest envelope → inbox `infoo.jane@gmail.com` receives the byte-for-byte email, CC'd `info@janeagmail.com`, From: `JBJ Global Real Estate <noreply@jbj.ae>`.
- Home tiles Investor / Broker / Academy / Company / Developer no longer blink.
- CRM lead → "Request Selling Docs" / "Request Leasing Docs" / "Send Buyer Brief" fires the right intake template.
- "New Agreement → Leasing / Selling → AI Prefill → Approve & Send" delivers a signing invite to the client and CC's `info@janeagmail.com`.
- Relationship Hub cards no longer show red-Gmail or stray breakfast booking CTA.

---

## Technical detail — files touched

**Backend (edge functions):**
- `supabase/functions/esign-send-test-email/index.ts` — already correct, redeploy.
- `supabase/functions/esign-send-for-signature/index.ts` — add CC + brand sender.
- `supabase/functions/esign-send-reminder/index.ts` — same.
- `supabase/functions/esign-send-signer-thanks/index.ts` — same.
- `supabase/functions/outreach-send-locked/index.ts` — same.
- `supabase/functions/esign-ai-prefill-agreement/index.ts` — **new**.

**DB migration:** seed 3 rows into `email_templates` (sell/rent/buyer intake).

**Frontend:**
- `src/config/outreachIdentity.ts` — centralised sender/CC constants.
- `src/pages/e-signature/CreateEnvelope.tsx` — AI prefill + Approve / Approve & Send buttons.
- `src/pages/e-signature/EnvelopeDetail.tsx` — pre-fill test recipient with saved owner default.
- `src/hooks/useEmailTemplateLibrary.ts` — surface new intake templates.
- `src/pages/owner/crm/sections/RelationshipsSection.tsx` — strip red-Gmail / breakfast CTA.
- `src/App.tsx` — convert route bundles to `lazy()`.

No new dependencies. No new auth flows. Owner-only RLS unchanged. Locked-Send Outreach Standard, Champagne-Gold design, IconTile, Single-Agency Email Rule, OwnerGuard optimistic render — all preserved.
