CREATE TABLE public.woven_import_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  phase text NOT NULL DEFAULT 'discovery',
  stats jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.woven_staged_developers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid REFERENCES public.woven_import_runs(id) ON DELETE SET NULL,
  source_slug text NOT NULL UNIQUE,
  source_url text NOT NULL,
  source_id text,
  name text NOT NULL,
  aliases text[] NOT NULL DEFAULT '{}',
  logo_url text,
  founded_year integer,
  headquarters text,
  description text,
  total_projects integer,
  completed_projects integer,
  ongoing_projects integer,
  units_delivered integer,
  rating numeric,
  awards jsonb NOT NULL DEFAULT '[]'::jsonb,
  gallery jsonb NOT NULL DEFAULT '[]'::jsonb,
  videos jsonb NOT NULL DEFAULT '[]'::jsonb,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  extraction_status text NOT NULL DEFAULT 'ok',
  extraction_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.woven_staged_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid REFERENCES public.woven_import_runs(id) ON DELETE SET NULL,
  source_slug text NOT NULL UNIQUE,
  source_url text NOT NULL,
  source_id text,
  name text NOT NULL,
  developer_name text,
  developer_source_slug text,
  country text,
  city text,
  area text,
  sub_area text,
  address text,
  latitude numeric,
  longitude numeric,
  map_link text,
  status text,
  is_offplan boolean NOT NULL DEFAULT true,
  categories text[] NOT NULL DEFAULT '{}',
  total_units integer,
  storeys integer,
  built_area_sqft numeric,
  plot_size_sqft numeric,
  launch_date date,
  construction_started date,
  completion_date date,
  handover_starts date,
  starting_price numeric,
  currency text,
  payment_plans jsonb NOT NULL DEFAULT '[]'::jsonb,
  amenities jsonb NOT NULL DEFAULT '[]'::jsonb,
  nearby_landmarks jsonb NOT NULL DEFAULT '[]'::jsonb,
  description text,
  investment jsonb NOT NULL DEFAULT '{}'::jsonb,
  media jsonb NOT NULL DEFAULT '{}'::jsonb,
  videos jsonb NOT NULL DEFAULT '[]'::jsonb,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  excluded_reason text,
  extraction_status text NOT NULL DEFAULT 'ok',
  extraction_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.woven_review_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid REFERENCES public.woven_import_runs(id) ON DELETE SET NULL,
  entity_type text NOT NULL CHECK (entity_type IN ('project','developer')),
  staged_project_id uuid REFERENCES public.woven_staged_projects(id) ON DELETE CASCADE,
  staged_developer_id uuid REFERENCES public.woven_staged_developers(id) ON DELETE CASCADE,
  jbj_project_id uuid,
  jbj_developer_id uuid,
  jbj_name text,
  confidence numeric NOT NULL DEFAULT 0,
  match_reasons jsonb NOT NULL DEFAULT '[]'::jsonb,
  differences jsonb NOT NULL DEFAULT '[]'::jsonb,
  decision text NOT NULL DEFAULT 'pending' CHECK (decision IN ('pending','merge','keep_separate','ignore','applied')),
  decided_by uuid,
  decided_at timestamptz,
  applied_at timestamptz,
  apply_result jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.record_field_provenance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('project','developer')),
  entity_id uuid NOT NULL,
  field_name text NOT NULL,
  source text NOT NULL CHECK (source IN ('manual','woven','scraped','system')),
  source_url text,
  value_hash text,
  locked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entity_type, entity_id, field_name)
);

CREATE INDEX idx_woven_staged_projects_dev ON public.woven_staged_projects(developer_source_slug);
CREATE INDEX idx_woven_review_matches_decision ON public.woven_review_matches(decision);
CREATE INDEX idx_record_field_provenance_entity ON public.record_field_provenance(entity_type, entity_id);

GRANT ALL ON public.woven_import_runs TO service_role;
GRANT ALL ON public.woven_staged_developers TO service_role;
GRANT ALL ON public.woven_staged_projects TO service_role;
GRANT ALL ON public.woven_review_matches TO service_role;
GRANT ALL ON public.record_field_provenance TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.woven_import_runs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.woven_staged_developers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.woven_staged_projects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.woven_review_matches TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.record_field_provenance TO authenticated;

ALTER TABLE public.woven_import_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.woven_staged_developers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.woven_staged_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.woven_review_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.record_field_provenance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage woven runs" ON public.woven_import_runs FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'owner'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'owner'));
CREATE POLICY "Owners manage woven staged developers" ON public.woven_staged_developers FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'owner'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'owner'));
CREATE POLICY "Owners manage woven staged projects" ON public.woven_staged_projects FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'owner'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'owner'));
CREATE POLICY "Owners manage woven review matches" ON public.woven_review_matches FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'owner'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'owner'));
CREATE POLICY "Owners manage field provenance" ON public.record_field_provenance FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'owner'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'owner'));

CREATE TRIGGER trg_woven_import_runs_updated BEFORE UPDATE ON public.woven_import_runs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_woven_staged_developers_updated BEFORE UPDATE ON public.woven_staged_developers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_woven_staged_projects_updated BEFORE UPDATE ON public.woven_staged_projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_woven_review_matches_updated BEFORE UPDATE ON public.woven_review_matches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_record_field_provenance_updated BEFORE UPDATE ON public.record_field_provenance FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();