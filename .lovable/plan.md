# CRM Overhaul Plan — Performance, Layout, Filters, Export

Scope: every section under `/owner/crm` (Brokerages, Brokers, Developers, Dev Sales Reps, Leads, Investors, Clients). Pure frontend + a few read-only RPC/index optimizations. No data deletions.

---

## 1. Performance (top priority — section switching is slow)

```text
Symptom: clicking a CRM subsection blocks 1–3 s; brokerage detail >2 s.
Causes (confirmed in code):
  - Each section refetches counts + full row payloads on mount (no shared cache key).
  - Brokerage detail joins 4 tables client-side, no .select() projection.
  - 32k crm_brokers with no covering index on (current_brokerage_id, status).
```

Fixes:
- Wrap CRM hub in a single `QueryClient` boundary with `staleTime: 60s`, `gcTime: 5min`.
- Prefetch sibling section counts on hub mount (one parallel `Promise.all`) so subheader chips are instant.
- Convert brokerage detail loader to a single `vw_brokerage_detail` view (logo, HQ, counts of brokers/leads/deals, socials) — read-only migration.
- Add btree index `(current_brokerage_id)` on `crm_brokers` and `(brokerage_id)` on `crm_leads`.
- Virtualize tables ≥200 rows with `@tanstack/react-virtual` (already installed).

## 2. Brokerage Agencies section

Detail drawer/page redesign:
- Single horizontal info bar (no vertical 1-letter-per-line wraps): Logo · Name · Country · Emirate · City · License · Phone · Email · Website · LinkedIn · Instagram · CEO · Founded.
- Order is fixed: **Country → Emirate → City** (currently reversed).
- Phone/license/address render with `whitespace-nowrap`; the bar itself is `overflow-x-auto` with snap dividers.
- Full office address is one clickable line → opens Google Maps.
- Logo slot uses `developerLogo.ts` style champagne-padded container; falls back to initials.

Registry table:
- Sticky left column (Logo+Name), all other columns horizontally scrollable, no wrapping.
- Premium dividers (`divide-x divide-[#B89555]/20`), zebra champagne rows.
- Filter bar above search: Country, Emirate (multi), City, License status, Size band, Has-CEO, Has-website, Date added.
- Emirate shortcut chips with live counts: `Dubai 8,214 · Abu Dhabi 1,902 · Sharjah 412 · Ajman 88 · RAK 41 · Fujairah 22 · UAQ 6`.
- Export button always visible (see §6).

Missing fields to surface (already in DB or `developer-enrich` payload — just unhidden in UI): CEO, founded year, employee count, RERA/ORN, head office, branches[], primary email, primary phone, WhatsApp, website, LinkedIn, Instagram, Facebook, registered deals count, broker count, last activity.

## 3. Developers section + Developer Sales Reps

Same horizontal-info-bar pattern. No more 1-letter-per-line.
- Equal card heights (CSS grid `auto-rows-fr`, fixed `min-h-[260px]`).
- Cards show: Logo · Name · HQ · CEO · Founded · #Projects · #Sales Managers · Registration status · Registered deals (mine).
- Clickable: website, email, phone, WhatsApp, LinkedIn, Instagram, Google profile, office (Maps).
- "Channel partner email" surfaced as its own contact pill.
- "Register a deal" CTA per developer card → opens deal-register modal pre-filled with developer_id.
- Dev Sales Reps table: same horizontal scroll + stickied name column; "Back to Developer" link on each row.

## 4. Leads section

Dropdowns & badges:
- "All stages" dropdown opens **downward**, full-width, with category headers (Positive/Neutral/Negative) and colored dot per status using `LeadStatusBadge` palette already defined.
- Replace current pill (blue circle + empty rectangle + faded dropdown) with a single solid `LeadStatusBadge` button — chevron inside the same pill, no double border.
- Status colors mapped exactly:
  - Hot → orange, Junk → red, Interested → green, Closed Won → green, No Response → dark red, Already Bought → blue, Lost → red, VIP → yellow.

