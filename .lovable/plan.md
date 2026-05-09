## Turn 2 plan — Status sections + Test Email button

### 1. Replace "Draft" wording with proper sections
On both `/owner/documents/forms` and `/e-signature` dashboards, group cards under three clear section headers:

- **Forms Generated** — envelope created with client + property data, not yet sent
- **Pending Signature** — sent, awaiting recipient signature
- **Signed** — completed envelopes

Per-card status badge updates:
- "Draft" → **Ready** (when client + property are filled) or **Incomplete** (when missing)
- "Sent" → **Pending Signature**
- "Completed" → **Signed**

No data migration — purely a UI/labeling change driven by existing `status` and field completeness.

### 2. "Send Test Email" button in Send-for-Signature dialog
Add a secondary button beside **Send for Signature**:

```
[ Send Test Email to Me ]   [ Send for Signature ]
```

Behavior:
- Defaults the recipient to `infoo.jane@gmail.com` (locked, read-only display).
- Uses the **exact same** subject + body + HTML template + signing-link layout that the real send would use — byte-for-byte preview = delivered.
- Routes through a new edge function `esign-send-test-email` that:
  - Requires owner auth (`requireOwnerAuth`).
  - Re-uses the existing render pipeline from `esign-send-for-signature`.
  - Sends via Resend to `infoo.jane@gmail.com` only.
  - Logs to `email_send_log` with `template_name = 'esign_test_preview'` so we can fetch proof.
  - Does NOT change envelope status, does NOT create real recipients, does NOT consume the signing token.
- After send, dialog shows a confirmation: *"Test sent to infoo.jane@gmail.com — open your inbox, then click Send for Signature to deliver the same email to the real client."*

### 3. Approval flow → locked template
- After the test send, the dialog displays an **"Approve & Lock"** action.
- On approve, the current subject + body are written to `esign_envelopes.email_subject` and `email_message` for that envelope, and a project-level default snapshot is saved to a new tiny owner-scoped row in `outreach_locked_payloads` keyed by `template_kind = 'esign_send_email'` so future sends auto-load the locked template.
- The next time you open Send-for-Signature on any envelope, the locked subject+body is the default.

### 4. Proof on completion
- Trigger the test email myself via the new edge function with your auth.
- Pull the latest row from `email_send_log` and show: `message_id`, `recipient_email`, `status`, `created_at`.
- Screenshot of the dialog showing the new test button + locked email.

### Files to touch
```text
src/components/e-signature/SendForSignatureDialog.tsx   (add Test button + Approve & Lock)
src/pages/owner/DocumentsFormsHub.tsx                   (section grouping + status labels)
src/pages/e-signature/ESignatureDashboard.tsx           (section grouping + status labels)
supabase/functions/esign-send-test-email/index.ts       (new — owner-only, sends to infoo.jane@gmail.com)
supabase/migrations/<ts>_esign_locked_template.sql      (new row in outreach_locked_payloads)
```

### Out of scope this turn
- CRM Network merge, dropdown filters, per-row CRM actions, Investor toggle, category report configurator — these stay queued for Turns 3 and 4.

After you approve this plan I'll implement it, trigger one real test email to `infoo.jane@gmail.com`, and return with the `email_send_log` proof.
