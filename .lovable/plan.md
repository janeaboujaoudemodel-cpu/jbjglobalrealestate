## Pre-send duplicate check for brokerage breakfast outreach

Before any breakfast-event email goes out, the system should automatically check if the brokerage **company** or its **contact email** is already registered in the CRM and warn or block accordingly. Today the bulk send flow only deduplicates against `last_outreach_at` (skips anyone contacted in the last 7 days) — it does **not** verify whether the company/contact already exists as a lead, client, broker, or in the relationship email log.

### What "already registered" means (4 signals)

For a target brokerage row in `crm_brokerages`, check whether:

1. **Company is already an active partner** — the row's own `status = 'active'` or `outreach_stage IN ('responded','meeting_booked','partner_signed')`, or `nda_status = 'signed'`. They've already been onboarded; sending a cold breakfast invite would be embarrassing.
2. **Contact email exists elsewhere in the CRM**:
   - `crm_leads.email` (active leads — they may already be in pipeline as a buyer/investor lead)
   - `crm_clients.email` (existing clients)
   - `crm_brokers` / `broker_profiles.email` (registered platform brokers)
3. **A previous breakfast invite was already sent** — `crm_relationship_email_log` already has a row where `entity_type='brokerage'`, `entity_id` matches, and `body_snippet` mentions "private breakfast invitation" (the exact phrase the send function writes).
4. **Marked do-not-contact** — `do_not_contact = true` on the brokerage row. This is already an implicit block but should surface explicitly.

### Implementation

#### 1. New edge function: `crm-check-brokerage-registration`

Owner-only, mirrors the auth pattern from `crm-send-brokerage-outreach`. Input:
```ts
{ brokerageIds: string[], variant: BrokerageVariant }
```
Output (per id):
```ts
{
  brokerageId: string,
  status: "ok" | "warn" | "block",
  reasons: Array<{
    code: "already_partner" | "lead_exists" | "client_exists" | "registered_broker" |
          "previous_breakfast_invite" | "do_not_contact",
    label: string,            // human-readable for the UI
    matchedTable?: string,    // e.g. "crm_leads"
    matchedId?: string,
    matchedEmail?: string,
  }>
}
```

Rules:
- `do_not_contact` → **block** (always, regardless of variant).
- `already_partner` → **block** for `brokerage_breakfast_invite` (don't invite an existing partner to a "let's get to know you" breakfast); **warn** for `brokerage_partnership_intro`.
- `previous_breakfast_invite` (same variant already sent) → **block**.
- `lead_exists` / `client_exists` / `registered_broker` → **warn** (the contact may be wearing two hats — show owner the match so they can decide).

The function uses the service-role client and queries:
- `crm_brokerages` for status/stage/nda/dnc on the target.
- `crm_leads`, `crm_clients`, `crm_brokers` joined on `LOWER(email)` against `LOWER(primary_contact->>'email')`, `secondary_contact->>'email'`, and the brokerage's `email` column.
- `crm_relationship_email_log` filtered by `entity_id` + variant marker in `body_snippet`.

#### 2. New hook: `useCheckBrokerageRegistration`

In `src/hooks/useCRMRelationships.ts` — invokes the edge function and returns the per-id check results. React Query mutation, no caching (results must be fresh at send time).

#### 3. Wire into `BulkSendDialog`

Update `src/components/crm/BulkSendDialog.tsx` (only when `entityType === "brokerage"`):

- New automated step **between** "Test send" and "Send to all": **Step 2 — Pre-flight registration check**.
- When the owner clicks **Send to all** for the first time (the existing `reviewing` gate), run the check on all `targets` in one batched call.
- Render results inline in the existing review table:
  - Green ✓ "OK to send" rows.
  - Amber ⚠ "Warn" rows with reasons listed (e.g. "Contact john@x.com is already a CRM lead since Mar 2025"). Owner can tick a per-row override checkbox to include them.
  - Red ✕ "Blocked" rows — disabled, cannot be sent (with a clear reason). They are filtered out of the eventual send loop.
- New summary line: "X ready · Y warnings · Z blocked".
- Add an `onlyShowProblems` toggle to filter the table to flagged rows.
- The actual `sendAll()` loop only iterates over `status === "ok"` rows + warn rows the owner explicitly approved.

#### 4. Server-side guard (defence in depth)

Inside `crm-send-brokerage-outreach`, before sending a real (non-test) breakfast invite, run the same check inline for the single brokerage and refuse with 409 if `status === "block"`. This way the check is enforced even if the dialog is bypassed (e.g. a future automation calls the function directly). Test sends bypass the check.

### Files touched

```
supabase/functions/crm-check-brokerage-registration/index.ts   (new)
supabase/functions/crm-send-brokerage-outreach/index.ts        (add inline guard)
src/hooks/useCRMRelationships.ts                                (new hook)
src/components/crm/BulkSendDialog.tsx                           (review step UI)
```

### Out of scope

- No DB migrations — uses existing tables.
- No new template variants.
- Developer-registration flow is unchanged (this is brokerage-only).
- No bulk override "send anyway to all blocked" button — blocks must be resolved one row at a time on purpose.
