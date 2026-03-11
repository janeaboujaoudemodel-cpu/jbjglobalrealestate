

## CRM System Upgrade — Full Audit & Implementation Plan

This plan upgrades the **existing** CRM system across all 14 tasks. No new CRM is created. All changes merge directly into the current infrastructure.

---

### AUDIT FINDINGS

**Architecture**: Solid foundation — 23 CRM tables, 28+ security-definer functions, lazy-loaded components, comprehensive RLS policies, dedicated audit log table.

**Strengths Already Present**:
- `crm_leads` table with 55+ columns including encryption fields, AI scoring, pipeline stages
- Security functions: `can_access_crm_lead`, `is_crm_admin`, `is_crm_owner`, `has_full_lead_pii_access`, `encrypt_lead_pii`, `decrypt_lead_pii`
- Audit triggers: `crm_leads_audit_trigger`, `crm_audit_logs` with old/new values
- Lead lifecycle functions: `crm_soft_delete_leads`, `crm_restore_leads`, `crm_hard_delete_leads`, `crm_purge_deleted_leads`
- Duplicate detection: `crm_find_duplicates`
- Stale lead detection: `crm_detect_stale_leads`
- 15+ performance indexes on CRM tables
- Lead access logging: `crm_lead_access_logs`, `log_crm_lead_access`
- AI components: `AILeadScoring`, `DealPrediction`, `AIPropertyCoach`, `SmartLeadAlerts`

**Weaknesses Identified**:

| # | Issue | Severity | Location |
|---|-------|----------|----------|
| 1 | `CRMLeadsTable.tsx` (V1) still exists alongside V2 — dead code, confusion risk | Medium | `src/components/crm/` |
| 2 | `CRMImportModal.tsx` has 3 versions (V1, V2, V3) — only V3 used | Low | `src/components/crm/` |
| 3 | AI scoring in `AILeadScoring.tsx` is fully client-side heuristic — no server AI call | Medium | Component |
| 4 | `AutomationRules.tsx` uses hardcoded rules in frontend, not DB-driven | Medium | Component |
| 5 | CSV export in `CRM.tsx` exports `email_lower`/`phone_e164` in plaintext — bypasses encryption | High | `CRM.tsx:201-236` |
| 6 | `crm_leads_secure` view exists but not consistently used in components | Medium | Multiple |
| 7 | Lead lifecycle missing "assigned" status in `PIPELINE_STATUSES` | Low | `LeadStatusBadge.tsx` |
| 8 | No rate limiting on lead detail page access | Medium | `CRMLeadDetail.tsx` |
| 9 | `KanbanPipeline.tsx` hardcodes 8 stages, doesn't match the 20 statuses in `PIPELINE_STATUSES` | Low | Component |
| 10 | No server-side duplicate prevention on insert — only detection after the fact | Medium | DB |

---

### TASK 1: AUDIT — Covered above. Deliverable is this findings table.

### TASK 2: LEADS SECURITY HARDENING

**Changes**:
- **CRM.tsx (CSV export)**: Route export through `decrypt_lead_pii` function, never expose raw `email_lower`/`phone_e164`. Add audit log entry with IP.
- **CRMLeadDetail.tsx**: Add `log_crm_lead_access` call on mount to track who views each lead.
- **CRMLeadsTableV2.tsx**: Ensure lead phone/email display calls decryption only when user has `has_full_lead_pii_access`.
- **DB Migration**: Add a `check_lead_access_rate` trigger — if a user accesses >50 unique leads in 5 minutes, log a security alert.

### TASK 3: ENCRYPTION HARDENING

**Changes**:
- **CRM.tsx**: Replace direct `email_lower`/`phone_e164` in CSV export with decrypted values via RPC call `decrypt_lead_pii`.
- **CRMLeadsTableV2.tsx**: Mask phone/email in table unless user has owner/admin role — use `maskPhone`/`maskEmail` helpers already present.
- **Edge function `capture-lead`**: Verify it calls `encrypt_lead_pii` on ingest (already exists, verify path).
- Ensure `console.log` statements in CRM components don't leak PII — audit and remove any.

