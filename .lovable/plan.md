

## Plan: CRM Security Hardening — Role-Based Access, Field Masking, Session Security & Security Dashboard

### Current State Assessment

**Already in place:**
- RLS on `crm_leads` with strict SELECT/INSERT/UPDATE/DELETE policies (owner/admin/CRM admin/assignee-based)
- `is_crm_admin()` and `is_active_crm_member()` security definer functions
- `crm_lead_access_logs` table with admin-only SELECT, authenticated INSERT
- `crm_audit_logs` with trigger-based audit trail (old/new values on UPDATE/DELETE)
- `crm_lead_assignments` table for explicit lead assignment
- Export restricted to `owner_admin`/`founder` roles in frontend (`CRM.tsx`)
- Soft delete (`deleted_at`) with 90-day auto-purge
- `SecureLeadCard` component with masked phone/email for brokers

**Gaps to fill:**
- No `crm_field_permissions` table — all fields visible to all CRM users
- No CRM session security (idle timeout, re-auth for sensitive actions)
- No lead sharing with expiry
- No CRM Security Dashboard
- Export restriction is frontend-only, no RLS-level enforcement
- No structured permission matrix (view/edit/assign/export/delete/merge/archive per role)

### Database Changes (Migration)

**1. `crm_field_permissions` table** — Field-level visibility per CRM role:
```
id, crm_role (text), field_name (text), can_view (bool), can_edit (bool), show_masked (bool)
```
Pre-populated with permission matrix rows for roles: `owner_admin`, `founder`, `sales_manager`, `sales_director`, `broker`, `agent`, `support`. Sensitive fields: phone_e164, email_lower, nationality, budget, notes, source, pipeline_stage, ai_score, assigned_broker, internal_comments, ai_qualification.

**2. `crm_lead_shares` table** — Explicit lead sharing with expiry:
```
id, lead_id (uuid), shared_by (uuid), shared_with (uuid), expires_at (timestamptz), revoked_at (timestamptz), created_at
```
RLS: Owner/admin can manage all; shared_with user can SELECT their own active shares.

**3. `crm_security_events` table** — Security event log:
```
id, user_id (uuid), event_type (text), details (jsonb), ip_address (text), user_agent (text), created_at
```
Event types: `export`, `mask_reveal`, `permission_change`, `suspicious_access`, `session_expired`, `reauth_required`, `unauthorized_attempt`, `lead_share`, `lead_share_revoke`.

**4. Update `crm_leads` SELECT RLS** — Add lead sharing to the access check:
```sql
OR EXISTS (
  SELECT 1 FROM crm_lead_shares
  WHERE lead_id = crm_leads.id
  AND shared_with = auth.uid()
  AND revoked_at IS NULL
  AND (expires_at IS NULL OR expires_at > now())
)
```

**5. Security definer function `get_field_permissions(role text)`** — Returns field visibility rules for a given CRM role, used by frontend to mask/hide fields.

### Frontend Changes

**New file: `src/pages/owner/CRMSecurityDashboard.tsx`** (Task 7)
- Owner-only dashboard showing:
  - Recent exports (from `crm_audit_logs` where action='export')
  - Suspicious access events (from `crm_security_events`)
  - Permission changes log
  - Most viewed leads (from `crm_lead_access_logs`, aggregated)
  - Masked-field reveal events
  - Active/inactive CRM sessions
  - Unauthorized access attempts
- Searchable, filterable, with date range picker
- Stats cards at top: total events today, exports this week, active shares, suspicious events

**New file: `src/hooks/useCRMFieldPermissions.ts`** (Task 2)
- Fetches `crm_field_permissions` for the current user's CRM role
- Returns `canViewField(fieldName)`, `shouldMask(fieldName)`, `canEditField(fieldName)`
- Used by CRMLeadsTableV2, CRMLeadDetail, CRMLeadsInbox, AdminLeads, and export functions
- Masks sensitive fields by replacing middle characters with `***`

