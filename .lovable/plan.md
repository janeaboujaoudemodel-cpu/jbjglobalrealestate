
# Branded Email + Inbox Connection Overhaul

Two work streams. Same Relationship Hub touchpoint.

---

## A. Branded Email Composer — full upgrade

File: `src/components/crm/BrandedEmailComposer.tsx` (+ shared bits).

### A1. Fix the cheap-looking dropdowns
Replace every native `<select>` (template, language, signature, "Load template…") with the project's shadcn `Select` primitive themed in champagne + gold:
- trigger: `bg-[#FDFBF7] border-[#B89555]/40 text-[#1A1A1A]`
- focus / open ring: gold 1px hairline, no blue
- options hover/active: `bg-[#EFE6D6] text-[#1A1A1A]` (cream + ink), never blue, never silver-faded
- selected check icon in gold
This kills the blue hover and the "faded silver" look on Birthday & Lifecycle / English / signature pickers.

### A2. "fill: location / first_name / property_title" must be actionable
Today those are read-only badges. Change behaviour:
- Clicking a missing-variable badge **scrolls to + opens** the matching input (auto-opens the "Property context" `<details>` if needed, and focuses the field).
- Variables map: `first_name` → Recipient name, `email` → Recipient email, `property_title|price|location` → Property context inputs, anything else → a generated "Custom variables" mini-form (key→value).
- After typing, re-merge the template on the fly so the badge disappears and Subject/Body update live.

### A3. Real WYSIWYG, not raw HTML
Replace the raw HTML `<textarea>` with a small rich editor (re-use the project's existing TipTap setup if present, otherwise a lightweight contentEditable with bold/italic/link/list/heading + "Insert meeting block" button writing into the editor — not appending HTML strings).
- "Insert meeting block" inserts the rendered block as a styled node, not visible HTML markup.
- Keep an "HTML source" toggle for power users.
- The Preview panel becomes the **default visible** view (not hidden inside `<details>`), so the user always sees the styled email.

### A4. Multi-recipient TO / CC / BCC with chips
Replace the single Recipient input with three chip-input rows:
- **To** (required, ≥1)
- **Cc** — pre-seeded with `infoo.jane@gmail.com` (removable via × on the chip)
- **Bcc**
Each row supports: type → press Enter/comma → chip; each chip has an `×`; row has a `+ Add email` affordance. Validates email format per chip.

### A5. Test-send identity rules
- Default sender (locked, shown read-only with a small "JBJ standard" tag): **`contact@jbj.ae`** as From, **"JBJ GLOBAL REAL ESTATE"** as From-name and as default Subject prefix.
- "Send test to me" sends to BOTH `contact@jbj.ae` and `infoo.jane@gmail.com` by default; show them as two chips with × so the user can drop either one. Live send respects the To/Cc/Bcc chips above + always Cc `infoo.jane@gmail.com` unless the user removes that chip.
- Subject defaults to `JBJ GLOBAL REAL ESTATE — <topic>` placeholder when empty.

### A6. Preview + Export
Add a sticky right-hand "Preview" pane showing the fully composed email (signature appended, variables merged) exactly as Resend will render it. Buttons under the preview:
- **Copy HTML** (clipboard)
- **Copy rendered text**
- **Download .html** (full standalone file)
- **Download .eml** (so user can drag into any mail client)
- **Open in new tab** (full-page preview)

### A7. Per-section "Sent emails" log
New small component `SentEmailsList` mounted under each CRM relationship section (Developer, Sales Rep, Brokerage Agency, Individual Broker, Client, Friend). It reads the existing `email_send_log` (and `outreach_locked_payloads` for the body) filtered by recipient email matching that contact, deduped by `message_id`, latest status, showing: recipient name + email, subject, status badge, sent-at timestamp, "View" → opens the preview drawer with the exact body that was sent. No new table — reuse what's there.

---

## B. Gmail + Hostinger inbox connections

### B1. Tell the user what's connected today
Add a small "Connected mailboxes" panel at the top of the Branded Email card and on `/owner/integrations`:
- Lists each mailbox via `useCommChannels`, shows provider (Gmail / Hostinger IMAP / Resend domain), status, last sync.
- Empty state with a "Connect mailbox" CTA.

### B2. Connect Gmail (×2)
Use the standard Gmail connector (`google_mail`). Because the connector supports multiple connections per project, the user can link both Gmail accounts — the second connection auto-gets `GOOGLE_MAIL_API_KEY_2`.
Action: when the user clicks "Connect Gmail", call `standard_connectors--connect` with `connector_id: google_mail` and capture both connections. Edge function `comm-inbound-sync` (already exists) gets a small patch to iterate over `GOOGLE_MAIL_API_KEY` + `GOOGLE_MAIL_API_KEY_2` and pull from both.

### B3. Connect Hostinger webmail (`contact@jbj.ae`)
No connector exists for Hostinger — use IMAP. Add a one-time form (host, port 993, username, app-password) stored as Lovable Cloud secrets `HOSTINGER_IMAP_HOST/USER/PASS`. New edge function `imap-inbound-sync` polls the mailbox every 5 min via pg_cron and inserts into the same `comm_messages` table the Gmail sync uses, so everything funnels into one inbox.

### B4. Find the missing signed contract
The user already received the signed contract on one of the three mailboxes. Once B2+B3 are wired and the first sync runs, the message will land in `comm_messages` and the existing `classify-jbj-inbox` function will tag it (contract / lead / etc.). It will surface in:
- `/owner/inbox` (unified)
- The Sent/Received list inside the matching CRM contact card (A7)
No duplicate inbox page is created — `OwnerInbox.tsx` + `EmailClient.tsx` are the single source.

### B5. De-dupe rule
A SQL unique index on `(mailbox_id, provider_message_id)` in `comm_messages` prevents the same Gmail/IMAP message from appearing twice when multiple syncs run.

---

## Order of implementation

1. A1 + A4 + A5 (visible UX wins: dropdowns, chips, sender identity)
2. A2 + A3 + A6 (rich editor, actionable badges, preview/export)
3. A7 (sent log per section)
4. B1 → B2 → B3 → B5 → B4 (mailbox plumbing + de-dupe + the contract appears)

## Technical notes (for the agent, not the user)

- Reuse `outreach-lock-payload` + `outreach-send-locked` — no new send pipeline.
- Multi-recipient: extend the lock payload to accept `cc[]` / `bcc[]` (currently single `recipient_email`). Backwards-compatible.
- Rich editor: prefer existing TipTap install (`rg "@tiptap"`) before adding deps.
- IMAP: use `npm:imapflow` in the Deno edge function.
- Secrets to add later (B3): `HOSTINGER_IMAP_HOST`, `HOSTINGER_IMAP_USER`, `HOSTINGER_IMAP_PASS` — will be requested via `add_secret` only after the user confirms intent.
- All new UI follows champagne/gold/ink tokens. No blue, no faded gold text.