### TASK 4: LEAD LIFECYCLE UPGRADE

**Changes**:
- **LeadStatusBadge.tsx**: Add missing statuses to align with the 10-state lifecycle: `assigned`, `archived`, `deleted`, `permanently_erased`. Map "archived" and "deleted" as neutral, "permanently_erased" as negative.
- **CRM.tsx**: Add "Archived" tab alongside existing tabs.
- **RecentlyDeletedLeads.tsx**: Add "Permanently Erase" button for owner-only, calling `crm_hard_delete_leads`.
- **DB Migration**: Create `crm_auto_purge_deleted` — a function that marks leads with `deleted_at` > 90 days as permanently erased.
- Remove orphaned `crm_lead_state_per_user` rows where lead no longer exists (cleanup query).

### TASK 5: CRM STRUCTURE UPGRADE

**Changes**:
- **CRMLeadDetail.tsx**: Add sections for contact timeline (already has `ActivityTimeline`), deal value tracking, priority score display, smart tags editor, and lead source attribution.
- **CRMEnhancedDashboard.tsx**: Add conversion funnel visualization, source distribution chart, and response time metrics.
- **DB Migration**: Add `duplicate_hash` column to `crm_leads` — computed from normalized phone+email. Add unique partial index on `duplicate_hash WHERE deleted_at IS NULL` to prevent duplicates at insert time.
- **KanbanPipeline.tsx**: Expand visible stages to match all 20 statuses, grouped by category.

### TASK 6: PERFORMANCE OPTIMIZATION

**Changes**:
- **CRM.tsx**: Already uses lazy loading (good). Remove `CRMLeadsTable.tsx` (V1) and `CRMImportModal.tsx`/`CRMImportModalV2.tsx` dead code.
- **CRMLeadsTableV2.tsx**: Add pagination (limit 50 per page) instead of loading all leads. Add debounced search (300ms).
- **CRMEnhancedDashboard.tsx**: Cache dashboard stats for 60 seconds using `useRef` timestamp check to avoid re-fetching on every tab switch.
- **DB Migration**: Add composite index on `crm_leads(deleted_at, created_at DESC)` for the main listing query. Add index on `crm_lead_state_per_user(lead_id, pipeline_status)`.

### TASK 7: AI INTELLIGENCE INTEGRATION

**Changes**:
- **AILeadScoring.tsx**: Replace client-side heuristic with a call to the Lovable AI gateway (`ai.gateway.lovable.dev`) via an edge function `ai-lead-intelligence` that analyzes lead data and returns scoring, qualification suggestions, and next-best-action.
- **SmartLeadAlerts.tsx**: Enhance with AI-generated follow-up message suggestions per alert.
- **CRMLeadDetail.tsx**: Add "AI Summary" card that generates a one-paragraph lead summary using the AI gateway.
- **New edge function `ai-lead-intelligence`**: Accepts lead data, returns JSON with `score`, `qualification`, `next_action`, `duplicate_risk`, `summary`. Uses `openai/gpt-5-mini`.

### TASK 8: WORKFLOW AUTOMATION

**Changes**:
- **AutomationRules.tsx**: Refactor to read rules from a new `crm_automation_rules` DB table instead of hardcoded array. Admin can enable/disable/create rules.
- **DB Migration**: Create `crm_automation_rules` table (id, name, trigger_event, action_type, config jsonb, is_active, created_by, created_at).
- Seed default rules (welcome email, follow-up reminder, hot lead alert, stale lead detection, re-engagement).
- **SmartReminders.tsx**: Connect to `crm_tasks` table for overdue task alerts.

### TASK 9: UI/UX PREMIUM UPGRADE

**Changes**:
- **CRM.tsx header**: Refine with champagne-gold gradient consistency, cleaner action bar, collapsible filter section.
- **CRMLeadsTableV2.tsx**: Add row hover effects, inline status change animation, sticky header on scroll.
- **CRMLeadDetail.tsx**: Redesign with tabbed layout — Overview, Timeline, AI Insights, Communications, Documents. Premium card styling with gold accents.
- **LeadStatusBadge.tsx**: Add micro-animation on status change (framer-motion fade).

