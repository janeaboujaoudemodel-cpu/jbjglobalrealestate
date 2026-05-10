
# Email Command Center for JBJ Global Real Estate

Turn the connected Gmail inbox into a fully organized command center under the CRM Email section. Every JBJ-related email gets classified, surfaced with the action you owe back, and contract-related ones automatically flow into the Developer CRM as registered + signed.

## 1. Where it lives

New top-level area in the CRM Email section (the same place where the email log is today):

```text
/owner/crm  →  Email tab
   ├─ Overview               ← all JBJ-related emails, smart-filtered
   ├─ Contracts & Signed     ← signed agreements, auto-linked to developers
   ├─ Opportunities          ← off-plan, project pitches, JV
   ├─ Registrations          ← agency registration with developers
   ├─ Partnerships           ← brokerage / agency partnerships
   ├─ Careers                ← CVs, hiring, recruiters
   └─ Other / Uncategorized
```

Each category shows: sender, subject, snippet, received date, **status chip** (Awaiting you / Awaiting them / Signed / Registered / Info only), and a **suggested next action** button.

## 2. Classification engine (Gmail → categories)

Extend the existing `gmail-inbox-sync` edge function so every fetched message is scored against JBJ keywords and routed:

- **JBJ-related filter**: sender/recipient/subject/body contains `jbj`, `jbjglobal`, `jbj global real estate`, owner aliases from `src/config/ownerEmails.ts`, or known developer domains in `crm_developer_registry`.
- **Category rules** (regex + keyword bag, deterministic first, AI fallback only for ambiguous):
  - `contracts` → "signed agreement", "fully executed", "DocuSign completed", "countersigned", attachments named `*contract*.pdf`
  - `registrations` → "registration form", "register your agency", "broker registration", "RERA", "principal broker"
  - `opportunities` → "new launch", "EOI", "allocation", "project brief", "inventory"
  - `partnerships` → "partnership", "MOU", "collaboration", "co-broking"
  - `careers` → "CV", "resume", "application for", "candidate", "hiring"
  - everything else with a JBJ hit → `overview/other`
- **Action inference**: detect phrases like "please sign", "kindly confirm", "awaiting your response" → status `awaiting_you`; "we've received", "will revert", "under review" → `awaiting_them`.

Results stored per message in a new table `email_inbox_items` (category, status, action_required, suggested_reply, linked_developer_id, linked_contract_url, confidence).

## 3. Contracts & Signed pipeline

Reuses + extends the just-built `sync-developer-contracts` function:

1. Pull any message classified as `contracts` (or with PDF attachments + signed keywords).
2. Match to a developer in `crm_developer_registry` by email/domain/name (existing scoring).
3. On high-confidence match:
   - Save the PDF attachment to storage, set `contract_document_url`.
   - Set `contract_status = signed`, `contract_signed_at`, `contract_synced_at`.
   - Mark the inbox item `status = signed` and link it to the developer row.
4. On low confidence: leave a "Needs review" card in the Contracts tab with one-click "Link to developer X".

## 4. Auto registration-confirmation loop

Goal: once a contract is signed with a developer, automatically confirm we are now their registered agency, then update the CRM the moment they reply yes.

1. **Trigger**: developer flips to `contract_status = signed`.
2. **Outbound email** (template "registration-confirm-request"):
   - To: developer contact email.
   - Subject: "Confirming JBJ Global Real Estate registration with {{developer_name}}".
   - Body: polite ask to confirm we are registered, requests the registration certificate/PDF if available.
   - BCC: founder address (see section 6).
   - Logged in `email_send_log` + linked to the developer row.
3. **Inbound watcher**: extend gmail sync to look for replies in that thread.
   - Positive intent ("yes, registered", "you are listed", "approved", "active in our system") → set `registration_status = registered`, `registered_at = now()`, surface a green "Registered" badge on the developer in CRM.
   - If reply has a new PDF attachment and we don't yet have a contract doc, attach it as `contract_document_url`.
   - If positive intent but no attached document → fire a follow-up template asking for the signed agreement PDF.
4. **Negative / unclear reply** → keep status `pending_confirmation` and drop a card in Required Actions.

All state transitions audited in `developer_contract_sync_logs` (already exists) + a new `developer_registration_sync_logs`.

## 5. Required Actions panel (already exists, expanded)

`DeveloperActionsRail` is extended so each inbox item with `status = awaiting_you` becomes an action card with the right CTA:

- "Sign contract" → opens contract viewer
- "Reply with documents" → opens locked-send composer prefilled
- "Confirm registration" → opens the registration-confirm template
- "Send chase email" → fires the follow-up asking for the signed PDF

## 6. Mandatory BCC to founder

Every outbound email the system sends (registration confirm, chase, replies, contract acknowledgements) is BCC'd to **drjane@gmail.com**.

- Add `drjane@gmail.com` to `src/config/ownerEmails.ts` so it never appears in the CRM directories.
- Centralize the BCC in one helper used by every outbound edge function (`sendOutboundEmail`) so it can't be forgotten.
- Surfaced in the composer UI as a locked "BCC: drjane@gmail.com" chip the user cannot remove.

## 7. UI build

- New page `src/pages/CRMEmailCenter.tsx` mounted inside the existing CRM Email section.
- Sub-tabs implemented as the existing segmented-control style (champagne tokens, no gold fills).
- Each row uses `IconTile` with semantic tones: Contracts=purple, Registrations=blue, Opportunities=amber, Partnerships=emerald, Careers=rose, Other=gold.
- Status chips: Awaiting you (amber), Awaiting them (blue), Signed (emerald), Registered (emerald), Needs review (rose).
- Header buttons: **Sync inbox now**, **Sync signed agreements**, **Send pending confirmations**.

## 8. Technical pieces

- **DB migration**:
  - `email_inbox_items` (message_id unique, gmail_thread_id, category, status, action_required text, suggested_reply text, linked_developer_id, linked_contract_url, confidence numeric, received_at, raw_subject, from_email, snippet, attachments jsonb).
  - `developer_registration_sync_logs` (developer_id, gmail_message_id, direction in/out, outcome, parsed_intent, created_at).
  - Add `registration_status`, `registered_at`, `registration_confirmed_message_id` to `crm_developer_registry`.
  - RLS: owner/admin only on all new tables.
- **Edge functions**:
  - Extend `gmail-inbox-sync` → classify + write `email_inbox_items`.
  - Extend `sync-developer-contracts` → also link to the inbox item.
  - New `send-registration-confirmation` (uses template, BCC enforced).
  - New `parse-registration-reply` (scans Gmail thread replies, updates developer status).
  - Update `send-developer-reply` and any other outbound function to apply the central BCC helper.
- **Frontend**:
  - `src/pages/CRMEmailCenter.tsx`, `src/hooks/useEmailInboxItems.ts`.
  - Tab integration in the existing CRM Email entry point.
  - Reuse `BrandedEmailComposer` for any manual replies, with the new templates registered in `useEmailTemplateLibrary`.

## 9. Out of scope (will not be touched)

- The current investor / broker CRM sections.
- Any change to public site styling.
- Replacing the existing Branded Email Composer logic — only adding templates and the BCC helper.

## 10. Confirmation needed before build

- Founder BCC address — you wrote **drjane@gmail.com**; please confirm exact spelling (e.g. `dr.jane@…`, `info.jane@…`).
- Should outbound auto-emails be sent immediately on contract-signed detection, or should I queue them as drafts in a "Send pending confirmations" panel that you approve with one click? I'd recommend the queue so nothing leaves without your eyes on it.
