
-- ============================================================
-- SECURE USER DOCUMENT VAULT — Phase 1 (Backend)
-- ============================================================
-- Private bucket: user-vault (folder per user = auth.uid())
-- Owner role can view all; users can only touch their own folder.
-- ============================================================

-- ── 1. ENUMS ────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE public.vault_doc_category AS ENUM (
    'identity',     -- passport, emirates id, visa, national id, driver licence
    'property',     -- title deed, oqood, MOU, SPA, handover certificate
    'contract',     -- agreements, NDA, offer letter, settlement
    'financial',    -- bank statement, mortgage letter, proof of funds
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.vault_vip_tier AS ENUM ('bronze','silver','gold','platinum','diamond');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 2. VAULT DOCUMENTS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.vault_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category        public.vault_doc_category NOT NULL DEFAULT 'other',
  display_name    TEXT NOT NULL,
  doc_type        TEXT,           -- passport / emirates_id / title_deed / spa ...
  storage_path    TEXT NOT NULL,  -- {user_id}/{category}/{uuid}.{ext}
  mime_type       TEXT,
  size_bytes      BIGINT,
  sha256          TEXT,           -- integrity hash, computed client-side or edge fn
  issuing_country TEXT,
  doc_number_last4 TEXT,          -- never store the full doc number
  issue_date      DATE,
  expiry_date     DATE,
  verified        BOOLEAN NOT NULL DEFAULT false,
  verified_at     TIMESTAMPTZ,
  verified_by     UUID REFERENCES auth.users(id),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vault_documents TO authenticated;
GRANT ALL ON public.vault_documents TO service_role;

ALTER TABLE public.vault_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS vault_docs_self_select ON public.vault_documents;
CREATE POLICY vault_docs_self_select ON public.vault_documents
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS vault_docs_self_insert ON public.vault_documents;
CREATE POLICY vault_docs_self_insert ON public.vault_documents
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS vault_docs_self_update ON public.vault_documents;
CREATE POLICY vault_docs_self_update ON public.vault_documents
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'owner'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'owner'));

DROP POLICY IF EXISTS vault_docs_self_delete ON public.vault_documents;
CREATE POLICY vault_docs_self_delete ON public.vault_documents
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'owner'));

CREATE INDEX IF NOT EXISTS vault_documents_user_idx     ON public.vault_documents(user_id);
CREATE INDEX IF NOT EXISTS vault_documents_category_idx ON public.vault_documents(user_id, category);

-- ── 3. VAULT PROPERTIES (drives VIP ranking) ─────────────────
CREATE TABLE IF NOT EXISTS public.vault_properties (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_name         TEXT NOT NULL,
  developer_name       TEXT,
  area                 TEXT,
  emirate              TEXT DEFAULT 'Dubai',
  unit_number          TEXT,
  bedrooms             NUMERIC(3,1),
  size_sqft            NUMERIC(10,2),
  purchase_price_aed   NUMERIC(14,2) NOT NULL CHECK (purchase_price_aed >= 0),
  purchase_date        DATE,
  handover_date        DATE,
  status               TEXT NOT NULL DEFAULT 'owned',  -- owned / sold / for_rent / for_sale
  title_deed_doc_id    UUID REFERENCES public.vault_documents(id) ON DELETE SET NULL,
  verified             BOOLEAN NOT NULL DEFAULT false,
  verified_at          TIMESTAMPTZ,
  verified_by          UUID REFERENCES auth.users(id),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vault_properties TO authenticated;
GRANT ALL ON public.vault_properties TO service_role;

ALTER TABLE public.vault_properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS vault_props_self_select ON public.vault_properties;
CREATE POLICY vault_props_self_select ON public.vault_properties
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS vault_props_self_insert ON public.vault_properties;
CREATE POLICY vault_props_self_insert ON public.vault_properties
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS vault_props_self_update ON public.vault_properties;
CREATE POLICY vault_props_self_update ON public.vault_properties
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'owner'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'owner'));

DROP POLICY IF EXISTS vault_props_self_delete ON public.vault_properties;
CREATE POLICY vault_props_self_delete ON public.vault_properties
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'owner'));

CREATE INDEX IF NOT EXISTS vault_properties_user_idx ON public.vault_properties(user_id);

