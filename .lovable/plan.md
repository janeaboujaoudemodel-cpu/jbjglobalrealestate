# CRM Relationship Hubs — Brokerages · Clients · Developer Registrations

Add three new owner-only sections inside the CRM (`/crm`) for managing the relationships you maintain as a developer/operator: brokerage partners, end clients, and developer registrations. Each hub has full CRUD, status tracking, contact persons, notes, AI recommendations, and calendar-linked alerts. The Developers section is pre-seeded with every major UAE developer so you can mark each one as Registered / Pending / Documents Required / Not Registered.

## What you'll get

### 1. Brokerages Hub (`/crm/brokerages`)
- Add brokerage company → fields: company name, license #, office location, website, primary contact person (name/role/email/phone/WhatsApp), secondary contact, status (Active partner · Negotiating · Closed deals · Dormant · Blacklisted), deal count, last interaction, notes timeline, documents, tags.
- Kanban + table views, status filters, search.
- AI panel per brokerage: "Reach out — no contact in 21 days", "Follow up on Project X proposal", suggested next action, draft message.
- Calendar reminders ("Call Maria at XYZ Realty on Friday") sync into existing CRM calendar.

### 2. Clients Hub (`/crm/clients`)
- Add client → individual or company, contact details, nationality, budget, interests (project/community/unit type), source, assigned broker, deal stage, lifetime value, notes, attachments.
- Same status pipeline + AI recommendations ("VIP — birthday next week", "Hasn't replied in 14 days, send WhatsApp").
- Linked to existing leads: option to convert a CRM lead → client.

### 3. Developer Registrations Hub (`/crm/developer-registry`)
- **Pre-seeded** with all major UAE developers (Emaar, DAMAC, Nakheel, Meraas, Sobha, Aldar, Dubai Properties, Select Group, Ellington, Danube, Azizi, Binghatti, MAG, Deyaar, Omniyat, Tiger, Samana, Object 1, Reportage, Imtiaz, Arada, Bloom, Eagle Hills, Iman, Mira, Beyond, Imkan, Wasl, Meydan, Dubai South, Diamondz, ORO24, Sankari, etc. — full UAE list ~60 developers).
- Each row shows registration status: **Registered · Pending Application · Documents Required · Under Review · Rejected · Not Started**.
- Fields per developer: my company contact at the developer (name/email/phone), registration date, expiry date, broker code/agency ID, commission tier, required documents checklist (Trade License, MOU, NOC, etc.), uploaded files, internal notes.
- Filter chips: "Show only Registered", "Pending Documents", "Expiring soon".
- AI alerts: "Trade license expires in 30 days", "Renew MOU with Emaar", "5 developers awaiting your reply".

## AI & automation (shared across all three hubs)

- **Smart reminders engine**: nightly edge function scans each record and creates calendar events + dashboard alerts for: stale relationships, expiring documents, missed follow-ups, birthdays/anniversaries.
- **Recommendation card** on every detail page powered by Lovable AI (`google/gemini-2.5-flash`) — no API key needed.
- **Auto-draft outreach** button: generates WhatsApp/Email message in your tone.
- Reminders surface in existing CRM Calendar, Notes, and the Smart Notifications bell.

## Test export safeguard

You asked it to "always save under test the export." Every section will have an **Export** button (CSV + branded PDF) and the generated file will be saved to `/mnt/documents/` so you can preview/download from the Files panel. PDFs use the existing institutional letterhead engine.

## Technical details

**New tables (with RLS = owner only):**
- `crm_brokerages` — company info + status + JSON contacts array
- `crm_brokerage_notes` — timeline notes
- `crm_clients` — client master record
- `crm_client_notes`
- `crm_developer_registry` — one row per UAE developer, status + my contact + docs checklist
- `crm_relationship_reminders` — unified reminders feeding the calendar
- All tables: `owner_id uuid`, `created_at`, `updated_at`, `ai_summary text`, `ai_next_action text`.

**Pre-seed migration:** seeds `crm_developer_registry` with ~60 UAE developers (sourced from the existing `uae_developers` table + an authoritative supplemental list), each starting at status = `not_started` and linked by name to your `developers` / `uae_developers` table where matches exist.

**New routes & files:**
- `src/pages/crm/CRMBrokerages.tsx`, `CRMBrokerageDetail.tsx`
- `src/pages/crm/CRMClients.tsx`, `CRMClientDetail.tsx`
- `src/pages/crm/CRMDeveloperRegistry.tsx`, `CRMDeveloperRegistryDetail.tsx`
- `src/components/crm/relationships/` — shared StatusBadge, ContactCard, AIRecommendationPanel, RemindersPanel, DocumentsChecklist, ExportButton.
- New tabs added to `src/pages/CRM.tsx` top nav: **Brokerages · Clients · Developer Registry** (alongside existing Leads/Pipeline/etc.).

**Edge functions:**
- `crm-relationship-ai` — generates recommendations + draft messages (Lovable AI gateway).
- `crm-relationship-reminders-cron` — nightly scan, creates calendar events + alerts.

**Reused:**
- Existing `CRMCalendar`, `Smart Notifications`, `generate-crm-report` (PDF), `ActivityTimeline`, monochrome design tokens, OwnerGuard auth.

**Security:** Owner-only via `requireOwnerAuth` + RLS policies using `has_role(auth.uid(), 'admin')`. All contact PII follows the existing CRM Data Protection standard (encrypted at rest, audit-logged).

## Out of scope (for this round)

- Two-way sync with developer portals (manual status updates only).
- Automated email/WhatsApp sending (we draft only — you click send).
- Payment/commission tracking (existing commission module remains separate).

Approve to build.