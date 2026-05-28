## Goal

Turn `/broker/ai` from a generic "AI Broker Workspace" mock into a real **AI Sales Assistant** for brokers — a chat tied to every lead in their CRM that gives them lead scoring, match recommendations, next-step advice, and ready-to-send messages with a one-click copy button. Also fix the small issues you flagged (filter, mystery 200, non-clickable KPI cards).

## Small fixes (immediate)

1. **Filter button works** — Wire the Filter button to a real popover with: pipeline stage, source, has-note, date range, sort. Active filter chips show under the search bar; "Clear all" resets.
2. **Remove the "0/200 Daily Capacity"** — This was a leftover from an old "AI broker bot" sending limit (`daily_interaction_limit` defaulted to 150/200). For a broker using the assistant, capacity is meaningless. Replace that card with **"This week"** stats (leads worked, messages drafted, deals closing soon) using `broker_daily_stats` aggregated over 7 days.
3. **Clickable KPI cards** — Leads Today → opens leads tab filtered to today. Messages → opens Conversations tab. Emails → `/broker/inbox`. Calls → `/broker/calendar?view=calls`. Conversions → `/broker/deals?stage=won`. Each card gets hover lift + ring and a working `onClick`.

## Main rebuild — AI Sales Assistant

### Layout (3 panes)

```text
┌───────────────────────┬──────────────────────────────┬────────────────────────┐
│  Sidebar: My Leads    │   Lead Header + AI Chat      │   AI Insights panel    │
│  (search + filters)   │   (scrollable transcript)    │   (score, match, next) │
│                       │   [composer]                 │                        │
└───────────────────────┴──────────────────────────────┴────────────────────────┘
```

- **Left**: every lead from `crm_leads` assigned to the broker (owner sees all). Search + the same filter from fix #1. Each row shows full name, last interest note, last activity time, and a tiny color match-score chip.
- **Middle**: when a lead is picked → lead header card (name, contact buttons, pipeline stage) + threaded chat between broker and AI. Composer at bottom with "Ask the assistant…" + quick chips (Score this lead, Recommend properties, Draft WhatsApp, Draft email, Next step).
- **Right (Insights)**:
  - **Match score** big green ring (0–100) computed from interest note vs available projects (budget, beds, area).
  - **Top 3 property matches** with developer + price + ✦ match %; each card has "Use in message" → AI drafts a message proposing it.
  - **Suggested next step** (e.g. "Send brochure for Emaar Greenview, then schedule site visit Tue 4pm").
  - **Lead vitals** (source, created, last message, engagement temperature).

### Ready-to-send messages

Every AI message in the chat that drafts client-facing copy is rendered in a **gold-hairline card** with:
- The message addressed to the lead by name.
- A **"Copy"** button (top-right of the card) using `navigator.clipboard.writeText`; toast "Copied — paste into WhatsApp/email".
- Secondary buttons: "Send via WhatsApp" (opens `wa.me/<phone>?text=…`) and "Send as email" (drops into `/broker/inbox` composer prefilled).

### Backend (Lovable AI)

- New edge function `broker-ai-assistant` (verify_jwt true). Inputs: `leadId`, `brokerId`, `messages` (chat history), optional `mode` ("score" | "recommend" | "draft" | "freeform").
- Server fetches the lead (`crm_leads`), broker context, recent assigned projects (`projects` filtered by interest note keywords), and prior chat from new `broker_ai_chats` table.
- Calls Lovable AI Gateway `openai/gpt-5.5` (state-of-the-art for sales reasoning) with system prompt: *"You are the broker's Head of Sales — your job is to shorten time-to-close. Always reply with: (1) a one-line read on the lead, (2) match score 0–100 with reasoning, (3) recommended properties from the JBJ inventory I provide (never invent), (4) the next step, (5) a ready-to-send message addressed to the lead by name."*
- Streamed back to the client; structured fields (score, matches, next_step, draft_message) returned via tool-calling so the UI can render the green ring, match cards, and copy block separately from the conversational reply.
- All chat persisted to `broker_ai_chats` with `lead_id`, `broker_id`, `role`, `content`, `structured` jsonb.

### Owner mode

If the signed-in user is the owner, they see every broker's lead list (not just their own assignments) and a broker switcher in the top bar. Chat is still scoped per-lead.

## Database changes

- New table `broker_ai_chats` (broker_id, lead_id, role text, content text, structured jsonb, created_at). RLS: broker sees own rows, owner sees all. Grants for `authenticated` and `service_role`.
- No changes to `crm_leads`, `projects`, `broker_daily_stats`.

## Files

- Rewrite `src/pages/AIBrokerWorkspace.tsx` into the 3-pane layout above.
- New components in `src/components/ai-broker/`: `AssistantLeadList.tsx`, `AssistantChat.tsx`, `AssistantInsights.tsx`, `ReadyMessageCard.tsx`, `LeadFiltersPopover.tsx`, `WeeklyStats.tsx`.
- Champagne theme throughout — kill the obsidian `bg-[#1A1A1A]` page background (current page is white text on white in places, which is what caused some of the issues).
- New edge function `supabase/functions/broker-ai-assistant/index.ts`.

## Out of scope (won't touch this turn)

- Reassigning leads to brokers (uses existing assignments).
- Voice / calls integration.
- Automatic outbound sending — broker still copies/sends the message themselves, per your instruction.

If you approve I'll: run the migration → wait for your approval → write the edge function + the new components + the page rewrite, then visually QA.