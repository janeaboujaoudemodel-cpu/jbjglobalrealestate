-- ============================================
-- Phase 3 P1: vapi_call_logs policy hardening
-- ============================================

-- Step 1: Remove public-role policies (security risk)
DROP POLICY IF EXISTS "vapi_call_logs_owner_insert" ON public.vapi_call_logs;
DROP POLICY IF EXISTS "vapi_call_logs_owner_update" ON public.vapi_call_logs;