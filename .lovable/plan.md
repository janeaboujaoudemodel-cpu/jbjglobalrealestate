# Unified Communication Hub + Global Contrast Hardening

Two work streams in one ship: real one-click channel integrations with auto-reply, plus a site-wide guard that kills every black-on-black (or same-color-on-same-color) text/button/icon.

## Stream A — Communication Hub v2 (one-click connect, auto-reply, tone learning)

The current `OwnerCommSettings.tsx` "Add Channel" dialog only writes a row to `owner_comm_channels` — it never authenticates with the providers, so no messages flow in or out. We replace it with a **status-first hub** that auto-discovers and auto-wires the channels you already have linked at the workspace level.

### A1. Channel registry — what we wire

| Channel | How |
|---|---|
| Gmail (read + send) | Lovable connector `google_mail` — already linked. Gateway calls. |
| WhatsApp / SMS (Twilio) | Lovable connector `twilio` — workspace has `Jane's Twilio` (not yet linked). Sandbox connect via tool. |
| Outbound transactional email | Lovable connector `resend` — already linked. |
| Hostinger Webmail (IMAP/SMTP) | Edge function with stored IMAP/SMTP creds (encrypted). One-click **"Connect Hostinger"** opens a credential dialog, then verifies. |
| Outlook/Microsoft 365 | Lovable connector `microsoft_outlook` — link via `standard_connectors--connect`. |
| Slack | Lovable connector `slack` — link via `standard_connectors--connect`. |
| Telegram | Lovable connector `telegram` — link via `standard_connectors--connect`. |
| Voice (ElevenLabs clone) | Already linked. Used for outbound voice replies in user's voice. |
| Instagram DM, Facebook Messenger, Snapchat, LinkedIn DMs | Not supported by current Lovable connectors. We render the tile with a **"Coming soon — provider does not yet expose a Lovable-managed integration"** badge and a one-click **"Request access"** logger row, so it's visible but honest. |

### A2. Auto-discovery UI

Replace the manual `Add Channel → pick type → fill identifier` dialog with a **Channels Grid** that:

1. Fetches the workspace connection list at mount and merges with `owner_comm_channels` rows.
2. For each provider, shows one of three states with a clear status pill:
   - **Connected** (green dot) — connection exists in workspace AND linked to this project AND `owner_comm_channels` row present.
   - **Available** (gold dot) — connection exists in workspace but not linked here. Single button: **"Connect"** → calls our edge function which links + creates the channel row + kicks off first sync.
   - **Not yet linked** (gray dot) — no workspace connection. Single button: **"Connect"** → triggers `standard_connectors--connect` flow.

No more separate "add channel type" step. No more identifier text fields the user must fill.

### A3. One-click "Connect" pipeline

A new edge function `comm-channel-autowire` handles each channel end-to-end:

1. Verifies the connector secret is present (e.g. `GOOGLE_MAIL_API_KEY`).
2. Calls the gateway's `/api/v1/verify_credentials` — confirms the token actually works.
3. Resolves the user's identifier (email address for Gmail, phone for Twilio, etc.) via a one-shot gateway call.
4. Inserts/updates the `owner_comm_channels` row with `is_active = true` and `sync_status = 'synced'`.
5. Schedules the first inbound sync immediately and registers it with the cron poller.

Frontend Connect button becomes: click → loading spinner → "Connected" pill in <3 seconds.

### A4. Inbound sync + threading

New scheduled edge function `comm-inbound-sync` runs every 60 seconds (pg_cron):

- For each active channel, pulls new messages since `last_sync_at`.
- Deduplicates by `external_message_id`.
- Upserts into `owner_comm_threads` (one thread per sender per channel) and `owner_comm_messages`.
- Marks `sync_status` and `last_sync_at`.
- On 401 / scope error, sets `sync_status = 'reauth_required'` and surfaces a "Reconnect" button on the channel tile.

### A5. Auto-reply with learned tone

We already have `owner_comm_tone_profiles` and `owner_comm_settings.auto_send_enabled`. Wire the missing pieces:

