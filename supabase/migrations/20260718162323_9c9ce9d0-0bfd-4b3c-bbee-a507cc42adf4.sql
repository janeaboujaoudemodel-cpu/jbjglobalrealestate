ALTER TABLE public.developers
  ADD COLUMN IF NOT EXISTS group_status text;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'developers_group_status_chk'
  ) THEN
    ALTER TABLE public.developers
      ADD CONSTRAINT developers_group_status_chk
      CHECK (group_status IS NULL OR group_status IN ('pending_group_status','has_group','no_group','group_not_required'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_developers_registration_group_status
  ON public.developers (registration_status, group_status);

CREATE TABLE IF NOT EXISTS public.crm_brokerage_list_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid NOT NULL REFERENCES public.crm_lead_lists(id) ON DELETE CASCADE,
  brokerage_id uuid NOT NULL REFERENCES public.crm_brokerages(id) ON DELETE CASCADE,
  owner_user_id uuid NOT NULL,
  source_filename text,
  imported_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (list_id, brokerage_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_brokerage_list_members TO authenticated;
GRANT ALL ON public.crm_brokerage_list_members TO service_role;

ALTER TABLE public.crm_brokerage_list_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view brokerage list members"
ON public.crm_brokerage_list_members
FOR SELECT
TO authenticated
USING (
  owner_user_id = auth.uid()
  OR public.has_role(auth.uid(), 'owner'::public.app_role)
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Owners can create brokerage list members"
ON public.crm_brokerage_list_members
FOR INSERT
TO authenticated
WITH CHECK (
  owner_user_id = auth.uid()
  OR public.has_role(auth.uid(), 'owner'::public.app_role)
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Owners can update brokerage list members"
ON public.crm_brokerage_list_members
FOR UPDATE
TO authenticated
USING (
  owner_user_id = auth.uid()
  OR public.has_role(auth.uid(), 'owner'::public.app_role)
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
)
WITH CHECK (
  owner_user_id = auth.uid()
  OR public.has_role(auth.uid(), 'owner'::public.app_role)
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Owners can delete brokerage list members"
ON public.crm_brokerage_list_members
FOR DELETE
TO authenticated
USING (
  owner_user_id = auth.uid()
  OR public.has_role(auth.uid(), 'owner'::public.app_role)
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE INDEX IF NOT EXISTS idx_crm_brokerage_list_members_list
  ON public.crm_brokerage_list_members (list_id, owner_user_id);
CREATE INDEX IF NOT EXISTS idx_crm_brokerage_list_members_brokerage
  ON public.crm_brokerage_list_members (brokerage_id, owner_user_id);