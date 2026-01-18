-- Create table for AI tool saved projects (user privacy)
CREATE TABLE IF NOT EXISTS public.ai_tool_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_type TEXT NOT NULL, -- e.g., 'design_studio', 'property_analyzer', 'news_collector'
  project_name TEXT NOT NULL,
  project_data JSONB NOT NULL DEFAULT '{}',
  thumbnail_url TEXT,
  is_shared BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_ai_tool_projects_user_id ON public.ai_tool_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_tool_projects_tool_type ON public.ai_tool_projects(tool_type);
CREATE INDEX IF NOT EXISTS idx_ai_tool_projects_user_tool ON public.ai_tool_projects(user_id, tool_type);

-- Enable Row Level Security
ALTER TABLE public.ai_tool_projects ENABLE ROW LEVEL SECURITY;

-- Users can only view their own projects
CREATE POLICY "Users can view their own AI projects"
ON public.ai_tool_projects
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own projects
CREATE POLICY "Users can create their own AI projects"
ON public.ai_tool_projects
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own projects
CREATE POLICY "Users can update their own AI projects"
ON public.ai_tool_projects
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own projects
CREATE POLICY "Users can delete their own AI projects"
ON public.ai_tool_projects
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_ai_tool_projects_updated_at
BEFORE UPDATE ON public.ai_tool_projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create table for market news (managed by AI News Collector)
CREATE TABLE IF NOT EXISTS public.market_news (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT,
  category TEXT NOT NULL DEFAULT 'Market Update',
  source TEXT NOT NULL,
  source_url TEXT,
  image_url TEXT,
  published_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_verified BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  ai_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_market_news_category ON public.market_news(category);
CREATE INDEX IF NOT EXISTS idx_market_news_published_date ON public.market_news(published_date DESC);
CREATE INDEX IF NOT EXISTS idx_market_news_source ON public.market_news(source);

-- Enable RLS for market_news
ALTER TABLE public.market_news ENABLE ROW LEVEL SECURITY;

-- Everyone can read news
CREATE POLICY "Anyone can read market news"
ON public.market_news
FOR SELECT
USING (true);

-- Only admins (or system) can insert/update/delete news
CREATE POLICY "Admins can manage market news"
ON public.market_news
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.broker_subscriptions
    WHERE user_id = auth.uid() AND user_role IN ('admin', 'owner', 'superadmin')
  )
);

-- Create table for property analyzer results cache
CREATE TABLE IF NOT EXISTS public.property_analysis_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  area_name TEXT NOT NULL,
  analysis_type TEXT NOT NULL DEFAULT 'full', -- 'full', 'quick', 'comparison'
  analysis_data JSONB NOT NULL DEFAULT '{}',
  sources_used TEXT[] DEFAULT '{}',
  confidence_score NUMERIC(3,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '24 hours')
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_property_analysis_area ON public.property_analysis_cache(area_name);
CREATE INDEX IF NOT EXISTS idx_property_analysis_user ON public.property_analysis_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_property_analysis_expires ON public.property_analysis_cache(expires_at);

-- Enable RLS
ALTER TABLE public.property_analysis_cache ENABLE ROW LEVEL SECURITY;

-- Users can read their own analyses or public ones
CREATE POLICY "Users can read property analyses"
ON public.property_analysis_cache
FOR SELECT
USING (user_id = auth.uid() OR user_id IS NULL);

-- Users can create analyses
CREATE POLICY "Users can create property analyses"
ON public.property_analysis_cache
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Trigger for updated_at
CREATE TRIGGER update_market_news_updated_at
BEFORE UPDATE ON public.market_news
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();