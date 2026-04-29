## Goal

Eliminate the duplicate "Clients" surface inside Relationships and consolidate **all lead + client records** into the existing `crm_leads` table and the existing **Leads Inbox** page, renamed **Leads & Clients**. No new module, no parallel data store.

## Current state (verified)

- `src/pages/CRMRelationships.tsx` has 3 tabs: Brokerages / **Clients** / Developer Registrations. The Clients tab uses `useClients()` → table `crm_clients`.
- `crm_clients` table contains **0 rows** (safe to retire — no data migration needed).
- `crm_leads` has **23 rows** and is the canonical leads store, already wired to:
  - `/crm` (CRM dashboard with `?action=new-lead`)
  - `/crm/leads` (Leads Inbox — `CRMLeadsInbox.tsx`)
  - `/crm/leads/:id` (`CRMLeadDetail.tsx`)
- Existing reusable components already cover most requested features: `CRMLeadsBulkBar`, `CRMLeadModal`, `LeadNotesActions`, `FollowUpScheduler`, `SmartReminders`, `AutomationRules`, `AILeadScoring`, `SmartEmailComposer`, `SmartWhatsAppComposer`, `BulkEmailModal`, `BulkWhatsAppModal`, `BulkAssignModal`, `VIPExportButton`, `ActivityTimeline`, `LeadAuditHistory`.

The work is therefore **schema extension + UI consolidation + a new AI Message Generator**, not a rebuild.

## Plan

### 1. Retire the Clients tab (no new section created)

- In `CRMRelationships.tsx`:
  - Remove the `<TabsTrigger value="clients">` and `<TabsContent value="clients">`.
  - Delete the `ClientsTab` component and its `useClients/useUpsertClient/useDeleteClient` imports from this page.
  - Update header copy from "Brokerages · Clients · Developer Registrations" → "Brokerages · Developer Registrations".
- Replace any in-app links to `/crm/relationships?tab=clients` with `/crm/leads`.
- Leave `useCRMRelationships.ts` hooks for clients in place (unused) for now to avoid breaking imports elsewhere; remove in a follow-up sweep once confirmed unreferenced.
- `crm_clients` table is **kept but deprecated** (0 rows, no destructive migration). Add a code-level comment that it is read-only / deprecated.

### 2. Rename the unified surface to "Leads & Clients"

- In `CRMLeadsInbox.tsx`: change page title `Leads Inbox` → **Leads & Clients**, subtitle "All leads, prospects, and clients in one workspace."
- In `GlobalHeader.tsx` and any sidebar / breadcrumb labels referencing "Leads" or "CRM › Leads", update label to **Leads & Clients** (route stays `/crm/leads` for stability).
- SEO title on `CRMLeadsInbox` updated accordingly.

### 3. Extend `crm_leads` to cover all required fields

Migration adds the missing columns (existing columns reused where possible — see mapping table in Technical section):

New columns on `crm_leads`:
- `whatsapp_e164 text`
- `country_of_residence text`
- `budget_min numeric`, `budget_max numeric`, `budget_currency text default 'AED'`
- `preferred_location text`
- `preferred_project text`
- `property_type text`
- `bedroom_requirement text`
- `buying_purpose text` (Investment / End Use / Holiday Home / Other)
- `lead_type text` (Buyer / Investor / Seller / Tenant / Landlord / Broker / Other) — separate from existing `contact_type`
- `priority text` (low/medium/high)
- `lead_score_band text` (hot/warm/cold) — derived from existing `ai_score`/`priority_score`
- `next_followup_at timestamptz`
- `internal_comments text`
- `documents jsonb default '[]'` (array of `{name,url,uploaded_at,uploaded_by}`)

Existing columns reused: `full_name`, `email_lower`, `phone_e164`, `preferred_language`, `nationality`, `source`, `assigned_to_user_id`, `pipeline_stage` (status), `tags`, `notes`, `last_contacted_at`, `ai_score`.

