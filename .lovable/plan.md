## Plan: stabilize and upgrade Unified Inbox

### What I found
- The top stats are counting **threads/conversations**, while the Gmail tab badge is counting **unread messages**. That is why Gmail can show 50/46 while Total shows 25/26.
- Selecting Gmail / Needs Reply changes the dataset, so the cards recalculate against a filtered list and look inconsistent.
- The Gmail/Instagram/Facebook tab labels are being squeezed because the tab row allows text truncation instead of giving the horizontal scroll area enough width.
- Auto-sync was disabled to stop blinking, so the inbox only syncs when manually clicked.
- The main inbox uses a fixed height based on viewport math; combined with nested scroll areas, the thread detail panel can appear non-scrollable.
- AI suggestions are hidden behind a tab/conditional block and only appear if stored triage fields exist, so many conversations show blank AI sections.
- Sync functions fetch and classify too much sequentially; this caused the prior 150s idle timeout and makes syncing a few emails take minutes.

### Phase 1 — Make counts accurate and understandable
- Update `useOwnerInbox` so it returns two count layers:
  - **Global counts** for the selected channel/account, independent of status/category filters.
  - **Visible counts** for the currently filtered list.
- Change stats cards to clearly use the same base:
  - Total = total conversations in selected channel/account.
  - Unread = unread conversations, with optional smaller message count if needed.
  - Needs Reply / New / Follow-up Due are subsets of Total.
- Make channel tab badges use the same definition consistently, preferably conversation count + unread state, not a different unread-message total.
- Keep clicking stat cards as a filter, but do not let it rewrite the meaning of the top cards.

### Phase 2 — Fix premium header tabs and category chips
- Redesign channel tabs as a stable horizontal scroll strip with full labels: Gmail, Hostinger, Instagram, Facebook, Website, Voice.
- If multiple Gmail accounts exist, show a readable account label without crushing the tab, e.g. `Gmail · janeaboujaoudemodel`.
- Redesign category chips as a second horizontal scroll strip with full labels, fixed spacing, no overlap, and active state wired to the thread list.
- Keep the left thread list vertically scrollable and filtered by the selected channel + category.

### Phase 3 — Fix detail pane scrolling and AI suggestions
- Replace the broken four-tab detail layout with a single scrollable conversation-first view:
  - Conversation messages at the top.
  - AI summary + suggested reply directly inside the same section.
  - Quick actions: create task, schedule meeting, save note, use reply, send reply.
  - Lead/profile and activity as compact expandable sections below, not empty blocking tabs.
- Ensure the detail pane has one reliable vertical scroll container and the reply composer stays usable.
- Add fallback message rendering using thread preview if message rows are missing, so the conversation never appears completely blank for a synced email.

### Phase 4 — Speed up Gmail sync and stop timeouts/blinking
- Change `comm-inbound-sync` to be bounded and fast:
  - Sync only the active Gmail channel when the user is viewing that Gmail account.
  - Limit per request and return quickly with a clear `{ imported, scanned, hasMore }` response.
  - Skip Hostinger IMAP unless the active channel is Hostinger or “all” sync explicitly requests it.
  - Add per-message fetch timeouts and avoid long sequential work where possible.
- Add a lightweight auto-sync on inbox open:
  - Fire once shortly after page load for the active channel.
  - Then poll at a sane interval, not every second, to avoid rate limits/blinking.
  - Use realtime database updates to refresh immediately when new rows arrive.
- Keep the manual Refresh button, but show a clear syncing state and avoid re-render loops.

### Phase 5 — Fix classification / needs-reply logic
- Update triage rules so marketing, campaigns, advertising, system alerts, and spam are not automatically treated as “needs reply”.
- Apply deterministic category routing for obvious examples:
  - SHEIN / creator emails → Campaign / Influencer or Marketing depending on intent.
  - Emirates NBD / banking → Finance.
  - Google Search Console / verification / alerts → System / Website.
  - Luxury Closet price offers → Sales / Offers.
- Ensure every synced thread gets at least a category, summary, and suggested action; no blank AI panel.

### Phase 6 — AI command/check panel
- Add a compact AI command panel inside Unified Inbox where the owner can type natural-language actions like:
  - “Find unanswered Gmail emails from today.”
  - “Draft replies for all finance messages.”
  - “Create tasks from these selected conversations.”
- Initially wire it to safe actions: filtering, draft generation, task/note creation, and calendar event creation.
- Require explicit confirmation before sending or bulk-changing external Gmail state.

### Phase 7 — Follow-up intelligence and bulk actions
- Add bulk selection to the thread list: select visible, unselect, select unread, select needs reply.
- Add bulk actions:
  - Mark read/unread in app.
  - Assign category/status.
  - Create tasks.
  - Create calendar follow-ups.
  - Save notes.
  - Archive/dismiss.
- Where Gmail write-back is available, wire read/unread/archive/label changes to Gmail; if the connected Gmail permissions are missing, show a reconnect prompt for the needed Gmail scope.
- Add follow-up intelligence:
  - Show overdue replies.
  - Show waiting-for-them threads.
  - Suggest next follow-up time.
  - Keep these counts synced with the stats cards.

### Technical notes
- Files likely to change:
  - `src/hooks/useOwnerInbox.ts`
  - `src/pages/OwnerInbox.tsx`
  - `src/components/owner-inbox/OwnerInboxThread.tsx`
  - `src/hooks/useCommAITriage.ts`
  - `src/hooks/useDeveloperActionItems.ts`
  - `src/components/owner-inbox/DeveloperActionsRail.tsx`
  - `supabase/functions/comm-inbound-sync/index.ts`
  - `supabase/functions/comm-ai-triage/index.ts`
- Database changes may be needed for durable bulk/follow-up intelligence, such as action status history or Gmail label/write-back metadata. If needed, I will create a migration with RLS before code that depends on it.
- I will not remove existing inbox features; I will stabilize and reorganize them under the current unified inbox.