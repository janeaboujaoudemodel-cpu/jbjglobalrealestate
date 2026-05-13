# Relationships Hub — Consolidation, Upgrade & Outreach Center

This plan turns `/owner/crm/relationship-hub` (`src/pages/CRMRelationships.tsx`, 3199 lines) into a single, premium, fully wired enterprise CRM surface. **No parallel pages.** Every change happens inside the hub or its existing components.

---

## 1. What already exists (so we upgrade — not rebuild)

| Capability | Where it lives now | Status |
|---|---|---|
| 4 tabs: Developers / Developer Reps / Brokerage Agencies / Brokers | `CRMRelationships.tsx` lines 3167-3192 | ✅ keep — restructure into Option A |
| Branded Outreach composer | `<BrandedEmailComposer />` mounted above tabs (line 3156) | ⚠️ exists, needs feature parity with the 15-feature spec |
| Templates engine | `TemplateEditorDialog`, `branded_email_templates`, `crm_email_templates`, `useEmailTemplateLibrary` | ✅ exists, unify the two template tables |
| Test send | `TestSendDialog` + `BrandedEmailComposer` test chips | ⚠️ guarantee byte-for-byte parity (Locked-Send standard already in memory) |
| Bulk outreach | `BulkOutreachPanel`, `BulkSendDialog`, `BulkEmailModal`, `BulkWhatsAppModal` | ⚠️ overlapping — collapse into one |
| Sent history | `<SentHistoryView />` lines 2565 / 3043 | ✅ extend with per-account log |
| Brokerage agents (owner, directors, brokers) | `BrokerageAgentsEditor`, `crm_brokerage_agents` | ✅ extend fields |
| Brokers | `IndividualBrokersTab`, `crm_brokers`, `broker_profiles`, `BrokerBulkUploadDialog` | ✅ extend fields + inventory |
| Developer registry | `DeveloperRegistryTab`, `crm_developer_registry` | ✅ extend fields |
| Developer reps | `DevSalesRepsDirectory` | ✅ extend with Channel vs Sales split |
| Secondary Market | linked button → `/owner/crm/relationships/secondary-market` | ✅ wire inventory → here |
| Tasks/Calendar/Notes/Comm history | `crm_tasks`, `crm_notes`, `crm_calls`, `crm_chat_messages`, `crm_brokerage_actions`, `crm_brokerage_notes` | ✅ surface inline on every entity |
| Export | `ExportMenu`, `UnifiedCRMExportModal`, `ExportConfigurator`, `exportBrokerages`, `exportDevelopers` | ⚠️ standardise across all 4 tabs |

149 relationship/CRM tables already exist. We extend; we do not create parallel ones.

---

## 2. Final structure — Option A (your recommendation)

```
Relationships Hub
├── 🟡 Branded Outreach Email Center  (sticky, above everything)
│
├── Tab: Developers
│   ├── Sub-tab: Developers
│   └── Sub-tab: Developer Representatives
│       ├── Channel Department contacts
│       └── Sales Contact Point contacts
│
└── Tab: Brokerage Agencies
    ├── Sub-tab: Agencies
    └── Sub-tab: Individual Brokers
```

Premium dividers, hover animations, gold-champagne active states, sticky sub-headers — using the existing design tokens (no new color system).

---

## 3. Branded Outreach Email Center — 15-feature spec

We upgrade the existing `<BrandedEmailComposer />`; we do not add a second composer. Final field/feature list:

1. Recipient Email (chips) ✅ exists
2. Recipient Name — add
3. Company Name — add (auto-suggest from `crm_brokerages` / `crm_developer_registry`)
4. Subject ✅
5. Email Body (HTML editor) ✅
6. Attachments — add (Drive picker + local upload, stored in `crm_documents` bucket)
7. Save as Template ✅ (already wired to `useSaveEmailTemplate`)
8. Select Existing Template ✅
9. AI Email Assistant — add `brief` → `lovable-ai` edge call returning subject + body + CTA + signature; user edits inline
10. Send Test Email — wired to **Locked-Send** standard so test = final byte-for-byte
11. Send Final Email ✅
12. Preview Mode — add full-screen preview dialog
13. Draft Auto-Save — add (`branded_outreach_drafts` table, 5s debounce, per-user)
14. Email History — add tab inside composer, reads `email_send_log` filtered by source `BrandedEmailComposer`
15. Email Status Tracking — add (sent / delivered / bounced / opened — already tracked in `email_send_log`)

Variables supported (rendered server-side at lock time):
`{{company_name}} {{contact_name}} {{broker_name}} {{developer_name}} {{agency_name}} {{sender_name}} {{sender_email}}`

Locked-Send Outreach Standard + Single-Agency Email Rule already enforced — both stay on.

---

## 4. Field expansion — every entity gets the full spec

