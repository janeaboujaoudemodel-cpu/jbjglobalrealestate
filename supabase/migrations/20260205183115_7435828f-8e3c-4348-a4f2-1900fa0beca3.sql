-- ============================================================================
-- EXTEND EXISTING STUDIO TABLES FOR CREATIVE SUITE
-- ============================================================================

-- Add new columns to studio_projects if they don't exist
ALTER TABLE public.studio_projects 
ADD COLUMN IF NOT EXISTS linked_property_id UUID,
ADD COLUMN IF NOT EXISTS property_snapshot JSONB,
ADD COLUMN IF NOT EXISTS creativity_level TEXT DEFAULT 'balanced',
ADD COLUMN IF NOT EXISTS brand_strictness TEXT DEFAULT 'branded',
ADD COLUMN IF NOT EXISTS target_audience TEXT DEFAULT 'end_users',
ADD COLUMN IF NOT EXISTS ai_prompts_history JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS share_token TEXT,
ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS share_mode TEXT DEFAULT 'read_only',
ADD COLUMN IF NOT EXISTS last_edited_at TIMESTAMPTZ DEFAULT now();

-- Create unique constraint on share_token if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'studio_projects_share_token_key'
  ) THEN
    ALTER TABLE public.studio_projects ADD CONSTRAINT studio_projects_share_token_key UNIQUE (share_token);
  END IF;
END $$;

-- Add new columns to studio_project_assets
ALTER TABLE public.studio_project_assets 
ADD COLUMN IF NOT EXISTS asset_category TEXT,
ADD COLUMN IF NOT EXISTS export_preset TEXT,
ADD COLUMN IF NOT EXISTS export_platform TEXT,
ADD COLUMN IF NOT EXISTS is_temporary BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Trending Audio Cache table
CREATE TABLE IF NOT EXISTS public.studio_trending_audio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  region TEXT DEFAULT 'global',
  category TEXT,
  audio_title TEXT NOT NULL,
  audio_artist TEXT,
  audio_url TEXT,
  preview_url TEXT,
  trend_score INTEGER DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  metadata JSONB,
  fetched_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '24 hours')
);

-- Scheduled Posts table for social publishing
CREATE TABLE IF NOT EXISTS public.studio_scheduled_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.studio_projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  post_type TEXT NOT NULL,
  content_url TEXT,
  caption TEXT,
  hashtags TEXT[],
  scheduled_for TIMESTAMPTZ NOT NULL,
  timezone TEXT DEFAULT 'Asia/Dubai',
  status TEXT DEFAULT 'scheduled',
  posted_at TIMESTAMPTZ,
  platform_post_id TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_studio_projects_property ON public.studio_projects(linked_property_id);
CREATE INDEX IF NOT EXISTS idx_studio_projects_share ON public.studio_projects(share_token) WHERE share_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_studio_scheduled_time ON public.studio_scheduled_posts(scheduled_for) WHERE status = 'scheduled';

-- Enable RLS on new tables
ALTER TABLE public.studio_trending_audio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_scheduled_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$
BEGIN
  -- Trending audio: public read
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'studio_trending_audio' AND policyname = 'Anyone can view trending audio') THEN
    CREATE POLICY "Anyone can view trending audio" ON public.studio_trending_audio FOR SELECT USING (true);
  END IF;
  
  -- Scheduled posts: user only
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'studio_scheduled_posts' AND policyname = 'Users can manage own scheduled posts') THEN
    CREATE POLICY "Users can manage own scheduled posts" ON public.studio_scheduled_posts FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- Function to generate share token
CREATE OR REPLACE FUNCTION public.generate_share_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(16), 'hex');
END;
$$ LANGUAGE plpgsql;