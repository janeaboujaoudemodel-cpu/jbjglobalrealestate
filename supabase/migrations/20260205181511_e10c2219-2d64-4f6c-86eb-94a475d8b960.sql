-- Create video_studio_jobs table for render job tracking
CREATE TABLE public.video_studio_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  project_name TEXT NOT NULL DEFAULT 'Untitled Project',
  project_data JSONB NOT NULL DEFAULT '{}',
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  output_urls JSONB,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '2 hours')
);

-- Create video_studio_assets table for uploaded media
CREATE TABLE public.video_studio_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('video', 'audio', 'image')),
  mime_type TEXT,
  file_size INTEGER,
  duration_ms INTEGER,
  width INTEGER,
  height INTEGER,
  thumbnail_path TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '2 hours')
);

-- Enable RLS
ALTER TABLE public.video_studio_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_studio_assets ENABLE ROW LEVEL SECURITY;

-- RLS policies for video_studio_jobs (session or user-based access)
CREATE POLICY "Users can view their own jobs" 
ON public.video_studio_jobs 
FOR SELECT 
USING (
  user_id = auth.uid() 
  OR session_id = current_setting('request.headers', true)::json->>'x-session-id'
);

CREATE POLICY "Users can create jobs" 
ON public.video_studio_jobs 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own jobs" 
ON public.video_studio_jobs 
FOR UPDATE 
USING (
  user_id = auth.uid() 
  OR session_id = current_setting('request.headers', true)::json->>'x-session-id'
);

CREATE POLICY "Users can delete their own jobs" 
ON public.video_studio_jobs 
FOR DELETE 
USING (
  user_id = auth.uid() 
  OR session_id = current_setting('request.headers', true)::json->>'x-session-id'
);

-- RLS policies for video_studio_assets
CREATE POLICY "Users can view their own assets" 
ON public.video_studio_assets 
FOR SELECT 
USING (
  user_id = auth.uid() 
  OR session_id = current_setting('request.headers', true)::json->>'x-session-id'
);

CREATE POLICY "Users can upload assets" 
ON public.video_studio_assets 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own assets" 
ON public.video_studio_assets 
FOR UPDATE 
USING (
  user_id = auth.uid() 
  OR session_id = current_setting('request.headers', true)::json->>'x-session-id'
);

CREATE POLICY "Users can delete their own assets" 
ON public.video_studio_assets 
FOR DELETE 
USING (
  user_id = auth.uid() 
  OR session_id = current_setting('request.headers', true)::json->>'x-session-id'
);

-- Create indexes for performance
CREATE INDEX idx_video_studio_jobs_session ON public.video_studio_jobs(session_id);
CREATE INDEX idx_video_studio_jobs_user ON public.video_studio_jobs(user_id);
CREATE INDEX idx_video_studio_jobs_status ON public.video_studio_jobs(status);
CREATE INDEX idx_video_studio_jobs_expires ON public.video_studio_jobs(expires_at);
CREATE INDEX idx_video_studio_assets_session ON public.video_studio_assets(session_id);
CREATE INDEX idx_video_studio_assets_user ON public.video_studio_assets(user_id);
CREATE INDEX idx_video_studio_assets_expires ON public.video_studio_assets(expires_at);

-- Create updated_at trigger for jobs
CREATE TRIGGER update_video_studio_jobs_updated_at
BEFORE UPDATE ON public.video_studio_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();