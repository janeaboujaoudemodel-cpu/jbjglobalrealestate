
# Relational CRM Intersection & Network Plan

Builds on the existing unified CRM (`crm_brokerages`, `crm_developer_registry`, `crm_brokerage_agents`, `developer_representatives`, `crm_leads`, `vw_crm_contacts`, `upsert_contact_with_company` RPC). **Nothing is rebuilt** — we add the intersection layer on top.

## 1. Schema additions (single non-breaking migration)

Add to **all four contact-bearing tables** (`crm_brokers`, `crm_brokerage_agents`, `developer_representatives`, `crm_leads`):

| Column | Purpose |
|---|---|
| `department text` | Channel Relations, Sales, Marketing, Admin, Owner, Operations, HR, Events, Partnerships, Management |
| `seniority text` | Owner, Director, Head, Manager, Senior, Mid, Junior |
| `position_type text` | full_time, partner, freelance, agent |
| `role_title text` | Free text e.g. "Head of Channel Relations" |
| `languages text[]` | Multi-select; GIN index |
| `nationality text` | ISO country |
| `country text`, `city text`, `region text` | Location |
| `is_global_broker boolean` | Filter flag |

New enum: `app_department` (channel_relations, sales, marketing, admin, owner, operations, hr, events, partnerships, management). Stored as text + CHECK for flexibility.

**Refresh `vw_crm_contacts`** to expose: `department`, `seniority`, `role_title`, `languages`, `nationality`, `country`, `city`, `region`, `is_global_broker`, plus the existing `kind`, `company_id`, `company_kind`, `company_name`, `source`.

Indexes: `(department)`, `(nationality)`, `(country)`, `(city)`, GIN on `languages`, GIN on `tags`.

## 2. Section views (independent but linked)

A single page `CRMNetwork.tsx` with left-rail tabs that filter `vw_crm_contacts` by `kind`:

```text
Clients · Investors · Individual Brokers · Brokerage Agencies · Developers
Developer Representatives · Channel Partners · Sales Managers · Directors
Admins · Owners
```

Each tab = same table component, pre-filtered. Reuses `UnifiedContactsPanel` plumbing. Every row → opens the relational drawer (§3).

Filter chips on every tab: **Department · Seniority · Language · Nationality · Country · City · Company · Source · Event · Campaign**. All filters stack and serialise to URL.

## 3. Company hub (Brokerage / Developer detail)

Single component `CompanyHub.tsx` rendered for both brokerage and developer:

**Header**: company card (logo, country, website, license, tags, source history).

**Org tabs** — auto-grouped from contacts where `company_id = X`:
- Brokerage: Owners · Admins · Sales Directors · Sales Managers · Brokers · Other
- Developer: Channel Relations *(promoted, default tab)* · Sales Team · Directors · Head of Sales · Marketing · Events · Other

**Relational tabs** (reuse existing data sources):
Linked Agencies/Developers · Campaigns · Events · Follow-ups · Business Cards · Notes · Emails Sent · Communication History · Source/Import History.

## 4. Person detail drawer

Opens from any list. Shows: company link, role/department/seniority, languages, nationality, country/city, current + previous companies (`broker_company_history` / new `developer_rep_company_history`), campaign history, notes, uploaded cards, full relationship timeline (`crm_activities` + `crm_outreach_touchpoints`).

## 5. Smart segmentation engine

New `SegmentBuilder` component → produces a JSON filter saved to `crm_segments` (new lightweight table: `id, name, filter jsonb, created_by`). Filter shape:

```json
{ "kind":["broker"], "languages":["ar"], "city":"Dubai", "department":"admin" }
```

Used by:
- list views (apply as filter)
- export (§6)
- campaigns (§7)

Pre-seeded segments: "Arabic-speaking Dubai brokers", "Russian investors", "Developer channel managers", "Agency owners", "Sales directors at developers".

## 6. Unified export

Extend existing `crm-export` edge function to accept `{ segment_id }` OR inline filter, plus `format: csv | xlsx | pdf`. Reuses `vw_crm_contacts`. PDF via existing `jspdf-autotable` pattern (`exportLeads.ts`). One **Export** button on every list and every company hub → opens modal with format + scope (current view / segment / whole company / single event / single campaign).

## 7. Resend campaigns + smart targeting

Reuses existing `campaigns`, `crm_email_campaigns`, `crm_campaign_recipients`, `useLockedSend`, `quotaGuardedFetch`, locked-send standard, and single-agency rule.

New flow `CampaignComposer.tsx`:
1. Pick **Segment** (from §5) → preview recipient count from `vw_crm_contacts`.
2. Pick template (existing campaign templates).
3. Subject + body (locked-send: editable subject, byte-for-byte lock).
4. Schedule or send.

Recipient resolver edge function `crm-resolve-segment` materialises the segment to `crm_campaign_recipients` at send time. Honors:
- Resend quota standard (100/day, 2900/30d)
- Single-agency email rule (validator blocks cross-brokerage merges)
- Suppression list

## 8. Backfill + intelligent extraction

One-shot migration script populates new fields where derivable:
- `department` from existing `role_title` keyword match (channel/sales/marketing/admin/owner/director/manager/head)
- `seniority` from same heuristic (Owner > Director > Head > Manager > Senior > Mid > Junior)
- `languages` defaults to `['en','ar']` for UAE-based, override-able
- `nationality` / `country` from existing brokerage/developer country if contact has none

Scanner (`crm-save-scanned-card`) extended: AI extraction prompt asks for department, seniority, languages, nationality, country, city in addition to current fields.

## 9. Acceptance checklist

- Clicking **Individual Brokers** shows only brokers; same for every other section.
- Opening **FAM Properties** shows owners, admins, directors, managers, brokers, plus campaigns/events/follow-ups/cards/notes/emails.
- Opening **John Smith** shows agency, position, department, role, languages, nationality, country, campaign history, notes, cards, timeline.
- Opening any **developer** shows Channel Relations as a promoted tab with its own people group.
- Filter "Arabic-speaking brokers in Dubai" works in list view, export, and as a campaign segment.
- Export works at every scope (current view, company, event, segment, campaign) in CSV / XLSX / PDF.
- Resend campaign sent to a segment respects quota + single-agency rule + suppression list.

## Technical details (engineers)

- Single migration: column adds + CHECKs + indexes + view refresh + new `crm_segments` + new `developer_rep_company_history`.
- View `vw_crm_contacts` stays `SECURITY INVOKER`; underlying RLS unchanged.
- New RPC `crm_segment_resolve(filter jsonb) returns setof vw_crm_contacts` — single source of truth used by list, export, campaign.
- Edge functions:
  - `crm-export` — extend payload with `{ segment_id | filter, format }`.
  - `crm-resolve-segment` — new; called by campaign send to materialise recipients.
  - `crm-save-scanned-card` — extend AI prompt + insert payload with new fields.
- UI: new `CompanyHub.tsx`, `SegmentBuilder.tsx`, `CampaignComposer.tsx`, `CRMNetwork.tsx`; reuse `UnifiedContactsPanel`, `ExportMenu`, `useLockedSend`.
- Champagne-gold tokens, IconTile, locked-send, quota, no-removal policy all preserved.
- No legacy table is dropped in this scope (continues prior backfill/deprecation track).
