## Goal

When you click **Send**, you should clearly see (1) the exact email being sent before it goes out, and (2) a separate organized section listing every developer that has already been emailed, with delivery status visible per row.

---

## What changes

### 1. Email preview inside the Send dialog (`BulkSendDialog.tsx`)

Currently the dialog shows variant, test field, and recipient counts — but not the email body itself. Add a live preview:

- Fetch the locked/draft template HTML for the chosen variant via `useEmailTemplate(variant)`.
- Render it inside an `<iframe srcDoc={...}>` block, ~360px tall, with a header strip:
  - **Subject:** {template.subject}
  - **From:** noreply (your address) → **To:** {first selected developer name} (sample preview)
  - **Variant:** New registration request / Confirm we're already registered
  - 🔒 **Locked** badge if `locked_at` is set, otherwise ⚠️ **Draft (editable)**
- The `{{developer_name}}` placeholder gets substituted with the first selected developer for realistic preview.
- A small "Showing preview for: [dropdown of selected devs]" lets you spot-check how it'll look for any specific recipient.
- The preview updates instantly when you toggle variants.
- This is the SAME HTML the edge function will send — no divergence possible.

### 2. New "Sent History" view inside Developer Registry tab

Restructure the Developer Registry tab into two sub-tabs at the top:

```text
┌─────────────────────────────────────────────────────┐
│  [ Outreach Queue (74) ]  [ Sent History (19) ]     │
└─────────────────────────────────────────────────────┘
```

- **Outreach Queue** — current list, but filtered to developers with `last_outreach_at IS NULL` AND `status != 'registered'` (i.e. who still need to be contacted).
- **Sent History** — every developer where `last_outreach_at IS NOT NULL` OR `status = 'registered'`, sorted by `last_outreach_at DESC`.

Sent History row shows:
- Developer name + status pill
- **Last sent:** "2 days ago" (with full timestamp on hover)
- **Total sends:** `outreach_count` (e.g. ×3)
- **Delivery status badge** pulled from `email_send_log` joined by recipient_email + template_name:
  - 🟢 Delivered · 🔵 Sent · 🟡 Pending · 🔴 Bounced/Failed · ⚪ Suppressed
- **Variant used** (last one): "New registration" or "Confirm registered"
- Quick actions: **Re-send** · **Mark as Registered** · **View email log** (opens a small dialog showing every send to this developer with timestamp + status)

A search/filter bar at the top of Sent History: search by name, filter by delivery status, filter by variant.

### 3. During the send loop — show what's being sent per developer

In the bulk send progress UI, instead of just "Sending 3 / 12…", show:

```text
Sending 3 / 12 — AAA Development (brokers@aaa.ae)
✅ Damac Properties · sent
✅ Emaar · sent
⏳ AAA Development · sending…
⚪ Sobha · queued
⚪ Nakheel · queued
```

A scrollable live list inside the dialog, each row updating as the loop progresses. After completion, the dialog stays open with a summary so you can review which ones succeeded/failed before closing.

### 4. Delivery status sync

Add a hook `useEmailDeliveryStatus(recipientEmails: string[])` that queries `email_send_log` (deduplicated by `message_id`, latest per recipient + template) and returns a map. The Sent History rows use this to show real delivery status, not just "we attempted to send".

---

## Files touched

- `src/components/crm/BulkSendDialog.tsx` — add iframe preview, per-recipient progress list
- `src/pages/CRMRelationships.tsx` — split DeveloperRegistryTab into Outreach Queue / Sent History sub-tabs
- `src/components/crm/SentHistoryView.tsx` — **new** component for the history list
- `src/components/crm/EmailLogDialog.tsx` — **new** small dialog showing per-developer send log
- `src/hooks/useCRMRelationships.ts` — add `useEmailDeliveryStatus` hook querying `email_send_log`

No schema changes — all data already exists in `crm_developer_registry` (`last_outreach_at`, `outreach_count`, `last_variant`) and `email_send_log` (delivery status).

---

## Out of scope

- Live webhook-based delivery updates (status refresh requires page refresh or refetch button — Resend bounce webhooks aren't wired into this project's `email_send_log` yet).
- Per-developer custom email body — same locked template is used for everyone in the bulk send (matches your earlier "cannot change later" requirement).
