# Plan — Sender lock + subject update + remaining CRM grid features

## 1. Why the email still arrives from `janeaboujaoudemodel@gmail.com`

The outreach edge function `crm-send-brokerage-outreach` already hard-codes:
- `From: Jane Bou Jaoude <jane@citideveloper.com>`
- `Reply-To: jane@citideveloper.com`
- A guard that blocks any rendered output containing `janeaboujaoudemodel@gmail.com`.

So the code is correct. The reason recipients still see `janeaboujaoudemodel@gmail.com` is a **Gmail-side limitation**, not a code bug:

> Gmail's API ignores the `From:` header in `users.messages.send` unless the address is registered AND verified as a **Send-As alias** on the authenticated Gmail account. If it isn't, Gmail silently rewrites `From:` to the authenticated mailbox.

The Gmail account currently linked through the Lovable Gmail connector is `janeaboujaoudemodel@gmail.com`, and `jane@citideveloper.com` is not yet a verified send-as alias on it — so Gmail rewrites every send.

### Fix (two parts)

**A. One-time Gmail account configuration (you do this — I'll surface the exact steps in the UI):**
1. In `janeaboujaoudemodel@gmail.com` → Settings → Accounts → "Send mail as" → Add `jane@citideveloper.com`.
2. Use SMTP `smtp.zoho.com` / `smtp.google.com` (Workspace) — the Citi Developer email host — so Gmail can authenticate as the alias.
3. Click the verification link Gmail sends to `jane@citideveloper.com`.
4. Set "Reply from the same address the message was sent to".

(Alternative, cleaner: disconnect the Gmail connector and reconnect using the `jane@citideveloper.com` Google Workspace account directly. Then no alias is needed.)

**B. Code changes I'll add so this can never silently regress:**
1. Add an edge-function preflight that calls Gmail's `users.settings.sendAs` API on every send. If `jane@citideveloper.com` is missing OR `verificationStatus !== 'accepted'`, the function blocks the send and returns:
   > `SENDER_ALIAS_UNVERIFIED — jane@citideveloper.com is not a verified Send-As alias on the connected Gmail account. Add and verify it in Gmail → Settings → Accounts before sending.`
2. Surface that error in `BulkSendDialog`, `TemplateEditorDialog`, and the brokerage row send action with a one-click "Open Gmail Send-As settings" link.
3. Add a `crm-gmail-sender-status` edge function used by a small banner on `/owner/crm/relationships` showing "Sender alias verified ✓ jane@citideveloper.com" or a red "Action required" card with the same fix link. This way you see the status at a glance and never wonder again.

## 2. Subject line update

Replace the current subject of the breakfast invite template:
- Old: `Private Breakfast for {{brokerage_name}}`
- New: `You Are Invited! Book Your Exclusive Breakfast Briefing for {{brokerage_name}}`

Applied via a database update on `crm_email_templates` for `variant = brokerage_breakfast_invite` (and the matching `outreach_locked_payloads` row regenerated so the lock-and-send pipeline stays byte-equal to the preview).

The Subject field stays editable in `TemplateEditorDialog` so you can refine wording later.

## 3. Daily sending limits (your question)

| Path | Free daily cap | Notes |
|---|---|---|
| **Current — Gmail connector (free Gmail)** | ~500 recipients/day | Google's hard cap on `gmail.googleapis.com` for consumer accounts. Going over triggers a 24-hr block. |
| **Gmail connector (Google Workspace)** | ~2,000 recipients/day | If `jane@citideveloper.com` is on Workspace, switching the connector to it unlocks this. |
| **Lovable Emails (Mailgun-backed)** | No fixed daily cap on Lovable's side. Throughput defaults to ~120/min (configurable). Subject to Mailgun's free-tier monthly volume on your account. | Best path for **transactional** sends (booking confirmations, etc.) — not for cold outreach to brokerages. |
| **Resend free plan** | **100 emails/day**, 3,000/month, 1 verified domain, no scheduled sends, single team seat. Paid plans start at 50,000/month. | Reasonable for low-volume transactional, not enough for brokerage outreach campaigns. |

**Recommendation:** keep brokerage outreach on Gmail (so replies land in your inbox and conversations thread), and switch the connector to the Workspace account for `jane@citideveloper.com` to get the 2,000/day ceiling and remove the alias-verification problem at the same time.

## 4. Deferred CRM grid features (now shipping)

From the original spec, these were queued and remain undone:

1. **Column drag-to-reorder** in `ExcelGridView` (header drag handles, persisted per-user in `crm_grid_prefs`).
2. **Freeze first N columns** (sticky left columns, default 2 — name + status — toggleable from a header menu).
3. **Undo** for destructive grid edits (cell delete, row delete) — 10-step in-memory stack with toast "Undo".
4. **Multi-select bulk delete**:
   - Row checkbox column + shift-click range select + select-all.
   - Bulk action bar appears at bottom: Delete / Tag / Move to list / Export.
   - Server-side delete via existing `crm_brokerage_agents` RLS (owner-only).
5. **Inline contract section in the registration row** of the grid:
   - Replace the current standalone "Contract" column with an expandable sub-row beneath each registration row showing: contract status, file link, signed date, expiry, "Open in drawer" button.
   - Drawer remains the source of truth; the inline view is read + quick-action only (download, mark signed, request resign).

Files touched:
- `src/components/crm/ExcelGridView.tsx` (reorder, freeze, undo stack, selection model, inline contract row).
- `src/pages/CRMRelationships.tsx` (bulk action bar wiring).
- `src/components/crm/IndividualBrokersTab.tsx` (selection state passthrough).
- New: `src/hooks/useGridPrefs.ts` (load/save column order + freeze count to `crm_grid_prefs`).
- New migration: `crm_grid_prefs` table (`owner_id`, `view_key`, `column_order jsonb`, `frozen_count int`, `updated_at`).
- New edge function: `crm-gmail-sender-status` (read-only Gmail Send-As check).

## 5. Proof I'll capture once implemented

1. Screenshot of the Gmail Send-As status banner on `/owner/crm/relationships` showing "✓ jane@citideveloper.com verified".
2. A test send from the dialog with the new subject; screenshot of the recipient inbox showing `From: Jane Bou Jaoude <jane@citideveloper.com>` and the new subject.
3. A second test send while the alias is intentionally unverified, showing the new `SENDER_ALIAS_UNVERIFIED` error blocking the send (so you can confirm the guard actually fires).
4. Short Loom-style screen captures of: column drag, freeze toggle, multi-select bulk delete with undo, and the inline contract sub-row expanding under a registration row.

## Out of scope for this pass
- Switching brokerage outreach off Gmail entirely.
- Building a new marketing-grade ESP integration.
- Changing the locked-template hash format (preview = sent stays intact).