### TASK 10: ROLE & PERMISSION SYSTEM

**Changes**:
- **CRM.tsx**: Refine permission checks — use `is_crm_admin`, `is_crm_owner` functions consistently. Add permission matrix:
  - `owner_admin`/`founder`: Full access, export, delete, manage users
  - `admin`: View all leads, assign, edit, no export
  - `sales_director`: View team leads, reports
  - `broker_member`: View assigned/own leads only, no export, no delete
- **CRMLeadsTableV2.tsx**: Hide delete button for non-admin. Hide bulk actions for non-owner.
- **DB Migration**: Add `crm_role` value `sales_director` to the enum if missing.

### TASK 11: AUDIT TRAIL

**Changes**:
- **CRMLeadDetail.tsx**: Add "Audit History" tab showing `crm_audit_logs` entries for this lead — who created, edited, changed status, reassigned, deleted.
- **CRM.tsx**: Add audit log for every status change, assignment, and deletion action.
- **CRMEnhancedDashboard.tsx**: Add "Recent Activity" section showing last 20 audit log entries (owner-only).

### TASK 12: BACKEND/DATABASE UPGRADE

**Changes**:
- **DB Migration**: 
  - Add composite index `idx_crm_leads_owner_deleted` on `(owner_user_id, deleted_at)`.
  - Add `duplicate_hash` column with partial unique index.
  - Cleanup: Drop unused `crm_leads_secure` view references or ensure it's the primary read path.
  - Add `crm_leads_updated_at_trigger` to auto-update `updated_at` on every row change.

### TASK 13: DATA CLEANLINESS

**Changes**:
- **DB Migration**: Run `crm_find_duplicates()` and log results. Add `duplicate_hash` computed column (md5 of normalized phone + email) with partial unique constraint.
- **CRM.tsx**: Add "Duplicates" tab that calls `crm_find_duplicates` and shows merge UI.
- **CRMImportModalV3.tsx**: Add pre-import duplicate check — show warning before importing leads that match existing phone/email.

### TASK 14: FINAL REPORT — Generated after implementation with file-by-file changelog.

---

### Files to Create/Modify

| File | Action |
|------|--------|
| DB Migration | New indexes, `crm_automation_rules` table, `duplicate_hash` column, cleanup queries, enum update |
| `supabase/functions/ai-lead-intelligence/index.ts` | **New** — AI scoring/summary edge function |
| `src/pages/CRM.tsx` | Security hardening, archived tab, audit logging, UI refinements |
| `src/components/crm/CRMLeadsTableV2.tsx` | Pagination, PII masking enforcement, permission checks, UI polish |
| `src/pages/CRMLeadDetail.tsx` | Audit history tab, AI summary card, access logging, tabbed redesign |
| `src/components/crm/LeadStatusBadge.tsx` | Add missing lifecycle statuses |
| `src/components/crm/AILeadScoring.tsx` | Server-side AI scoring via edge function |
| `src/components/crm/AutomationRules.tsx` | DB-driven rules instead of hardcoded |
| `src/components/crm/CRMEnhancedDashboard.tsx` | Stats caching, recent activity, conversion funnel |
| `src/components/crm/KanbanPipeline.tsx` | Expand stages to match full status list |
| `src/components/crm/SmartLeadAlerts.tsx` | AI follow-up suggestions |
| `src/components/crm/RecentlyDeletedLeads.tsx` | Permanent erase button (owner-only) |
| Dead code removal | Delete `CRMLeadsTable.tsx`, `CRMImportModal.tsx`, `CRMImportModalV2.tsx` |

This will be implemented in multiple messages, starting with the database migration and security hardening (Tasks 1-3), then lifecycle and structure (Tasks 4-5), then performance and AI (Tasks 6-7), then automation and UI (Tasks 8-9), then roles and audit (Tasks 10-13).

