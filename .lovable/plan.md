

## Plan: Email Client + Team Chat — Full System Upgrade

### What I found

1. **Email Client** (`/email-client`, `/owner/email-client`): Currently a demo-only UI with hardcoded emails, basic compose with 2 sender options (company/personal), Amanda suggestion panel is static/non-functional. No Resend integration, no signature/stamp system, no "send as" role selection.

2. **Team Chat** (`/team-chat`, `/employee-chat`): Uses `allTeamMembers` from config which includes ~100+ members, most with `isAI: true`. Only ~35 have `isAI: false` (real MENA sales + legal). Amanda Clarke is ID'd as AI executive assistant. The chat hub shows all team members including AI personas.

3. **Layout issues**: Both pages render inside `OwnerGuard` but lack the horizontal utility bar (48px champagne header). The email client uses `h-[calc(100vh-60px)]` which doesn't account for the owner layout properly. Team chat page has its own header that collides with the "Founder & CEO" bar.

4. **No meeting booking system exists** for Amanda → external user meeting scheduling.

---

### Implementation Plan

**Batch A — Layout & Header Fixes (both pages)**

1. Add horizontal utility bar integration to both Email Client and Team Chat pages
2. Fix top padding so content doesn't touch the "Founder & CEO" bar (use `pt-[52px]` per standard)
3. Adjust `h-[calc(100vh-...)]` to account for both the 48px utility bar and any owner layout chrome
4. Ensure champagne gold theme consistency

**Batch B — Email Client Overhaul**

1. **Sender identity system** — Replace 2-option sender with expanded role selector:
   - Owner (Jane Bou Jaoude) with signature
   - Amanda, Personal Assistant
   - HR Team
   - Admin
   - Front Desk
   - Help Desk
   - Marketing Department
   - Personal email identity
   - Company email identity
   Each identity includes name, email, title, and signature block

2. **Personal/Company tab sections** — Convert account tabs into prominent section switcher (not just filter tabs). Each section manages its own inbox independently

3. **Send method toggle** — Add "Send via Resend" / "Send Normally" toggle on compose, defaulting to Resend. Create edge function for Resend email sending

4. **Signature & stamp integration** — Add email signature block, company stamp, and e-signature card as insertable elements in compose. Pull from existing e-signature assets

5. **Amanda AI assistant integration** — Make Amanda's suggestion panel functional:
   - Read unread/unanswered emails and surface them
   - Auto-generate follow-up reminders
   - Draft replies via AI edge function
   - Auto-add follow-ups to calendar/notes/tasks
   - Priority queue: unanswered emails appear first

6. **Fix cropped layout** — Ensure email list items and reading pane aren't clipped; proper overflow handling

**Batch C — Team Chat Overhaul**

1. **Remove AI personas from member list** — Filter out all `isAI: true` members EXCEPT Amanda Clarke
2. **Show real employees by department category** — Group sidebar by department with collapsible sections
3. **Amanda integration** — Keep Amanda always visible at top of chat list. She can:
   - Read messages and generate professional replies
   - Send as different identities (Amanda, Owner)
   - Assign tasks and meetings on behalf of owner
4. **Channel system** — Add department-based group channels alongside direct messages

**Batch D — Meeting Booking System via Amanda**

1. **Public booking form** — External users submit: name, email, purpose, preferred time, details
2. **Meeting Hub (backend tab)** — Owner sees all meeting requests with approve/reschedule/cancel actions
3. **Amanda orchestration**:
   - Receives booking requests
   - Sends confirmation emails to user
   - Books owner's calendar
   - Sends reminders to both parties
   - Handles reschedule/cancel flows with email notifications to both sides
4. **Integration points**: JBJ Video Meet link, Meeting Summarizer, Calendar, Notes
5. **Database**: `meeting_requests` table with status workflow (pending → confirmed → completed/cancelled/rescheduled)

**Batch E — Resend API Integration**

1. Request Resend API key via secrets tool (two domains: personal + company @jbj.ae)
2. Create `send-email-resend` edge function that:
   - Accepts sender identity, recipient, subject, body, signature, attachments
   - Routes through correct verified domain based on personal vs company
   - Returns send status
3. Wire compose dialog to call edge function with selected send method

### Technical Details

- **Database migrations needed**: `meeting_requests` table, `email_signatures` table
- **Edge functions**: `send-email-resend`, `amanda-meeting-bot`
- **Config changes**: Filter `allTeamMembers` by `isAI === false || id === 'amanda_clarke'` in chat hub
- **Files modified**: `EmailClient.tsx`, `EmployeeChatPage.tsx`, `EmployeeChatHub.tsx`, `useEmployeeChat.ts`
- **Files created**: `MeetingBookingHub.tsx`, `EmailSenderIdentity.tsx`, `AmandaMeetingBot.tsx`

### Execution Order
1. Batch A (layout fixes) — immediate visual fix
2. Batch B (email client) — core functionality
3. Batch C (team chat) — member cleanup + Amanda
4. Batch D (meeting booking) — new system
5. Batch E (Resend) — requires API key from user

