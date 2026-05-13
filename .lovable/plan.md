# Platform Consolidation Audit & Plan

This is a discovery + consolidation roadmap. **No code is changed in this plan** — once you approve, I'll execute it in numbered phases, one phase per merge so you can verify before the next.

---

## 1. Scope of the problem (what I found)

- **246 page files** in `src/pages` + 7 route bundles + ~580 mounted route paths.
- Many files exist as **legacy standalone pages** that have already been visually replaced by `UnifiedCRM` sections, but the standalone pages, components and hooks are still in the repo and partially still mounted.
- Multiple "Hub" / "Dashboard" / "Center" pages overlap in purpose.
- Hostinger inbox work is currently blocked behind this — once consolidated, the second mailbox slots into the single Inbox surface instead of growing another tab tree.

---

## 2. Duplicate systems detected

### A. CRM (highest priority)
| Found | Status |
|---|---|
| `src/pages/CRM.tsx` | legacy, superseded |
| `src/pages/AdminCRM.tsx` (`/admin/crm`) | legacy admin CRM |
| `src/pages/owner/crm/UnifiedCRM.tsx` (`/owner/crm`) | **PRIMARY (keep)** |
| `src/pages/owner/crm/CRMNetwork.tsx` | duplicate of Relationships sub-tab |
| `src/pages/owner/crm/BrokersRegistry.tsx` | duplicate of Relationships > Brokers |
| `src/pages/owner/OwnerRelationships.tsx` (`/owner/relationships`) | parallel relationships hub |
| `src/pages/owner/OwnerRelationshipsRevenue.tsx` | should be a tab inside Relationships |
| `CRMLeadsInbox`, `CRMTasks`, `CRMNotes`, `CRMReminders`, `CRMCalendar`, `CRMEmployees`, `CRMRelationships` (top-level pages) | already redirected → delete files + components + hooks |

**Action:** UnifiedCRM at `/owner/crm` is the single source of truth. All CRM pages above get deleted; only redirects remain. Per the Unified Owner CRM Hub memory, this is already the standard — we just haven't finished the deletions.

### B. Inbox / Email
| Found | Status |
|---|---|
| `src/pages/OwnerInbox.tsx` (`/owner/inbox`) | **PRIMARY** — extend with multi-account tabs |
| `src/pages/EmailClient.tsx` (`/owner/email-client`) | duplicate, delete |
| `src/pages/owner/crm/EmailCenter.tsx` | duplicate, delete |
| `src/pages/CompanyComm.tsx` | superseded by Communication Hub v2 |
| `JBJBrokerMessages.tsx` | merge into Inbox or TeamChat |

**Action:** OwnerInbox becomes the only inbox surface, with one tab per connected mailbox (Jane Gmail, JBJ Gmail, Hostinger `contact@jbj.ae`, future channels). Per-section sent log + Hostinger then plug in here.

### C. Calendar / Agenda
| Found | Status |
|---|---|
| `AICalendar.tsx` | standalone AI calendar |
| `OwnerAgenda.tsx` (`/owner/agenda`) | personal agenda |
| `CRMCalendar.tsx` | already redirected |
| `MeetingCenter.tsx` | meetings UI |
| Calendar widgets inside UnifiedCRM, Marketing Hub, EventManagement | scattered |

**Action:** One calendar primitive (`<UnifiedCalendar />`), surfaced as: `/owner/crm?section=calendar` (work), `/owner/agenda` (personal view of same data), AICalendar becomes an AI overlay on it. Single `calendar_events` table is the source of truth.

### D. Tasks / Notes / Reminders
| Found | Status |
|---|---|
| `CRMTasks`, `CRMNotes`, `CRMReminders` (top-level) | redirect-only, delete files |
| `FoundersNotesPanel` (`/owner/notes`) | merge into CRM Notes section |
| Task widgets inside Marketing Hub, EventManagement, Kanban | use unified task store |
| `KanbanBoard.tsx` | becomes a *view* of the same task table |

**Action:** Single tables `crm_tasks`, `crm_notes`, `crm_reminders` (already exist per CRM standard). Kanban + Calendar + Notes panel all read from these. Delete duplicate stores.

### E. Employee / HR
| Found | Status |
|---|---|
| `EmployeeHub.tsx` (`/employee-hub`) | legacy |
| `EmployeeManagementHub.tsx` (`/employee-management`) | **PRIMARY** |
| `CRMEmployees.tsx` | redirected |
| `HRDashboard.tsx`, `HRAgent.tsx` | merge as tabs into EmployeeManagementHub |
| `BrokerAdminAssistant`, `JBJBrokerAdmin` | merge into same |

