ALTER TABLE public.crm_brokerage_list_members
  ADD COLUMN IF NOT EXISTS merge_to_main boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_crm_brokerage_list_members_merge
  ON public.crm_brokerage_list_members (owner_user_id, merge_to_main);