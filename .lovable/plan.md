

## SESSION 13 — CRM System Structure & Data Protection Audit

### TASK 1 — CRM DATABASE STRUCTURE

**Status: IMPLEMENTED**

The CRM database consists of the following verified tables with their schemas:

#### Core Tables

| Table | Primary Key | Key Columns | Foreign Keys |
|-------|------------|-------------|--------------|
| `crm_leads` | `id` (uuid) | `full_name`, `email_lower`, `phone_e164`, `nationality`, `pipeline_stage`, `lead_intent`, `owner_user_id`, `assigned_broker_id`, `assigned_to_user_id`, `created_by_user_id`, `contact_type`, `source`, `priority_score`, `ai_score`, `vip`, `deleted_at` | `source_id → crm_lead_sources`, `import_batch_id → crm_imports`, `assigned_ai_employee_id → crm_ai_employees` |
| `broker_profiles` | `id` (uuid) | `user_id`, `display_name`, `broker_type` (internal/external), `email`, `phone`, `specializations[]`, `languages[]`, `verification_status`, `current_tier`, `total_points` | `user_id → auth.users` |
| `developers` | `id` (uuid) | `name`, `slug`, `logo_url`, `rank`, `founded_year`, `completed_projects`, `headquarters`, `website_url` | None (reference data) |
| `client_investors` | `id` (uuid) | `client_name`, `email`, `phone`, `project_name`, `project_id`, `unit_number`, `purchase_price`, `purchase_date`, `handover_date`, `payment_plan` | `project_id → projects` |
| `crm_tasks` | `id` (uuid) | `lead_id`, `user_id`, `title`, `notes`, `due_at`, `completed_at`, `status` | `lead_id → crm_leads`, `user_id → auth.users` |
| `crm_notes` | `id` (uuid) | `lead_id`, `user_id`, `body` | `lead_id → crm_leads`, `user_id → auth.users` |
| `crm_activities` | `id` (uuid) | `lead_id`, `user_id`, `activity_type` (enum), `metadata` (jsonb) | `lead_id → crm_leads`, `user_id → auth.users` |
| `crm_chat_messages` | — | `sender_id`, `channel_id`, `content` | — |
| `crm_lead_shares` | `id` (uuid) | `lead_id`, `shared_by`, `shared_with`, `permission_level`, `expires_at`, `revoked_at` | `lead_id → crm_leads` |
| `crm_lead_assignments` | `id` (uuid) | `lead_id`, `assigned_to_user_id`, `assigned_by_user_id`, `assigned_at`, `unassigned_at` | `lead_id → crm_leads` |
| `crm_lead_shortlists` | `id` (uuid) | `lead_id`, `property_id`, `property_data` (jsonb), `added_by_user_id`, `notes` | `lead_id → crm_leads` |
| `crm_lead_access_logs` | `id` (uuid) | `lead_id`, `user_id`, `access_type`, `masked_access`, `ip_address`, `user_agent` | `lead_id → crm_leads` |
| `crm_audit_logs` | `id` (uuid) | `actor_user_id`, `action`, `entity_type`, `entity_id`, `old_values`, `new_values`, `details`, `ip_address`, `user_agent` | — |
| `crm_security_events` | — | `user_id`, `event_type`, `details`, `user_agent` | — |

**Table relations summary**: `crm_leads` is the central entity; `crm_tasks`, `crm_notes`, `crm_activities`, `crm_lead_assignments`, `crm_lead_shares`, `crm_lead_shortlists`, and `crm_lead_access_logs` all reference it via `lead_id`. `crm_audit_logs` tracks changes across all entity types via `entity_type` + `entity_id`.

**Missing tables from the request**: There is no standalone `conversations` or `property_interests` table. Conversations are handled via `crm_chat_messages` (channel-based) and `broker_conversations`. Property interests are tracked via `crm_lead_shortlists` (property shortlisting per lead) and `crm_leads.lead_intent`.

---

### TASK 2 — LEAD ACCESS CONTROL

**Status: IMPLEMENTED**

#### Route Protection
- **Component**: `BrokerCRMAccessGate` (`src/components/broker-toolkit/BrokerCRMAccessGate.tsx`)
- **Route**: All `/crm/*` routes are wrapped with this gate
- **Logic**: Checks `isOwner` (AuthContext) → then checks `hr_user_roles` for `broker_member` role → then checks `has_role()` for `admin`/`owner`

#### Database RLS Policies on `crm_leads`

