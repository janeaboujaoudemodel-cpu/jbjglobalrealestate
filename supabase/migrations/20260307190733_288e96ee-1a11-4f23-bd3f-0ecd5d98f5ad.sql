CREATE TABLE public.admin_edit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  entity_name text,
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  changed_fields text[],
  summary text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.admin_edit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read edit logs" ON public.admin_edit_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert edit logs" ON public.admin_edit_log FOR INSERT TO authenticated WITH CHECK (true);
CREATE INDEX idx_admin_edit_log_entity ON public.admin_edit_log(entity_type, entity_id);
CREATE INDEX idx_admin_edit_log_created ON public.admin_edit_log(created_at DESC);