Sources dropdown — add full set: Manual Entry, Database (DLD), Website Form, WhatsApp, Phone Call, Walk-in, Referral, Bayut, Property Finder, Dubizzle, Facebook, Instagram, Google Ads, LinkedIn, Email Campaign, Event, Partner, Other.

Owner dropdown — populate from `auth.users` via `crm_owners_view` (id, full_name, role).

Broker assignment field:
- New `BrokerCombobox` (mirrors `BrokerageCombobox`): typeahead against `crm_brokers`, debounced 200 ms.
- Free-text fallback: if no match, save string to `lead.broker_name_text` AND nothing to FK.
- Match found: write both `broker_name_text` (display) and `assigned_broker_id` (FK).
- Broker registry then shows lead count per broker via `count(crm_leads.assigned_broker_id)`.

Tags:
- Replace mutually-exclusive "VIP / Pool Non-broker" with two independent fields:
  - **Tier**: Standard | VIP (single-select, yellow when VIP).
  - **Pool**: Pool / Non-pool (separate column, not mixed with tier).
- VIP toggle writes `is_vip=true` → reflected immediately in subheader VIP chip count and VIP sub-section.

Subheader counts: every chip (Leads, Flagged, VIP, Mgmt, Relationships, Brokers, Agencies, Developers, Tasks) shows live count badge via a single `crm_section_counts` RPC fetched once and revalidated on mutation.

## 5. Brokers section
- Same horizontal layout fix.
- BrokerageCombobox already shipped — verified to write both `current_company` and `current_brokerage_id`.
- Add lead-count column (deals attributed via `assigned_broker_id`).

## 6. Global Export

Persistent "Export" button in CRM hub header (champagne with gold hairline). Opens modal:
- Step 1 — Dataset: Employees, Leads, Investors, Clients, Developers, Dev Sales Reps, Brokers, Brokerage Agencies.
- Step 2 — Filters: reuses the section's current filter state + extra options (date range, country, status, tier, source).
- Step 3 — Columns: include/exclude checklist (defaults to visible columns).
- Step 4 — Format: CSV / XLSX / PDF.
- Server: existing `exportLeads.ts`, `exportDevelopers.ts`, `exportXlsx.ts` extended; logged via `dlpExportLogger`.

## 7. DLD label correction
Confirm previous LD→DLD rename covered every UI string (chips, source filter, import history). Sweep `rg "LD import|'LD'|database_source.*LD"` and patch any stragglers.

## 8. QA pass
After implementation, navigate each section and verify:
- Switch time <300 ms (cached).
- Brokerage detail open <600 ms.
- No vertical letter-stacking anywhere; all cards equal height.
- All contact fields clickable; all dropdowns open downward; all chip counts match table totals.
- Export modal works for all 8 datasets.

---

## Technical notes (for engineers)

- New files:
  - `src/components/crm/BrokerCombobox.tsx`
  - `src/components/crm/CRMExportModal.tsx`
  - `src/components/crm/EmirateShortcutChips.tsx`
  - `src/components/crm/HorizontalInfoBar.tsx` (shared by agency + developer)
  - `src/hooks/useCRMSectionCounts.ts`
- Edited:
  - `src/pages/owner/crm/UnifiedCRM.tsx` (QueryClient boundary, prefetch, export button)
  - `BrokeragesRegistry.tsx`, `BrokersRegistry.tsx`, `DevelopersRegistry.tsx`, `DevSalesRepsDirectory.tsx`, `LeadsTableV2.tsx`
  - `LeadStatusBadge.tsx` (orange/yellow/dark-red mappings + single-pill chevron)
- Migrations (read-only / additive):
  - `vw_brokerage_detail`, `vw_developer_detail`, `vw_crm_section_counts`
  - Indexes: `crm_brokers(current_brokerage_id)`, `crm_leads(assigned_broker_id, status, is_vip)`
  - Columns: `crm_leads.broker_name_text text`, `crm_leads.is_vip boolean default false`, `crm_leads.tier text default 'standard'`

No existing features removed (per No-Removal policy). Champagne-gold tokens only; no raw grays; no gold fills.
