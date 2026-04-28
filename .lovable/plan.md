## Relationships Hub v3 — Phase 2: Email Sync, Auto-Reply & Bulk Outreach

Building on Phase 1 (CRM access fix, inline status dropdowns, status history table, email log table, owner settings with Drive link), this phase wires the live email automation.

### 1. Gmail Connector Setup
- Link the **Gmail connector** to the project (uses owner's `infoo.jane@gmail.com` / `janeaboujaoudenails@gmail.com` mailbox via OAuth gateway).
- Required scopes: `gmail.readonly`, `gmail.send`, `gmail.modify`.
- All API calls go through `https://connector-gateway.lovable.dev/google_mail/gmail/v1`.

### 2. Auto-Reply Edge Function (`crm-developer-auto-reply`)
- Triggered when a developer sends a registration request to the inbox.
- Sends a branded reply containing:
  - JBJ Global Documents folder: `https://drive.google.com/drive/folders/1EsWVmAPv6ljBzWbWNAvv07EQrHwi5drS?usp=sharing`
  - Trade License, RERA, Passport copies, company profile.
- Logs the outbound message in `crm_relationship_email_log` and updates `crm_developer_registry.status → 'documents_sent'`.

### 3. Inbound Email Sync Cron (`crm-email-sync`)
- Runs every 15 minutes via `pg_cron`.
- Pulls unread messages via Gmail API (`q=is:unread newer_than:1d`).
- Uses Lovable AI (`google/gemini-2.5-flash`) to classify each reply:
  - "Already registered" → status `registered`
  - "Pending review" → status `pending`
  - "Rejected/Not accepting" → status `rejected`
  - "Need more docs" → status `documents_requested`
- Updates the matching brokerage/developer/client by email match, logs the change in `crm_relationship_status_history`, and marks the Gmail thread as read.

### 4. Bulk Outreach UI (`CRMRelationships.tsx`)
- Add **"Bulk Send Registration"** button on Developers tab.
- Pre-fills email body with Drive link + signature.
- Sends to ALL UAE developers in `crm_developer_registry` (Emaar, DAMAC, Sobha, Ellington, Meraas, Nakheel, Aldar, Arada, Dubai Properties, Select Group, Binghatti, Azizi, Danube, Tiger, MAG, Deyaar, Union Properties, RAK Properties, Eagle Hills, Bloom, Imkan, etc. — across Dubai, Abu Dhabi, Sharjah, Ajman, RAK, UAQ, Fujairah).
- Honors the **Reverse Primary ↔ CC** toggle from owner settings.
- Shows live progress bar and per-recipient status.

### 5. UAE Developer Seed Migration
- Insert ~60 UAE developers across all 7 emirates into `crm_developer_registry` with pre-filled emails (sales@, info@, brokers@), location, and `status='not_started'`.
- Skip duplicates via `ON CONFLICT (name) DO NOTHING`.

### 6. UI Polish (CRM Relationships page)
- Fix white-on-white text on hovered cards (force `text-foreground` on hover states).
- Stretch hub edge-to-edge (remove side gutters; match cream `--background`).
- Space "Back to CRM" and "Relationship Hub" buttons (`gap-4` instead of `gap-1`).
- Make all status pills full-color with proper contrast (emerald/amber/red/blue mapping).

### 7. Calendar Sync
- Auto-create entries in `crm_calendar_events` when a `next_followup_at` or document expiry date is set.

### Technical Components
**New edge functions:**
- `supabase/functions/crm-developer-auto-reply/index.ts`
- `supabase/functions/crm-email-sync/index.ts`
- `supabase/functions/crm-bulk-send-registration/index.ts`

**New migrations:**
- Seed UAE developers (~60 rows).
- Schedule `crm-email-sync` cron every 15 min.
- Add `crm_developer_registry.documents_sent_at`, `auto_reply_enabled` columns.

**Files edited:**
- `src/pages/CRMRelationships.tsx` (UI fixes + Bulk Send modal)
- `src/hooks/useCRMRelationships.ts` (bulk send hook)
- `src/components/crm/BulkSendModal.tsx` (new)

### Approval needed
Reply **yes** to proceed. I'll start by linking the Gmail connector (you'll get a one-click OAuth prompt), then deploy the auto-reply + sync functions and seed the UAE developer roster.