- New edge function `comm-auto-reply` triggered by inbound webhook insert (Postgres trigger → pg_net → function).
- Uses Lovable AI Gateway (`google/gemini-2.5-pro`) with a system prompt that includes:
  - The active tone profile (formality, signature, common phrases).
  - The last 30 messages on the same thread for context.
  - **The last 200 messages Jane has SENT across all channels** (training corpus) — this is the "watch how I reply" piece. We extract them via `direction = 'outbound' AND is_ai_generated = false` ordered by date.
- If `auto_send_enabled = true` AND confidence ≥ threshold (set in `owner_comm_settings`): sends via the appropriate gateway (Gmail send, Twilio Messages.json, Resend, etc.) and writes the outbound row with `is_ai_generated = true`.
- Otherwise drops it as a **suggested draft** (`status = 'draft_suggested'`) the user can one-click approve in `OwnerInbox`.

### A6. Voice reply support

If the inbound message is voice (`content_type = 'audio'`) AND `voice_reply_enabled` is on, we call ElevenLabs (Jane Clone voice) to synthesize the AI draft and attach the audio URL. Sent via Twilio (WhatsApp voice note) or replied as audio attachment.

### A7. Multiple emails per provider

The schema already supports many rows in `owner_comm_channels` per `channel_type`. We expose **"Add another Gmail"** under each connected tile — that re-runs the connector picker so a second `google_mail` connection can be linked (the connector framework already supports this via `GOOGLE_MAIL_API_KEY_2`).

### A8. Database changes

Migration adds:

- `owner_comm_settings.confidence_threshold` (numeric, default 0.75)
- `owner_comm_settings.voice_reply_enabled` (boolean, default false)
- `owner_comm_channels.last_error` (text, nullable) — surfaced on the tile when sync fails
- `owner_comm_channels.connection_id` (text) — the `std_...` workspace connection it's bound to
- `owner_comm_channels.training_sample_count` (int) — exposes how many sent messages have been ingested for tone learning
- New `owner_comm_provider_status` view aggregating the status pill state per provider
- pg_cron job `comm-inbound-sync` running every minute
- Postgres trigger `on_inbound_message_auto_reply` calling the auto-reply function

All channel `credentials` fields must be encrypted via the existing AES-256-GCM helper (per Multi-Target PII Encryption standard).

## Stream B — Global black-on-black contrast guard (site-wide)

The reported "Add Channel button is black on black" is a symptom of a wider problem: the existing guard in `index.css` only catches a few literal class combos. We replace it with a **defensive guard that catches every same-color-on-same-color combination**, including hex literals, theme tokens, and parent/descendant pairings.

### B1. Strengthen `index.css` contrast rules

A new section `PASS 5 — UNIVERSAL SAME-TONE GUARD` with:

```css
/* Any element whose background is the ink/foreground tone forces white descendants */
[class*="bg-[#1A1A1A]"],
[class*="bg-foreground"],
[class*="bg-black"],
[class*="bg-primary"]:not([class*="bg-primary/"]),
.bg-\[\#1A1A1A\],
.bg-foreground,
.bg-black {
  color: #FDFBF7;
}
[class*="bg-[#1A1A1A]"] *:not([class*="text-gold"]):not([class*="text-price"]):not([class*="text-amber"]):not([class*="text-emerald"]):not([class*="text-red"]):not([class*="text-blue"]):not(svg.lucide),
[class*="bg-foreground"] *:not([class*="text-gold"]):not([class*="text-price"]):not(svg.lucide),
[class*="bg-black"] *:not([class*="text-gold"]):not([class*="text-price"]):not(svg.lucide) {
  color: #FDFBF7 !important;
}

/* Any element whose background is champagne forces ink descendants */
[class*="bg-[#FDFBF7]"],
[class*="bg-[#F7F2EA]"],
[class*="bg-[#EFE6D6]"],
[class*="bg-background"],
[class*="bg-card"]:not([class*="bg-card/"]) {
  color: #1A1A1A;
}
[class*="bg-[#FDFBF7]"] [class*="text-white"]:not(.allow-white),
[class*="bg-[#F7F2EA]"] [class*="text-white"]:not(.allow-white),
[class*="bg-[#EFE6D6]"] [class*="text-white"]:not(.allow-white),
[class*="bg-background"] [class*="text-white"]:not(.allow-white) {
  color: #1A1A1A !important;
}

/* Gold backgrounds force white text */
[class*="bg-[#B89555]"]:not([class*="bg-[#B89555]/"]),
[class*="bg-gold"]:not([class*="bg-gold/"]) {
  color: #FDFBF7;
}
```

