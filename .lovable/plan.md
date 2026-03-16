

## Plan: Clear All Security Findings

After thorough investigation, there are **4 real DB fixes needed**, **1 storage fix**, **5 stale findings to delete**, and **2 findings to ignore**. Here's the complete breakdown:

### Delete Stale Findings (5)
These issues were already fixed in code but the scanner findings were never cleaned up:

| Finding ID | Scanner | Reason Already Fixed |
|---|---|---|
| `logo_gen_no_auth` | agent_security | JWT auth exists (lines 16-40) |
| `hardcoded_enc_key` | agent_security | No fallback key, fails if env var missing (lines 105-112) |
| `it_provisioning_xss` | agent_security | `esc()` HTML escaper added (line 88) |
| `sensitive_localstorage` | agent_security | Already migrated to `sessionStorage` |
| `profile_pictures_public` | agent_security | Will be fixed in migration below |

### Ignore Unfixable (1)
| Finding ID | Scanner | Reason |
|---|---|---|
| `SUPA_extension_in_public` | supabase | `pg_net` cannot be moved out of public schema (Postgres limitation) |

### Database Migration (4 real fixes)

1. **Drop broad CRM chat read policy** -- `"Authenticated users can read chat messages"` on `crm_chat_messages` with `USING(true)` was never dropped. The restrictive `crm_chat_participants_read` policy exists but the broad one overrides it (OR logic). Fix: `DROP POLICY`.

2. **Fix hr_certificates public exposure** -- `"Anyone can verify certificates by token"` uses `USING(true)` allowing bulk enumeration. Replace with an RPC function for public token-based verification and restrict direct SELECT to authenticated owners/admins.

3. **Drop old security_checklist_runs public INSERT** -- `"Service role inserts checklist runs"` applies to `{public}` role. A newer service_role-only policy already exists. Fix: `DROP POLICY`.

4. **Make profile-pictures bucket private** -- `UPDATE storage.buckets SET public = false WHERE id = 'profile-pictures'`.

5. **CRM role escalation** -- The trigger exists but the scanner still flags it because the policy grants unrestricted UPDATE. Strengthen by changing the policy to `TO authenticated` (currently `TO public`).

### Finding Management After Migration
- Delete the 4 stale agent_security findings
- Ignore `SUPA_extension_in_public`
- The `supabase_lov` findings will clear on re-scan after migration

### Files to Edit
- **New database migration** (single SQL: items 1-5)
- **No code file changes needed** (all code fixes already applied)

