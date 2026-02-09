

# Outstanding Tasks & Security Fixes - Complete Audit

## Summary

Based on my comprehensive analysis of the security scan results, database linter, changelogs, and codebase, here is the complete list of **uncompleted tasks** that need to be fixed:

---

## ACTIVE SECURITY FINDINGS (Require Immediate Action)

### 1. HR Employees Encryption Bypass (ERROR - Critical)
| Field | Value |
|-------|-------|
| **Severity** | ERROR |
| **Table** | `hr_employees` |
| **Finding ID** | `hr_employees_encryption_bypass` |
| **Issue** | Table has BOTH encrypted columns (`email_encrypted`, `phone_encrypted`, `cv_url_encrypted`) AND unencrypted columns (`email`, `phone`, `cv_url`) containing the same data |
| **Risk** | Encryption can be bypassed by accessing plaintext columns directly |
| **Fix Required** | Remove plaintext columns OR make them computed views that decrypt on-demand |

### 2. Chat History Session Exposure (WARN)
| Field | Value |
|-------|-------|
| **Severity** | WARN |
| **Table** | `chat_history` |
| **Finding ID** | `chat_history_session_exposure` |
| **Issue** | Anonymous inserts allowed with `session_id` validation, but 10 overlapping policies exist |
| **Risk** | Session IDs could be exploited if predictable/leaked |
| **Fix Required** | Consolidate 10 policies → 4-5 clear policies; strengthen session validation |

---

## RLS POLICY "ALWAYS TRUE" WARNINGS (8 Total)

The linter shows 8 "RLS Policy Always True" warnings. Here's the breakdown:

### Already Ignored (Intentional - No Action Needed)
| Table | Policy | Reason Ignored |
|-------|--------|----------------|
| `visitor_events` | `allow_visitor_event_insert` | Anonymous analytics tracking |
| `visitor_sessions` | `allow_visitor_session_insert` | Anonymous session creation |
| `visitor_sessions` | `allow_visitor_session_update` | Anonymous session updates |
| `pending_developer_imports` | `pending_developer_imports_service_only` | Service role only (edge functions) |

### NEW - Require Hardening (4 Tables)
| Table | Policy | Roles | Fix Required |
|-------|--------|-------|--------------|
| `best_idea_submissions` | `Anyone can submit ideas` | `{public}` | Add validation (rate limit, field checks) |
| `esign_audit_log` | `System can insert audit logs` | `{public}` | Restrict to `authenticated` or add validation |
| `esign_signed_documents` | `System can insert signed documents` | `{public}` | Restrict to `authenticated` or add validation |
| `user_feedback` | `Anyone can submit feedback` | `{public}` | Add rate limiting + input validation |
| `user_notifications` | `Service role can insert notifications` | `{public}` | Restrict to `service_role` only (misconfigured) |

### Privilege Layer Issues
These 5 tables also have `anon=arwdDxtm` (full anonymous privileges):
- `best_idea_submissions`
- `esign_audit_log`
- `esign_signed_documents`
- `user_feedback`
- `user_notifications`

**Risk**: Anonymous users have read/write/delete access at the privilege layer, bypassing RLS intent.

---

## POLICY CONSOLIDATION NEEDED

### chat_history Table (10 Policies → Target: 4-5)
| Current Policy | Issue |
|----------------|-------|
| `Staff can read chat history` | Uses `{public}` role - should be `{authenticated}` |
| `Staff can view all chat history` | Duplicate of above |
| `Users can view own chat history only` | OK |
| `chat_hist_select_admin` | OK |
| `chat_hist_update_founder` | OK |
| `chat_history_admin_insert` | Potential duplicate |
| `chat_history_admin_select` | Duplicate select policy |
| `chat_history_anon_insert` | OK (has rate limiting) |
| `chat_history_owner_insert` | OK |
| `chat_history_restricted_access` | Uses `{public}` - should be removed |

**Fix**: Remove duplicate/overlapping policies, consolidate to 4-5 clear policies.

---

## IMPLEMENTATION PLAN

### Phase 7A: HR Employees Encryption Fix (Priority: Critical)

**Option A - Remove Plaintext (Recommended)**
1. Create migration to:
   - Drop columns `email`, `phone`, `cv_url` from `hr_employees`
   - Update all code to use encrypted columns + decryption functions
   - Add computed views for backward compatibility if needed

**Option B - Drop Encrypted Columns**
1. If encryption isn't actively used, remove the `*_encrypted` columns
2. Ensure RLS blocks all non-HR-admin access to plaintext columns

**Files to Update**:
- Any components reading `hr_employees.email/phone/cv_url` directly
- Edge functions accessing HR data

---

### Phase 7B: Chat History Policy Consolidation

