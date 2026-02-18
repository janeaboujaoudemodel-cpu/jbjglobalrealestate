
-- Stamp Generator: stamp_projects table
CREATE TABLE public.stamp_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  project_name text NOT NULL DEFAULT 'My Stamp Project',
  company_name text NOT NULL,
  trade_name_optional text,
  registration_number_optional text,
  address_optional text,
  phone_optional text,
  email_optional text,
  website_optional text,
  city_optional text,
  country_optional text DEFAULT 'UAE',
  language_mode text NOT NULL DEFAULT 'EN' CHECK (language_mode IN ('EN', 'AR', 'BILINGUAL')),
  stamp_type text NOT NULL DEFAULT 'ROUND' CHECK (stamp_type IN ('ROUND', 'OVAL', 'RECTANGLE', 'SQUARE')),
  style_theme text NOT NULL DEFAULT 'CLASSIC' CHECK (style_theme IN ('CLASSIC', 'MODERN', 'MINIMAL', 'LUXURY', 'BOLD', 'VINTAGE')),
  icon_style text NOT NULL DEFAULT 'NONE' CHECK (icon_style IN ('NONE', 'MONOGRAM', 'SIMPLE_ICON', 'UPLOADED_LOGO')),
  uploaded_logo_url text,
  monogram_text text,
  border_style text NOT NULL DEFAULT 'DOUBLE' CHECK (border_style IN ('SINGLE', 'DOUBLE', 'RING', 'DOTTED', 'ROPE', 'CUSTOM')),
  typography_style text NOT NULL DEFAULT 'SERIF' CHECK (typography_style IN ('SERIF', 'SANS', 'MONOSPACE', 'CALLIGRAPHY')),
  density integer NOT NULL DEFAULT 3 CHECK (density BETWEEN 1 AND 5),
  approval_status text NOT NULL DEFAULT 'DRAFT' CHECK (approval_status IN ('DRAFT', 'FINAL_SELECTED')),
  selected_design_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stamp_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own stamp projects"
  ON public.stamp_projects
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- stamp_designs table
CREATE TABLE public.stamp_designs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.stamp_projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  design_version integer NOT NULL DEFAULT 1,
  ai_prompt text,
  style_snapshot_json jsonb DEFAULT '{}',
  svg_source text,
  svg_url text,
  preview_png_url text,
  template_key text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stamp_designs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own stamp designs"
  ON public.stamp_designs
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- stamp_exports table
CREATE TABLE public.stamp_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  design_id uuid NOT NULL REFERENCES public.stamp_designs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  export_bundle_zip_url text,
  includes jsonb DEFAULT '{"formats":[],"sizes":[],"dpi":[],"buffer":false,"transparent":true}',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'ready', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stamp_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own stamp exports"
  ON public.stamp_exports
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Auto-update updated_at for stamp_projects
CREATE OR REPLACE FUNCTION public.update_stamp_projects_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_stamp_projects_updated_at
  BEFORE UPDATE ON public.stamp_projects
  FOR EACH ROW EXECUTE FUNCTION public.update_stamp_projects_updated_at();

-- Storage buckets for stamp tool
INSERT INTO storage.buckets (id, name, public) VALUES
  ('uploaded-logos', 'uploaded-logos', false),
  ('stamp-previews', 'stamp-previews', false),
  ('stamp-vectors', 'stamp-vectors', false),
  ('stamp-exports', 'stamp-exports', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for storage buckets (owner only via signed URLs)
CREATE POLICY "Authenticated users upload logos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'uploaded-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users access own logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'uploaded-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own logos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'uploaded-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Authenticated users upload stamp previews"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'stamp-previews' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users access own stamp previews"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'stamp-previews' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Authenticated users upload stamp vectors"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'stamp-vectors' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users access own stamp vectors"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'stamp-vectors' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Authenticated users upload stamp exports"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'stamp-exports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users access own stamp exports"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'stamp-exports' AND auth.uid()::text = (storage.foldername(name))[1]);
