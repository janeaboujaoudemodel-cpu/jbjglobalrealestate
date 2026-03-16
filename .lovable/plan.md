

## Plan: Fix All Security Findings (33 Items)

### Summary of Findings

| Category | Count | Risk |
|----------|-------|------|
| HIGH: Public UPDATE policies (anyone can modify data) | 4 | Critical |
| MEDIUM: Public INSERT with `WITH CHECK(true)` | 10 | Moderate |
| LOW: Authenticated/service_role INSERT `WITH CHECK(true)` | 14 | Acceptable (most are intentional) |
| RLS enabled but no policies (table locked out) | 1 | Bug |
| Functions without `search_path` set | 3 | Warn |
| Extension in public schema | 1 | Warn |
| Console error: missing `language` column in `visitor_sessions` | 1 | Bug |

### Changes

**1. Database Migration — Fix HIGH-risk UPDATE policies (4 policies)**

Replace open `USING(true)` UPDATE policies with scoped ownership checks:

- `user_daily_activity`: Replace public UPDATE → `authenticated` role, `USING (user_id = auth.uid())`
- `user_interest_profile`: Replace public UPDATE → `authenticated` role, `USING (user_id = auth.uid())`  
- `user_sessions`: Replace public UPDATE → `anon,authenticated`, `USING (session_id = current_setting('request.headers')::json->>'x-session-id')` — or simpler: scope to `session_id` match via a function. Since sessions are anonymous, we restrict UPDATE to only allow updating `last_activity_at`, `pages_visited`, `total_time_spent`, `scroll_depth_max` columns.
- `visitor_sessions`: Same pattern — restrict anonymous UPDATE to session_id ownership.

**2. Database Migration — Fix MEDIUM-risk public INSERT policies (10 policies)**

Tighten `{public}` role INSERT policies to `{anon, authenticated}` instead of `{public}` (public role bypasses RLS in some configurations). For tables that should only be written by backend (security_checklist_runs, system_backup_records, user_points_ledger), restrict to `{service_role}` only:

- `security_checklist_runs`: Change from `{public}` → `{service_role}`
- `system_backup_records`: Change from `{public}` → `{service_role}`
- `user_points_ledger`: Change from `{public}` → `{service_role}`
- `card_link_clicks`, `cookie_consents`, `project_reports`, `user_activity_log`, `user_daily_activity` (INSERT), `user_events`, `user_interest_profile` (INSERT), `user_sessions` (INSERT): Change from `{public}` → `{anon, authenticated}`

**3. Database Migration — Add RLS policy to `webhook_replay_log`**

Add a service_role-only SELECT+INSERT policy so the table isn't completely locked.

**4. Database Migration — Fix function search_path (3 functions)**

Set `search_path = public` on: `crm_compute_duplicate_hash`, `crm_leads_set_updated_at`, `update_employee_emails_updated_at`.

**5. Database Migration — Move `pg_net` extension out of public schema**

Move to the `extensions` schema: `ALTER EXTENSION pg_net SET SCHEMA extensions;`

**6. Database Migration — Add missing `language` column to `visitor_sessions`**

Add columns referenced by `useVisitorTracking.ts`: `language TEXT`, `screen_resolution TEXT`, `viewport_size TEXT`, `network_type TEXT`.

**7. Code fix — `useVisitorTracking.ts`** (no change needed after column addition — the `as any` cast will work correctly once columns exist)

### Files to edit
- **Database migration** (single SQL migration covering items 1-6)
- No frontend code changes required (the console error resolves once the column exists)

### Migration SQL (preview)

The migration will:
1. DROP and recreate 4 HIGH-risk UPDATE policies with proper ownership scoping
2. DROP and recreate 10 MEDIUM-risk INSERT policies with correct roles
3. Add SELECT+INSERT policies for `webhook_replay_log` (service_role only)
4. ALTER 3 functions to set `search_path = public`
5. Move `pg_net` to `extensions` schema
6. ADD 4 missing columns to `visitor_sessions`

