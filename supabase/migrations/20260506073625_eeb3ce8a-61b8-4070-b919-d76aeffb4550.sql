CREATE TABLE public.crm_saved_filters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('brokerage','developer')),
  name TEXT NOT NULL,
  excluded_ids UUID[] NOT NULL DEFAULT '{}',
  excluded_names TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_saved_filters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own saved filters" ON public.crm_saved_filters FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own saved filters" ON public.crm_saved_filters FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own saved filters" ON public.crm_saved_filters FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own saved filters" ON public.crm_saved_filters FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_crm_saved_filters_updated_at
BEFORE UPDATE ON public.crm_saved_filters
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_crm_saved_filters_user_scope ON public.crm_saved_filters(user_id, scope);