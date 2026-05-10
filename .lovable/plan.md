## Goal

Bring the Relationship Hub back to the rich, feature-complete version we previously had (with Test Send, Outreach Pack, bulk send, exports, GmailSenderStatusBanner) — then layer on top of it the new requests: a universal AI email composer, more fields everywhere, four explicit sub-sections with champagne styling, inventory + database upload, and a Secondary Market Hub.

## What's wrong today

- The sidebar **Relationship Hub** shortcut was re-pointed yesterday to `/owner/relationships`, which is a **different, much thinner page** (only 206 lines, no test send, no outreach pack, no exports). The original rich page is `src/pages/CRMRelationships.tsx` (3,150 lines) and is rendered inside `UnifiedCRM` at `/owner/crm?section=relationships`. We have to send the shortcut back there.

## Plan

### 1. Re-wire the sidebar to the real Relationship Hub
- `OwnerSidebarNav.tsx` and `DepartmentShortcuts.tsx`: change Relationship Hub `path` back to `/owner/crm?section=relationships`.
- `UnifiedCRM` already renders `<CRMRelationships />` as the fallback for that section — so the rich page (with all its banners, exports, test send, outreach pack) shows up again.

### 2. New top section — Send Branded Email composer
A single card above the tabs, available regardless of which sub-tab is open.

Fields and behavior:
- **Recipient email** (typeahead pulling from agencies / brokers / developers / reps + free-text).
- **Subject** (editable).
- **Description / AI brief** + **Generate with AI** button — calls a new edge function `compose-branded-email` (Lovable AI Gateway, `google/gemini-2.5-flash`) that returns `{ subject, body_html }`.
- **Body** (rich editor, always editable after AI fills it).
- **Save as template** checkbox + name → writes to a new `branded_email_templates` table.
- **Load template** dropdown (lists owner's saved templates; "+ New" resets).
- **Send test to me** → sends to the signed-in owner using the **exact same locked-payload pipeline** as the production send.
- **Send** → sends to recipient.

Consistency guarantee:
- We render once into `outreach_locked_payloads` (already standardised, per the Locked-Send Outreach memory) and reuse that payload for both test and live. Edge function: `send-branded-email` — it accepts a `lock_id` and a `target = "test" | "live"`, never re-renders the body, and the From / Subject / HTML are byte-for-byte identical.

### 3. Four sibling tabs with champagne dividers

In `CRMRelationships.tsx`, replace the current 2-tab strip with 4 tabs, each separated by a thin gold hairline `|` and a hover state, active = champagne `#EFE6D6` + 1px gold ring + ink text:

```
Developers │ Developer Reps │ Brokerage Agencies │ Brokers
```

Developers + Brokerage Agencies use the existing rich tab components (`DeveloperRegistryTab`, `BrokeragesTab`). Developer Reps and Brokers get their own full tabs (today they're nested under Brokerages or shown only via UnifiedCRM sub-routes).

### 4. Expanded fields — all four entity types

Add migration to extend `crm_developer_registry`, `crm_brokerages`, `crm_developer_sales_reps`, and `crm_individual_brokers` with the shared fields the user listed (skip when already present):

Shared:
- `country`, `hq_emirate`, `website`, `linkedin_url`, `instagram_url`, `address`, `google_maps_url`
- `phone`, `email`, `admin_name`, `admin_phone`
- `broker_count`, `google_reviews_url`, `google_reviews_score`, `google_reviews_count`
- `inquiry_count`, `closed_deals_count`, `closed_deals_broker_names` (text[])
- `registration_status` (enum already exists for devs — extend brokerages with `not_registered/inquired/registered/active/blocked`)
- `agency_status` (enum: `inquiring | closing_deals | active_partner | dormant | blacklisted`)
- `inventory_file_url`, `database_file_url` (storage paths in a new `relationship-hub` bucket)
- `notes`

People (reps + brokers + contact persons):
- `nationality`, `date_of_birth`, `joined_at`, `languages` (text[]), `specialty` (text[] — leasing/sales/off-plan/secondary), `whatsapp_e164`

Contact persons child table `crm_relationship_contacts` (FK to either developer or brokerage):
- `entity_type` (`developer | brokerage`), `entity_id`
- `role` (`sales_director | sales_manager | channel_partner | admin | other`)
- name, email, phone, languages[], nationality, dob, joined_at, linkedin_url, notes

Developers-only: `channel_department_name`, `channel_department_phone`, `channel_department_email`.

### 5. Inventory upload + Secondary Market Hub

- New storage bucket `relationship-hub` with owner-only RLS.
- "Upload inventory" button on each agency / broker detail drawer (single CSV/XLSX/PDF).
- New route `/owner/crm/relationships/secondary-market` rendering `SecondaryMarketHub.tsx`: grid of partner listings pulled from uploaded inventories plus any `properties` rows tagged `source=partner_agency`.

### 6. Exports per tab

Re-expose the export menu (already exists in `exportBrokerages.ts` / `exportDevelopers.ts`) on all four tabs, plus add `exportBrokers.ts` and `exportSalesReps.ts` (CSV / XLSX / PDF). Place a single "Export" button per tab header.

### 7. Wire-up

- All entity name cells link into `PersonHubDrawer` / `CompanyHubDrawer` (already exists — extend to the four entity types).
- The "Send Branded Email" composer accepts pre-filled recipient when clicked from any row's quick action.
- `GmailSenderStatusBanner` + `BreakfastCalendarStatusBanner` stay where they are.

## Technical notes

- **New tables**: `branded_email_templates`, `crm_relationship_contacts`. RLS: owner-only (`has_role(auth.uid(),'owner')`).
- **New edge functions**: `compose-branded-email` (AI draft), `send-branded-email` (locked payload sender, reuses `outreach_locked_payloads`).
- **New storage bucket**: `relationship-hub` (private, signed URLs).
- **Field migration**: additive only, defaults safe, no drops.
- **No removals**: every existing feature in `CRMRelationships.tsx` stays.
- **No data fabrication**: all expanded fields default null until the owner fills them in.

## Out of scope (next pass)

- AI auto-extraction of contact details from LinkedIn / web (separate ticket).
- Per-broker performance scoring (separate ticket).
- Email scheduling / drip sequences.

Approve and I'll implement.
