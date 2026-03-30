

# Auditor Access Management System

## What we're building

A complete auditor lifecycle management system with these capabilities:

1. **Force password change on first login** for Salim (and any future auditors)
2. **One-time password change restriction** — auditor can only change password once; further changes require owner approval
3. **Admin panel section** for managing external user access (suspend, restrict, revoke)
4. **Full behavior tracking** — pages visited, time spent, actions taken, session mirroring
5. **Anti-capture restrictions** — prevent screenshots, screen recording, copy/paste for auditors
6. **Auditor feedback tools** — screenshot-to-owner, notes, task assignment, prompt sharing
7. **Owner inbox** — see auditor feedback, tasks, screenshots in account dropdown

---

## Technical Plan

### 1. Database: New tables and columns

**`auditor_profiles` table** — stores auditor metadata and access controls:
- `id`, `user_id` (FK to auth.users), `display_name`, `email`
- `force_password_change` (boolean, default true)
- `password_changed` (boolean, default false — locks out further changes)
- `password_changed_at` (timestamptz)
- `is_suspended` (boolean, default false)
- `suspended_at`, `suspended_by`
- `access_expires_at` (timestamptz)
- `total_logins` (integer)
- `last_login_at` (timestamptz)
- `created_at`

**`auditor_sessions` table** — tracks every session and page activity:
- `id`, `auditor_user_id`, `session_start`, `session_end`
- `pages_visited` (jsonb — array of {path, entered_at, left_at, time_spent_seconds})
- `total_time_seconds`, `device_type`, `ip_hint`
- `actions_log` (jsonb — array of {action, target, timestamp})

**`auditor_feedback` table** — stores screenshots, notes, tasks sent to owner:
- `id`, `auditor_user_id`, `feedback_type` (enum: 'screenshot_note', 'task', 'message')
- `screenshot_url` (nullable, stored in private bucket)
- `note_text`, `prompt_text` (the copyable prompt)
- `voice_message_url` (nullable)
- `page_url` (where the feedback was captured)
- `status` (enum: 'new', 'read', 'actioned')
- `owner_response` (text, nullable)
- `created_at`

**RLS**: All tables owner-only for SELECT/UPDATE/DELETE. Auditor gets INSERT on `auditor_feedback` and SELECT on own `auditor_profiles` row only.

**Storage bucket**: `auditor-feedback` (private) for screenshots and voice messages.

### 2. Force password change for auditors

**File: `src/hooks/useAuditorPasswordChange.ts`** (new)
- On login, check `auditor_profiles.force_password_change`
- If true, block all navigation — show password change screen
- After change: set `force_password_change = false`, `password_changed = true`
- If `password_changed` is already true, hide the "Change Password" option entirely

**File: `src/components/auth/AuditorForcePasswordChange.tsx`** (new)
- Similar to existing `ForcePasswordChange.tsx` but branded for auditors
- After successful change, redirect to main app with read-only banner

**Integration point**: Wrap auditor routes in `OwnerGuard` → check `auditor_profiles` before rendering children.

### 3. Admin panel: External Access Management

**File: `src/pages/owner/ExternalAccessManagement.tsx`** (new)
- Route: `/owner/external-access`
- Sections:
  - **Active Users**: Table showing all auditors with name, email, role, login count, last login, time spent, status (active/suspended/expired)
  - **Suspend/Unsuspend**: Toggle button per user — sets `is_suspended = true` in `auditor_profiles`
  - **Session History**: Expandable row showing all sessions with pages visited, time breakdown, actions taken
  - **Feedback Inbox**: All screenshots, notes, tasks from auditors (merged view)
  - **Access Expiry**: Shows countdown, option to extend

- Add link in existing admin sidebar/navigation

### 4. Behavior tracking for auditors

**File: `src/hooks/useAuditorTracking.ts`** (new)
- Wraps the existing `useUserTracking` pattern but writes to `auditor_sessions`
- Tracks: every page navigation (with timestamps), time on each page, button clicks, scroll depth, tool interactions
- Batches writes every 10 seconds
- On beforeunload: flush final session data via sendBeacon

**Integration**: In `MainLayout.tsx`, if `isAuditor`, mount `useAuditorTracking` alongside the read-only banner.

### 5. Anti-capture restrictions

**File: `src/hooks/useAntiCapture.ts`** (new)
- Activated only for auditor role
- CSS: `user-select: none` on body, `-webkit-touch-callout: none`
- JS listeners:
  - Block `Ctrl+C`, `Ctrl+P`, `Ctrl+S`, `PrintScreen` key events
  - Block right-click context menu
  - Detect `visibilitychange` + screen recording APIs where possible
  - Add CSS `@media print { body { display: none } }` to block print
- Note: Browser-level screenshots cannot be fully prevented, but these measures raise the barrier significantly

### 6. Auditor feedback tools

**File: `src/components/auditor/AuditorFeedbackPanel.tsx`** (new)
- Appears in auditor's account dropdown as "Send Feedback to Jane"
- Features:
  - **Screenshot capture**: Uses `html2canvas` to capture current viewport → uploads to `auditor-feedback` bucket → saves URL to `auditor_feedback` table
  - **Note/description**: Textarea for explaining the issue
  - **Voice message**: MediaRecorder API to record audio → upload to bucket
  - **Task assignment**: Structured form with title + description
  - **Prompt field**: Large textarea for writing a full prompt, with a "Copy" button next to it (for owner to copy)
  - **"Send to Jane" button**: Submits everything to `auditor_feedback` table

**File: `src/components/auditor/AuditorFeedbackButton.tsx`** (new)
- Floating action button (bottom-right) visible only to auditors
- Opens the feedback panel as a slide-over or modal

### 7. Owner inbox for auditor feedback

**File: `src/components/owner/AuditorFeedbackInbox.tsx`** (new)
- Shows in owner's `MegaMenuAccount` dropdown as a new section: "Auditor Reports"
- Badge with unread count
- Each item shows: screenshot thumbnail, note text, prompt (with copy button), task details, page URL, timestamp
- Mark as read / actioned

**Integration in `MegaMenuAccount.tsx`**: Add a section for auditor feedback with unread badge, linking to full view at `/owner/external-access`.

### 8. Suspend logic enforcement

In `AuthContext.tsx` or `OwnerGuard.tsx`:
- After confirming auditor role, check `auditor_profiles.is_suspended`
- If suspended → show "Access Suspended" screen (no redirect to /403, custom message: "Your access has been suspended by the administrator")
- This check runs on every page load

---

## Files to create
- `src/hooks/useAuditorPasswordChange.ts`
- `src/hooks/useAuditorTracking.ts`
- `src/hooks/useAntiCapture.ts`
- `src/components/auth/AuditorForcePasswordChange.tsx`
- `src/components/auditor/AuditorFeedbackPanel.tsx`
- `src/components/auditor/AuditorFeedbackButton.tsx`
- `src/components/owner/AuditorFeedbackInbox.tsx`
- `src/pages/owner/ExternalAccessManagement.tsx`

## Files to modify
- `src/contexts/AuthContext.tsx` — add suspend check
- `src/components/OwnerGuard.tsx` — add suspend + force-password-change gate
- `src/components/MainLayout.tsx` — mount anti-capture + tracking for auditors
- `src/components/header/MegaMenuAccount.tsx` — add auditor feedback section for owner, feedback tools for auditor
- Router config — add `/owner/external-access` route

## Database migrations
- Create `auditor_profiles`, `auditor_sessions`, `auditor_feedback` tables
- Create `auditor-feedback` storage bucket (private)
- RLS policies for all new tables
- Insert initial row for Salim Akil with `force_password_change = true`

