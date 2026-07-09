
-- 1) developer-assets storage: scope edits by developer_id path prefix
DROP POLICY IF EXISTS dev_assets_editor_write ON storage.objects;
DROP POLICY IF EXISTS dev_assets_editor_update ON storage.objects;
DROP POLICY IF EXISTS dev_assets_editor_delete ON storage.objects;

CREATE POLICY dev_assets_editor_write ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'developer-assets'
  AND (
    EXISTS (SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('owner'::app_role, 'admin'::app_role))
    OR EXISTS (SELECT 1 FROM public.developer_representatives r
      WHERE r.user_id = auth.uid()
        AND COALESCE(r.status,'active') IN ('active','approved','authorized')
        AND (storage.foldername(name))[1] IS NOT NULL
        AND (storage.foldername(name))[1] = COALESCE(r.developer_id, r.current_developer_id)::text)
  )
);

CREATE POLICY dev_assets_editor_update ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'developer-assets'
  AND (
    EXISTS (SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('owner'::app_role, 'admin'::app_role))
    OR EXISTS (SELECT 1 FROM public.developer_representatives r
      WHERE r.user_id = auth.uid()
        AND COALESCE(r.status,'active') IN ('active','approved','authorized')
        AND (storage.foldername(name))[1] IS NOT NULL
        AND (storage.foldername(name))[1] = COALESCE(r.developer_id, r.current_developer_id)::text)
  )
);

CREATE POLICY dev_assets_editor_delete ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'developer-assets'
  AND (
    EXISTS (SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('owner'::app_role, 'admin'::app_role))
    OR EXISTS (SELECT 1 FROM public.developer_representatives r
      WHERE r.user_id = auth.uid()
        AND COALESCE(r.status,'active') IN ('active','approved','authorized')
        AND (storage.foldername(name))[1] IS NOT NULL
        AND (storage.foldername(name))[1] = COALESCE(r.developer_id, r.current_developer_id)::text)
  )
);

-- 2) user_role_selections: remove client-header trust
DROP POLICY IF EXISTS "Users can view own role selection" ON public.user_role_selections;
DROP POLICY IF EXISTS "Users can update own role selection" ON public.user_role_selections;

CREATE POLICY "Users can view own role selection" ON public.user_role_selections
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own role selection" ON public.user_role_selections
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3) Harden SECURITY DEFINER helpers
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN auth.uid() IS NULL THEN false
    WHEN auth.uid() <> _user_id
         AND NOT EXISTS (SELECT 1 FROM public.user_roles
           WHERE user_id = auth.uid() AND role IN ('owner'::app_role, 'admin'::app_role))
      THEN false
    ELSE EXISTS (SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role = _role)
  END;
$$;

CREATE OR REPLACE FUNCTION public.is_owner_or_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN auth.uid() IS NULL THEN false
    WHEN auth.uid() <> _user_id
         AND NOT EXISTS (SELECT 1 FROM public.user_roles
           WHERE user_id = auth.uid() AND role IN ('owner'::app_role, 'admin'::app_role))
      THEN false
    ELSE EXISTS (SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role IN ('owner'::app_role, 'admin'::app_role))
  END;
$$;

CREATE OR REPLACE FUNCTION public.broker_can_see_lead(_user_id uuid, _lead_id uuid)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _priv boolean;
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  IF auth.uid() <> _user_id THEN
    SELECT EXISTS (SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('owner'::app_role, 'admin'::app_role)) INTO _priv;
    IF NOT _priv THEN RETURN false; END IF;
  END IF;
  RETURN EXISTS (SELECT 1 FROM public.leads l
    WHERE l.id = _lead_id AND (l.assigned_broker_id = _user_id OR l.created_by = _user_id));
END;
$$;

CREATE OR REPLACE FUNCTION public.is_developer_rep(_user uuid, _dev uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN auth.uid() IS NULL THEN false
    WHEN auth.uid() <> _user
         AND NOT EXISTS (SELECT 1 FROM public.user_roles
           WHERE user_id = auth.uid() AND role IN ('owner'::app_role, 'admin'::app_role))
      THEN false
    ELSE EXISTS (SELECT 1 FROM public.developer_representatives r
      WHERE r.user_id = _user
        AND COALESCE(r.developer_id, r.current_developer_id) = _dev
        AND COALESCE(r.status,'active') IN ('active','approved','authorized'))
  END;
$$;

CREATE OR REPLACE FUNCTION public.is_partner_owner(_partner_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.referral_partners
    WHERE id = _partner_id AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.portal_rep_owns(_uid uuid, _rep_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN auth.uid() IS NULL THEN false
    WHEN auth.uid() <> _uid
         AND NOT EXISTS (SELECT 1 FROM public.user_roles
           WHERE user_id = auth.uid() AND role IN ('owner'::app_role, 'admin'::app_role))
      THEN false
    ELSE EXISTS (SELECT 1 FROM public.developer_representatives r
      WHERE r.id = _rep_id AND r.user_id = _uid)
  END;
$$;

CREATE OR REPLACE FUNCTION public.has_developer_edit_access(_developer_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT auth.uid() IS NOT NULL AND (
    EXISTS (SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('owner'::app_role, 'admin'::app_role))
    OR EXISTS (SELECT 1 FROM public.developer_representatives r
      WHERE r.user_id = auth.uid()
        AND COALESCE(r.developer_id, r.current_developer_id) = _developer_id
        AND COALESCE(r.status,'active') IN ('active','approved','authorized'))
  );
$$;
