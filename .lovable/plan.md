# Plan — CRM speed, ElevenLabs hub, unify Forms & Agreements, Integrations fix

## 1. CRM is slow — fix Leads / Developers / Brokers loading

**Root cause** (confirmed in `src/components/crm/CRMLeadsTableV2.tsx` + DB):
- `supabase.from("crm_leads").select("*, crm_lead_sources(...)")` with **no `.limit()`** and no pagination. Developers tab pulls **633k rows** before the table can render.
- 4 sequential round-trips per render: leads → state → assignments → assignee profiles. Re-fires on every filter toggle (`JSON.stringify(statusFilters)` in deps).
- `select *` pulls every wide column (encrypted PII, JSONB, large text).
- No realtime invalidation — silent re-fetches make it feel stuck on "Loading leads…".
- Developer & Broker registries (`BrokersRegistry.tsx`, developer page) do the same unbounded pull.

**Fix:**
1. **Server-side pagination + projection** on `crm_leads`, brokers, developers:
   - Select only columns the table renders (id, name, phone_e164, email_lower, source, status fields, created_at, vip, flagged, contact_type, owner_*).
   - `.range(0, 49)` default page size 50, with "Load more" / page nav.
   - Cap initial render to 50 rows; counts come from a separate `select count` query.
2. **Single batched fetch** via a Postgres RPC `crm_leads_table_page(p_user_id, p_filter, p_statuses[], p_source, p_limit, p_offset)` returning leads + state + assignment in one round-trip (LATERAL joins).
3. **React Query** wrapper with `staleTime: 30s`, `keepPreviousData: true`, and stable key — eliminates the flicker.
4. **Skeleton rows** instead of full-page "Loading leads…" overlay so the table feels instant.
5. **Indexes** verified to exist already; add one composite `(deleted_at, owner_user_id, created_at DESC)` if EXPLAIN shows a sort step.
6. Apply same projection+pagination treatment to Developers tab and Brokers tab inside Unified CRM.

## 2. Restore ElevenLabs voice agent on the homepage + dedicated owner control panel

**Restore homepage widget**
- `src/components/VoiceConciergeWidget.tsx` already exists and wires the `useConversation` hook + `elevenlabs-conversation-token` edge function. It's just no longer mounted on the home page.
- Re-mount `<VoiceConciergeWidget />` in `src/pages/Index.tsx` (floating bottom-right, respects existing `useToolVisibility` + `PopupCoordinatorContext`).
- Verify `ELEVENLABS_API_KEY` secret + the token edge function are still deployed; redeploy if missing.

**New owner control panel** — `/owner/voice-agent` (route added to `OwnerRoutes.tsx`, sidebar entry under Core)
Sections, all reading from the ElevenLabs API via a new `elevenlabs-admin` edge function (server-side, uses `ELEVENLABS_API_KEY`):
- **Agent config** — system prompt editor, first message, language, voice picker, model, temperature, knowledge base attachments. `GET/PATCH /v1/convai/agents/{agentId}`.
- **Call history** — paginated list of conversations with transcript drawer, duration, audio playback, evaluation result. `GET /v1/convai/conversations`.
- **Live metrics** — calls today / 7d / 30d, success rate, avg duration, credits used.
- **Client tools registry** — list configured client tools (read-only mirror; ElevenLabs requires UI configuration there).
- **Phone numbers / agents** — list connected numbers if any (`GET /v1/convai/phone-numbers`).
- Champagne-gold styling, IconTile primitives, follows existing owner-dashboard standards.

DB: add `elevenlabs_agent_settings` (singleton, owner-writable) for the editable prompt + voice ID mirror so we have an auditable local copy.

## 3. Unify "E-Signature" under "Forms & Agreements"

Single canonical surface: **Forms & Agreements** (`/owner/documents-forms` → kept). E-signature becomes an internal tab/section, not a separate tool.

