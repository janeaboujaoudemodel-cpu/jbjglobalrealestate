

## Session 19 — Email Hub + Chat Hub + Cross-Channel Logic

### Current State

| Location | Chat Toggle | Email Toggle | User Detection |
|----------|------------|-------------|----------------|
| **TeamChat.tsx** (JBJ Workspace) | ON by default (primary) | `alsoSendByEmail` toggle exists, OFF by default | Comment says "all recipients are registered" — no actual detection |
| **EmailClient.tsx** (Email Hub) | `alsoNotifyChat` toggle exists, OFF by default | ON by default (primary) | Shows "(if internal user)" label — no actual detection logic |
| **EmployeeChatHub.tsx** (Employee Chat) | ON by default (primary) | **NO toggle at all** | No detection |
| **Edge function** (`send-owner-email`) | Cross-notify code exists but requires `chatRecipientId` which is **never sent** from frontend | Primary | No user lookup |

**Root problems:**
1. The Email Hub chat-notify toggle is cosmetic — `alsoNotifyChat` is sent to the edge function but `chatRecipientId` is never populated, so the cross-notification never fires
2. No user detection logic exists — the system never checks if a recipient email belongs to a registered platform user
3. Employee Chat Hub has no "also email" toggle at all
4. The `alsoSendByEmail` in TeamChat is cosmetic — `sendMessage()` never reads it or triggers any email action

### Implementation Plan

#### 1. Create shared cross-channel utility hook: `useCrossChannelDetection`
**File:** `src/hooks/useCrossChannelDetection.ts`

A reusable hook that:
- Takes a recipient email/identifier
- Queries `auth.users` (via a new edge function action) or `crm_users_profile` / `profiles` to check if that email belongs to a registered user
- Returns `{ isRegistered: boolean, userId: string | null, displayName: string | null }`
- Used by both Email Hub and Chat Hub

#### 2. Create edge function action: `check-recipient` in `send-owner-email`
Add a new action to the existing edge function:
- **`action: "check_recipient"`** — Takes `{ email: string }`, queries profiles/CRM tables, returns whether the user is registered and their internal ID
- This avoids exposing auth tables to the client

#### 3. Update Email Hub (`EmailClient.tsx`)
- Import and use `useCrossChannelDetection` on the `newEmail.to` field
- When recipient IS registered: show the "Also notify in Team Chat" toggle (as it exists now) — pass the detected `userId` as `chatRecipientId` to the edge function
- When recipient is NOT registered: **hide** the chat toggle entirely, show a subtle "External recipient — email only" label
- Email remains ON by default (primary channel)

#### 4. Update Team Chat (`TeamChat.tsx`)
- The `alsoSendByEmail` toggle already exists and is OFF by default — correct behavior per spec
- Wire `sendMessage()` to actually call `send-owner-email` when `alsoSendByEmail` is true, using the DM recipient's team email from their team member config
- Chat remains ON by default (primary channel)

#### 5. Update Employee Chat Hub (`EmployeeChatHub.tsx`)
- Add "Also email" toggle below the message input (matching TeamChat pattern)
- OFF by default
- When toggled ON and message sent, trigger `send-owner-email` to the employee's email from their team member config

#### 6. Update edge function cross-notification
- Fix the cross-notify block in `send-owner-email` to work without `chatRecipientId` when `alsoNotifyChat` is true — look up the recipient by email in the user profiles
- When `alsoNotifyChat` is true, insert a notification into `employee_chat_messages` with the matched user ID

### Files to Create/Modify

| File | Change |
|------|--------|
| `src/hooks/useCrossChannelDetection.ts` | NEW — shared user detection hook |
| `src/pages/EmailClient.tsx` | Wire detection to chat toggle visibility, pass `chatRecipientId` |
| `src/pages/TeamChat.tsx` | Wire `alsoSendByEmail` to actually send email via edge function |
| `src/components/employee-chat/EmployeeChatHub.tsx` | Add "Also email" toggle + wire to edge function |
| `supabase/functions/send-owner-email/index.ts` | Add `check_recipient` action, fix cross-notify to look up user by email |

### Cross-Channel Rules Summary

```text
┌─────────────────────────────────────────────────┐
│              COMMUNICATION RULES                 │
├─────────────────────┬───────────────────────────┤
│  CONTEXT            │  BEHAVIOR                 │
├─────────────────────┼───────────────────────────┤
│  Chat Hub           │  Chat: ON (default)       │
│  (TeamChat /        │  Email: OFF (toggle)      │
│   EmployeeChat)     │  All users are internal   │
│                     │  → always show email opt  │
├─────────────────────┼───────────────────────────┤
│  Email Hub          │  Email: ON (default)      │
│  (EmailClient)      │  Chat: conditional        │
│                     │  → registered? show chat  │
│                     │  → external? email only   │
└─────────────────────┴───────────────────────────┘
```

### What Will NOT Be Implemented (Transparency)
- Marketing Hub bulk notifications, CRM lead assignments, meeting booking emails, and other specialized notification points are out of scope — they have their own delivery logic and are not part of the owner's direct communication workflow.