### B2. Runtime guard hook

A small `useContrastGuard` mounted once in `App.tsx` runs after every route change:

- Walks every interactive element (`button, a[role=button], [role=button]`).
- Reads computed `background-color` and the computed `color` of its `::first-line` text.
- If the relative luminance delta < 0.2, force-applies a `.contrast-fix` class that overrides to inverse.
- Logs offenders to `console.warn` in dev so we can fix the source.

Implementation file: `src/utils/contrastGuard.ts` (already a similar utility exists per the White-on-Light memory — extend it bidirectionally, not just light-surface).

### B3. Lint / CI script

Add `scripts/contrast/check-same-tone.mjs` and run in CI:

- Greps the codebase for the regex `bg-\[#1A1A1A\][^"]*text-\[#1A1A1A\]`, `bg-foreground[^"]*text-foreground`, `bg-black[^"]*text-black`, etc.
- Fails the build with a list of offending files. Existing `check-faded-gold.mjs` is the template.

### B4. Fix specific offenders found during audit

While the global rules will catch most cases at runtime, we also patch the four worst-offender component patterns:

- `OwnerCommSettings.tsx` "Add Channel" button — replace `variant="primary"` (which is technically white-on-ink but renders muddy with backdrop-blur stacking) with `variant="gold"` so it reads as solid gold + white at all times.
- `Tooltip` and `Popover` already fixed in the previous pass — verify no regression.
- The `DialogContent` channel-picker buttons inside the dialog use `variant="outline"` with hex border classes; ensure ink-on-champagne by setting `text-[#1A1A1A]` explicitly.
- Audit pass: any component that uses `bg-foreground` or `bg-primary` and contains a child `text-foreground` / `text-primary` — replace inner with `text-primary-foreground`.

## Files

**Created**
- `supabase/functions/comm-channel-autowire/index.ts` — one-click connect pipeline
- `supabase/functions/comm-inbound-sync/index.ts` — scheduled inbound poller
- `supabase/functions/comm-auto-reply/index.ts` — AI tone-matched reply engine
- `supabase/migrations/<ts>_comm_hub_v2.sql` — schema additions, view, cron, trigger
- `src/components/owner-comm/ChannelGrid.tsx` — auto-discovery grid
- `src/components/owner-comm/ChannelTile.tsx` — single-channel status tile
- `src/hooks/useCommChannels.ts` — fetches workspace + project channel state
- `src/utils/contrastGuard.ts` — runtime guard
- `scripts/contrast/check-same-tone.mjs` — CI lint

**Edited**
- `src/pages/OwnerCommSettings.tsx` — swap manual dialog for `<ChannelGrid />`, add tone-training preview, add "training samples ingested" counter
- `src/pages/OwnerInbox.tsx` — add "Approve & send" button on AI-suggested drafts
- `src/index.css` — Pass 5 universal same-tone guard
- `src/App.tsx` — mount `useContrastGuard()`

## Out of scope

- Native Instagram, Snapchat, LinkedIn, Facebook Messenger DMs — Lovable does not have managed connectors for these. They will appear in the grid as "coming soon" tiles with a request-access logger. We will not pretend they are connected.
- IMAP via raw socket from edge functions — Hostinger requires SMTP-only outbound + IMAP polling; we ship outbound-first, then a follow-up to add IMAP polling.

## Acceptance

- Open `/owner/settings/communication` → see all providers with live status pills, no empty states for already-linked connectors (Gmail, Resend, ElevenLabs show **Connected** out of the gate).
- Click **Connect** on Twilio → connector picker → channel tile flips to **Connected** within 3 seconds, no further forms.
- Send yourself a Gmail → within 60 seconds it appears in `OwnerInbox`, and an AI draft appears under it; if `auto_send_enabled` is on, the reply is sent in your tone with a `is_ai_generated = true` row.
- The "Add Channel" button reads clearly on first paint, no hover required. So do all other buttons across the site.
- CI fails any future PR that introduces `bg-foreground text-foreground` or equivalent same-tone combos.
