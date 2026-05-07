
## Brokerage Outreach — Enterprise Upgrade Plan

The outreach system already exists (`outreach-lock-payload`, `outreach-send-locked`, `crm-send-brokerage-outreach`, `TestSendDialog`, `crm_owner_settings`). This plan **upgrades** it — no parallel workflow, no new templates, no UI duplication.

---

### 1. Single source of truth for sender/CC

Create `supabase/functions/_shared/outreachIdentity.ts`:

```
PRIMARY_SENDER     = "jane@citideveloper.com"   // hard-coded, no override
PRIMARY_SENDER_NAME = "Jane Bou Jaoude"
DEFAULT_CC         = "infoo.jane@gmail.com"     // hard-coded, always added
DEFAULT_REPLY_TO   = "jane@citideveloper.com"
```

Every outreach edge function imports from this one file. Any incoming `from_email` from the client is **ignored** in production mode and forced to `PRIMARY_SENDER`. `DEFAULT_CC` is always merged into the cc list (deduped). Same constants are mirrored frontend-side in `src/config/outreachIdentity.ts` for display only.

This kills the current scatter (`crm-send-brokerage-outreach`, `verify-owner`, `crm-bulk-upload-*`, `breakfast-booking-confirm`, etc. each have their own copy).

### 2. Test mode vs Production mode (locked)

Extend `crm_owner_settings.test_profile` with a clear shape:

```
{
  mode: "test" | "production",
  test: { to, cc, from_email, sample_name: "ABC Real Estates", subject_override },
  production: { /* read-only mirror of constants above, shown for transparency */ }
}
```

- `TestSendDialog` keeps its locked-field UI (already built). Defaults reset to: from `jane@citideveloper.com`, to `infoo.jane@gmail.com`, sample name `ABC Real Estates`. Existing `fixEmail()` normalizer stays.
- A **production preview** dialog is added (reuses `DeliveryPreviewDialog`) — read-only chips show locked sender/CC, only Subject is editable then locked.
- Edge functions accept `mode: "test" | "production"`. In production, sender/CC are forced; in test, the saved test profile is used.

### 3. Bulk delivery via Resend (recommended)

**Why Resend over Gmail API for >200/day:** Gmail API caps at ~2,000 sends/day per account and throttles aggressively after a few hundred in a short window. Resend handles 10k+ with proper rate limits, suppression list, bounce/complaint webhooks, and dedicated IP options on `citideveloper.com`. Lovable already has a Resend integration pattern.

Steps:
1. Connect Resend via `standard_connectors--connect` (one-click, the user already uses connectors).
2. Verify domain `citideveloper.com` in Resend (DNS records: SPF, DKIM, DMARC). The user adds these at the registrar — I'll surface the exact records once Resend is connected.
3. Replace the direct-send path in `outreach-send-locked` with: lookup locked payload → call Resend `/emails` via gateway → write `email_send_log` row.

Gmail-API path stays for 1:1 conversational replies (small volume, threading), Resend handles bulk + transactional outreach.

### 4. Bulk queue (true scale)

New table `outreach_bulk_jobs` + per-recipient `outreach_bulk_recipients`:

```
outreach_bulk_jobs(id, owner_id, template_id, subject, html_template, status,
                   total, sent, failed, started_at, finished_at)
outreach_bulk_recipients(job_id, brokerage_id, brokerage_name, email,
                         status, attempts, error, sent_at, payload_hash)
```

- One **locked** master payload is created (sha256 hashed) — covers the "no rewriting after approval" rule.
- Per-recipient send interpolates **only** `{{brokerage_name}}` (per your answer) into the locked HTML/subject; rest is byte-identical.
- New edge function `outreach-bulk-worker` processes batches of ~50 from the queue (Resend's safe rate), invoked every minute by `pg_cron` until `pending = 0`.
- Retries: 3 attempts with exponential backoff, then DLQ on the row.
- Owner sees a live progress card on the CRM Relationships page (sent/total, failed count, ETA) — wired to the existing `OutreachActionsMenu`.

### 5. Per-recipient personalization (fix "Dear Firm Properties" bug)

Single canonical interpolator `src/lib/outreach/renderTemplate.ts`:

```
render(html, { brokerage_name }) → replaces {{brokerage_name}} (whitespace-tolerant)
                                   throws if any {{...}} remains unresolved
```

Both `outreach-lock-payload` (for previews) and `outreach-bulk-worker` (per send) use the same function. Pre-flight validator on bulk job creation:
- All recipients must have non-empty `brokerage_name`.
- Locked HTML must contain at least one `{{brokerage_name}}` occurrence.
- No other unresolved tokens allowed.

### 6. Delivery consistency guarantees

- One locked payload = one canonical HTML (already enforced via `outreach_locked_payloads`).
- Resend gets the **same** HTML for every recipient with only the brokerage_name token replaced server-side.
- Cc list always includes `DEFAULT_CC` (forced merge in worker, not trusted from client).
- `email_send_log` records `payload_hash` per send so any drift is auditable.

### 7. QA / verification before launch

- New script `scripts/outreach/verify-config.mjs` greps the codebase to assert no other sender email exists outside `outreachIdentity.ts`. Runs in CI.
- New test `supabase/functions/_tests/outreach-personalization.test.ts` renders the locked template against 3 sample brokerages and asserts byte-exact match outside the name slot.
- Send-test action (already in `TestSendDialog`) runs the **identical** worker code path against a single recipient — preview === delivered.

### 8. Where everything lives (your final checklist)

| # | Concern | Location |
|---|---|---|
| 1 | Sender email (locked) | `supabase/functions/_shared/outreachIdentity.ts` → `PRIMARY_SENDER` |
| 2 | CC email (locked) | same file → `DEFAULT_CC` (auto-merged in worker) |
| 3 | Production mode | `crm_owner_settings.test_profile.mode = "production"` + forced constants |
| 4 | Test mode | `TestSendDialog.tsx` + `crm_owner_settings.test_profile.test` |
| 5 | Brokerage personalization | `src/lib/outreach/renderTemplate.ts` + bulk worker |
| 6 | Bulk automation | `outreach_bulk_jobs` table + `outreach-bulk-worker` cron |
| 7 | Delivery consistency | one locked payload + payload_hash audit per send |
| 8 | Locked subject/template | existing `outreach_locked_payloads` + new pre-flight validator |
| 9 | Sender enforcement proof | `scripts/outreach/verify-config.mjs` in CI |
| 10 | CC delivery proof | worker test asserts `infoo.jane@gmail.com` in every send's cc list |

### Prerequisites I'll need from you during implementation

1. Approve this plan.
2. Confirm I should run `standard_connectors--connect` for **Resend** (or say "use Gmail-only and accept the ~200/day cap").
3. After Resend is connected, you'll need to add 3 DNS records (SPF, DKIM, DMARC) at your `citideveloper.com` registrar — I'll give you the exact values.

### Out of scope

- Marketing newsletters / drip campaigns (not what brokerage outreach is).
- Replacing Gmail integration for 1:1 inbox (kept as-is).
- Changing existing CRM relationships UI beyond adding the bulk-progress card.