| Policy | Operation | Rule |
|--------|-----------|------|
| `crm_leads_own_or_assigned_select` | SELECT | Owner of lead (`owner_user_id`), creator (`created_by_user_id`), assigned via `crm_lead_assignments`, or has `admin`/`owner` role |
| `crm_leads_strict_insert` | INSERT | Must be authenticated + active CRM member (`crm_users_profile.is_active = true`) + `created_by_user_id = auth.uid()` |
| `crm_leads_strict_update` | UPDATE | Owner/admin role, CRM admin, lead owner, lead creator, or assigned user |
| `crm_leads_strict_delete` | DELETE | Only `owner`/`admin` role or CRM admin |

#### Security Definer Functions

| Function | Purpose |
|----------|---------|
| `is_crm_admin(_user_id)` | Returns true if user has `owner_admin`, `founder`, `admin`, or `sales_director` CRM role. Self-check only (`_user_id = auth.uid()`). |
| `can_access_crm_lead(_user_id, _lead_id)` | Returns true if user is CRM admin, owns the lead (`owner_type = 'broker_owned'`), or is assigned via `crm_lead_assignments`. |
| `is_active_crm_member(_user_id)` | Returns true if user has an active `crm_users_profile`. Self-check only. |

#### Lead Sharing
- `crm_lead_shares` enables time-limited, explicit sharing between users with `permission_level`, `expires_at`, and `revoked_at` fields.
- Owner manages all shares; users can only view non-revoked, non-expired shares where `shared_with = auth.uid()`.

**Gaps identified**:
- The `crm_leads_own_or_assigned_select` policy has a bug on line referencing `cla.lead_id = cla.id` — this should be `cla.lead_id = crm_leads.id`. This means assignment-based SELECT may not work correctly.
- Developers do NOT have lead access scoped to "leads interested in their projects" — there is no `developer_id`-based RLS policy on `crm_leads`. The `developers` table is public reference data with no user_id linkage.

---

### TASK 3 — LEAD HISTORY TRACKING

**Status: IMPLEMENTED**

Each lead records the following history:

| History Type | Table | Key Fields | Proof |
|-------------|-------|------------|-------|
| Creation time | `crm_leads.created_at` | `created_at` (timestamptz, default `now()`) | Column verified |
| Assigned broker | `crm_lead_assignments` | `lead_id`, `assigned_to_user_id`, `assigned_by_user_id`, `assigned_at`, `unassigned_at` | Full assignment history with timestamps |
| Communication history | `crm_activities` | `lead_id`, `activity_type` (enum: call, email, meeting, note, etc.), `metadata` (jsonb) | Activity log per lead |
| Property viewed/shortlisted | `crm_lead_shortlists` | `lead_id`, `property_id`, `property_data` (jsonb), `added_by_user_id` | Property interest tracking |
| Tasks created | `crm_tasks` | `lead_id`, `user_id`, `title`, `status`, `due_at`, `completed_at` | Task lifecycle per lead |
| Full audit trail | `crm_audit_logs` | `entity_id` (lead_id), `action`, `old_values`, `new_values`, `actor_user_id`, `ip_address` | Change-level diff tracking |
| Access logs | `crm_lead_access_logs` | `lead_id`, `user_id`, `access_type`, `masked_access`, `ip_address` | Who viewed what and when |

**Lead timeline UI**: The `LeadAuditHistory` component (`src/components/crm/LeadAuditHistory.tsx`) renders the audit trail for any lead, showing action badges (CREATE/UPDATE/DELETE/STATUS_CHANGE), field-level diffs (old → new values), timestamps, and actor IDs.

---

### ISSUES FOUND — Recommended Fixes

#### Critical: RLS Policy Bug
The `crm_leads_own_or_assigned_select` policy contains `cla.lead_id = cla.id` which should be `cla.lead_id = crm_leads.id`. This means brokers assigned via `crm_lead_assignments` may NOT be able to SELECT their assigned leads. **Fix**: Migration to recreate the policy with corrected join.

#### Gap: Developer Lead Access
The plan requested developers see "only leads interested in their projects." Currently no RLS policy or application logic links `developers` to `crm_leads` based on project interest. This would require:
1. A `developer_user_id` column on `developers` table (or a junction table)
2. Cross-referencing `crm_lead_shortlists.property_data` or a new `interested_developer_id` field on `crm_leads`
3. A new RLS policy scoping developer SELECT access

**Recommendation**: Fix the RLS bug (critical). The developer lead access gap requires a design decision on how developer users link to the `developers` table.

### Files to Modify
1. **Database migration**: Fix `crm_leads_own_or_assigned_select` RLS policy — correct the join condition
2. No application code changes needed — existing components and access gates are correctly implemented

### Route
- `/crm/*` (all CRM routes)

### Testing Steps
1. Verify a broker assigned via `crm_lead_assignments` can SELECT their assigned leads (currently may fail due to RLS bug)
2. Verify owner/admin can access all leads
3. Verify unauthenticated users get no data
4. Verify `LeadAuditHistory` component renders timeline for a lead

