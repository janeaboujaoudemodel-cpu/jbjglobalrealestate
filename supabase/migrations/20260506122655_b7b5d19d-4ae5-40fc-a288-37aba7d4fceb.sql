ALTER TABLE public.esign_envelopes
  ADD COLUMN IF NOT EXISTS category text DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS template_key text,
  ADD COLUMN IF NOT EXISTS template_html text,
  ADD COLUMN IF NOT EXISTS template_field_values jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS client_lead_id uuid;

DO $$ BEGIN
  ALTER TABLE public.esign_envelopes
    ADD CONSTRAINT esign_envelopes_category_chk
    CHECK (category IN ('leasing','selling','other'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_esign_envelopes_category ON public.esign_envelopes(category);
CREATE INDEX IF NOT EXISTS idx_esign_envelopes_template_key ON public.esign_envelopes(template_key);

CREATE TABLE IF NOT EXISTS public.esign_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL,
  key text NOT NULL,
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('leasing','selling','other')),
  description text,
  html_body text NOT NULL,
  field_schema jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_user_id, key)
);

CREATE INDEX IF NOT EXISTS idx_esign_templates_owner ON public.esign_templates(owner_user_id, category);

ALTER TABLE public.esign_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tpl_select" ON public.esign_templates;
CREATE POLICY "tpl_select" ON public.esign_templates FOR SELECT
  USING (auth.uid() = owner_user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

DROP POLICY IF EXISTS "tpl_insert" ON public.esign_templates;
CREATE POLICY "tpl_insert" ON public.esign_templates FOR INSERT
  WITH CHECK (auth.uid() = owner_user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

DROP POLICY IF EXISTS "tpl_update" ON public.esign_templates;
CREATE POLICY "tpl_update" ON public.esign_templates FOR UPDATE
  USING (auth.uid() = owner_user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

DROP POLICY IF EXISTS "tpl_delete" ON public.esign_templates;
CREATE POLICY "tpl_delete" ON public.esign_templates FOR DELETE
  USING ((auth.uid() = owner_user_id AND is_system = false) OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

DROP TRIGGER IF EXISTS trg_esign_templates_updated_at ON public.esign_templates;
CREATE TRIGGER trg_esign_templates_updated_at
  BEFORE UPDATE ON public.esign_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();