
-- Create brand-assets storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-assets', 'brand-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Drop and recreate RLS policies for brand-assets bucket
DROP POLICY IF EXISTS "Users read own brand assets" ON storage.objects;
DROP POLICY IF EXISTS "Users upload own brand assets" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own brand assets" ON storage.objects;

CREATE POLICY "Users read own brand assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'brand-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users upload own brand assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'brand-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own brand assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'brand-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Ensure design_assets table has RLS enabled
ALTER TABLE IF EXISTS public.design_assets ENABLE ROW LEVEL SECURITY;

-- Add RLS policy on design_assets
DROP POLICY IF EXISTS "Users manage own design assets" ON public.design_assets;
CREATE POLICY "Users manage own design assets"
ON public.design_assets
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
