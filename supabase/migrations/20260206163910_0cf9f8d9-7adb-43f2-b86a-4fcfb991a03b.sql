-- =========================================
-- P0 FIX 2/3: hr_candidates
-- Enable FORCE ROW LEVEL SECURITY
-- =========================================

-- Enable FORCE RLS (service role will now respect RLS policies)
ALTER TABLE public.hr_candidates FORCE ROW LEVEL SECURITY;

-- Add comment documenting the security model
COMMENT ON TABLE public.hr_candidates IS 
'HR candidate applications. Access: Owner, admins, founders via CRM role, and candidates viewing own records. FORCE RLS enabled.';