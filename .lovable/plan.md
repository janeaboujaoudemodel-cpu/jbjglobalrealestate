

## Session 22 — Global Email / Chat Rule Engine + Affected Places Audit

### Current State: All Communication Points

After auditing the entire codebase, here are **all places that send email, chat, or notifications**:

| # | Module / File | Edge Function | Channel | Cross-Channel Logic? |
|---|---------------|---------------|---------|---------------------|
| 1 | **EmailClient.tsx** (Email Hub) | `send-owner-email` | Email-first | ✅ `alsoNotifyChat` + `useCrossChannelDetection` |
| 2 | **TeamChat.tsx** (JBJ Workspace) | `send-owner-email` | Chat-first | ✅ `alsoSendByEmail` toggle |
| 3 | **EmployeeChatHub.tsx** | `send-owner-email` | Chat-first | ✅ `alsoSendByEmail` toggle |
| 4 | **Contact.tsx** (Contact form) | `send-inquiry-email` | Email-only | ❌ Public form — no cross-channel needed |
| 5 | **ConsultationRequestForm.tsx** | `send-inquiry-email` | Email-only | ❌ Public form — no cross-channel needed |
| 6 | **InquiryFormModal.tsx** | `send-inquiry-email` | Email-only | ❌ Public form — no cross-channel needed |
| 7 | **AIChatWidget.tsx** (Escalation) | `send-inquiry-email` | Email-only | ❌ Public escalation — no cross-channel needed |
| 8 | **AIPersonalShopper.tsx** | `send-inquiry-email` | Email-only | ❌ Public — no cross-channel needed |
| 9 | **MeetingBookingModal.tsx** | `send-inquiry-email` | Email-only | ❌ Public booking — no cross-channel needed |
| 10 | **Auth.tsx** (Welcome email) | `send-welcome-email` | Email-only | ❌ System email — no cross-channel needed |
| 11 | **ReferralOnboarding.tsx** | `send-welcome-email` | Email-only | ❌ System email — no cross-channel needed |
| 12 | **CVCenter.tsx** (HR message) | `send-admin-message` | Email-only | ⚠️ **Missing**: Sends to candidate email but no chat-notify option for internal HR team |
| 13 | **SmartEmailComposer.tsx** (CRM) | `ai-email-composer` | Email-only | ⚠️ **Missing**: Composes email for CRM leads, no cross-channel option |
| 14 | **CampaignEditor.tsx** (Marketing) | `ai-email-composer` / `ai-whatsapp-composer` | Bulk email/WhatsApp | ❌ Bulk marketing — own delivery logic, out of scope per Session 19 |
| 15 | **BrokerSubscriptionsDashboard.tsx** | `send-security-alert` | Email-only (security) | ❌ Security alerts — system-only, no cross-channel needed |
| 16 | **AICalendar.tsx** (Event reminders) | None (toast only) | Toast-only | ⚠️ **Missing**: Says "Email reminders will be sent" but no actual send logic |
| 17 | **useAICommunication.ts** (AI Brokers) | `broker-chat` / `ai-email-composer` | WhatsApp/Email | ❌ CRM lead outreach — specialized, out of scope |
| 18 | **WhatsAppIntegrationPanel.tsx** | `broker-chat` | WhatsApp | ❌ CRM lead outreach — specialized |
| 19 | **FoundersVideoMeetPanel.tsx** | None (mailto/wa link) | External links | ❌ Opens native email/WhatsApp client |
| 20 | **EmailHubStatusPanel.tsx** | `send-owner-email` (check_status) | Diagnostic | ❌ Not a send — status check only |

### Assessment

