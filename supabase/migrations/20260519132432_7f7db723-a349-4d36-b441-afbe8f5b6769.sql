-- Pass 4 (revised): extend vw_crm_broker_overview via LEFT JOINs only.
-- crm_brokers remains the SINGLE canonical broker identity. We do NOT UNION
-- any other source into the broker identity space. Subscription + verification
-- metadata is exposed as nullable columns alongside the canonical broker row.
-- A separate read-only helper view, vw_crm_broker_pre_invite_leads, surfaces
-- broker-shaped leads that have not yet been promoted into crm_brokers. The
-- helper view keeps lead.id under a distinct column name (lead_id) so callers
-- cannot accidentally collide it with crm_brokers.id.

DROP VIEW IF EXISTS public.vw_crm_broker_overview CASCADE;

CREATE VIEW public.vw_crm_broker_overview AS
SELECT
  b.id                                  AS broker_id,
  b.user_id,
  b.owner_id,
  COALESCE(b.full_name, b.email_lower)  AS broker_name,
  b.email_lower                         AS broker_email,
  b.phone_e164                          AS broker_phone,
  b.current_company                     AS broker_company,
  b.invitation_status,
  b.activated_at,
  b.blocked_at,
  b.is_active_broker,
  b.last_active_at,
  -- subscription metadata (LEFT JOIN — never fragments identity)
  bs.tier                               AS subscription_tier,
  bs.status                             AS subscription_status,
  bs.expires_at                         AS subscription_expires_at,
  -- verification metadata (LEFT JOIN — never fragments identity)
  bv.status                             AS verification_status,
  bv.verified_at                        AS verification_verified_at,
  bv.rera_number                        AS verification_rera_number,
  -- existing rollups
  (SELECT count(*)::int
     FROM public.crm_database_grants g
    WHERE g.broker_user_id = b.user_id
      AND g.revoked_at IS NULL)         AS active_database_count,
  (SELECT count(*)::int
     FROM public.crm_leads l
    WHERE l.assigned_broker_id = b.id)  AS assigned_lead_count,
  (SELECT count(*)::int
     FROM public.crm_broker_sessions s
    WHERE s.broker_id = b.id
      AND s.revoked_at IS NULL)         AS active_session_count
FROM public.crm_brokers b
LEFT JOIN LATERAL (
  SELECT s.tier, s.status, s.expires_at
    FROM public.broker_subscriptions s
   WHERE s.user_id = b.user_id
   ORDER BY s.created_at DESC
   LIMIT 1
) bs ON true
LEFT JOIN LATERAL (
  SELECT v.status, v.verified_at, v.rera_number
    FROM public.broker_verifications v
   WHERE v.user_id = b.user_id
   ORDER BY v.created_at DESC
   LIMIT 1
) bv ON true;

-- Read-only helper view: broker-shaped leads not yet promoted to crm_brokers.
-- Pre-invite only. Keeps lead.id under lead_id to prevent collision with
-- crm_brokers.id in any picker, list, or RPC.
CREATE OR REPLACE VIEW public.vw_crm_broker_pre_invite_leads AS
SELECT
  l.id                AS lead_id,
  l.owner_user_id     AS owner_id,
  l.full_name         AS lead_name,
  l.email_lower       AS lead_email,
  l.phone_e164        AS lead_phone,
  l.company_name      AS lead_company,
  l.tags,
  l.source,
  l.lead_source_type,
  l.pipeline_stage,
  l.created_at,
  l.updated_at
FROM public.crm_leads l
WHERE
  (
    'broker' = ANY(COALESCE(l.tags, '{}'::text[]))
    OR COALESCE(l.source, '')           ILIKE '%broker%'
    OR COALESCE(l.lead_source_type, '') ILIKE '%broker%'
    OR COALESCE(l.pipeline_stage, '')   ILIKE '%broker%'
  )
  -- Exclude any lead whose email already exists as a canonical broker.
  AND NOT EXISTS (
    SELECT 1 FROM public.crm_brokers b
     WHERE b.email_lower IS NOT NULL
       AND b.email_lower = l.email_lower
  );

-- Both views inherit RLS from their underlying tables.
GRANT SELECT ON public.vw_crm_broker_overview      TO authenticated;
GRANT SELECT ON public.vw_crm_broker_pre_invite_leads TO authenticated;