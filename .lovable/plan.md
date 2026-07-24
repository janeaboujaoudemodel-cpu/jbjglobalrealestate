Plan to fix the developer campaign flow end to end:

1. Sender and locked payload correction
- Set developer campaign sender display name to `JBJ Global Real Estate`.
- Set developer From and Reply-To to `helpdesk@jbj.ae`.
- Add CC to `infoo.jane@gmail.com` for developer sends.
- Remove stale references to personal senders such as Jane / `jane@...` / old helpdesk variants from the developer send preview, lock dialog, and payload metadata.
- Keep brokerage/client sender rules separate so this fix does not leak into other portals.

2. Connect and validate the helpdesk mailbox
- Open the Gmail connector flow so the `helpdesk@jbj.ae` mailbox can be linked as an additional project mailbox.
- After connection, validate the connected Gmail profile email equals `helpdesk@jbj.ae` before using it for sync.
- Update inbound sync to poll all linked Gmail connections, map each mailbox by actual profile email, and treat `helpdesk@jbj.ae` as the developer registration inbox.
- If the connected account is not `helpdesk@jbj.ae`, show a clear setup warning instead of silently syncing the wrong mailbox.

3. Canonical campaign KPI fix
- Rewire the Developer Campaign Dashboard so the top cards, filter chips, row table, and action bar all read from one canonical recipient row dataset.
- Fix the confirmed mismatch: the current stat cards count canonical/legacy status differently from the table filters, so `Sent = 1` while the Sent filter can show zero, and `Pending response = 1` while the Pending filter can show zero.
- Define one status classifier that supports overlapping states correctly:
  - Sent = provider accepted / real send evidence.
  - Delivered = delivered evidence.
  - Opened = opened evidence.
  - Responded = human reply evidence.
  - Pending response = sent/delivered/opened/clicked and no human reply.
  - Bounced/rejected/invalid/deferred excluded from successful delivery counts.
- Make all KPI cards and filter chips clickable and show the exact rows behind the number.
- Stop creating duplicate rows for the same intended developer test/send where a retry should update the same canonical row.

4. Dashboard UI/contrast repair
- Find and override the winning CSS rule causing emerald buttons/pills to render black text/icons.
- Lock active pills, status badges, Select Pending, Prepare AI Drafts, and Accept & Send buttons to the JBJ emerald gradient with pure white text/icons.
- Fix the delivered/status badge wrapping by giving badges stable dimensions and non-wrapping text.
- Keep row cards/table balanced and clickable without nested buttons or broken rounded edges.

5. Click-through email detail workspace
- Add a right-side vertical workspace/drawer when a campaign row is clicked.
- Show: recipient/developer, subject, sent body, delivery/open/reply timeline, inbound reply content, detected status, next step, and AI recommendation.
- Add AI draft controls: prepare draft, rewrite with AI, approve/send reply.
- Connect this to the existing owner AI reply engine / inbox messages where possible, and keep secrets/model calls server-side.

6. Current Gmail status synchronization
- Add a manual “Sync mailbox now” action for developer campaign tracking.
- Sync current Gmail/helpdesk messages rather than starting fresh.
- Match inbound replies by thread/message id, sender domain/email, and developer record.
- Update campaign rows with `human_reply`, `automated_reply`, or `no_reply` based on real inbox evidence.
- Only mark developer business status as registered when the email explicitly says an affirmative status like `Status: Registered`, not ambiguous wording like “registered?” or generic mentions.

7. Developer template rewrite
- Rewrite developer registration templates to instruct developers to:
  - Reply to the sender/helpdesk with all registration requirements and forms.
  - Keep updating status using explicit lines such as `Status: Registered`, `Status: Pending`, `Status: Active`, or `Status: Pending Documents`.
  - Create a WhatsApp group, add Jane and Waleed, and make both admins.
  - Use their own developer logo in the group.
  - Use group naming format: `{Developer Full Name} / JBJ Global Real Estate`.
  - Put marketing-material links in the group description.
  - Add sales managers and channel/agency department members.
  - Keep JBJ posted on commissions, campaigns, launches, events, and registration progress.
- Make Waleed an urgent-support contact only; do not tell developers to email/call Jane.
- Keep Jane’s role limited to being added to the WhatsApp group and made admin, per your instruction.

8. Phase 3 continuation
- After the above fixes, continue Phase 3 by completing the AI reply agent workflow:
  - mailbox sync,
  - reply classification,
  - developer card/profile updates from email content,
  - AI-generated next steps/drafts,
  - approval before sending.
- Do not expose restricted developer location/contact details on the public/front-end cards; keep those visible only in owner/backend views.

9. Validation
- Trigger a live test send to `infoo.jane@gmail.com` after the sender and CC rules are fixed.
- Run the developer portal flow visually with Playwright screenshots: dashboard counts, filter clicks, active pill contrast, row click workspace, test-send row update, and mailbox sync result.
- Confirm the test row updates consistently across Sent / Delivered / Opened / Pending Response / Responded views based on real evidence.