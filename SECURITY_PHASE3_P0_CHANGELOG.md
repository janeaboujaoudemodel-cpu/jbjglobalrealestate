# Security Phase 3 P0 Changelog

**Date:** 2026-02-06  
**Status:** ✅ LOCKED  

---

## Tables Hardened (3)

| Table | Action | Status |
|-------|--------|--------|
| `broker_messages` | Removed `service_role` bypass policy | ✅ Complete |
| `hr_candidates` | Removed `service_role` bypass policy + `public` SELECT policy | ✅ Complete |
| `toolkit_temp_files` | Enforced `user_id NOT NULL` + strict INSERT policy | ✅ Complete |

---

## Changes Applied

### 1. `broker_messages`
- **Dropped policy:** `broker_messages_service_all` (permissive `service_role` USING(true) bypass)
- **RLS:** `FORCE ROW LEVEL SECURITY` enabled
- **Access:** Restricted to authenticated users via conversation ownership, escalation, or admin roles

### 2. `hr_candidates`
- **Dropped policies:**
  - `hr_candidates_service_role` (permissive `service_role` USING(true) bypass)
  - `hr_candidates_owner_select` (public role SELECT - potential anonymous access)
- **RLS:** `FORCE ROW LEVEL SECURITY` enabled
- **Access:** Restricted to authenticated owner/admin roles only

### 3. `toolkit_temp_files`
- **Schema change:** `user_id` column set to `NOT NULL` (ownership enforced)
- **Dropped policy:** `toolkit_temp_files_insert_authenticated` (allowed NULL user_id)
- **Created policy:** `toolkit_temp_files_insert_strict` (requires `user_id = auth.uid()`)
- **Note:** UPDATE intentionally disallowed for toolkit_temp_files (ephemeral files should create new rows)
- **RLS:** `FORCE ROW LEVEL SECURITY` enabled

---

## Migration Files

| Migration | Purpose |
|-----------|---------|
| `supabase/migrations/20260206171137_*.sql` | broker_messages: Remove service_role bypass |
| `supabase/migrations/20260206171200_*.sql` | hr_candidates: Remove service_role + public SELECT |
| `supabase/migrations/20260206171215_*.sql` | toolkit_temp_files: Strict ownership enforcement |

---

## Phase 3 P0 Test Notes

### Verification Queries (Corrected Syntax)

**A) Confirm NO `service_role` policies on `broker_messages`/`hr_candidates`:**
```sql
select tablename, policyname, roles, cmd
from pg_policies
where schemaname='public'
  and tablename in ('broker_messages','hr_candidates')
  and 'service_role' = any(roles)
order by tablename, cmd, policyname;
```
**Result:** `[] (0 rows)` ✅

**B) Confirm NO `public` SELECT policies on `hr_candidates`:**
```sql
select tablename, policyname, roles, cmd
from pg_policies
where schemaname='public'
  and tablename='hr_candidates'
  and cmd='SELECT'
  and 'public' = any(roles)
order by policyname;
```
**Result:** `[] (0 rows)` ✅

### Index Verification (`toolkit_temp_files`)

```sql
select indexname, indexdef
from pg_indexes
where schemaname='public'
  and tablename='toolkit_temp_files'
order by indexname;
```

**Result:**
| Index | Definition |
|-------|------------|
| `idx_toolkit_temp_files_expires` | btree (expires_at) |
| `toolkit_temp_files_pkey` | btree (id) |

**Conclusion:** No `session_id` index exists ✅

---

## Lock Status

🔒 **LOCKED** - No further modifications to these 3 tables without explicit approval.
