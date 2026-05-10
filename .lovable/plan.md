# End-to-end test of the Email Command Center

Goal: verify the full chain you built over the last sessions — Gmail → classification → inbox center → developer contracts → registration confirmation → CRM auto-update — all from one place.

## 1. Where it lives (recap)

```text
/owner/crm?entity=leads&view=email-center      ← Email Center (new)
/owner/crm?entity=leads&view=inbox             ← Raw Owner Inbox + actions rail
/owner/crm?entity=leads&view=contracts         ← Contract Vault
/owner/crm?entity=developers&view=registry     ← Developer registry (status flips here)
```

## 2. Pre-flight checks (read-only, no edits)

- Confirm Gmail connector is connected and has scopes `gmail.readonly` + `gmail.send` + `gmail.modify`.
- Confirm tables exist and are empty/seeded as expected:
  `email_inbox_items`, `developer_contract_sync_logs`, `developer_registration_sync_logs`, `crm_developer_registry` (with `contract_status`, `registration_status`).
- Confirm edge functions deployed: `classify-jbj-inbox`, `sync-developer-contracts`, `send-registration-confirmation`, `gmail-inbox-sync`.
- Confirm `drjane@gmail.com` is in `OWNER_EMAILS` (already verified in code).

## 3. Test matrix (run in order)

### T1 — Email log dialog opens
- Open any developer / lead with prior outbound email → click "Email log".
- Pass criteria: dialog renders within 1s, shows rows with status badges, no "Loading…" hang.

### T2 — Inbox classification
- In Email Center header click **Sync inbox now** (`classify-jbj-inbox`).
- Pass criteria: toast `Inbox synced — N new JBJ email(s)`, rows appear under Overview / Contracts / Registrations / Opportunities / Partnerships / Careers tabs with correct category + confidence.

### T3 — Contract auto-link
- In Developers tab click **Sync signed agreements** (`sync-developer-contracts`).
- Pass criteria: at least one developer flips to `contract_status=signed`, `contract_document_url` populated, audit row in `developer_contract_sync_logs`, and the matching inbox item shows status `signed`.

### T4 — Registration confirmation (outbound)
- On a developer that just went `signed`, click **Ask developer to confirm registration**.
- Pass criteria: edge function `send-registration-confirmation` returns 200; raw email contains `Bcc: drjane@gmail.com`; row in `email_send_log` with template `registration-confirm-request`.

### T5 — Inbound reply parsing
- Re-run **Sync inbox now** after a positive reply ("yes, you are registered").
- Pass criteria: developer flips to `registration_status=registered`, `registered_at` set, green Registered badge in registry, inbox item status `registered`.

### T6 — Missing-document chase
- For a `signed` developer with no `contract_document_url`, click **Request signed document**.
- Pass criteria: chase email sent (BCC enforced), inbox item created on next sync when the reply arrives, PDF attached to developer.

### T7 — Founder BCC enforcement
- Inspect raw payloads for every outbound from T4/T6.
- Pass criteria: every send includes `Bcc: drjane@gmail.com`, and `drjane@gmail.com` does **not** appear in Investors / Leads directories.

### T8 — Status filters & counts
- In Email Center, switch between Overview / Contracts / Registrations / Awaiting you.
- Pass criteria: `useInboxCategoryCounts` counts match the visible rows; "Awaiting you" only shows items with `status=awaiting_you`.

## 4. How I will execute it

For each step I will use:
- **Browser tool** — navigate to `/owner/crm?entity=leads&view=email-center` (and the developer registry), click the real buttons, screenshot result.
- **Edge function logs + `email_send_log` + `developer_*_sync_logs` queries** — to verify backend side effects, BCC presence, and audit rows.
- **`read_query`** on `crm_developer_registry` — to confirm status flips.

Browser will be driven with your live preview session, so all sends go through your real connected Gmail. **No test data will be injected** — I will only click buttons that operate on the messages already in your inbox. Any outbound email triggered (T4, T6) will be a real send to the real developer; tell me first if you want me to:
  (a) run T4/T6 for real, or
  (b) stop after T3 and only verify the outbound payload via logs without actually sending.

## 5. Deliverable

A pass/fail table for T1–T8 with screenshots and the relevant log rows, plus a short list of any defects with the exact file/line to fix.

## 6. Confirmation needed before I run it

1. Run T4 + T6 as **real sends**, or **dry-run / payload-only**?
2. Any developer you want me to specifically target (so I don't accidentally email the wrong one)?
