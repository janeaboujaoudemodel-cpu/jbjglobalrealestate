-- Email send quota tracking (Resend free plan: 100/day, 3000/month, 2 req/s)
CREATE TABLE IF NOT EXISTS public.email_send_quota (
  day date PRIMARY KEY,
  sent_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  last_send_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.email_send_quota_config (
  id integer PRIMARY KEY DEFAULT 1,
  daily_limit integer NOT NULL DEFAULT 100,
  monthly_limit integer NOT NULL DEFAULT 2900,
  rate_per_sec integer NOT NULL DEFAULT 2,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT email_send_quota_config_singleton CHECK (id = 1)
);

INSERT INTO public.email_send_quota_config (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.email_send_quota ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_send_quota_config ENABLE ROW LEVEL SECURITY;

-- Owner/admin read; service role bypasses RLS for writes
CREATE POLICY "Owner can read email quota"
  ON public.email_send_quota FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Owner can read quota config"
  ON public.email_send_quota_config FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Owner can update quota config"
  ON public.email_send_quota_config FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- Atomic claim function: reserves a send slot if under limits, else returns rejection
CREATE OR REPLACE FUNCTION public.email_quota_try_claim()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cfg record;
  today date := (now() AT TIME ZONE 'UTC')::date;
  today_count integer;
  month_count integer;
  last_ts timestamptz;
BEGIN
  SELECT * INTO cfg FROM public.email_send_quota_config WHERE id = 1;
  IF cfg IS NULL THEN
    cfg.daily_limit := 100; cfg.monthly_limit := 2900; cfg.rate_per_sec := 2;
  END IF;

  INSERT INTO public.email_send_quota (day, sent_count) VALUES (today, 0)
  ON CONFLICT (day) DO NOTHING;

  SELECT sent_count, last_send_at INTO today_count, last_ts
  FROM public.email_send_quota WHERE day = today FOR UPDATE;

  IF today_count >= cfg.daily_limit THEN
    RETURN jsonb_build_object('ok', false, 'code', 'DAILY_LIMIT_REACHED',
      'daily_limit', cfg.daily_limit, 'sent_today', today_count);
  END IF;

  SELECT COALESCE(SUM(sent_count),0) INTO month_count
  FROM public.email_send_quota WHERE day > today - INTERVAL '30 days';

  IF month_count >= cfg.monthly_limit THEN
    RETURN jsonb_build_object('ok', false, 'code', 'MONTHLY_LIMIT_REACHED',
      'monthly_limit', cfg.monthly_limit, 'sent_month', month_count);
  END IF;

  -- Reserve slot now
  UPDATE public.email_send_quota
     SET sent_count = sent_count + 1, last_send_at = now(), updated_at = now()
   WHERE day = today;

  RETURN jsonb_build_object('ok', true,
    'sent_today', today_count + 1, 'daily_limit', cfg.daily_limit,
    'sent_month', month_count + 1, 'monthly_limit', cfg.monthly_limit,
    'rate_per_sec', cfg.rate_per_sec, 'last_send_at', last_ts);
END;
$$;

-- Roll back a claim if Resend send actually failed
CREATE OR REPLACE FUNCTION public.email_quota_record_failure()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE today date := (now() AT TIME ZONE 'UTC')::date;
BEGIN
  UPDATE public.email_send_quota
     SET sent_count  = GREATEST(sent_count - 1, 0),
         failed_count = failed_count + 1,
         updated_at  = now()
   WHERE day = today;
END;
$$;

GRANT EXECUTE ON FUNCTION public.email_quota_try_claim() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.email_quota_record_failure() TO authenticated, service_role;