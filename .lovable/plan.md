## Plan to fix the Unified Inbox behavior

### 1. Make “Send link” actually work
- Fix the backend reply logging bug in `send-developer-reply`: it inserts into `owner_comm_messages` using `body`, but the table uses `content`, which can make the action fail after Gmail send or silently not update the inbox.
- Add proper success/error feedback on the card button so the user sees “sending”, “sent”, or the exact reconnect/missing-link problem.
- Disable “Send link” only when there is truly no email or no document link, and show a clear reason instead of appearing unclickable.
- Because the current `document_library_links` table is empty, add a safe default document-link seed or fallback path so “Send link” has something valid to send for general document requests.

### 2. Replace the black email icon boxes with gold/champagne styling
- Update the Required Actions cards so sender icons use the project’s `IconTile` gold/champagne tones instead of black blocks.
- Keep semantic tones for true document/action types, but marketing/other notification cards should never render as harsh black.
- Apply the same visual rule in thread list avatars where email badges appear over the round icon.

### 3. Stop putting marketing/newsletters into Required Actions
- Tighten `classify-developer-request` so only real developer/document requests become Required Actions.
- Explicitly skip Google Search Console, ShopStyle, LinkedIn notifications, Canon product ads, GITEX newsletters, SHEIN/campaign promos, bank offers, retail promos, system alerts, and generic marketing.
- Keep Charbel / real people and real developer document requests eligible when they need a reply.

### 4. Add smarter category organization for the inbox
- Expand categories to include user-specific buckets:
  - Campaign / Influencer
  - Advertising / Promotions
  - Marketing
  - Finance / Banking
  - Sales / Offers
  - Business / LinkedIn Content
  - Real Estate Leads
  - Real Estate Ops
  - Developer / Documents
  - Personal
  - System / Website
  - Spam / Other
- Update client-side fallback categorization so examples route correctly:
  - SHEIN Creator Center → Campaign / Influencer
  - Canon camera ads → Advertising / Promotions
  - LinkedIn content notifications → Business / LinkedIn Content
  - Emirates NBD → Finance / Banking
  - ShopStyle / retail newsletters → Marketing or Advertising
  - Google Search Console / GitHub / Hostinger verification → System / Website
  - The Luxury Closet price offer → Sales / Offers

### 5. Make AI triage reliable and not blank
- Update `comm-ai-triage` with the expanded category rules and fallback replies.
- If the AI returns blank, always save a rule-based summary, category, next step, and suggested reply/“no reply needed” reason.
- Add a small batch triage pass after sync/refresh for visible unprocessed threads so categories populate without opening every email manually.

### 6. Add the AI command/chat foundation inside the inbox
- Add an “AI Assistant” panel on the inbox page where the owner can type commands like:
  - “Open the LinkedIn email and reply 1 to 3”
  - “Answer all campaign requests politely”
  - “Show emails I received and didn’t respond to”
- Implement a protected backend function that reads the owner’s inbox, messages, CRM notes/tasks, prior replies, and current thread context, then returns safe proposed actions.
- For sending or bulk actions, require owner confirmation first; the AI can draft and queue, not silently send irreversible replies.

### 7. Wire follow-up intelligence
- Mark threads as `needs_reply`, `waiting`, or `follow_up_due` based on message direction and age.
- Surface “you received this and didn’t respond” in Required Actions and the AI panel.
- Add quick actions: create task, schedule follow-up, use AI reply, send after confirmation.

### Technical details
- Files to update:
  - `src/pages/OwnerInbox.tsx`
  - `src/components/owner-inbox/DeveloperActionsRail.tsx`
  - `src/components/owner-inbox/OwnerInboxThread.tsx`
  - `src/hooks/useCommAITriage.ts`
  - `src/hooks/useDeveloperActionItems.ts`
  - `supabase/functions/send-developer-reply/index.ts`
  - `supabase/functions/classify-developer-request/index.ts`
  - `supabase/functions/comm-ai-triage/index.ts`
  - likely add one new protected AI command function
- Database change needed:
  - Add/seed default document library links if none exist.
  - Optionally add a table for AI command/action audit so every AI-suggested/send action is traceable.
- Validation:
  - Confirm clicking “Send link” sends or shows the exact missing prerequisite.
  - Confirm black icon boxes are gone.
  - Confirm non-action marketing cards disappear from Required Actions and move into categories.
  - Confirm category filters show SHEIN, Canon, LinkedIn, Emirates NBD, Google Search Console, and Luxury Closet in the intended sections.
  - Confirm AI Suggestions and AI command panel never show blank states.

After approval, I’ll implement this in focused phases, starting with the broken click + icon styling + smart categorization so the current inbox becomes usable immediately.