-- ── 4. ACCESS LOG (every view/download/upload) ──────────────
CREATE TABLE IF NOT EXISTS public.vault_access_log (
  id          BIGSERIAL PRIMARY KEY,
  actor_id    UUID REFERENCES auth.users(id),
  owner_id    UUID NOT NULL,
  document_id UUID REFERENCES public.vault_documents(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,  -- upload / view / download / delete / verify / rank_recalc
  ip          INET,
  user_agent  TEXT,
  signed_url_expires_at TIMESTAMPTZ,
  meta        JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.vault_access_log TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.vault_access_log_id_seq TO authenticated;
GRANT ALL ON public.vault_access_log TO service_role;
GRANT USAGE, SELECT, UPDATE ON SEQUENCE public.vault_access_log_id_seq TO service_role;

ALTER TABLE public.vault_access_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS vault_log_owner_or_self_select ON public.vault_access_log;
CREATE POLICY vault_log_owner_or_self_select ON public.vault_access_log
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS vault_log_insert ON public.vault_access_log;
CREATE POLICY vault_log_insert ON public.vault_access_log
  FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid());

CREATE INDEX IF NOT EXISTS vault_access_log_owner_idx ON public.vault_access_log(owner_id, created_at DESC);

-- ── 5. INVESTOR RANKING (derived, refreshed by trigger) ─────
CREATE TABLE IF NOT EXISTS public.vault_investor_ranking (
  user_id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_invested_aed NUMERIC(16,2) NOT NULL DEFAULT 0,
  property_count     INTEGER NOT NULL DEFAULT 0,
  verified_count     INTEGER NOT NULL DEFAULT 0,
  vip_tier           public.vault_vip_tier NOT NULL DEFAULT 'bronze',
  rank_position      INTEGER,
  last_calculated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.vault_investor_ranking TO authenticated;
GRANT ALL  ON public.vault_investor_ranking TO service_role;

ALTER TABLE public.vault_investor_ranking ENABLE ROW LEVEL SECURITY;

-- Self can read own rank; owner/admin can read all.
DROP POLICY IF EXISTS vault_rank_self_select ON public.vault_investor_ranking;
CREATE POLICY vault_rank_self_select ON public.vault_investor_ranking
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin'));

-- ── 6. RANKING REFRESH FUNCTION ─────────────────────────────
CREATE OR REPLACE FUNCTION public.refresh_vault_ranking()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Re-compute per-user totals
  INSERT INTO public.vault_investor_ranking AS r (
    user_id, total_invested_aed, property_count, verified_count, vip_tier, last_calculated_at
  )
  SELECT
    p.user_id,
    COALESCE(SUM(p.purchase_price_aed), 0)                  AS total_invested_aed,
    COUNT(*)                                                AS property_count,
    COUNT(*) FILTER (WHERE p.verified)                      AS verified_count,
    CASE
      WHEN COALESCE(SUM(p.purchase_price_aed),0) >= 50000000 THEN 'diamond'::public.vault_vip_tier
      WHEN COALESCE(SUM(p.purchase_price_aed),0) >= 20000000 THEN 'platinum'::public.vault_vip_tier
      WHEN COALESCE(SUM(p.purchase_price_aed),0) >=  5000000 THEN 'gold'::public.vault_vip_tier
      WHEN COALESCE(SUM(p.purchase_price_aed),0) >=  1000000 THEN 'silver'::public.vault_vip_tier
      ELSE 'bronze'::public.vault_vip_tier
    END,
    now()
  FROM public.vault_properties p
  WHERE p.status IN ('owned','for_rent','for_sale')
  GROUP BY p.user_id
  ON CONFLICT (user_id) DO UPDATE
    SET total_invested_aed = EXCLUDED.total_invested_aed,
        property_count     = EXCLUDED.property_count,
        verified_count     = EXCLUDED.verified_count,
        vip_tier           = EXCLUDED.vip_tier,
        last_calculated_at = now();

  -- Re-rank everyone (1 = highest invested)
  WITH ranked AS (
    SELECT user_id,
           ROW_NUMBER() OVER (ORDER BY total_invested_aed DESC, property_count DESC, user_id) AS rn
    FROM public.vault_investor_ranking
  )
  UPDATE public.vault_investor_ranking r
     SET rank_position = ranked.rn
    FROM ranked
   WHERE r.user_id = ranked.user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_vault_ranking() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.refresh_vault_ranking() TO authenticated, service_role;

-- ── 7. TRIGGER on vault_properties → refresh ranking ────────
CREATE OR REPLACE FUNCTION public.trg_vault_props_refresh()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.refresh_vault_ranking();
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS vault_props_after_change ON public.vault_properties;
CREATE TRIGGER vault_props_after_change
AFTER INSERT OR UPDATE OR DELETE ON public.vault_properties
FOR EACH STATEMENT EXECUTE FUNCTION public.trg_vault_props_refresh();

-- ── 8. updated_at triggers ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.trg_vault_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS vault_docs_touch ON public.vault_documents;
CREATE TRIGGER vault_docs_touch BEFORE UPDATE ON public.vault_documents
FOR EACH ROW EXECUTE FUNCTION public.trg_vault_touch_updated_at();

DROP TRIGGER IF EXISTS vault_props_touch ON public.vault_properties;
CREATE TRIGGER vault_props_touch BEFORE UPDATE ON public.vault_properties
FOR EACH ROW EXECUTE FUNCTION public.trg_vault_touch_updated_at();

-- ── 9. STORAGE POLICIES on bucket "user-vault" ──────────────
-- Folder convention: {auth.uid()}/{category}/{filename}
DROP POLICY IF EXISTS vault_storage_self_read   ON storage.objects;
DROP POLICY IF EXISTS vault_storage_self_write  ON storage.objects;
DROP POLICY IF EXISTS vault_storage_self_update ON storage.objects;
DROP POLICY IF EXISTS vault_storage_self_delete ON storage.objects;
DROP POLICY IF EXISTS vault_storage_owner_read  ON storage.objects;

CREATE POLICY vault_storage_self_read ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'user-vault'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY vault_storage_owner_read ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'user-vault'
    AND (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin'))
  );

CREATE POLICY vault_storage_self_write ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'user-vault'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY vault_storage_self_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'user-vault'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY vault_storage_self_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'user-vault'
    AND ((storage.foldername(name))[1] = auth.uid()::text
         OR public.has_role(auth.uid(),'owner'))
  );