**Already compliant (3):** EmailClient (#1), TeamChat (#2), EmployeeChatHub (#3) — these were wired in Sessions 19-20.

**Not applicable (12):** Items #4-11, #14-15, #18-19 — public forms, system emails, security alerts, marketing bulk, CRM outreach. These have their own delivery contexts and correctly don't use cross-channel logic per the Session 19 spec.

**Need updating (3):**
- **#12 CVCenter.tsx** — Owner sends HR messages to candidates via `send-admin-message`. Should add an "Also notify in Team Chat" option when the recipient is an internal employee.
- **#13 SmartEmailComposer.tsx** — CRM email composer. Should add "Also notify in Team Chat" when lead matches an internal user (rare but possible for internal referrals).
- **#16 AICalendar.tsx** — Claims email reminders but has no actual send logic. Should wire to `send-owner-email` for attendee notifications.

### Implementation Plan

#### 1. Create a shared `CrossChannelToggle` component
**File:** `src/components/shared/CrossChannelToggle.tsx` (NEW)

A reusable UI component that encapsulates the cross-channel toggle pattern used across modules:
- Props: `recipientEmail`, `channel` ('email-first' | 'chat-first'), `onToggle`, `checked`
- Internally uses `useCrossChannelDetection` to show/hide the toggle
- For email-first: shows "Also notify in Team Chat" (only when registered user detected)
- For chat-first: shows "Also send by email" (always visible since chat = internal)
- Renders the detection state (loading spinner, "Internal User" badge, "External recipient" label)

This replaces the inline toggle code duplicated across EmailClient, TeamChat, and EmployeeChatHub.

#### 2. Create `useCrossChannelSend` utility hook
**File:** `src/hooks/useCrossChannelSend.ts` (NEW)

A reusable hook that handles the dual-send logic:
- `sendWithCrossChannel({ primaryChannel, recipientEmail, subject, body, alsoSendSecondary, attachments? })`
- For email-first + alsoNotifyChat: sends email via `send-owner-email`, then inserts chat notification
- For chat-first + alsoSendByEmail: sends chat message, then sends email via `send-owner-email`
- Handles error isolation (secondary channel failure doesn't block primary)
- Centralizes all cross-channel send logic in one place

#### 3. Refactor EmailClient, TeamChat, EmployeeChatHub to use shared components
- Replace inline toggle markup with `<CrossChannelToggle />`
- Replace inline cross-channel send logic with `useCrossChannelSend`
- No behavior change — pure refactor for consistency

#### 4. Add cross-channel option to CVCenter.tsx (HR messaging)
- Import `CrossChannelToggle` with `channel="email-first"`
- When recipient email matches an internal team member, show "Also notify in Team Chat"
- Wire send button to use `useCrossChannelSend`

#### 5. Add cross-channel option to SmartEmailComposer.tsx (CRM)
- Import `CrossChannelToggle` with `channel="email-first"`
- Show toggle when lead email matches a registered user
- Wire the `onSend` callback to include cross-channel logic

#### 6. Wire AICalendar.tsx event reminders to actually send email
- When `emailReminder` is true and attendees are specified, call `send-owner-email` for each attendee
- Add cross-channel: if attendee is a registered user, also optionally post a chat notification about the event

### Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/shared/CrossChannelToggle.tsx` | NEW — Reusable toggle with detection |
| `src/hooks/useCrossChannelSend.ts` | NEW — Reusable dual-send hook |
| `src/pages/EmailClient.tsx` | REFACTOR — Use shared toggle + send hook |
| `src/pages/TeamChat.tsx` | REFACTOR — Use shared toggle + send hook |
| `src/components/employee-chat/EmployeeChatHub.tsx` | REFACTOR — Use shared toggle + send hook |
| `src/components/crm/CVCenter.tsx` | UPDATE — Add cross-channel toggle to HR messaging |
| `src/components/crm/SmartEmailComposer.tsx` | UPDATE — Add cross-channel toggle |
| `src/pages/AICalendar.tsx` | UPDATE — Wire email reminder send + cross-channel |

### Global Consistency Report (Post-Implementation)

```text
┌─────────────────────────────────────────────────────────────────┐
│                   COMMUNICATION RULE ENGINE                      │
├──────────────────────┬──────────────┬────────────┬──────────────┤
│  Module              │  Primary     │  Secondary │  Detection   │
├──────────────────────┼──────────────┼────────────┼──────────────┤
│  Email Hub           │  Email       │  Chat (if  │  YES         │
│                      │              │  internal) │              │
│  Team Chat           │  Chat        │  Email     │  N/A (all    │
│                      │              │  (toggle)  │  internal)   │
│  Employee Chat       │  Chat        │  Email     │  N/A (all    │
│                      │              │  (toggle)  │  internal)   │
│  CRM SmartEmail      │  Email       │  Chat (if  │  YES         │
│                      │              │  internal) │              │
│  HR CV Center        │  Email       │  Chat (if  │  YES         │
│                      │              │  internal) │              │
│  Calendar Reminders  │  Email       │  Chat (if  │  YES         │
│                      │              │  internal) │              │
├──────────────────────┼──────────────┼────────────┼──────────────┤
│  Public Forms        │  Email-only  │  None      │  N/A         │
│  Welcome Emails      │  Email-only  │  None      │  N/A         │
│  Security Alerts     │  Email-only  │  None      │  N/A         │
│  Marketing Bulk      │  Own logic   │  Own logic │  N/A         │
│  CRM AI Brokers      │  Own logic   │  Own logic │  N/A         │
└──────────────────────┴──────────────┴────────────┴──────────────┘
```

### What Will NOT Be Implemented (Transparency)

- **Marketing Hub bulk campaigns** — Uses its own batch delivery system with different requirements (audience targeting, batching). Not part of owner's direct communication rule engine.
- **CRM AI Broker communications** — Uses `broker-chat` and WhatsApp API. Specialized CRM outreach to external leads, not subject to internal cross-channel rules.
- **Security alerts** — System-generated to owner only via `send-security-alert`. No chat dual-send needed.
- **Public-facing forms** — Contact, Consultation, Inquiry, AI Chat escalation. These notify the admin team; no cross-channel toggle is appropriate for anonymous visitors.

