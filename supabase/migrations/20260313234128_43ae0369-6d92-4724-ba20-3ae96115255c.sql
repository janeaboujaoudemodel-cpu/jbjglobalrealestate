
-- Add soft-delete column to stamp_designs
ALTER TABLE public.stamp_designs ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

-- Create brand_asset_type enum
CREATE TYPE public.brand_asset_type AS ENUM ('stamp', 'logo', 'business_card', 'signature', 'letterhead', 'email_signature');

-- Create brand_assets table
CREATE TABLE public.brand_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_type brand_asset_type NOT NULL,
  name text NOT NULL,
  svg_content text,
  thumbnail_url text,
  metadata jsonb DEFAULT '{}'::jsonb,
  source_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.brand_assets ENABLE ROW LEVEL SECURITY;

-- RLS policies for brand_assets
CREATE POLICY "Users can view own brand assets" ON public.brand_assets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own brand assets" ON public.brand_assets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own brand assets" ON public.brand_assets FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own brand assets" ON public.brand_assets FOR DELETE TO authenticated USING (auth.uid() = user_id);
