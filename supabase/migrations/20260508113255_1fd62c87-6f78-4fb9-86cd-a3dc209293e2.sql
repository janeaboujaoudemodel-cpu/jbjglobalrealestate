-- Add plan-aware quota gating to email send quota
ALTER TABLE public.email_send_quota_config
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free','pro','business','enterprise'));

-- Updated atomic claim: skips daily + monthly cap when plan is paid
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
  is_paid boolean;
BEGIN
  SELECT * INTO cfg FROM public.email_send_quota_config WHERE id = 1;
  IF cfg IS NULL THEN
    cfg.daily_limit := 100; cfg.monthly_limit := 2900; cfg.rate_per_sec := 2; cfg.plan := 'free';
  END IF;

  is_paid := cfg.plan IN ('pro','business','enterprise');

  INSERT INTO public.email_send_quota (day, sent_count) VALUES (today, 0)
  ON CONFLICT (day) DO NOTHING;

  SELECT sent_count, last_send_at INTO today_count, last_ts
  FROM public.email_send_quota WHERE day = today FOR UPDATE;

  IF NOT is_paid AND today_count >= cfg.daily_limit THEN
    RETURN jsonb_build_object('ok', false, 'code', 'DAILY_LIMIT_REACHED',
      'plan', cfg.plan,
      'daily_limit', cfg.daily_limit, 'sent_today', today_count);
  END IF;

  SELECT COALESCE(SUM(sent_count),0) INTO month_count
  FROM public.email_send_quota WHERE day > today - INTERVAL '30 days';

  IF NOT is_paid AND month_count >= cfg.monthly_limit THEN
    RETURN jsonb_build_object('ok', false, 'code', 'MONTHLY_LIMIT_REACHED',
      'plan', cfg.plan,
      'monthly_limit', cfg.monthly_limit, 'sent_month', month_count);
  END IF;

  UPDATE public.email_send_quota
     SET sent_count = sent_count + 1, last_send_at = now(), updated_at = now()
   WHERE day = today;

  RETURN jsonb_build_object('ok', true,
    'plan', cfg.plan,
    'sent_today', today_count + 1, 'daily_limit', cfg.daily_limit,
    'sent_month', month_count + 1, 'monthly_limit', cfg.monthly_limit,
    'rate_per_sec', cfg.rate_per_sec, 'last_send_at', last_ts,
    'unlimited', is_paid);
END;
$$;