**New file: `src/hooks/useCRMSessionSecurity.ts`** (Task 4)
- Tracks idle time (15 min timeout → force re-auth)
- Re-authentication modal for sensitive actions (export, delete, bulk assign, permission change, mask reveal)
- Logs session events to `crm_security_events`
- Device fingerprint tracking (reuses existing `generateDeviceFingerprint` from ContentSecurityProvider)

**New file: `src/components/crm/CRMReAuthModal.tsx`** (Task 4)
- Password re-entry modal shown before sensitive CRM actions
- On success, grants a 10-minute "elevated" session window
- Logs re-auth events

**New file: `src/components/crm/LeadSharingPanel.tsx`** (Task 6)
- Panel within lead detail to share a lead with another CRM user
- Set expiry (1h, 24h, 7d, 30d, custom)
- View active shares, revoke access
- All actions logged

**Update: `src/components/crm/CRMLeadsTableV2.tsx`** (Task 2, 3)
- Integrate `useCRMFieldPermissions` to conditionally mask/hide fields in table columns
- Hide export button for non-owner roles
- Mask phone/email columns based on permissions

**Update: `src/pages/CRMLeadDetail.tsx`** (Task 2, 5)
- Integrate field permissions — mask fields user cannot view
- "Reveal" button for masked fields (logs to `crm_security_events`, requires re-auth)
- Log lead access on mount via `log_crm_lead_access` RPC

**Update: `src/pages/CRM.tsx`** (Task 3, 4)
- Wrap export actions with re-auth check
- Log export events to both `crm_audit_logs` and `crm_security_events`

**Route:** Add `/owner/crm-security` to `AdminRoutes.tsx` wrapped in `OwnerGuard`.

### Permission Matrix (Pre-seeded Data)

| Field | Owner | Sales Manager | Broker/Agent | Support |
|-------|-------|---------------|--------------|---------|
| phone_e164 | view+edit | view | masked (own leads: view) | masked |
| email_lower | view+edit | view | masked (own leads: view) | masked |
| nationality | view+edit | view | view | hidden |
| budget | view+edit | view | hidden | hidden |
| notes | view+edit | view+edit | view (own) | view |
| pipeline_stage | view+edit | view+edit | view | view |
| ai_score | view | view | hidden | hidden |
| internal_comments | view+edit | view | hidden | hidden |

### Files Summary

| File | Change |
|------|--------|
| **New**: `src/pages/owner/CRMSecurityDashboard.tsx` | Security dashboard with event logs, exports, shares |
| **New**: `src/hooks/useCRMFieldPermissions.ts` | Field-level permission hook |
| **New**: `src/hooks/useCRMSessionSecurity.ts` | Idle timeout, re-auth tracking |
| **New**: `src/components/crm/CRMReAuthModal.tsx` | Re-authentication modal |
| **New**: `src/components/crm/LeadSharingPanel.tsx` | Lead sharing with expiry |
| **Update**: `src/components/crm/CRMLeadsTableV2.tsx` | Field masking in table |
| **Update**: `src/pages/CRMLeadDetail.tsx` | Field masking, reveal logging, access logging |
| **Update**: `src/pages/CRM.tsx` | Re-auth wrapper on exports |
| **Update**: `src/routes/AdminRoutes.tsx` | Add CRM Security route |
| **Migration**: SQL | 3 new tables, updated RLS, permission seed data, security definer function |

### Implementation Order
1. Database migration (tables, RLS, seed data, functions)
2. `useCRMFieldPermissions` hook
3. `useCRMSessionSecurity` hook + `CRMReAuthModal`
4. Update `CRMLeadsTableV2` and `CRMLeadDetail` with field masking
5. `LeadSharingPanel` component
6. `CRMSecurityDashboard` page
7. Wire routes and integrate export re-auth in `CRM.tsx`