RLS: inherit existing `crm_leads` policies — no new policies needed.

### 4. Upgrade the lead detail / new-lead modal to the full schema

`CRMLeadModal.tsx` (the "Add Lead" form) gets organized sections:
1. **Contact** — Name, Lead Type, Phone, Email, WhatsApp, Preferred Language, Nationality, Country of Residence
2. **Requirements** — Budget (min/max + currency), Preferred Location, Preferred Project, Property Type, Bedroom Requirement, Buying Purpose
3. **Pipeline** — Lead Source, Assigned Team Member, Status, Priority, Lead Score (Hot/Warm/Cold), Last Contact Date, Next Follow-up Date, Tags
4. **Notes** — Notes (visible), Internal Comments (private), Documents/Attachments

`CRMLeadDetail.tsx` (the profile view) tabs reorganized into: **Overview · Notes · Calendar & Reminders · Automation · Communication · Message Generator · Documents · Audit**, reusing existing components:
- Notes → `LeadNotesActions` (already exists, persists notes timestamped + by-author)
- Calendar & Reminders → `FollowUpScheduler` + `SmartReminders` with reminder types: Follow-up / Call / Meeting / Payment / Document / Custom
- Automation → `AutomationRules` extended with the requested action set (see §5)
- Communication → unified timeline of emails (`SmartEmailComposer` send log), WhatsApp (`SmartWhatsAppComposer`), calls, meetings, notes, AI-generated messages
- Message Generator → new component (see §6)
- Documents → uses new `documents jsonb` column with Storage upload
- Audit → `LeadAuditHistory`

### 5. Per-lead automation actions

`AutomationRules` extended to support these actions, all callable from the lead profile and bulk bar:
- Send Email · Send WhatsApp · Send Follow-up · Generate Message · Schedule Reminder · Mark as Contacted · Change Status · Assign to Team Member · Duplicate Lead · Delete Lead · Export Lead · Bulk Update

Lead scoring rule engine (server-side edge function `recalc-lead-score`) deriving Hot/Warm/Cold from: budget present, days since last contact, response activity (activity log count), interest level (project/location filled), follow-up status, meeting booked flag, priority. Writes to `lead_score_band` + refreshes `ai_score`. Triggered on lead update and nightly cron.

### 6. AI Message Generator (new component)

`LeadMessageGenerator.tsx` inside the lead profile. Uses the existing Lovable AI gateway pattern via a new edge function `generate-lead-message`.

