

## Session 18 — Email Assistant + Summary + Draft Reply + Send As Persona

### Current State

**What EXISTS:**
- `EmailClient.tsx` (706 lines) — Has a hardcoded "Amanda AI Panel" (lines 630-678) that shows static placeholder summaries (EN + AR) and a static suggested reply for every email — same text regardless of email content
- `SENDER_IDENTITIES` array (lines 43-52) — 8 sender identities with generic department names (e.g., "Marketing Team") instead of mapping to actual AI personas from `team-members.ts`
- Approve & Send modal (lines 358-420) — exists with signature block, but sender persona mapping is incomplete
- `ai-email-composer` edge function — exists but only generates CRM lead emails, NOT email summaries/replies
- `_shared/ai-utils.ts` — has `callLovableAI` helper using Lovable AI Gateway with `LOVABLE_API_KEY` (confirmed available)
- No edge function for email analysis/summary exists

**What's BROKEN / MISSING:**
1. EN/AR summaries are **hardcoded static text** — not AI-generated from actual email content
2. Suggested reply is **hardcoded** — same text for every email
3. "Use as Reply" and "Edit Draft" buttons do **nothing** (no click handlers)
4. "Draft with Amanda" button does **nothing**
5. No reply compose flow — clicking Reply/Reply All/Forward does nothing useful
6. SENDER_IDENTITIES uses generic names ("Marketing Team") instead of real team personas ("Victoria Sterling, Marketing Director")
7. No pending emails / alerts / tasks / reply-needed queue section
8. No email productivity dashboard in backend
9. Signature block doesn't dynamically change per persona properly

### Implementation Plan

#### 1. Create `ai-email-assistant` Edge Function
**File:** `supabase/functions/ai-email-assistant/index.ts`

Three actions:
- **`summarize`** — Takes email subject + body, returns JSON with `{ summary_en, summary_ar, suggested_reply, priority, action_items[] }`
- **`draft_reply`** — Takes email content + optional user instructions, returns a full reply draft
- **`refine_reply`** — Takes draft + edit instructions, returns refined version

Uses `callLovableAI` from shared utils with `google/gemini-3-flash-preview`. System prompt instructs bilingual output and persona-aware drafting.

Register in `supabase/config.toml` with `verify_jwt = false`.

#### 2. Update SENDER_IDENTITIES to Map to Real Team Personas
**File:** `src/pages/EmailClient.tsx`

Replace generic department names with actual highest-ranking team member per department from `team-members.ts`:

| Current | Updated |
|---------|---------|
| `HR Department` | `Sarah Mitchell` (HR Manager from team config) |
| `Admin Team` | `Michael Sterling` (Admin Director) |
| `Front Desk` | `Emily Chen` (Front Desk Coordinator) |
| `Help Desk` | `Natalia Petrova` (Customer Success) |
| `Marketing Team` | `Victoria Sterling` (Marketing Director — highest in marketingTeam) |

Amanda Clarke and Jane Bou Jaoude stay as-is. Personal stays as-is.

Each identity gets a `teamMemberId` field linking to the `team-members.ts` config for consistency.

#### 3. Build AI-Powered Email Analysis Panel
**File:** `src/components/email/EmailAssistantPanel.tsx` (NEW)

Replaces the static Amanda panel in EmailClient. When an email is selected:
1. Calls `ai-email-assistant` with `action: "summarize"` 
2. Shows loading skeleton while AI generates
3. Renders EN summary card + AR summary card (RTL)
4. Shows suggested reply with "Use as Reply" (opens reply compose with text pre-filled) and "Edit Draft" (opens inline editor)
5. Shows action items extracted by AI (tasks, follow-ups, calendar items)
6. Caches results per email ID to avoid re-calling on re-select

#### 4. Build Reply Compose Flow
**File:** `src/pages/EmailClient.tsx`

Wire Reply/Reply All/Forward buttons:
- Opens compose dialog pre-filled with quoted original email
- "Send As" selector prominently shown (same SENDER_IDENTITIES but with real names)
- "Draft with Amanda" button calls `ai-email-assistant` with `action: "draft_reply"` and populates the body
- Flow: Draft → Select "Send As" persona → "Preview & Send" → Approve & Send modal with correct signature

#### 5. Dynamic Signature Block Per Persona
**File:** `src/pages/EmailClient.tsx` (Approve & Send modal)

Signature logic mapped per sender identity:
- **Amanda Clarke** → "Executive Assistant to the Founder & CEO, Jane Bou Jaoude"
- **Victoria Sterling** → "Marketing Director, JBJ Global Real Estate"
- **Sarah Mitchell** → "HR Manager, JBJ Global Real Estate"
- Generic pattern: `{name}\n{role}\nJBJ Global Real Estate\n{email}`

#### 6. Email Productivity Panel
**File:** `src/components/email/EmailProductivityPanel.tsx` (NEW)

Shows in a collapsible section or sidebar tab:
- **Pending Emails** — unread inbox count
- **Needs Reply** — emails with AI-detected action items requiring response
- **Tasks** — action items extracted from recent emails
- **Follow-up Alerts** — emails flagged for follow-up
- **Reply Queue** — prioritized list of emails needing owner attention

Data sourced from the AI analysis results (cached in component state per session). For persistence across sessions, store analysis results in `owner_comm_messages` metadata or a new lightweight table.

#### 7. Database — Email Analysis Cache Table
```sql
CREATE TABLE IF NOT EXISTS public.email_analysis_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id text NOT NULL,
  summary_en text,
  summary_ar text,
  suggested_reply text,
  priority text DEFAULT 'normal',
  action_items jsonb DEFAULT '[]',
  needs_reply boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(email_id)
);

ALTER TABLE public.email_analysis_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner read/write" ON public.email_analysis_cache
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
```

### Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/functions/ai-email-assistant/index.ts` | NEW — AI summarize/draft/refine |
| `supabase/config.toml` | Add `[functions.ai-email-assistant]` |
| `src/components/email/EmailAssistantPanel.tsx` | NEW — AI-powered analysis panel |
| `src/components/email/EmailProductivityPanel.tsx` | NEW — pending/alerts/tasks panel |
| `src/pages/EmailClient.tsx` | Update SENDER_IDENTITIES with real personas, wire reply flow, integrate AI panel, dynamic signatures |
| Database migration | Create `email_analysis_cache` table |

### Persona Mapping Proof (Task 5 compliance)

| Sender ID | Email Name | Team Config ID | Team Config Name | Role |
|-----------|-----------|----------------|------------------|------|
| owner | Jane Bou Jaoude | jane-bou-jaoude | Jane Bou Jaoude | Founder & CEO |
| amanda | Amanda Clarke | amanda-clarke | Amanda Clarke | Executive Assistant to CEO |
| hr | Sarah Mitchell | sarah-mitchell | Sarah Mitchell | Listing & HR Admin |
| marketing | Victoria Sterling | victoria-sterling | Victoria Sterling | Marketing Director |
| frontdesk | Emily Chen | — (from JBJ_AI_AGENTS) | Emily Chen | Front Desk Coordinator |
| helpdesk | Natalia Petrova | natalia-petrova | Natalia Petrova | Customer Success |
| admin | Michael Sterling | — (from JBJ_AI_AGENTS) | Michael Sterling | Administrative Director |

All names are real personas already in the JBJ system — no invented names.