- **Rename everywhere** "E-Signature" → "Forms & Agreements":
  - `src/components/header/MegaMenuToolkit.tsx` line 104 (`href: '/e-signature'`) → label "Forms & Agreements", href `/owner/documents-forms?tab=sign`.
  - Owner sidebar nav entry.
  - `src/components/owner-dashboard/OwnerTasksPopupAlert.tsx` route allowlist.
- **Wire signing workflow inside Forms & Agreements**:
  - Add tabs in `DocumentsFormsHub.tsx`: `Templates · Drafts · Sign & Send · Envelopes · Audit`.
  - "Sign & Send" mounts the existing `CreateEnvelope` + `EnvelopeDetail` flow.
  - Keep `/e-signature/*` URLs working via redirect to `/owner/documents-forms?tab=sign&envelope=...` (no broken links / no email link breakage).
- Update global search index + breadcrumbs + i18n strings.

## 4. Integrations page — fix wiring, add gold borders, equalize card heights

`src/pages/owner/OwnerIntegrationsPage.tsx` currently hard-codes every integration as `status: 'draft'` from a local `useState` — that's why nothing reflects real state.

**Fix:**
1. **Live status** — replace the hard-coded array with a query against the actual connection sources of truth:
   - Gmail / Outlook → `user_email_connections` + Resend domain status.
   - WhatsApp → `whatsapp_channel_config`.
   - Instagram / Facebook → `meta_channel_config`.
   - Hostinger → SMTP creds presence in secrets manifest.
   - ElevenLabs (new card) → `ELEVENLABS_API_KEY` presence + agent health.
   - Resend, Twilio, Slack, Telegram — same pattern.
2. **Real-time refresh** via Supabase channel on those tables so toggling a connection elsewhere updates the cards instantly.
3. **Card layout**:
   - CSS grid `grid-cols-1 md:grid-cols-2 xl:grid-cols-3` with `auto-rows-fr` so every card is the same height.
   - Each card: `flex flex-col h-full`, gold 1px hairline border `border border-[#B89555]/40 rounded-xl`, champagne surface `bg-[#F7F2EA]`, footer pinned via `mt-auto`.
   - Status badge top-right, action button (`Connect` / `Configure` / `Disconnect`) pinned bottom.
4. **Wire actions** — `Connect` opens the existing flow for that channel (OAuth for Gmail, secret modal for SMTP, etc.); no more dead buttons.
5. Add cross-app invalidation: any connection change broadcasts a `connections-updated` event; CRM Email Center, Communication Hub, Marketing Hub all listen and refresh.

## Technical details

**Files touched**
- `src/components/crm/CRMLeadsTableV2.tsx`, `src/pages/owner/crm/UnifiedCRM.tsx`, `BrokersRegistry.tsx`, developers tab — projection + pagination + RPC.
- New SQL migration: `crm_leads_table_page` RPC, `elevenlabs_agent_settings` table + RLS (owner-only).
- `src/pages/Index.tsx` — mount `VoiceConciergeWidget`.
- New: `src/pages/owner/VoiceAgentPage.tsx`, route in `src/routes/OwnerRoutes.tsx`, sidebar entry in `OwnerSidebarNav.tsx`.
- New edge function: `supabase/functions/elevenlabs-admin/index.ts` (uses `requireOwnerAuth` + `ELEVENLABS_API_KEY`).
- `src/pages/owner/DocumentsFormsHub.tsx` — tabs incl. e-sign workflow.
- `src/components/header/MegaMenuToolkit.tsx`, `OwnerSidebarNav.tsx`, `OwnerTasksPopupAlert.tsx`, `src/routes/StandaloneRoutes.tsx` — rename + redirects.
- `src/pages/owner/OwnerIntegrationsPage.tsx` — full rewrite (live data + grid layout + gold borders).

**Out of scope (queued)**
- AI-prefilled Leasing/Selling agreement generator (still queued from previous turn).
- Sell/Rent intake email templates (still queued).
- Relationship Hub cleanup (still queued).

Approve to ship in this order: (1) CRM perf → (2) Integrations wiring + layout → (3) Forms & Agreements unification → (4) Homepage voice widget + owner ElevenLabs hub.
