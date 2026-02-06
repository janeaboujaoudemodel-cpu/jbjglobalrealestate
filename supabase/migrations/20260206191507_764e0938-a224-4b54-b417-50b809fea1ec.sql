-- Phase 3 P1: Enable FORCE RLS on vapi_call_logs
ALTER TABLE public.vapi_call_logs FORCE ROW LEVEL SECURITY;