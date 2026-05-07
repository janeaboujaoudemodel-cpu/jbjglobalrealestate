
# Locked-Send Outreach: Mandatory Subject + Preview-Equals-Delivered

## Goal

Every outreach surface (CRM, registries, campaigns, invitations) must:
1. Require an **editable Subject** field before send.
2. Freeze the entire compiled email at approval (the "locked payload").
3. Send the locked payload byte-for-byte — no rewriting, no provider-specific reflow.
4. Render consistently across Gmail / Outlook (Win+Web) / Apple Mail / iCloud / Yahoo / Hotmail / mobile.
5. Force the user through a final **Delivery Preview** (desktop + mobile) before send.

## Scope (every outreach surface gets the same treatment)

| Surface | File(s) |
|---|---|
| Brokerage outreach (CRM Relationships) | `crm-send-brokerage-outreach`, `BulkSendDialog`, `TestSendDialog`, `TemplateEditorDialog` |
| Brokerage breakfast invite | `crm-create-breakfast-invite-token`, `BreakfastBooking.tsx` |
| Developer registration outreach | `crm-send-developer-registration` |
| UAE Registry (Agencies / Brokers / Agents) | `uae-registry-send`, `uae-registry-followup-send`, `UAERegistryDetailPage` |
| Developer Registry & Brokerage Registry | registry list/detail pages |
| Marketing Hub email campaigns | `AIEmailGenerator`, marketing-hub send paths |
| HR hunting outreach | `OutreachPanel`, `CampaignManager` |
| Invitation templates (breakfast, partnership, intro) | `crm_email_templates` table |

## Architecture

### 1. Database — single source of locked payloads

New table `outreach_locked_payloads`:

```text
id              uuid pk
surface         text   -- 'brokerage_outreach' | 'uae_registry' | 'developer_registration' | 'breakfast_invite' | 'campaign' | 'hunting'
recipient_email text
from_email      text   -- frozen
from_name       text   -- frozen
reply_to        text
subject         text   -- frozen (editable until lock)
html            text   -- frozen final HTML (post-render, post-variable-substitution)
plain_text      text   -- frozen plain-text mirror
preheader       text
payload_hash    text   -- sha256(subject + html + plain_text + from + to)
locked_at       timestamptz
locked_by       uuid
sent_at         timestamptz
provider_message_id text
status          text   -- 'locked' | 'sent' | 'failed' | 'cancelled'
metadata        jsonb  -- template name, variables snapshot, brokerage_id, etc.
```

RLS: owner-only (existing `requireOwnerAuth` pattern).

Add `subject` column (NOT NULL) to any outreach config row that lacks one (template-level subject already exists; campaign/registry rows get a per-send override column).

### 2. Subject field — mandatory & editable everywhere

- Add `<SubjectInput required />` to every send dialog and registry detail page.
- Default value = template subject after variable rendering.
- Validation: non-empty, ≤ 250 chars, no unresolved `{{variables}}`.
- "Send" button disabled until subject passes validation.

### 3. Lock-and-Freeze flow

When user clicks **Approve / Confirm / Lock Template / Send**:

```text
client → edge fn `outreach-lock-payload`
  ├─ render template with current variables (server-side, deterministic)
  ├─ wrap in cross-client HTML shell (see §4)
  ├─ generate plain-text mirror (html-to-text, deterministic)
  ├─ compute payload_hash
  └─ INSERT into outreach_locked_payloads (status='locked')
       returns { payload_id, payload_hash }

client shows Delivery Preview using the locked HTML (iframe srcdoc).

client → edge fn `outreach-send-locked`
  ├─ SELECT row by payload_id
  ├─ verify payload_hash matches (anti-tamper)
  ├─ verify status='locked' and not already sent
  ├─ send to provider with EXACT subject/html/text/from
  └─ UPDATE status='sent', provider_message_id, sent_at
```

The send function **never** touches the template, never re-renders, never substitutes variables, never rewrites links. It only forwards the frozen row.

Existing `crm-send-brokerage-outreach` becomes a thin wrapper that:
1. Calls `outreach-lock-payload` if no `payload_id` provided.
2. Calls `outreach-send-locked`.

The silent rewriter / fallback rebuilders we already removed stay removed; this enforces it structurally.

### 4. Cross-client HTML shell

Single shared renderer `supabase/functions/_shared/email-shell.ts`:
- Outlook-safe table layout (600px centered, MSO conditional comments).
- Inline CSS only (no `<style>` for layout-critical rules).
- Web-safe font stack with brand fallback: `'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`.
- Dark-mode meta + `@media (prefers-color-scheme: dark)` overrides scoped to safe properties.
- Pre-header hidden span.
- Logo via absolute https URL (no CID).
- CTA buttons rendered as bulletproof VML+anchor.
- All link tracking params stripped (no provider-side rewriting → "exact mirror" guarantee).

Plain-text generated from the same AST so HTML and text stay in sync.

### 5. QA / Parity Gate (`outreach-parity-check` edge fn)

Runs server-side just before lock:
- Compares preview HTML (sent from client) vs server-rendered HTML — must match byte-for-byte.
- Validates subject equality.
- Validates from/reply-to equality.
- Scans for unresolved `{{var}}`.
- Returns 400 `PARITY_MISMATCH` with a diff if anything differs.

Client refuses to proceed on mismatch.

### 6. Delivery Preview UI

New component `<DeliveryPreviewDialog />` shown after lock, before final send:

```text
┌─────────────────────────────────────────────┐
│ Delivery Preview — locked payload #abc123   │
├─────────────────────────────────────────────┤
│ From:    Jane Bou Jaoude <jane@…>           │
│ Reply-to: jane@…                            │
│ To:      recipient@brokerage.com            │
│ Subject: Private Breakfast for Acme Realty  │
├──────────────┬──────────────────────────────┤
│  [Desktop]   │  [Mobile 375px]              │
│   iframe     │   iframe                     │
│   srcdoc     │   srcdoc                     │
└──────────────┴──────────────────────────────┘
  [ Cancel ]                [ Send this exact version ]
```

Both iframes render the **locked HTML** (not a re-render). "Send" calls `outreach-send-locked` with the `payload_id`.

### 7. Forbidden-mutation guard

Lint rule + CI check (`scripts/check-no-email-rewrite.mjs`) that fails the build if any code under `supabase/functions/*outreach*` or `*registry-send*` calls `.replace(`, `renderTemplate(`, or string-concats subject/html outside the locked-payload flow.

## Deliverables

1. Migration: `outreach_locked_payloads` table + RLS + `payload_hash` trigger.
2. New edge fns: `outreach-lock-payload`, `outreach-send-locked`, `outreach-parity-check`.
3. Shared module: `_shared/email-shell.ts` (HTML+text renderer).
4. Refactor every existing send function listed in Scope to route through lock→send.
5. UI: `<SubjectInput />`, `<DeliveryPreviewDialog />`, integrated into all dialogs/pages in Scope.
6. CI guard script + memory entry documenting the locked-send standard.

## Out of scope (call out explicitly)

- Live inbox-rendering screenshots (Litmus/Email-on-Acid integration) — Delivery Preview uses local iframes only. Can be added later behind an API key.
- Editing the locked payload after lock — by design, the user must cancel and start over.

## Technical notes

- `payload_hash` = `sha256(canonicalJSON({from,to,subject,html,plain_text,reply_to}))`.
- Send fn rejects if `now() - locked_at > 24h` (force re-lock for stale previews).
- Idempotency key on send = `payload_id` so retries never duplicate.
- Plain-text generator: deterministic `html-to-text` config committed to repo; same input always produces same output.