**Migration to execute:**
```sql
-- Drop duplicate/overlapping policies
DROP POLICY IF EXISTS "Staff can read chat history" ON chat_history;
DROP POLICY IF EXISTS "Staff can view all chat history" ON chat_history;
DROP POLICY IF EXISTS "chat_history_restricted_access" ON chat_history;
DROP POLICY IF EXISTS "chat_history_admin_select" ON chat_history;

-- Keep these 5 clear policies:
-- 1. chat_history_anon_insert (anonymous widget with rate limiting)
-- 2. chat_hist_select_admin (admin/owner can view all)
-- 3. Users can view own chat history only (user_id = auth.uid())
-- 4. chat_history_owner_insert (authenticated users insert own)
-- 5. chat_hist_update_founder (founder/owner can update)
```

---

### Phase 7C: Harden "Always True" Tables (5 Tables)

**For each table:**

#### 1. `best_idea_submissions`
```sql
REVOKE ALL ON TABLE public.best_idea_submissions FROM anon, public;
GRANT INSERT ON TABLE public.best_idea_submissions TO authenticated;
DROP POLICY "Anyone can submit ideas" ON best_idea_submissions;
CREATE POLICY "authenticated_submit_ideas" ON best_idea_submissions 
  FOR INSERT TO authenticated 
  WITH CHECK (true);  -- Authenticated only
```

#### 2. `esign_audit_log`
```sql
REVOKE ALL ON TABLE public.esign_audit_log FROM anon, public;
GRANT INSERT ON TABLE public.esign_audit_log TO service_role;
DROP POLICY "System can insert audit logs" ON esign_audit_log;
CREATE POLICY "service_role_insert_audit" ON esign_audit_log 
  FOR INSERT TO service_role 
  WITH CHECK (true);
```

#### 3. `esign_signed_documents`
```sql
REVOKE ALL ON TABLE public.esign_signed_documents FROM anon, public;
GRANT INSERT, SELECT ON TABLE public.esign_signed_documents TO authenticated;
DROP POLICY "System can insert signed documents" ON esign_signed_documents;
CREATE POLICY "authenticated_manage_signed_docs" ON esign_signed_documents 
  FOR ALL TO authenticated 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

#### 4. `user_feedback`
```sql
REVOKE ALL ON TABLE public.user_feedback FROM anon, public;
GRANT INSERT ON TABLE public.user_feedback TO authenticated;
DROP POLICY "Anyone can submit feedback" ON user_feedback;
CREATE POLICY "authenticated_submit_feedback" ON user_feedback 
  FOR INSERT TO authenticated 
  WITH CHECK (user_id = auth.uid());
```

#### 5. `user_notifications`
```sql
REVOKE ALL ON TABLE public.user_notifications FROM anon, public;
GRANT INSERT ON TABLE public.user_notifications TO service_role;
GRANT SELECT, UPDATE ON TABLE public.user_notifications TO authenticated;
DROP POLICY "Service role can insert notifications" ON user_notifications;
CREATE POLICY "service_role_insert_notifications" ON user_notifications 
  FOR INSERT TO service_role 
  WITH CHECK (true);
CREATE POLICY "users_read_own_notifications" ON user_notifications 
  FOR SELECT TO authenticated 
  USING (user_id = auth.uid());
```

---

## FILES TO MODIFY

| Category | File/Table | Change |
|----------|------------|--------|
| **Migration** | New SQL migration | Drop plaintext HR columns + harden 5 tables + consolidate chat_history |
| **Edge Functions** | Any using `hr_employees.email` | Update to use encrypted column + decrypt |
| **Frontend** | HR components | Update field references if needed |

---

## VERIFICATION CHECKLIST

After implementation:
1. Run `supabase--linter` → Should show 0-3 warnings (only intentional analytics)
2. Run `security--get_security_scan_results` → No ERROR findings
3. Test HR employee access → Plaintext columns removed or blocked
4. Test anonymous access to 5 hardened tables → Should get `42501 permission denied`
5. Test chat_history insert → Still works for anonymous (widget) and authenticated users

---

## PRIORITY ORDER

| Priority | Task | Est. Time |
|----------|------|-----------|
| 1 (Critical) | HR Employees encryption bypass | 30 min |
| 2 (High) | Harden 5 "Always True" tables | 20 min |
| 3 (Medium) | Consolidate chat_history policies | 15 min |
| 4 (Low) | Update security finding statuses | 5 min |

---

## NON-SECURITY TASKS (From Previous Context)

These were mentioned in previous messages but not yet completed:

| Task | Status | Notes |
|------|--------|-------|
| Amelia/Camelia repair | Backend updated | Need to test "Repair" button now works |
| Developer stats sync | Partial | Reelly detail endpoint now called by repair function |
| Project gallery sync | Pending | When pending_import has more images than project, sync them |

