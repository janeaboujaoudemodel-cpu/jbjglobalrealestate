# Security Phase 3 P0 Changelog

---

## A) Scope

| Field | Value |
|-------|-------|
| **Phase** | 3 |
| **Level** | P0 |
| **Tables** | `broker_messages`, `hr_candidates`, `toolkit_temp_files` |
| **Note** | Frozen after proof verification. |

---

## B) Changes Applied

- **broker_messages:** Removed `service_role` bypass policy (no `USING(true)` / `WITH CHECK(true)`)
- **hr_candidates:** Removed `service_role` bypass policy + removed `public` SELECT policy
- **toolkit_temp_files:** Strict ownership enforced (`user_id NOT NULL` + insert requires `user_id = auth.uid()`), no UPDATE policy by design

---

## C) Verification (Raw Outputs)

**A) service_role policies on broker_messages/hr_candidates:**
```
[] (0 rows)
```

**B) public SELECT policies on hr_candidates:**
```
[] (0 rows)
```

**C) toolkit_temp_files indexes:**
```
idx_toolkit_temp_files_expires
toolkit_temp_files_pkey
(no session_id index)
```

---

## D) Artifacts

| Migration File | Purpose |
|----------------|---------|
| `supabase/migrations/20260206171137_7b1cb9e6-923c-472f-b7cc-4abdb1257f42.sql` | broker_messages: Remove service_role bypass |
| `supabase/migrations/20260206171200_72762cd0-e605-4c84-8cbd-549783fd33c6.sql` | hr_candidates: Remove service_role + public SELECT |
| `supabase/migrations/20260206171215_2c7e6290-06e0-451b-ac22-cb0aff4fa7df.sql` | toolkit_temp_files: Strict ownership enforcement |
