## Goal
Fix the broken Communication Hub at `/owner/settings/communication` (vertical/cramped tiles, Hostinger showing "Not Connected"), then add AI inbox categorization, suggested replies, and integration with calendar / tasks / notes.

## Problem analysis

**1. Layout breakage (screenshot evidence)**
- `ChannelGrid` uses `grid-cols-1 md:grid-cols-2 xl:grid-cols-3` inside the owner settings panel, which itself sits beside the 88px sidebar + a settings sub-nav. At 870px viewport, two tiles are forced into ~280px each → titles like "Outlook", "Hostinger Webmail", "Outbound Email (Resend)" wrap one letter per line, badges overlap the title.
- Title row uses `flex items-start justify-between` with no `min-w-0` / `truncate` → status pills push the title into a 60px column.

**2. Hostinger "Not Connected"**
- `useCommChannels` derives `status` from `comm_channels` rows. Even though `comm-hostinger-connect` succeeds (we verified via curl), the row may be created with `status != 'connected'` or not surfaced because the provider id mapping (`email_hostinger`) doesn't match what the connect function writes.
- Need to confirm the row exists, has the correct `channel_type`, and `useCommChannels` query reads the latest state immediately after the dialog closes (cache invalidation already fires, but the row may be missing).

**3. Missing AI features**
- No per-message category (Real Estate / Marketing / Admin / Personal) on inbox items.
- No suggested-reply or "next step" generation surfaced next to messages.
- No one-click linking of a message → calendar event / task / note.

## Plan

### Phase 1 — Layout fix (frontend only, ChannelTile + ChannelGrid)
- `ChannelGrid`: change to `grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3` so md viewports (like 870px) get full-width tiles.
- `ChannelTile`:
  - Header: wrap title block in `min-w-0 flex-1`, add `truncate` to `<h3>` and `line-clamp-2` to description.
  - Move status + tone pills to a row *below* the title on narrow widths (`flex-col sm:flex-row`), so they never compete with the title for space.
  - Tighten padding (`p-4`) and reduce icon tile to `size="sm"` on narrow.
  - Ensure action buttons row uses `w-full` stacking under `sm`.

### Phase 2 — Hostinger connection persistence
- Inspect `comm_channels` to confirm the Hostinger row was written with `channel_type = 'email_hostinger'` and `status = 'connected'` after the last successful connect.
- If missing/wrong, patch `comm-hostinger-connect/index.ts` to upsert the row with the correct shape on success (and clear `last_error`).
- After dialog success, force `qc.invalidateQueries(['comm-channel-states'])` and refetch so the tile flips to Connected immediately without a manual refresh.
- Add a small "Verify connection" action on the Hostinger tile that re-runs the IMAP/SMTP test against the stored encrypted credentials and updates `status` accordingly — so the tile is self-healing after secret rotations.

### Phase 3 — AI categorization + suggested replies
- Add columns to `comm_messages` (or equivalent inbox table): `ai_category text`, `ai_priority text`, `ai_suggested_reply text`, `ai_next_step jsonb`, `ai_processed_at timestamptz`.
- New edge function `comm-ai-triage`:
  - Input: `message_id` (or batch).
  - Calls Lovable AI Gateway (`google/gemini-2.5-flash`) with the email subject + body and a fixed taxonomy: `real_estate_lead`, `real_estate_ops`, `marketing`, `finance`, `personal`, `spam`, `other`.
  - Returns `{ category, priority, suggested_reply, next_step: { type: 'task'|'meeting'|'note'|'none', title, due_at? } }`.
  - Writes back to the row.
- Trigger triage automatically inside `comm-inbound-sync` after each new message is inserted (fan-out, non-blocking).
- Inbox UI (existing inbox component — will identify exact file in build phase): show a category chip + a collapsible "Suggested reply" panel with three buttons:
  - **Send reply** (locked-send pipeline, uses the channel's tone profile),
  - **Create task** (writes to existing tasks table),
  - **Schedule meeting** (opens calendar booking flow with prefilled attendee + subject),
  - **Save as note** (writes to existing notes/CRM contact).
- Add a top-of-inbox filter bar: All / Real Estate / Marketing / Finance / Personal / Spam, driven by `ai_category`.

### Phase 4 — QA
- Reload `/owner/settings/communication` at 870px and 1440px; confirm tiles render horizontally with readable text and Hostinger shows Connected.
- Trigger one inbound email, confirm `ai_category` populates within ~10s and the suggested reply renders.
- Click Create task / Schedule meeting / Save note from a message and confirm the linked records appear in the respective hubs.

## Technical notes
- All AI calls go through Lovable AI Gateway with `google/gemini-2.5-flash` (fast + cheap, supports JSON mode for structured triage output).
- Suggested reply send path reuses the existing locked-send standard (subject + body locked into `outreach_locked_payloads` before send).
- No new third-party services; no new secrets required.
- Schema changes go through `supabase--migration`; RLS on the new columns inherits existing `comm_messages` policies (owner-only).
