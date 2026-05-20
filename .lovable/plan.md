# Voice Agent Lead-Gate Flow

Gate the ElevenLabs Voice Concierge behind a required intake form. Visitors cannot start a call until they submit name, email, country-code phone, nationality, and interest. After submit, the agent connects automatically with a premium "Your concierge has joined" cue.

## User Flow

```text
[Click Voice Widget]
       ↓
[Intake Modal — required]
  Full Name
  Email
  Nationality (searchable country list)
  Phone (country-code selector + number)
  Interest: Investing | Partnering | Careers | Other
     ├─ Investing → Plan (Off-plan) | Secondary
     ├─ Partnering → free-text "Tell us about your proposal"
     ├─ Careers → role/area free-text
     └─ Other → free-text
       ↓
[Submit] → validate (zod) → save lead → mint ElevenLabs token
       ↓
[Connecting… spinner with luxury copy]
       ↓
[Agent joins] → toast + in-widget banner:
   "Your concierge has joined — premium line connected"
   + soft chime (existing SFX) + status pulse
       ↓
[Live call UI — mute / end]
```

Once a visitor has submitted in the current browser (or is signed in and has a lead on file), the form is skipped on future opens for 30 days. A small "Edit details" link lets them update it.

## Data Model

New table `voice_agent_leads` (RLS: insert open to anon + auth; select restricted to owner/admin via `has_role`):

| column | type |
|---|---|
| id | uuid pk |
| user_id | uuid null (set when logged in) |
| full_name | text |
| email | text |
| nationality | text |
| phone_country_code | text |
| phone_number | text |
| interest | enum: investing / partnering / careers / other |
| investment_type | enum: off_plan / secondary / null |
| details | text null (partnering/careers/other free-text) |
| consent_marketing | boolean |
| created_at | timestamptz |
| ip / user_agent | text (server-stamped) |

Lead is also pushed into the unified CRM (`crm_leads` via existing `register-mode-lead` style pattern) tagged `source = voice_concierge`, mapped to category by interest (investor / partner / talent).

## Components

- `src/components/voice-concierge/VoiceConciergeIntakeModal.tsx` — luxury champagne modal with the staged form (interest drives conditional sub-questions). Inputs follow the Institutional Form Standard (ink on champagne).
- `src/components/voice-concierge/CountryPhoneSelect.tsx` — country dial-code + flag selector (reuse country list already present in CRM if available).
- Update `src/components/VoiceConciergeWidget.tsx`:
  - Replace direct `startSession` path with `gate → token → start`.
  - Add "Agent joined" banner + sonner toast on `onConnect`.
  - Persist `voice_concierge_lead_id` in localStorage (30d) to skip re-asking.
  - Add "Edit details" affordance.

## Backend

- Migration: create `voice_agent_leads` + RLS + indexes; extend `crm_leads` insert via existing helper. No CHECK constraints with `now()`; use triggers if needed.
- New edge function `voice-concierge-register-lead` (verify_jwt=false, CORS, zod validation):
  1. Validate payload.
  2. Insert into `voice_agent_leads` (stamp IP/UA).
  3. Upsert into `crm_leads` (dedupe by email).
  4. Return `{ lead_id }`.
- Reuse existing `elevenlabs-conversation-token` for the token. Add a server-side guard: only mint token if the request includes a valid `lead_id` issued in the last 30 days (look up `voice_agent_leads`). This prevents bypass by calling the token endpoint directly.

## Premium "Agent Joined" Cue

- On `useConversation.onConnect`:
  - Sonner toast: "Your concierge has joined — premium line connected"
  - In-widget gold-hairline banner with pulsing dot for 4s
  - Play short existing SFX (or generate via `elevenlabs-sfx` once and cache)
- On `onDisconnect`: "Call ended — thank you" toast + log to `voice_call_logs`.

## End-to-End Test (manual + scripted)

1. Open preview as anon → click widget → modal appears, Start button hidden until valid.
2. Submit with: Jane Doe / infoo.jane@gmail.com / UAE / +971 50 123 4567 / Investing → Off-plan.
3. Verify `voice_agent_leads` row + `crm_leads` row (psql read).
4. Token edge function returns 200 with `lead_id`; returns 403 without it.
5. Widget transitions: Connecting → Connected with "Agent joined" banner + toast.
6. End call → `voice_call_logs` populated with duration.
7. Reopen widget within 30 days → form skipped, direct connect.
8. Repeat once per interest branch (Partnering / Careers / Other) to verify conditional fields.

Automated: `supabase--curl_edge_functions` smoke tests for `voice-concierge-register-lead` (valid, missing email, invalid phone) and for token guard (with/without lead_id).

## Files To Add / Edit

- add: `supabase/migrations/<ts>_voice_agent_leads.sql`
- add: `supabase/functions/voice-concierge-register-lead/index.ts`
- edit: `supabase/functions/elevenlabs-conversation-token/index.ts` (lead_id guard)
- add: `src/components/voice-concierge/VoiceConciergeIntakeModal.tsx`
- add: `src/components/voice-concierge/CountryPhoneSelect.tsx`
- edit: `src/components/VoiceConciergeWidget.tsx`

## Out of Scope

- No changes to the ElevenLabs agent prompt or voice.
- No changes to other voice tools (Podcast, SFX, Voice Studio).
- No removal of existing features (per No-Removal policy).