**Action:** EmployeeManagementHub becomes the single Employee/HR hub with tabs: Roster, CV Center, Onboarding, HR Agent, Broker Admin.

### F. Owner / Founder Dashboards
| Found | Status |
|---|---|
| `OwnerDashboard`, `OwnerDashboardOverview`, `OwnerDashboardShell` | three layers, keep Shell + Overview only |
| `Dashboard.tsx`, `MyDashboard.tsx`, `MyDashboardActivity.tsx`, `MyDashboardProgress.tsx` | role-mode dashboards, merge into one role-aware Dashboard |
| `Founder.tsx`, `FoundersAssistant.tsx`, `ExecutiveAssistant.tsx` | overlapping AI assistants → keep one Executive Assistant per Amanda Clarke standard |
| `JBJBrokerDashboard`, `BrokerDashboard`, `BrokerPartnerDashboard`, `BrokerHub`, `BrokerPortal` | five broker dashboards → one |
| `InvestorDashboard`, `InvestorHub` | two → one |

### G. Automations
| Found | Status |
|---|---|
| `Automations.tsx` (`/owner/automations`) | **PRIMARY** |
| Automation tab inside UnifiedCRM | should embed same engine, not reimplement |
| Per-feature ad-hoc triggers in Marketing Hub, EventManagement | route through automation engine |

### H. AI Tool Pages (24 separate pages)
24 `AI*Page.tsx` files all with their own layout. Per Royal Tools Hub memory, they should share one `<AIToolShell />`. Many already do — audit + force the rest onto the shell.

### I. Misc duplicates
- Two design studios: `Studio` + `JBJDesignStudio` + `OwnerCreativeSuite` → keep `OwnerCreativeSuite`.
- Two ticket systems: `TicketHub` + `SupportTicketHub` → keep SupportTicketHub (per memory).
- Two trust/audit pages: `TrustAndAuditCenter` + `TrustAndCompliance` + `OwnerAuditPage` + `GlobalAuditDashboard` → consolidate into Global Audit + public Trust page.

---

## 3. Database / backend duplication
Will be enumerated per-system in each phase before any merge. Known-good canonical tables (per existing memory standards):
- `crm_contacts`, `crm_leads`, `crm_companies`, `crm_tasks`, `crm_notes`, `crm_reminders`, `vw_crm_contacts`, `upsert_contact_with_company` — keep.
- Deprecate: `rel_*`, `jbj_*`, any `legacy_*` mirror tables (read-only first, then drop after migration).
- One `email_messages` + `email_accounts` model for the unified inbox (already in place — extend, don't fork).

Each phase ships with: data migration script, RLS audit, and a read-only deprecation window before drop.

---

## 4. Execution phases (proposed order)

I'll do these one at a time. Each phase ends with: deletions listed, redirects in place, build green, smoke test in preview.

1. **CRM consolidation** — delete the 7 legacy top-level CRM pages + their components/hooks; keep redirects; verify UnifiedCRM covers every removed feature.
2. **Inbox consolidation** — fold EmailClient + EmailCenter + CompanyComm into OwnerInbox; finish Jane/JBJ separated tabs; THEN connect Hostinger as a 3rd tab; per-account sent log.
3. **Calendar/Tasks/Notes/Reminders** — single primitives + tables; Kanban becomes a view.
4. **Employee/HR** — merge into EmployeeManagementHub.
5. **Dashboards** — collapse OwnerDashboard variants + role-mode dashboards.
6. **Broker / Investor hubs** — one per role.
7. **Automations** — single engine, embed everywhere.
8. **AI tool pages** — enforce shared shell.
9. **Misc** (studios, tickets, trust/audit).
10. **Backend cleanup** — drop deprecated tables + RLS sweep + linter pass.

---

## 5. Strict rules I will follow (per existing memory)
- **No-removal policy**: every feature on a deleted page must exist in the primary before deletion.
- **Champagne-gold design system** + IconTile + Adaptive Hairline on the unified surfaces.
- **Single CRM standard** + **Locked-Send** + **Single-Agency Email Rule** preserved.
- All deletions land with redirects so external links don't 404.

---

## 6. What I need from you

1. **Approve this plan** (or tell me to reorder phases).
2. Confirm I should pause the Hostinger work and do **Phase 1 (CRM consolidation) first**, since Hostinger plugs cleanly into Phase 2 once Inbox is unified. Recommended.
3. Phase 1 will produce a concrete delete-list + diff before I touch anything destructive in the database.
