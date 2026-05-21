-- ============================================================
-- PASS 8: Broker commission split & agreement system
-- ============================================================

CREATE TABLE IF NOT EXISTS public.crm_broker_commission_agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  broker_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  broker_id uuid REFERENCES public.crm_brokers(id) ON DELETE SET NULL,
  deal_ref text,
  title text NOT NULL DEFAULT 'Commission Split Agreement',
  splits jsonb NOT NULL DEFAULT '[]'::jsonb,
  agreement_html text,
  agreement_pdf_path text,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','sent','signed','void')),
  sent_at timestamptz,
  signed_at timestamptz,
  void_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_broker_commission_agreements_broker
  ON public.crm_broker_commission_agreements (broker_user_id, status);
CREATE INDEX IF NOT EXISTS idx_crm_broker_commission_agreements_owner
  ON public.crm_broker_commission_agreements (owner_id, created_at DESC);

ALTER TABLE public.crm_broker_commission_agreements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_full_access_commission_agreements"
  ON public.crm_broker_commission_agreements
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner') OR owner_id = auth.uid())
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner') OR owner_id = auth.uid());

CREATE POLICY "broker_read_own_commission_agreements"
  ON public.crm_broker_commission_agreements
  FOR SELECT TO authenticated
  USING (broker_user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.crm_broker_commission_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id uuid NOT NULL REFERENCES public.crm_broker_commission_agreements(id) ON DELETE CASCADE,
  party text NOT NULL,
  signer_name text NOT NULL,
  signer_email text,
  signer_user_id uuid REFERENCES auth.users(id),
  signed_at timestamptz NOT NULL DEFAULT now(),
  ip text,
  user_agent text,
  signature_hash text NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_crm_broker_commission_signatures_agreement
  ON public.crm_broker_commission_signatures (agreement_id, signed_at DESC);

ALTER TABLE public.crm_broker_commission_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_read_signatures"
  ON public.crm_broker_commission_signatures
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'owner')
    OR EXISTS (SELECT 1 FROM public.crm_broker_commission_agreements a
               WHERE a.id = agreement_id AND a.owner_id = auth.uid())
  );

CREATE POLICY "broker_read_own_signatures"
  ON public.crm_broker_commission_signatures
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.crm_broker_commission_agreements a
            WHERE a.id = agreement_id AND a.broker_user_id = auth.uid())
  );

CREATE TRIGGER trg_crm_commission_agreements_updated_at
  BEFORE UPDATE ON public.crm_broker_commission_agreements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- PASS 9: Broker account lifecycle (top-level status)
-- ============================================================

ALTER TABLE public.crm_brokers
  ADD COLUMN IF NOT EXISTS account_status text NOT NULL DEFAULT 'active'
    CHECK (account_status IN ('active','suspended','deleted')),
  ADD COLUMN IF NOT EXISTS account_status_reason text,
  ADD COLUMN IF NOT EXISTS account_status_changed_at timestamptz,
  ADD COLUMN IF NOT EXISTS account_status_changed_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_crm_brokers_account_status
  ON public.crm_brokers (account_status);
CREATE INDEX IF NOT EXISTS idx_crm_brokers_auth_user
  ON public.crm_brokers (auth_user_id);

-- Cascade: when status flips to suspended/deleted, suspend grants + revoke sessions
CREATE OR REPLACE FUNCTION public.crm_broker_account_status_cascade()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.account_status IN ('suspended','deleted')
     AND COALESCE(OLD.account_status, 'active') = 'active'
     AND NEW.auth_user_id IS NOT NULL
  THEN
    UPDATE public.crm_database_grants
       SET suspended_at = COALESCE(suspended_at, now()),
           suspend_reason = COALESCE(suspend_reason, 'broker account ' || NEW.account_status)
     WHERE broker_user_id = NEW.auth_user_id
       AND suspended_at IS NULL
       AND revoked_at IS NULL;

    UPDATE public.crm_broker_sessions
       SET revoked_at = now(),
           revoke_reason = 'broker account ' || NEW.account_status
     WHERE broker_user_id = NEW.auth_user_id
       AND revoked_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_crm_brokers_account_status_cascade ON public.crm_brokers;
CREATE TRIGGER trg_crm_brokers_account_status_cascade
  AFTER UPDATE OF account_status ON public.crm_brokers
  FOR EACH ROW EXECUTE FUNCTION public.crm_broker_account_status_cascade();