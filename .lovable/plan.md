
Goal: clear the security table by fixing real issues and removing stale scanner entries that are still being displayed.

What I verified just now:
- Your database already has these fixes live:
  - `crm_chat_messages` broad read policy is removed.
  - `hr_certificates` public policy is removed, and `verify_certificate_by_token()` exists.
  - `profile-pictures` bucket is private.
  - `security_checklist_runs` / `system_backup_records` now use `service_role` insert policies.
- The security panel is still showing older results (`supabase_lov` marked not up-to-date), so stale findings are still visible.
- A fresh security run reveals additional real issues still open (role escalation policy, activity log overexposure, org-members policy bug, and sensitive view exposure warnings).

Implementation plan (immediate):

1) Refresh scanner baseline and sync findings
- Trigger a fresh security scan.
- Pull latest findings with `force=true`.
- Remove stale “already fixed” records from the findings table so old errors stop appearing.

2) Fix remaining real DB security issues via migration
- `crm_users_profile` privilege escalation:
  - Replace `crm_users_profile_update_own` with a guarded policy that allows self-updates only when `crm_role` and `is_active` are unchanged.
  - Implement helper function used in `WITH CHECK` to compare incoming values against current row (prevents self-promotion).
- `user_activity_log` over-broad read:
  - Drop `Authenticated users can view activity logs` (`USING true`).
  - Add scoped SELECT policy: own rows only, with owner/admin exception.
- `organization_members` broken insert policy:
  - Fix self-referential condition from `organization_members_1.organization_id = organization_members_1.organization_id`
  - Correct to compare against the row being inserted (`organization_members.organization_id`).

3) Harden sensitive views flagged by scanner
- Rework these views so they no longer expose raw sensitive fields:
  - `employee_salaries_secure`: remove direct bank account/IBAN outputs (or expose masked only).
  - `rental_listings_public` + `v_rental_listings_safe`: remove raw landlord phone/email fields from public-safe surfaces.
  - `referral_partners_finance_secure`: remove passport number from shared view; keep sensitive values in restricted paths only.
  - `best_idea_submissions_safe`: remove `actual_*` identity columns from the “safe” view.
- Apply `security_invoker`/access hardening where applicable so scanner and runtime model both see restricted access clearly.

4) Re-scan and close findings
- Run security scan again after migration.
- Delete resolved findings from the security findings store.
- Keep only intentional ignored items (with reasons), like platform-level extension warning.

Technical details (what changes where):
- Database migration only (RLS policies, helper function, view definitions).
- No UI feature changes expected.
- If any internal admin query depends on removed sensitive view columns, I’ll update those queries to use masked/new columns in the same pass.

Expected outcome:
- The currently “still showing” stale errors disappear after scanner resync + findings cleanup.
- Remaining true errors/warnings are actually remediated at policy/view level.
- Security table reflects current state instead of outdated discrepancies.