Inputs (UI):
- **Message Type**: First Contact / Follow-up / Project Introduction / Meeting Invitation / Site Visit Invitation / Payment Reminder / Document Request / Re-engagement / Custom
- **Channel**: WhatsApp / Email / SMS
- **Language**: English / Arabic / French / Spanish (pre-selects the lead's `preferred_language`)
- **Tone**: Professional / Friendly / Luxury / Direct / Formal
- Optional custom instruction text

The edge function builds a prompt seeded with: lead name, preferred language, project interest (`preferred_project`/`preferred_location`), status, recent notes, and lead type. Returns a ready-to-copy message. UI offers **Copy**, **Send via WhatsApp** (opens `wa.me/<phone>?text=`), and **Send via Email** (opens `SmartEmailComposer` prefilled).

Model: `google/gemini-3-flash-preview` (default per project standard). LOVABLE_API_KEY already provisioned.

### 7. Bulk operations on the inbox

`CRMLeadsBulkBar` extended (existing component already handles delete/assign/status). Add:
- Export selected (CSV/Excel/PDF)
- Duplicate selected
- Change priority
- Send bulk Email (`BulkEmailModal`)
- Send bulk WhatsApp (`BulkWhatsAppModal`)
- Generate follow-up messages (loops `generate-lead-message` per lead, returns a downloadable bundle)
- Add tags / Remove tags

### 8. Export

`exportLeads(scope, format)` utility supports:
- Scope: single / selected / all / current filtered query
- Format: **CSV** (existing `exportCSV`), **Excel** (xlsx via `xlsx` package), **PDF** (jsPDF using the institutional letterhead per the CRM PDF reporting standard)

Wired into:
- Inbox toolbar Export button (dropdown: CSV / Excel / PDF; respects active filters)
- Bulk bar (selected only)
- Lead profile (single lead)

### 9. UI/UX polish

- Inbox gains: Table view (default), Profile view (drawer on row click), Timeline view per lead — toggled in toolbar.
- Quick action icons per row: Call · WhatsApp · Email · Generate Message · Schedule Follow-up.
- Premium monochrome styling per project standard (Inter, white surface, black text, `--price-orange` for budget figures).
- Filters: status, lead type, source, assignee, priority, score band, date range, search.

### 10. Strict guarantees

- No new "Clients" or "Add New Client" route or component is created.
- `crm_clients` rows: none exist, so no records lost. Hooks left dormant; deletion deferred.
- Existing `/crm`, `/crm/leads`, `/crm/leads/:id` routes preserved.
- No existing CRM features removed — only consolidated and extended.

## Technical Section

### Field mapping (request → `crm_leads`)

```text
Lead Name              -> full_name
Lead Type              -> lead_type (NEW)        [contact_type kept for legacy auto-detect]
Phone Number           -> phone_e164
Email                  -> email_lower
WhatsApp Number        -> whatsapp_e164 (NEW)
Preferred Language     -> preferred_language
Nationality            -> nationality
Country of Residence   -> country_of_residence (NEW)
Budget                 -> budget_min / budget_max / budget_currency (NEW)
Preferred Location     -> preferred_location (NEW)
Preferred Project      -> preferred_project (NEW)
Property Type          -> property_type (NEW)
Bedroom Requirement    -> bedroom_requirement (NEW)
Buying Purpose         -> buying_purpose (NEW)
Lead Source            -> source / lead_source_type
Assigned Team Member   -> assigned_to_user_id
Lead Status            -> pipeline_stage
Lead Score             -> ai_score + lead_score_band (NEW: hot/warm/cold)
Priority               -> priority (NEW)
Last Contact Date      -> last_contacted_at
Next Follow-up Date    -> next_followup_at (NEW)
Notes                  -> notes
Internal Comments      -> internal_comments (NEW)
Documents/Attachments  -> documents jsonb (NEW) + Supabase Storage bucket "lead-documents"
Tags                   -> tags
```

### New / changed files

- Migration: add columns above to `crm_leads`; create storage bucket `lead-documents` with owner-scoped RLS.
- Edit: `src/pages/CRMRelationships.tsx` (remove Clients tab + ClientsTab component).
- Edit: `src/pages/CRMLeadsInbox.tsx` (rename, add view toggles, export dropdown, quick actions).
- Edit: `src/pages/CRMLeadDetail.tsx` (tabbed layout, integrate new sections).
- Edit: `src/components/crm/CRMLeadModal.tsx` (full field set, sectioned form).
- Edit: `src/components/crm/CRMLeadsBulkBar.tsx` (extra bulk actions).
- Edit: `src/components/crm/AutomationRules.tsx` (action set per spec).
- New: `src/components/crm/LeadMessageGenerator.tsx`.
- New: `src/components/crm/LeadDocuments.tsx`.
- New: `src/utils/exportLeads.ts` (CSV/XLSX/PDF unified).
- New edge function: `supabase/functions/generate-lead-message/index.ts` (Lovable AI gateway, JWT-validated).
- New edge function: `supabase/functions/recalc-lead-score/index.ts` + nightly cron.
- Edit: `src/components/GlobalHeader.tsx` (label → "Leads & Clients").

### Out of scope (deferred follow-ups)

- Physical drop of `crm_clients` table and its hooks — left intact for one release cycle to keep TS types stable; will be removed once no imports remain.
- Migrating any future `crm_clients` rows (currently zero) — not needed.
