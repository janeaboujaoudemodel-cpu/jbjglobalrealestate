

## Plan: Fix All 11 Security Findings

After investigation, 4 findings are stale (already fixed) and 1 is unfixable (Postgres limitation). The remaining 7 need real fixes.

### Dismiss Stale/Unfixable Findings (5)

| Finding | Reason |
|---------|--------|
| `logo_gen_no_auth` | Code already has JWT auth (lines 16-40) |
| `SUPA_function_search_path_mutable` | Fixed in previous migration |
| `SUPA_rls_enabled_no_policy` | No tables affected (query returns empty) |
| `rental_listings_public_view_contact_exposure` | View already returns `NULL` for email/phone columns |
| `SUPA_extension_in_public` | `pg_net` cannot be moved out of public schema (Postgres limitation, tried before) |

### Real Fixes (7)

**Database Migration (4 policy fixes + 1 storage fix):**

1. **CRM role escalation** -- `crm_users_profile_update_own` policy lets users change their own `crm_role`. Fix: replace with policy that excludes `crm_role` column using a trigger that prevents non-admin users from changing their own role.

2. **CRM chat messages public read** -- `Authenticated users can read chat messages` has `USING(true)`. Fix: replace with policy scoping SELECT to rows where `sender_id = auth.uid()::text` OR user is in the channel (via channel membership or admin role).

3. **Employee chat broken access control** -- All 3 policies compare against literal string `'current-user'` instead of `auth.uid()`. Fix: drop all 3 and recreate with `auth.uid()::text`.

4. **Profile pictures public bucket** -- `profile-pictures` bucket is `public=true`. Fix: `UPDATE storage.buckets SET public = false WHERE id = 'profile-pictures'`.

**Edge Function Fix (1):**

5. **Hardcoded PII encryption key** -- `submit-contact-gating/index.ts` line 105 has fallback `'jbj-secure-pii-key-2024'`. Fix: remove fallback, throw error if env var missing.

**Frontend Code Fixes (2):**

6. **innerHTML in AdvancedFilterPanel** -- Replace `innerHTML` with safe DOM API (`textContent` + `createElement`).

7. **PII in localStorage** -- In `AIChatWidget.tsx` and `InquiryFormModal.tsx`, switch from `localStorage` to `sessionStorage` for PII data. `ContactGatingModal.tsx` already masks data so it's acceptable.

### Files to Edit
- **Database migration** (single SQL for items 1-4)
- `supabase/functions/submit-contact-gating/index.ts` (item 5)
- `src/components/filters/AdvancedFilterPanel.tsx` (item 6)
- `src/components/AIChatWidget.tsx` (item 7)
- `src/components/InquiryFormModal.tsx` (item 7)
- **Dismiss 5 findings** via security management tool

