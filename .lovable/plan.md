## Why the shortcut shows 404

The "Remind" button on a brokerage does not open a page — it silently writes 4 records (CRM reminder, Owner task, calendar event, agency note) into `crm_brokerage_actions` and other tables. There is no `/owner/crm/brokerage-actions` route, which is why the shortcut you pinned returns 404.

I will fix this by **building the page that displays those activity records** and routing your shortcut to it.

---

## 1. New page — Agency Activity Log

- Route: `/owner/crm/relationships/activity` (alias `/owner/crm/brokerage-actions` so any existing shortcut works).
- Linked from:
  - Quick Actions Grid on Owner Command Center (tile "Agency Activity").
  - A new "Activity" button on each brokerage card.
  - The toast that fires after Remind ("View activity →").
- Content:
  - Filters: agency, action type (note / calendar_event / reminder / outreach_sent), date range, created_by.
  - Timeline list pulled from `crm_brokerage_actions` joined with `crm_brokerages.company_name`.
  - Inline edit / delete / mark-done.
  - Export (CSV / Excel / PDF) of the filtered log.

## 2. Unified Export dropdown (replaces 3 buttons)

Replace `Export PDF | Export Excel | Export CSV` with a single **Export** button (`Download` icon) that opens a `DropdownMenu`:

```
Export ▾
├─ Export as PDF
├─ Export as Excel (.xlsx)
└─ Export as CSV
```

Same dropdown reused on the Clients tab, Developer Outreach tab, and the new Activity Log page so the pattern is consistent.

## 3. Add / Edit Brokerage — richer form

Extend the existing Add Brokerage dialog (`crm_brokerages` row) with three new sections:

**a. Admin / Owner contact** (stored in a new `admin_contact` jsonb column)
- Name, role (default "Admin / Managing Director"), phone, WhatsApp, email (optional).

**b. Brokers under this agency** (stored in `crm_brokerage_agents` — new table)
- Repeatable rows: name, phone/WhatsApp, email (optional), specialty, photo, status (active / inactive / unknown).
- "Add broker" button + bulk paste (one per line).

**c. Bulk import from WhatsApp / contact screenshots (AI)**
- Upload zone accepts up to **300 images** (JPG/PNG/HEIC/PDF) per batch.
- Files go to a new private storage bucket `brokerage-contact-photos` (owner-only RLS).
- New edge function `extract-brokerage-contacts` (Lovable AI, `google/gemini-2.5-pro`, vision) reads each image and returns `{ name|null, phone, whatsapp|null, role|null, source_image }`. Missing names → "Unknown".
- Results appear in a review table (checkbox per row, edit inline) before being saved into `crm_brokerage_agents` for the selected brokerage.
- After save, an "AI outreach draft" is generated automatically:
  - A vertical Excel-ready list of the extracted contacts (Name, Phone, WhatsApp, Role) downloadable as `.xlsx`.
  - A ready-to-send WhatsApp/email message template signed *"Jane Bouchra Jajeh — Founder & CEO, JBJ Global Real Estate"* asking each broker to confirm their name and whether they still work with the agency. Copy-button included.

## 4. Fix "Send Outreach" UX

Today the bulk outreach button is confusing because:
- Directory (licensed) brokerages are not selectable (no checkbox), so clicking Send Outreach with no selection just shows an error.
- The button label doesn't explain what it does.

Fixes:
- Add a checkbox on **every** brokerage card. For directory rows that have no email yet, the checkbox is enabled but selecting one opens the editor first to capture the admin email, then queues it.
- Rename the button to **Email Selected Agencies** with a tooltip: *"Sends your branded onboarding / follow-up email to each ticked agency. A test copy is sent to you first."*
- Show a sticky bottom bar "N selected · Email selected · Clear" while the selection is non-empty so it's obvious what will happen.
- Add a "Select all visible" master checkbox in the toolbar (already exists, but will move next to the new Export dropdown for clarity).

## 5. Shortcut cleanup

- Re-point the broken `/owner/crm/brokerage-actions` shortcut to the new Activity Log page.
- Add a new shortcut suggestion "Agency Activity Log" in the shortcuts catalog so future pins use the canonical path.

---

## Technical notes

- **DB migration**:
  - `alter table crm_brokerages add column admin_contact jsonb default '{}'::jsonb;`
  - `create table crm_brokerage_agents ( id uuid pk, brokerage_id uuid references crm_brokerages on delete cascade, owner_id uuid not null, name text, phone text, whatsapp text, email text, role text, status text default 'active', photo_path text, source text default 'manual', metadata jsonb default '{}', created_at timestamptz default now(), updated_at timestamptz default now() );` — owner-only RLS.
  - Storage bucket `brokerage-contact-photos` (private) + RLS for owner.
- **Edge function** `extract-brokerage-contacts`: validates JWT (`requireOwnerAuth`), accepts an array of storage paths, calls Lovable AI vision in parallel batches of 5, returns structured rows. Handles 429 / 402 surfaced to UI.
- **Files touched**:
  - New: `src/pages/owner/crm/AgencyActivityLog.tsx`, `src/components/crm/BrokerageAgentsEditor.tsx`, `src/components/crm/BrokerageContactPhotoImporter.tsx`, `src/components/crm/ExportMenu.tsx`, `supabase/functions/extract-brokerage-contacts/index.ts`, migration.
  - Edited: `src/routes/OwnerRoutes.tsx`, `src/pages/CRMRelationships.tsx`, `src/hooks/useCRMRelationships.ts`, `src/components/owner-dashboard/QuickActionsGrid.tsx`, `src/config/shortcutsConfig.ts`, `src/components/crm/BulkSendDialog.tsx`.
- Champagne/gold styling, IconTile primitive, no white-on-light, Inter only — per project standards.

Approve this and I will build it.