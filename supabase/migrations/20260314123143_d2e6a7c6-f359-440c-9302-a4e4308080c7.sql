
-- ============================================================
-- Security Layer 4C: Database Policy Hardening + RLS Review
-- NOTE: Previous partial runs already applied policies for:
--   resale_listings, open_positions, employee_notifications,
--   user_behavior_tracking, listing_uploads, book_downloads,
--   payout_readiness_records, payout_audit_logs, admin_edit_log,
--   web_developer_tasks, web_developer_versions, decision_records,
--   db_health_logs, edge_function_locks, project_ai_cache,
--   reelly_dictionaries, security_checklist_runs, system_backup_records,
--   inbound_email_dead_letters
-- This run covers: chat_conversations fix only
-- ============================================================

-- All prior policy/table changes were applied by the failed-but-partially-executed migrations.
-- Verify and apply remaining chat_conversations fix.

-- Drop the overly broad self-update policy
DROP POLICY IF EXISTS "chat_conversations_self_update" ON public.chat_conversations;

-- Anon can only update conversations they started (matched by ip_hash header)
CREATE POLICY "chat_conversations_anon_self_update"
  ON public.chat_conversations FOR UPDATE
  TO anon
  USING (
    ip_hash IS NOT NULL
    AND ip_hash = (current_setting('request.headers', true)::json->>'x-ip-hash')
  )
  WITH CHECK (
    ip_hash IS NOT NULL
    AND ip_hash = (current_setting('request.headers', true)::json->>'x-ip-hash')
  );

-- Authenticated users update own or admin override
CREATE POLICY "chat_conversations_auth_self_update"
  ON public.chat_conversations FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR has_role(auth.uid(), 'owner')
    OR has_role(auth.uid(), 'admin')
    OR is_crm_admin(auth.uid())
  )
  WITH CHECK (
    user_id = auth.uid()
    OR has_role(auth.uid(), 'owner')
    OR has_role(auth.uid(), 'admin')
    OR is_crm_admin(auth.uid())
  );

ALTER TABLE public.chat_conversations FORCE ROW LEVEL SECURITY;