Universal block on Developers / Reps / Agencies / Brokers:
Country, Emirate, Website, LinkedIn, Instagram, Office Address, Google Maps Link, Main Phone, Main Email, Admin Name, Admin Number, Number of Brokers, Google Reviews, Inquiry Count, Closed Deals Count, Registration Status, Partnership Status, Assigned Team Member, Last Contact Date, Notes, Attachments, Communication History, Tasks, Calendar Events, Email Logs, Source Links, Verification Status, Created/Updated dates.

Plus per-entity additions per your spec (agency owner / sales directors / channel managers / DOB / nationalities / languages; broker specialities; rep Channel vs Sales split).

Migration approach: extend existing tables with nullable columns (no new parallel tables). Read-only fallback for legacy records.

---

## 5. Inventory database → Secondary Market Hub

- Bulk Excel/CSV upload on Developer / Agency / Broker entity drawers (reuse `BrokerBulkUploadDialog` + `MediaIngestionHub` patterns).
- Rows land in existing `crm_brokerage_inventory` (or new `crm_entity_inventory` if absent — checked in Phase 0).
- Secondary Market Hub reads the same table — instant cross-surface visibility.

---

## 6. Clickable graph

Existing drawers (`CompanyHubDrawer`, `BrokerCombobox`, etc.) get cross-links so:
Agency → Brokers → Inventory → Deals → CRM Pipeline → Inquiries → Email Log — all one click apart, all in the same hub (no new pages).

---

## 7. Export everywhere

Single primitive: `<UnifiedCRMExportModal />` (already exists). Wire it into every sub-tab with format options CSV / XLSX / PDF / JSON / Print / CRM Report, plus bulk / filtered / selected-rows scopes.

---

## 8. Restore missing pieces

Audit pass restoring (per your list):
- Outreach pack
- Bulk email sender (collapse `BulkSendDialog` + `BulkEmailModal` → one)
- Test email visibility (already in-place via Locked-Send)
- Document pack integration (Google Drive pack — uses existing `google_drive` connector + Universal Link Extractor)
- Registration email workflows
- Saved outreach templates
- Attachment manager

---

## 9. Execution phases (each ships independently, you verify in preview)

**Phase 0 — audit + zero-risk consolidation (no schema changes)**
- Map every duplicate component (BulkSendDialog vs BulkEmailModal, etc.) and produce a delete-list.
- Restructure tabs to Option A nesting. No data changes.
- Pin Branded Outreach Email Center to the top with sticky styling.

**Phase 1 — Branded Outreach Email Center upgrade**
- Add the 9 missing features to `BrandedEmailComposer` (Recipient Name, Company autosuggest, Attachments, AI Assistant, Preview, Draft auto-save, Email History panel, Status tracking, Variable expansion).
- Migration: `branded_outreach_drafts` table + per-user RLS.
- Edge function: `branded-outreach-ai-draft` (Lovable AI Gateway, no key needed).
- Lock-Send wiring verified: test = final.

**Phase 2 — Field expansion + entity drawers**
- ALTER TABLE migrations adding missing columns to `crm_developer_registry`, `crm_brokerages`, `crm_brokerage_agents`, `crm_brokers`.
- Extend forms in `BrokerageAgentsEditor`, `DeveloperRegistryTab`, `DevSalesRepsDirectory`, `IndividualBrokersTab`.
- Channel Dept vs Sales Contact Point split for Developer Reps.

**Phase 3 — Inventory & Secondary Market wiring**
- Confirm/create `crm_entity_inventory` (entity_type, entity_id, listing payload).
- Bulk uploader in each entity drawer.
- Secondary Market Hub reads union view.

**Phase 4 — Clickable graph + export standardisation**
- Cross-links between drawers.
- `UnifiedCRMExportModal` mounted in all 4 sub-tabs.

**Phase 5 — Restoration sweep**
- Reinstate Outreach Pack, Drive document packs, Registration workflow templates, Attachment manager.
- Collapse duplicate dialogs.

**Phase 6 — Polish**
- Premium dividers, hover/active states audit, sticky sub-headers, AdaptiveHairline pass.

---

## 10. Strict guardrails (already in memory, repeated for clarity)

- **No new pages, no new hubs.** Everything lives at `/owner/crm/relationship-hub`.
- **No parallel tables.** Extend existing `crm_*` tables.
- **Locked-Send + Single-Agency Email Rule + Champagne-gold + IconTile + AdaptiveHairline** all stay on.
- **No removal** of any existing feature; if anything is replaced it's because the new home is functionally a superset.
- All sends route through the existing `email_send_log` + Resend quota guard.

---

## 11. What I need from you to start

1. **Approve this phased plan.**
2. **Confirm Option A nesting** (Developers + Reps under one tab; Agencies + Brokers under another) — your message recommended it; I'll implement that unless you say otherwise.
3. **Pick the first phase to build now**: I recommend **Phase 0 → Phase 1** in this turn since they unblock the rest and give immediate visible upgrade (Outreach Center).
